<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class DailyTransaction {
    private static array $sortableColumns = [
        'id'               => 't.id',
        'transaction_date' => 't.transaction_date',
        'transaction_type' => 't.transaction_type',
        'party_name'       => 't.party_name',
        'ref_no'           => 't.ref_no',
        'pc'               => 't.pc',
        'gross_weight'     => 't.gross_weight',
        'net_weight'       => 't.net_weight',
        'dia_weight'       => 't.dia_weight',
        'stone_weight'     => 't.stone_weight',
        'gold_fine'        => 't.gold_fine',
        'silver_fine'      => 't.silver_fine',
        'total_amount'     => 't.total_amount',
        'created_at'       => 't.created_at',
    ];

    public static function buildWhere(array $filters): array {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['search'])) {
            $s = '%' . trim($filters['search']) . '%';
            $where[] = '(t.party_name LIKE :s1 OR t.ref_no LIKE :s2 OR t.narration LIKE :s3 OR t.student_details LIKE :s4)';
            $params['s1'] = $s;
            $params['s2'] = $s;
            $params['s3'] = $s;
            $params['s4'] = $s;
        }

        if (!empty($filters['from_date'])) {
            $where[] = 't.transaction_date >= :f_from';
            $params['f_from'] = $filters['from_date'];
        }

        if (!empty($filters['to_date'])) {
            $where[] = 't.transaction_date <= :f_to';
            $params['f_to'] = $filters['to_date'];
        }

        if (!empty($filters['group_name']) && $filters['group_name'] !== 'all' && $filters['group_name'] !== 'ALL') {
            $where[] = 't.group_name = :f_grp';
            $params['f_grp'] = trim($filters['group_name']);
        }

        if (!empty($filters['login_name']) && $filters['login_name'] !== 'all' && $filters['login_name'] !== 'ALL') {
            $where[] = 't.login_name = :f_login';
            $params['f_login'] = trim($filters['login_name']);
        }

        if (!empty($filters['stamp']) && $filters['stamp'] !== 'all' && $filters['stamp'] !== 'ALL') {
            $where[] = 't.stamp = :f_stamp';
            $params['f_stamp'] = trim($filters['stamp']);
        }

        if (!empty($filters['voucher_type']) && $filters['voucher_type'] !== 'all' && $filters['voucher_type'] !== 'ALL') {
            $where[] = 't.voucher_type = :f_vtype';
            $params['f_vtype'] = trim($filters['voucher_type']);
        }

        if (!empty($filters['party_name']) && $filters['party_name'] !== 'all' && $filters['party_name'] !== 'ALL') {
            $where[] = 't.party_name = :f_party';
            $params['f_party'] = trim($filters['party_name']);
        }

        if (!empty($filters['series']) && $filters['series'] !== 'all' && $filters['series'] !== 'ALL') {
            $where[] = 't.series = :f_series';
            $params['f_series'] = trim($filters['series']);
        }

        if (!empty($filters['site']) && $filters['site'] !== 'all' && $filters['site'] !== 'ALL') {
            $where[] = 't.site = :f_site';
            $params['f_site'] = trim($filters['site']);
        }

        if (!empty($filters['transaction_type']) && $filters['transaction_type'] !== 'all' && $filters['transaction_type'] !== 'ALL') {
            $where[] = 't.transaction_type = :f_ttype';
            $params['f_ttype'] = trim($filters['transaction_type']);
        }

        if (!empty($filters['is_undelivered'])) {
            $where[] = 't.is_undelivered = 1';
        }

        if (!empty($filters['stud_details'])) {
            $where[] = '(t.student_details IS NOT NULL AND TRIM(t.student_details) != "")';
        }

        if (!empty($filters['exclude'])) {
            // Exclude small / zero transactions
            $where[] = 't.total_amount != 0';
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

        // Calculate totals across ALL filtered rows
        $sumSql = "SELECT 
                    COUNT(*) as total_count,
                    COALESCE(SUM(t.pc), 0) as total_pc,
                    COALESCE(SUM(t.gross_weight), 0) as total_gross_weight,
                    COALESCE(SUM(t.net_weight), 0) as total_net_weight,
                    COALESCE(SUM(t.dia_weight), 0) as total_dia_weight,
                    COALESCE(SUM(t.stone_weight), 0) as total_stone_weight,
                    COALESCE(SUM(t.gold_fine), 0) as total_gold_fine,
                    COALESCE(SUM(t.silver_fine), 0) as total_silver_fine,
                    COALESCE(SUM(t.total_amount), 0) as total_amount
                   FROM daily_transactions t
                   WHERE {$whereSql}";

        $sumStmt = $db->prepare($sumSql);
        foreach ($params as $k => $v) {
            $sumStmt->bindValue($k, $v);
        }
        $sumStmt->execute();
        $summary = $sumStmt->fetch(PDO::FETCH_ASSOC);

        $totalRecords = (int)($summary['total_count'] ?? 0);
        $totalPages = $limit > 0 ? (int)ceil($totalRecords / $limit) : 1;

        $sortCol = self::$sortableColumns[$sortBy] ?? 't.transaction_date';
        $sortDir = strtolower($sortOrder) === 'asc' ? 'ASC' : 'DESC';

        $offset = max(0, ($page - 1) * $limit);
        $dataSql = "SELECT t.* FROM daily_transactions t
                    WHERE {$whereSql}
                    ORDER BY {$sortCol} {$sortDir}, t.id DESC
                    LIMIT :limit OFFSET :offset";

        $dataStmt = $db->prepare($dataSql);
        foreach ($params as $k => $v) {
            $dataStmt->bindValue($k, $v);
        }
        $dataStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $dataStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $dataStmt->execute();
        $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'items'       => array_map([self::class, 'formatRow'], $rows),
            'total'       => $totalRecords,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => $totalPages,
            'totals'      => [
                'total_pc'           => (int)($summary['total_pc'] ?? 0),
                'total_gross_weight' => (float)($summary['total_gross_weight'] ?? 0),
                'total_net_weight'   => (float)($summary['total_net_weight'] ?? 0),
                'total_dia_weight'   => (float)($summary['total_dia_weight'] ?? 0),
                'total_stone_weight' => (float)($summary['total_stone_weight'] ?? 0),
                'total_gold_fine'    => (float)($summary['total_gold_fine'] ?? 0),
                'total_silver_fine'  => (float)($summary['total_silver_fine'] ?? 0),
                'total_amount'       => (float)($summary['total_amount'] ?? 0),
            ]
        ];
    }

    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM daily_transactions WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? self::formatRow($row) : null;
    }

    public static function create(array $data): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            INSERT INTO daily_transactions (
                transaction_date, transaction_type, party_name, ref_no, narration,
                login_name, stamp, voucher_type, series, site, group_name,
                pc, gross_weight, net_weight, dia_weight, stone_weight,
                gold_fine, silver_fine, total_amount, is_undelivered, student_details,
                created_by, updated_by
            ) VALUES (
                :transaction_date, :transaction_type, :party_name, :ref_no, :narration,
                :login_name, :stamp, :voucher_type, :series, :site, :group_name,
                :pc, :gross_weight, :net_weight, :dia_weight, :stone_weight,
                :gold_fine, :silver_fine, :total_amount, :is_undelivered, :student_details,
                :created_by, :updated_by
            )
        ");

        $stmt->execute([
            ':transaction_date' => $data['transaction_date'] ?? date('Y-m-d'),
            ':transaction_type' => $data['transaction_type'] ?? 'Sale',
            ':party_name'       => trim($data['party_name'] ?? ''),
            ':ref_no'           => trim($data['ref_no'] ?? ''),
            ':narration'        => trim($data['narration'] ?? ''),
            ':login_name'       => $data['login_name'] ?? 'Admin',
            ':stamp'            => $data['stamp'] ?? '92.5',
            ':voucher_type'     => $data['voucher_type'] ?? 'Regular',
            ':series'           => $data['series'] ?? 'GST',
            ':site'             => $data['site'] ?? 'Main Store',
            ':group_name'       => $data['group_name'] ?? 'Sundry Debtors',
            ':pc'               => (int)($data['pc'] ?? 1),
            ':gross_weight'     => (float)($data['gross_weight'] ?? 0),
            ':net_weight'       => (float)($data['net_weight'] ?? 0),
            ':dia_weight'       => (float)($data['dia_weight'] ?? 0),
            ':stone_weight'     => (float)($data['stone_weight'] ?? 0),
            ':gold_fine'        => (float)($data['gold_fine'] ?? 0),
            ':silver_fine'      => (float)($data['silver_fine'] ?? 0),
            ':total_amount'     => (float)($data['total_amount'] ?? 0),
            ':is_undelivered'   => !empty($data['is_undelivered']) ? 1 : 0,
            ':student_details'  => !empty($data['student_details']) ? trim($data['student_details']) : null,
            ':created_by'       => $data['created_by'] ?? 'Admin',
            ':updated_by'       => $data['updated_by'] ?? 'Admin',
        ]);

        $id = (int)$db->lastInsertId();
        return self::findById($id);
    }

    public static function update(int $id, array $data): array {
        $db = Database::getConnection();
        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Transaction #{$id} not found.");
        }

        $stmt = $db->prepare("
            UPDATE daily_transactions SET
                transaction_date = :transaction_date,
                transaction_type = :transaction_type,
                party_name       = :party_name,
                ref_no           = :ref_no,
                narration        = :narration,
                login_name       = :login_name,
                stamp            = :stamp,
                voucher_type     = :voucher_type,
                series           = :series,
                site             = :site,
                group_name       = :group_name,
                pc               = :pc,
                gross_weight     = :gross_weight,
                net_weight       = :net_weight,
                dia_weight       = :dia_weight,
                stone_weight     = :stone_weight,
                gold_fine        = :gold_fine,
                silver_fine      = :silver_fine,
                total_amount     = :total_amount,
                is_undelivered   = :is_undelivered,
                student_details  = :student_details,
                updated_by       = :updated_by,
                updated_at       = NOW()
            WHERE id = :id
        ");

        $stmt->execute([
            ':id'               => $id,
            ':transaction_date' => $data['transaction_date'] ?? $existing['transaction_date'],
            ':transaction_type' => $data['transaction_type'] ?? $existing['transaction_type'],
            ':party_name'       => trim($data['party_name'] ?? $existing['party_name']),
            ':ref_no'           => trim($data['ref_no'] ?? $existing['ref_no']),
            ':narration'        => trim($data['narration'] ?? $existing['narration']),
            ':login_name'       => $data['login_name'] ?? $existing['login_name'],
            ':stamp'            => $data['stamp'] ?? $existing['stamp'],
            ':voucher_type'     => $data['voucher_type'] ?? $existing['voucher_type'],
            ':series'           => $data['series'] ?? $existing['series'],
            ':site'             => $data['site'] ?? $existing['site'],
            ':group_name'       => $data['group_name'] ?? $existing['group_name'],
            ':pc'               => isset($data['pc']) ? (int)$data['pc'] : $existing['pc'],
            ':gross_weight'     => isset($data['gross_weight']) ? (float)$data['gross_weight'] : $existing['gross_weight'],
            ':net_weight'       => isset($data['net_weight']) ? (float)$data['net_weight'] : $existing['net_weight'],
            ':dia_weight'       => isset($data['dia_weight']) ? (float)$data['dia_weight'] : $existing['dia_weight'],
            ':stone_weight'     => isset($data['stone_weight']) ? (float)$data['stone_weight'] : $existing['stone_weight'],
            ':gold_fine'        => isset($data['gold_fine']) ? (float)$data['gold_fine'] : $existing['gold_fine'],
            ':silver_fine'      => isset($data['silver_fine']) ? (float)$data['silver_fine'] : $existing['silver_fine'],
            ':total_amount'     => isset($data['total_amount']) ? (float)$data['total_amount'] : $existing['total_amount'],
            ':is_undelivered'   => isset($data['is_undelivered']) ? (!empty($data['is_undelivered']) ? 1 : 0) : $existing['is_undelivered'],
            ':student_details'  => isset($data['student_details']) ? trim($data['student_details']) : $existing['student_details'],
            ':updated_by'       => $data['updated_by'] ?? 'Admin',
        ]);

        return self::findById($id);
    }

    public static function delete(int $id): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM daily_transactions WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    public static function getFilterOptions(): array {
        $db = Database::getConnection();
        return [
            'groups'        => $db->query("SELECT DISTINCT group_name FROM daily_transactions WHERE group_name IS NOT NULL AND TRIM(group_name) != '' ORDER BY group_name ASC")->fetchAll(PDO::FETCH_COLUMN),
            'logins'        => $db->query("SELECT DISTINCT login_name FROM daily_transactions WHERE login_name IS NOT NULL AND TRIM(login_name) != '' ORDER BY login_name ASC")->fetchAll(PDO::FETCH_COLUMN),
            'stamps'        => $db->query("SELECT DISTINCT stamp FROM daily_transactions WHERE stamp IS NOT NULL AND TRIM(stamp) != '' ORDER BY stamp ASC")->fetchAll(PDO::FETCH_COLUMN),
            'voucher_types' => $db->query("SELECT DISTINCT voucher_type FROM daily_transactions WHERE voucher_type IS NOT NULL AND TRIM(voucher_type) != '' ORDER BY voucher_type ASC")->fetchAll(PDO::FETCH_COLUMN),
            'series'        => $db->query("SELECT DISTINCT series FROM daily_transactions WHERE series IS NOT NULL AND TRIM(series) != '' ORDER BY series ASC")->fetchAll(PDO::FETCH_COLUMN),
            'sites'         => $db->query("SELECT DISTINCT site FROM daily_transactions WHERE site IS NOT NULL AND TRIM(site) != '' ORDER BY site ASC")->fetchAll(PDO::FETCH_COLUMN),
            'types'         => ['Sale', 'Purchase', 'Receipt', 'Payment', 'Issue', 'Receive', 'Journal', 'Contra'],
            'parties'       => $db->query("SELECT DISTINCT party_name FROM daily_transactions ORDER BY party_name ASC")->fetchAll(PDO::FETCH_COLUMN),
        ];
    }

    public static function getAllMatching(array $filters = [], string $sortBy = 'transaction_date', string $sortOrder = 'desc'): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhere($filters);

        $sortCol = self::$sortableColumns[$sortBy] ?? 't.transaction_date';
        $sortDir = strtolower($sortOrder) === 'asc' ? 'ASC' : 'DESC';

        $stmt = $db->prepare("SELECT t.* FROM daily_transactions t WHERE {$whereSql} ORDER BY {$sortCol} {$sortDir}, t.id DESC");
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map([self::class, 'formatRow'], $rows);
    }

    private static function formatRow(array $row): array {
        return [
            'id'               => (int)$row['id'],
            'transaction_date' => $row['transaction_date'],
            'transaction_type' => $row['transaction_type'],
            'party_name'       => $row['party_name'],
            'party_id'         => $row['party_id'] !== null ? (int)$row['party_id'] : null,
            'ref_no'           => $row['ref_no'] ?? '',
            'narration'        => $row['narration'] ?? '',
            'login_name'       => $row['login_name'] ?? 'Admin',
            'stamp'            => $row['stamp'] ?? '',
            'voucher_type'     => $row['voucher_type'] ?? 'Regular',
            'series'           => $row['series'] ?? '',
            'site'             => $row['site'] ?? '',
            'group_name'       => $row['group_name'] ?? '',
            'pc'               => (int)($row['pc'] ?? 1),
            'gross_weight'     => (float)($row['gross_weight'] ?? 0),
            'net_weight'       => (float)($row['net_weight'] ?? 0),
            'dia_weight'       => (float)($row['dia_weight'] ?? 0),
            'stone_weight'     => (float)($row['stone_weight'] ?? 0),
            'gold_fine'        => (float)($row['gold_fine'] ?? 0),
            'silver_fine'      => (float)($row['silver_fine'] ?? 0),
            'total_amount'     => (float)($row['total_amount'] ?? 0),
            'is_undelivered'   => (int)($row['is_undelivered'] ?? 0),
            'student_details'  => $row['student_details'] ?? '',
            'created_by'       => $row['created_by'] ?? '',
            'updated_by'       => $row['updated_by'] ?? '',
            'created_at'       => $row['created_at'] ?? '',
            'updated_at'       => $row['updated_at'] ?? '',
        ];
    }
}
