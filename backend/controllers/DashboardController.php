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
}
