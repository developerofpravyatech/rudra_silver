<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class CustomerProfitReport {

    private static function normalizeDate(?string $d): ?string {
        if (!$d) return null;
        $d = trim($d);
        if ($d === '') return null;
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) return $d;
        if (preg_match('/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/', $d, $m)) {
            return sprintf('%04d-%02d-%02d', (int)$m[3], (int)$m[2], (int)$m[1]);
        }
        $ts = strtotime($d);
        return $ts ? date('Y-m-d', $ts) : $d;
    }

    /**
     * Get Gold and Silver benchmark purchase rates.
     * Evaluates purchase_register, silver_bullion, and daily_board_rates up to the given date.
     */
    public static function getAveragePurchaseRates(?string $upToDate = null): array {
        $db = Database::getConnection();

        // 1. Silver Average Purchase Rate
        $silverRate = 0.0;
        $silPurSql = "SELECT 
            COALESCE(SUM(p.purchase_value - p.purchase_return_value), 0) AS total_val,
            COALESCE(SUM(p.silver_weight - p.return_weight), 0) AS total_fine_wt
        FROM purchase_register p
        WHERE p.deleted_at IS NULL AND p.silver_weight > 0";
        $silParams = [];
        if (!empty($upToDate)) {
            $silPurSql .= " AND p.voucher_date <= :pur_date";
            $silParams['pur_date'] = $upToDate;
        }

        $stmt = $db->prepare($silPurSql);
        $stmt->execute($silParams);
        $silPurRow = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($silPurRow && (float)$silPurRow['total_fine_wt'] > 0) {
            $calcRate = (float)$silPurRow['total_val'] / (float)$silPurRow['total_fine_wt'];
            // If rate is > 50 it represents full bullion+making rate
            if ($calcRate >= 50.0) {
                $silverRate = $calcRate;
            }
        }

        // If purchase_register had no raw bullion cost, check silver_bullion purchases
        if ($silverRate <= 0.0) {
            $sbSql = "SELECT 
                COALESCE(SUM(b.amount_cr), 0) AS total_cr_amt,
                COALESCE(SUM(b.fine_cr), 0) AS total_fine_cr
            FROM silver_bullion b
            WHERE b.fine_cr > 0";
            $sbParams = [];
            if (!empty($upToDate)) {
                $sbSql .= " AND (b.date_cr <= :sb_date OR (b.date_cr IS NULL AND DATE(b.created_at) <= :sb_date2))";
                $sbParams['sb_date'] = $upToDate;
                $sbParams['sb_date2'] = $upToDate;
            }
            $stmt = $db->prepare($sbSql);
            $stmt->execute($sbParams);
            $sbRow = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($sbRow && (float)$sbRow['total_fine_cr'] > 0) {
                $calcRate = (float)$sbRow['total_cr_amt'] / (float)$sbRow['total_fine_cr'];
                if ($calcRate > 0) {
                    // silver_bullion rates can be per kg or per gm: normalize to per gram
                    $silverRate = $calcRate > 1000 ? round($calcRate / 1000, 2) : round($calcRate, 2);
                }
            }
        }

        // Fallback to daily_board_rates silver_pure_buy_rate
        if ($silverRate <= 0.0) {
            $rateStmt = $db->query("SELECT silver_pure_buy_rate FROM daily_board_rates WHERE silver_pure_buy_rate > 0 ORDER BY rate_date DESC, id DESC LIMIT 1");
            $rRow = $rateStmt->fetch(PDO::FETCH_ASSOC);
            if ($rRow && (float)$rRow['silver_pure_buy_rate'] > 0) {
                $val = (float)$rRow['silver_pure_buy_rate'];
                $silverRate = $val > 1000 ? round($val / 1000, 2) : round($val, 2);
            } else {
                $silverRate = 78.50; // Conservative fallback rate per gram
            }
        }

        // 2. Gold Average Purchase Rate
        $goldRate = 0.0;
        $goldPurSql = "SELECT 
            COALESCE(SUM(p.purchase_value - p.purchase_return_value), 0) AS total_val,
            COALESCE(SUM(p.gold_weight - p.return_weight), 0) AS total_gold_wt
        FROM purchase_register p
        WHERE p.deleted_at IS NULL AND p.gold_weight > 0";
        $goldParams = [];
        if (!empty($upToDate)) {
            $goldPurSql .= " AND p.voucher_date <= :pur_date";
            $goldParams['pur_date'] = $upToDate;
        }

        $stmt = $db->prepare($goldPurSql);
        $stmt->execute($goldParams);
        $goldPurRow = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($goldPurRow && (float)$goldPurRow['total_gold_wt'] > 0) {
            $goldRate = (float)$goldPurRow['total_val'] / (float)$goldPurRow['total_gold_wt'];
        }

        // Fallback to daily_board_rates for Gold buy rate (per gram)
        if ($goldRate <= 0.0) {
            $goldRateStmt = $db->query("SELECT gold_24k_buy_rate, gold_22k_rate FROM daily_board_rates WHERE gold_24k_buy_rate > 0 ORDER BY rate_date DESC, id DESC LIMIT 1");
            $gRow = $goldRateStmt->fetch(PDO::FETCH_ASSOC);
            if ($gRow && (float)$gRow['gold_24k_buy_rate'] > 0) {
                // board rate is per 10g (e.g. 78000/10g = 7800/g)
                $goldRate = round((float)$gRow['gold_24k_buy_rate'] / 10, 2);
            } else {
                $goldRate = 7800.00; // Baseline fallback rate per gram (fine gold)
            }
        }

        return [
            'silver_avg_purchase_rate' => round($silverRate, 2),
            'gold_avg_purchase_rate'   => round($goldRate, 2),
        ];
    }

    /**
     * Compute purity fraction (e.g., 22K/916 => 0.916, 925 => 0.925)
     */
    private static function getPurityFactor(?string $quality, ?string $stamp, string $metalType): float {
        $text = strtoupper(trim(($quality ?? '') . ' ' . ($stamp ?? '')));
        if ($metalType === 'GOLD') {
            if (strpos($text, '916') !== false || strpos($text, '22K') !== false) return 0.916;
            if (strpos($text, '750') !== false || strpos($text, '18K') !== false) return 0.750;
            if (strpos($text, '585') !== false || strpos($text, '14K') !== false) return 0.585;
            if (strpos($text, '999') !== false || strpos($text, '24K') !== false) return 1.000;
            return 0.916;
        } else {
            if (strpos($text, '925') !== false) return 0.925;
            if (strpos($text, '999') !== false) return 0.999;
            if (strpos($text, '800') !== false || strpos($text, '80') !== false) return 0.800;
            if (strpos($text, '700') !== false || strpos($text, '70') !== false) return 0.700;
            return 0.925;
        }
    }

    public static function buildWhere(array $filters): array {
        $where = ['s.deleted_at IS NULL'];
        $params = [];

        if (!empty($filters['search'])) {
            $s = '%' . trim($filters['search']) . '%';
            $where[] = '(s.party_name LIKE :s1 OR s.voucher_no LIKE :s2 OR s.item_name LIKE :s3)';
            $params['s1'] = $s;
            $params['s2'] = $s;
            $params['s3'] = $s;
        }

        $dateFrom = self::normalizeDate($filters['from_date'] ?? ($filters['date_from'] ?? null));
        if (!empty($dateFrom)) {
            $where[] = 's.voucher_date >= :f_from';
            $params['f_from'] = $dateFrom;
        }

        $dateTo = self::normalizeDate($filters['to_date'] ?? ($filters['date_to'] ?? null));
        if (!empty($dateTo)) {
            $where[] = 's.voucher_date <= :f_to';
            $params['f_to'] = $dateTo;
        }

        if (!empty($filters['group']) && $filters['group'] !== 'all' && $filters['group'] !== 'ALL') {
            $where[] = 's.account_group = :f_grp';
            $params['f_grp'] = trim($filters['group']);
        }

        if (!empty($filters['salesman']) && $filters['salesman'] !== 'all' && $filters['salesman'] !== 'ALL') {
            $where[] = 's.login_name = :f_sman';
            $params['f_sman'] = trim($filters['salesman']);
        }

        if (!empty($filters['site']) && $filters['site'] !== 'all' && $filters['site'] !== 'ALL') {
            $where[] = 's.branch_name = :f_site';
            $params['f_site'] = trim($filters['site']);
        }

        if (!empty($filters['city']) && $filters['city'] !== 'all' && $filters['city'] !== 'ALL') {
            // City filter checks linked customer city, accounts city, or branch city
            $where[] = '(
                EXISTS (SELECT 1 FROM customer c WHERE (c.Name = s.party_name OR c.FirmName = s.party_name) AND c.City = :f_city1)
                OR EXISTS (SELECT 1 FROM accounts a WHERE a.name = s.party_name AND a.city = :f_city2)
                OR EXISTS (SELECT 1 FROM branches b WHERE b.name = s.branch_name AND b.city = :f_city3)
            )';
            $params['f_city1'] = trim($filters['city']);
            $params['f_city2'] = trim($filters['city']);
            $params['f_city3'] = trim($filters['city']);
        }

        return [implode(' AND ', $where), $params];
    }

    /**
     * Compute transaction level profit for a sale register record
     */
    public static function calculateSaleProfit(array $sale, array $avgRates): array {
        $goldWeight = (float)($sale['gold_weight'] ?? 0);
        $silverWeight = (float)($sale['silver_weight'] ?? 0);
        $saleValue = (float)($sale['amount'] ?? ($sale['sale_value'] ?? 0));
        $saleReturnValue = (float)($sale['sale_return_value'] ?? 0);
        $netSaleVal = max(0, $saleValue - $saleReturnValue);

        $quality = $sale['quality'] ?? '';
        $stamp = $sale['stamp'] ?? '';

        $goldPurity = self::getPurityFactor($quality, $stamp, 'GOLD');
        $silverPurity = self::getPurityFactor($quality, $stamp, 'SILVER');

        $goldFineWeight = round($goldWeight * $goldPurity, 3);
        $silverFineWeight = round($silverWeight * $silverPurity, 3);

        $goldAvgPurRate = $avgRates['gold_avg_purchase_rate'] ?? 7800.00;
        $silverAvgPurRate = $avgRates['silver_avg_purchase_rate'] ?? 78.50;

        $goldCost = $goldFineWeight * $goldAvgPurRate;
        $silverCost = $silverFineWeight * $silverAvgPurRate;
        $totalCost = $goldCost + $silverCost;

        $profitInAmount = 0.0;
        $profitGoldFine = 0.0;
        $profitSilverFine = 0.0;

        if ($goldFineWeight > 0 && $silverFineWeight <= 0) {
            // Pure Gold Transaction
            $profitInAmount = $netSaleVal - $goldCost;
            $profitGoldFine = $goldAvgPurRate > 0 ? round($profitInAmount / $goldAvgPurRate, 3) : 0.0;
        } elseif ($silverFineWeight > 0 && $goldFineWeight <= 0) {
            // Pure Silver Transaction
            $profitInAmount = $netSaleVal - $silverCost;
            $profitSilverFine = $silverAvgPurRate > 0 ? round($profitInAmount / $silverAvgPurRate, 3) : 0.0;
        } elseif ($goldFineWeight > 0 && $silverFineWeight > 0) {
            // Mixed Jewellery Transaction
            $profitInAmount = $netSaleVal - $totalCost;
            $ratioGold = $totalCost > 0 ? ($goldCost / $totalCost) : 0.5;
            $ratioSilver = $totalCost > 0 ? ($silverCost / $totalCost) : 0.5;
            $goldProfitAmt = $profitInAmount * $ratioGold;
            $silverProfitAmt = $profitInAmount * $ratioSilver;
            $profitGoldFine = $goldAvgPurRate > 0 ? round($goldProfitAmt / $goldAvgPurRate, 3) : 0.0;
            $profitSilverFine = $silverAvgPurRate > 0 ? round($silverProfitAmt / $silverAvgPurRate, 3) : 0.0;
        }

        return [
            'gold_weight'        => $goldWeight,
            'silver_weight'      => $silverWeight,
            'gold_fine_weight'   => $goldFineWeight,
            'silver_fine_weight' => $silverFineWeight,
            'net_sale_value'     => round($netSaleVal, 2),
            'profit_gold_fine'   => round($profitGoldFine, 3),
            'profit_silver_fine' => round($profitSilverFine, 3),
            'profit_in_amount'   => round($profitInAmount, 2),
            'gold_avg_rate'      => $goldAvgPurRate,
            'silver_avg_rate'    => $silverAvgPurRate,
        ];
    }

    /**
     * Fetch all matching sale records and calculate profit
     */
    private static function getCalculatedRecords(array $filters): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhere($filters);

        $sql = "SELECT s.* FROM sale_register s WHERE {$whereSql} ORDER BY s.voucher_date ASC, s.id ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch benchmark average purchase rates
        $toFilterDate = self::normalizeDate($filters['to_date'] ?? ($filters['date_to'] ?? null));
        $avgRates = self::getAveragePurchaseRates($toFilterDate);

        $results = [];
        foreach ($rawRows as $row) {
            $calc = self::calculateSaleProfit($row, $avgRates);
            $results[] = array_merge($row, [
                'profit_gold_fine'   => $calc['profit_gold_fine'],
                'profit_silver_fine' => $calc['profit_silver_fine'],
                'profit_in_amount'   => $calc['profit_in_amount'],
                'gold_fine_weight'   => $calc['gold_fine_weight'],
                'silver_fine_weight' => $calc['silver_fine_weight'],
                'gold_avg_rate'      => $calc['gold_avg_rate'],
                'silver_avg_rate'    => $calc['silver_avg_rate'],
            ]);
        }

        return [$results, $avgRates];
    }

    /**
     * Paginated Report (Detailed: Customer-wise or Voucher-wise)
     */
    public static function paginate(
        array $filters = [],
        string $sortBy = 'account_name',
        string $sortOrder = 'asc',
        int $page = 1,
        int $limit = 20,
        string $reportType = 'detailed'
    ): array {
        [$calculatedRecords, $avgRates] = self::getCalculatedRecords($filters);

        if ($reportType === 'voucher_wise') {
            // Voucher Wise Report (Individual Transactions)
            $rows = array_map(function ($r) {
                return [
                    'id'                 => (int)$r['id'],
                    'voucher_date'       => $r['voucher_date'],
                    'voucher_no'         => $r['voucher_no'],
                    'party_name'         => $r['party_name'],
                    'item_name'          => $r['item_name'] ?: ($r['particular'] ?: 'Jewellery Item'),
                    'gold_weight'        => (float)$r['gold_weight'],
                    'silver_weight'      => (float)$r['silver_weight'],
                    'profit_gold_fine'   => (float)$r['profit_gold_fine'],
                    'profit_silver_fine' => (float)$r['profit_silver_fine'],
                    'profit_in_amount'   => (float)$r['profit_in_amount'],
                    'sale_value'         => (float)$r['sale_value'],
                    'amount'             => (float)$r['amount'],
                    'branch_name'        => $r['branch_name'] ?? '',
                    'account_group'      => $r['account_group'] ?? '',
                ];
            }, $calculatedRecords);

            // Sorting
            usort($rows, function ($a, $b) use ($sortBy, $sortOrder) {
                $vA = $a[$sortBy] ?? $a['voucher_date'];
                $vB = $b[$sortBy] ?? $b['voucher_date'];
                $cmp = ($vA < $vB) ? -1 : (($vA > $vB) ? 1 : 0);
                return $sortOrder === 'desc' ? -$cmp : $cmp;
            });

            $total = count($rows);
            $totalPages = max(1, (int)ceil($total / $limit));
            $offset = ($page - 1) * $limit;
            $items = array_slice($rows, $offset, $limit);

            return [
                'items'       => $items,
                'total'       => $total,
                'page'        => $page,
                'limit'       => $limit,
                'total_pages' => $totalPages,
                'report_type' => 'voucher_wise',
                'avg_rates'   => $avgRates,
            ];
        }

        // Detailed Report (Customer-wise Grouped)
        $customerGroups = [];
        foreach ($calculatedRecords as $r) {
            $customerName = trim($r['party_name']);
            if ($customerName === '') $customerName = 'Unknown Customer';

            if (!isset($customerGroups[$customerName])) {
                $customerGroups[$customerName] = [
                    'account_name'       => $customerName,
                    'sold_gold_weight'   => 0.0,
                    'sold_silver_weight' => 0.0,
                    'profit_gold_fine'   => 0.0,
                    'profit_silver_fine' => 0.0,
                    'profit_in_amount'   => 0.0,
                    'voucher_count'      => 0,
                    'branch_name'        => $r['branch_name'] ?? '',
                    'account_group'      => $r['account_group'] ?? '',
                ];
            }

            $customerGroups[$customerName]['sold_gold_weight'] += (float)$r['gold_weight'];
            $customerGroups[$customerName]['sold_silver_weight'] += (float)$r['silver_weight'];
            $customerGroups[$customerName]['profit_gold_fine'] += (float)$r['profit_gold_fine'];
            $customerGroups[$customerName]['profit_silver_fine'] += (float)$r['profit_silver_fine'];
            $customerGroups[$customerName]['profit_in_amount'] += (float)$r['profit_in_amount'];
            $customerGroups[$customerName]['voucher_count'] += 1;
        }

        // Format rounded values
        $rows = array_values(array_map(function ($c) {
            return [
                'account_name'       => $c['account_name'],
                'sold_gold_weight'   => round($c['sold_gold_weight'], 3),
                'sold_silver_weight' => round($c['sold_silver_weight'], 3),
                'profit_gold_fine'   => round($c['profit_gold_fine'], 3),
                'profit_silver_fine' => round($c['profit_silver_fine'], 3),
                'profit_in_amount'   => round($c['profit_in_amount'], 2),
                'voucher_count'      => $c['voucher_count'],
                'branch_name'        => $c['branch_name'],
                'account_group'      => $c['account_group'],
            ];
        }, $customerGroups));

        // Sorting
        usort($rows, function ($a, $b) use ($sortBy, $sortOrder) {
            $vA = $a[$sortBy] ?? $a['account_name'];
            $vB = $b[$sortBy] ?? $b['account_name'];
            $cmp = ($vA < $vB) ? -1 : (($vA > $vB) ? 1 : 0);
            return $sortOrder === 'desc' ? -$cmp : $cmp;
        });

        $total = count($rows);
        $totalPages = max(1, (int)ceil($total / $limit));
        $offset = ($page - 1) * $limit;
        $items = array_slice($rows, $offset, $limit);

        return [
            'items'       => $items,
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => $totalPages,
            'report_type' => 'detailed',
            'avg_rates'   => $avgRates,
        ];
    }

    /**
     * Dynamic Bottom Summary Panel across ALL matching records (not just current page)
     */
    public static function getSummary(array $filters, string $reportType = 'detailed'): array {
        [$calculatedRecords, $avgRates] = self::getCalculatedRecords($filters);

        $goldWeight = 0.0;
        $silverWeight = 0.0;
        $goldProfit = 0.0;
        $silverProfit = 0.0;
        $amtProfit = 0.0;
        $vouchersCount = count($calculatedRecords);

        $customerSet = [];
        foreach ($calculatedRecords as $r) {
            $goldWeight += (float)$r['gold_weight'];
            $silverWeight += (float)$r['silver_weight'];
            $goldProfit += (float)$r['profit_gold_fine'];
            $silverProfit += (float)$r['profit_silver_fine'];
            $amtProfit += (float)$r['profit_in_amount'];
            if (!empty($r['party_name'])) {
                $customerSet[trim($r['party_name'])] = true;
            }
        }

        return [
            'total_customers'    => count($customerSet),
            'total_vouchers'     => $vouchersCount,
            'gold_weight'        => round($goldWeight, 3),
            'silver_weight'      => round($silverWeight, 3),
            'gold_profit_fine'   => round($goldProfit, 3),
            'silver_profit_fine' => round($silverProfit, 3),
            'profit_in_amount'   => round($amtProfit, 2),
            'gold_avg_rate'      => $avgRates['gold_avg_purchase_rate'] ?? 7800.00,
            'silver_avg_rate'    => $avgRates['silver_avg_purchase_rate'] ?? 78.50,
        ];
    }

    /**
     * Distinct options for City, Group, Salesman, and Site filters
     */
    public static function filterOptions(): array {
        $db = Database::getConnection();

        // 1. Cities
        $cities = [];
        // From customer table
        $cStmt = $db->query("SELECT DISTINCT City FROM customer WHERE City IS NOT NULL AND TRIM(City) != '' ORDER BY City");
        while ($r = $cStmt->fetch(PDO::FETCH_COLUMN)) {
            $cities[trim($r)] = true;
        }
        // From branches
        $bStmt = $db->query("SELECT DISTINCT city FROM branches WHERE city IS NOT NULL AND TRIM(city) != '' ORDER BY city");
        while ($r = $bStmt->fetch(PDO::FETCH_COLUMN)) {
            $cities[trim($r)] = true;
        }
        // From accounts
        $aStmt = $db->query("SELECT DISTINCT city FROM accounts WHERE city IS NOT NULL AND TRIM(city) != '' ORDER BY city");
        while ($r = $aStmt->fetch(PDO::FETCH_COLUMN)) {
            $cities[trim($r)] = true;
        }
        ksort($cities);

        // 2. Groups (from sale_register)
        $grpStmt = $db->query("SELECT DISTINCT account_group FROM sale_register WHERE account_group IS NOT NULL AND TRIM(account_group) != '' AND deleted_at IS NULL ORDER BY account_group");
        $groups = $grpStmt->fetchAll(PDO::FETCH_COLUMN);

        // 3. Salesmen (from sale_register login_name)
        $smanStmt = $db->query("SELECT DISTINCT login_name FROM sale_register WHERE login_name IS NOT NULL AND TRIM(login_name) != '' AND deleted_at IS NULL ORDER BY login_name");
        $salesmen = $smanStmt->fetchAll(PDO::FETCH_COLUMN);

        // 4. Sites (Branches)
        $siteStmt = $db->query("SELECT DISTINCT branch_name FROM sale_register WHERE branch_name IS NOT NULL AND TRIM(branch_name) != '' AND deleted_at IS NULL ORDER BY branch_name");
        $sites = $siteStmt->fetchAll(PDO::FETCH_COLUMN);

        return [
            'cities'   => array_values(array_keys($cities)),
            'groups'   => array_values($groups),
            'salesmen' => array_values($salesmen),
            'sites'    => array_values($sites),
        ];
    }

    /**
     * Export full data respecting active filters
     */
    public static function export(array $filters, string $reportType = 'detailed'): array {
        $paginated = self::paginate($filters, 'account_name', 'asc', 1, 10000, $reportType);
        return $paginated['items'] ?? [];
    }
}
