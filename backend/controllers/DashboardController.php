<?php
namespace Controllers;

use Helpers\Response;
use Models\DailyBoardRate;
use Models\Voucher;
use PDO;

class DashboardController {
    public static function getTodayRates(): void {
        $rates = DailyBoardRate::getTodayOrLatest();
        Response::json($rates);
    }

    public static function getDailySummary(): void {
        $dateStr = $_GET['date'] ?? null;
        $summary = Voucher::getDailySummary($dateStr);
        Response::json($summary);
    }

    public static function getDashboardSummary(): void {
        $db = \Config\Database::getConnection();
        try {
            $today = date('Y-m-d');
            $yesterday = date('Y-m-d', strtotime('-1 day'));

            // 1. Total Stock Value (INR) from stock_status + metal_stock
            $stockStatusVal = (float)$db->query("SELECT COALESCE(SUM(total), 0) FROM stock_status")->fetchColumn();
            $metalStockVal  = (float)$db->query("SELECT COALESCE(SUM(total), 0) FROM metal_stock")->fetchColumn();
            $totalStockValue = $stockStatusVal + $metalStockVal;

            // 2. Total Invoices (vouchers SALE + sale_register)
            $vSaleCnt = (int)$db->query("SELECT COUNT(id) FROM vouchers WHERE voucher_type='SALE' AND deleted_at IS NULL")->fetchColumn();
            $srSaleCnt = (int)$db->query("SELECT COUNT(id) FROM sale_register WHERE deleted_at IS NULL")->fetchColumn();
            $totalInvoices = $vSaleCnt + $srSaleCnt;

            // 3. Silver Bullion available weight (g)
            $bullionWt = (float)$db->query("SELECT COALESCE(SUM(COALESCE(silver_cr, fine_cr, 0)) - SUM(COALESCE(silver_dr, fine_dr, 0)), 0) FROM silver_bullion")->fetchColumn();

            // 4. Today's sales (for pct/overview)
            $stmt = $db->prepare("SELECT COALESCE(SUM(net_amount),0) AS total, COUNT(id) AS cnt FROM vouchers WHERE voucher_type='SALE' AND deleted_at IS NULL AND voucher_date=:d");
            $stmt->execute(['d' => $today]);
            $todayRow = $stmt->fetch(PDO::FETCH_ASSOC);
            $stmt->execute(['d' => $yesterday]);
            $yestRow = $stmt->fetch(PDO::FETCH_ASSOC);

            $todaySales = (float)$todayRow['total'];
            $yestSales = (float)$yestRow['total'];
            $salesPct = $yestSales > 0 ? (($todaySales - $yestSales) / $yestSales) * 100 : 0;

            $todayCount = (int)$todayRow['cnt'];
            $yestCount = (int)$yestRow['cnt'];
            $countPct = $yestCount > 0 ? (($todayCount - $yestCount) / $yestCount) * 100 : 0;

            // Silver sold (fine weight)
            $stmt = $db->prepare("
                SELECT COALESCE(SUM(vi.fine_weight),0) AS w
                FROM voucher_items vi
                JOIN vouchers v ON v.id = vi.voucher_id
                WHERE v.voucher_type='SALE' AND v.deleted_at IS NULL AND v.voucher_date=:d
            ");
            $stmt->execute(['d' => $today]);
            $todaySilver = (float)$stmt->fetchColumn();
            $stmt->execute(['d' => $yesterday]);
            $yestSilver = (float)$stmt->fetchColumn();
            $silverPct = $yestSilver > 0 ? (($todaySilver - $yestSilver) / $yestSilver) * 100 : 0;

            // Silver rate
            $stmt = $db->query("SELECT silver_925_rate FROM daily_board_rates ORDER BY rate_date DESC LIMIT 2");
            $rates = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $currentRate = isset($rates[0]) ? ((float)$rates[0]) / 1000 : 0;
            $prevRate = isset($rates[1]) ? ((float)$rates[1]) / 1000 : $currentRate;
            $ratePct = $prevRate > 0 ? (($currentRate - $prevRate) / $prevRate) * 100 : 0;

            Response::json([
                'total_stock_value'     => round($totalStockValue, 2),
                'silver_bullion_weight' => round($bullionWt, 2),
                'today_sales'           => $todaySales,
                'today_sales_pct'       => round($salesPct, 1),
                'total_invoices'        => $totalInvoices,
                'total_invoices_pct'    => round($countPct, 1),
                'silver_sold'           => round($todaySilver, 2),
                'silver_sold_pct'       => round($silverPct, 1),
                'silver_rate'           => round($currentRate, 2),
                'silver_rate_pct'       => round($ratePct, 1),
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    public static function getSalesOverview(): void {
        $range = $_GET['range'] ?? '7days';
        $db = \Config\Database::getConnection();

        try {
            if ($range === 'today') {
                $sql = "
                    SELECT HOUR(v.created_at) AS bucket,
                           SUM(v.net_amount) AS total,
                           COALESCE(SUM(ps.amount), 0) AS paid
                    FROM vouchers v
                    LEFT JOIN payment_splits ps ON ps.voucher_id = v.id
                    WHERE v.voucher_type = 'SALE'
                      AND v.voucher_date = CURDATE()
                    GROUP BY HOUR(v.created_at)
                    ORDER BY bucket ASC
                ";
                $stmt = $db->query($sql);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $data = [];
                foreach ($rows as $r) {
                    $data[] = [
                        'label' => sprintf('%02d:00', (int)$r['bucket']),
                        'total' => (float)$r['total'],
                        'paid' => (float)$r['paid'],
                        'pending' => (float)$r['total'] - (float)$r['paid'],
                    ];
                }
            } else {
                $days = $range === '30days' ? 30 : 7;
                $sql = "
                    SELECT v.voucher_date AS bucket,
                           SUM(v.net_amount) AS total,
                           COALESCE(SUM(ps.amount), 0) AS paid
                    FROM vouchers v
                    LEFT JOIN payment_splits ps ON ps.voucher_id = v.id
                    WHERE v.voucher_type = 'SALE'
                      AND v.voucher_date >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
                    GROUP BY v.voucher_date
                    ORDER BY v.voucher_date ASC
                ";
                $stmt = $db->prepare($sql);
                $stmt->execute(['days' => $days]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $data = [];
                foreach ($rows as $r) {
                    $data[] = [
                        'label' => $r['bucket'],
                        'total' => (float)$r['total'],
                        'paid' => (float)$r['paid'],
                        'pending' => (float)$r['total'] - (float)$r['paid'],
                    ];
                }
            }

            $totals = ['total' => 0, 'paid' => 0, 'pending' => 0, 'count' => 0];
            foreach ($data as $d) {
                $totals['total'] += $d['total'];
                $totals['paid'] += $d['paid'];
                $totals['pending'] += $d['pending'];
            }
            $totals['count'] = count($data);

            Response::json(['range' => $range, 'points' => $data, 'totals' => $totals]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    public static function getDailyBalance(): void {
        $db = \Config\Database::getConnection();
        try {
            $search = $_GET['search'] ?? null;
            $city = $_GET['city'] ?? null;
            $party = $_GET['party'] ?? null;
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));
            $offset = ($page - 1) * $limit;

            $where = [];
            $params = [];
            if ($search) {
                $where[] = '(account_name LIKE :s1 OR mobile LIKE :s2)';
                $params['s1'] = '%' . $search . '%';
                $params['s2'] = '%' . $search . '%';
            }
            if ($city) {
                $where[] = 'city = :city';
                $params['city'] = $city;
            }
            if ($party) {
                $where[] = 'account_name LIKE :party';
                $params['party'] = '%' . $party . '%';
            }
            $whereSql = !empty($where) ? ' WHERE ' . implode(' AND ', $where) : '';

            $countStmt = $db->prepare("SELECT COUNT(*) FROM daily_balance {$whereSql}");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetchColumn();

            $dataStmt = $db->prepare("SELECT * FROM daily_balance {$whereSql} ORDER BY id DESC LIMIT :lim OFFSET :off");
            foreach ($params as $k => $v) {
                $dataStmt->bindValue(':' . $k, $v);
            }
            $dataStmt->bindValue(':lim', $limit, PDO::PARAM_INT);
            $dataStmt->bindValue(':off', $offset, PDO::PARAM_INT);
            $dataStmt->execute();
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

            Response::json(['items' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }
    public static function getStockStatus(): void {
        $db = \Config\Database::getConnection();
        try {
            $search = $_GET['search'] ?? null;
            $stockType = $_GET['stock_type'] ?? null;
            $category = $_GET['category'] ?? null;
            $group = $_GET['group'] ?? null;
            $withApproval = isset($_GET['with_approval']) ? (int)$_GET['with_approval'] : null;
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));
            $offset = ($page - 1) * $limit;

            $where = [];
            $params = [];
            if ($search) {
                $where[] = 'item_name LIKE :s';
                $params['s'] = '%' . $search . '%';
            }
            if ($stockType && $stockType !== 'All') {
                $where[] = 'stock_type = :st';
                $params['st'] = $stockType;
            }
            if ($category && $category !== 'All') {
                $where[] = 'category = :cat';
                $params['cat'] = $category;
            }
            if ($group && $group !== 'All Group') {
                $where[] = 'group_name = :grp';
                $params['grp'] = $group;
            }
            if ($withApproval !== null) {
                $where[] = 'with_approval = :wa';
                $params['wa'] = $withApproval;
            }
            $whereSql = !empty($where) ? ' WHERE ' . implode(' AND ', $where) : '';

            $countStmt = $db->prepare("SELECT COUNT(*) FROM stock_status {$whereSql}");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetchColumn();

            $dataStmt = $db->prepare("SELECT * FROM stock_status {$whereSql} ORDER BY id DESC LIMIT :lim OFFSET :off");
            foreach ($params as $k => $v) {
                $dataStmt->bindValue(':' . $k, $v);
            }
            $dataStmt->bindValue(':lim', $limit, PDO::PARAM_INT);
            $dataStmt->bindValue(':off', $offset, PDO::PARAM_INT);
            $dataStmt->execute();
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

            Response::json(['items' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    public static function getStockStatusSummary(): void {
        $db = \Config\Database::getConnection();
        try {
            $stmt = $db->query("SELECT COUNT(*) AS total_items, COALESCE(SUM(pcs),0) AS total_pcs, COALESCE(SUM(gross_weight),0) AS total_gross, COALESCE(SUM(net_weight),0) AS total_net, COALESCE(SUM(silver_fine),0) AS total_silver_fine, COALESCE(SUM(total),0) AS total_amount, COALESCE(SUM(gold_fine),0) AS total_gold_fine FROM stock_status");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            Response::json($row);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Dashboard Overview: counts, daily balance (receipt/payment/closing),
     * account-wise summary (cash/bank/others), recent vouchers, and monthly trend.
     */
    public static function getOverview(): void {
        $db = \Config\Database::getConnection();
        try {
            $from = !empty($_GET['from']) ? $_GET['from'] : date('Y-m-01');
            $to   = !empty($_GET['to']) ? $_GET['to'] : date('Y-m-t');

            // 1. Total Count Cards (actual DB counts)
            $customers = (int)$db->query("SELECT COUNT(*) FROM accounts WHERE account_type = 'CUSTOMER'")->fetchColumn();
            $suppliers = (int)$db->query("SELECT COUNT(*) FROM accounts WHERE account_type = 'SUPPLIER'")->fetchColumn();
            $karigars  = (int)$db->query("SELECT COUNT(*) FROM karigars")->fetchColumn();
            if ($karigars === 0) {
                $karigars = (int)$db->query("SELECT COUNT(*) FROM accounts WHERE account_type = 'KARIGAR'")->fetchColumn();
            }
            $items = (int)$db->query("SELECT COUNT(*) FROM items")->fetchColumn();

            // 2. Daily Balance Overview (Receipt, Payment, Closing Balance) for date range
            $openingCashBankStmt = $db->prepare("
                SELECT COALESCE(SUM(
                    CASE WHEN l.opening_balance_type = 'CR' THEN -l.opening_balance ELSE l.opening_balance END
                ), 0) AS ob
                FROM ledgers l
                WHERE l.status = 'ACTIVE' AND l.group_id IN (4, 5)
            ");
            $openingCashBankStmt->execute();
            $baseCashBank = (float)$openingCashBankStmt->fetchColumn();

            $priorStmt = $db->prepare("
                SELECT
                    COALESCE(SUM(CASE WHEN voucher_type = 'RECEIPT' THEN net_amount ELSE 0 END), 0) AS rec,
                    COALESCE(SUM(CASE WHEN voucher_type = 'PAYMENT' THEN net_amount ELSE 0 END), 0) AS pay
                FROM vouchers
                WHERE deleted_at IS NULL AND voucher_date < :from AND voucher_type IN ('RECEIPT', 'PAYMENT')
            ");
            $priorStmt->execute(['from' => $from]);
            $priorRow = $priorStmt->fetch(PDO::FETCH_ASSOC);
            $runningClosing = $baseCashBank + (float)($priorRow['rec'] ?? 0) - (float)($priorRow['pay'] ?? 0);

            $dailyStmt = $db->prepare("
                SELECT voucher_date,
                       COALESCE(SUM(CASE WHEN voucher_type = 'RECEIPT' THEN net_amount ELSE 0 END), 0) AS receipt,
                       COALESCE(SUM(CASE WHEN voucher_type = 'PAYMENT' THEN net_amount ELSE 0 END), 0) AS payment
                FROM vouchers
                WHERE deleted_at IS NULL
                  AND voucher_date BETWEEN :from AND :to
                  AND voucher_type IN ('RECEIPT', 'PAYMENT')
                GROUP BY voucher_date
                ORDER BY voucher_date ASC
            ");
            $dailyStmt->execute(['from' => $from, 'to' => $to]);
            $dailyRows = $dailyStmt->fetchAll(PDO::FETCH_ASSOC);
            $dailyMap = [];
            foreach ($dailyRows as $r) {
                $dailyMap[$r['voucher_date']] = [
                    'receipt' => (float)$r['receipt'],
                    'payment' => (float)$r['payment'],
                ];
            }

            $dailySeries = [];
            $startTs = strtotime($from);
            $endTs   = strtotime($to);
            if ($startTs !== false && $endTs !== false && $startTs <= $endTs) {
                $daysCount = (int)round(($endTs - $startTs) / 86400) + 1;
                if ($daysCount <= 45) {
                    for ($ts = $startTs; $ts <= $endTs; $ts += 86400) {
                        $dStr = date('Y-m-d', $ts);
                        $rec  = $dailyMap[$dStr]['receipt'] ?? 0.0;
                        $pay  = $dailyMap[$dStr]['payment'] ?? 0.0;
                        $runningClosing += ($rec - $pay);
                        $dailySeries[] = [
                            'date'            => $dStr,
                            'label'           => date('d M', $ts),
                            'receipt'         => round($rec, 2),
                            'payment'         => round($pay, 2),
                            'closing_balance' => round($runningClosing, 2),
                        ];
                    }
                } else {
                    foreach ($dailyMap as $dStr => $vals) {
                        $rec = $vals['receipt'];
                        $pay = $vals['payment'];
                        $runningClosing += ($rec - $pay);
                        $dailySeries[] = [
                            'date'            => $dStr,
                            'label'           => date('d M', strtotime($dStr)),
                            'receipt'         => round($rec, 2),
                            'payment'         => round($pay, 2),
                            'closing_balance' => round($runningClosing, 2),
                        ];
                    }
                }
            }

            // 3. Account Wise Summary (Cash Balance, Bank Balance, Other Account Balance)
            $accRows = $db->query("
                SELECT l.group_id,
                       COALESCE(
                           CASE WHEN l.opening_balance_type = 'CR' THEN -l.opening_balance ELSE l.opening_balance END,
                           0
                       ) + COALESCE(SUM(lp.debit - lp.credit), 0) AS bal
                FROM ledgers l
                LEFT JOIN ledger_postings lp ON lp.ledger_id = l.id
                WHERE l.status = 'ACTIVE'
                GROUP BY l.id, l.group_id, l.opening_balance, l.opening_balance_type
            ")->fetchAll(PDO::FETCH_ASSOC);

            $cashBal   = 0.0;
            $bankBal   = 0.0;
            $othersBal = 0.0;
            foreach ($accRows as $ar) {
                $gid = (int)$ar['group_id'];
                $val = abs((float)$ar['bal']);
                if ($gid === 4) {
                    $cashBal += $val;
                } elseif ($gid === 5) {
                    $bankBal += $val;
                } else {
                    $othersBal += $val;
                }
            }
            $accTotal = $cashBal + $bankBal + $othersBal;

            // 4. Recent Vouchers (Receipt, Payment, Contra, Journal)
            $recentStmt = $db->query("
                SELECT v.id, v.voucher_date, v.voucher_type, v.voucher_no, v.series,
                       v.net_amount,
                       COALESCE(a.name, sa.name, v.narration, '—') AS party_name
                FROM vouchers v
                LEFT JOIN accounts a ON a.id = v.account_id
                LEFT JOIN accounts sa ON sa.id = v.second_account_id
                WHERE v.voucher_type IN ('RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL')
                  AND v.deleted_at IS NULL
                ORDER BY v.voucher_date DESC, v.id DESC
                LIMIT 6
            ");
            $recentVouchers = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

            // 5. Gold & Silver Rate Trend (actual historical records from daily_board_rates)
            $ratePeriod = $_GET['rate_period'] ?? '30d';
            $periodDaysMap = [
                '7d'  => 7,
                '15d' => 15,
                '30d' => 30,
                '3m'  => 90,
                '6m'  => 180,
                '1y'  => 365,
            ];
            $rateDays = $periodDaysMap[$ratePeriod] ?? 30;
            $rateStart = date('Y-m-d', strtotime("-{$rateDays} days"));

            $rateStmt = $db->prepare("
                SELECT dbr.rate_date,
                       dbr.gold_24k_sell_rate AS gold_rate,
                       dbr.silver_pure_sell_rate AS silver_rate
                FROM daily_board_rates dbr
                INNER JOIN (
                    SELECT rate_date, MAX(id) AS max_id
                    FROM daily_board_rates
                    WHERE rate_date >= :rstart
                    GROUP BY rate_date
                ) latest_per_day ON latest_per_day.max_id = dbr.id
                ORDER BY dbr.rate_date ASC
            ");
            $rateStmt->execute(['rstart' => $rateStart]);
            $rateRows = $rateStmt->fetchAll(PDO::FETCH_ASSOC);

            $ratePoints = [];
            foreach ($rateRows as $rr) {
                $ratePoints[] = [
                    'date'        => $rr['rate_date'],
                    'label'       => date($rateDays > 90 ? "M 'y" : 'd M', strtotime($rr['rate_date'])),
                    'gold_rate'   => round((float)$rr['gold_rate'], 2),
                    'silver_rate' => round((float)$rr['silver_rate'], 2),
                ];
            }

            $latestRateRow = $db->query("
                SELECT rate_date, gold_24k_sell_rate AS gold_rate, silver_pure_sell_rate AS silver_rate
                FROM daily_board_rates
                ORDER BY rate_date DESC, id DESC
                LIMIT 1
            ")->fetch(PDO::FETCH_ASSOC);

            $latestRate = $latestRateRow ? [
                'date'        => $latestRateRow['rate_date'],
                'gold_rate'   => round((float)$latestRateRow['gold_rate'], 2),
                'silver_rate' => round((float)$latestRateRow['silver_rate'], 2),
                'gold_unit'   => 'per 10g',
                'silver_unit' => 'per kg',
            ] : null;

            Response::json([
                'range' => ['from' => $from, 'to' => $to],
                'counts' => [
                    'customers' => $customers,
                    'suppliers' => $suppliers,
                    'karigars'  => $karigars,
                    'items'     => $items,
                ],
                'daily_balance' => $dailySeries,
                'account_summary' => [
                    'cash'       => round($cashBal, 2),
                    'bank'       => round($bankBal, 2),
                    'others'     => round($othersBal, 2),
                    'total'      => round($accTotal, 2),
                    'cash_pct'   => $accTotal > 0 ? round(($cashBal / $accTotal) * 100, 1) : 0,
                    'bank_pct'   => $accTotal > 0 ? round(($bankBal / $accTotal) * 100, 1) : 0,
                    'others_pct' => $accTotal > 0 ? round(($othersBal / $accTotal) * 100, 1) : 0,
                ],
                'recent_vouchers' => $recentVouchers,
                'rate_trend' => [
                    'period' => $ratePeriod,
                    'points' => $ratePoints,
                    'latest' => $latestRate,
                ],
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }
}
