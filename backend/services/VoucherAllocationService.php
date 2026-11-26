<?php
namespace Services;

use Config\Database;
use PDO;
use Exception;

/**
 * VoucherAllocationService
 * Manages linking Receipt Vouchers -> Sales Invoices and Payment Vouchers -> Purchase Invoices.
 */
class VoucherAllocationService {

    /**
     * Resolve party name & ledger ID from an account_id or ledger_id.
     */
    public static function resolvePartyNames(int $accountId): array {
        $db = Database::getConnection();
        $names = [];

        $a = $db->prepare("SELECT id, name FROM accounts WHERE id = :id LIMIT 1");
        $a->execute(['id' => $accountId]);
        if ($row = $a->fetch(PDO::FETCH_ASSOC)) {
            $names[] = trim($row['name']);
        }

        $l = $db->prepare("SELECT ledger_name FROM ledgers WHERE account_ref_id = :id LIMIT 1");
        $l->execute(['id' => $accountId]);
        if ($lname = $l->fetchColumn()) {
            $names[] = trim($lname);
        }

        return array_values(array_unique(array_filter($names)));
    }

    /**
     * Get unpaid/partially paid invoices for a party.
     * $voucherType = 'RECEIPT' (sales) | 'PAYMENT' (purchases)
     */
    public static function getOpenInvoicesForParty(string $voucherType, int $accountId): array {
        $db = Database::getConnection();
        $partyNames = self::resolvePartyNames($accountId);
        $invoices = [];

        if ($voucherType === 'RECEIPT') {
            // 1. From sale_register
            if (!empty($partyNames)) {
                $placeholders = implode(',', array_fill(0, count($partyNames), '?'));
                $stmt = $db->prepare("
                    SELECT 'SALE_REGISTER' AS invoice_source, id AS invoice_id, voucher_no, voucher_date,
                           party_name, item_name AS particulars,
                           GREATEST(amount, sale_value) AS total_amount,
                           paid_amount, outstanding_amount, payment_status
                    FROM sale_register
                    WHERE deleted_at IS NULL
                      AND payment_status IN ('UNPAID','PARTIAL')
                      AND outstanding_amount > 0
                      AND party_name IN ($placeholders)
                    ORDER BY voucher_date ASC, id ASC
                ");
                $stmt->execute($partyNames);
                $invoices = array_merge($invoices, $stmt->fetchAll(PDO::FETCH_ASSOC));
            }

            // 2. From vouchers (POS SALE)
            $vStmt = $db->prepare("
                SELECT 'VOUCHER' AS invoice_source, id AS invoice_id,
                       CONCAT(COALESCE(series,'GST'), '/', voucher_no) AS voucher_no,
                       voucher_date, '' AS party_name, COALESCE(narration, 'POS Sale') AS particulars,
                       net_amount AS total_amount, paid_amount, outstanding_amount, payment_status
                FROM vouchers
                WHERE voucher_type = 'SALE'
                  AND deleted_at IS NULL
                  AND status != 'CANCELLED'
                  AND account_id = :aid
                  AND payment_status IN ('UNPAID','PARTIAL')
                  AND outstanding_amount > 0
                ORDER BY voucher_date ASC, id ASC
            ");
            $vStmt->execute(['aid' => $accountId]);
            $invoices = array_merge($invoices, $vStmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($voucherType === 'PAYMENT') {
            // 1. From purchase_register
            if (!empty($partyNames)) {
                $placeholders = implode(',', array_fill(0, count($partyNames), '?'));
                $stmt = $db->prepare("
                    SELECT 'PURCHASE_REGISTER' AS invoice_source, id AS invoice_id, voucher_no, voucher_date,
                           party_name, particular AS particulars,
                           GREATEST(amount, purchase_value) AS total_amount,
                           paid_amount, outstanding_amount, payment_status
                    FROM purchase_register
                    WHERE deleted_at IS NULL
                      AND is_cancelled = 0
                      AND payment_status IN ('UNPAID','PARTIAL')
                      AND outstanding_amount > 0
                      AND party_name IN ($placeholders)
                    ORDER BY voucher_date ASC, id ASC
                ");
                $stmt->execute($partyNames);
                $invoices = array_merge($invoices, $stmt->fetchAll(PDO::FETCH_ASSOC));
            }

            // 2. From vouchers (PURCHASE)
            $vStmt = $db->prepare("
                SELECT 'VOUCHER' AS invoice_source, id AS invoice_id,
                       CONCAT(COALESCE(series,'PUR'), '/', voucher_no) AS voucher_no,
                       voucher_date, '' AS party_name, COALESCE(narration, 'Purchase') AS particulars,
                       net_amount AS total_amount, paid_amount, outstanding_amount, payment_status
                FROM vouchers
                WHERE voucher_type = 'PURCHASE'
                  AND deleted_at IS NULL
                  AND status != 'CANCELLED'
                  AND account_id = :aid
                  AND payment_status IN ('UNPAID','PARTIAL')
                  AND outstanding_amount > 0
                ORDER BY voucher_date ASC, id ASC
            ");
            $vStmt->execute(['aid' => $accountId]);
            $invoices = array_merge($invoices, $vStmt->fetchAll(PDO::FETCH_ASSOC));
        }

        return $invoices;
    }

    /**
     * Validate and apply allocations for a RECEIPT or PAYMENT voucher.
     * Must be called inside an active DB transaction.
     */
    public static function applyAllocations(
        int $voucherId,
        string $voucherType,
        int $accountId,
        float $voucherAmount,
        array $allocations
    ): void {
        $db = Database::getConnection();
        $partyNames = self::resolvePartyNames($accountId);

        // First reverse any previous allocations for this voucher (safe for edit)
        self::reverseAllocations($voucherId);

        $totalAllocated = 0.0;
        $cleanAllocations = [];

        foreach ($allocations as $alloc) {
            $amt = round((float)($alloc['allocated_amount'] ?? 0), 2);
            if ($amt <= 0) continue;

            $source = strtoupper(trim((string)($alloc['invoice_source'] ?? '')));
            $invId  = (int)($alloc['invoice_id'] ?? 0);
            if (!in_array($source, ['SALE_REGISTER', 'PURCHASE_REGISTER', 'VOUCHER']) || $invId <= 0) {
                throw new Exception('Invalid invoice reference in allocation.');
            }

            if ($voucherType === 'RECEIPT' && $source === 'PURCHASE_REGISTER') {
                throw new Exception('Receipt voucher cannot be allocated against a Purchase invoice.');
            }
            if ($voucherType === 'PAYMENT' && $source === 'SALE_REGISTER') {
                throw new Exception('Payment voucher cannot be allocated against a Sales invoice.');
            }

            // Fetch invoice & validate party + outstanding
            $inv = self::fetchInvoiceRow($source, $invId);
            if (!$inv) {
                throw new Exception("Invoice {$source}#{$invId} not found or cancelled.");
            }
            if ($source === 'VOUCHER') {
                if ((int)$inv['account_id'] !== $accountId) {
                    throw new Exception("Invoice #{$inv['voucher_no']} does not belong to the selected party.");
                }
            } else {
                $invParty = trim((string)$inv['party_name']);
                $matched = false;
                foreach ($partyNames as $pn) {
                    if (strcasecmp($pn, $invParty) === 0) { $matched = true; break; }
                }
                if (!$matched && !empty($partyNames)) {
                    throw new Exception("Invoice #{$inv['voucher_no']} ({$invParty}) does not belong to the selected party.");
                }
            }

            $outstanding = round((float)$inv['outstanding_amount'], 2);
            if ($amt > $outstanding + 0.01) {
                throw new Exception("Allocated amount (₹{$amt}) exceeds invoice #{$inv['voucher_no']} outstanding (₹{$outstanding}).");
            }

            $totalAllocated += $amt;
            $cleanAllocations[] = [
                'source' => $source,
                'inv_id' => $invId,
                'amount' => $amt,
            ];
        }

        if ($totalAllocated > $voucherAmount + 0.01) {
            throw new Exception("Total allocated amount (₹{$totalAllocated}) exceeds voucher amount (₹{$voucherAmount}).");
        }

        $ins = $db->prepare("
            INSERT INTO voucher_allocations (voucher_id, invoice_source, invoice_id, allocated_amount, created_at)
            VALUES (:vid, :src, :iid, :amt, NOW())
        ");

        foreach ($cleanAllocations as $ca) {
            $ins->execute([
                'vid' => $voucherId,
                'src' => $ca['source'],
                'iid' => $ca['inv_id'],
                'amt' => $ca['amount'],
            ]);
            self::recalculateInvoice($ca['source'], $ca['inv_id']);
        }

        $unallocated = max(0, round($voucherAmount - $totalAllocated, 2));
        $db->prepare("UPDATE vouchers SET unallocated_amount = :ua WHERE id = :vid")
           ->execute(['ua' => $unallocated, 'vid' => $voucherId]);
    }

    /**
     * Reverse all allocations linked to a voucher and recalculate affected invoices.
     */
    public static function reverseAllocations(int $voucherId): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT DISTINCT invoice_source, invoice_id FROM voucher_allocations WHERE voucher_id = :vid");
        $stmt->execute(['vid' => $voucherId]);
        $affected = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $db->prepare("DELETE FROM voucher_allocations WHERE voucher_id = :vid")->execute(['vid' => $voucherId]);

        foreach ($affected as $row) {
            self::recalculateInvoice($row['invoice_source'], (int)$row['invoice_id']);
        }
    }

    /**
     * Recalculate paid_amount, outstanding_amount, payment_status on an invoice from valid allocations.
     */
    public static function recalculateInvoice(string $source, int $invoiceId): void {
        $db = Database::getConnection();
        $inv = self::fetchInvoiceRow($source, $invoiceId);
        if (!$inv) return;

        $total = round((float)$inv['total_amount'], 2);

        $sumStmt = $db->prepare("
            SELECT COALESCE(SUM(va.allocated_amount), 0)
            FROM voucher_allocations va
            JOIN vouchers v ON v.id = va.voucher_id
            WHERE va.invoice_source = :src
              AND va.invoice_id = :iid
              AND v.status != 'CANCELLED'
              AND v.deleted_at IS NULL
        ");
        $sumStmt->execute(['src' => $source, 'iid' => $invoiceId]);
        $paid = round((float)$sumStmt->fetchColumn(), 2);
        $outstanding = max(0, round($total - $paid, 2));

        $status = 'UNPAID';
        if ($paid >= $total - 0.01 && $total > 0) {
            $status = 'PAID';
            $outstanding = 0.00;
        } elseif ($paid > 0.01) {
            $status = 'PARTIAL';
        }

        $table = self::tableForSource($source);
        $db->prepare("
            UPDATE {$table}
            SET paid_amount = :paid, outstanding_amount = :out, payment_status = :st
            WHERE id = :id
        ")->execute([
            'paid' => $paid,
            'out'  => $outstanding,
            'st'   => $status,
            'id'   => $invoiceId,
        ]);
    }

    /**
     * Check if an invoice has active payment allocations (for safe cancel/delete guard).
     */
    public static function countActiveAllocationsForInvoice(string $source, int $invoiceId): int {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT COUNT(*)
            FROM voucher_allocations va
            JOIN vouchers v ON v.id = va.voucher_id
            WHERE va.invoice_source = :src
              AND va.invoice_id = :iid
              AND v.status != 'CANCELLED'
              AND v.deleted_at IS NULL
        ");
        $stmt->execute(['src' => $source, 'iid' => $invoiceId]);
        return (int)$stmt->fetchColumn();
    }

    /**
     * Get invoice-wise payment history and status report.
     */
    public static function getInvoiceStatusReport(string $type = 'SALE', array $filters = []): array {
        $db = Database::getConnection();
        $where = ['deleted_at IS NULL'];
        $params = [];

        if (!empty($filters['search'])) {
            $where[] = '(voucher_no LIKE :s OR party_name LIKE :s)';
            $params['s'] = '%' . trim($filters['search']) . '%';
        }
        if (!empty($filters['payment_status'])) {
            $where[] = 'payment_status = :ps';
            $params['ps'] = $filters['payment_status'];
        }
        if (!empty($filters['from'])) {
            $where[] = 'voucher_date >= :from';
            $params['from'] = $filters['from'];
        }
        if (!empty($filters['to'])) {
            $where[] = 'voucher_date <= :to';
            $params['to'] = $filters['to'];
        }

        $whereStr = implode(' AND ', $where);
        if ($type === 'PURCHASE') {
            $source = 'PURCHASE_REGISTER';
            $sql = "SELECT 'PURCHASE_REGISTER' AS invoice_source, id AS invoice_id, voucher_no, voucher_date, party_name,
                           particular AS particulars, GREATEST(amount, purchase_value) AS total_amount,
                           paid_amount, outstanding_amount, payment_status
                    FROM purchase_register WHERE {$whereStr} AND is_cancelled = 0 ORDER BY voucher_date DESC, id DESC LIMIT 200";
        } else {
            $source = 'SALE_REGISTER';
            $sql = "SELECT 'SALE_REGISTER' AS invoice_source, id AS invoice_id, voucher_no, voucher_date, party_name,
                           item_name AS particulars, GREATEST(amount, sale_value) AS total_amount,
                           paid_amount, outstanding_amount, payment_status
                    FROM sale_register WHERE {$whereStr} ORDER BY voucher_date DESC, id DESC LIMIT 200";
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attach linked voucher history
        $hStmt = $db->prepare("
            SELECT va.allocated_amount, v.id AS voucher_id, v.voucher_no, v.series, v.voucher_type, v.voucher_date, v.payment_mode
            FROM voucher_allocations va
            JOIN vouchers v ON v.id = va.voucher_id
            WHERE va.invoice_source = :src AND va.invoice_id = :iid AND v.status != 'CANCELLED' AND v.deleted_at IS NULL
            ORDER BY v.voucher_date ASC, v.id ASC
        ");
        foreach ($rows as &$r) {
            $hStmt->execute(['src' => $source, 'iid' => $r['invoice_id']]);
            $r['allocations'] = $hStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return $rows;
    }

    private static function tableForSource(string $source): string {
        return match ($source) {
            'SALE_REGISTER'     => 'sale_register',
            'PURCHASE_REGISTER' => 'purchase_register',
            'VOUCHER'           => 'vouchers',
            default             => throw new Exception("Unsupported invoice source: $source"),
        };
    }

    private static function fetchInvoiceRow(string $source, int $id): ?array {
        $db = Database::getConnection();
        if ($source === 'SALE_REGISTER') {
            $s = $db->prepare("SELECT id, voucher_no, party_name, GREATEST(amount, sale_value) AS total_amount, paid_amount, outstanding_amount, payment_status FROM sale_register WHERE id = :id AND deleted_at IS NULL LIMIT 1");
        } elseif ($source === 'PURCHASE_REGISTER') {
            $s = $db->prepare("SELECT id, voucher_no, party_name, GREATEST(amount, purchase_value) AS total_amount, paid_amount, outstanding_amount, payment_status FROM purchase_register WHERE id = :id AND deleted_at IS NULL AND is_cancelled = 0 LIMIT 1");
        } elseif ($source === 'VOUCHER') {
            $s = $db->prepare("SELECT id, voucher_no, account_id, net_amount AS total_amount, paid_amount, outstanding_amount, payment_status FROM vouchers WHERE id = :id AND deleted_at IS NULL AND status != 'CANCELLED' LIMIT 1");
        } else {
            return null;
        }
        $s->execute(['id' => $id]);
        return $s->fetch(PDO::FETCH_ASSOC) ?: null;
    }
}
