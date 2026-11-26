<?php
namespace Controllers;

use Config\Database;
use Services\AccountingEngine;
use Services\PartyLedgerSync;
use Services\VoucherAllocationService;
use PDO;

class AccountingVoucherController {

    /**
     * List all accounting vouchers (RECEIPT, PAYMENT, CONTRA, JOURNAL).
     */
    public static function list(): void {
        $db = Database::getConnection();
        $where = ["v.voucher_type IN ('RECEIPT','PAYMENT','CONTRA','JOURNAL')", "v.deleted_at IS NULL"];
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

    public static function view(int $id = 0): void {
        if (!$id) $id = (int)($_GET['id'] ?? 0);
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

        // Get invoice allocations
        $allocs = $db->prepare("SELECT * FROM voucher_allocations WHERE voucher_id = :id ORDER BY id ASC");
        $allocs->execute(['id' => $id]);
        $voucher['allocations'] = $allocs->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $voucher]);
    }

    public static function getById(int $id = 0): void { self::view($id); }

    public static function openInvoices(): void {
        $vtype = strtoupper($_GET['voucher_type'] ?? 'RECEIPT');
        $accountId = (int)($_GET['account_id'] ?? 0);
        if (!$accountId) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }
        $invoices = VoucherAllocationService::getOpenInvoicesForParty($vtype, $accountId);
        echo json_encode(['success' => true, 'data' => $invoices]);
    }

    public static function create(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $voucherType = strtoupper($data['voucher_type'] ?? '');
        $allowedTypes = ['RECEIPT','PAYMENT','CONTRA','JOURNAL'];
        if (!in_array($voucherType, $allowedTypes)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid voucher type']);
            return;
        }
        if (empty($data['account_id'])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Account is required']);
            return;
        }
        $amount = (float)($data['amount'] ?? $data['net_amount'] ?? 0);
        if ($amount <= 0 && empty($data['entries'])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Amount must be greater than zero']);
            return;
        }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("SELECT MAX(voucher_no) FROM vouchers WHERE voucher_type = :vtype");
            $stmt->execute(['vtype' => $voucherType]);
            $nextNo = ((int)$stmt->fetchColumn()) + 1;

            $vDate = $data['voucher_date'] ?? date('Y-m-d');
            $paymentMode = strtoupper($data['payment_mode'] ?? 'CASH');
            $series = substr($voucherType, 0, 3);

            $vStmt = $db->prepare("
                INSERT INTO vouchers (voucher_no, series, branch_id, voucher_type, voucher_date,
                    account_id, second_account_id, net_amount, payment_mode, narration, status, created_at, updated_at)
                VALUES (:vno, :series, 1, :vtype, :vdate, :acc_id, :sec_acc_id, :amount, :pmode, :narration, 'POSTED', NOW(), NOW())
            ");
            $vStmt->execute([
                'vno'        => $nextNo,
                'series'     => $series,
                'vtype'      => $voucherType,
                'vdate'      => $vDate,
                'acc_id'     => (int)$data['account_id'],
                'sec_acc_id' => !empty($data['second_account_id']) ? (int)$data['second_account_id'] : null,
                'amount'     => $amount,
                'pmode'      => $paymentMode,
                'narration'  => $data['narration'] ?? null,
            ]);
            $voucherId = (int)$db->lastInsertId();

            // Post accounting entries
            if (!empty($data['entries']) && is_array($data['entries'])) {
                $normalized = [];
                foreach ($data['entries'] as $e) {
                    $normalized[] = [
                        'ledger_id' => (int)$e['ledger_id'],
                        'debit'     => (float)($e['debit'] ?? $e['debit_amount'] ?? 0),
                        'credit'    => (float)($e['credit'] ?? $e['credit_amount'] ?? 0),
                        'narration' => $e['narration'] ?? ($data['narration'] ?? ''),
                    ];
                }
                AccountingEngine::post($voucherId, $voucherType, $vDate, $normalized, $data['narration'] ?? '');
            } else {
                $entries = self::buildAutoEntries($voucherType, $data, $db);
                if (empty($entries)) {
                    throw new \Exception("Unable to build balanced accounting entries for {$voucherType}.");
                }
                AccountingEngine::post($voucherId, $voucherType, $vDate, $entries, $data['narration'] ?? '');
            }

            // Apply invoice allocations for RECEIPT / PAYMENT
            if (in_array($voucherType, ['RECEIPT', 'PAYMENT'])) {
                $allocations = is_array($data['allocations'] ?? null) ? $data['allocations'] : [];
                VoucherAllocationService::applyAllocations($voucherId, $voucherType, (int)$data['account_id'], $amount, $allocations);
            }

            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Voucher created', 'voucher_id' => $voucherId, 'voucher_no' => $nextNo]);
        } catch (\Exception $e) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function update(int $id = 0): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!$id) $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $curStmt = $db->prepare("SELECT voucher_type, voucher_date, account_id, net_amount FROM vouchers WHERE id = :id");
            $curStmt->execute(['id' => $id]);
            $v = $curStmt->fetch(PDO::FETCH_ASSOC);
            if (!$v) throw new \Exception('Voucher not found');

            $voucherType = $v['voucher_type'];
            $vDate = $data['voucher_date'] ?? $v['voucher_date'];
            $accId = (int)($data['account_id'] ?? $v['account_id']);
            $amount = (float)($data['amount'] ?? $data['net_amount'] ?? $v['net_amount']);
            $paymentMode = strtoupper($data['payment_mode'] ?? 'CASH');

            $db->prepare("
                UPDATE vouchers SET voucher_date=:vdate, account_id=:acc_id, second_account_id=:sec_acc_id,
                    net_amount=:amount, payment_mode=:pmode, narration=:narration, updated_at=NOW()
                WHERE id=:id
            ")->execute([
                'vdate'      => $vDate,
                'acc_id'     => $accId,
                'sec_acc_id' => !empty($data['second_account_id']) ? (int)$data['second_account_id'] : null,
                'amount'     => $amount,
                'pmode'      => $paymentMode,
                'narration'  => $data['narration'] ?? null,
                'id'         => $id,
            ]);

            if (!empty($data['entries']) && is_array($data['entries'])) {
                $normalized = [];
                foreach ($data['entries'] as $e) {
                    $normalized[] = [
                        'ledger_id' => (int)$e['ledger_id'],
                        'debit'     => (float)($e['debit'] ?? $e['debit_amount'] ?? 0),
                        'credit'    => (float)($e['credit'] ?? $e['credit_amount'] ?? 0),
                        'narration' => $e['narration'] ?? ($data['narration'] ?? ''),
                    ];
                }
                AccountingEngine::post($id, $voucherType, $vDate, $normalized, $data['narration'] ?? '');
            } else {
                $entries = self::buildAutoEntries($voucherType, array_merge($data, ['account_id' => $accId, 'amount' => $amount]), $db);
                if (!empty($entries)) {
                    AccountingEngine::post($id, $voucherType, $vDate, $entries, $data['narration'] ?? '');
                }
            }

            if (in_array($voucherType, ['RECEIPT', 'PAYMENT'])) {
                $allocations = is_array($data['allocations'] ?? null) ? $data['allocations'] : [];
                VoucherAllocationService::applyAllocations($id, $voucherType, $accId, $amount, $allocations);
            }

            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Voucher updated', 'voucher_id' => $id]);
        } catch (\Exception $e) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function delete(int $id = 0): void {
        if (!$id) $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            AccountingEngine::reverse($id);
            VoucherAllocationService::reverseAllocations($id);
            $db->prepare("UPDATE vouchers SET status='CANCELLED', deleted_at=NOW(), unallocated_amount=0 WHERE id=:id")->execute(['id' => $id]);
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Voucher cancelled and allocations reversed']);
        } catch (\Exception $e) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function nextVoucherNo(): void {
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

        $partyLedger = PartyLedgerSync::syncAccount((int)$data['account_id']);
        if (!$partyLedger) return [];

        $cashOrBankLedger = null;
        if (!empty($data['second_account_id'])) {
            $cashOrBankLedger = PartyLedgerSync::syncAccount((int)$data['second_account_id']);
        }
        if (!$cashOrBankLedger) {
            $pmode = strtoupper($data['payment_mode'] ?? 'CASH');
            if (in_array($pmode, ['BANK', 'UPI', 'CHEQUE', 'BANK_TRANSFER'])) {
                $cashOrBankLedger = PartyLedgerSync::getSystemLedger('Bank Account', 'Bank Accounts', 'ASSET');
            } else {
                $cashOrBankLedger = PartyLedgerSync::getSystemLedger('Cash in Hand', 'Cash in Hand', 'ASSET');
            }
        }

        $narr = $data['narration'] ?? $voucherType;
        return match ($voucherType) {
            'RECEIPT' => [
                ['ledger_id' => $cashOrBankLedger, 'debit' => $amount, 'credit' => 0, 'narration' => $narr],
                ['ledger_id' => $partyLedger,      'debit' => 0, 'credit' => $amount, 'narration' => $narr],
            ],
            'PAYMENT' => [
                ['ledger_id' => $partyLedger,      'debit' => $amount, 'credit' => 0, 'narration' => $narr],
                ['ledger_id' => $cashOrBankLedger, 'debit' => 0, 'credit' => $amount, 'narration' => $narr],
            ],
            'CONTRA' => [
                ['ledger_id' => $cashOrBankLedger, 'debit' => $amount, 'credit' => 0, 'narration' => $narr],
                ['ledger_id' => $partyLedger,      'debit' => 0, 'credit' => $amount, 'narration' => $narr],
            ],
            default => [],
        };
    }
}
