<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class SaleRegister {
    private static array $sortableColumns = [
        'id'                => 's.id',
        'voucher_date'      => 's.voucher_date',
        'voucher_no'        => 's.voucher_no',
        'party_name'        => 's.party_name',
        'item_name'         => 's.item_name',
        'particular'        => 's.particular',
        'item_code'         => 's.item_code',
        'weight'            => 's.weight',
        'pieces'            => 's.pieces',
        'sale_value'        => 's.sale_value',
        'return_weight'     => 's.return_weight',
        'return_pieces'     => 's.return_pieces',
        'sale_return_value' => 's.sale_return_value',
        'gross_weight'      => 's.gross_weight',
        'net_weight'        => 's.net_weight',
        'diamond_weight'    => 's.diamond_weight',
        'stone_weight'      => 's.stone_weight',
        'tags'              => 's.tags',
        'metal_pieces'      => 's.metal_pieces',
        'gold_weight'       => 's.gold_weight',
        'silver_weight'     => 's.silver_weight',
        'amount'            => 's.amount',
        'created_at'        => 's.created_at',
    ];

    public static function buildWhere(array $filters): array {
        $where = ['s.deleted_at IS NULL'];
        $params = [];

        if (!empty($filters['search'])) {
            $s = '%' . trim($filters['search']) . '%';
            $where[] = '(s.voucher_no LIKE :s1 OR s.party_name LIKE :s2 OR s.item_name LIKE :s3 OR s.particular LIKE :s4 OR s.item_code LIKE :s5 OR s.branch_name LIKE :s6)';
            $params['s1'] = $s;
            $params['s2'] = $s;
            $params['s3'] = $s;
            $params['s4'] = $s;
            $params['s5'] = $s;
            $params['s6'] = $s;
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

        if (!empty($filters['party_name']) && $filters['party_name'] !== 'all' && $filters['party_name'] !== 'ALL') {
            $where[] = 's.party_name = :f_party';
            $params['f_party'] = trim($filters['party_name']);
        }

        if (!empty($filters['account_group']) && $filters['account_group'] !== 'all' && $filters['account_group'] !== 'ALL') {
            $where[] = 's.account_group = :f_acc_group';
            $params['f_acc_group'] = trim($filters['account_group']);
        }

        if (!empty($filters['item_group']) && $filters['item_group'] !== 'all' && $filters['item_group'] !== 'ALL') {
            $where[] = 's.item_group = :f_item_group';
            $params['f_item_group'] = trim($filters['item_group']);
        }

        if (!empty($filters['item_code']) && $filters['item_code'] !== 'all' && $filters['item_code'] !== 'ALL') {
            $where[] = 's.item_code = :f_item_code';
            $params['f_item_code'] = trim($filters['item_code']);
        }

        if (!empty($filters['stamp']) && $filters['stamp'] !== 'all' && $filters['stamp'] !== 'ALL') {
            $where[] = 's.stamp = :f_stamp';
            $params['f_stamp'] = trim($filters['stamp']);
        }

        if (!empty($filters['branch_name']) && $filters['branch_name'] !== 'all' && $filters['branch_name'] !== 'ALL') {
            $where[] = 's.branch_name = :f_branch';
            $params['f_branch'] = trim($filters['branch_name']);
        }

        if (!empty($filters['item_type']) && $filters['item_type'] !== 'all' && $filters['item_type'] !== 'ALL') {
            $where[] = 's.item_type = :f_item_type';
            $params['f_item_type'] = trim($filters['item_type']);
        }

        if (!empty($filters['category']) && $filters['category'] !== 'all' && $filters['category'] !== 'ALL') {
            $where[] = 's.category = :f_cat';
            $params['f_cat'] = trim($filters['category']);
        }

        if (!empty($filters['series']) && $filters['series'] !== 'all' && $filters['series'] !== 'ALL') {
            $where[] = 's.series = :f_series';
            $params['f_series'] = trim($filters['series']);
        }

        if (!empty($filters['quality']) && $filters['quality'] !== 'all' && $filters['quality'] !== 'ALL') {
            $where[] = 's.quality = :f_quality';
            $params['f_quality'] = trim($filters['quality']);
        }

        if (!empty($filters['voucher_type']) && $filters['voucher_type'] !== 'all' && $filters['voucher_type'] !== 'ALL') {
            $where[] = 's.voucher_type = :f_vou_type';
            $params['f_vou_type'] = trim($filters['voucher_type']);
        }

        if (!empty($filters['register_type']) && $filters['register_type'] !== 'all' && $filters['register_type'] !== 'ALL') {
            $where[] = 's.register_type = :f_reg_type';
            $params['f_reg_type'] = trim($filters['register_type']);
        }

        // Boolean filters
        if (isset($filters['is_sold']) && $filters['is_sold'] !== '' && $filters['is_sold'] !== null && $filters['is_sold'] !== false) {
            $where[] = 's.is_sold = :f_sold';
            $params['f_sold'] = (int)$filters['is_sold'];
        }

        if (isset($filters['in_stock']) && $filters['in_stock'] !== '' && $filters['in_stock'] !== null && $filters['in_stock'] !== false) {
            $where[] = 's.in_stock = :f_in_stock';
            $params['f_in_stock'] = (int)$filters['in_stock'];
        }

        if (isset($filters['net_value']) && $filters['net_value'] !== '' && $filters['net_value'] !== null && $filters['net_value'] !== false) {
            $where[] = 's.net_value = :f_net_val';
            $params['f_net_val'] = (int)$filters['net_value'];
        }

        if (isset($filters['is_approved']) && $filters['is_approved'] !== '' && $filters['is_approved'] !== null && $filters['is_approved'] !== false) {
            $where[] = 's.is_approved = :f_app';
            $params['f_app'] = (int)$filters['is_approved'];
        }

        if (isset($filters['is_excluded']) && $filters['is_excluded'] !== '' && $filters['is_excluded'] !== null && $filters['is_excluded'] !== false) {
            $where[] = 's.is_excluded = :f_excl';
            $params['f_excl'] = (int)$filters['is_excluded'];
        }

        if (isset($filters['include_metal']) && $filters['include_metal'] !== '' && $filters['include_metal'] !== null && $filters['include_metal'] !== false) {
            $where[] = 's.include_metal = :f_inc_metal';
            $params['f_inc_metal'] = (int)$filters['include_metal'];
        }

        return [implode(' AND ', $where), $params];
    }

    public static function paginate(
        array $filters = [],
        string $sortBy = 'voucher_date',
        string $sortOrder = 'desc',
        int $page = 1,
        int $limit = 20
    ): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhere($filters);

        // Sum Totals across all filtered rows
        $sumSql = "SELECT 
                    COUNT(*) as total_count,
                    COALESCE(SUM(s.weight), 0) as sum_weight,
                    COALESCE(SUM(s.pieces), 0) as sum_pieces,
                    COALESCE(SUM(s.sale_value), 0) as sum_sale_value,
                    COALESCE(SUM(s.return_weight), 0) as sum_return_weight,
                    COALESCE(SUM(s.return_pieces), 0) as sum_return_pieces,
                    COALESCE(SUM(s.sale_return_value), 0) as sum_sale_return_value,
                    COALESCE(SUM(s.gross_weight), 0) as sum_gross_weight,
                    COALESCE(SUM(s.net_weight), 0) as sum_net_weight,
                    COALESCE(SUM(s.diamond_weight), 0) as sum_diamond_weight,
                    COALESCE(SUM(s.stone_weight), 0) as sum_stone_weight,
                    COALESCE(SUM(s.tags), 0) as sum_tags,
                    COALESCE(SUM(s.metal_pieces), 0) as sum_metal_pieces,
                    COALESCE(SUM(s.gold_weight), 0) as sum_gold_weight,
                    COALESCE(SUM(s.silver_weight), 0) as sum_silver_weight,
                    COALESCE(SUM(s.amount), 0) as sum_amount
                   FROM sale_register s
                   WHERE {$whereSql}";

        $sumStmt = $db->prepare($sumSql);
        $sumStmt->execute($params);
        $t = $sumStmt->fetch(PDO::FETCH_ASSOC);

        $totalRecords = (int)($t['total_count'] ?? 0);
        $totalPages = $limit > 0 ? (int)ceil($totalRecords / $limit) : 1;

        $sortColumn = self::$sortableColumns[$sortBy] ?? 's.id';
        $sortDir = strtolower($sortOrder) === 'asc' ? 'ASC' : 'DESC';
        $offset = ($page - 1) * $limit;

        $listSql = "SELECT s.*
                    FROM sale_register s
                    WHERE {$whereSql}
                    ORDER BY {$sortColumn} {$sortDir}, s.id DESC
                    LIMIT :lim OFFSET :off";

        $listStmt = $db->prepare($listSql);
        foreach ($params as $k => $v) {
            $listStmt->bindValue(":{$k}", $v);
        }
        $listStmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $listStmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $listStmt->execute();

        $rows = $listStmt->fetchAll(PDO::FETCH_ASSOC);
        $items = array_map([self::class, 'formatRow'], $rows);

        return [
            'items'       => $items,
            'total'       => $totalRecords,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => max(1, $totalPages),
            'totals'      => [
                'weight'            => (float)($t['sum_weight'] ?? 0),
                'pieces'            => (int)($t['sum_pieces'] ?? 0),
                'sale_value'        => (float)($t['sum_sale_value'] ?? 0),
                'return_weight'     => (float)($t['sum_return_weight'] ?? 0),
                'return_pieces'     => (int)($t['sum_return_pieces'] ?? 0),
                'sale_return_value' => (float)($t['sum_sale_return_value'] ?? 0),
                'gross_weight'      => (float)($t['sum_gross_weight'] ?? 0),
                'net_weight'        => (float)($t['sum_net_weight'] ?? 0),
                'diamond_weight'    => (float)($t['sum_diamond_weight'] ?? 0),
                'stone_weight'      => (float)($t['sum_stone_weight'] ?? 0),
                'tags'              => (int)($t['sum_tags'] ?? 0),
                'metal_pieces'      => (int)($t['sum_metal_pieces'] ?? 0),
                'gold_weight'       => (float)($t['sum_gold_weight'] ?? 0),
                'silver_weight'     => (float)($t['sum_silver_weight'] ?? 0),
                'amount'            => (float)($t['sum_amount'] ?? 0),
            ]
        ];
    }

    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM sale_register WHERE id = :id AND deleted_at IS NULL LIMIT 1");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? self::formatRow($row) : null;
    }

    public static function create(array $data): array {
        $db = Database::getConnection();

        $voucherNo = trim((string)($data['voucher_no'] ?? ''));
        if ($voucherNo === '') {
            $voucherNo = 'SAL-' . date('Ymd') . '-' . rand(100, 999);
        }

        $voucherDate = !empty($data['voucher_date']) ? $data['voucher_date'] : date('Y-m-d');
        $partyName = trim((string)($data['party_name'] ?? ''));
        $itemName = trim((string)($data['item_name'] ?? ''));
        $itemType = trim((string)($data['item_type'] ?? ''));
        $particular = trim((string)($data['particular'] ?? $itemName));

        if ($partyName === '') {
            throw new Exception('Party Name is required.');
        }
        if ($itemName === '') {
            throw new Exception('Item Name is required.');
        }
        if ($itemType === '') {
            throw new Exception('Item Type is required.');
        }

        $sql = "INSERT INTO sale_register (
                    voucher_no, voucher_date, voucher_type, party_name, account_group,
                    item_group, item_code, stamp, branch_name, login_name,
                    register_type, item_name, particular, item_type, category, series,
                    quality, weight, pieces, sale_value, return_weight,
                    return_pieces, sale_return_value, gross_weight, net_weight, diamond_weight,
                    stone_weight, tags, metal_pieces, gold_weight, silver_weight,
                    amount, is_selected, is_approved, is_excluded, include_metal,
                    is_sold, in_stock, net_value, is_active, remarks,
                    created_at, updated_at
                ) VALUES (
                    :voucher_no, :voucher_date, :voucher_type, :party_name, :account_group,
                    :item_group, :item_code, :stamp, :branch_name, :login_name,
                    :register_type, :item_name, :particular, :item_type, :category, :series,
                    :quality, :weight, :pieces, :sale_value, :return_weight,
                    :return_pieces, :sale_return_value, :gross_weight, :net_weight, :diamond_weight,
                    :stone_weight, :tags, :metal_pieces, :gold_weight, :silver_weight,
                    :amount, :is_selected, :is_approved, :is_excluded, :include_metal,
                    :is_sold, :in_stock, :net_value, :is_active, :remarks,
                    NOW(), NOW()
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'voucher_no'        => $voucherNo,
            'voucher_date'      => $voucherDate,
            'voucher_type'      => trim((string)($data['voucher_type'] ?? 'SALE')),
            'party_name'        => $partyName,
            'account_group'     => trim((string)($data['account_group'] ?? '')),
            'item_group'        => trim((string)($data['item_group'] ?? '')),
            'item_code'         => trim((string)($data['item_code'] ?? '')),
            'stamp'             => trim((string)($data['stamp'] ?? '')),
            'branch_name'       => trim((string)($data['branch_name'] ?? 'Rajkot Main')),
            'login_name'        => trim((string)($data['login_name'] ?? 'admin')),
            'register_type'     => in_array($data['register_type'] ?? '', ['ALL', 'TAGGED', 'LOOSE', 'JOB', 'ORDER', 'W_O_TAG']) ? $data['register_type'] : 'TAGGED',
            'item_name'         => $itemName,
            'particular'        => $particular,
            'item_type'         => $itemType,
            'category'          => trim((string)($data['category'] ?? '')),
            'series'            => trim((string)($data['series'] ?? '')),
            'quality'           => trim((string)($data['quality'] ?? '')),
            'weight'            => max(0, (float)($data['weight'] ?? 0)),
            'pieces'            => max(0, (int)($data['pieces'] ?? 0)),
            'sale_value'        => max(0, (float)($data['sale_value'] ?? 0)),
            'return_weight'     => max(0, (float)($data['return_weight'] ?? 0)),
            'return_pieces'     => max(0, (int)($data['return_pieces'] ?? 0)),
            'sale_return_value' => max(0, (float)($data['sale_return_value'] ?? 0)),
            'gross_weight'      => max(0, (float)($data['gross_weight'] ?? 0)),
            'net_weight'        => max(0, (float)($data['net_weight'] ?? 0)),
            'diamond_weight'    => max(0, (float)($data['diamond_weight'] ?? 0)),
            'stone_weight'      => max(0, (float)($data['stone_weight'] ?? 0)),
            'tags'              => max(0, (int)($data['tags'] ?? 0)),
            'metal_pieces'      => max(0, (int)($data['metal_pieces'] ?? 0)),
            'gold_weight'       => max(0, (float)($data['gold_weight'] ?? 0)),
            'silver_weight'     => max(0, (float)($data['silver_weight'] ?? 0)),
            'amount'            => max(0, (float)($data['amount'] ?? 0)),
            'is_selected'       => !empty($data['is_selected']) ? 1 : 0,
            'is_approved'       => !empty($data['is_approved']) ? 1 : 0,
            'is_excluded'       => !empty($data['is_excluded']) ? 1 : 0,
            'include_metal'     => !empty($data['include_metal']) ? 1 : 0,
            'is_sold'           => isset($data['is_sold']) ? (!empty($data['is_sold']) ? 1 : 0) : 1,
            'in_stock'          => !empty($data['in_stock']) ? 1 : 0,
            'net_value'         => !empty($data['net_value']) ? 1 : 0,
            'is_active'         => isset($data['is_active']) ? (int)$data['is_active'] : 1,
            'remarks'           => trim((string)($data['remarks'] ?? '')),
        ]);

        $id = (int)$db->lastInsertId();
        return self::findById($id);
    }

    public static function update(int $id, array $data): array {
        $db = Database::getConnection();

        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Sale register record #{$id} not found.");
        }

        $voucherNo = isset($data['voucher_no']) ? trim((string)$data['voucher_no']) : $existing['voucher_no'];
        $voucherDate = isset($data['voucher_date']) ? $data['voucher_date'] : $existing['voucher_date'];
        $partyName = isset($data['party_name']) ? trim((string)$data['party_name']) : $existing['party_name'];
        $itemName = isset($data['item_name']) ? trim((string)$data['item_name']) : $existing['item_name'];
        $itemType = isset($data['item_type']) ? trim((string)$data['item_type']) : $existing['item_type'];
        $particular = isset($data['particular']) ? trim((string)$data['particular']) : $existing['particular'];

        if ($partyName === '') {
            throw new Exception('Party Name is required.');
        }
        if ($itemName === '') {
            throw new Exception('Item Name is required.');
        }
        if ($itemType === '') {
            throw new Exception('Item Type is required.');
        }

        $sql = "UPDATE sale_register SET
                    voucher_no        = :voucher_no,
                    voucher_date      = :voucher_date,
                    voucher_type      = :voucher_type,
                    party_name        = :party_name,
                    account_group     = :account_group,
                    item_group        = :item_group,
                    item_code         = :item_code,
                    stamp             = :stamp,
                    branch_name       = :branch_name,
                    login_name        = :login_name,
                    register_type     = :register_type,
                    item_name         = :item_name,
                    particular        = :particular,
                    item_type         = :item_type,
                    category          = :category,
                    series            = :series,
                    quality           = :quality,
                    weight            = :weight,
                    pieces            = :pieces,
                    sale_value        = :sale_value,
                    return_weight     = :return_weight,
                    return_pieces     = :return_pieces,
                    sale_return_value = :sale_return_value,
                    gross_weight      = :gross_weight,
                    net_weight        = :net_weight,
                    diamond_weight    = :diamond_weight,
                    stone_weight      = :stone_weight,
                    tags              = :tags,
                    metal_pieces      = :metal_pieces,
                    gold_weight       = :gold_weight,
                    silver_weight     = :silver_weight,
                    amount            = :amount,
                    is_selected       = :is_selected,
                    is_approved       = :is_approved,
                    is_excluded       = :is_excluded,
                    include_metal     = :include_metal,
                    is_sold           = :is_sold,
                    in_stock          = :in_stock,
                    net_value         = :net_value,
                    is_active         = :is_active,
                    remarks           = :remarks,
                    updated_at        = NOW()
                WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'id'                => $id,
            'voucher_no'        => $voucherNo,
            'voucher_date'      => $voucherDate,
            'voucher_type'      => isset($data['voucher_type']) ? trim((string)$data['voucher_type']) : $existing['voucher_type'],
            'party_name'        => $partyName,
            'account_group'     => isset($data['account_group']) ? trim((string)$data['account_group']) : $existing['account_group'],
            'item_group'        => isset($data['item_group']) ? trim((string)$data['item_group']) : $existing['item_group'],
            'item_code'         => isset($data['item_code']) ? trim((string)$data['item_code']) : $existing['item_code'],
            'stamp'             => isset($data['stamp']) ? trim((string)$data['stamp']) : $existing['stamp'],
            'branch_name'       => isset($data['branch_name']) ? trim((string)$data['branch_name']) : $existing['branch_name'],
            'login_name'        => isset($data['login_name']) ? trim((string)$data['login_name']) : $existing['login_name'],
            'register_type'     => isset($data['register_type']) && in_array($data['register_type'], ['ALL', 'TAGGED', 'LOOSE', 'JOB', 'ORDER', 'W_O_TAG']) ? $data['register_type'] : $existing['register_type'],
            'item_name'         => $itemName,
            'particular'        => $particular,
            'item_type'         => $itemType,
            'category'          => isset($data['category']) ? trim((string)$data['category']) : $existing['category'],
            'series'            => isset($data['series']) ? trim((string)$data['series']) : $existing['series'],
            'quality'           => isset($data['quality']) ? trim((string)$data['quality']) : $existing['quality'],
            'weight'            => max(0, (float)($data['weight'] ?? $existing['weight'])),
            'pieces'            => max(0, (int)($data['pieces'] ?? $existing['pieces'])),
            'sale_value'        => max(0, (float)($data['sale_value'] ?? $existing['sale_value'])),
            'return_weight'     => max(0, (float)($data['return_weight'] ?? $existing['return_weight'])),
            'return_pieces'     => max(0, (int)($data['return_pieces'] ?? $existing['return_pieces'])),
            'sale_return_value' => max(0, (float)($data['sale_return_value'] ?? $existing['sale_return_value'])),
            'gross_weight'      => max(0, (float)($data['gross_weight'] ?? $existing['gross_weight'])),
            'net_weight'        => max(0, (float)($data['net_weight'] ?? $existing['net_weight'])),
            'diamond_weight'    => max(0, (float)($data['diamond_weight'] ?? $existing['diamond_weight'])),
            'stone_weight'      => max(0, (float)($data['stone_weight'] ?? $existing['stone_weight'])),
            'tags'              => max(0, (int)($data['tags'] ?? $existing['tags'])),
            'metal_pieces'      => max(0, (int)($data['metal_pieces'] ?? $existing['metal_pieces'])),
            'gold_weight'       => max(0, (float)($data['gold_weight'] ?? $existing['gold_weight'])),
            'silver_weight'     => max(0, (float)($data['silver_weight'] ?? $existing['silver_weight'])),
            'amount'            => max(0, (float)($data['amount'] ?? $existing['amount'])),
            'is_selected'       => isset($data['is_selected']) ? (!empty($data['is_selected']) ? 1 : 0) : $existing['is_selected'],
            'is_approved'       => isset($data['is_approved']) ? (!empty($data['is_approved']) ? 1 : 0) : $existing['is_approved'],
            'is_excluded'       => isset($data['is_excluded']) ? (!empty($data['is_excluded']) ? 1 : 0) : $existing['is_excluded'],
            'include_metal'     => isset($data['include_metal']) ? (!empty($data['include_metal']) ? 1 : 0) : $existing['include_metal'],
            'is_sold'           => isset($data['is_sold']) ? (!empty($data['is_sold']) ? 1 : 0) : $existing['is_sold'],
            'in_stock'          => isset($data['in_stock']) ? (!empty($data['in_stock']) ? 1 : 0) : $existing['in_stock'],
            'net_value'         => isset($data['net_value']) ? (!empty($data['net_value']) ? 1 : 0) : $existing['net_value'],
            'is_active'         => isset($data['is_active']) ? (int)$data['is_active'] : $existing['is_active'],
            'remarks'           => isset($data['remarks']) ? trim((string)$data['remarks']) : $existing['remarks'],
        ]);

        return self::findById($id);
    }

    public static function softDelete(int $id): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE sale_register SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public static function filterOptions(): array {
        $db = Database::getConnection();

        $parties = $db->query("SELECT DISTINCT party_name FROM sale_register WHERE party_name IS NOT NULL AND party_name != '' AND deleted_at IS NULL ORDER BY party_name ASC")->fetchAll(PDO::FETCH_COLUMN);
        $groups = $db->query("SELECT DISTINCT account_group FROM sale_register WHERE account_group IS NOT NULL AND account_group != '' AND deleted_at IS NULL ORDER BY account_group ASC")->fetchAll(PDO::FETCH_COLUMN);
        $itemGroups = $db->query("SELECT DISTINCT item_group FROM sale_register WHERE item_group IS NOT NULL AND item_group != '' AND deleted_at IS NULL ORDER BY item_group ASC")->fetchAll(PDO::FETCH_COLUMN);
        $itemCodes = $db->query("SELECT DISTINCT item_code FROM sale_register WHERE item_code IS NOT NULL AND item_code != '' AND deleted_at IS NULL ORDER BY item_code ASC")->fetchAll(PDO::FETCH_COLUMN);
        $stamps = $db->query("SELECT DISTINCT stamp FROM sale_register WHERE stamp IS NOT NULL AND stamp != '' AND deleted_at IS NULL ORDER BY stamp ASC")->fetchAll(PDO::FETCH_COLUMN);
        $branches = $db->query("SELECT DISTINCT branch_name FROM sale_register WHERE branch_name IS NOT NULL AND branch_name != '' AND deleted_at IS NULL ORDER BY branch_name ASC")->fetchAll(PDO::FETCH_COLUMN);
        $itemTypes = $db->query("SELECT DISTINCT item_type FROM sale_register WHERE item_type IS NOT NULL AND item_type != '' AND deleted_at IS NULL ORDER BY item_type ASC")->fetchAll(PDO::FETCH_COLUMN);
        $categories = $db->query("SELECT DISTINCT category FROM sale_register WHERE category IS NOT NULL AND category != '' AND deleted_at IS NULL ORDER BY category ASC")->fetchAll(PDO::FETCH_COLUMN);
        $seriesList = $db->query("SELECT DISTINCT series FROM sale_register WHERE series IS NOT NULL AND series != '' AND deleted_at IS NULL ORDER BY series ASC")->fetchAll(PDO::FETCH_COLUMN);
        $qualities = $db->query("SELECT DISTINCT quality FROM sale_register WHERE quality IS NOT NULL AND quality != '' AND deleted_at IS NULL ORDER BY quality ASC")->fetchAll(PDO::FETCH_COLUMN);
        $voucherTypes = $db->query("SELECT DISTINCT voucher_type FROM sale_register WHERE voucher_type IS NOT NULL AND voucher_type != '' AND deleted_at IS NULL ORDER BY voucher_type ASC")->fetchAll(PDO::FETCH_COLUMN);

        return [
            'parties'        => $parties,
            'account_groups' => $groups,
            'item_groups'    => $itemGroups,
            'item_codes'     => $itemCodes,
            'stamps'         => $stamps,
            'branches'       => $branches,
            'item_types'     => $itemTypes,
            'categories'     => $categories,
            'series'         => $seriesList,
            'qualities'      => $qualities,
            'voucher_types'  => $voucherTypes,
        ];
    }

    public static function export(array $filters): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhere($filters);

        $sql = "SELECT s.* FROM sale_register s WHERE {$whereSql} ORDER BY s.voucher_date DESC, s.id DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([self::class, 'formatRow'], $rows);
    }

    private static function formatRow(array $row): array {
        return [
            'id'                => (int)$row['id'],
            'voucher_no'        => $row['voucher_no'] ?? '',
            'voucher_date'      => $row['voucher_date'] ?? '',
            'voucher_type'      => $row['voucher_type'] ?? 'SALE',
            'party_name'        => $row['party_name'] ?? '',
            'account_group'     => $row['account_group'] ?? '',
            'item_group'        => $row['item_group'] ?? '',
            'item_code'         => $row['item_code'] ?? '',
            'stamp'             => $row['stamp'] ?? '',
            'branch_name'       => $row['branch_name'] ?? '',
            'login_name'        => $row['login_name'] ?? '',
            'register_type'     => $row['register_type'] ?? 'TAGGED',
            'item_name'         => $row['item_name'] ?? '',
            'particular'        => $row['particular'] ?? '',
            'item_type'         => $row['item_type'] ?? '',
            'category'          => $row['category'] ?? '',
            'series'            => $row['series'] ?? '',
            'quality'           => $row['quality'] ?? '',
            'weight'            => (float)($row['weight'] ?? 0),
            'pieces'            => (int)($row['pieces'] ?? 0),
            'sale_value'        => (float)($row['sale_value'] ?? 0),
            'return_weight'     => (float)($row['return_weight'] ?? 0),
            'return_pieces'     => (int)($row['return_pieces'] ?? 0),
            'sale_return_value' => (float)($row['sale_return_value'] ?? 0),
            'gross_weight'      => (float)($row['gross_weight'] ?? 0),
            'net_weight'        => (float)($row['net_weight'] ?? 0),
            'diamond_weight'    => (float)($row['diamond_weight'] ?? 0),
            'stone_weight'      => (float)($row['stone_weight'] ?? 0),
            'tags'              => (int)($row['tags'] ?? 0),
            'metal_pieces'      => (int)($row['metal_pieces'] ?? 0),
            'gold_weight'       => (float)($row['gold_weight'] ?? 0),
            'silver_weight'     => (float)($row['silver_weight'] ?? 0),
            'amount'            => (float)($row['amount'] ?? 0),
            'is_selected'       => (int)($row['is_selected'] ?? 0),
            'is_approved'       => (int)($row['is_approved'] ?? 0),
            'is_excluded'       => (int)($row['is_excluded'] ?? 0),
            'include_metal'     => (int)($row['include_metal'] ?? 0),
            'is_sold'           => (int)($row['is_sold'] ?? 1),
            'in_stock'          => (int)($row['in_stock'] ?? 0),
            'net_value'         => (int)($row['net_value'] ?? 0),
            'is_active'         => (int)($row['is_active'] ?? 1),
            'remarks'           => $row['remarks'] ?? '',
            'created_at'        => $row['created_at'] ?? '',
            'updated_at'        => $row['updated_at'] ?? '',
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

    /**
     * Compute independent Sale Register bottom summary aggregate values from sale_register only.
     */
    public static function getSummary(array $filters): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhere($filters);

        $sql = "SELECT 
            COUNT(s.id) AS total_records,
            COALESCE(SUM(s.weight), 0) AS total_weight,
            COALESCE(SUM(s.pieces), 0) AS total_pieces,
            COALESCE(SUM(s.sale_value), 0) AS total_sale_value,
            COALESCE(SUM(s.return_weight), 0) AS total_return_weight,
            COALESCE(SUM(s.return_pieces), 0) AS total_return_pieces,
            COALESCE(SUM(s.sale_return_value), 0) AS total_sale_return_value,
            COALESCE(SUM(s.gross_weight), 0) AS total_gross_weight,
            COALESCE(SUM(s.net_weight), 0) AS total_net_weight,
            COALESCE(SUM(s.diamond_weight), 0) AS total_diamond_weight,
            COALESCE(SUM(s.stone_weight), 0) AS total_stone_weight,
            COALESCE(SUM(s.tags), 0) AS total_tags,
            COALESCE(SUM(s.metal_pieces), 0) AS total_metal_pieces,
            COALESCE(SUM(s.gold_weight), 0) AS total_gold_weight,
            COALESCE(SUM(s.silver_weight), 0) AS total_silver_weight,
            COALESCE(SUM(s.amount), 0) AS total_amount,
            COALESCE(SUM(CASE WHEN s.is_sold = 1 THEN 1 ELSE 0 END), 0) AS total_sold_items
        FROM sale_register s
        WHERE {$whereSql}";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $totalRecords = (int)($row['total_records'] ?? 0);
        $totalWeight = (float)($row['total_weight'] ?? 0);
        $totalPieces = (int)($row['total_pieces'] ?? 0);
        $totalSaleVal = (float)($row['total_sale_value'] ?? 0);
        $totalReturnWeight = (float)($row['total_return_weight'] ?? 0);
        $totalReturnPieces = (int)($row['total_return_pieces'] ?? 0);
        $totalSaleReturnVal = (float)($row['total_sale_return_value'] ?? 0);
        $totalGrossWeight = (float)($row['total_gross_weight'] ?? 0);
        $totalNetWeight = (float)($row['total_net_weight'] ?? 0);
        $totalDiamondWeight = (float)($row['total_diamond_weight'] ?? 0);
        $totalStoneWeight = (float)($row['total_stone_weight'] ?? 0);
        $totalTags = (int)($row['total_tags'] ?? 0);
        $totalMetalPieces = (int)($row['total_metal_pieces'] ?? 0);
        $totalGoldWeight = (float)($row['total_gold_weight'] ?? 0);
        $totalSilverWeight = (float)($row['total_silver_weight'] ?? 0);
        $totalAmount = (float)($row['total_amount'] ?? 0);
        $totalSoldItems = (int)($row['total_sold_items'] ?? 0);

        $netSaleVal = $totalSaleVal - $totalSaleReturnVal;
        $netSaleWeight = $totalWeight - $totalReturnWeight;
        $netSalePieces = $totalPieces - $totalReturnPieces;
        $avgRate = $totalWeight > 0 ? round($totalSaleVal / $totalWeight, 2) : 0.0;

        return [
            'total_records'           => $totalRecords,
            'total_weight'            => round($totalWeight, 3),
            'total_pieces'            => $totalPieces,
            'total_sale_value'        => round($totalSaleVal, 2),
            'total_return_weight'     => round($totalReturnWeight, 3),
            'total_return_pieces'     => $totalReturnPieces,
            'total_sale_return_value' => round($totalSaleReturnVal, 2),
            'net_sale_value'          => round($netSaleVal, 2),
            'net_sale_weight'         => round($netSaleWeight, 3),
            'net_sale_pieces'         => $netSalePieces,
            'total_gross_weight'      => round($totalGrossWeight, 3),
            'total_net_weight'        => round($totalNetWeight, 3),
            'total_diamond_weight'    => round($totalDiamondWeight, 3),
            'total_stone_weight'      => round($totalStoneWeight, 3),
            'total_tags'              => $totalTags,
            'total_metal_pieces'      => $totalMetalPieces,
            'total_gold_weight'       => round($totalGoldWeight, 3),
            'total_silver_weight'     => round($totalSilverWeight, 3),
            'total_amount'            => round($totalAmount, 2),
            'avg_rate'                => $avgRate,
            'total_sold_items'        => $totalSoldItems,
        ];
    }
}
