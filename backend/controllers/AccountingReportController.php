<?php
namespace Controllers;

use Services\AccountingEngine;

class AccountingReportController {
    public static function trialBalance(): void {
        $asOn = $_GET['as_on'] ?? null;
        $data = AccountingEngine::trialBalance($asOn);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function dayBook(): void {
        $date = $_GET['date'] ?? date('Y-m-d');
        $data = AccountingEngine::dayBook($date);
        echo json_encode(['success' => true, 'data' => $data, 'date' => $date]);
    }

    public static function cashBook(): void {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        if (empty($_GET['detailed'])) {
            $data = AccountingEngine::cashBook($from, $to);
            echo json_encode(['success' => true, 'data' => $data]);
            return;
        }

        $db = \Config\Database::getConnection();
        try {
            $fromDate = !empty($from) ? $from : date('Y-m-d');
            $toDate   = !empty($to) ? $to : date('Y-m-d');
            $groupId  = !empty($_GET['group_id']) && $_GET['group_id'] !== 'ALL' ? (int)$_GET['group_id'] : null;
            $ledgerId = !empty($_GET['ledger_id']) && $_GET['ledger_id'] !== 'ALL' ? (int)$_GET['ledger_id'] : null;
            $city     = !empty($_GET['city']) && $_GET['city'] !== 'ALL' ? trim($_GET['city']) : null;
            $userId   = !empty($_GET['user_id']) && $_GET['user_id'] !== 'ALL' ? (int)$_GET['user_id'] : null;

            // 1. Opening Balance of Cash in Hand ledgers before $fromDate
            $obMaster = (float)$db->query("
                SELECT COALESCE(SUM(
                    CASE WHEN l.opening_balance_type = 'CR' THEN -l.opening_balance ELSE l.opening_balance END
                ), 0)
                FROM ledgers l
                JOIN account_groups ag ON ag.id = l.group_id
                WHERE l.status = 'ACTIVE' AND (l.group_id = 4 OR ag.name LIKE '%Cash%')
            ")->fetchColumn();

            $priorStmt = $db->prepare("
                SELECT COALESCE(SUM(lp.debit - lp.credit), 0)
                FROM ledger_postings lp
                JOIN ledgers l ON l.id = lp.ledger_id
                JOIN account_groups ag ON ag.id = l.group_id
                LEFT JOIN vouchers v ON v.id = lp.voucher_id
                WHERE (l.group_id = 4 OR ag.name LIKE '%Cash%')
                  AND lp.posting_date < :from_date
                  AND (v.id IS NULL OR v.deleted_at IS NULL)
            ");
            $priorStmt->execute(['from_date' => $fromDate]);
            $openingBalance = round($obMaster + (float)$priorStmt->fetchColumn(), 2);

            // 2. Fetch Cash ledger postings in date range, joined with contra/party entry on the same voucher
            $where = [
                "(cl.group_id = 4 OR cag.name LIKE '%Cash%')",
                "lp.posting_date BETWEEN :from_date AND :to_date",
                "(v.id IS NULL OR v.deleted_at IS NULL)",
            ];
            $params = [
                'from_date' => $fromDate,
                'to_date'   => $toDate,
            ];

            if ($userId !== null) {
                $where[] = "v.created_by = :uid";
                $params['uid'] = $userId;
            }

            $sql = "
                SELECT lp.id AS posting_id,
                       lp.voucher_id,
                       lp.posting_date,
                       lp.debit AS cash_dr,
                       lp.credit AS cash_cr,
                       lp.narration AS lp_narration,
                       v.voucher_type,
                       v.voucher_no,
                       v.series,
                       v.narration AS v_narration,
                       v.created_by,
                       COALESCE(pl.id, cl.id) AS party_ledger_id,
                       COALESCE(pl.ledger_name, cl.ledger_name) AS party_name,
                       COALESCE(pl.group_id, cl.group_id) AS party_group_id,
                       COALESCE(pl.city, '') AS party_city,
                       COALESCE(pe.sub_account, '') AS sub_account
                FROM ledger_postings lp
                JOIN ledgers cl ON cl.id = lp.ledger_id
                JOIN account_groups cag ON cag.id = cl.group_id
                LEFT JOIN vouchers v ON v.id = lp.voucher_id
                LEFT JOIN voucher_entries pe ON pe.id = (
                    SELECT ve2.id
                    FROM voucher_entries ve2
                    WHERE ve2.voucher_id = lp.voucher_id
                      AND ve2.ledger_id <> lp.ledger_id
                    ORDER BY ve2.id ASC
                    LIMIT 1
                )
                LEFT JOIN ledgers pl ON pl.id = pe.ledger_id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY lp.posting_date ASC, lp.id ASC
            ";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $creditEntries = []; // Cash Receipts (cash_dr > 0)
            $debitEntries  = []; // Cash Payments (cash_cr > 0)
            $creditTotal   = 0.0;
            $debitTotal    = 0.0;

            foreach ($rows as $r) {
                if ($groupId !== null && (int)$r['party_group_id'] !== $groupId) continue;
                if ($ledgerId !== null && (int)$r['party_ledger_id'] !== $ledgerId) continue;
                if ($city !== null && strcasecmp(trim((string)$r['party_city']), $city) !== 0) continue;

                $prefix = !empty($r['series']) ? $r['series'] : substr((string)($r['voucher_type'] ?? 'VCH'), 0, 3);
                $vNoFormatted = $r['voucher_no'] ? ($prefix . '-' . str_pad((string)$r['voucher_no'], 4, '0', STR_PAD_LEFT)) : ('#' . $r['posting_id']);
                $particular = trim((string)($r['lp_narration'] ?: $r['v_narration'] ?: $r['voucher_type'] ?: ''));

                $cashDr = (float)$r['cash_dr'];
                $cashCr = (float)$r['cash_cr'];

                if ($cashDr > 0) {
                    $creditTotal += $cashDr;
                    $creditEntries[] = [
                        'id'           => (int)$r['posting_id'],
                        'voucher_id'   => $r['voucher_id'] ? (int)$r['voucher_id'] : null,
                        'date'         => $r['posting_date'],
                        'voucher_no'   => $vNoFormatted,
                        'voucher_type' => $r['voucher_type'] ?? '',
                        'account_name' => $r['party_name'],
                        'sub_account'  => $r['sub_account'],
                        'particular'   => $particular,
                        'amount'       => round($cashDr, 2),
                    ];
                }
                if ($cashCr > 0) {
                    $debitTotal += $cashCr;
                    $debitEntries[] = [
                        'id'           => (int)$r['posting_id'],
                        'voucher_id'   => $r['voucher_id'] ? (int)$r['voucher_id'] : null,
                        'date'         => $r['posting_date'],
                        'voucher_no'   => $vNoFormatted,
                        'voucher_type' => $r['voucher_type'] ?? '',
                        'account_name' => $r['party_name'],
                        'sub_account'  => $r['sub_account'],
                        'particular'   => $particular,
                        'amount'       => round($cashCr, 2),
                    ];
                }
            }

            $creditTotal    = round($creditTotal, 2);
            $debitTotal     = round($debitTotal, 2);
            $dayDifference  = round($creditTotal - $debitTotal, 2);
            $closingBalance = round($openingBalance + $creditTotal - $debitTotal, 2);

            // 3. Filter dropdown options from DB
            $groups  = $db->query("SELECT id, name FROM account_groups WHERE is_active = 1 ORDER BY name ASC")->fetchAll(\PDO::FETCH_ASSOC);
            $parties = $db->query("SELECT id, ledger_name, group_id, city FROM ledgers WHERE status = 'ACTIVE' ORDER BY ledger_name ASC")->fetchAll(\PDO::FETCH_ASSOC);
            $cities  = $db->query("SELECT DISTINCT city FROM ledgers WHERE city IS NOT NULL AND TRIM(city) <> '' ORDER BY city ASC")->fetchAll(\PDO::FETCH_COLUMN);
            $users   = $db->query("SELECT id, name FROM users ORDER BY name ASC")->fetchAll(\PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => [
                    'from'            => $fromDate,
                    'to'              => $toDate,
                    'opening_balance' => $openingBalance,
                    'credit_entries'  => $creditEntries,
                    'debit_entries'   => $debitEntries,
                    'credit_total'    => $creditTotal,
                    'debit_total'     => $debitTotal,
                    'day_difference'  => $dayDifference,
                    'closing_balance' => $closingBalance,
                    'options' => [
                        'groups'  => $groups,
                        'parties' => $parties,
                        'cities'  => $cities,
                        'users'   => $users,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    public static function bankBook(): void {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $data = AccountingEngine::bankBook($from, $to);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function outstandingReceivable(): void {
        $asOn = $_GET['as_on'] ?? null;
        $data = AccountingEngine::outstandingReceivable($asOn);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function outstandingPayable(): void {
        $asOn = $_GET['as_on'] ?? null;
        $data = AccountingEngine::outstandingPayable($asOn);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function profitLoss(): void {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $data = AccountingEngine::profitLoss($from, $to);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function balanceSheet(): void {
        $asOn = $_GET['as_on'] ?? null;
        $data = AccountingEngine::balanceSheet($asOn);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function invoiceStatusReport(): void {
        $type = strtoupper($_GET['type'] ?? 'SALE');
        $data = \Services\VoucherAllocationService::getInvoiceStatusReport($type, $_GET);
        echo json_encode(['success' => true, 'data' => $data]);
    }
}
