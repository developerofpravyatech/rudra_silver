<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class Item {
    /**
     * Fetch paginated items with search and filters
     */
    public static function paginate(
        ?string $search = null,
        ?string $groupName = null,
        ?string $hsnCode = null,
        int $page = 1,
        int $limit = 20
    ): array {
        $db = Database::getConnection();
        $where = ['1=1'];
        $params = [];

        if ($search !== null && trim($search) !== '') {
            $s = '%' . trim($search) . '%';
            $where[] = '(group_name LIKE :s1 OR hsn_code LIKE :s2 OR job_sac LIKE :s3 OR default_item LIKE :s4 OR com_co LIKE :s5)';
            $params['s1'] = $s;
            $params['s2'] = $s;
            $params['s3'] = $s;
            $params['s4'] = $s;
            $params['s5'] = $s;
        }

        if ($groupName !== null && trim($groupName) !== '') {
            $where[] = 'group_name LIKE :grp';
            $params['grp'] = '%' . trim($groupName) . '%';
        }

        if ($hsnCode !== null && trim($hsnCode) !== '') {
            $where[] = 'hsn_code LIKE :hsn';
            $params['hsn'] = '%' . trim($hsnCode) . '%';
        }

        $whereSql = implode(' AND ', $where);

        // Count total
        $countSql = "SELECT COUNT(*) FROM items WHERE {$whereSql}";
        $countStmt = $db->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        // Fetch records
        $offset = max(0, ($page - 1) * $limit);
        $sql = "SELECT * FROM items WHERE {$whereSql} ORDER BY id ASC LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            self::castItemFields($r);
        }

        return [
            'items' => $rows,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => $total > 0 ? (int)ceil($total / $limit) : 1
        ];
    }

    /**
     * Find item by ID
     */
    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM items WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;

        self::castItemFields($row);
        return $row;
    }

    /**
     * Check if group name already exists (excluding specific ID)
     */
    public static function findByGroupName(string $groupName, ?int $excludeId = null): ?array {
        $db = Database::getConnection();
        $sql = 'SELECT id, group_name FROM items WHERE LOWER(group_name) = LOWER(:grp)';
        $params = ['grp' => trim($groupName)];

        if ($excludeId !== null) {
            $sql .= ' AND id != :id';
            $params['id'] = $excludeId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Check if item is referenced in transactions/tags
     */
    public static function isReferenced(int $id): bool {
        $db = Database::getConnection();
        
        $stmt = $db->prepare('SELECT COUNT(*) FROM voucher_items WHERE item_id = :id');
        $stmt->execute(['id' => $id]);
        if ((int)$stmt->fetchColumn() > 0) return true;

        $stmt = $db->prepare('SELECT COUNT(*) FROM inventory_tags WHERE item_id = :id');
        $stmt->execute(['id' => $id]);
        if ((int)$stmt->fetchColumn() > 0) return true;

        return false;
    }

    /**
     * Create new item
     */
    public static function create(array $data): array {
        $db = Database::getConnection();

        $groupName = trim($data['group_name'] ?? '');
        if ($groupName === '') {
            throw new Exception('Group Name is required.');
        }

        if (self::findByGroupName($groupName)) {
            throw new Exception("Group Name '{$groupName}' already exists.");
        }

        $code = trim($data['code'] ?? '') ?: 'GRP-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $groupName), 0, 8)) . '-' . time();
        $name = trim($data['name'] ?? '') ?: $groupName;

        $sql = "INSERT INTO items (
            group_name, sgst, cgst, igst, hsn_code, job_sac, gstr1_display,
            l_tax, c_tax, com_co, gp_percentage, op_value, cl_value, minimum_stock,
            mrp_type, value_rate, stock_method, tunch, default_item,
            return_policy_enabled, return_valid_days, return_deduction_percent,
            exchange_policy_enabled, exchange_valid_days, exchange_deduction_percent, return_exchange_notes,
            tag_gen_restricted, tag_prefix, min_tag_weight, max_tag_weight,
            card_point_enabled, card_point_percentage, card_points_per_gram,
            code, name, is_active
        ) VALUES (
            :group_name, :sgst, :cgst, :igst, :hsn_code, :job_sac, :gstr1_display,
            :l_tax, :c_tax, :com_co, :gp_percentage, :op_value, :cl_value, :minimum_stock,
            :mrp_type, :value_rate, :stock_method, :tunch, :default_item,
            :return_policy_enabled, :return_valid_days, :return_deduction_percent,
            :exchange_policy_enabled, :exchange_valid_days, :exchange_deduction_percent, :return_exchange_notes,
            :tag_gen_restricted, :tag_prefix, :min_tag_weight, :max_tag_weight,
            :card_point_enabled, :card_point_percentage, :card_points_per_gram,
            :code, :name, :is_active
        )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'group_name'                 => $groupName,
            'sgst'                       => (float)($data['sgst'] ?? 1.50),
            'cgst'                       => (float)($data['cgst'] ?? 1.50),
            'igst'                       => (float)($data['igst'] ?? 3.00),
            'hsn_code'                   => trim($data['hsn_code'] ?? '7113'),
            'job_sac'                    => trim($data['job_sac'] ?? ''),
            'gstr1_display'              => trim($data['gstr1_display'] ?? 'TAXABLE'),
            'l_tax'                      => (float)($data['l_tax'] ?? 0.00),
            'c_tax'                      => (float)($data['c_tax'] ?? 0.00),
            'com_co'                     => trim($data['com_co'] ?? ''),
            'gp_percentage'              => (float)($data['gp_percentage'] ?? 0.00),
            'op_value'                   => (float)($data['op_value'] ?? 0.00),
            'cl_value'                   => (float)($data['cl_value'] ?? 0.00),
            'minimum_stock'              => (int)($data['minimum_stock'] ?? 0),
            'mrp_type'                   => trim($data['mrp_type'] ?? 'FIXED'),
            'value_rate'                 => (float)($data['value_rate'] ?? 0.00),
            'stock_method'               => trim($data['stock_method'] ?? 'FIFO'),
            'tunch'                      => (float)($data['tunch'] ?? 0.00),
            'default_item'               => trim($data['default_item'] ?? ''),
            'return_policy_enabled'      => isset($data['return_policy_enabled']) ? (int)(bool)$data['return_policy_enabled'] : 1,
            'return_valid_days'          => (int)($data['return_valid_days'] ?? 7),
            'return_deduction_percent'   => (float)($data['return_deduction_percent'] ?? 0.00),
            'exchange_policy_enabled'    => isset($data['exchange_policy_enabled']) ? (int)(bool)$data['exchange_policy_enabled'] : 1,
            'exchange_valid_days'        => (int)($data['exchange_valid_days'] ?? 15),
            'exchange_deduction_percent' => (float)($data['exchange_deduction_percent'] ?? 0.00),
            'return_exchange_notes'      => $data['return_exchange_notes'] ?? null,
            'tag_gen_restricted'         => isset($data['tag_gen_restricted']) ? (int)(bool)$data['tag_gen_restricted'] : 0,
            'tag_prefix'                 => trim($data['tag_prefix'] ?? ''),
            'min_tag_weight'             => (float)($data['min_tag_weight'] ?? 0.000),
            'max_tag_weight'             => (float)($data['max_tag_weight'] ?? 0.000),
            'card_point_enabled'         => isset($data['card_point_enabled']) ? (int)(bool)$data['card_point_enabled'] : 0,
            'card_point_percentage'      => (float)($data['card_point_percentage'] ?? 0.00),
            'card_points_per_gram'       => (float)($data['card_points_per_gram'] ?? 0.00),
            'code'                       => $code,
            'name'                       => $name,
            'is_active'                  => isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
        ]);

        $newId = (int)$db->lastInsertId();
        return self::findById($newId);
    }

    /**
     * Update existing item
     */
    public static function update(int $id, array $data): ?array {
        $db = Database::getConnection();

        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Item with ID {$id} not found.");
        }

        if (!empty($data['group_name'])) {
            $groupName = trim($data['group_name']);
            if (self::findByGroupName($groupName, $id)) {
                throw new Exception("Group Name '{$groupName}' already exists.");
            }
        }

        $fields = [
            'group_name', 'sgst', 'cgst', 'igst', 'hsn_code', 'job_sac', 'gstr1_display',
            'l_tax', 'c_tax', 'com_co', 'gp_percentage', 'op_value', 'cl_value', 'minimum_stock',
            'mrp_type', 'value_rate', 'stock_method', 'tunch', 'default_item',
            'return_policy_enabled', 'return_valid_days', 'return_deduction_percent',
            'exchange_policy_enabled', 'exchange_valid_days', 'exchange_deduction_percent', 'return_exchange_notes',
            'tag_gen_restricted', 'tag_prefix', 'min_tag_weight', 'max_tag_weight',
            'card_point_enabled', 'card_point_percentage', 'card_points_per_gram',
            'name', 'is_active'
        ];

        $updates = [];
        $params = ['id' => $id];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = "{$field} = :{$field}";
                $val = $data[$field];
                if (in_array($field, ['sgst', 'cgst', 'igst', 'l_tax', 'c_tax', 'gp_percentage', 'op_value', 'cl_value', 'value_rate', 'tunch', 'return_deduction_percent', 'exchange_deduction_percent', 'min_tag_weight', 'max_tag_weight', 'card_point_percentage', 'card_points_per_gram'])) {
                    $params[$field] = (float)$val;
                } elseif (in_array($field, ['minimum_stock', 'return_valid_days', 'exchange_valid_days'])) {
                    $params[$field] = (int)$val;
                } elseif (in_array($field, ['return_policy_enabled', 'exchange_policy_enabled', 'tag_gen_restricted', 'card_point_enabled', 'is_active'])) {
                    $params[$field] = (int)(bool)$val;
                } else {
                    $params[$field] = $val !== null ? trim((string)$val) : null;
                }
            }
        }

        if (empty($updates)) {
            return $existing;
        }

        $sql = 'UPDATE items SET ' . implode(', ', $updates) . ' WHERE id = :id';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return self::findById($id);
    }

    /**
     * Delete item (with protection check)
     */
    public static function delete(int $id): bool {
        $db = Database::getConnection();

        if (self::isReferenced($id)) {
            throw new Exception("Cannot delete item (ID: {$id}): It is referenced by existing invoices or inventory tags. Deactivate it instead.");
        }

        $stmt = $db->prepare('DELETE FROM items WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Cast array fields to appropriate types
     */
    private static function castItemFields(array &$r): void {
        $r['id'] = (int)$r['id'];
        $r['minimum_stock'] = (int)($r['minimum_stock'] ?? 0);
        $r['return_valid_days'] = (int)($r['return_valid_days'] ?? 0);
        $r['exchange_valid_days'] = (int)($r['exchange_valid_days'] ?? 0);

        $floatFields = [
            'sgst', 'cgst', 'igst', 'l_tax', 'c_tax', 'gp_percentage',
            'op_value', 'cl_value', 'value_rate', 'tunch',
            'return_deduction_percent', 'exchange_deduction_percent',
            'min_tag_weight', 'max_tag_weight', 'card_point_percentage', 'card_points_per_gram'
        ];
        foreach ($floatFields as $f) {
            $r[$f] = isset($r[$f]) ? (float)$r[$f] : 0.0;
        }

        $boolFields = [
            'return_policy_enabled', 'exchange_policy_enabled',
            'tag_gen_restricted', 'card_point_enabled', 'is_active'
        ];
        foreach ($boolFields as $b) {
            $r[$b] = (bool)($r[$b] ?? false);
        }
    }
}
