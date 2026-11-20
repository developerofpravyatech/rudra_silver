<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\Voucher;
use Exception;

class VoucherController {
    public static function listVouchers(): void {
        $limit = max(1, (int)($_GET['limit'] ?? 5));
        $db = \Config\Database::getConnection();
        try {
            $stmt = $db->prepare('SELECT v.id, v.voucher_no, v.voucher_date, v.net_amount, a.name AS account_name, v.created_at FROM vouchers v LEFT JOIN accounts a ON a.id = v.account_id WHERE v.voucher_type = :type ORDER BY v.created_at DESC LIMIT :lim');
            $stmt->bindValue(':type', 'SALE');
            $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            \Helpers\Response::json(['items' => $rows]);
        } catch (\Exception $e) {
            \Helpers\Response::error($e->getMessage(), 500);
        }
    }
    public static function getVoucher(int $id): void {
        $voucher = \Models\Voucher::getById($id);
        if (!$voucher) {
            \Helpers\Response::error('Invoice not found', 404);
        }
        \Helpers\Response::json($voucher);
    }

    public static function createVoucher(): void {
        $body = Validator::getJsonBody();

        if (empty($body['account_id'])) {
            Response::error('account_id is required', 400);
        }

        try {
            $result = Voucher::create($body);
            Response::json($result, 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
