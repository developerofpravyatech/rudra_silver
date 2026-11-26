<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class DailyBalance {
    /**
     * Whitelist of sortable columns
     */
    private static array $sortableColumns = [
        'id'                  => 'db.id',
        'account_name'        => 'db.account_name',
        'city'                => 'db.city',
        'mobile'              => 'db.mobile',
        'phone'               => 'db.phone',
        'balance_date'        => 'db.balance_date',
        'payment_date'        => 'db.payment_date',
        'gold_fine'           => 'db.gold_fine',
        'silver_fine'         => 'db.silver_fine',
        'amount'              => 'db.amount',
        'diamond_weight'      => 'db.diamond_weight',
        'stone_weight'        => 'db.stone_weight',
        'gold_gross_weight'   => 'db.gold_gross_weight',
        'silver_gross_weight' => 'db.silver_gross_weight',
        'created_at'          => 'db.created_at',
    ];

    /**
     * Build WHERE conditions and query parameters from filters
     */
    public static function buildWhereClause(array $filters): array {
        $where = ['1=1'];
        $params = [];

        // Search: Account Name, City, Mobile, Phone, Firm, Location
        if (!empty($filters['search'])) {
            $where[] = '(db.account_name LIKE :s_acc OR db.city LIKE :s_city OR db.mobile LIKE :s_mob OR db.phone LIKE :s_ph OR cust.FirmName LIKE :s_firm OR cust.Location LIKE :s_loc)';
            $searchVal = '%' . trim($filters['search']) . '%';
            $params['s_acc'] = $searchVal;
            $params['s_city'] = $searchVal;
            $params['s_mob'] = $searchVal;
            $params['s_ph'] = $searchVal;
            $params['s_firm'] = $searchVal;
            $params['s_loc'] = $searchVal;
        }

        // Account Name filter
        if (!empty($filters['account_name'])) {
            $where[] = 'db.account_name LIKE :f_acc_name';
            $params['f_acc_name'] = '%' . trim($filters['account_name']) . '%';
        }

        // City filter
        if (!empty($filters['city']) && $filters['city'] !== 'all' && $filters['city'] !== 'ALL' && $filters['city'] !== 'ALL CITY') {
            $where[] = '(db.city = :f_city OR acc.city = :f_city OR cust.City = :f_city)';
            $params['f_city'] = trim($filters['city']);
        }

        // State filter (via joined accounts / customer)
        if (!empty($filters['state']) && $filters['state'] !== 'all' && $filters['state'] !== 'ALL' && $filters['state'] !== 'ALL STATE') {
            $where[] = '(acc.state = :f_state OR cust.Country = :f_state)';
            $params['f_state'] = trim($filters['state']);
        }

        // Location filter (via customer)
        if (!empty($filters['location']) && $filters['location'] !== 'all' && $filters['location'] !== 'ALL') {
            $where[] = 'cust.Location = :f_location';
            $params['f_location'] = trim($filters['location']);
        }

        // Ref By filter (via customer)
        if (!empty($filters['ref_by']) && $filters['ref_by'] !== 'all' && $filters['ref_by'] !== 'ALL') {
            $where[] = 'cust.RefBy = :f_ref_by';
            $params['f_ref_by'] = trim($filters['ref_by']);
        }

        // Occupation filter (via customer)
        if (!empty($filters['occupation']) && $filters['occupation'] !== 'all' && $filters['occupation'] !== 'ALL') {
            $where[] = 'cust.Occupation = :f_occupation';
            $params['f_occupation'] = trim($filters['occupation']);
        }

        // Type filter (Normal, Customer, Supplier, etc.)
        if (!empty($filters['type']) && $filters['type'] !== 'all' && $filters['type'] !== 'ALL') {
            if (strcasecmp($filters['type'], 'Normal') === 0) {
                $where[] = "(acc.account_type IS NULL OR acc.account_type IN ('CUSTOMER', 'SUPPLIER'))";
            } else {
                $where[] = 'acc.account_type = :f_acc_type';
                $params['f_acc_type'] = strtoupper(trim($filters['type']));
            }
        }

        // Date From / Single Date
        if (!empty($filters['date'])) {
            $where[] = 'db.balance_date = :f_single_date';
            $params['f_single_date'] = $filters['date'];
        } else {
            if (!empty($filters['from_date'])) {
                $where[] = 'db.balance_date >= :f_from_date';
                $params['f_from_date'] = $filters['from_date'];
            }
            if (!empty($filters['to_date'])) {
                $where[] = 'db.balance_date <= :f_to_date';
                $params['f_to_date'] = $filters['to_date'];
            }
        }

        // Opening Date
        if (!empty($filters['opening_date'])) {
            $where[] = 'db.balance_date <= :f_opening_date';
            $params['f_opening_date'] = $filters['opening_date'];
        }

        // Group filter (via joined account_groups)
        if (!empty($filters['group_id']) && $filters['group_id'] !== 'all' && $filters['group_id'] !== 'ALL') {
            $where[] = 'acc.group_id = :f_group_id';
            $params['f_group_id'] = (int)$filters['group_id'];
        } elseif (!empty($filters['group_name']) && $filters['group_name'] !== 'all' && $filters['group_name'] !== 'ALL') {
            $where[] = 'grp.name = :f_group_name';
            $params['f_group_name'] = trim($filters['group_name']);
        }

        // Amount range filter (Amount Filter modal)
        if (!empty($filters['min_amount'])) {
            $where[] = 'db.amount >= :f_min_amt';
            $params['f_min_amt'] = (float)$filters['min_amount'];
        }
        if (!empty($filters['max_amount'])) {
            $where[] = 'db.amount <= :f_max_amt';
            $params['f_max_amt'] = (float)$filters['max_amount'];
        }

        // Outstanding button filter
        if (!empty($filters['outstanding_only'])) {
            $where[] = '(db.amount > 0 OR db.gold_fine > 0 OR db.silver_fine > 0)';
        }

        // Agent / High Priority button filter
        if (!empty($filters['agent_hp_only'])) {
            $where[] = "((cust.RefBy IS NOT NULL AND cust.RefBy != '') OR cust.Potential >= 25000 OR ABS(db.amount) >= 50000)";
        }

        // Checkbox Flags
        if (!empty($filters['with_balance'])) {
            $where[] = '(db.amount != 0 OR db.gold_fine != 0 OR db.silver_fine != 0)';
        }
        if (!empty($filters['zero_balance'])) {
            $where[] = '(db.amount = 0 AND db.gold_fine = 0 AND db.silver_fine = 0)';
        }
        if (!empty($filters['dia_stn_balance'])) {
            $where[] = '(db.diamond_weight != 0 OR db.stone_weight != 0)';
        }
        if (!empty($filters['hisab_final'])) {
            $where[] = 'db.payment_date IS NOT NULL';
        }
        if (!empty($filters['hisab_pending'])) {
            $where[] = 'db.payment_date IS NULL';
        }
        if (!empty($filters['without_transact'])) {
            $where[] = '(db.payment_date IS NULL)';
        }
        if (!empty($filters['high_priority'])) {
            $where[] = '(cust.Potential >= 50000 OR ABS(db.amount) >= 100000)';
        }
        if (!empty($filters['with_last_sp_date'])) {
            $where[] = 'db.payment_date IS NOT NULL';
        }

        // Fallback for balance_filter param if passed
        $balFilter = $filters['balance_filter'] ?? 'all';
        if ($balFilter === 'with_balance' && empty($filters['with_balance'])) {
            $where[] = '(db.amount != 0 OR db.gold_fine != 0 OR db.silver_fine != 0)';
        } elseif ($balFilter === 'zero_balance' && empty($filters['zero_balance'])) {
            $where[] = '(db.amount = 0 AND db.gold_fine = 0 AND db.silver_fine = 0)';
        } elseif ($balFilter === 'dia_stn_balance' && empty($filters['dia_stn_balance'])) {
            $where[] = '(db.diamond_weight != 0 OR db.stone_weight != 0)';
        }

        return [implode(' AND ', $where), $params];
    }

    /**
     * Server-side paginated list with dynamic grand totals across all matching records
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

        // SQL SUM for Grand Totals across ALL matching filtered records
        $summarySql = "SELECT 
                        COUNT(*) AS total_count,
                        COALESCE(SUM(db.gold_fine), 0) AS total_gold_fine,
                        COALESCE(SUM(db.silver_fine), 0) AS total_silver_fine,
                        COALESCE(SUM(db.amount), 0) AS total_amount,
                        COALESCE(SUM(db.diamond_weight), 0) AS total_diamond_weight,
                        COALESCE(SUM(db.stone_weight), 0) AS total_stone_weight,
                        COALESCE(SUM(db.gold_gross_weight), 0) AS total_gold_gross_weight,
                        COALESCE(SUM(db.silver_gross_weight), 0) AS total_silver_gross_weight
                       FROM daily_balance db
                       LEFT JOIN accounts acc ON db.party_id = acc.id
                       LEFT JOIN account_groups grp ON acc.group_id = grp.id
                       LEFT JOIN customer cust ON (db.party_id = cust.CustomerID OR db.account_name = cust.Name)
                       WHERE {$whereSql}";

        $summaryStmt = $db->prepare($summarySql);
        foreach ($params as $key => $val) {
            $summaryStmt->bindValue($key, $val);
        }
        $summaryStmt->execute();
        $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

        $totalRecords = (int)($summary['total_count'] ?? 0);

        // Secure sorting
        $sortCol = self::$sortableColumns[$sortBy] ?? 'db.id';
        $sortDir = strtolower($sortOrder) === 'desc' ? 'DESC' : 'ASC';

        // Paginated rows
        $offset = max(0, ($page - 1) * $limit);
        $sql = "SELECT db.id, db.party_id, db.account_name, db.city, db.mobile, db.phone,
                       db.balance_date, db.payment_date, db.gold_fine, db.silver_fine,
                       db.amount, db.diamond_weight, db.stone_weight, db.gold_gross_weight,
                       db.silver_gross_weight, db.created_at, db.updated_at,
                       COALESCE(acc.state, cust.Country, '') AS account_state,
                       COALESCE(grp.name, '') AS group_name,
                       COALESCE(cust.Location, '') AS location,
                       COALESCE(cust.RefBy, '') AS ref_by,
                       COALESCE(cust.Occupation, '') AS occupation,
                       COALESCE(acc.account_type, 'Normal') AS account_type,
                       COALESCE(cust.Potential, 0) AS customer_potential
                FROM daily_balance db
                LEFT JOIN accounts acc ON db.party_id = acc.id
                LEFT JOIN account_groups grp ON acc.group_id = grp.id
                LEFT JOIN customer cust ON (db.party_id = cust.CustomerID OR db.account_name = cust.Name)
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
                'total_gold_fine'           => (float)($summary['total_gold_fine'] ?? 0),
                'total_silver_fine'         => (float)($summary['total_silver_fine'] ?? 0),
                'total_amount'              => (float)($summary['total_amount'] ?? 0),
                'total_diamond_weight'      => (float)($summary['total_diamond_weight'] ?? 0),
                'total_stone_weight'        => (float)($summary['total_stone_weight'] ?? 0),
                'total_gold_gross_weight'   => (float)($summary['total_gold_gross_weight'] ?? 0),
                'total_silver_gross_weight' => (float)($summary['total_silver_gross_weight'] ?? 0),
            ],
        ];
    }

    /**
     * Find single record by ID
     */
    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $sql = "SELECT db.id, db.party_id, db.account_name, db.city, db.mobile, db.phone,
                       db.balance_date, db.payment_date, db.gold_fine, db.silver_fine,
                       db.amount, db.diamond_weight, db.stone_weight, db.gold_gross_weight,
                       db.silver_gross_weight, db.created_at, db.updated_at,
                       acc.state AS account_state, grp.name AS group_name
                FROM daily_balance db
                LEFT JOIN accounts acc ON db.party_id = acc.id
                LEFT JOIN account_groups grp ON acc.group_id = grp.id
                WHERE db.id = :id
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? self::formatRow($row) : null;
    }

    /**
     * Create new record in daily_balance
     */
    public static function create(array $data): array {
        $db = Database::getConnection();

        $accountName = trim($data['account_name'] ?? '');
        if ($accountName === '') {
            throw new Exception("Account Name is required.");
        }

        $partyId           = !empty($data['party_id']) ? (int)$data['party_id'] : null;
        $city              = !empty($data['city']) ? trim($data['city']) : null;
        $mobile            = !empty($data['mobile']) ? trim($data['mobile']) : null;
        $phone             = !empty($data['phone']) ? trim($data['phone']) : null;
        $balanceDate       = !empty($data['balance_date']) ? $data['balance_date'] : date('Y-m-d');
        $paymentDate       = !empty($data['payment_date']) ? $data['payment_date'] : null;

        $goldFine          = self::parseNumber($data['gold_fine'] ?? 0);
        $silverFine        = self::parseNumber($data['silver_fine'] ?? 0);
        $amount            = self::parseNumber($data['amount'] ?? 0);
        $diamondWeight     = self::parseNumber($data['diamond_weight'] ?? 0);
        $stoneWeight       = self::parseNumber($data['stone_weight'] ?? 0);
        $goldGrossWeight   = self::parseNumber($data['gold_gross_weight'] ?? 0);
        $silverGrossWeight = self::parseNumber($data['silver_gross_weight'] ?? 0);

        $sql = "INSERT INTO daily_balance (
                    party_id, account_name, city, mobile, phone,
                    balance_date, payment_date, gold_fine, silver_fine, amount,
                    diamond_weight, stone_weight, gold_gross_weight, silver_gross_weight
                ) VALUES (
                    :party_id, :account_name, :city, :mobile, :phone,
                    :balance_date, :payment_date, :gold_fine, :silver_fine, :amount,
                    :diamond_weight, :stone_weight, :gold_gross_weight, :silver_gross_weight
                )";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':party_id', $partyId, $partyId ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':account_name', $accountName);
        $stmt->bindValue(':city', $city);
        $stmt->bindValue(':mobile', $mobile);
        $stmt->bindValue(':phone', $phone);
        $stmt->bindValue(':balance_date', $balanceDate);
        $stmt->bindValue(':payment_date', $paymentDate);
        $stmt->bindValue(':gold_fine', $goldFine);
        $stmt->bindValue(':silver_fine', $silverFine);
        $stmt->bindValue(':amount', $amount);
        $stmt->bindValue(':diamond_weight', $diamondWeight);
        $stmt->bindValue(':stone_weight', $stoneWeight);
        $stmt->bindValue(':gold_gross_weight', $goldGrossWeight);
        $stmt->bindValue(':silver_gross_weight', $silverGrossWeight);

        $stmt->execute();
        $id = (int)$db->lastInsertId();

        return self::findById($id);
    }

    /**
     * Update existing record by ID
     */
    public static function update(int $id, array $data): array {
        $db = Database::getConnection();

        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Daily balance record #{$id} does not exist.");
        }

        $accountName       = !empty($data['account_name']) ? trim($data['account_name']) : $existing['account_name'];
        $partyId           = array_key_exists('party_id', $data) ? (!empty($data['party_id']) ? (int)$data['party_id'] : null) : $existing['party_id'];
        $city              = array_key_exists('city', $data) ? (!empty($data['city']) ? trim($data['city']) : null) : $existing['city'];
        $mobile            = array_key_exists('mobile', $data) ? (!empty($data['mobile']) ? trim($data['mobile']) : null) : $existing['mobile'];
        $phone             = array_key_exists('phone', $data) ? (!empty($data['phone']) ? trim($data['phone']) : null) : $existing['phone'];
        $balanceDate       = !empty($data['balance_date']) ? $data['balance_date'] : $existing['balance_date'];
        $paymentDate       = array_key_exists('payment_date', $data) ? (!empty($data['payment_date']) ? $data['payment_date'] : null) : $existing['payment_date'];

        $goldFine          = array_key_exists('gold_fine', $data) ? self::parseNumber($data['gold_fine']) : $existing['gold_fine'];
        $silverFine        = array_key_exists('silver_fine', $data) ? self::parseNumber($data['silver_fine']) : $existing['silver_fine'];
        $amount            = array_key_exists('amount', $data) ? self::parseNumber($data['amount']) : $existing['amount'];
        $diamondWeight     = array_key_exists('diamond_weight', $data) ? self::parseNumber($data['diamond_weight']) : $existing['diamond_weight'];
        $stoneWeight       = array_key_exists('stone_weight', $data) ? self::parseNumber($data['stone_weight']) : $existing['stone_weight'];
        $goldGrossWeight   = array_key_exists('gold_gross_weight', $data) ? self::parseNumber($data['gold_gross_weight']) : $existing['gold_gross_weight'];
        $silverGrossWeight = array_key_exists('silver_gross_weight', $data) ? self::parseNumber($data['silver_gross_weight']) : $existing['silver_gross_weight'];

        $sql = "UPDATE daily_balance SET
                    party_id = :party_id,
                    account_name = :account_name,
                    city = :city,
                    mobile = :mobile,
                    phone = :phone,
                    balance_date = :balance_date,
                    payment_date = :payment_date,
                    gold_fine = :gold_fine,
                    silver_fine = :silver_fine,
                    amount = :amount,
                    diamond_weight = :diamond_weight,
                    stone_weight = :stone_weight,
                    gold_gross_weight = :gold_gross_weight,
                    silver_gross_weight = :silver_gross_weight
                WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':party_id', $partyId, $partyId ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':account_name', $accountName);
        $stmt->bindValue(':city', $city);
        $stmt->bindValue(':mobile', $mobile);
        $stmt->bindValue(':phone', $phone);
        $stmt->bindValue(':balance_date', $balanceDate);
        $stmt->bindValue(':payment_date', $paymentDate);
        $stmt->bindValue(':gold_fine', $goldFine);
        $stmt->bindValue(':silver_fine', $silverFine);
        $stmt->bindValue(':amount', $amount);
        $stmt->bindValue(':diamond_weight', $diamondWeight);
        $stmt->bindValue(':stone_weight', $stoneWeight);
        $stmt->bindValue(':gold_gross_weight', $goldGrossWeight);
        $stmt->bindValue(':silver_gross_weight', $silverGrossWeight);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        $stmt->execute();

        return self::findById($id);
    }

    /**
     * Delete record by ID
     */
    public static function delete(int $id): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM daily_balance WHERE id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Filter options for dropdowns
     */
    public static function getFilterOptions(?string $state = null): array {
        $db = Database::getConnection();

        // Cities from daily_balance + accounts + customer (optionally filtered by state)
        if ($state && $state !== 'all' && $state !== 'ALL' && $state !== 'ALL STATE') {
            $cityStmt = $db->prepare("
                SELECT DISTINCT city FROM (
                    SELECT city FROM accounts WHERE state = :st1 AND city IS NOT NULL AND TRIM(city) != ''
                    UNION
                    SELECT City AS city FROM customer WHERE (Country = :st2 OR Address1 LIKE :st3) AND City IS NOT NULL AND TRIM(City) != ''
                    UNION
                    SELECT city FROM daily_balance WHERE city IS NOT NULL AND TRIM(city) != ''
                ) t ORDER BY city ASC
            ");
            $cityStmt->execute([
                ':st1' => $state,
                ':st2' => $state,
                ':st3' => '%' . $state . '%'
            ]);
            $cities = $cityStmt->fetchAll(PDO::FETCH_COLUMN);
        } else {
            $cityStmt = $db->query("
                SELECT DISTINCT city FROM (
                    SELECT city FROM daily_balance WHERE city IS NOT NULL AND TRIM(city) != ''
                    UNION
                    SELECT city FROM accounts WHERE city IS NOT NULL AND TRIM(city) != ''
                    UNION
                    SELECT City AS city FROM customer WHERE City IS NOT NULL AND TRIM(City) != ''
                ) t ORDER BY city ASC
            ");
            $cities = $cityStmt->fetchAll(PDO::FETCH_COLUMN);
        }

        // States from accounts + customer
        $stateStmt = $db->query("
            SELECT DISTINCT state FROM (
                SELECT state FROM accounts WHERE state IS NOT NULL AND TRIM(state) != ''
                UNION
                SELECT Country AS state FROM customer WHERE Country IS NOT NULL AND TRIM(Country) != ''
            ) t ORDER BY state ASC
        ");
        $states = $stateStmt->fetchAll(PDO::FETCH_COLUMN);
        if (empty($states)) {
            $states = ['Gujarat', 'Maharashtra', 'Rajasthan', 'Delhi', 'Karnataka'];
        }

        // Locations from customer
        $locStmt = $db->query("SELECT DISTINCT Location FROM customer WHERE Location IS NOT NULL AND TRIM(Location) != '' ORDER BY Location ASC");
        $locations = $locStmt->fetchAll(PDO::FETCH_COLUMN);

        // Groups from account_groups
        $groupStmt = $db->query("SELECT id, name FROM account_groups ORDER BY name ASC");
        $groups = $groupStmt->fetchAll(PDO::FETCH_ASSOC);

        // Ref By from customer
        $refStmt = $db->query("SELECT DISTINCT RefBy FROM customer WHERE RefBy IS NOT NULL AND TRIM(RefBy) != '' ORDER BY RefBy ASC");
        $refBys = $refStmt->fetchAll(PDO::FETCH_COLUMN);

        // Occupations from customer
        $occStmt = $db->query("SELECT DISTINCT Occupation FROM customer WHERE Occupation IS NOT NULL AND TRIM(Occupation) != '' ORDER BY Occupation ASC");
        $occupations = $occStmt->fetchAll(PDO::FETCH_COLUMN);

        // Types
        $types = ['Normal', 'Customer', 'Supplier', 'Karigar', 'Broker', 'Bank', 'Cash', 'Expense'];

        return [
            'cities'      => $cities,
            'states'      => $states,
            'locations'   => $locations,
            'groups'      => $groups,
            'ref_bys'     => $refBys,
            'occupations' => $occupations,
            'types'       => $types,
        ];
    }

    /**
     * Lookup accounts/parties to link to party_id
     */
    public static function getAccountsLookup(): array {
        $db = Database::getConnection();
        $sql = "SELECT id, name, company_name, city, mobile, phone, state
                FROM accounts
                ORDER BY name ASC";
        return $db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Fetch all matching records for exports
     */
    public static function getAllMatching(array $filters = [], string $sortBy = 'id', string $sortOrder = 'asc'): array {
        $db = Database::getConnection();
        [$whereSql, $params] = self::buildWhereClause($filters);

        $sortCol = self::$sortableColumns[$sortBy] ?? 'db.id';
        $sortDir = strtolower($sortOrder) === 'desc' ? 'DESC' : 'ASC';

        $sql = "SELECT db.id, db.party_id, db.account_name, db.city, db.mobile, db.phone,
                       db.balance_date, db.payment_date, db.gold_fine, db.silver_fine,
                       db.amount, db.diamond_weight, db.stone_weight, db.gold_gross_weight,
                       db.silver_gross_weight, db.created_at, db.updated_at,
                       COALESCE(acc.state, cust.Country, '') AS account_state,
                       COALESCE(grp.name, '') AS group_name,
                       COALESCE(cust.Location, '') AS location,
                       COALESCE(cust.RefBy, '') AS ref_by,
                       COALESCE(cust.Occupation, '') AS occupation,
                       COALESCE(acc.account_type, 'Normal') AS account_type,
                       COALESCE(cust.Potential, 0) AS customer_potential
                FROM daily_balance db
                LEFT JOIN accounts acc ON db.party_id = acc.id
                LEFT JOIN account_groups grp ON acc.group_id = grp.id
                LEFT JOIN customer cust ON (db.party_id = cust.CustomerID OR db.account_name = cust.Name)
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
     * Parse float preserving nulls and negative values
     */
    private static function parseNumber($val): ?float {
        if ($val === null || $val === '') {
            return 0.0;
        }
        return (float)$val;
    }

    /**
     * Format row with typed outputs
     */
    private static function formatRow(array $row): array {
        return [
            'id'                  => (int)$row['id'],
            'party_id'            => $row['party_id'] !== null ? (int)$row['party_id'] : null,
            'account_name'        => $row['account_name'],
            'city'                => $row['city'] ?? '',
            'mobile'              => $row['mobile'] ?? '',
            'phone'               => $row['phone'] ?? '',
            'balance_date'        => $row['balance_date'] ?? '',
            'payment_date'        => $row['payment_date'] ?? '',
            'gold_fine'           => (float)($row['gold_fine'] ?? 0),
            'silver_fine'         => (float)($row['silver_fine'] ?? 0),
            'amount'              => (float)($row['amount'] ?? 0),
            'diamond_weight'      => (float)($row['diamond_weight'] ?? 0),
            'stone_weight'        => (float)($row['stone_weight'] ?? 0),
            'gold_gross_weight'   => (float)($row['gold_gross_weight'] ?? 0),
            'silver_gross_weight' => (float)($row['silver_gross_weight'] ?? 0),
            'created_at'          => $row['created_at'] ?? '',
            'updated_at'          => $row['updated_at'] ?? '',
            'account_state'       => $row['account_state'] ?? '',
            'group_name'          => $row['group_name'] ?? '',
            'location'            => $row['location'] ?? '',
            'ref_by'              => $row['ref_by'] ?? '',
            'occupation'          => $row['occupation'] ?? '',
            'account_type'        => $row['account_type'] ?? 'Normal',
            'customer_potential'  => (float)($row['customer_potential'] ?? 0),
        ];
    }
}
