<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class Item {
    /**
     * Allowed labour types from MySQL ENUM
     */
    public const LABOUR_TYPES = [
        'PER_GRAM_NET',
        'PER_GRAM_GROSS',
        'PER_PIECE',
        'PERCENTAGE'
    ];

    /**
     * Fetch paginated items with joins, search, and filters
     */
    public static function paginate(array $filters = [], int $page = 1, int $limit = 20): array {
        $db = Database::getConnection();
        $where = ['1=1'];
        $params = [];

        // 1. General search across multiple fields
        if (!empty($filters['search'])) {
            $s = '%' . trim($filters['search']) . '%';
            $where[] = '(i.name LIKE :search_name OR i.code LIKE :search_code OR i.group_name LIKE :search_grp OR i.default_item LIKE :search_item OR i.hsn_code LIKE :search_hsn)';
            $params['search_name'] = $s;
            $params['search_code'] = $s;
            $params['search_grp'] = $s;
            $params['search_item'] = $s;
            $params['search_hsn'] = $s;
        }

        // 2. Specific item name filter
        if (!empty($filters['name'])) {
            $where[] = 'i.name LIKE :filt_name';
            $params['filt_name'] = '%' . trim($filters['name']) . '%';
        }

        // 3. Specific item code filter
        if (!empty($filters['code'])) {
            $where[] = 'i.code LIKE :filt_code';
            $params['filt_code'] = '%' . trim($filters['code']) . '%';
        }

        // 4. Group name filter
        if (!empty($filters['group_name']) && $filters['group_name'] !== 'all') {
            $where[] = 'i.group_name = :filt_group';
            $params['filt_group'] = trim($filters['group_name']);
        }

        // 5. Category filter
        if (!empty($filters['category_id']) && $filters['category_id'] !== 'all') {
            $where[] = 'i.category_id = :filt_cat_id';
            $params['filt_cat_id'] = (int)$filters['category_id'];
        }

        // 6. Active status filter
        if (isset($filters['is_active']) && $filters['is_active'] !== '' && $filters['is_active'] !== 'all') {
            $where[] = 'i.is_active = :filt_is_active';
            $params['filt_is_active'] = (int)$filters['is_active'];
        }

        // 7. Stock method filter
        if (!empty($filters['stock_method']) && $filters['stock_method'] !== 'all') {
            $where[] = 'i.stock_method = :filt_stock_method';
            $params['filt_stock_method'] = trim($filters['stock_method']);
        }

        // 8. Labour type filter
        if (!empty($filters['labour_type']) && $filters['labour_type'] !== 'all') {
            $where[] = 'i.labour_type = :filt_labour_type';
            $params['filt_labour_type'] = trim($filters['labour_type']);
        }

        $whereSql = implode(' AND ', $where);

        // Count total matching records
        $countSql = "SELECT COUNT(*) FROM items i 
                     LEFT JOIN categories c ON c.id = i.category_id 
                     LEFT JOIN purity_stamps ps ON ps.id = i.default_stamp_id 
                     WHERE {$whereSql}";
        $countStmt = $db->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        // Sorting
        $allowedSortCols = [
            'id'                  => 'i.id',
            'name'                => 'i.name',
            'code'                => 'i.code',
            'group_name'          => 'i.group_name',
            'category_name'       => 'c.name',
            'tunch'               => 'i.tunch',
            'default_wastage'     => 'i.default_wastage',
            'default_labour_rate' => 'i.default_labour_rate',
            'labour_type'         => 'i.labour_type',
            'stock_method'        => 'i.stock_method',
            'is_active'           => 'i.is_active',
            'created_at'          => 'i.created_at',
        ];
        $sortBy = $filters['sort_by'] ?? 'id';
        $orderCol = $allowedSortCols[$sortBy] ?? 'i.id';
        $sortOrder = strtoupper($filters['sort_order'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

        // Fetch records with joins
        $offset = max(0, ($page - 1) * $limit);
        $sql = "SELECT 
                    i.*,
                    c.name AS category_name,
                    c.metal_type AS category_metal_type,
                    ps.name AS stamp_name,
                    ps.touch_purity AS stamp_touch_purity
                FROM items i
                LEFT JOIN categories c ON c.id = i.category_id
                LEFT JOIN purity_stamps ps ON ps.id = i.default_stamp_id
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
            self::castItemFields($r);
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
     * Find item by ID with joined Category and Stamp details
     */
    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $sql = "SELECT 
                    i.*,
                    c.name AS category_name,
                    c.metal_type AS category_metal_type,
                    ps.name AS stamp_name,
                    ps.touch_purity AS stamp_touch_purity
                FROM items i
                LEFT JOIN categories c ON c.id = i.category_id
                LEFT JOIN purity_stamps ps ON ps.id = i.default_stamp_id
                WHERE i.id = :id
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;

        self::castItemFields($row);
        return $row;
    }

    /**
     * Find item by unique Code (case-insensitive)
     */
    public static function findByCode(string $code, ?int $excludeId = null): ?array {
        $db = Database::getConnection();
        $sql = 'SELECT id, code, name FROM items WHERE LOWER(code) = LOWER(:code)';
        $params = ['code' => trim($code)];

        if ($excludeId !== null) {
            $sql .= ' AND id != :exclude_id';
            $params['exclude_id'] = $excludeId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Find item by Group Name (case-insensitive)
     */
    public static function findByGroupName(string $groupName, ?int $excludeId = null): ?array {
        $db = Database::getConnection();
        $sql = 'SELECT id, group_name FROM items WHERE LOWER(group_name) = LOWER(:grp)';
        $params = ['grp' => trim($groupName)];

        if ($excludeId !== null) {
            $sql .= ' AND id != :exclude_id';
            $params['exclude_id'] = $excludeId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Check if item is referenced in transactions/tags/vouchers/jobs
     */
    public static function isReferenced(int $id): array {
        $db = Database::getConnection();
        $reasons = [];

        // Check voucher_items
        $stmt = $db->prepare('SELECT COUNT(*) FROM voucher_items WHERE item_id = :id');
        $stmt->execute(['id' => $id]);
        $count = (int)$stmt->fetchColumn();
        if ($count > 0) {
            $reasons[] = "{$count} voucher transaction line item(s)";
        }

        // Check inventory_tags
        $stmt = $db->prepare('SELECT COUNT(*) FROM inventory_tags WHERE item_id = :id');
        $stmt->execute(['id' => $id]);
        $count = (int)$stmt->fetchColumn();
        if ($count > 0) {
            $reasons[] = "{$count} inventory tag barcode record(s)";
        }

        // Check job_cards
        try {
            $stmt = $db->prepare('SELECT COUNT(*) FROM job_cards WHERE target_item_id = :id');
            $stmt->execute(['id' => $id]);
            $count = (int)$stmt->fetchColumn();
            if ($count > 0) {
                $reasons[] = "{$count} manufacturing job card(s)";
            }
        } catch (\Throwable $e) {
            // job_cards might be optional
        }

        // Check item name in stock_status or metal_stock
        $item = self::findById($id);
        if ($item && !empty($item['name'])) {
            try {
                $stmt = $db->prepare('SELECT COUNT(*) FROM stock_status WHERE LOWER(item_name) = LOWER(:name)');
                $stmt->execute(['name' => $item['name']]);
                $count = (int)$stmt->fetchColumn();
                if ($count > 0) {
                    $reasons[] = "{$count} stock status record(s)";
                }
            } catch (\Throwable $e) {}

            try {
                $stmt = $db->prepare('SELECT COUNT(*) FROM metal_stock WHERE LOWER(item_name) = LOWER(:name)');
                $stmt->execute(['name' => $item['name']]);
                $count = (int)$stmt->fetchColumn();
                if ($count > 0) {
                    $reasons[] = "{$count} metal stock record(s)";
                }
            } catch (\Throwable $e) {}
        }

        return [
            'referenced' => !empty($reasons),
            'reasons'    => $reasons,
            'message'    => !empty($reasons) ? 'Item is referenced by: ' . implode(', ', $reasons) : ''
        ];
    }

    /**
     * Create new item
     */
    public static function create(array $data): array {
        $db = Database::getConnection();

        $name = trim($data['name'] ?? '');
        if ($name === '') {
            throw new Exception('Item Name is required.');
        }

        $code = trim($data['code'] ?? '');
        if ($code === '') {
            throw new Exception('Item Code is required.');
        }

        // Validate unique code
        if (self::findByCode($code)) {
            throw new Exception("Item Code '{$code}' already exists. Please choose a unique code.");
        }

        $groupName = trim($data['group_name'] ?? '') ?: $name;

        // Category validation
        $categoryId = isset($data['category_id']) && (int)$data['category_id'] > 0 ? (int)$data['category_id'] : 1;
        $catStmt = $db->prepare('SELECT id FROM categories WHERE id = :id');
        $catStmt->execute(['id' => $categoryId]);
        if (!$catStmt->fetch()) {
            throw new Exception("Selected Category (ID: {$categoryId}) does not exist.");
        }

        // Purity Stamp validation
        $stampId = isset($data['default_stamp_id']) && (int)$data['default_stamp_id'] > 0 ? (int)$data['default_stamp_id'] : 1;
        $stampStmt = $db->prepare('SELECT id FROM purity_stamps WHERE id = :id');
        $stampStmt->execute(['id' => $stampId]);
        if (!$stampStmt->fetch()) {
            throw new Exception("Selected Purity Stamp (ID: {$stampId}) does not exist.");
        }

        // Labour Type validation
        $labourType = trim($data['labour_type'] ?? 'PER_GRAM_NET');
        if (!in_array($labourType, self::LABOUR_TYPES, true)) {
            $labourType = 'PER_GRAM_NET';
        }

        $sql = "INSERT INTO items (
            group_name, sgst, cgst, igst, code, category_id, name, default_stamp_id,
            default_wastage, default_labour_rate, labour_type,
            hsn_code, job_sac, gstr1_display, l_tax, c_tax, com_co, gp_percentage,
            op_value, cl_value, minimum_stock, mrp_type, value_rate, stock_method,
            tunch, default_item, return_policy_enabled, return_valid_days, return_deduction_percent,
            exchange_policy_enabled, exchange_valid_days, exchange_deduction_percent, return_exchange_notes,
            tag_gen_restricted, tag_prefix, min_tag_weight, max_tag_weight,
            card_point_enabled, card_point_percentage, card_points_per_gram, is_active,
            sale_on_mrp, divide_by, into_by, pur_less_pct, sale_less_pct, dis_types,
            detail_salesman, update_mrp_col,
            return_item_less_pct, return_labour_less_pct, return_diamond_less_pct, return_stone_less_pct, return_metal_by,
            exchange_item_less_pct, exchange_labour_less_pct, exchange_diamond_less_pct, exchange_stone_less_pct, exchange_metal_by,
            polish_wt, stud_stamp, dia_rate, stn_rate, re_order_level, upload_file
        ) VALUES (
            :group_name, :sgst, :cgst, :igst, :code, :category_id, :name, :default_stamp_id,
            :default_wastage, :default_labour_rate, :labour_type,
            :hsn_code, :job_sac, :gstr1_display, :l_tax, :c_tax, :com_co, :gp_percentage,
            :op_value, :cl_value, :minimum_stock, :mrp_type, :value_rate, :stock_method,
            :tunch, :default_item, :return_policy_enabled, :return_valid_days, :return_deduction_percent,
            :exchange_policy_enabled, :exchange_valid_days, :exchange_deduction_percent, :return_exchange_notes,
            :tag_gen_restricted, :tag_prefix, :min_tag_weight, :max_tag_weight,
            :card_point_enabled, :card_point_percentage, :card_points_per_gram, :is_active,
            :sale_on_mrp, :divide_by, :into_by, :pur_less_pct, :sale_less_pct, :dis_types,
            :detail_salesman, :update_mrp_col,
            :return_item_less_pct, :return_labour_less_pct, :return_diamond_less_pct, :return_stone_less_pct, :return_metal_by,
            :exchange_item_less_pct, :exchange_labour_less_pct, :exchange_diamond_less_pct, :exchange_stone_less_pct, :exchange_metal_by,
            :polish_wt, :stud_stamp, :dia_rate, :stn_rate, :re_order_level, :upload_file
        )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'group_name'                 => $groupName,
            'sgst'                       => (float)($data['sgst'] ?? 1.50),
            'cgst'                       => (float)($data['cgst'] ?? 1.50),
            'igst'                       => (float)($data['igst'] ?? 3.00),
            'code'                       => $code,
            'category_id'                => $categoryId,
            'name'                       => $name,
            'default_stamp_id'           => $stampId,
            'default_wastage'            => (float)($data['default_wastage'] ?? 0.00),
            'default_labour_rate'        => (float)($data['default_labour_rate'] ?? 0.00),
            'labour_type'                => $labourType,
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
            'return_exchange_notes'      => !empty($data['return_exchange_notes']) ? trim($data['return_exchange_notes']) : null,
            'tag_gen_restricted'         => isset($data['tag_gen_restricted']) ? (int)(bool)$data['tag_gen_restricted'] : 0,
            'tag_prefix'                 => trim($data['tag_prefix'] ?? ''),
            'min_tag_weight'             => (float)($data['min_tag_weight'] ?? 0.000),
            'max_tag_weight'             => (float)($data['max_tag_weight'] ?? 0.000),
            'card_point_enabled'         => isset($data['card_point_enabled']) ? (int)(bool)$data['card_point_enabled'] : 0,
            'card_point_percentage'      => (float)($data['card_point_percentage'] ?? 0.00),
            'card_points_per_gram'       => (float)($data['card_points_per_gram'] ?? 0.00),
            'is_active'                  => isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
            'sale_on_mrp'                => trim($data['sale_on_mrp'] ?? 'NO'),
            'divide_by'                  => (float)($data['divide_by'] ?? 1.00),
            'into_by'                    => (float)($data['into_by'] ?? 1.00),
            'pur_less_pct'               => (float)($data['pur_less_pct'] ?? 0.00),
            'sale_less_pct'              => (float)($data['sale_less_pct'] ?? 0.00),
            'dis_types'                  => trim($data['dis_types'] ?? 'PERCENTAGE'),
            'detail_salesman'            => trim($data['detail_salesman'] ?? ''),
            'update_mrp_col'             => trim($data['update_mrp_col'] ?? 'AUTO'),
            'return_item_less_pct'       => (float)($data['return_item_less_pct'] ?? 0.00),
            'return_labour_less_pct'     => (float)($data['return_labour_less_pct'] ?? 0.00),
            'return_diamond_less_pct'    => (float)($data['return_diamond_less_pct'] ?? 0.00),
            'return_stone_less_pct'      => (float)($data['return_stone_less_pct'] ?? 0.00),
            'return_metal_by'            => trim($data['return_metal_by'] ?? 'CURRENT_RATE'),
            'exchange_item_less_pct'     => (float)($data['exchange_item_less_pct'] ?? 0.00),
            'exchange_labour_less_pct'   => (float)($data['exchange_labour_less_pct'] ?? 0.00),
            'exchange_diamond_less_pct'  => (float)($data['exchange_diamond_less_pct'] ?? 0.00),
            'exchange_stone_less_pct'    => (float)($data['exchange_stone_less_pct'] ?? 0.00),
            'exchange_metal_by'          => trim($data['exchange_metal_by'] ?? 'CURRENT_RATE'),
            'polish_wt'                  => (float)($data['polish_wt'] ?? 0.000),
            'stud_stamp'                 => trim($data['stud_stamp'] ?? ''),
            'dia_rate'                   => (float)($data['dia_rate'] ?? 0.00),
            'stn_rate'                   => (float)($data['stn_rate'] ?? 0.00),
            're_order_level'             => (int)($data['re_order_level'] ?? 0),
            'upload_file'                => trim($data['upload_file'] ?? ''),
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

        // Validate code uniqueness if code is changed
        if (!empty($data['code'])) {
            $code = trim($data['code']);
            if (self::findByCode($code, $id)) {
                throw new Exception("Item Code '{$code}' is already used by another item. Please choose a unique code.");
            }
        }

        // Category validation if provided
        if (isset($data['category_id'])) {
            $categoryId = (int)$data['category_id'];
            $catStmt = $db->prepare('SELECT id FROM categories WHERE id = :id');
            $catStmt->execute(['id' => $categoryId]);
            if (!$catStmt->fetch()) {
                throw new Exception("Selected Category (ID: {$categoryId}) does not exist.");
            }
        }

        // Stamp validation if provided
        if (isset($data['default_stamp_id'])) {
            $stampId = (int)$data['default_stamp_id'];
            $stampStmt = $db->prepare('SELECT id FROM purity_stamps WHERE id = :id');
            $stampStmt->execute(['id' => $stampId]);
            if (!$stampStmt->fetch()) {
                throw new Exception("Selected Purity Stamp (ID: {$stampId}) does not exist.");
            }
        }

        // Labour type validation if provided
        if (isset($data['labour_type']) && !in_array($data['labour_type'], self::LABOUR_TYPES, true)) {
            $data['labour_type'] = 'PER_GRAM_NET';
        }

        $fields = [
            'group_name', 'sgst', 'cgst', 'igst', 'code', 'category_id', 'name', 'default_stamp_id',
            'default_wastage', 'default_labour_rate', 'labour_type',
            'hsn_code', 'job_sac', 'gstr1_display', 'l_tax', 'c_tax', 'com_co', 'gp_percentage',
            'op_value', 'cl_value', 'minimum_stock', 'mrp_type', 'value_rate', 'stock_method',
            'tunch', 'default_item', 'return_policy_enabled', 'return_valid_days', 'return_deduction_percent',
            'exchange_policy_enabled', 'exchange_valid_days', 'exchange_deduction_percent', 'return_exchange_notes',
            'tag_gen_restricted', 'tag_prefix', 'min_tag_weight', 'max_tag_weight',
            'card_point_enabled', 'card_point_percentage', 'card_points_per_gram', 'is_active',
            'sale_on_mrp', 'divide_by', 'into_by', 'pur_less_pct', 'sale_less_pct', 'dis_types',
            'detail_salesman', 'update_mrp_col',
            'return_item_less_pct', 'return_labour_less_pct', 'return_diamond_less_pct', 'return_stone_less_pct', 'return_metal_by',
            'exchange_item_less_pct', 'exchange_labour_less_pct', 'exchange_diamond_less_pct', 'exchange_stone_less_pct', 'exchange_metal_by',
            'polish_wt', 'stud_stamp', 'dia_rate', 'stn_rate', 're_order_level', 'upload_file'
        ];

        $updates = [];
        $params = ['id' => $id];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = "{$field} = :{$field}";
                $val = $data[$field];

                if (in_array($field, [
                    'sgst', 'cgst', 'igst', 'l_tax', 'c_tax', 'gp_percentage', 'op_value', 'cl_value', 'value_rate', 'tunch',
                    'default_wastage', 'default_labour_rate', 'return_deduction_percent', 'exchange_deduction_percent',
                    'min_tag_weight', 'max_tag_weight', 'card_point_percentage', 'card_points_per_gram',
                    'divide_by', 'into_by', 'pur_less_pct', 'sale_less_pct',
                    'return_item_less_pct', 'return_labour_less_pct', 'return_diamond_less_pct', 'return_stone_less_pct',
                    'exchange_item_less_pct', 'exchange_labour_less_pct', 'exchange_diamond_less_pct', 'exchange_stone_less_pct',
                    'polish_wt', 'dia_rate', 'stn_rate'
                ], true)) {
                    $params[$field] = (float)$val;
                } elseif (in_array($field, ['category_id', 'default_stamp_id', 'minimum_stock', 'return_valid_days', 'exchange_valid_days', 're_order_level'], true)) {
                    $params[$field] = (int)$val;
                } elseif (in_array($field, ['return_policy_enabled', 'exchange_policy_enabled', 'tag_gen_restricted', 'card_point_enabled', 'is_active'], true)) {
                    $params[$field] = (int)(bool)$val;
                } elseif ($field === 'return_exchange_notes') {
                    $params[$field] = !empty($val) ? trim($val) : null;
                } else {
                    $params[$field] = trim((string)$val);
                }
            }
        }

        if (empty($updates)) {
            return $existing;
        }

        $sql = "UPDATE items SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return self::findById($id);
    }

    /**
     * Delete item by ID after verifying safety
     */
    public static function delete(int $id): bool {
        $db = Database::getConnection();

        $ref = self::isReferenced($id);
        if ($ref['referenced']) {
            throw new Exception("Cannot delete item (ID: {$id}): " . $ref['message'] . ". Consider deactivating the item instead.");
        }

        $stmt = $db->prepare('DELETE FROM items WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Get list of Categories for dropdown
     */
    public static function getCategories(): array {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT id, name, metal_type, hsn_code FROM categories ORDER BY name ASC');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get list of Purity Stamps for dropdown
     */
    public static function getPurityStamps(): array {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT id, name, touch_purity, metal_type, is_active FROM purity_stamps WHERE is_active = 1 ORDER BY touch_purity DESC');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['id'] = (int)$r['id'];
            $r['touch_purity'] = (float)$r['touch_purity'];
            $r['is_active'] = (bool)$r['is_active'];
        }
        return $rows;
    }

    /**
     * Get distinct filter options (groups, stock methods, labour types)
     */
    public static function getFilterOptions(): array {
        $db = Database::getConnection();

        // Distinct groups
        $stmtGrp = $db->query("SELECT DISTINCT group_name FROM items WHERE group_name != '' AND group_name IS NOT NULL ORDER BY group_name ASC");
        $groups = $stmtGrp->fetchAll(PDO::FETCH_COLUMN);

        // Distinct stock methods
        $stmtSm = $db->query("SELECT DISTINCT stock_method FROM items WHERE stock_method != '' AND stock_method IS NOT NULL ORDER BY stock_method ASC");
        $stockMethods = $stmtSm->fetchAll(PDO::FETCH_COLUMN);
        if (empty($stockMethods)) {
            $stockMethods = ['FIFO', 'LIFO', 'WEIGHTED_AVG'];
        }

        return [
            'categories'    => self::getCategories(),
            'stamps'        => self::getPurityStamps(),
            'group_names'   => $groups,
            'stock_methods' => $stockMethods,
            'labour_types'  => self::LABOUR_TYPES,
        ];
    }

    /**
     * Type cast raw string values from PDO
     */
    private static function castItemFields(array &$r): void {
        $r['id'] = (int)$r['id'];
        $r['category_id'] = isset($r['category_id']) ? (int)$r['category_id'] : 1;
        $r['default_stamp_id'] = isset($r['default_stamp_id']) ? (int)$r['default_stamp_id'] : 1;
        $r['minimum_stock'] = (int)($r['minimum_stock'] ?? 0);
        $r['return_valid_days'] = (int)($r['return_valid_days'] ?? 7);
        $r['exchange_valid_days'] = (int)($r['exchange_valid_days'] ?? 15);

        // Floats
        $r['sgst'] = (float)($r['sgst'] ?? 1.50);
        $r['cgst'] = (float)($r['cgst'] ?? 1.50);
        $r['igst'] = (float)($r['igst'] ?? 3.00);
        $r['default_wastage'] = (float)($r['default_wastage'] ?? 0.00);
        $r['default_labour_rate'] = (float)($r['default_labour_rate'] ?? 0.00);
        $r['l_tax'] = (float)($r['l_tax'] ?? 0.00);
        $r['c_tax'] = (float)($r['c_tax'] ?? 0.00);
        $r['gp_percentage'] = (float)($r['gp_percentage'] ?? 0.00);
        $r['op_value'] = (float)($r['op_value'] ?? 0.00);
        $r['cl_value'] = (float)($r['cl_value'] ?? 0.00);
        $r['value_rate'] = (float)($r['value_rate'] ?? 0.00);
        $r['tunch'] = (float)($r['tunch'] ?? 0.00);
        $r['return_deduction_percent'] = (float)($r['return_deduction_percent'] ?? 0.00);
        $r['exchange_deduction_percent'] = (float)($r['exchange_deduction_percent'] ?? 0.00);
        $r['min_tag_weight'] = (float)($r['min_tag_weight'] ?? 0.000);
        $r['max_tag_weight'] = (float)($r['max_tag_weight'] ?? 0.000);
        $r['card_point_percentage'] = (float)($r['card_point_percentage'] ?? 0.00);
        $r['card_points_per_gram'] = (float)($r['card_points_per_gram'] ?? 0.00);
        if (isset($r['stamp_touch_purity'])) {
            $r['stamp_touch_purity'] = (float)$r['stamp_touch_purity'];
        }

        // Booleans
        $r['return_policy_enabled'] = (bool)($r['return_policy_enabled'] ?? true);
        $r['exchange_policy_enabled'] = (bool)($r['exchange_policy_enabled'] ?? true);
        $r['tag_gen_restricted'] = (bool)($r['tag_gen_restricted'] ?? false);
        $r['card_point_enabled'] = (bool)($r['card_point_enabled'] ?? false);
        $r['is_active'] = (bool)($r['is_active'] ?? true);
    }
}
