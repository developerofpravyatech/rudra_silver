<?php
namespace Controllers;

use Config\Database;
use Services\AccountingEngine;
use PDO;

class AccountingVoucherController {

    /**
     * List all accounting vouchers (RECEIPT, PAYMENT, CONTRA, JOURNAL).
     */
    public function list(): void {
        $db = Database::getConnection();
        $types = ['RECEIPT','PAYMENT','CONTRA','JOURNAL'];
        $where = ["v.voucher_type IN ('RECEIPT','PAYMENT','CONTRA','JOURNAL')"];
        $params = [];

        if (!empty($_GET['voucher_type'])) {
            $where[] = 'v.voucher_type = :vtype';
            $params['vtype'] = $_GET['voucher_type'];
        }
        if (!empty($_GET['from'])) {
            $where[] = 'v.voucher_date >= :from';
            $params['from'] = $_GET['from'];
        }
        if (!empty($_GET['to'])) {
            $where[] = 'v.voucher_date <= :to';
            $params['to'] = $_GET['to'];
        }
        if (!empty($_GET['search'])) {
            $where[] = '(v.narration LIKE :search OR v.voucher_no LIKE :search OR a.name LIKE :search)';
            $params['search'] = '%' . $_GET['search'] . '%';
        }

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $whereStr = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM vouchers v LEFT JOIN accounts a ON a.id = v.account_id WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $db->prepare("
            SELECT v.*, a.name AS account_name, a.mobile AS account_mobile,
                   sa.name AS second_account_name
            FROM vouchers v
            LEFT JOIN accounts a ON a.id = v.account_id
            LEFT JOIN accounts sa ON sa.id = v.second_account_id
            WHERE $whereStr
            ORDER BY v.voucher_date DESC, v.id DESC
            LIMIT :limit OFFSET :offset
        ");
        foreach ($params as $k => $v2) $stmt->bindValue(':' . $k, $v2);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit]);
    }

    public function view(): void {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }

        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT v.*, a.name AS account_name, a.mobile AS account_mobile, sa.name AS second_account_name
            FROM vouchers v
            LEFT JOIN accounts a ON a.id = v.account_id
            LEFT JOIN accounts sa ON sa.id = v.second_account_id
            WHERE v.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $voucher = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$voucher) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Not found']); return; }

        // Get journal entries
        $entries = $db->prepare("
            SELECT ve.*, l.ledger_name, l.ledger_code
            FROM voucher_entries ve
            JOIN ledgers l ON l.id = ve.ledger_id
            WHERE ve.voucher_id = :id
        ");
        $entries->execute(['id' => $id]);
        $voucher['entries'] = $entries->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $voucher]);
    }

    public function getById(): void { $this->view(); }

    public function create(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $voucherType = strtoupper($data['voucher_type'] ?? '');
        $allowedTypes = ['RECEIPT','PAYMENT','CONTRA','JOURNAL'];
        if (!in_array($voucherType, $allowedTypes)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid voucher type']);
            return;
        }

        // Validate basic required fields
        if (empty($data['account_id'])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Account is required']);
            return;
        }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            // Auto-generate voucher_no
            $stmt = $db->prepare("SELECT MAX(voucher_no) FROM vouchers WHERE voucher_type = :vtype");
            $stmt->execute(['vtype' => $voucherType]);
            $lastNo = (int)$stmt->fetchColumn();
            $nextNo = $lastNo + 1;

            $vStmt = $db->prepare("
                INSERT INTO vouchers (voucher_no, series, branch_id, voucher_type, voucher_date,
                    account_id, second_account_id, net_amount, narration, status, created_at, updated_at)
                VALUES (:vno, :series, 1, :vtype, :vdate, :acc_id, :sec_acc_id, :amount, :narration, 'POSTED', NOW(), NOW())
            ");
            $series = substr($voucherType, 0, 3);
            $vStmt->execute([
                'vno'       => $nextNo,
                'series'    => $series,
                'vtype'     => $voucherType,
                'vdate'     => $data['voucher_date'] ?? date('Y-m-d'),
                'acc_id'    => (int)$data['account_id'],
                'sec_acc_id'=> $data['second_account_id'] ?? null,
                'amount'    => (float)($data['amount'] ?? $data['net_amount'] ?? 0),
                'narration' => $data['narration'] ?? null,
            ]);
            $voucherId = (int)$db->lastInsertId();

            // Build journal entries if provided
            if (!empty($data['entries']) && is_array($data['entries'])) {
                AccountingEngine::post($voucherId, $voucherType, $data['voucher_date'] ?? date('Y-m-d'), $data['entries'], $data['narration'] ?? '');
            } else {
                // Auto-build simple entries for RECEIPT/PAYMENT/CONTRA
                $entries = self::buildAutoEntries($voucherType, $data, $db);
                if (!empty($entries)) {
                    AccountingEngine::post($voucherId, $voucherType, $data['voucher_date'] ?? date('Y-m-d'), $entries, $data['narration'] ?? '');
                }
            }

            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Voucher created', 'voucher_id' => $voucherId, 'voucher_no' => $nextNo]);
        } catch (\Exception $e) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function update(): void {
        $id = (int)($_GET['id'] ?? 0);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!$id) $id = (int)($data['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $db->prepare("
                UPDATE vouchers SET voucher_date=:vdate, account_id=:acc_id, second_account_id=:sec_acc_id,
                    net_amount=:amount, narration=:narration, updated_at=NOW()
                WHERE id=:id
            ")->execute([
                'vdate'      => $data['voucher_date'] ?? date('Y-m-d'),
                'acc_id'     => (int)$data['account_id'],
                'sec_acc_id' => $data['second_account_id'] ?? null,
                'amount'     => (float)($data['amount'] ?? $data['net_amount'] ?? 0),
                'narration'  => $data['narration'] ?? null,
                'id'         => $id,
            ]);

            if (!empty($data['entries']) && is_array($data['entries'])) {
                // Get voucher type
                $vtype = $db->prepare("SELECT voucher_type, voucher_date FROM vouchers WHERE id=:id");
                $vtype->execute(['id' => $id]);
                $v = $vtype->fetch(PDO::FETCH_ASSOC);
                AccountingEngine::post($id, $v['voucher_type'], $data['voucher_date'] ?? $v['voucher_date'], $data['entries'], $data['narration'] ?? '');
            }

            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Voucher updated', 'voucher_id' => $id]);
        } catch (\Exception $e) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function delete(): void {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            AccountingEngine::reverse($id);
            $db->prepare("UPDATE vouchers SET status='CANCELLED', deleted_at=NOW() WHERE id=:id")->execute(['id' => $id]);
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Voucher cancelled']);
        } catch (\Exception $e) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function nextVoucherNo(): void {
        $vtype = strtoupper($_GET['voucher_type'] ?? 'RECEIPT');
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT MAX(voucher_no) FROM vouchers WHERE voucher_type = :vtype");
        $stmt->execute(['vtype' => $vtype]);
        $last = (int)$stmt->fetchColumn();
        echo json_encode(['success' => true, 'next_no' => $last + 1]);
    }

    private static function buildAutoEntries(string $voucherType, array $data, $db): array {
        $amount = (float)($data['amount'] ?? $data['net_amount'] ?? 0);
        if ($amount <= 0) return [];

        // Find ledger IDs for account_id and second_account_id
        $accLedger = self::getLedgerIdForAccount((int)$data['account_id'], $db);
        $secLedger = !empty($data['second_account_id']) ? self::getLedgerIdForAccount((int)$data['second_account_id'], $db) : null;

        if (!$accLedger) return []; // Can't auto-build without ledger

        switch ($voucherType) {
            case 'RECEIPT': // Dr Cash/Bank, Cr Customer
                return [
                    ['ledger_id' => $accLedger, 'debit' => $amount, 'credit' => 0, 'narration' => $data['narration'] ?? 'Receipt'],
                    ['ledger_id' => $secLedger ?? $accLedger, 'debit' => 0, 'credit' => $amount, 'narration' => $data['narration'] ?? 'Receipt'],
                ];
            case 'PAYMENT': // Dr Supplier, Cr Cash/Bank
                return [
                    ['ledger_id' => $accLedger, 'debit' => $amount, 'credit' => 0, 'narration' => $data['narration'] ?? 'Payment'],
                    ['ledger_id' => $secLedger ?? $accLedger, 'debit' => 0, 'credit' => $amount, 'narration' => $data['narration'] ?? 'Payment'],
                ];
            default:
                return [];
        }
    }

    private static function getLedgerIdForAccount(int $accountId, $db): ?int {
        $stmt = $db->prepare("SELECT id FROM ledgers WHERE account_ref_id = :id LIMIT 1");
        $stmt->execute(['id' => $accountId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['id'] : null;
    }
}
