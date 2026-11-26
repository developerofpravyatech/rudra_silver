<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class PurchaseRegister {
    private static array $sortableColumns = [
        'id'                    => 'p.id',
        'voucher_date'          => 'p.voucher_date',
        'voucher_no'            => 'p.voucher_no',
        'party_name'            => 'p.party_name',
        'particular'            => 'p.particular',
        'item_code'             => 'p.item_code',
        'weight'                => 'p.weight',
        'pieces'                => 'p.pieces',
        'purchase_value'        => 'p.purchase_value',
        'return_weight'         => 'p.return_weight',
        'return_pieces'         => 'p.return_pieces',
        'purchase_return_value' => 'p.purchase_return_value',
        'gross_weight'          => 'p.gross_weight',
        'net_weight'            => 'p.net_weight',
        'diamond_weight'        => 'p.diamond_weight',
        'stone_weight'          => 'p.stone_weight',
        'tags'                  => 'p.tags',
        'metal_pieces'          => 'p.metal_pieces',
        'gold_weight'           => 'p.gold_weight',
        'silver_weight'         => 'p.silver_weight',
        'amount'                => 'p.amount',
        'created_at'            => 'p.created_at',
    ];

    public static function buildWhere(array $filters): array {
        $where = ['p.deleted_at IS NULL'];
        $params = [];

        if (!empty($filters['search'])) {
            $s = '%' . trim($filters['search']) . '%';
            $where[] = '(p.voucher_no LIKE :s1 OR p.party_name LIKE :s2 OR p.particular LIKE :s3 OR p.item_code LIKE :s4 OR p.branch_name LIKE :s5 OR p.voucher_type LIKE :s6)';
            $params['s1'] = $s;
            $params['s2'] = $s;
            $params['s3'] = $s;
            $params['s4'] = $s;
            $params['s5'] = $s;
            $params['s6'] = $s;
        }

        $dateFrom = self::normalizeDate($filters['from_date'] ?? ($filters['date_from'] ?? null));
        if (!empty($dateFrom)) {
            $where[] = 'p.voucher_date >= :f_from';
            $params['f_from'] = $dateFrom;
        }

        $dateTo = self::normalizeDate($filters['to_date'] ?? ($filters['date_to'] ?? null));
        if (!empty($dateTo)) {
            $where[] = 'p.voucher_date <= :f_to';
            $params['f_to'] = $dateTo;
        }

        if (!empty($filters['party_name']) && $filters['party_name'] !== 'all' && $filters['party_name'] !== 'ALL') {
            $where[] = 'p.party_name = :f_party';
            $params['f_party'] = trim($filters['party_name']);
        }

        if (!empty($filters['account_group']) && $filters['account_group'] !== 'all' && $filters['account_group'] !== 'ALL') {
            $where[] = 'p.account_group = :f_acc_group';
            $params['f_acc_group'] = trim($filters['account_group']);
        }

        if (!empty($filters['item_group']) && $filters['item_group'] !== 'all' && $filters['item_group'] !== 'ALL') {
            $where[] = 'p.item_group = :f_item_group';
            $params['f_item_group'] = trim($filters['item_group']);
        }

        if (!empty($filters['item_code']) && $filters['item_code'] !== 'all' && $filters['item_code'] !== 'ALL') {
            $where[] = 'p.item_code = :f_item_code';
            $params['f_item_code'] = trim($filters['item_code']);
        }

        if (!empty($filters['stamp']) && $filters['stamp'] !== 'all' && $filters['stamp'] !== 'ALL') {
            $where[] = 'p.stamp = :f_stamp';
            $params['f_stamp'] = trim($filters['stamp']);
        }

        if (!empty($filters['branch_name']) && $filters['branch_name'] !== 'all' && $filters['branch_name'] !== 'ALL') {
            $where[] = 'p.branch_name = :f_branch';
            $params['f_branch'] = trim($filters['branch_name']);
        }

        if (!empty($filters['login_name']) && $filters['login_name'] !== 'all' && $filters['login_name'] !== 'ALL') {
            $where[] = 'p.login_name = :f_login';
            $params['f_login'] = trim($filters['login_name']);
        }

        if (!empty($filters['register_type']) && $filters['register_type'] !== 'all' && $filters['register_type'] !== 'ALL') {
            $where[] = 'p.register_type = :f_reg_type';
            $params['f_reg_type'] = trim($filters['register_type']);
        }

        if (!empty($filters['voucher_type']) && $filters['voucher_type'] !== 'all' && $filters['voucher_type'] !== 'ALL') {
            $where[] = 'p.voucher_type = :f_vou_type';
            $params['f_vou_type'] = trim($filters['voucher_type']);
        }

        if (!empty($filters['quality']) && $filters['quality'] !== 'all' && $filters['quality'] !== 'ALL') {
            $where[] = 'p.quality = :f_quality';
            $params['f_quality'] = trim($filters['quality']);
        }

        if (!empty($filters['item_type']) && $filters['item_type'] !== 'all' && $filters['item_type'] !== 'ALL') {
            $where[] = 'p.item_type = :f_item_type';
            $params['f_item_type'] = trim($filters['item_type']);
        }

        if (!empty($filters['category']) && $filters['category'] !== 'all' && $filters['category'] !== 'ALL') {
            $where[] = 'p.category = :f_cat';
            $params['f_cat'] = trim($filters['category']);
        }

        if (!empty($filters['series']) && $filters['series'] !== 'all' && $filters['series'] !== 'ALL') {
            $where[] = 'p.series = :f_series';
            $params['f_series'] = trim($filters['series']);
        }

        // Boolean filters
        if (isset($filters['is_selected']) && $filters['is_selected'] !== '' && $filters['is_selected'] !== null && $filters['is_selected'] !== false) {
            $where[] = 'p.is_selected = :f_sel';
            $params['f_sel'] = (int)$filters['is_selected'];
        }

        if (isset($filters['is_approved']) && $filters['is_approved'] !== '' && $filters['is_approved'] !== null && $filters['is_approved'] !== false) {
            $where[] = 'p.is_approved = :f_app';
            $params['f_app'] = (int)$filters['is_approved'];
        }

        if (isset($filters['is_excluded']) && $filters['is_excluded'] !== '' && $filters['is_excluded'] !== null && $filters['is_excluded'] !== false) {
            $where[] = 'p.is_excluded = :f_excl';
            $params['f_excl'] = (int)$filters['is_excluded'];
        }

        if (isset($filters['is_cancelled']) && $filters['is_cancelled'] !== '' && $filters['is_cancelled'] !== null && $filters['is_cancelled'] !== false) {
            $where[] = 'p.is_cancelled = :f_canc';
            $params['f_canc'] = (int)$filters['is_cancelled'];
        }

        if (isset($filters['include_metal']) && $filters['include_metal'] !== '' && $filters['include_metal'] !== null && $filters['include_metal'] !== false) {
            $where[] = 'p.include_metal = :f_inc_metal';
            $params['f_inc_metal'] = (int)$filters['include_metal'];
        }

        if (isset($filters['in_stock']) && $filters['in_stock'] !== '' && $filters['in_stock'] !== null && $filters['in_stock'] !== false) {
            $where[] = 'p.in_stock = :f_in_stock';
            $params['f_in_stock'] = (int)$filters['in_stock'];
        }

        if (isset($filters['net_value']) && $filters['net_value'] !== '' && $filters['net_value'] !== null && $filters['net_value'] !== false) {
            $where[] = 'p.net_value = :f_net_val';
            $params['f_net_val'] = (int)$filters['net_value'];
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

        // Calculate Totals across all matching records
        $sumSql = "SELECT 
                    COUNT(*) as total_count,
                    COALESCE(SUM(p.weight), 0) as sum_weight,
                    COALESCE(SUM(p.pieces), 0) as sum_pieces,
                    COALESCE(SUM(p.purchase_value), 0) as sum_purchase_value,
                    COALESCE(SUM(p.return_weight), 0) as sum_return_weight,
                    COALESCE(SUM(p.return_pieces), 0) as sum_return_pieces,
                    COALESCE(SUM(p.purchase_return_value), 0) as sum_purchase_return_value,
                    COALESCE(SUM(p.gross_weight), 0) as sum_gross_weight,
                    COALESCE(SUM(p.net_weight), 0) as sum_net_weight,
                    COALESCE(SUM(p.diamond_weight), 0) as sum_diamond_weight,
                    COALESCE(SUM(p.stone_weight), 0) as sum_stone_weight,
                    COALESCE(SUM(p.tags), 0) as sum_tags,
                    COALESCE(SUM(p.metal_pieces), 0) as sum_metal_pieces,
                    COALESCE(SUM(p.gold_weight), 0) as sum_gold_weight,
                    COALESCE(SUM(p.silver_weight), 0) as sum_silver_weight,
                    COALESCE(SUM(p.amount), 0) as sum_amount
                   FROM purchase_register p
                   WHERE {$whereSql}";

        $sumStmt = $db->prepare($sumSql);
        $sumStmt->execute($params);
        $t = $sumStmt->fetch(PDO::FETCH_ASSOC);

        $totalRecords = (int)($t['total_count'] ?? 0);
        $totalPages = $limit > 0 ? (int)ceil($totalRecords / $limit) : 1;

        $sortColumn = self::$sortableColumns[$sortBy] ?? 'p.id';
        $sortDir = strtolower($sortOrder) === 'asc' ? 'ASC' : 'DESC';
        $offset = ($page - 1) * $limit;

        $listSql = "SELECT p.*
                    FROM purchase_register p
                    WHERE {$whereSql}
                    ORDER BY {$sortColumn} {$sortDir}, p.id DESC
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
                'weight'                => (float)($t['sum_weight'] ?? 0),
                'pieces'                => (int)($t['sum_pieces'] ?? 0),
                'purchase_value'        => (float)($t['sum_purchase_value'] ?? 0),
                'return_weight'         => (float)($t['sum_return_weight'] ?? 0),
                'return_pieces'         => (int)($t['sum_return_pieces'] ?? 0),
                'purchase_return_value' => (float)($t['sum_purchase_return_value'] ?? 0),
                'gross_weight'          => (float)($t['sum_gross_weight'] ?? 0),
                'net_weight'            => (float)($t['sum_net_weight'] ?? 0),
                'diamond_weight'        => (float)($t['sum_diamond_weight'] ?? 0),
                'stone_weight'          => (float)($t['sum_stone_weight'] ?? 0),
                'tags'                  => (int)($t['sum_tags'] ?? 0),
                'metal_pieces'          => (int)($t['sum_metal_pieces'] ?? 0),
                'gold_weight'           => (float)($t['sum_gold_weight'] ?? 0),
                'silver_weight'         => (float)($t['sum_silver_weight'] ?? 0),
                'amount'                => (float)($t['sum_amount'] ?? 0),
            ]
        ];
    }

    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM purchase_register WHERE id = :id AND deleted_at IS NULL LIMIT 1");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? self::formatRow($row) : null;
    }

    public static function create(array $data): array {
        $db = Database::getConnection();

        $voucherNo = trim((string)($data['voucher_no'] ?? ''));
        if ($voucherNo === '') {
            $voucherNo = 'PUR-' . date('Ymd') . '-' . rand(100, 999);
        }

        $voucherDate = !empty($data['voucher_date']) ? $data['voucher_date'] : date('Y-m-d');
        $partyName = trim((string)($data['party_name'] ?? ''));
        $particular = trim((string)($data['particular'] ?? ''));

        if ($partyName === '') {
            throw new Exception('Party Name is required.');
        }
        if ($particular === '') {
            throw new Exception('Particular is required.');
        }

        $sql = "INSERT INTO purchase_register (
                    voucher_no, voucher_date, voucher_type, party_name, account_group,
                    item_group, item_code, stamp, branch_name, login_name,
                    register_type, particular, item_type, category, series,
                    quality, weight, pieces, purchase_value, return_weight,
                    return_pieces, purchase_return_value, gross_weight, net_weight, diamond_weight,
                    stone_weight, tags, metal_pieces, gold_weight, silver_weight,
                    amount, is_selected, is_approved, is_excluded, is_cancelled,
                    include_metal, in_stock, net_value, is_active, remarks,
                    created_at, updated_at
                ) VALUES (
                    :voucher_no, :voucher_date, :voucher_type, :party_name, :account_group,
                    :item_group, :item_code, :stamp, :branch_name, :login_name,
                    :register_type, :particular, :item_type, :category, :series,
                    :quality, :weight, :pieces, :purchase_value, :return_weight,
                    :return_pieces, :purchase_return_value, :gross_weight, :net_weight, :diamond_weight,
                    :stone_weight, :tags, :metal_pieces, :gold_weight, :silver_weight,
                    :amount, :is_selected, :is_approved, :is_excluded, :is_cancelled,
                    :include_metal, :in_stock, :net_value, :is_active, :remarks,
                    NOW(), NOW()
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'voucher_no'            => $voucherNo,
            'voucher_date'          => $voucherDate,
            'voucher_type'          => trim((string)($data['voucher_type'] ?? 'PURCHASE')),
            'party_name'            => $partyName,
            'account_group'         => trim((string)($data['account_group'] ?? '')),
            'item_group'            => trim((string)($data['item_group'] ?? '')),
            'item_code'             => trim((string)($data['item_code'] ?? '')),
            'stamp'                 => trim((string)($data['stamp'] ?? '')),
            'branch_name'           => trim((string)($data['branch_name'] ?? 'Rajkot Main')),
            'login_name'            => trim((string)($data['login_name'] ?? 'admin')),
            'register_type'         => in_array($data['register_type'] ?? '', ['ALL', 'TAGGED', 'LOOSE', 'JOB', 'ORDER', 'W_O_TAG']) ? $data['register_type'] : 'TAGGED',
            'particular'            => $particular,
            'item_type'             => trim((string)($data['item_type'] ?? '')),
            'category'              => trim((string)($data['category'] ?? '')),
            'series'                => trim((string)($data['series'] ?? '')),
            'quality'               => trim((string)($data['quality'] ?? '')),
            'weight'                => max(0, (float)($data['weight'] ?? 0)),
            'pieces'                => max(0, (int)($data['pieces'] ?? 0)),
            'purchase_value'        => max(0, (float)($data['purchase_value'] ?? 0)),
            'return_weight'         => max(0, (float)($data['return_weight'] ?? 0)),
            'return_pieces'         => max(0, (int)($data['return_pieces'] ?? 0)),
            'purchase_return_value' => max(0, (float)($data['purchase_return_value'] ?? 0)),
            'gross_weight'          => max(0, (float)($data['gross_weight'] ?? 0)),
            'net_weight'            => max(0, (float)($data['net_weight'] ?? 0)),
            'diamond_weight'        => max(0, (float)($data['diamond_weight'] ?? 0)),
            'stone_weight'          => max(0, (float)($data['stone_weight'] ?? 0)),
            'tags'                  => max(0, (int)($data['tags'] ?? 0)),
            'metal_pieces'          => max(0, (int)($data['metal_pieces'] ?? 0)),
            'gold_weight'           => max(0, (float)($data['gold_weight'] ?? 0)),
            'silver_weight'         => max(0, (float)($data['silver_weight'] ?? 0)),
            'amount'                => max(0, (float)($data['amount'] ?? 0)),
            'is_selected'           => !empty($data['is_selected']) ? 1 : 0,
            'is_approved'           => !empty($data['is_approved']) ? 1 : 0,
            'is_excluded'           => !empty($data['is_excluded']) ? 1 : 0,
            'is_cancelled'          => !empty($data['is_cancelled']) ? 1 : 0,
            'include_metal'         => !empty($data['include_metal']) ? 1 : 0,
            'in_stock'              => !empty($data['in_stock']) ? 1 : 0,
            'net_value'             => !empty($data['net_value']) ? 1 : 0,
            'is_active'             => isset($data['is_active']) ? (int)$data['is_active'] : 1,
            'remarks'               => trim((string)($data['remarks'] ?? '')),
        ]);

        $id = (int)$db->lastInsertId();
        $invTotal = max(0, (float)($data['amount'] ?? $data['purchase_value'] ?? 0));
        $gstAmt = max(0, (float)($data['gst_amount'] ?? 0));
        $db->prepare("UPDATE purchase_register SET gst_amount = :gst, paid_amount = 0, outstanding_amount = :out, payment_status = 'UNPAID' WHERE id = :id")
           ->execute(['gst' => $gstAmt, 'out' => $invTotal, 'id' => $id]);
        self::postAccounting($id, $data);
        return self::findById($id);
    }

    public static function update(int $id, array $data): array {
        $db = Database::getConnection();

        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Purchase register record #{$id} not found.");
        }

        $voucherNo = isset($data['voucher_no']) ? trim((string)$data['voucher_no']) : $existing['voucher_no'];
        $voucherDate = isset($data['voucher_date']) ? $data['voucher_date'] : $existing['voucher_date'];
        $partyName = isset($data['party_name']) ? trim((string)$data['party_name']) : $existing['party_name'];
        $particular = isset($data['particular']) ? trim((string)$data['particular']) : $existing['particular'];

        if ($partyName === '') {
            throw new Exception('Party Name is required.');
        }
        if ($particular === '') {
            throw new Exception('Particular is required.');
        }

        $sql = "UPDATE purchase_register SET
                    voucher_no            = :voucher_no,
                    voucher_date          = :voucher_date,
                    voucher_type          = :voucher_type,
                    party_name            = :party_name,
                    account_group         = :account_group,
                    item_group            = :item_group,
                    item_code             = :item_code,
                    stamp                 = :stamp,
                    branch_name           = :branch_name,
                    login_name            = :login_name,
                    register_type         = :register_type,
                    particular            = :particular,
                    item_type             = :item_type,
                    category              = :category,
                    series                = :series,
                    quality               = :quality,
                    weight                = :weight,
                    pieces                = :pieces,
                    purchase_value        = :purchase_value,
                    return_weight         = :return_weight,
                    return_pieces         = :return_pieces,
                    purchase_return_value = :purchase_return_value,
                    gross_weight          = :gross_weight,
                    net_weight            = :net_weight,
                    diamond_weight        = :diamond_weight,
                    stone_weight          = :stone_weight,
                    tags                  = :tags,
                    metal_pieces          = :metal_pieces,
                    gold_weight           = :gold_weight,
                    silver_weight         = :silver_weight,
                    amount                = :amount,
                    is_selected           = :is_selected,
                    is_approved           = :is_approved,
                    is_excluded           = :is_excluded,
                    is_cancelled          = :is_cancelled,
                    include_metal         = :include_metal,
                    in_stock              = :in_stock,
                    net_value             = :net_value,
                    is_active             = :is_active,
                    remarks               = :remarks,
                    updated_at            = NOW()
                WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'id'                    => $id,
            'voucher_no'            => $voucherNo,
            'voucher_date'          => $voucherDate,
            'voucher_type'          => isset($data['voucher_type']) ? trim((string)$data['voucher_type']) : $existing['voucher_type'],
            'party_name'            => $partyName,
            'account_group'         => isset($data['account_group']) ? trim((string)$data['account_group']) : $existing['account_group'],
            'item_group'            => isset($data['item_group']) ? trim((string)$data['item_group']) : $existing['item_group'],
            'item_code'             => isset($data['item_code']) ? trim((string)$data['item_code']) : $existing['item_code'],
            'stamp'                 => isset($data['stamp']) ? trim((string)$data['stamp']) : $existing['stamp'],
            'branch_name'           => isset($data['branch_name']) ? trim((string)$data['branch_name']) : $existing['branch_name'],
            'login_name'            => isset($data['login_name']) ? trim((string)$data['login_name']) : $existing['login_name'],
            'register_type'         => isset($data['register_type']) && in_array($data['register_type'], ['ALL', 'TAGGED', 'LOOSE', 'JOB', 'ORDER', 'W_O_TAG']) ? $data['register_type'] : $existing['register_type'],
            'particular'            => $particular,
            'item_type'             => isset($data['item_type']) ? trim((string)$data['item_type']) : $existing['item_type'],
            'category'              => isset($data['category']) ? trim((string)$data['category']) : $existing['category'],
            'series'                => isset($data['series']) ? trim((string)$data['series']) : $existing['series'],
            'quality'               => isset($data['quality']) ? trim((string)$data['quality']) : $existing['quality'],
            'weight'                => max(0, (float)($data['weight'] ?? $existing['weight'])),
            'pieces'                => max(0, (int)($data['pieces'] ?? $existing['pieces'])),
            'purchase_value'        => max(0, (float)($data['purchase_value'] ?? $existing['purchase_value'])),
            'return_weight'         => max(0, (float)($data['return_weight'] ?? $existing['return_weight'])),
            'return_pieces'         => max(0, (int)($data['return_pieces'] ?? $existing['return_pieces'])),
            'purchase_return_value' => max(0, (float)($data['purchase_return_value'] ?? $existing['purchase_return_value'])),
            'gross_weight'          => max(0, (float)($data['gross_weight'] ?? $existing['gross_weight'])),
            'net_weight'            => max(0, (float)($data['net_weight'] ?? $existing['net_weight'])),
            'diamond_weight'        => max(0, (float)($data['diamond_weight'] ?? $existing['diamond_weight'])),
            'stone_weight'          => max(0, (float)($data['stone_weight'] ?? $existing['stone_weight'])),
            'tags'                  => max(0, (int)($data['tags'] ?? $existing['tags'])),
            'metal_pieces'          => max(0, (int)($data['metal_pieces'] ?? $existing['metal_pieces'])),
            'gold_weight'           => max(0, (float)($data['gold_weight'] ?? $existing['gold_weight'])),
            'silver_weight'         => max(0, (float)($data['silver_weight'] ?? $existing['silver_weight'])),
            'amount'                => max(0, (float)($data['amount'] ?? $existing['amount'])),
            'is_selected'           => isset($data['is_selected']) ? (!empty($data['is_selected']) ? 1 : 0) : $existing['is_selected'],
            'is_approved'           => isset($data['is_approved']) ? (!empty($data['is_approved']) ? 1 : 0) : $existing['is_approved'],
            'is_excluded'           => isset($data['is_excluded']) ? (!empty($data['is_excluded']) ? 1 : 0) : $existing['is_excluded'],
            'is_cancelled'          => isset($data['is_cancelled']) ? (!empty($data['is_cancelled']) ? 1 : 0) : $existing['is_cancelled'],
            'include_metal'         => isset($data['include_metal']) ? (!empty($data['include_metal']) ? 1 : 0) : $existing['include_metal'],
            'in_stock'              => isset($data['in_stock']) ? (!empty($data['in_stock']) ? 1 : 0) : $existing['in_stock'],
            'net_value'             => isset($data['net_value']) ? (!empty($data['net_value']) ? 1 : 0) : $existing['net_value'],
            'is_active'             => isset($data['is_active']) ? (int)$data['is_active'] : $existing['is_active'],
            'remarks'               => isset($data['remarks']) ? trim((string)$data['remarks']) : $existing['remarks'],
        ]);

        $merged = array_merge($existing, $data);
        $newTotal = max(0, (float)($merged['amount'] ?? $merged['purchase_value'] ?? 0));
        $paidAmt = (float)($existing['paid_amount'] ?? 0);
        if ($paidAmt > $newTotal + 0.01) {
            throw new Exception("Cannot update purchase invoice total (₹{$newTotal}) below already paid amount (₹{$paidAmt}).");
        }
        $gstAmt = max(0, (float)($merged['gst_amount'] ?? 0));
        $db->prepare("UPDATE purchase_register SET gst_amount = :gst WHERE id = :id")->execute(['gst' => $gstAmt, 'id' => $id]);
        \Services\VoucherAllocationService::recalculateInvoice('PURCHASE_REGISTER', $id);
        self::postAccounting($id, $merged);
        return self::findById($id);
    }

    public static function softDelete(int $id): bool {
        $db = Database::getConnection();
        if (\Services\VoucherAllocationService::countActiveAllocationsForInvoice('PURCHASE_REGISTER', $id) > 0) {
            throw new Exception('Cannot cancel/delete this Purchase Invoice because payment vouchers are allocated against it. Please cancel or unallocate the payment voucher(s) first.');
        }
        $stmt = $db->prepare("UPDATE purchase_register SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL");
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() > 0) {
            try { \Services\AccountingEngine::reverseReference('PURCHASE_REGISTER', $id); } catch (\Throwable $e) {}
            return true;
        }
        return false;
    }

    private static function postAccounting(int $id, array $data): void {
        try {
            $amt = max(0, (float)($data['amount'] ?? $data['purchase_value'] ?? 0));
            if ($amt <= 0) return;
            $gst = max(0, min($amt, (float)($data['gst_amount'] ?? 0)));
            $taxable = round($amt - $gst, 2);
            $partyName = trim((string)($data['party_name'] ?? 'Cash Supplier'));
            $date = self::normalizeDate($data['voucher_date'] ?? null) ?: date('Y-m-d');
            $partyLedgerId = \Services\PartyLedgerSync::resolveOrCreatePartyLedger($partyName, 'Sundry Creditors (Suppliers)');
            $purchaseLedgerId = \Services\PartyLedgerSync::getSystemLedger('Purchase Account', 'Purchase Accounts', 'EXPENSE');
            $narr = 'Purchase ' . ($data['voucher_no'] ?? "#$id") . ' - ' . ($data['particular'] ?? '');
            $entries = [
                ['ledger_id' => $purchaseLedgerId, 'debit' => $taxable, 'credit' => 0, 'narration' => $narr],
                ['ledger_id' => $partyLedgerId, 'debit' => 0, 'credit' => $amt, 'narration' => $narr],
            ];
            if ($gst > 0) {
                $gstLedgerId = \Services\PartyLedgerSync::getSystemLedger('GST Input', 'Duties & Taxes', 'LIABILITY');
                $entries[] = ['ledger_id' => $gstLedgerId, 'debit' => $gst, 'credit' => 0, 'narration' => "GST Input - $narr"];
            }
            \Services\AccountingEngine::postReference('PURCHASE_REGISTER', $id, $date, $entries, $narr);
        } catch (\Throwable $e) {}
    }

    public static function filterOptions(): array {
        $db = Database::getConnection();

        $parties = $db->query("SELECT DISTINCT party_name FROM purchase_register WHERE party_name IS NOT NULL AND party_name != '' AND deleted_at IS NULL ORDER BY party_name ASC")->fetchAll(PDO::FETCH_COLUMN);
        $groups = $db->query("SELECT DISTINCT account_group FROM purchase_register WHERE account_group IS NOT NULL AND account_group != '' AND deleted_at IS NULL ORDER BY account_group ASC")->fetchAll(PDO::FETCH_COLUMN);
        $itemGroups = $db->query("SELECT DISTINCT item_group FROM purchase_register WHERE item_group IS NOT NULL AND item_group != '' AND deleted_at IS NULL ORDER BY item_group ASC")->fetchAll(PDO::FETCH_COLUMN);
        $itemCodes = $db->query("SELECT DISTINCT item_code FROM purchase_register WHERE item_code IS NOT NULL AND item_code != '' AND deleted_at IS NULL ORDER BY item_code ASC")->fetchAll(PDO::FETCH_COLUMN);
        $stamps = $db->query("SELECT DISTINCT stamp FROM purchase_register WHERE stamp IS NOT NULL AND stamp != '' AND deleted_at IS NULL ORDER BY stamp ASC")->fetchAll(PDO::FETCH_COLUMN);
        $branches = $db->query("SELECT DISTINCT branch_name FROM purchase_register WHERE branch_name IS NOT NULL AND branch_name != '' AND deleted_at IS NULL ORDER BY branch_name ASC")->fetchAll(PDO::FETCH_COLUMN);
        $logins = $db->query("SELECT DISTINCT login_name FROM purchase_register WHERE login_name IS NOT NULL AND login_name != '' AND deleted_at IS NULL ORDER BY login_name ASC")->fetchAll(PDO::FETCH_COLUMN);
        $qualities = $db->query("SELECT DISTINCT quality FROM purchase_register WHERE quality IS NOT NULL AND quality != '' AND deleted_at IS NULL ORDER BY quality ASC")->fetchAll(PDO::FETCH_COLUMN);
        $itemTypes = $db->query("SELECT DISTINCT item_type FROM purchase_register WHERE item_type IS NOT NULL AND item_type != '' AND deleted_at IS NULL ORDER BY item_type ASC")->fetchAll(PDO::FETCH_COLUMN);
        $categories = $db->query("SELECT DISTINCT category FROM purchase_register WHERE category IS NOT NULL AND category != '' AND deleted_at IS NULL ORDER BY category ASC")->fetchAll(PDO::FETCH_COLUMN);
        $seriesList = $db->query("SELECT DISTINCT series FROM purchase_register WHERE series IS NOT NULL AND series != '' AND deleted_at IS NULL ORDER BY series ASC")->fetchAll(PDO::FETCH_COLUMN);
        $voucherTypes = $db->query("SELECT DISTINCT voucher_type FROM purchase_register WHERE voucher_type IS NOT NULL AND voucher_type != '' AND deleted_at IS NULL ORDER BY voucher_type ASC")->fetchAll(PDO::FETCH_COLUMN);

        return [
            'parties'       => $parties,
            'account_groups'=> $groups,
            'item_groups'   => $itemGroups,
            'item_codes'    => $itemCodes,
            'stamps'        => $stamps,
            'branches'      => $branches,
            'logins'        => $logins,
            'qualities'     => $qualities,
            'item_types'    => $itemTypes,
            'categories'    => $categories,
            'series'        => $seriesList,
            'voucher_types' => $voucherTypes,
        ];
    }

    public static function export(array $filters): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhere($filters);

        $sql = "SELECT p.* FROM purchase_register p WHERE {$whereSql} ORDER BY p.voucher_date DESC, p.id DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([self::class, 'formatRow'], $rows);
    }

    private static function formatRow(array $row): array {
        return [
            'id'                    => (int)$row['id'],
            'voucher_no'            => $row['voucher_no'] ?? '',
            'voucher_date'          => $row['voucher_date'] ?? '',
            'voucher_type'          => $row['voucher_type'] ?? 'PURCHASE',
            'party_name'            => $row['party_name'] ?? '',
            'account_group'         => $row['account_group'] ?? '',
            'item_group'            => $row['item_group'] ?? '',
            'item_code'             => $row['item_code'] ?? '',
            'stamp'                 => $row['stamp'] ?? '',
            'branch_name'           => $row['branch_name'] ?? '',
            'login_name'            => $row['login_name'] ?? '',
            'register_type'         => $row['register_type'] ?? 'TAGGED',
            'particular'            => $row['particular'] ?? '',
            'item_type'             => $row['item_type'] ?? '',
            'category'              => $row['category'] ?? '',
            'series'                => $row['series'] ?? '',
            'quality'               => $row['quality'] ?? '',
            'weight'                => (float)($row['weight'] ?? 0),
            'pieces'                => (int)($row['pieces'] ?? 0),
            'purchase_value'        => (float)($row['purchase_value'] ?? 0),
            'return_weight'         => (float)($row['return_weight'] ?? 0),
            'return_pieces'         => (int)($row['return_pieces'] ?? 0),
            'purchase_return_value' => (float)($row['purchase_return_value'] ?? 0),
            'gross_weight'          => (float)($row['gross_weight'] ?? 0),
            'net_weight'            => (float)($row['net_weight'] ?? 0),
            'diamond_weight'        => (float)($row['diamond_weight'] ?? 0),
            'stone_weight'          => (float)($row['stone_weight'] ?? 0),
            'tags'                  => (int)($row['tags'] ?? 0),
            'metal_pieces'          => (int)($row['metal_pieces'] ?? 0),
            'gold_weight'           => (float)($row['gold_weight'] ?? 0),
            'silver_weight'         => (float)($row['silver_weight'] ?? 0),
            'amount'                => (float)($row['amount'] ?? 0),
            'gst_amount'            => (float)($row['gst_amount'] ?? 0),
            'paid_amount'           => (float)($row['paid_amount'] ?? 0),
            'outstanding_amount'    => (float)($row['outstanding_amount'] ?? 0),
            'payment_status'        => $row['payment_status'] ?? 'UNPAID',
            'is_selected'           => (int)($row['is_selected'] ?? 0),
            'is_approved'           => (int)($row['is_approved'] ?? 0),
            'is_excluded'           => (int)($row['is_excluded'] ?? 0),
            'is_cancelled'          => (int)($row['is_cancelled'] ?? 0),
            'include_metal'         => (int)($row['include_metal'] ?? 0),
            'in_stock'              => (int)($row['in_stock'] ?? 0),
            'net_value'             => (int)($row['net_value'] ?? 0),
            'is_active'             => (int)($row['is_active'] ?? 1),
            'remarks'               => $row['remarks'] ?? '',
            'created_at'            => $row['created_at'] ?? '',
            'updated_at'            => $row['updated_at'] ?? '',
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
     * Compute independent Purchase Register bottom summary aggregate values from purchase_register only.
     */
    public static function getSummary(array $filters): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhere($filters);

        $sql = "SELECT 
            COUNT(p.id) AS total_records,
            COALESCE(SUM(p.weight), 0) AS total_weight,
            COALESCE(SUM(p.pieces), 0) AS total_pieces,
            COALESCE(SUM(p.purchase_value), 0) AS total_purchase_value,
            COALESCE(SUM(p.return_weight), 0) AS total_return_weight,
            COALESCE(SUM(p.return_pieces), 0) AS total_return_pieces,
            COALESCE(SUM(p.purchase_return_value), 0) AS total_purchase_return_value,
            COALESCE(SUM(p.gross_weight), 0) AS total_gross_weight,
            COALESCE(SUM(p.net_weight), 0) AS total_net_weight,
            COALESCE(SUM(p.diamond_weight), 0) AS total_diamond_weight,
            COALESCE(SUM(p.stone_weight), 0) AS total_stone_weight,
            COALESCE(SUM(p.tags), 0) AS total_tags,
            COALESCE(SUM(p.metal_pieces), 0) AS total_metal_pieces,
            COALESCE(SUM(p.gold_weight), 0) AS total_gold_weight,
            COALESCE(SUM(p.silver_weight), 0) AS total_silver_weight,
            COALESCE(SUM(p.amount), 0) AS total_amount
        FROM purchase_register p
        WHERE {$whereSql}";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $totalRecords = (int)($row['total_records'] ?? 0);
        $totalWeight = (float)($row['total_weight'] ?? 0);
        $totalPieces = (int)($row['total_pieces'] ?? 0);
        $totalPurchaseVal = (float)($row['total_purchase_value'] ?? 0);
        $totalReturnWeight = (float)($row['total_return_weight'] ?? 0);
        $totalReturnPieces = (int)($row['total_return_pieces'] ?? 0);
        $totalPurchaseReturnVal = (float)($row['total_purchase_return_value'] ?? 0);
        $totalGrossWeight = (float)($row['total_gross_weight'] ?? 0);
        $totalNetWeight = (float)($row['total_net_weight'] ?? 0);
        $totalDiamondWeight = (float)($row['total_diamond_weight'] ?? 0);
        $totalStoneWeight = (float)($row['total_stone_weight'] ?? 0);
        $totalTags = (int)($row['total_tags'] ?? 0);
        $totalMetalPieces = (int)($row['total_metal_pieces'] ?? 0);
        $totalGoldWeight = (float)($row['total_gold_weight'] ?? 0);
        $totalSilverWeight = (float)($row['total_silver_weight'] ?? 0);
        $totalAmount = (float)($row['total_amount'] ?? 0);

        $netPurchaseVal = $totalPurchaseVal - $totalPurchaseReturnVal;
        $netPurchaseWeight = $totalWeight - $totalReturnWeight;
        $netPurchasePieces = $totalPieces - $totalReturnPieces;
        $avgRate = $totalWeight > 0 ? round($totalPurchaseVal / $totalWeight, 2) : 0.0;

        return [
            'total_records'               => $totalRecords,
            'total_weight'                => round($totalWeight, 3),
            'total_pieces'                => $totalPieces,
            'total_purchase_value'        => round($totalPurchaseVal, 2),
            'total_return_weight'         => round($totalReturnWeight, 3),
            'total_return_pieces'         => $totalReturnPieces,
            'total_purchase_return_value' => round($totalPurchaseReturnVal, 2),
            'net_purchase_value'          => round($netPurchaseVal, 2),
            'net_purchase_weight'         => round($netPurchaseWeight, 3),
            'net_purchase_pieces'         => $netPurchasePieces,
            'total_gross_weight'          => round($totalGrossWeight, 3),
            'total_net_weight'            => round($totalNetWeight, 3),
            'total_diamond_weight'        => round($totalDiamondWeight, 3),
            'total_stone_weight'          => round($totalStoneWeight, 3),
            'total_tags'                  => $totalTags,
            'total_metal_pieces'          => $totalMetalPieces,
            'total_gold_weight'           => round($totalGoldWeight, 3),
            'total_silver_weight'         => round($totalSilverWeight, 3),
            'total_amount'                => round($totalAmount, 2),
            'avg_rate'                    => $avgRate,
        ];
    }
}
