<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class MetalStock {
    /**
     * Allowed sorting columns
     */
    private static array $sortableColumns = [
        'id'            => 'id',
        'stock_date'    => 'stock_date',
        'group_name'    => 'group_name',
        'item_name'     => 'item_name',
        'unit'          => 'unit',
        'pc'            => 'pc',
        'gross_weight'  => 'gross_weight',
        'net_weight'    => 'net_weight',
        'tunch'         => 'tunch',
        'wastage'       => 'wastage',
        'labour_weight' => 'labour_weight',
        'rate'          => 'rate',
        'silver_fine'   => 'silver_fine',
        'total'         => 'total',
        'gold_fine'     => 'gold_fine',
        'stock_type'    => 'stock_type',
        'is_approved'   => 'is_approved',
        'entry_no'      => 'entry_no',
        'created_at'    => 'created_at',
    ];

    /**
     * Build WHERE conditions and query parameters from user filters
     */
    public static function buildWhereClause(array $filters): array {
        $where = ['1=1'];
        $params = [];

        // Search by Item Name (or Group Name / Entry No)
        if (!empty($filters['search'])) {
            $where[] = '(item_name LIKE :search_item OR group_name LIKE :search_group OR entry_no LIKE :search_entry)';
            $searchVal = '%' . trim($filters['search']) . '%';
            $params['search_item'] = $searchVal;
            $params['search_group'] = $searchVal;
            $params['search_entry'] = $searchVal;
        }

        // Group Wise filter
        if (!empty($filters['group_name']) && $filters['group_name'] !== 'all' && $filters['group_name'] !== 'All Group') {
            $where[] = 'group_name = :group_name';
            $params['group_name'] = trim($filters['group_name']);
        }

        // Item Wise filter
        if (!empty($filters['item_name']) && $filters['item_name'] !== 'all' && $filters['item_name'] !== 'All Item') {
            $where[] = 'item_name = :filter_item_name';
            $params['filter_item_name'] = trim($filters['item_name']);
        }

        // Stock Type filter
        if (!empty($filters['stock_type']) && $filters['stock_type'] !== 'all' && $filters['stock_type'] !== 'All') {
            $where[] = 'stock_type = :stock_type';
            $params['stock_type'] = trim($filters['stock_type']);
        }

        // Unit filter
        if (!empty($filters['unit']) && $filters['unit'] !== 'all') {
            $where[] = 'unit = :unit';
            $params['unit'] = trim($filters['unit']);
        }

        // Date filter (single date or range)
        if (!empty($filters['from_date'])) {
            $where[] = 'stock_date >= :from_date';
            $params['from_date'] = $filters['from_date'];
        }
        if (!empty($filters['to_date'])) {
            $where[] = 'stock_date <= :to_date';
            $params['to_date'] = $filters['to_date'];
        }
        if (!empty($filters['stock_date'])) {
            $where[] = 'stock_date = :stock_date';
            $params['stock_date'] = $filters['stock_date'];
        }

        // With Approval checkbox / filter
        if (isset($filters['is_approved']) && $filters['is_approved'] !== '' && $filters['is_approved'] !== 'all') {
            $where[] = 'is_approved = :is_approved';
            $params['is_approved'] = (int)$filters['is_approved'];
        }

        // Entry Wise filter (records with entry_no present)
        if (!empty($filters['entry_wise']) && ($filters['entry_wise'] === '1' || $filters['entry_wise'] === true || $filters['entry_wise'] === 'true')) {
            $where[] = "entry_no IS NOT NULL AND TRIM(entry_no) != ''";
        } elseif (!empty($filters['entry_no'])) {
            $where[] = 'entry_no = :entry_no';
            $params['entry_no'] = trim($filters['entry_no']);
        }

        return [implode(' AND ', $where), $params];
    }

    /**
     * Server-side pagination with dynamic totals across all matching records
     */
    public static function paginate(
        array $filters = [],
        string $sortBy = 'id',
        string $sortOrder = 'asc',
        int $page = 1,
        int $limit = 10
    ): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhereClause($filters);

        // Calculate Grand Totals across ALL matching records (not just current page)
        $summarySql = "SELECT 
                        COUNT(*) AS total_count,
                        COALESCE(SUM(pc), 0) AS total_pc,
                        COALESCE(SUM(gross_weight), 0) AS total_gross_weight,
                        COALESCE(SUM(net_weight), 0) AS total_net_weight,
                        COALESCE(SUM(silver_fine), 0) AS total_silver_fine,
                        COALESCE(SUM(total), 0) AS total_amount,
                        COALESCE(SUM(gold_fine), 0) AS total_gold_fine
                       FROM metal_stock
                       WHERE {$whereSql}";

        $summaryStmt = $db->prepare($summarySql);
        foreach ($params as $key => $val) {
            $summaryStmt->bindValue($key, $val);
        }
        $summaryStmt->execute();
        $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

        $totalRecords = (int)($summary['total_count'] ?? 0);

        // Secure sort column and order
        $sortCol = self::$sortableColumns[$sortBy] ?? 'id';
        $sortDir = strtolower($sortOrder) === 'desc' ? 'DESC' : 'ASC';

        // Fetch paginated page
        $offset = max(0, ($page - 1) * $limit);
        $sql = "SELECT id, stock_date, group_name, item_name, unit, pc, gross_weight, net_weight,
                       tunch, wastage, labour_weight, rate, silver_fine, total, gold_fine,
                       stock_type, is_approved, entry_no, photo, created_at, updated_at
                FROM metal_stock
                WHERE {$whereSql}
                ORDER BY {$sortCol} {$sortDir}
                LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalPages = $limit > 0 ? (int)ceil($totalRecords / $limit) : 1;

        return [
            'items'       => array_map([self::class, 'formatRow'], $rows),
            'total'       => $totalRecords,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => $totalPages,
            'totals'      => [
                'total_pc'           => (float)($summary['total_pc'] ?? 0),
                'total_gross_weight' => (float)($summary['total_gross_weight'] ?? 0),
                'total_net_weight'   => (float)($summary['total_net_weight'] ?? 0),
                'total_silver_fine'  => (float)($summary['total_silver_fine'] ?? 0),
                'total_amount'       => (float)($summary['total_amount'] ?? 0),
                'total_gold_fine'    => (float)($summary['total_gold_fine'] ?? 0),
            ],
        ];
    }

    /**
     * Find single record by ID
     */
    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM metal_stock WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? self::formatRow($row) : null;
    }

    /**
     * Create new metal_stock record
     */
    public static function create(array $data): array {
        $db = Database::getConnection();

        $stockDate = !empty($data['stock_date']) ? $data['stock_date'] : date('Y-m-d');
        $groupName = !empty($data['group_name']) ? trim($data['group_name']) : null;
        $itemName  = trim($data['item_name'] ?? '');
        $unit      = !empty($data['unit']) ? trim($data['unit']) : 'Gm';

        $pc           = self::parseNumber($data['pc'] ?? 0);
        $grossWeight  = self::parseNumber($data['gross_weight'] ?? 0);
        $netWeight    = self::parseNumber($data['net_weight'] ?? 0);
        $tunch        = self::parseNumber($data['tunch'] ?? 0);
        $wastage      = self::parseNumber($data['wastage'] ?? 0);
        $labourWeight = self::parseNumber($data['labour_weight'] ?? 0);
        $rate         = self::parseNumber($data['rate'] ?? 0);
        $silverFine   = self::parseNumber($data['silver_fine'] ?? 0);
        $total        = self::parseNumber($data['total'] ?? 0);
        $goldFine     = self::parseNumber($data['gold_fine'] ?? 0);

        $stockType  = !empty($data['stock_type']) ? trim($data['stock_type']) : null;
        $isApproved = !empty($data['is_approved']) ? 1 : 0;
        $entryNo    = !empty($data['entry_no']) ? trim($data['entry_no']) : null;
        $photo      = !empty($data['photo']) ? trim($data['photo']) : null;

        $sql = "INSERT INTO metal_stock (
                    stock_date, group_name, item_name, unit, pc, gross_weight, net_weight,
                    tunch, wastage, labour_weight, rate, silver_fine, total, gold_fine,
                    stock_type, is_approved, entry_no, photo
                ) VALUES (
                    :stock_date, :group_name, :item_name, :unit, :pc, :gross_weight, :net_weight,
                    :tunch, :wastage, :labour_weight, :rate, :silver_fine, :total, :gold_fine,
                    :stock_type, :is_approved, :entry_no, :photo
                )";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':stock_date', $stockDate);
        $stmt->bindValue(':group_name', $groupName);
        $stmt->bindValue(':item_name', $itemName);
        $stmt->bindValue(':unit', $unit);
        $stmt->bindValue(':pc', $pc);
        $stmt->bindValue(':gross_weight', $grossWeight);
        $stmt->bindValue(':net_weight', $netWeight);
        $stmt->bindValue(':tunch', $tunch);
        $stmt->bindValue(':wastage', $wastage);
        $stmt->bindValue(':labour_weight', $labourWeight);
        $stmt->bindValue(':rate', $rate);
        $stmt->bindValue(':silver_fine', $silverFine);
        $stmt->bindValue(':total', $total);
        $stmt->bindValue(':gold_fine', $goldFine);
        $stmt->bindValue(':stock_type', $stockType);
        $stmt->bindValue(':is_approved', $isApproved, PDO::PARAM_INT);
        $stmt->bindValue(':entry_no', $entryNo);
        $stmt->bindValue(':photo', $photo);

        $stmt->execute();
        $id = (int)$db->lastInsertId();

        return self::findById($id);
    }

    /**
     * Update existing metal_stock record by ID
     */
    public static function update(int $id, array $data): array {
        $db = Database::getConnection();

        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Metal stock record #{$id} does not exist.");
        }

        $stockDate = !empty($data['stock_date']) ? $data['stock_date'] : $existing['stock_date'];
        $groupName = array_key_exists('group_name', $data) ? (!empty($data['group_name']) ? trim($data['group_name']) : null) : $existing['group_name'];
        $itemName  = !empty($data['item_name']) ? trim($data['item_name']) : $existing['item_name'];
        $unit      = !empty($data['unit']) ? trim($data['unit']) : $existing['unit'];

        $pc           = array_key_exists('pc', $data) ? self::parseNumber($data['pc']) : $existing['pc'];
        $grossWeight  = array_key_exists('gross_weight', $data) ? self::parseNumber($data['gross_weight']) : $existing['gross_weight'];
        $netWeight    = array_key_exists('net_weight', $data) ? self::parseNumber($data['net_weight']) : $existing['net_weight'];
        $tunch        = array_key_exists('tunch', $data) ? self::parseNumber($data['tunch']) : $existing['tunch'];
        $wastage      = array_key_exists('wastage', $data) ? self::parseNumber($data['wastage']) : $existing['wastage'];
        $labourWeight = array_key_exists('labour_weight', $data) ? self::parseNumber($data['labour_weight']) : $existing['labour_weight'];
        $rate         = array_key_exists('rate', $data) ? self::parseNumber($data['rate']) : $existing['rate'];
        $silverFine   = array_key_exists('silver_fine', $data) ? self::parseNumber($data['silver_fine']) : $existing['silver_fine'];
        $total        = array_key_exists('total', $data) ? self::parseNumber($data['total']) : $existing['total'];
        $goldFine     = array_key_exists('gold_fine', $data) ? self::parseNumber($data['gold_fine']) : $existing['gold_fine'];

        $stockType  = array_key_exists('stock_type', $data) ? (!empty($data['stock_type']) ? trim($data['stock_type']) : null) : $existing['stock_type'];
        $isApproved = array_key_exists('is_approved', $data) ? (!empty($data['is_approved']) ? 1 : 0) : ($existing['is_approved'] ? 1 : 0);
        $entryNo    = array_key_exists('entry_no', $data) ? (!empty($data['entry_no']) ? trim($data['entry_no']) : null) : $existing['entry_no'];
        $photo      = array_key_exists('photo', $data) ? (!empty($data['photo']) ? trim($data['photo']) : null) : $existing['photo'];

        $sql = "UPDATE metal_stock SET
                    stock_date = :stock_date,
                    group_name = :group_name,
                    item_name = :item_name,
                    unit = :unit,
                    pc = :pc,
                    gross_weight = :gross_weight,
                    net_weight = :net_weight,
                    tunch = :tunch,
                    wastage = :wastage,
                    labour_weight = :labour_weight,
                    rate = :rate,
                    silver_fine = :silver_fine,
                    total = :total,
                    gold_fine = :gold_fine,
                    stock_type = :stock_type,
                    is_approved = :is_approved,
                    entry_no = :entry_no,
                    photo = :photo
                WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':stock_date', $stockDate);
        $stmt->bindValue(':group_name', $groupName);
        $stmt->bindValue(':item_name', $itemName);
        $stmt->bindValue(':unit', $unit);
        $stmt->bindValue(':pc', $pc);
        $stmt->bindValue(':gross_weight', $grossWeight);
        $stmt->bindValue(':net_weight', $netWeight);
        $stmt->bindValue(':tunch', $tunch);
        $stmt->bindValue(':wastage', $wastage);
        $stmt->bindValue(':labour_weight', $labourWeight);
        $stmt->bindValue(':rate', $rate);
        $stmt->bindValue(':silver_fine', $silverFine);
        $stmt->bindValue(':total', $total);
        $stmt->bindValue(':gold_fine', $goldFine);
        $stmt->bindValue(':stock_type', $stockType);
        $stmt->bindValue(':is_approved', $isApproved, PDO::PARAM_INT);
        $stmt->bindValue(':entry_no', $entryNo);
        $stmt->bindValue(':photo', $photo);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        $stmt->execute();

        return self::findById($id);
    }

    /**
     * Delete record by ID
     */
    public static function delete(int $id): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM metal_stock WHERE id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Get distinct values for dropdown filters
     */
    public static function getFilterOptions(): array {
        $db = Database::getConnection();

        // Groups
        $groupStmt = $db->query("SELECT DISTINCT group_name FROM metal_stock WHERE group_name IS NOT NULL AND TRIM(group_name) != '' ORDER BY group_name ASC");
        $groups = $groupStmt->fetchAll(PDO::FETCH_COLUMN);

        // Items
        $itemStmt = $db->query("SELECT DISTINCT item_name FROM metal_stock WHERE item_name IS NOT NULL AND TRIM(item_name) != '' ORDER BY item_name ASC");
        $items = $itemStmt->fetchAll(PDO::FETCH_COLUMN);

        // Units
        $unitStmt = $db->query("SELECT DISTINCT unit FROM metal_stock WHERE unit IS NOT NULL AND TRIM(unit) != '' ORDER BY unit ASC");
        $units = $unitStmt->fetchAll(PDO::FETCH_COLUMN);

        // Dynamic Stock Types from StockType model / database
        $stockTypes = \Models\StockType::names();

        return [
            'groups'      => $groups,
            'items'       => $items,
            'units'       => $units,
            'stock_types' => $stockTypes,
        ];
    }

    /**
     * Fetch all matching records for exports
     */
    public static function getAllMatching(array $filters = [], string $sortBy = 'id', string $sortOrder = 'asc'): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhereClause($filters);

        $sortCol = self::$sortableColumns[$sortBy] ?? 'id';
        $sortDir = strtolower($sortOrder) === 'desc' ? 'DESC' : 'ASC';

        $sql = "SELECT id, stock_date, group_name, item_name, unit, pc, gross_weight, net_weight,
                       tunch, wastage, labour_weight, rate, silver_fine, total, gold_fine,
                       stock_type, is_approved, entry_no, photo, created_at, updated_at
                FROM metal_stock
                WHERE {$whereSql}
                ORDER BY {$sortCol} {$sortDir}";

        $stmt = $db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map([self::class, 'formatRow'], $rows);
    }

    /**
     * Helper to parse float/numeric preserving null and negative values
     */
    private static function parseNumber($val): ?float {
        if ($val === null || $val === '') {
            return 0.0;
        }
        return (float)$val;
    }

    /**
     * Format a database row into typed response
     */
    private static function formatRow(array $row): array {
        return [
            'id'            => (int)$row['id'],
            'stock_date'    => $row['stock_date'],
            'group_name'    => $row['group_name'] ?? '',
            'item_name'     => $row['item_name'],
            'unit'          => $row['unit'] ?? 'Gm',
            'pc'            => $row['pc'] !== null ? (float)$row['pc'] : 0.0,
            'gross_weight'  => $row['gross_weight'] !== null ? (float)$row['gross_weight'] : 0.0,
            'net_weight'    => $row['net_weight'] !== null ? (float)$row['net_weight'] : 0.0,
            'tunch'         => $row['tunch'] !== null ? (float)$row['tunch'] : 0.0,
            'wastage'       => $row['wastage'] !== null ? (float)$row['wastage'] : 0.0,
            'labour_weight' => $row['labour_weight'] !== null ? (float)$row['labour_weight'] : 0.0,
            'rate'          => $row['rate'] !== null ? (float)$row['rate'] : 0.0,
            'silver_fine'   => $row['silver_fine'] !== null ? (float)$row['silver_fine'] : 0.0,
            'total'         => $row['total'] !== null ? (float)$row['total'] : 0.0,
            'gold_fine'     => $row['gold_fine'] !== null ? (float)$row['gold_fine'] : 0.0,
            'stock_type'    => $row['stock_type'] ?? '',
            'is_approved'   => (bool)$row['is_approved'],
            'entry_no'      => $row['entry_no'] ?? '',
            'photo'         => $row['photo'] ?? '',
            'created_at'    => $row['created_at'] ?? '',
            'updated_at'    => $row['updated_at'] ?? '',
        ];
    }

    /**
     * Get distinct item names from metal_stock
     */
    public static function getDistinctItemNames(): array {
        $db = \Config\Database::getConnection();
        $stmt = $db->query("SELECT DISTINCT item_name FROM metal_stock WHERE item_name IS NOT NULL AND TRIM(item_name) <> '' ORDER BY item_name ASC");
        $rows = $stmt->fetchAll(\PDO::FETCH_COLUMN);
        return $rows ?: [];
    }

}
