<?php
namespace Services;

use Config\Database;
use PDO;
use Exception;

/**
 * AccountingEngine – centralised double-entry posting service.
 * Every voucher that creates financial entries must call post() here.
 * All entries are wrapped in a DB transaction.
 */
class AccountingEngine {

    /**
     * Post journal entries for a voucher.
     * $entries = [ ['ledger_id' => X, 'debit' => 0, 'credit' => Y, 'narration' => '...'], ... ]
     * Total debits MUST equal total credits.
     */
    public static function post(int $voucherId, string $voucherType, string $postingDate, array $entries, string $narration = ''): void {
        self::validateEntries($entries);
        $db = Database::getConnection();

        // Delete any existing postings for this voucher (for edit/update scenario)
        $db->prepare("DELETE FROM ledger_postings WHERE voucher_id = :vid")->execute(['vid' => $voucherId]);
        $db->prepare("DELETE FROM voucher_entries WHERE voucher_id = :vid")->execute(['vid' => $voucherId]);

        $postStmt = $db->prepare("
            INSERT INTO ledger_postings (ledger_id, voucher_id, reference_type, debit, credit,
                running_balance, balance_type, posting_date, narration, is_opening, created_at)
            VALUES (:lid, :vid, :rtype, :dr, :cr, 0, 'DR', :pdate, :narr, 0, NOW())
        ");
        $entStmt = $db->prepare("
            INSERT INTO voucher_entries (voucher_id, ledger_id, debit_amount, credit_amount, narration, created_at)
            VALUES (:vid, :lid, :dr, :cr, :narr, NOW())
        ");

        foreach ($entries as $entry) {
            $postStmt->execute([
                'lid'   => (int)$entry['ledger_id'],
                'vid'   => $voucherId,
                'rtype' => $voucherType,
                'dr'    => (float)($entry['debit'] ?? 0),
                'cr'    => (float)($entry['credit'] ?? 0),
                'pdate' => $postingDate,
                'narr'  => $entry['narration'] ?? $narration,
            ]);
            $entStmt->execute([
                'vid'  => $voucherId,
                'lid'  => (int)$entry['ledger_id'],
                'dr'   => (float)($entry['debit'] ?? 0),
                'cr'   => (float)($entry['credit'] ?? 0),
                'narr' => $entry['narration'] ?? $narration,
            ]);
        }
    }

    /**
     * Reverse all ledger postings for a voucher (for cancellation/deletion).
     */
    public static function reverse(int $voucherId): void {
        $db = Database::getConnection();
        $db->prepare("DELETE FROM ledger_postings WHERE voucher_id = :vid")->execute(['vid' => $voucherId]);
        $db->prepare("DELETE FROM voucher_entries WHERE voucher_id = :vid")->execute(['vid' => $voucherId]);
    }

    /**
     * Post balanced double-entry records for non-voucher transactions (SaleRegister, PurchaseRegister, Returns).
     */
    public static function postReference(string $refType, int $refId, string $postingDate, array $entries, string $narration = ''): void {
        $normalized = [];
        foreach ($entries as $e) {
            $normalized[] = [
                'ledger_id' => (int)$e['ledger_id'],
                'debit'     => (float)($e['debit'] ?? $e['debit_amount'] ?? 0),
                'credit'    => (float)($e['credit'] ?? $e['credit_amount'] ?? 0),
                'narration' => $e['narration'] ?? $narration,
            ];
        }
        self::validateEntries($normalized);
        $db = Database::getConnection();

        $db->prepare("DELETE FROM ledger_postings WHERE reference_type = :rt AND reference_id = :rid")
           ->execute(['rt' => $refType, 'rid' => $refId]);

        $stmt = $db->prepare("
            INSERT INTO ledger_postings (ledger_id, voucher_id, reference_type, reference_id, debit, credit,
                running_balance, balance_type, posting_date, narration, is_opening, created_at)
            VALUES (:lid, NULL, :rt, :rid, :dr, :cr, 0, 'DR', :pdate, :narr, 0, NOW())
        ");

        foreach ($normalized as $entry) {
            if ($entry['debit'] == 0 && $entry['credit'] == 0) continue;
            $stmt->execute([
                'lid'   => $entry['ledger_id'],
                'rt'    => $refType,
                'rid'   => $refId,
                'dr'    => $entry['debit'],
                'cr'    => $entry['credit'],
                'pdate' => $postingDate,
                'narr'  => $entry['narration'],
            ]);
        }
    }

    /**
     * Reverse postings by reference_type + reference_id.
     */
    public static function reverseReference(string $refType, int $refId): void {
        $db = Database::getConnection();
        $db->prepare("DELETE FROM ledger_postings WHERE reference_type = :rt AND reference_id = :rid")
           ->execute(['rt' => $refType, 'rid' => $refId]);
    }

    /**
     * Get current balance for a ledger as of a date.
     * Returns ['balance' => float, 'type' => 'DR'|'CR']
     */
    public static function getBalance(int $ledgerId, ?string $asOnDate = null): array {
        $db = Database::getConnection();
        $where = 'ledger_id = :id';
        $params = ['id' => $ledgerId];
        if ($asOnDate) { $where .= ' AND posting_date <= :date'; $params['date'] = $asOnDate; }

        $row = $db->prepare("SELECT COALESCE(SUM(debit),0) AS dr, COALESCE(SUM(credit),0) AS cr FROM ledger_postings WHERE $where");
        $row->execute($params);
        $data = $row->fetch(PDO::FETCH_ASSOC);
        $net = (float)$data['dr'] - (float)$data['cr'];
        return ['balance' => abs($net), 'type' => $net >= 0 ? 'DR' : 'CR', 'debit' => (float)$data['dr'], 'credit' => (float)$data['cr']];
    }

    /**
     * Trial Balance as of a date.
     */
    public static function trialBalance(?string $asOnDate = null): array {
        $db = Database::getConnection();
        $where = $asOnDate ? 'AND lp.posting_date <= :date' : '';
        $params = $asOnDate ? ['date' => $asOnDate] : [];

        $stmt = $db->prepare("
            SELECT l.id AS ledger_id, l.ledger_name, l.ledger_code, ag.name AS group_name, ag.nature,
                   COALESCE(SUM(lp.debit),0) AS total_dr, COALESCE(SUM(lp.credit),0) AS total_cr
            FROM ledgers l
            LEFT JOIN account_groups ag ON ag.id = l.group_id
            LEFT JOIN ledger_postings lp ON lp.ledger_id = l.id $where
            WHERE l.status = 'ACTIVE'
            GROUP BY l.id, l.ledger_name, l.ledger_code, ag.name, ag.nature
            HAVING total_dr > 0 OR total_cr > 0
            ORDER BY ag.nature, l.ledger_name
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalDr = 0;
        $totalCr = 0;
        foreach ($rows as &$r) {
            $net = (float)$r['total_dr'] - (float)$r['total_cr'];
            $r['balance'] = abs($net);
            $r['balance_type'] = $net >= 0 ? 'DR' : 'CR';
            $r['dr_balance'] = $net >= 0 ? abs($net) : 0;
            $r['cr_balance'] = $net < 0 ? abs($net) : 0;
            $totalDr += $r['dr_balance'];
            $totalCr += $r['cr_balance'];
        }

        return ['rows' => $rows, 'total_dr' => $totalDr, 'total_cr' => $totalCr, 'is_balanced' => abs($totalDr - $totalCr) < 0.01];
    }

    /**
     * Day Book (all vouchers for a date).
     */
    public static function dayBook(string $date): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT lp.*, l.ledger_name, l.ledger_code, v.voucher_type, v.voucher_no, v.series, v.narration AS v_narration
            FROM ledger_postings lp
            JOIN ledgers l ON l.id = lp.ledger_id
            LEFT JOIN vouchers v ON v.id = lp.voucher_id
            WHERE lp.posting_date = :date AND lp.is_opening = 0
            ORDER BY lp.id ASC
        ");
        $stmt->execute(['date' => $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Cash Book (ledgers in CASH group).
     */
    public static function cashBook(?string $from = null, ?string $to = null): array {
        $db = Database::getConnection();
        $where = "ag.name LIKE '%Cash%'";
        $params = [];
        if ($from) { $where .= ' AND lp.posting_date >= :from'; $params['from'] = $from; }
        if ($to) { $where .= ' AND lp.posting_date <= :to'; $params['to'] = $to; }

        $stmt = $db->prepare("
            SELECT lp.*, l.ledger_name, l.ledger_code, v.voucher_type, v.voucher_no, v.series
            FROM ledger_postings lp
            JOIN ledgers l ON l.id = lp.ledger_id
            JOIN account_groups ag ON ag.id = l.group_id
            LEFT JOIN vouchers v ON v.id = lp.voucher_id
            WHERE $where
            ORDER BY lp.posting_date ASC, lp.id ASC
        ");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Bank Book (ledgers in BANK group).
     */
    public static function bankBook(?string $from = null, ?string $to = null): array {
        $db = Database::getConnection();
        $where = "ag.name LIKE '%Bank%'";
        $params = [];
        if ($from) { $where .= ' AND lp.posting_date >= :from'; $params['from'] = $from; }
        if ($to) { $where .= ' AND lp.posting_date <= :to'; $params['to'] = $to; }

        $stmt = $db->prepare("
            SELECT lp.*, l.ledger_name, l.ledger_code, v.voucher_type, v.voucher_no, v.series
            FROM ledger_postings lp
            JOIN ledgers l ON l.id = lp.ledger_id
            JOIN account_groups ag ON ag.id = l.group_id
            LEFT JOIN vouchers v ON v.id = lp.voucher_id
            WHERE $where
            ORDER BY lp.posting_date ASC, lp.id ASC
        ");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Outstanding Receivables (DR balance in Debtors groups).
     */
    public static function outstandingReceivable(?string $asOnDate = null): array {
        return self::outstanding('DR', $asOnDate);
    }

    /**
     * Outstanding Payables (CR balance in Creditors groups).
     */
    public static function outstandingPayable(?string $asOnDate = null): array {
        return self::outstanding('CR', $asOnDate);
    }

    private static function outstanding(string $balType, ?string $asOnDate): array {
        $db = Database::getConnection();
        $dateWhere = $asOnDate ? 'AND lp.posting_date <= :date' : '';
        $params = $asOnDate ? ['date' => $asOnDate] : [];

        $stmt = $db->prepare("
            SELECT l.id, l.ledger_name, l.ledger_code, ag.name AS group_name,
                   COALESCE(SUM(lp.debit),0) AS total_dr, COALESCE(SUM(lp.credit),0) AS total_cr
            FROM ledgers l
            JOIN account_groups ag ON ag.id = l.group_id
            LEFT JOIN ledger_postings lp ON lp.ledger_id = l.id $dateWhere
            WHERE l.status = 'ACTIVE'
            GROUP BY l.id, l.ledger_name, l.ledger_code, ag.name
            HAVING total_dr != total_cr
            ORDER BY l.ledger_name
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($rows as $r) {
            $net = (float)$r['total_dr'] - (float)$r['total_cr'];
            $type = $net > 0 ? 'DR' : 'CR';
            if ($type === $balType) {
                $r['balance'] = abs($net);
                $r['balance_type'] = $type;
                $result[] = $r;
            }
        }
        return $result;
    }

    /**
     * Profit & Loss report.
     */
    public static function profitLoss(?string $from = null, ?string $to = null): array {
        $db = Database::getConnection();
        $dateWhere = '';
        $params = [];
        if ($from) { $dateWhere .= ' AND lp.posting_date >= :from'; $params['from'] = $from; }
        if ($to) { $dateWhere .= ' AND lp.posting_date <= :to'; $params['to'] = $to; }

        $stmt = $db->prepare("
            SELECT ag.nature, ag.name AS group_name, l.ledger_name,
                   COALESCE(SUM(lp.debit),0) AS total_dr, COALESCE(SUM(lp.credit),0) AS total_cr
            FROM ledgers l
            JOIN account_groups ag ON ag.id = l.group_id
            LEFT JOIN ledger_postings lp ON lp.ledger_id = l.id $dateWhere
            WHERE ag.nature IN ('INCOME','EXPENSE') AND l.status = 'ACTIVE'
            GROUP BY ag.nature, ag.name, l.ledger_name
            ORDER BY ag.nature, l.ledger_name
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $income = [];
        $expense = [];
        $totalIncome = 0;
        $totalExpense = 0;
        foreach ($rows as $r) {
            $net = (float)$r['total_cr'] - (float)$r['total_dr']; // Income = CR-DR, Expense = DR-CR
            if ($r['nature'] === 'INCOME') {
                $r['amount'] = $net;
                $income[] = $r;
                $totalIncome += $net;
            } else {
                $r['amount'] = (float)$r['total_dr'] - (float)$r['total_cr'];
                $expense[] = $r;
                $totalExpense += $r['amount'];
            }
        }
        $netProfit = $totalIncome - $totalExpense;
        return ['income' => $income, 'expense' => $expense, 'total_income' => $totalIncome, 'total_expense' => $totalExpense, 'net_profit' => $netProfit];
    }

    /**
     * Balance Sheet as of a date.
     */
    public static function balanceSheet(?string $asOnDate = null): array {
        $tb = self::trialBalance($asOnDate);
        $assets = [];
        $liabilities = [];
        $totalAssets = 0;
        $totalLiabilities = 0;
        foreach ($tb['rows'] as $r) {
            if ($r['nature'] === 'ASSET') {
                $assets[] = $r;
                $totalAssets += (float)$r['balance'];
            } elseif (in_array($r['nature'], ['LIABILITY','INCOME','EXPENSE'])) {
                $liabilities[] = $r;
                $totalLiabilities += (float)$r['balance'];
            }
        }
        return [
            'assets' => $assets, 'total_assets' => $totalAssets,
            'liabilities' => $liabilities, 'total_liabilities' => $totalLiabilities,
            'is_balanced' => abs($totalAssets - $totalLiabilities) < 1,
        ];
    }

    private static function validateEntries(array $entries): void {
        if (empty($entries)) throw new Exception('No journal entries provided');
        $totalDr = array_sum(array_column($entries, 'debit'));
        $totalCr = array_sum(array_column($entries, 'credit'));
        if (abs($totalDr - $totalCr) > 0.01) {
            throw new Exception("Unbalanced journal entry: Debit $totalDr ≠ Credit $totalCr");
        }
    }
}
