<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\Voucher;
use Exception;

class VoucherController {
    public static function listVouchers(): void {
        $limit = max(1, (int)($_GET['limit'] ?? 50));
        $voucherType = strtoupper($_GET['voucher_type'] ?? '');
        $db = \Config\Database::getConnection();
        try {
            $conditions = [];
            $params = [];
            
            if (!empty($voucherType)) {
                $allowedTypes = ['RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL', 'SALE'];
                if (in_array($voucherType, $allowedTypes)) {
                    $conditions[] = 'v.voucher_type = :vtype';
                    $params[':vtype'] = $voucherType;
                }
            }
            
            // Date-wise filtering
            if (!empty($_GET['from_date'])) {
                $conditions[] = 'v.voucher_date >= :from_date';
                $params[':from_date'] = $_GET['from_date'];
            }
            if (!empty($_GET['to_date'])) {
                $conditions[] = 'v.voucher_date <= :to_date';
                $params[':to_date'] = $_GET['to_date'];
            }
            
            // Voucher number search
            if (!empty($_GET['voucher_no'])) {
                $conditions[] = 'v.voucher_no = :voucher_no';
                $params[':voucher_no'] = (int)$_GET['voucher_no'];
            }
            
            $where = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
            
            $countStmt = $db->prepare("SELECT COUNT(*) FROM vouchers v LEFT JOIN accounts a ON a.id = v.account_id $where");
            foreach ($params as $k => $v) $countStmt->bindValue($k, $v);
            $countStmt->execute();
            $total = (int)$countStmt->fetchColumn();
            
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = max(1, min(100, (int)($_GET['limit'] ?? $limit)));
            $offset = ($page - 1) * $limit;
            
            $stmt = $db->prepare("
                SELECT v.id, v.voucher_no, v.voucher_date, v.voucher_type, v.series,
                       v.gross_amount, v.discount_amount, v.net_amount,
                       COALESCE(v.paid_amount, 0) AS paid_amount,
                       COALESCE(v.outstanding_amount, v.net_amount) AS outstanding_amount,
                       COALESCE(v.payment_status, 'UNPAID') AS payment_status,
                       (COALESCE(v.cgst_amount,0) + COALESCE(v.sgst_amount,0) + COALESCE(v.igst_amount,0)) AS gst_amount,
                       a.name AS account_name, a.mobile AS account_mobile,
                       (SELECT COUNT(*) FROM voucher_items vi WHERE vi.voucher_id = v.id) AS items_count,
                       (SELECT COALESCE(SUM(vi.net_weight), 0) FROM voucher_items vi WHERE vi.voucher_id = v.id) AS total_weight,
                       v.created_at 
                FROM vouchers v 
                LEFT JOIN accounts a ON a.id = v.account_id 
                $where
                ORDER BY v.voucher_date DESC, v.created_at DESC 
                LIMIT :limit OFFSET :offset
            ");
            foreach ($params as $k => $v) $stmt->bindValue($k, $v);
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            \Helpers\Response::json(['items' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit]);
        } catch (\Exception $e) {
            \Helpers\Response::error($e->getMessage(), 500);
        }
    }

    public static function getVoucher(int $id): void {
        $voucher = \Models\Voucher::getById($id);
        if (!$voucher) {
            \Helpers\Response::error('Voucher not found', 404);
        }
        \Helpers\Response::json($voucher);
    }

    public static function createVoucher(): void {
        $body = Validator::getJsonBody();

        if (empty($body['voucher_type'])) {
            \Helpers\Response::error('Voucher type is required', 400);
        }

        if (empty($body['account_id'])) {
            \Helpers\Response::error('Account is required', 400);
        }

        try {
            $result = \Models\Voucher::create($body);
            \Helpers\Response::json($result, 201);
        } catch (Exception $e) {
            \Helpers\Response::error($e->getMessage(), 500);
        }
    }
}