<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class Category {
    /**
     * Allowed metal types from MySQL ENUM
     */
    public const METAL_TYPES = [
        'GOLD',
        'SILVER',
        'PLATINUM',
        'DIAMOND'
    ];

    /**
     * Fetch paginated categories with search, filters, and item count
     */
    public static function paginate(array $filters = [], int $page = 1, int $limit = 10): array {
        $db = Database::getConnection();
        $where = ['1=1'];
        $params = [];

        // 1. General search
        if (!empty($filters['search'])) {
            $s = '%' . trim($filters['search']) . '%';
            $where[] = '(c.name LIKE :search_name OR c.hsn_code LIKE :search_hsn)';
            $params['search_name'] = $s;
            $params['search_hsn'] = $s;
        }

        // 2. Specific Category Name search
        if (!empty($filters['name'])) {
            $where[] = 'c.name LIKE :filt_name';
            $params['filt_name'] = '%' . trim($filters['name']) . '%';
        }

        // 3. Specific HSN Code search
        if (!empty($filters['hsn_code'])) {
            $where[] = 'c.hsn_code LIKE :filt_hsn';
            $params['filt_hsn'] = '%' . trim($filters['hsn_code']) . '%';
        }

        // 4. Metal Type filter
        if (!empty($filters['metal_type']) && $filters['metal_type'] !== 'all') {
            $mt = strtoupper(trim($filters['metal_type']));
            if (in_array($mt, self::METAL_TYPES, true)) {
                $where[] = 'c.metal_type = :filt_mt';
                $params['filt_mt'] = $mt;
            }
        }

        $whereSql = implode(' AND ', $where);

        // Count total
        $countSql = "SELECT COUNT(*) FROM categories c WHERE {$whereSql}";
        $countStmt = $db->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        // Sorting
        $allowedSortCols = [
            'id'         => 'c.id',
            'metal_type' => 'c.metal_type',
            'name'       => 'c.name',
            'hsn_code'   => 'c.hsn_code',
        ];
        $sortBy = $filters['sort_by'] ?? 'id';
        $orderCol = $allowedSortCols[$sortBy] ?? 'c.id';
        $sortOrder = strtoupper($filters['sort_order'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

        // Fetch records with subquery item count
        $offset = max(0, ($page - 1) * $limit);
        $sql = "SELECT 
                    c.id,
                    c.metal_type,
                    c.name,
                    c.hsn_code,
                    (SELECT COUNT(*) FROM items i WHERE i.category_id = c.id) AS item_count
                FROM categories c
                WHERE {$whereSql}
                ORDER BY {$orderCol} {$sortOrder}
                LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['id'] = (int)$r['id'];
            $r['item_count'] = (int)($r['item_count'] ?? 0);
        }

        return [
            'items'       => $rows,
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => $total > 0 ? (int)ceil($total / $limit) : 1
        ];
    }

    /**
     * Find category by primary key ID
     */
    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $sql = "SELECT 
                    c.id,
                    c.metal_type,
                    c.name,
                    c.hsn_code,
                    (SELECT COUNT(*) FROM items i WHERE i.category_id = c.id) AS item_count
                FROM categories c
                WHERE c.id = :id
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;

        $row['id'] = (int)$row['id'];
        $row['item_count'] = (int)($row['item_count'] ?? 0);
        return $row;
    }

    /**
     * Find category by Name (case-insensitive)
     */
    public static function findByName(string $name, ?int $excludeId = null): ?array {
        $db = Database::getConnection();
        $sql = 'SELECT id, metal_type, name, hsn_code FROM categories WHERE LOWER(name) = LOWER(:name)';
        $params = ['name' => trim($name)];

        if ($excludeId !== null) {
            $sql .= ' AND id != :exclude_id';
            $params['exclude_id'] = $excludeId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['id'] = (int)$row['id'];
        }
        return $row ?: null;
    }

    /**
     * Check if category is referenced by any records in items
     */
    public static function isReferenced(int $id): array {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT COUNT(*) FROM items WHERE category_id = :id');
        $stmt->execute(['id' => $id]);
        $itemCount = (int)$stmt->fetchColumn();

        return [
            'referenced' => $itemCount > 0,
            'item_count' => $itemCount,
            'message'    => $itemCount > 0 ? "Category is referenced by {$itemCount} item(s) in the item master." : ''
        ];
    }

    /**
     * Create a new category
     */
    public static function create(array $data): array {
        $db = Database::getConnection();

        // 1. Metal Type validation
        $metalType = trim($data['metal_type'] ?? '');
        if ($metalType === '') {
            throw new Exception('Metal Type is required.');
        }

        // 2. Category Name validation
        $name = trim($data['name'] ?? '');
        if ($name === '') {
            throw new Exception('Category Name is required.');
        }
        if (mb_strlen($name) > 80) {
            throw new Exception('Category Name cannot exceed 80 characters.');
        }

        // 3. Unique Category Name check
        if (self::findByName($name)) {
            throw new Exception("Category Name '{$name}' already exists. Please choose a unique name.");
        }

        // 4. HSN Code
        $hsnCode = trim($data['hsn_code'] ?? '7113');
        if ($hsnCode === '') {
            $hsnCode = '7113';
        }

        $sql = "INSERT INTO categories (metal_type, name, hsn_code) VALUES (:metal_type, :name, :hsn_code)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            'metal_type' => $metalType,
            'name'       => $name,
            'hsn_code'   => $hsnCode,
        ]);

        $newId = (int)$db->lastInsertId();
        return self::findById($newId);
    }

    /**
     * Update an existing category
     */
    public static function update(int $id, array $data): array {
        $db = Database::getConnection();

        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Category with ID {$id} not found.");
        }

        $updates = [];
        $params = ['id' => $id];

        // 1. Metal Type update
        if (isset($data['metal_type'])) {
            $metalType = trim($data['metal_type']);
            if ($metalType === '') {
                throw new Exception('Metal Type cannot be empty.');
            }
            $updates[] = 'metal_type = :metal_type';
            $params['metal_type'] = $metalType;
        }

        // 2. Category Name update
        if (isset($data['name'])) {
            $name = trim($data['name']);
            if ($name === '') {
                throw new Exception('Category Name cannot be empty.');
            }
            if (mb_strlen($name) > 80) {
                throw new Exception('Category Name cannot exceed 80 characters.');
            }
            // Check uniqueness excluding current ID
            if (self::findByName($name, $id)) {
                throw new Exception("Category Name '{$name}' is already used by another category. Please choose a unique name.");
            }
            $updates[] = 'name = :name';
            $params['name'] = $name;
        }

        // 3. HSN Code update
        if (isset($data['hsn_code'])) {
            $hsnCode = trim($data['hsn_code']);
            $updates[] = 'hsn_code = :hsn_code';
            $params['hsn_code'] = $hsnCode !== '' ? $hsnCode : '7113';
        }

        if (empty($updates)) {
            return $existing;
        }

        $sql = "UPDATE categories SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return self::findById($id);
    }

    /**
     * Delete a category safely
     */
    public static function delete(int $id): bool {
        $db = Database::getConnection();

        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Category with ID {$id} not found.");
        }

        // Check referential integrity with items table
        $ref = self::isReferenced($id);
        if ($ref['referenced']) {
            throw new Exception("Cannot delete category '{$existing['name']}' (ID: {$id}): It is currently referenced by {$ref['item_count']} item(s) in the item master. Please reassign or delete the associated items first.");
        }

        try {
            $stmt = $db->prepare('DELETE FROM categories WHERE id = :id');
            $stmt->execute(['id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (\PDOException $e) {
            // Check if foreign key constraint triggered
            if ($e->getCode() == '23000' || strpos($e->getMessage(), 'foreign key') !== false) {
                throw new Exception("Cannot delete category: Database foreign key constraint prevented deletion because related items exist.");
            }
            throw new Exception("Database error while deleting category: " . $e->getMessage());
        }
    }

    /**
     * Get all categories (for dropdowns)
     */
    public static function getAll(): array {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT id, metal_type, name, hsn_code FROM categories ORDER BY name ASC');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['id'] = (int)$r['id'];
        }
        return $rows;
    }
}
