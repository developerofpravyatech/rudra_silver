<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class StockItem {
    /**
     * Server-side paginated list of stock items with search and filters
     */
    public static function paginate(
        ?string $search = null,
        ?string $metalType = null,
        ?int $itemGroupId = null,
        ?int $purityId = null,
        ?string $status = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        int $page = 1,
        int $limit = 10
    ): array {
        $db = Database::getConnection();
        $where = ['s.is_deleted = 0'];
        $params = [];

        // Global search: Stock Code, Item Name, Item Group, Metal Type
        if ($search !== null && trim($search) !== '') {
            $s = '%' . trim($search) . '%';
            $where[] = '(s.stock_code LIKE :s1 OR s.item_name LIKE :s2 OR s.metal_type LIKE :s3 OR i.group_name LIKE :s4)';
            $params['s1'] = $s;
            $params['s2'] = $s;
            $params['s3'] = $s;
            $params['s4'] = $s;
        }

        // Metal Type filter
        if ($metalType !== null && trim($metalType) !== '' && trim($metalType) !== 'all') {
            $where[] = 's.metal_type = :metal_type';
            $params['metal_type'] = trim($metalType);
        }

        // Item Group filter
        if ($itemGroupId !== null && $itemGroupId > 0) {
            $where[] = 's.item_group_id = :item_group_id';
            $params['item_group_id'] = $itemGroupId;
        }

        // Purity filter
        if ($purityId !== null && $purityId > 0) {
            $where[] = 's.purity_id = :purity_id';
            $params['purity_id'] = $purityId;
        }

        // Status filter
        if ($status !== null && trim($status) !== '' && trim($status) !== 'all') {
            $where[] = 's.status = :status';
            $params['status'] = trim($status);
        }

        // Date range filter
        if ($dateFrom !== null && trim($dateFrom) !== '') {
            $where[] = 's.purchase_date >= :date_from';
            $params['date_from'] = trim($dateFrom);
        }
        if ($dateTo !== null && trim($dateTo) !== '') {
            $where[] = 's.purchase_date <= :date_to';
            $params['date_to'] = trim($dateTo);
        }

        $whereSql = implode(' AND ', $where);

        // Count total matching records
        $countSql = "SELECT COUNT(*) 
                     FROM stock_items s 
                     LEFT JOIN items i ON s.item_group_id = i.id 
                     WHERE {$whereSql}";
        $countStmt = $db->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        // Paginated records
        $offset = max(0, ($page - 1) * $limit);
        $sql = "SELECT s.*, 
                       COALESCE(i.group_name, 'General Jewellery') AS item_group_name,
                       COALESCE(p.name, CONCAT(s.metal_type, ' Purity')) AS purity_name,
                       p.touch_purity,
                       COALESCE(u.code, 'GMS') AS unit_code,
                       COALESCE(u.name, 'Grams') AS unit_name
                FROM stock_items s
                LEFT JOIN items i ON s.item_group_id = i.id
                LEFT JOIN purity_stamps p ON s.purity_id = p.id
                LEFT JOIN units u ON s.unit_id = u.id
                WHERE {$whereSql}
                ORDER BY s.id DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format numeric decimals
        foreach ($items as &$item) {
            $item['id'] = (int)$item['id'];
            $item['gross_weight'] = (float)$item['gross_weight'];
            $item['stone_weight'] = (float)$item['stone_weight'];
            $item['other_weight'] = (float)$item['other_weight'];
            $item['net_weight'] = (float)$item['net_weight'];
            $item['fine_weight'] = (float)$item['fine_weight'];
            $item['quantity'] = (int)$item['quantity'];
            $item['available_stock'] = (int)$item['available_stock'];
            $item['minimum_stock_level'] = (int)$item['minimum_stock_level'];
            if (isset($item['touch_purity'])) {
                $item['touch_purity'] = (float)$item['touch_purity'];
            }
        }

        $totalPages = $limit > 0 ? (int)ceil($total / $limit) : 1;

        return [
            'items'       => $items,
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => $totalPages,
        ];
    }

    /**
     * Find single stock item by ID
     */
    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT s.*, 
                    COALESCE(i.group_name, 'General Jewellery') AS item_group_name,
                    COALESCE(p.name, CONCAT(s.metal_type, ' Purity')) AS purity_name,
                    p.touch_purity,
                    COALESCE(u.code, 'GMS') AS unit_code,
                    COALESCE(u.name, 'Grams') AS unit_name
             FROM stock_items s
             LEFT JOIN items i ON s.item_group_id = i.id
             LEFT JOIN purity_stamps p ON s.purity_id = p.id
             LEFT JOIN units u ON s.unit_id = u.id
             WHERE s.id = :id AND s.is_deleted = 0
             LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return null;

        $row['id'] = (int)$row['id'];
        $row['gross_weight'] = (float)$row['gross_weight'];
        $row['stone_weight'] = (float)$row['stone_weight'];
        $row['other_weight'] = (float)$row['other_weight'];
        $row['net_weight'] = (float)$row['net_weight'];
        $row['fine_weight'] = (float)$row['fine_weight'];
        $row['quantity'] = (int)$row['quantity'];
        $row['available_stock'] = (int)$row['available_stock'];
        $row['minimum_stock_level'] = (int)$row['minimum_stock_level'];
        if (isset($row['touch_purity'])) {
            $row['touch_purity'] = (float)$row['touch_purity'];
        }

        return $row;
    }

    /**
     * Find by Stock Code
     */
    public static function findByCode(string $code, ?int $excludeId = null): ?array {
        $db = Database::getConnection();
        $sql = "SELECT id, stock_code FROM stock_items WHERE stock_code = :code AND is_deleted = 0";
        $params = [':code' => trim($code)];
        if ($excludeId) {
            $sql .= " AND id != :exclude_id";
            $params[':exclude_id'] = $excludeId;
        }
        $sql .= " LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Generate next unique stock code
     */
    public static function generateNextStockCode(): string {
        $db = Database::getConnection();
        $year = date('Y');
        $prefix = "STK-{$year}-";

        $stmt = $db->prepare("SELECT stock_code FROM stock_items WHERE stock_code LIKE :prefix ORDER BY id DESC LIMIT 1");
        $stmt->execute([':prefix' => "{$prefix}%"]);
        $lastCode = $stmt->fetchColumn();

        if ($lastCode && preg_match('/-(\d+)$/', $lastCode, $matches)) {
            $nextSeq = (int)$matches[1] + 1;
        } else {
            // Count total
            $count = (int)$db->query("SELECT COUNT(*) FROM stock_items")->fetchColumn();
            $nextSeq = $count + 1;
        }

        return sprintf("%s%04d", $prefix, $nextSeq);
    }

    /**
     * Create a new stock item
     */
    public static function create(array $data): array {
        $db = Database::getConnection();

        // Auto-generate code if not provided
        $stockCode = !empty($data['stock_code']) ? trim($data['stock_code']) : self::generateNextStockCode();

        // Calculate weights
        $gross = round((float)($data['gross_weight'] ?? 0), 3);
        $stone = round((float)($data['stone_weight'] ?? 0), 3);
        $other = round((float)($data['other_weight'] ?? 0), 3);
        $net   = round(max(0, $gross - ($stone + $other)), 3);

        // Fetch purity touch percentage if not explicitly computed
        $purityId = !empty($data['purity_id']) ? (int)$data['purity_id'] : null;
        $touch = 0.0;
        if ($purityId) {
            $pStmt = $db->prepare("SELECT touch_purity FROM purity_stamps WHERE id = :id LIMIT 1");
            $pStmt->execute([':id' => $purityId]);
            $touch = (float)$pStmt->fetchColumn();
        }

        $fine = isset($data['fine_weight']) && (float)$data['fine_weight'] > 0
            ? round((float)$data['fine_weight'], 3)
            : round(($net * ($touch > 0 ? $touch : 100)) / 100, 3);

        $quantity = max(0, (int)($data['quantity'] ?? 1));
        $available = isset($data['available_stock']) ? max(0, (int)$data['available_stock']) : $quantity;
        $minStock  = max(0, (int)($data['minimum_stock_level'] ?? 0));

        // Determine status automatically if not forced
        $status = $data['status'] ?? 'Available';
        if ($available <= 0) {
            $status = 'Out of Stock';
        } elseif ($available <= $minStock && $minStock > 0) {
            $status = 'Low Stock';
        }

        $sql = "INSERT INTO stock_items (
                    stock_code, item_name, item_id, item_group_id, metal_type, purity_id,
                    gross_weight, stone_weight, other_weight, net_weight, fine_weight,
                    quantity, available_stock, minimum_stock_level, unit_id, purchase_date,
                    remarks, status, is_deleted, created_at, updated_at
                ) VALUES (
                    :stock_code, :item_name, :item_id, :item_group_id, :metal_type, :purity_id,
                    :gross_weight, :stone_weight, :other_weight, :net_weight, :fine_weight,
                    :quantity, :available_stock, :minimum_stock_level, :unit_id, :purchase_date,
                    :remarks, :status, 0, NOW(), NOW()
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':stock_code'          => $stockCode,
            ':item_name'           => trim($data['item_name']),
            ':item_id'             => !empty($data['item_id']) ? (int)$data['item_id'] : null,
            ':item_group_id'       => !empty($data['item_group_id']) ? (int)$data['item_group_id'] : null,
            ':metal_type'          => !empty($data['metal_type']) ? trim($data['metal_type']) : 'Silver',
            ':purity_id'           => $purityId,
            ':gross_weight'        => $gross,
            ':stone_weight'        => $stone,
            ':other_weight'        => $other,
            ':net_weight'          => $net,
            ':fine_weight'         => $fine,
            ':quantity'            => $quantity,
            ':available_stock'     => $available,
            ':minimum_stock_level' => $minStock,
            ':unit_id'             => !empty($data['unit_id']) ? (int)$data['unit_id'] : 1,
            ':purchase_date'       => !empty($data['purchase_date']) ? $data['purchase_date'] : date('Y-m-d'),
            ':remarks'             => !empty($data['remarks']) ? trim($data['remarks']) : null,
            ':status'              => $status,
        ]);

        $id = (int)$db->lastInsertId();
        return self::findById($id);
    }

    /**
     * Update an existing stock item
     */
    public static function update(int $id, array $data): ?array {
        $db = Database::getConnection();
        $existing = self::findById($id);
        if (!$existing) return null;

        $gross = isset($data['gross_weight']) ? round((float)$data['gross_weight'], 3) : $existing['gross_weight'];
        $stone = isset($data['stone_weight']) ? round((float)$data['stone_weight'], 3) : $existing['stone_weight'];
        $other = isset($data['other_weight']) ? round((float)$data['other_weight'], 3) : $existing['other_weight'];
        $net   = round(max(0, $gross - ($stone + $other)), 3);

        $purityId = isset($data['purity_id']) ? (int)$data['purity_id'] : $existing['purity_id'];
        $touch = 0.0;
        if ($purityId) {
            $pStmt = $db->prepare("SELECT touch_purity FROM purity_stamps WHERE id = :id LIMIT 1");
            $pStmt->execute([':id' => $purityId]);
            $touch = (float)$pStmt->fetchColumn();
        }

        $fine = isset($data['fine_weight']) && (float)$data['fine_weight'] > 0
            ? round((float)$data['fine_weight'], 3)
            : round(($net * ($touch > 0 ? $touch : 100)) / 100, 3);

        $quantity = isset($data['quantity']) ? max(0, (int)$data['quantity']) : $existing['quantity'];
        $available = isset($data['available_stock']) ? max(0, (int)$data['available_stock']) : $existing['available_stock'];
        $minStock  = isset($data['minimum_stock_level']) ? max(0, (int)$data['minimum_stock_level']) : $existing['minimum_stock_level'];

        $status = $data['status'] ?? $existing['status'];
        if ($available <= 0) {
            $status = 'Out of Stock';
        } elseif ($available <= $minStock && $minStock > 0) {
            $status = 'Low Stock';
        }

        $sql = "UPDATE stock_items SET
                    stock_code = :stock_code,
                    item_name = :item_name,
                    item_id = :item_id,
                    item_group_id = :item_group_id,
                    metal_type = :metal_type,
                    purity_id = :purity_id,
                    gross_weight = :gross_weight,
                    stone_weight = :stone_weight,
                    other_weight = :other_weight,
                    net_weight = :net_weight,
                    fine_weight = :fine_weight,
                    quantity = :quantity,
                    available_stock = :available_stock,
                    minimum_stock_level = :minimum_stock_level,
                    unit_id = :unit_id,
                    purchase_date = :purchase_date,
                    remarks = :remarks,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id AND is_deleted = 0";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id'                  => $id,
            ':stock_code'          => trim($data['stock_code'] ?? $existing['stock_code']),
            ':item_name'           => trim($data['item_name'] ?? $existing['item_name']),
            ':item_id'             => !empty($data['item_id']) ? (int)$data['item_id'] : $existing['item_id'],
            ':item_group_id'       => !empty($data['item_group_id']) ? (int)$data['item_group_id'] : $existing['item_group_id'],
            ':metal_type'          => !empty($data['metal_type']) ? trim($data['metal_type']) : $existing['metal_type'],
            ':purity_id'           => $purityId,
            ':gross_weight'        => $gross,
            ':stone_weight'        => $stone,
            ':other_weight'        => $other,
            ':net_weight'          => $net,
            ':fine_weight'         => $fine,
            ':quantity'            => $quantity,
            ':available_stock'     => $available,
            ':minimum_stock_level' => $minStock,
            ':unit_id'             => !empty($data['unit_id']) ? (int)$data['unit_id'] : $existing['unit_id'],
            ':purchase_date'       => $data['purchase_date'] ?? $existing['purchase_date'],
            ':remarks'             => $data['remarks'] ?? $existing['remarks'],
            ':status'              => $status,
        ]);

        return self::findById($id);
    }

    /**
     * Safe delete stock item (checks for transaction references)
     */
    public static function delete(int $id): bool {
        $db = Database::getConnection();

        // Check if stock is linked to any vouchers or tags
        $checkTag = $db->prepare("SELECT COUNT(*) FROM inventory_tags WHERE item_id = :id");
        $checkTag->execute([':id' => $id]);
        $tagCount = (int)$checkTag->fetchColumn();

        if ($tagCount > 0) {
            throw new Exception("Cannot delete stock item #{$id} because it is referenced by {$tagCount} active inventory tags.");
        }

        // Soft delete
        $stmt = $db->prepare("UPDATE stock_items SET is_deleted = 1, updated_at = NOW() WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Get dropdown options backed by MySQL tables
     */
    public static function getDropdownOptions(): array {
        $db = Database::getConnection();

        // Item Groups from items table
        $groups = $db->query(
            "SELECT id, group_name AS name, hsn_code, tunch FROM items WHERE is_active = 1 ORDER BY group_name ASC"
        )->fetchAll(PDO::FETCH_ASSOC);

        // Purities from purity_stamps
        $purities = $db->query(
            "SELECT id, name, metal_type, touch_purity FROM purity_stamps WHERE is_active = 1 ORDER BY metal_type DESC, touch_purity DESC"
        )->fetchAll(PDO::FETCH_ASSOC);

        // Units from units table
        $units = $db->query(
            "SELECT id, code, name FROM units WHERE is_active = 1 ORDER BY id ASC"
        )->fetchAll(PDO::FETCH_ASSOC);

        // Standard metal types
        $metalTypes = ['Silver', 'Gold', 'Platinum', 'Diamond', 'Other'];

        // Statuses
        $statuses = ['Available', 'Low Stock', 'Out of Stock'];

        return [
            'item_groups' => $groups,
            'purities'    => $purities,
            'units'       => $units,
            'metal_types' => $metalTypes,
            'statuses'    => $statuses,
            'next_code'   => self::generateNextStockCode(),
        ];
    }
}
