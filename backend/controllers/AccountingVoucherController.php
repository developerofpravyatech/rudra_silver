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
            SELECT ve.*, l.ledger_name, l.ledger_code, l.account_ref_id, ag.name AS group_name
            FROM voucher_entries ve
            JOIN ledgers l ON l.id = ve.ledger_id
            LEFT JOIN account_groups ag ON ag.id = l.group_id
            WHERE ve.voucher_id = :id
            ORDER BY ve.id ASC
        ");
        $entries->execute(['id' => $id]);
        $voucher['entries'] = $entries->fetchAll(PDO::FETCH_ASSOC);

        // Adjacent voucher IDs (Previous / Next) for same voucher_type
        $prevStmt = $db->prepare("
            SELECT id FROM vouchers
            WHERE voucher_type = :vtype AND deleted_at IS NULL
              AND (voucher_no < :vno OR (voucher_no = :vno2 AND id < :id))
            ORDER BY voucher_no DESC, id DESC LIMIT 1
        ");
        $prevStmt->execute(['vtype' => $voucher['voucher_type'], 'vno' => $voucher['voucher_no'], 'vno2' => $voucher['voucher_no'], 'id' => $id]);
        $voucher['prev_id'] = $prevStmt->fetchColumn() ?: null;

        $nextStmt = $db->prepare("
            SELECT id FROM vouchers
            WHERE voucher_type = :vtype AND deleted_at IS NULL
              AND (voucher_no > :vno OR (voucher_no = :vno2 AND id > :id))
            ORDER BY voucher_no ASC, id ASC LIMIT 1
        ");
        $nextStmt->execute(['vtype' => $voucher['voucher_type'], 'vno' => $voucher['voucher_no'], 'vno2' => $voucher['voucher_no'], 'id' => $id]);
        $voucher['next_id'] = $nextStmt->fetchColumn() ?: null;

        // Get invoice allocations
        $allocs = $db->prepare("SELECT * FROM voucher_allocations WHERE voucher_id = :id ORDER BY id ASC");
        $allocs->execute(['id' => $id]);
        $voucher['allocations'] = $allocs->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $voucher]);
    }

    public static function getById(int $id = 0): void { self::view($id); }

    public static function branches(): void {
        $db = Database::getConnection();
        $rows = $db->query("SELECT id, code, name, city FROM branches WHERE is_active = 1 ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $rows]);
    }

    public static function adjacent(): void {
        $vtype = strtoupper($_GET['voucher_type'] ?? 'RECEIPT');
        $currentId = (int)($_GET['current_id'] ?? 0);
        $direction = strtolower($_GET['direction'] ?? 'prev');
        $db = Database::getConnection();

        if ($currentId <= 0) {
            // From a new voucher, "prev" returns the latest saved voucher of this type
            $stmt = $db->prepare("
                SELECT id FROM vouchers
                WHERE voucher_type = :vtype AND deleted_at IS NULL
                ORDER BY voucher_no DESC, id DESC LIMIT 1
            ");
            $stmt->execute(['vtype' => $vtype]);
            $id = $stmt->fetchColumn() ?: null;
            echo json_encode(['success' => true, 'id' => $id ? (int)$id : null]);
            return;
        }

        $curStmt = $db->prepare("SELECT voucher_no FROM vouchers WHERE id = :id LIMIT 1");
        $curStmt->execute(['id' => $currentId]);
        $curNo = $curStmt->fetchColumn();
        if ($curNo === false) {
            echo json_encode(['success' => true, 'id' => null]);
            return;
        }

        if ($direction === 'next') {
            $stmt = $db->prepare("
                SELECT id FROM vouchers
                WHERE voucher_type = :vtype AND deleted_at IS NULL
                  AND (voucher_no > :vno OR (voucher_no = :vno2 AND id > :id))
                ORDER BY voucher_no ASC, id ASC LIMIT 1
            ");
        } else {
            $stmt = $db->prepare("
                SELECT id FROM vouchers
                WHERE voucher_type = :vtype AND deleted_at IS NULL
                  AND (voucher_no < :vno OR (voucher_no = :vno2 AND id < :id))
                ORDER BY voucher_no DESC, id DESC LIMIT 1
            ");
        }
        $stmt->execute(['vtype' => $vtype, 'vno' => (int)$curNo, 'vno2' => (int)$curNo, 'id' => $currentId]);
        $id = $stmt->fetchColumn() ?: null;
        echo json_encode(['success' => true, 'id' => $id ? (int)$id : null]);
    }

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
        $hasEntries = !empty($data['entries']) && is_array($data['entries']);
        if (empty($data['account_id']) && !$hasEntries) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Account is required']);
            return;
        }
        $amount = (float)($data['amount'] ?? $data['net_amount'] ?? 0);
        if ($amount <= 0 && $hasEntries) {
            $amount = array_reduce($data['entries'], fn($s, $e) => $s + (float)($e['credit'] ?? $e['credit_amount'] ?? 0), 0.0);
        }
        if ($amount <= 0) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Amount must be greater than zero']);
            return;
        }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $series = strtoupper(trim($data['series'] ?? substr($voucherType, 0, 3))) ?: substr($voucherType, 0, 3);
            $branchId = max(1, (int)($data['branch_id'] ?? 1));
            $isPdc = !empty($data['is_pdc']) ? 1 : 0;

            if ($voucherType === 'RECEIPT') {
                $stmt = $db->prepare("SELECT MAX(voucher_no) FROM vouchers WHERE voucher_type = :vtype AND series = :series");
                $stmt->execute(['vtype' => $voucherType, 'series' => $series]);
            } else {
                $stmt = $db->prepare("SELECT MAX(voucher_no) FROM vouchers WHERE voucher_type = :vtype");
                $stmt->execute(['vtype' => $voucherType]);
            }
            $nextNo = ((int)$stmt->fetchColumn()) + 1;

            $vDate = $data['voucher_date'] ?? date('Y-m-d');
            $paymentMode = strtoupper($data['payment_mode'] ?? 'CASH');

            $accId = (int)($data['account_id'] ?? 0);
            $secAccId = !empty($data['second_account_id']) ? (int)$data['second_account_id'] : null;
            if ($accId <= 0 && $hasEntries) {
                [$accId, $secAccId] = self::resolveAccountsFromEntries($data['entries'], $db);
            }
            if ($accId <= 0) {
                $accId = (int)($db->query("SELECT id FROM accounts ORDER BY id ASC LIMIT 1")->fetchColumn() ?: 1);
            }

            $vStmt = $db->prepare("
                INSERT INTO vouchers (voucher_no, series, branch_id, voucher_type, voucher_date,
                    account_id, second_account_id, net_amount, payment_mode, is_pdc, narration, status, created_at, updated_at)
                VALUES (:vno, :series, :branch_id, :vtype, :vdate, :acc_id, :sec_acc_id, :amount, :pmode, :is_pdc, :narration, 'POSTED', NOW(), NOW())
            ");
            $vStmt->execute([
                'vno'        => $nextNo,
                'series'     => $series,
                'branch_id'  => $branchId,
                'vtype'      => $voucherType,
                'vdate'      => $vDate,
                'acc_id'     => $accId,
                'sec_acc_id' => $secAccId,
                'amount'     => $amount,
                'pmode'      => $paymentMode,
                'is_pdc'     => $isPdc,
                'narration'  => $data['narration'] ?? null,
            ]);
            $voucherId = (int)$db->lastInsertId();

            // Post accounting entries
            if ($hasEntries) {
                $normalized = [];
                foreach ($data['entries'] as $e) {
                    $normalized[] = [
                        'ledger_id'   => (int)$e['ledger_id'],
                        'sub_account' => $e['sub_account'] ?? null,
                        'debit'       => (float)($e['debit'] ?? $e['debit_amount'] ?? 0),
                        'credit'      => (float)($e['credit'] ?? $e['credit_amount'] ?? 0),
                        'narration'   => $e['narration'] ?? ($data['narration'] ?? ''),
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
            if (in_array($voucherType, ['RECEIPT', 'PAYMENT']) && !empty($data['account_id'])) {
                $allocations = is_array($data['allocations'] ?? null) ? $data['allocations'] : [];
                VoucherAllocationService::applyAllocations($voucherId, $voucherType, $accId, $amount, $allocations);
            }

            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Voucher created', 'voucher_id' => $voucherId, 'voucher_no' => $nextNo, 'series' => $series]);
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
            $curStmt = $db->prepare("SELECT voucher_type, series, branch_id, is_pdc, voucher_date, account_id, second_account_id, net_amount FROM vouchers WHERE id = :id");
            $curStmt->execute(['id' => $id]);
            $v = $curStmt->fetch(PDO::FETCH_ASSOC);
            if (!$v) throw new \Exception('Voucher not found');

            $voucherType = $v['voucher_type'];
            $vDate = $data['voucher_date'] ?? $v['voucher_date'];
            $series = strtoupper(trim($data['series'] ?? $v['series'] ?? substr($voucherType, 0, 3))) ?: substr($voucherType, 0, 3);
            $branchId = max(1, (int)($data['branch_id'] ?? $v['branch_id'] ?? 1));
            $isPdc = isset($data['is_pdc']) ? (!empty($data['is_pdc']) ? 1 : 0) : (int)$v['is_pdc'];

            $hasEntries = !empty($data['entries']) && is_array($data['entries']);
            $accId = (int)($data['account_id'] ?? $v['account_id']);
            $secAccId = array_key_exists('second_account_id', $data)
                ? (!empty($data['second_account_id']) ? (int)$data['second_account_id'] : null)
                : ($v['second_account_id'] ? (int)$v['second_account_id'] : null);

            if ($hasEntries && empty($data['account_id'])) {
                [$resolvedAcc, $resolvedSec] = self::resolveAccountsFromEntries($data['entries'], $db);
                if ($resolvedAcc > 0) $accId = $resolvedAcc;
                if ($resolvedSec !== null) $secAccId = $resolvedSec;
            }

            $amount = (float)($data['amount'] ?? $data['net_amount'] ?? $v['net_amount']);
            if ($hasEntries && !isset($data['amount']) && !isset($data['net_amount'])) {
                $amount = array_reduce($data['entries'], fn($s, $e) => $s + (float)($e['credit'] ?? $e['credit_amount'] ?? 0), 0.0);
            }
            $paymentMode = strtoupper($data['payment_mode'] ?? 'CASH');

            $db->prepare("
                UPDATE vouchers SET series=:series, branch_id=:branch_id, is_pdc=:is_pdc,
                    voucher_date=:vdate, account_id=:acc_id, second_account_id=:sec_acc_id,
                    net_amount=:amount, payment_mode=:pmode, narration=:narration, updated_at=NOW()
                WHERE id=:id
            ")->execute([
                'series'     => $series,
                'branch_id'  => $branchId,
                'is_pdc'     => $isPdc,
                'vdate'      => $vDate,
                'acc_id'     => $accId,
                'sec_acc_id' => $secAccId,
                'amount'     => $amount,
                'pmode'      => $paymentMode,
                'narration'  => $data['narration'] ?? null,
                'id'         => $id,
            ]);

            if ($hasEntries) {
                $normalized = [];
                foreach ($data['entries'] as $e) {
                    $normalized[] = [
                        'ledger_id'   => (int)$e['ledger_id'],
                        'sub_account' => $e['sub_account'] ?? null,
                        'debit'       => (float)($e['debit'] ?? $e['debit_amount'] ?? 0),
                        'credit'      => (float)($e['credit'] ?? $e['credit_amount'] ?? 0),
                        'narration'   => $e['narration'] ?? ($data['narration'] ?? ''),
                    ];
                }
                AccountingEngine::post($id, $voucherType, $vDate, $normalized, $data['narration'] ?? '');
            } else {
                $entries = self::buildAutoEntries($voucherType, array_merge($data, ['account_id' => $accId, 'amount' => $amount]), $db);
                if (!empty($entries)) {
                    AccountingEngine::post($id, $voucherType, $vDate, $entries, $data['narration'] ?? '');
                }
            }

            if (in_array($voucherType, ['RECEIPT', 'PAYMENT']) && !empty($data['account_id'])) {
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
        $series = isset($_GET['series']) ? strtoupper(trim($_GET['series'])) : '';
        $db = Database::getConnection();
        if ($vtype === 'RECEIPT' && $series !== '') {
            $stmt = $db->prepare("SELECT MAX(voucher_no) FROM vouchers WHERE voucher_type = :vtype AND series = :series");
            $stmt->execute(['vtype' => $vtype, 'series' => $series]);
        } else {
            $stmt = $db->prepare("SELECT MAX(voucher_no) FROM vouchers WHERE voucher_type = :vtype");
            $stmt->execute(['vtype' => $vtype]);
        }
        $last = (int)$stmt->fetchColumn();
        echo json_encode(['success' => true, 'next_no' => $last + 1]);
    }

    private static function resolveAccountsFromEntries(array $entries, PDO $db): array {
        $crAccId = 0;
        $drAccId = null;
        $anyAccId = 0;
        $stmt = $db->prepare("SELECT account_ref_id FROM ledgers WHERE id = :lid LIMIT 1");
        foreach ($entries as $e) {
            $lid = (int)($e['ledger_id'] ?? 0);
            if ($lid <= 0) continue;
            $stmt->execute(['lid' => $lid]);
            $accRef = (int)($stmt->fetchColumn() ?: 0);
            if ($accRef > 0) {
                if ($anyAccId === 0) $anyAccId = $accRef;
                $cr = (float)($e['credit'] ?? $e['credit_amount'] ?? 0);
                $dr = (float)($e['debit'] ?? $e['debit_amount'] ?? 0);
                if ($cr > 0 && $crAccId === 0) $crAccId = $accRef;
                if ($dr > 0 && $drAccId === null) $drAccId = $accRef;
            }
        }
        return [$crAccId > 0 ? $crAccId : $anyAccId, $drAccId];
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
