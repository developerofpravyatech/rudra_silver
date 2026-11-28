<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class StockStatus {
    /**
     * Allowed sorting columns to prevent SQL injection
     */
    private static array $sortableColumns = [
        'id'            => 'id',
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
        'created_at'    => 'created_at',
    ];

    /**
     * Build WHERE conditions and query parameters from user filters
     */
    private static function getStockStatusColumns(): array {
        static $columns = null;
        if ($columns === null) {
            $db = Database::getConnection();
            $stmt = $db->query("SHOW COLUMNS FROM stock_status");
            $columns = array_map(static fn(array $row): string => (string)$row['Field'], $stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        return $columns;
    }

    private static function firstExistingColumn(array $candidates): ?string {
        foreach ($candidates as $candidate) {
            if (in_array($candidate, self::getStockStatusColumns(), true)) return $candidate;
        }
        return null;
    }

    private static function buildWhereClause(
        ?string $search = null, ?string $unit = null, ?string $typeWiseGroup = null,
        ?string $statusFilter = null, ?string $itemType = null, ?string $itemNameFilter = null,
        ?string $itemDropdown = null, ?string $dateFrom = null, ?string $dateTo = null,
        ?string $approvalFlag = null, ?string $entryWiseFlag = null, ?string $kachiList = null,
        ?string $itemWiseFilter = null, ?string $allRecords = null
    ): array {
        $where = ['1=1'];
        $params = [];
        $columns = self::getStockStatusColumns();
        $addLike = static function (string $column, string $key, string $value) use (&$where, &$params): void {
            if (trim($value) !== '') {
                $where[] = "{$column} LIKE :{$key}";
                $params[$key] = '%' . trim($value) . '%';
            }
        };

        if ($search !== null && trim($search) !== '') $addLike('item_name', 'search', $search);
        if ($unit !== null && trim($unit) !== '' && strtolower(trim($unit)) !== 'all') {
            $where[] = 'unit = :unit';
            $params['unit'] = trim($unit);
        }
        if ($typeWiseGroup !== null && trim($typeWiseGroup) !== '' && trim($typeWiseGroup) !== 'ALL GROUP') {
            $groupColumn = self::firstExistingColumn(['group_name', 'item_group_name', 'type_wise_group', 'group_name']);
            if ($groupColumn !== null) {
                $where[] = "`{$groupColumn}` = :type_group";
                $params['type_group'] = trim($typeWiseGroup);
            } else {
                $addLike('item_name', 'type_group', $typeWiseGroup);
            }
        }

        if ($statusFilter !== null && trim($statusFilter) !== '' && trim($statusFilter) !== 'All') {
            switch (trim($statusFilter)) {
                case 'In Stock': $where[] = 'pc <> 0'; break;
                case 'M.Stock':
                    $where[] = 'unit IN (:mstock1, :mstock2, :mstock3)';
                    $params['mstock1'] = 'Gm'; $params['mstock2'] = 'Pcs'; $params['mstock3'] = 'Kg';
                    break;
                case 'Studed': $where[] = 'tunch IS NOT NULL AND tunch <> 0'; break;
                case 'Negative': $where[] = 'pc < 0'; break;
                case 'WO Studed': $where[] = 'tunch IS NULL'; break;
                case 'Sh/Ex': $where[] = 'COALESCE(gross_weight, 0) <> COALESCE(net_weight, 0)'; break;
                case 'Batch': if (in_array('is_sample', $columns, true)) $where[] = 'is_sample = 1'; break;
            }
        }

        if ($itemType !== null && trim($itemType) !== '' && trim($itemType) !== 'All') {
            $typeColumn = self::firstExistingColumn(['item_type', 'stock_type', 'type_name']);
            if ($typeColumn !== null) {
                $where[] = "`{$typeColumn}` = :item_type";
                $params['item_type'] = trim($itemType);
            } else {
                $addLike('item_name', 'item_type', $itemType);
            }
        }
        if ($itemNameFilter !== null && trim($itemNameFilter) !== '') $addLike('item_name', 'item_name_filter', $itemNameFilter);
        if ($itemDropdown !== null && trim($itemDropdown) !== '' && trim($itemDropdown) !== 'ALL ITEM') {
            $where[] = 'item_name = :item_dropdown';
            $params['item_dropdown'] = trim($itemDropdown);
        }
        if ($dateFrom !== null && trim($dateFrom) !== '' && in_array('created_at', $columns, true)) {
            $where[] = 'created_at >= :date_from';
            $params['date_from'] = trim($dateFrom) . ' 00:00:00';
        }
        if ($dateTo !== null && trim($dateTo) !== '' && in_array('created_at', $columns, true)) {
            $where[] = 'created_at <= :date_to';
            $params['date_to'] = trim($dateTo) . ' 23:59:59';
        }
        if ($approvalFlag !== null && trim($approvalFlag) !== '') {
            $approvalColumn = self::firstExistingColumn(['with_approval', 'is_approved', 'approval']);
            if ($approvalColumn !== null) $where[] = "`{$approvalColumn}` = 1";
        }
        if ($entryWiseFlag !== null && trim($entryWiseFlag) !== '') {
            $entryColumn = self::firstExistingColumn(['entry_wise', 'is_entry_wise', 'entry_wise_flag']);
            if ($entryColumn !== null) $where[] = "`{$entryColumn}` = 1";
        }
        if ($kachiList !== null && trim($kachiList) !== '') $addLike('item_name', 'kachi_list', $kachiList === 'Kachi' ? 'Kachi' : $kachiList);
        if ($itemWiseFilter !== null && trim($itemWiseFilter) !== '') $addLike('item_name', 'item_wise_filter', $itemWiseFilter);

        return [implode(' AND ', $where), $params];
    }

    public static function getFilterCapabilities(): array {
        return [
            'with_approval' => self::firstExistingColumn(['with_approval', 'is_approved', 'approval']) !== null,
            'entry_wise' => self::firstExistingColumn(['entry_wise', 'is_entry_wise', 'entry_wise_flag']) !== null,
        ];
    }

    /**
     * Server-side pagination with dynamic totals across all matching records
     */
    public static function paginate(
        ?string $search = null,
        ?string $unit = null,
        ?string $typeWiseGroup = null,
        ?string $statusFilter = null,
        ?string $itemType = null,
        ?string $itemNameFilter = null,
        ?string $itemDropdown = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $approvalFlag = null,
        ?string $entryWiseFlag = null,
        ?string $kachiList = null,
        ?string $itemWiseFilter = null,
        ?string $allRecords = null,
        string $sortBy = 'id',
        string $sortOrder = 'asc',
        int $page = 1,
        int $limit = 10
    ): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhereClause($search, $unit, $typeWiseGroup, $statusFilter, $itemType, $itemNameFilter, $itemDropdown, $dateFrom, $dateTo, $approvalFlag, $entryWiseFlag, $kachiList, $itemWiseFilter, $allRecords);

        // Calculate Grand Totals across ALL matching records (not just the current page)
        $summarySql = "SELECT 
                        COUNT(*) AS total_count,
                        COALESCE(SUM(pc), 0) AS total_pc,
                        COALESCE(SUM(gross_weight), 0) AS total_gross_weight,
                        COALESCE(SUM(net_weight), 0) AS total_net_weight,
                        COALESCE(SUM(silver_fine), 0) AS total_silver_fine,
                        COALESCE(SUM(total), 0) AS total_amount,
                        COALESCE(SUM(gold_fine), 0) AS total_gold_fine
                       FROM stock_status
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
        $sql = "SELECT id, item_name, unit, pc, gross_weight, net_weight, tunch, wastage,
                       labour_weight, rate, silver_fine, total, gold_fine, is_sample, created_at
                FROM stock_status
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

        // Cast numeric types while strictly preserving negative values and nulls
        foreach ($rows as &$row) {
            $row['id'] = (int)$row['id'];
            $row['pc'] = $row['pc'] !== null ? (float)$row['pc'] : null;
            $row['gross_weight'] = $row['gross_weight'] !== null ? (float)$row['gross_weight'] : null;
            $row['net_weight'] = $row['net_weight'] !== null ? (float)$row['net_weight'] : null;
            $row['tunch'] = $row['tunch'] !== null ? (float)$row['tunch'] : null;
            $row['wastage'] = $row['wastage'] !== null ? (float)$row['wastage'] : null;
            $row['labour_weight'] = $row['labour_weight'] !== null ? (float)$row['labour_weight'] : null;
            $row['rate'] = $row['rate'] !== null ? (float)$row['rate'] : null;
            $row['silver_fine'] = $row['silver_fine'] !== null ? (float)$row['silver_fine'] : null;
            $row['total'] = $row['total'] !== null ? (float)$row['total'] : null;
            $row['gold_fine'] = $row['gold_fine'] !== null ? (float)$row['gold_fine'] : null;
            $row['is_sample'] = (bool)($row['is_sample'] ?? false);
        }

        $totalPages = $limit > 0 ? (int)ceil($totalRecords / $limit) : 1;

        return [
            'items'       => $rows,
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
        $stmt = $db->prepare('SELECT * FROM stock_status WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return null;

        $row['id'] = (int)$row['id'];
        $row['pc'] = $row['pc'] !== null ? (float)$row['pc'] : null;
        $row['gross_weight'] = $row['gross_weight'] !== null ? (float)$row['gross_weight'] : null;
        $row['net_weight'] = $row['net_weight'] !== null ? (float)$row['net_weight'] : null;
        $row['tunch'] = $row['tunch'] !== null ? (float)$row['tunch'] : null;
        $row['wastage'] = $row['wastage'] !== null ? (float)$row['wastage'] : null;
        $row['labour_weight'] = $row['labour_weight'] !== null ? (float)$row['labour_weight'] : null;
        $row['rate'] = $row['rate'] !== null ? (float)$row['rate'] : null;
        $row['silver_fine'] = $row['silver_fine'] !== null ? (float)$row['silver_fine'] : null;
        $row['total'] = $row['total'] !== null ? (float)$row['total'] : null;
        $row['gold_fine'] = $row['gold_fine'] !== null ? (float)$row['gold_fine'] : null;
        $row['is_sample'] = (bool)($row['is_sample'] ?? false);

        return $row;
    }

    /**
     * Find record by item_name to prevent duplicates
     */
    public static function findByName(string $name, ?int $excludeId = null): ?array {
        $db = Database::getConnection();
        $sql = 'SELECT id, item_name FROM stock_status WHERE item_name = :name';
        $params = [':name' => trim($name)];
        if ($excludeId !== null) {
            $sql .= ' AND id != :excludeId';
            $params[':excludeId'] = $excludeId;
        }
        $sql .= ' LIMIT 1';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Helper to safely format a nullable float value without losing negative adjustments
     */
    private static function parseNullableNumber(mixed $val, ?int $decimals = null): ?float {
        if ($val === null || $val === '') return null;
        if (!is_numeric($val)) return null;
        $num = (float)$val;
        return $decimals !== null ? round($num, $decimals) : $num;
    }

    /**
     * Insert a new record into stock_status
     */
    public static function create(array $data): array {
        $db = Database::getConnection();

        $itemName = trim($data['item_name'] ?? '');
        if ($itemName === '') {
            throw new Exception('Item Name is required.');
        }

        $existing = self::findByName($itemName);
        if ($existing) {
            throw new Exception("An item with name '{$itemName}' already exists. Item Name must be unique.");
        }

        $unit = !empty($data['unit']) ? trim($data['unit']) : 'Gm';

        // Parse numbers preserving negatives and nulls
        $pc = self::parseNullableNumber($data['pc'] ?? null, 3);
        $gross = self::parseNullableNumber($data['gross_weight'] ?? null, 3);
        $net = self::parseNullableNumber($data['net_weight'] ?? null, 3);
        $tunch = self::parseNullableNumber($data['tunch'] ?? null, 3);
        $wastage = self::parseNullableNumber($data['wastage'] ?? null, 3);
        $labour = self::parseNullableNumber($data['labour_weight'] ?? null, 3);
        $rate = self::parseNullableNumber($data['rate'] ?? null, 3);
        $silFine = self::parseNullableNumber($data['silver_fine'] ?? null, 3);
        $total = self::parseNullableNumber($data['total'] ?? null, 3);
        $goldFine = self::parseNullableNumber($data['gold_fine'] ?? null, 3);
        $isSample = isset($data['is_sample']) ? (int)(bool)$data['is_sample'] : 0;

        $sql = "INSERT INTO stock_status (
                    item_name, unit, pc, gross_weight, net_weight, tunch, wastage,
                    labour_weight, rate, silver_fine, total, gold_fine, is_sample, created_at
                ) VALUES (
                    :item_name, :unit, :pc, :gross_weight, :net_weight, :tunch, :wastage,
                    :labour_weight, :rate, :silver_fine, :total, :gold_fine, :is_sample, NOW()
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':item_name'     => $itemName,
            ':unit'          => $unit,
            ':pc'            => $pc,
            ':gross_weight'  => $gross,
            ':net_weight'    => $net,
            ':tunch'         => $tunch,
            ':wastage'       => $wastage,
            ':labour_weight' => $labour,
            ':rate'          => $rate,
            ':silver_fine'   => $silFine,
            ':total'         => $total,
            ':gold_fine'     => $goldFine,
            ':is_sample'     => $isSample,
        ]);

        $id = (int)$db->lastInsertId();
        return self::findById($id);
    }

    /**
     * Update an existing record in stock_status by ID
     */
    public static function update(int $id, array $data): ?array {
        $db = Database::getConnection();

        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Stock record #{$id} not found.");
        }

        $itemName = isset($data['item_name']) ? trim($data['item_name']) : $existing['item_name'];
        if ($itemName === '') {
            throw new Exception('Item Name cannot be empty.');
        }

        $conflict = self::findByName($itemName, $id);
        if ($conflict) {
            throw new Exception("An item with name '{$itemName}' already exists. Duplicate Item Names are not permitted.");
        }

        $unit = array_key_exists('unit', $data)
            ? (!empty($data['unit']) ? trim($data['unit']) : null)
            : $existing['unit'];

        $pc = array_key_exists('pc', $data) ? self::parseNullableNumber($data['pc'], 3) : $existing['pc'];
        $gross = array_key_exists('gross_weight', $data) ? self::parseNullableNumber($data['gross_weight'], 3) : $existing['gross_weight'];
        $net = array_key_exists('net_weight', $data) ? self::parseNullableNumber($data['net_weight'], 3) : $existing['net_weight'];
        $tunch = array_key_exists('tunch', $data) ? self::parseNullableNumber($data['tunch'], 3) : $existing['tunch'];
        $wastage = array_key_exists('wastage', $data) ? self::parseNullableNumber($data['wastage'], 3) : $existing['wastage'];
        $labour = array_key_exists('labour_weight', $data) ? self::parseNullableNumber($data['labour_weight'], 3) : $existing['labour_weight'];
        $rate = array_key_exists('rate', $data) ? self::parseNullableNumber($data['rate'], 3) : $existing['rate'];
        $silFine = array_key_exists('silver_fine', $data) ? self::parseNullableNumber($data['silver_fine'], 3) : $existing['silver_fine'];
        $total = array_key_exists('total', $data) ? self::parseNullableNumber($data['total'], 3) : $existing['total'];
        $goldFine = array_key_exists('gold_fine', $data) ? self::parseNullableNumber($data['gold_fine'], 3) : $existing['gold_fine'];

        $sql = "UPDATE stock_status SET
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
                    gold_fine = :gold_fine
                WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id'            => $id,
            ':item_name'     => $itemName,
            ':unit'          => $unit,
            ':pc'            => $pc,
            ':gross_weight'  => $gross,
            ':net_weight'    => $net,
            ':tunch'         => $tunch,
            ':wastage'       => $wastage,
            ':labour_weight' => $labour,
            ':rate'          => $rate,
            ':silver_fine'   => $silFine,
            ':total'         => $total,
            ':gold_fine'     => $goldFine,
        ]);

        return self::findById($id);
    }

    /**
     * Delete record by ID
     */
    public static function delete(int $id): bool {
        $db = Database::getConnection();

        $stmt = $db->prepare('DELETE FROM stock_status WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Get distinct units present in stock_status table
     */
    public static function getDistinctUnits(): array {
        $db = Database::getConnection();
        $units = [];
        try {
            $masterStmt = $db->query("SELECT name FROM units WHERE is_active = 1 ORDER BY name ASC");
            $units = array_merge($units, $masterStmt->fetchAll(PDO::FETCH_COLUMN));
        } catch (Exception $e) {
            // Keep legacy unit names available if Unit Master is not installed.
        }
        $legacyStmt = $db->query("SELECT DISTINCT unit FROM stock_status WHERE unit IS NOT NULL AND TRIM(unit) <> '' ORDER BY unit ASC");
        $units = array_merge($units, $legacyStmt->fetchAll(PDO::FETCH_COLUMN));
        $unique = [];
        foreach ($units as $unit) {
            $name = trim((string)$unit);
            if ($name !== '') $unique[strtolower($name)] = $name;
        }
        return array_values($unique);
    }

    /**
     * Fetch all matching records without pagination for exports (CSV, Excel, PDF)
     */
    public static function getAllMatching(
        ?string $search = null, ?string $unit = null, ?string $typeWiseGroup = null,
        ?string $statusFilter = null, ?string $itemType = null, ?string $itemNameFilter = null,
        ?string $itemDropdown = null, ?string $dateFrom = null, ?string $dateTo = null,
        ?string $approvalFlag = null, ?string $entryWiseFlag = null, ?string $kachiList = null,
        ?string $itemWiseFilter = null, ?string $allRecords = null
    ): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhereClause(
            $search, $unit, $typeWiseGroup, $statusFilter, $itemType, $itemNameFilter,
            $itemDropdown, $dateFrom, $dateTo, $approvalFlag, $entryWiseFlag,
            $kachiList, $itemWiseFilter, $allRecords
        );
        $sql = "SELECT id, item_name, unit, pc, gross_weight, net_weight, tunch, wastage,
                       labour_weight, rate, silver_fine, total, gold_fine, is_sample, created_at
                FROM stock_status WHERE {$whereSql} ORDER BY id ASC";
        $stmt = $db->prepare($sql);
        foreach ($params as $key => $val) $stmt->bindValue($key, $val);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['id'] = (int)$row['id'];
            foreach (['pc', 'gross_weight', 'net_weight', 'tunch', 'wastage', 'labour_weight', 'rate', 'silver_fine', 'total', 'gold_fine'] as $field) {
                $row[$field] = $row[$field] !== null ? (float)$row[$field] : null;
            }
            $row['is_sample'] = (bool)($row['is_sample'] ?? false);
        }
        return $rows;
    }

}
