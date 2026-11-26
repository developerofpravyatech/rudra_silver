<?php
namespace Controllers;

use Config\Database;
use Services\AccountingEngine;
use Services\PartyLedgerSync;
use PDO;
use Exception;

class ReturnController {

    public static function listSaleReturns(): void {
        self::listByTable('sale_returns');
    }

    public static function listPurchaseReturns(): void {
        self::listByTable('purchase_returns');
    }

    private static function listByTable(string $table): void {
        $db = Database::getConnection();
        $where = ['deleted_at IS NULL'];
        $params = [];
        if (!empty($_GET['search'])) {
            $where[] = '(return_no LIKE :s OR party_name LIKE :s OR item_name LIKE :s OR original_voucher_no LIKE :s)';
            $params['s'] = '%' . trim($_GET['search']) . '%';
        }
        if (!empty($_GET['from'])) {
            $where[] = 'return_date >= :from';
            $params['from'] = $_GET['from'];
        }
        if (!empty($_GET['to'])) {
            $where[] = 'return_date <= :to';
            $params['to'] = $_GET['to'];
        }
        $whereStr = implode(' AND ', $where);
        $stmt = $db->prepare("SELECT * FROM {$table} WHERE {$whereStr} ORDER BY return_date DESC, id DESC LIMIT 200");
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public static function createSaleReturn(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($data['party_name']) || empty($data['item_name'])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Party name and item name are required.']);
            return;
        }
        $totalAmt = (float)($data['total_amount'] ?? $data['return_amount'] ?? 0);
        if ($totalAmt <= 0) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Return amount must be greater than zero.']);
            return;
        }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            // Validate against original sale_register if linked
            $saleRegId = !empty($data['sale_register_id']) ? (int)$data['sale_register_id'] : null;
            if ($saleRegId) {
                $orig = $db->prepare("SELECT pieces, weight, sale_value, amount FROM sale_register WHERE id = :id AND deleted_at IS NULL");
                $orig->execute(['id' => $saleRegId]);
                $origRow = $orig->fetch(PDO::FETCH_ASSOC);
                if ($origRow) {
                    $retQty = (int)($data['return_pieces'] ?? 0);
                    $origQty = (int)$origRow['pieces'];
                    if ($origQty > 0 && $retQty > $origQty) {
                        throw new Exception("Return pieces ($retQty) cannot exceed original sold pieces ($origQty).");
                    }
                }
            }

            $maxNo = (int)$db->query("SELECT COUNT(*) FROM sale_returns")->fetchColumn() + 1;
            $returnNo = !empty($data['return_no']) ? $data['return_no'] : 'SR-' . str_pad((string)$maxNo, 4, '0', STR_PAD_LEFT);
            $returnDate = $data['return_date'] ?? date('Y-m-d');

            $stmt = $db->prepare("
                INSERT INTO sale_returns (return_no, return_date, sale_register_id, original_voucher_no, party_name,
                    item_name, metal_type, return_pieces, return_weight, return_amount, gst_amount, total_amount,
                    refund_mode, narration, status, created_at, updated_at)
                VALUES (:rno, :rdate, :srid, :ovno, :party, :item, :metal, :pcs, :wt, :ramt, :gst, :tamt, :rmode, :narr, 'POSTED', NOW(), NOW())
            ");
            $stmt->execute([
                'rno'   => $returnNo,
                'rdate' => $returnDate,
                'srid'  => $saleRegId,
                'ovno'  => $data['original_voucher_no'] ?? null,
                'party' => trim($data['party_name']),
                'item'  => trim($data['item_name']),
                'metal' => $data['metal_type'] ?? 'Silver',
                'pcs'   => (int)($data['return_pieces'] ?? 0),
                'wt'    => (float)($data['return_weight'] ?? 0),
                'ramt'  => (float)($data['return_amount'] ?? $totalAmt),
                'gst'   => (float)($data['gst_amount'] ?? 0),
                'tamt'  => $totalAmt,
                'rmode' => $data['refund_mode'] ?? 'ADJUSTMENT',
                'narr'  => $data['narration'] ?? null,
            ]);
            $id = (int)$db->lastInsertId();

            // Double-entry: Dr Sales Return Account, Cr Party (or Cash if CASH refund)
            $srLedger = PartyLedgerSync::getSystemLedger('Sales Return Account', 'Sales Accounts', 'INCOME');
            $partyLedger = ($data['refund_mode'] ?? 'ADJUSTMENT') === 'CASH'
                ? PartyLedgerSync::getSystemLedger('Cash in Hand', 'Cash in Hand', 'ASSET')
                : PartyLedgerSync::resolveOrCreatePartyLedger(trim($data['party_name']), 'Sundry Debtors (Customers)');

            $narr = "Sale Return $returnNo - " . trim($data['item_name']);
            AccountingEngine::postReference('SALE_RETURN', $id, $returnDate, [
                ['ledger_id' => $srLedger, 'debit' => $totalAmt, 'credit' => 0, 'narration' => $narr],
                ['ledger_id' => $partyLedger, 'debit' => 0, 'credit' => $totalAmt, 'narration' => $narr],
            ], $narr);

            $db->commit();
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Sales return recorded', 'id' => $id, 'return_no' => $returnNo]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function createPurchaseReturn(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($data['party_name']) || empty($data['item_name'])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Supplier name and item name are required.']);
            return;
        }
        $totalAmt = (float)($data['total_amount'] ?? $data['return_amount'] ?? 0);
        if ($totalAmt <= 0) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Return amount must be greater than zero.']);
            return;
        }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $purRegId = !empty($data['purchase_register_id']) ? (int)$data['purchase_register_id'] : null;
            if ($purRegId) {
                $orig = $db->prepare("SELECT pieces, weight FROM purchase_register WHERE id = :id AND deleted_at IS NULL");
                $orig->execute(['id' => $purRegId]);
                $origRow = $orig->fetch(PDO::FETCH_ASSOC);
                if ($origRow) {
                    $retQty = (int)($data['return_pieces'] ?? 0);
                    $origQty = (int)$origRow['pieces'];
                    if ($origQty > 0 && $retQty > $origQty) {
                        throw new Exception("Return pieces ($retQty) cannot exceed original purchased pieces ($origQty).");
                    }
                }
            }

            $maxNo = (int)$db->query("SELECT COUNT(*) FROM purchase_returns")->fetchColumn() + 1;
            $returnNo = !empty($data['return_no']) ? $data['return_no'] : 'PR-' . str_pad((string)$maxNo, 4, '0', STR_PAD_LEFT);
            $returnDate = $data['return_date'] ?? date('Y-m-d');

            $stmt = $db->prepare("
                INSERT INTO purchase_returns (return_no, return_date, purchase_register_id, original_voucher_no, party_name,
                    item_name, metal_type, return_pieces, return_weight, return_amount, gst_amount, total_amount,
                    refund_mode, narration, status, created_at, updated_at)
                VALUES (:rno, :rdate, :prid, :ovno, :party, :item, :metal, :pcs, :wt, :ramt, :gst, :tamt, :rmode, :narr, 'POSTED', NOW(), NOW())
            ");
            $stmt->execute([
                'rno'   => $returnNo,
                'rdate' => $returnDate,
                'prid'  => $purRegId,
                'ovno'  => $data['original_voucher_no'] ?? null,
                'party' => trim($data['party_name']),
                'item'  => trim($data['item_name']),
                'metal' => $data['metal_type'] ?? 'Silver',
                'pcs'   => (int)($data['return_pieces'] ?? 0),
                'wt'    => (float)($data['return_weight'] ?? 0),
                'ramt'  => (float)($data['return_amount'] ?? $totalAmt),
                'gst'   => (float)($data['gst_amount'] ?? 0),
                'tamt'  => $totalAmt,
                'rmode' => $data['refund_mode'] ?? 'ADJUSTMENT',
                'narr'  => $data['narration'] ?? null,
            ]);
            $id = (int)$db->lastInsertId();

            // Double-entry: Dr Supplier (or Cash if CASH refund), Cr Purchase Return Account
            $prLedger = PartyLedgerSync::getSystemLedger('Purchase Return Account', 'Purchase Accounts', 'EXPENSE');
            $partyLedger = ($data['refund_mode'] ?? 'ADJUSTMENT') === 'CASH'
                ? PartyLedgerSync::getSystemLedger('Cash in Hand', 'Cash in Hand', 'ASSET')
                : PartyLedgerSync::resolveOrCreatePartyLedger(trim($data['party_name']), 'Sundry Creditors (Suppliers)');

            $narr = "Purchase Return $returnNo - " . trim($data['item_name']);
            AccountingEngine::postReference('PURCHASE_RETURN', $id, $returnDate, [
                ['ledger_id' => $partyLedger, 'debit' => $totalAmt, 'credit' => 0, 'narration' => $narr],
                ['ledger_id' => $prLedger, 'debit' => 0, 'credit' => $totalAmt, 'narration' => $narr],
            ], $narr);

            $db->commit();
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Purchase return recorded', 'id' => $id, 'return_no' => $returnNo]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function deleteSaleReturn(int $id = 0): void {
        self::cancelReturn('sale_returns', 'SALE_RETURN', $id);
    }

    public static function deletePurchaseReturn(int $id = 0): void {
        self::cancelReturn('purchase_returns', 'PURCHASE_RETURN', $id);
    }

    private static function cancelReturn(string $table, string $refType, int $id = 0): void {
        if (!$id) $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            AccountingEngine::reverseReference($refType, $id);
            $db->prepare("UPDATE {$table} SET status='CANCELLED', deleted_at=NOW() WHERE id=:id")->execute(['id' => $id]);
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Return cancelled']);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
