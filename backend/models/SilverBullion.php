<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class SilverBullion {
    private static array $sortableColumns = [
        'id'               => 'b.id',
        'date_cr'          => 'b.date_cr',
        'date_dr'          => 'b.date_dr',
        'transaction_date' => 'COALESCE(b.date_cr, b.date_dr, b.created_at)',
        'voucher_no'       => 'COALESCE(b.vou_no_cr, b.vou_no_dr)',
        'party_name'       => 'COALESCE(b.ac_name_cr, b.ac_name_dr)',
        'fine_weight'      => 'b.fine_cr',
        'silver_rate'      => 'b.p_rate_cr',
        'amount'           => 'b.amount_cr',
        'fine_weight_dr'   => 'b.fine_dr',
        'silver_rate_dr'   => 'b.s_rate_dr',
        'amount_dr'        => 'b.amount_dr',
        'created_at'       => 'b.created_at',
    ];

    public static function buildWhere(array $filters): array {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['search'])) {
            $s = '%' . trim($filters['search']) . '%';
            $where[] = '(b.ac_name_cr LIKE :s1 OR b.ac_name_dr LIKE :s2 OR b.vou_no_cr LIKE :s3 OR b.vou_no_dr LIKE :s4 OR b.remarks LIKE :s5)';
            $params['s1'] = $s;
            $params['s2'] = $s;
            $params['s3'] = $s;
            $params['s4'] = $s;
            $params['s5'] = $s;
        }

        $fromDate = self::normalizeDate($filters['from_date'] ?? null);
        if (!empty($fromDate)) {
            $where[] = '(b.date_cr >= :f_from1 OR b.date_dr >= :f_from2 OR (b.date_cr IS NULL AND b.date_dr IS NULL AND DATE(b.created_at) >= :f_from3))';
            $params['f_from1'] = $fromDate;
            $params['f_from2'] = $fromDate;
            $params['f_from3'] = $fromDate;
        }

        $toDate = self::normalizeDate($filters['to_date'] ?? null);
        if (!empty($toDate)) {
            $where[] = '(b.date_cr <= :f_to1 OR b.date_dr <= :f_to2 OR (b.date_cr IS NULL AND b.date_dr IS NULL AND DATE(b.created_at) <= :f_to3))';
            $params['f_to1'] = $toDate;
            $params['f_to2'] = $toDate;
            $params['f_to3'] = $toDate;
        }

        if (!empty($filters['account_group_name']) && $filters['account_group_name'] !== 'all' && $filters['account_group_name'] !== 'ALL') {
            $where[] = 'b.account_group_name = :f_grp';
            $params['f_grp'] = trim($filters['account_group_name']);
        }

        if (!empty($filters['party_name']) && $filters['party_name'] !== 'all' && $filters['party_name'] !== 'ALL') {
            $where[] = '(b.ac_name_cr = :f_party1 OR b.ac_name_dr = :f_party2)';
            $params['f_party1'] = trim($filters['party_name']);
            $params['f_party2'] = trim($filters['party_name']);
        }

        if (!empty($filters['account_city']) && $filters['account_city'] !== 'all' && $filters['account_city'] !== 'ALL') {
            $where[] = 'b.account_city = :f_city';
            $params['f_city'] = trim($filters['account_city']);
        }

        if (!empty($filters['user_name']) && $filters['user_name'] !== 'all' && $filters['user_name'] !== 'ALL') {
            $where[] = 'b.user_name = :f_user';
            $params['f_user'] = trim($filters['user_name']);
        }

        if (!empty($filters['salesman_name']) && $filters['salesman_name'] !== 'all' && $filters['salesman_name'] !== 'ALL') {
            $where[] = 'b.salesman_name = :f_sman';
            $params['f_sman'] = trim($filters['salesman_name']);
        }

        if (!empty($filters['agent_name']) && $filters['agent_name'] !== 'all' && $filters['agent_name'] !== 'ALL') {
            $where[] = 'b.agent_name = :f_agent';
            $params['f_agent'] = trim($filters['agent_name']);
        }

        if (isset($filters['bhav']) && $filters['bhav'] !== '' && $filters['bhav'] !== null && $filters['bhav'] !== false && $filters['bhav'] !== 'all') {
            $where[] = 'b.bhav = :f_bhav';
            $params['f_bhav'] = (int)$filters['bhav'];
        }

        if (isset($filters['wo_sale']) && $filters['wo_sale'] !== '' && $filters['wo_sale'] !== null && $filters['wo_sale'] !== false && $filters['wo_sale'] !== 'all') {
            $where[] = 'b.wo_sale = :f_wosale';
            $params['f_wosale'] = (int)$filters['wo_sale'];
        }

        if (isset($filters['including_labour']) && $filters['including_labour'] !== '' && $filters['including_labour'] !== null && $filters['including_labour'] !== false && $filters['including_labour'] !== 'all') {
            $where[] = 'b.including_labour = :f_incl_labour';
            $params['f_incl_labour'] = (int)$filters['including_labour'];
        }

        if (isset($filters['exclude_rate_book']) && $filters['exclude_rate_book'] !== '' && $filters['exclude_rate_book'] !== null && $filters['exclude_rate_book'] !== false && $filters['exclude_rate_book'] !== 'all') {
            $where[] = 'b.exclude_rate_book = :f_excl_rate_book';
            $params['f_excl_rate_book'] = (int)$filters['exclude_rate_book'];
        }

        return [implode(' AND ', $where), $params];
    }

    public static function paginate(
        array $filters = [],
        string $sortBy = 'transaction_date',
        string $sortOrder = 'desc',
        int $page = 1,
        int $limit = 20
    ): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhere($filters);

        // Calculate totals across ALL filtered rows for current date range / filters
        $sumSql = "SELECT 
                    COUNT(*) as total_count,
                    COALESCE(SUM(b.fine_cr), 0) as total_cr_fine,
                    COALESCE(SUM(b.amount_cr), 0) as total_cr_amount,
                    COALESCE(SUM(b.fine_dr), 0) as total_dr_fine,
                    COALESCE(SUM(b.amount_dr), 0) as total_dr_amount
                   FROM silver_bullion b
                   WHERE {$whereSql}";

        $sumStmt = $db->prepare($sumSql);
        $sumStmt->execute($params);
        $totalsRow = $sumStmt->fetch(PDO::FETCH_ASSOC);

        $totalRecords = (int)($totalsRow['total_count'] ?? 0);
        $totalCrFine = (float)($totalsRow['total_cr_fine'] ?? 0);
        $totalCrAmount = (float)($totalsRow['total_cr_amount'] ?? 0);
        $totalDrFine = (float)($totalsRow['total_dr_fine'] ?? 0);
        $totalDrAmount = (float)($totalsRow['total_dr_amount'] ?? 0);

        $avgCrRate = $totalCrFine > 0 ? round($totalCrAmount / $totalCrFine, 2) : 0.0;
        $avgDrRate = $totalDrFine > 0 ? round($totalDrAmount / $totalDrFine, 2) : 0.0;

        // Calculate Opening Balance prior to `from_date`
        $openingFine = 0.0;
        $openingAmount = 0.0;
        $openingRate = 0.0;

        if (!empty($filters['from_date'])) {
            $openSql = "SELECT 
                        COALESCE(SUM(b.fine_cr), 0) - COALESCE(SUM(b.fine_dr), 0) as open_fine,
                        COALESCE(SUM(b.amount_cr), 0) - COALESCE(SUM(b.amount_dr), 0) as open_amount
                        FROM silver_bullion b
                        WHERE (b.date_cr < :open_from1 OR (b.date_cr IS NULL AND b.date_dr < :open_from2))";
            $openStmt = $db->prepare($openSql);
            $openStmt->execute([
                'open_from1' => $filters['from_date'],
                'open_from2' => $filters['from_date'],
            ]);
            $openRow = $openStmt->fetch(PDO::FETCH_ASSOC);

            if ($openRow) {
                $openingFine = (float)$openRow['open_fine'];
                $openingAmount = (float)$openRow['open_amount'];
            }
        }

        if ($openingFine != 0.0) {
            $openingRate = round(abs($openingAmount / $openingFine), 2);
        }

        // Summary calculations
        $dayDiffFine = $totalCrFine - $totalDrFine;
        $dayDiffAmount = $totalCrAmount - $totalDrAmount;
        $dayDiffRate = $dayDiffFine != 0 ? round(abs($dayDiffAmount / $dayDiffFine), 2) : 0.0;

        $avgRateDiff = round($avgCrRate - $avgDrRate, 2);
        $avgRateAmountLG = round($avgRateDiff * $dayDiffFine, 2);

        $closingFine = $openingFine + $dayDiffFine;
        $closingAmount = $openingAmount + $dayDiffAmount;
        $closingRate = $closingFine != 0 ? round(abs($closingAmount / $closingFine), 2) : 0.0;

        // Determine sorting column
        $sortColumn = self::$sortableColumns[$sortBy] ?? 'b.id';
        $sortDir = strtolower($sortOrder) === 'asc' ? 'ASC' : 'DESC';

        // Pagination offsets
        $offset = ($page - 1) * $limit;

        $listSql = "SELECT b.*
                    FROM silver_bullion b
                    WHERE {$whereSql}
                    ORDER BY {$sortColumn} {$sortDir}, b.id DESC
                    LIMIT :lim OFFSET :off";

        $listStmt = $db->prepare($listSql);
        foreach ($params as $k => $v) {
            $listStmt->bindValue(":{$k}", $v);
        }
        $listStmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $listStmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $listStmt->execute();

        $rows = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        // Map database columns to model records
        $items = array_map(function ($row) {
            $fineCr = (float)($row['fine_cr'] ?? 0);
            $pRateCr = (float)($row['p_rate_cr'] ?? 0);
            $amountCr = (float)($row['amount_cr'] ?? 0);
            $fineDr = (float)($row['fine_dr'] ?? 0);
            $sRateDr = (float)($row['s_rate_dr'] ?? 0);
            $amountDr = (float)($row['amount_dr'] ?? 0);

            $dateCr = $row['date_cr'] ?? '';
            $dateDr = $row['date_dr'] ?? '';
            $vouCr = $row['vou_no_cr'] ?? '';
            $vouDr = $row['vou_no_dr'] ?? '';
            $acNameCr = $row['ac_name_cr'] ?? '';
            $acNameDr = $row['ac_name_dr'] ?? '';

            $isCr = $fineCr > 0 || $amountCr > 0 || !empty($acNameCr);
            $type = $isCr ? 'CR' : 'DR';

            return [
                'id'                 => (int)$row['id'],
                // Native dual-sided table columns:
                'date_cr'            => $dateCr,
                'vou_no_cr'          => $vouCr,
                'ac_name_cr'         => $acNameCr,
                'fine_cr'            => $fineCr,
                'p_rate_cr'          => $pRateCr,
                'amount_cr'          => $amountCr,
                'date_dr'            => $dateDr,
                'vou_no_dr'          => $vouDr,
                'ac_name_dr'         => $acNameDr,
                'fine_dr'            => $fineDr,
                's_rate_dr'          => $sRateDr,
                'amount_dr'          => $amountDr,
                // Normalized generic fields for forms and views:
                'transaction_date'   => $dateCr ?: ($dateDr ?: substr($row['created_at'] ?? '', 0, 10)),
                'voucher_no'         => $vouCr ?: $vouDr,
                'transaction_type'   => $type,
                'party_name'         => $acNameCr ?: $acNameDr,
                'fine_weight'        => $fineCr,
                'silver_rate'        => $pRateCr,
                'amount'             => $amountCr,
                'fine_weight_dr'     => $fineDr,
                'silver_rate_dr'     => $sRateDr,
                'amount_dr'          => $amountDr,
                'account_group_name' => $row['account_group_name'] ?? '',
                'account_city'       => $row['account_city'] ?? '',
                'user_name'          => $row['user_name'] ?? 'Admin',
                'salesman_name'      => $row['salesman_name'] ?? '',
                'agent_name'         => $row['agent_name'] ?? '',
                'bhav'               => (int)($row['bhav'] ?? 0),
                'wo_sale'            => (int)($row['wo_sale'] ?? 0),
                'including_labour'   => (int)($row['including_labour'] ?? 0),
                'exclude_rate_book'  => (int)($row['exclude_rate_book'] ?? 0),
                'remarks'            => $row['remarks'] ?? '',
                'created_at'         => $row['created_at'] ?? '',
                'updated_at'         => $row['updated_at'] ?? ($row['created_at'] ?? ''),
            ];
        }, $rows);

        $totalPages = $limit > 0 ? (int)ceil($totalRecords / $limit) : 1;

        return [
            'items'           => $items,
            'total'           => $totalRecords,
            'page'            => $page,
            'limit'           => $limit,
            'total_pages'     => max(1, $totalPages),
            'totals'          => [
                'total_cr_fine'   => $totalCrFine,
                'total_cr_amount' => $totalCrAmount,
                'avg_cr_rate'     => $avgCrRate,
                'total_dr_fine'   => $totalDrFine,
                'total_dr_amount' => $totalDrAmount,
                'avg_dr_rate'     => $avgDrRate,
            ],
            'opening_balance' => [
                'fine'   => $openingFine,
                'amount' => $openingAmount,
                'rate'   => $openingRate,
                'val4'   => 0,
            ],
            'summary'         => [
                'day_difference_fine'   => $dayDiffFine,
                'day_difference_rate'   => $dayDiffRate,
                'day_difference_amount' => $dayDiffAmount,
                'avg_rate_lg_rate'      => $avgRateDiff,
                'avg_rate_lg_amount'    => $avgRateAmountLG,
                'closing_fine'          => $closingFine,
                'closing_amount'        => $closingAmount,
                'closing_rate'          => $closingRate,
                'closing_val4'          => 0,
            ],
        ];
    }

    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM silver_bullion WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;

        $fineCr = (float)($row['fine_cr'] ?? 0);
        $pRateCr = (float)($row['p_rate_cr'] ?? 0);
        $amountCr = (float)($row['amount_cr'] ?? 0);
        $fineDr = (float)($row['fine_dr'] ?? 0);
        $sRateDr = (float)($row['s_rate_dr'] ?? 0);
        $amountDr = (float)($row['amount_dr'] ?? 0);

        $dateCr = $row['date_cr'] ?? '';
        $dateDr = $row['date_dr'] ?? '';
        $vouCr = $row['vou_no_cr'] ?? '';
        $vouDr = $row['vou_no_dr'] ?? '';
        $acNameCr = $row['ac_name_cr'] ?? '';
        $acNameDr = $row['ac_name_dr'] ?? '';

        $isCr = $fineCr > 0 || $amountCr > 0 || !empty($acNameCr);
        $type = $isCr ? 'CR' : 'DR';

        return [
            'id'                 => (int)$row['id'],
            'date_cr'            => $dateCr,
            'vou_no_cr'          => $vouCr,
            'ac_name_cr'         => $acNameCr,
            'fine_cr'            => $fineCr,
            'p_rate_cr'          => $pRateCr,
            'amount_cr'          => $amountCr,
            'date_dr'            => $dateDr,
            'vou_no_dr'          => $vouDr,
            'ac_name_dr'         => $acNameDr,
            'fine_dr'            => $fineDr,
            's_rate_dr'          => $sRateDr,
            'amount_dr'          => $amountDr,
            'transaction_date'   => $dateCr ?: ($dateDr ?: substr($row['created_at'] ?? '', 0, 10)),
            'voucher_no'         => $vouCr ?: $vouDr,
            'transaction_type'   => $type,
            'party_name'         => $acNameCr ?: $acNameDr,
            'fine_weight'        => $fineCr,
            'silver_rate'        => $pRateCr,
            'amount'             => $amountCr,
            'fine_weight_dr'     => $fineDr,
            'silver_rate_dr'     => $sRateDr,
            'amount_dr'          => $amountDr,
            'account_group_name' => $row['account_group_name'] ?? '',
            'account_city'       => $row['account_city'] ?? '',
            'user_name'          => $row['user_name'] ?? 'Admin',
            'salesman_name'      => $row['salesman_name'] ?? '',
            'agent_name'         => $row['agent_name'] ?? '',
            'bhav'               => (int)($row['bhav'] ?? 0),
            'wo_sale'            => (int)($row['wo_sale'] ?? 0),
            'including_labour'   => (int)($row['including_labour'] ?? 0),
            'exclude_rate_book'  => (int)($row['exclude_rate_book'] ?? 0),
            'remarks'            => $row['remarks'] ?? '',
            'created_at'         => $row['created_at'] ?? '',
            'updated_at'         => $row['updated_at'] ?? ($row['created_at'] ?? ''),
        ];
    }

    public static function create(array $data): array {
        $db = Database::getConnection();

        $transactionDate = !empty($data['transaction_date']) ? $data['transaction_date'] : date('Y-m-d');
        $transactionType = strtoupper(trim((string)($data['transaction_type'] ?? 'CR')));
        if (!in_array($transactionType, ['CR', 'DR'])) {
            $transactionType = 'CR';
        }

        $voucherNo = !empty($data['voucher_no']) ? trim((string)$data['voucher_no']) : '';
        if ($voucherNo === '') {
            $voucherNo = 'SB-' . $transactionType . '-' . date('ymd') . '-' . rand(100, 999);
        }

        $partyName = trim((string)($data['party_name'] ?? ($data['ac_name_cr'] ?? ($data['ac_name_dr'] ?? ''))));
        if ($partyName === '') {
            throw new Exception('Party Name is required.');
        }

        $dateCr = !empty($data['date_cr']) ? $data['date_cr'] : ($transactionType === 'CR' ? $transactionDate : null);
        $vouCr = !empty($data['vou_no_cr']) ? $data['vou_no_cr'] : ($transactionType === 'CR' ? $voucherNo : null);
        $acNameCr = !empty($data['ac_name_cr']) ? $data['ac_name_cr'] : ($transactionType === 'CR' ? $partyName : null);
        $fineCr = isset($data['fine_cr']) ? (float)$data['fine_cr'] : (isset($data['fine_weight']) ? (float)$data['fine_weight'] : 0.0);
        $pRateCr = isset($data['p_rate_cr']) ? (float)$data['p_rate_cr'] : (isset($data['silver_rate']) ? (float)$data['silver_rate'] : 0.0);
        $amountCr = isset($data['amount_cr']) ? (float)$data['amount_cr'] : (isset($data['amount']) ? (float)$data['amount'] : ($fineCr * $pRateCr));

        $dateDr = !empty($data['date_dr']) ? $data['date_dr'] : ($transactionType === 'DR' ? $transactionDate : null);
        $vouDr = !empty($data['vou_no_dr']) ? $data['vou_no_dr'] : ($transactionType === 'DR' ? $voucherNo : null);
        $acNameDr = !empty($data['ac_name_dr']) ? $data['ac_name_dr'] : ($transactionType === 'DR' ? $partyName : null);
        $fineDr = isset($data['fine_dr']) ? (float)$data['fine_dr'] : (isset($data['fine_weight_dr']) ? (float)$data['fine_weight_dr'] : 0.0);
        $sRateDr = isset($data['s_rate_dr']) ? (float)$data['s_rate_dr'] : (isset($data['silver_rate_dr']) ? (float)$data['silver_rate_dr'] : 0.0);
        $amountDr = isset($data['amount_dr']) ? (float)$data['amount_dr'] : ($fineDr * $sRateDr);

        if ($transactionType === 'CR') {
            if ($amountCr == 0.0 && $fineCr > 0 && $pRateCr > 0) {
                $amountCr = round($fineCr * $pRateCr, 2);
            }
        } else if ($transactionType === 'DR') {
            if ($amountDr == 0.0 && $fineDr > 0 && $sRateDr > 0) {
                $amountDr = round($fineDr * $sRateDr, 2);
            }
        }

        $accountGroupName = trim((string)($data['account_group_name'] ?? ''));
        $accountCity = trim((string)($data['account_city'] ?? ''));
        $userName = trim((string)($data['user_name'] ?? 'Admin'));
        $salesmanName = trim((string)($data['salesman_name'] ?? ''));
        $agentName = trim((string)($data['agent_name'] ?? ''));

        $bhav = !empty($data['bhav']) ? 1 : 0;
        $woSale = !empty($data['wo_sale']) ? 1 : 0;
        $includingLabour = !empty($data['including_labour']) ? 1 : 0;
        $excludeRateBook = !empty($data['exclude_rate_book']) ? 1 : 0;
        $remarks = trim((string)($data['remarks'] ?? ''));

        $sql = "INSERT INTO silver_bullion (
                    date_cr, vou_no_cr, ac_name_cr, fine_cr, p_rate_cr, amount_cr,
                    date_dr, vou_no_dr, ac_name_dr, fine_dr, s_rate_dr, amount_dr,
                    account_group_name, account_city, user_name, salesman_name, agent_name,
                    bhav, wo_sale, including_labour, exclude_rate_book, remarks, created_at
                ) VALUES (
                    :date_cr, :vou_no_cr, :ac_name_cr, :fine_cr, :p_rate_cr, :amount_cr,
                    :date_dr, :vou_no_dr, :ac_name_dr, :fine_dr, :s_rate_dr, :amount_dr,
                    :account_group_name, :account_city, :user_name, :salesman_name, :agent_name,
                    :bhav, :wo_sale, :including_labour, :exclude_rate_book, :remarks, NOW()
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'date_cr'            => $dateCr,
            'vou_no_cr'          => $vouCr,
            'ac_name_cr'         => $acNameCr,
            'fine_cr'            => $fineCr,
            'p_rate_cr'          => $pRateCr,
            'amount_cr'          => $amountCr,
            'date_dr'            => $dateDr,
            'vou_no_dr'          => $vouDr,
            'ac_name_dr'         => $acNameDr,
            'fine_dr'            => $fineDr,
            's_rate_dr'          => $sRateDr,
            'amount_dr'          => $amountDr,
            'account_group_name' => $accountGroupName,
            'account_city'       => $accountCity,
            'user_name'          => $userName,
            'salesman_name'      => $salesmanName,
            'agent_name'         => $agentName,
            'bhav'               => $bhav,
            'wo_sale'            => $woSale,
            'including_labour'   => $includingLabour,
            'exclude_rate_book'  => $excludeRateBook,
            'remarks'            => $remarks,
        ]);

        $id = (int)$db->lastInsertId();
        return self::findById($id);
    }

    public static function update(int $id, array $data): array {
        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Silver Bullion record #{$id} not found.");
        }

        $db = Database::getConnection();

        $transactionDate = !empty($data['transaction_date']) ? $data['transaction_date'] : $existing['transaction_date'];
        $transactionType = !empty($data['transaction_type']) ? strtoupper(trim((string)$data['transaction_type'])) : $existing['transaction_type'];
        $voucherNo = isset($data['voucher_no']) ? trim((string)$data['voucher_no']) : $existing['voucher_no'];
        $partyName = isset($data['party_name']) ? trim((string)$data['party_name']) : $existing['party_name'];

        if ($partyName === '') {
            throw new Exception('Party Name is required.');
        }

        $dateCr = array_key_exists('date_cr', $data) ? $data['date_cr'] : ($transactionType === 'CR' ? $transactionDate : $existing['date_cr']);
        $vouCr = array_key_exists('vou_no_cr', $data) ? $data['vou_no_cr'] : ($transactionType === 'CR' ? $voucherNo : $existing['vou_no_cr']);
        $acNameCr = array_key_exists('ac_name_cr', $data) ? $data['ac_name_cr'] : ($transactionType === 'CR' ? $partyName : $existing['ac_name_cr']);
        $fineCr = isset($data['fine_cr']) ? (float)$data['fine_cr'] : (isset($data['fine_weight']) ? (float)$data['fine_weight'] : (float)$existing['fine_cr']);
        $pRateCr = isset($data['p_rate_cr']) ? (float)$data['p_rate_cr'] : (isset($data['silver_rate']) ? (float)$data['silver_rate'] : (float)$existing['p_rate_cr']);
        $amountCr = isset($data['amount_cr']) ? (float)$data['amount_cr'] : (isset($data['amount']) ? (float)$data['amount'] : (float)$existing['amount_cr']);

        $dateDr = array_key_exists('date_dr', $data) ? $data['date_dr'] : ($transactionType === 'DR' ? $transactionDate : $existing['date_dr']);
        $vouDr = array_key_exists('vou_no_dr', $data) ? $data['vou_no_dr'] : ($transactionType === 'DR' ? $voucherNo : $existing['vou_no_dr']);
        $acNameDr = array_key_exists('ac_name_dr', $data) ? $data['ac_name_dr'] : ($transactionType === 'DR' ? $partyName : $existing['ac_name_dr']);
        $fineDr = isset($data['fine_dr']) ? (float)$data['fine_dr'] : (isset($data['fine_weight_dr']) ? (float)$data['fine_weight_dr'] : (float)$existing['fine_dr']);
        $sRateDr = isset($data['s_rate_dr']) ? (float)$data['s_rate_dr'] : (isset($data['silver_rate_dr']) ? (float)$data['silver_rate_dr'] : (float)$existing['s_rate_dr']);
        $amountDr = isset($data['amount_dr']) ? (float)$data['amount_dr'] : (float)$existing['amount_dr'];

        if ($transactionType === 'CR' && $amountCr == 0.0 && $fineCr > 0 && $pRateCr > 0) {
            $amountCr = round($fineCr * $pRateCr, 2);
        } else if ($transactionType === 'DR' && $amountDr == 0.0 && $fineDr > 0 && $sRateDr > 0) {
            $amountDr = round($fineDr * $sRateDr, 2);
        }

        $accountGroupName = isset($data['account_group_name']) ? trim((string)$data['account_group_name']) : $existing['account_group_name'];
        $accountCity = isset($data['account_city']) ? trim((string)$data['account_city']) : $existing['account_city'];
        $userName = isset($data['user_name']) ? trim((string)$data['user_name']) : $existing['user_name'];
        $salesmanName = isset($data['salesman_name']) ? trim((string)$data['salesman_name']) : $existing['salesman_name'];
        $agentName = isset($data['agent_name']) ? trim((string)$data['agent_name']) : $existing['agent_name'];

        $bhav = isset($data['bhav']) ? (!empty($data['bhav']) ? 1 : 0) : $existing['bhav'];
        $woSale = isset($data['wo_sale']) ? (!empty($data['wo_sale']) ? 1 : 0) : $existing['wo_sale'];
        $includingLabour = isset($data['including_labour']) ? (!empty($data['including_labour']) ? 1 : 0) : $existing['including_labour'];
        $excludeRateBook = isset($data['exclude_rate_book']) ? (!empty($data['exclude_rate_book']) ? 1 : 0) : $existing['exclude_rate_book'];
        $remarks = isset($data['remarks']) ? trim((string)$data['remarks']) : $existing['remarks'];

        $sql = "UPDATE silver_bullion SET
                    date_cr            = :date_cr,
                    vou_no_cr          = :vou_no_cr,
                    ac_name_cr         = :ac_name_cr,
                    fine_cr            = :fine_cr,
                    p_rate_cr          = :p_rate_cr,
                    amount_cr          = :amount_cr,
                    date_dr            = :date_dr,
                    vou_no_dr          = :vou_no_dr,
                    ac_name_dr         = :ac_name_dr,
                    fine_dr            = :fine_dr,
                    s_rate_dr          = :s_rate_dr,
                    amount_dr          = :amount_dr,
                    account_group_name = :account_group_name,
                    account_city       = :account_city,
                    user_name          = :user_name,
                    salesman_name      = :salesman_name,
                    agent_name         = :agent_name,
                    bhav               = :bhav,
                    wo_sale            = :wo_sale,
                    including_labour   = :including_labour,
                    exclude_rate_book  = :exclude_rate_book,
                    remarks            = :remarks,
                    updated_at         = NOW()
                WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'id'                 => $id,
            'date_cr'            => $dateCr,
            'vou_no_cr'          => $vouCr,
            'ac_name_cr'         => $acNameCr,
            'fine_cr'            => $fineCr,
            'p_rate_cr'          => $pRateCr,
            'amount_cr'          => $amountCr,
            'date_dr'            => $dateDr,
            'vou_no_dr'          => $vouDr,
            'ac_name_dr'         => $acNameDr,
            'fine_dr'            => $fineDr,
            's_rate_dr'          => $sRateDr,
            'amount_dr'          => $amountDr,
            'account_group_name' => $accountGroupName,
            'account_city'       => $accountCity,
            'user_name'          => $userName,
            'salesman_name'      => $salesmanName,
            'agent_name'         => $agentName,
            'bhav'               => $bhav,
            'wo_sale'            => $woSale,
            'including_labour'   => $includingLabour,
            'exclude_rate_book'  => $excludeRateBook,
            'remarks'            => $remarks,
        ]);

        return self::findById($id);
    }

    public static function delete(int $id): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM silver_bullion WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public static function filterOptions(): array {
        $db = Database::getConnection();

        // Collect distinct parties from both credit and debit
        $partiesCr = $db->query("SELECT DISTINCT ac_name_cr FROM silver_bullion WHERE ac_name_cr IS NOT NULL AND TRIM(ac_name_cr) != ''")->fetchAll(PDO::FETCH_COLUMN);
        $partiesDr = $db->query("SELECT DISTINCT ac_name_dr FROM silver_bullion WHERE ac_name_dr IS NOT NULL AND TRIM(ac_name_dr) != ''")->fetchAll(PDO::FETCH_COLUMN);
        $parties = array_values(array_unique(array_filter(array_merge($partiesCr, $partiesDr))));
        sort($parties);

        if (empty($parties)) {
            $parties = $db->query("SELECT DISTINCT Name FROM customer ORDER BY Name ASC LIMIT 50")->fetchAll(PDO::FETCH_COLUMN);
        }

        // Groups
        $groups = $db->query("SELECT DISTINCT account_group_name FROM silver_bullion WHERE account_group_name IS NOT NULL AND TRIM(account_group_name) != ''")->fetchAll(PDO::FETCH_COLUMN);
        if (empty($groups)) {
            $groups = $db->query("SELECT DISTINCT name FROM account_groups ORDER BY name ASC")->fetchAll(PDO::FETCH_COLUMN);
        }

        // Cities
        $cities = $db->query("SELECT DISTINCT account_city FROM silver_bullion WHERE account_city IS NOT NULL AND TRIM(account_city) != ''")->fetchAll(PDO::FETCH_COLUMN);
        if (empty($cities)) {
            $cities = $db->query("SELECT DISTINCT City FROM customer WHERE City IS NOT NULL AND City != '' ORDER BY City ASC LIMIT 30")->fetchAll(PDO::FETCH_COLUMN);
        }

        // Users
        $users = $db->query("SELECT DISTINCT user_name FROM silver_bullion WHERE user_name IS NOT NULL AND TRIM(user_name) != ''")->fetchAll(PDO::FETCH_COLUMN);
        if (empty($users)) {
            $users = $db->query("SELECT DISTINCT username FROM users ORDER BY username ASC")->fetchAll(PDO::FETCH_COLUMN);
        }

        // Salesmen
        $salesmen = $db->query("SELECT DISTINCT salesman_name FROM silver_bullion WHERE salesman_name IS NOT NULL AND TRIM(salesman_name) != ''")->fetchAll(PDO::FETCH_COLUMN);
        if (empty($salesmen)) {
            $salesmen = ['Amit', 'Rakesh', 'Paresh', 'Suresh', 'Deepak'];
        }

        // Agents
        $agents = $db->query("SELECT DISTINCT agent_name FROM silver_bullion WHERE agent_name IS NOT NULL AND TRIM(agent_name) != ''")->fetchAll(PDO::FETCH_COLUMN);
        if (empty($agents)) {
            $agents = ['Ketan', 'Nilesh', 'Manoj', 'Jayesh'];
        }

        return [
            'groups'   => $groups,
            'parties'  => $parties,
            'cities'   => $cities,
            'users'    => $users,
            'salesmen' => $salesmen,
            'agents'   => $agents,
        ];
    }

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
}
