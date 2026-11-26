<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

/**
 * Karigar Master Model
 * Karigars are stored in `accounts` table with account_type = 'KARIGAR'
 */
class Karigar {

    private static array $sortableColumns = [
        'id'                  => 'a.id',
        'account_code'        => 'a.account_code',
        'karigar_code'        => 'a.account_code',
        'name'                => 'a.name',
        'karigar_name'        => 'a.name',
        'city'                => 'a.city',
        'mobile'              => 'a.mobile',
        'balance_inr'         => 'a.balance_inr',
        'balance_fine_silver' => 'a.balance_fine_silver',
        'balance_fine_gold'   => 'a.balance_fine_gold',
        'is_active'           => 'a.is_active',
        'created_at'          => 'a.created_at',
    ];

    private static function formatRow(array $r): array {
        $isActive = (int)($r['is_active'] ?? 1);
        return array_merge($r, [
            'id'                      => (int)$r['id'],
            'karigar_code'            => $r['account_code'] ?? '',
            'karigar_name'            => $r['name'] ?? '',
            'alternate_mobile'        => $r['phone'] ?? '',
            'narration'               => $r['email'] ?? '',
            'opening_amount'          => (float)($r['balance_inr'] ?? 0),
            'opening_gold_balance'    => (float)($r['balance_fine_gold'] ?? 0),
            'opening_silver_balance'  => (float)($r['balance_fine_silver'] ?? 0),
            'opening_diamond_balance' => (float)($r['default_labour_rate'] ?? 0),
            'opening_stone_balance'   => (float)($r['permissible_loss_percent'] ?? 0),
            'credit_days'             => (int)($r['credit_days'] ?? 0),
            'status'                  => $isActive ? 'Active' : 'Inactive',
            'is_active'               => $isActive,
        ]);
    }

    public static function list(array $filters): array {
        $pdo = Database::getConnection();

        [$where, $params] = self::buildWhere($filters);

        $sort   = self::$sortableColumns[$filters['sort_by'] ?? 'name'] ?? 'a.name';
        $order  = strtoupper($filters['sort_order'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';
        $limit  = max(1, min(500, (int)($filters['limit'] ?? 20)));
        $page   = max(1, (int)($filters['page']  ?? 1));
        $offset = ($page - 1) * $limit;

        $whereStr = implode(' AND ', $where);

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM accounts a WHERE $whereStr");
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();

        $sql = "SELECT a.id, a.account_code, a.name, a.mobile, a.phone,
                       a.email, a.address, a.city, a.state,
                       a.balance_inr, a.balance_fine_gold, a.balance_fine_silver,
                       a.default_labour_rate, a.permissible_loss_percent,
                       a.credit_days, a.credit_limit_inr,
                       a.is_active, a.created_at, a.updated_at,
                       ag.name AS group_name,
                       (SELECT COUNT(*) FROM karigar_issues ki WHERE ki.karigar_id = a.id AND ki.deleted_at IS NULL) AS total_issues,
                       (SELECT COUNT(*) FROM karigar_receives kr WHERE kr.karigar_id = a.id AND kr.deleted_at IS NULL) AS total_receives
                FROM accounts a
                LEFT JOIN account_groups ag ON ag.id = a.group_id
                WHERE $whereStr
                ORDER BY $sort $order
                LIMIT :lim OFFSET :off";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $items = array_map([self::class, 'formatRow'], $rows);

        return [
            'items'       => $items,
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => max(1, (int)ceil($total / $limit)),
        ];
    }

    public static function getById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT a.*, ag.name AS group_name
            FROM accounts a
            LEFT JOIN account_groups ag ON ag.id = a.group_id
            WHERE a.id = :id AND a.account_type = 'KARIGAR'");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? self::formatRow($row) : null;
    }

    public static function create(array $data): array {
        $pdo = Database::getConnection();

        $name = trim((string)($data['karigar_name'] ?? $data['name'] ?? ''));
        $code = trim((string)($data['karigar_code'] ?? $data['account_code'] ?? ''));
        $mobile = trim((string)($data['mobile'] ?? ''));

        if ($name === '') throw new Exception('Karigar Name is required.');
        if ($code === '') throw new Exception('Karigar Code is required.');
        if ($mobile !== '' && !preg_match('/^\d{10}$/', $mobile)) {
            throw new Exception('Mobile number must be 10 digits.');
        }

        $check = $pdo->prepare("SELECT id FROM accounts WHERE account_code = :code");
        $check->execute([':code' => $code]);
        if ($check->fetch()) throw new Exception('Karigar Code already exists. Please use a unique code.');

        $isActive = 1;
        if (isset($data['status'])) {
            $isActive = strcasecmp((string)$data['status'], 'Inactive') === 0 ? 0 : 1;
        } elseif (isset($data['is_active'])) {
            $isActive = (int)(bool)$data['is_active'];
        }

        $stmt = $pdo->prepare("INSERT INTO accounts
            (account_code, group_id, name, account_type, mobile, phone, email, address,
             city, state, balance_inr, balance_fine_gold, balance_fine_silver,
             default_labour_rate, permissible_loss_percent, credit_days, credit_limit_inr, is_active)
            VALUES
            (:account_code, 3, :name, 'KARIGAR', :mobile, :phone, :email, :address,
             :city, :state, :balance_inr, :balance_fine_gold, :balance_fine_silver,
             :default_labour_rate, :permissible_loss_percent, :credit_days, :credit_limit_inr, :is_active)");

        $stmt->execute([
            ':account_code'             => $code,
            ':name'                     => $name,
            ':mobile'                   => $mobile,
            ':phone'                    => trim((string)($data['alternate_mobile'] ?? $data['phone'] ?? '')),
            ':email'                    => trim((string)($data['email'] ?? $data['narration'] ?? '')),
            ':address'                  => trim((string)($data['address'] ?? '')),
            ':city'                     => trim((string)($data['city'] ?? '')),
            ':state'                    => trim((string)($data['state'] ?? 'Gujarat')),
            ':balance_inr'              => (float)($data['opening_amount'] ?? $data['balance_inr'] ?? 0),
            ':balance_fine_gold'        => (float)($data['opening_gold_balance'] ?? $data['balance_fine_gold'] ?? 0),
            ':balance_fine_silver'      => (float)($data['opening_silver_balance'] ?? $data['balance_fine_silver'] ?? 0),
            ':default_labour_rate'      => (float)($data['opening_diamond_balance'] ?? $data['default_labour_rate'] ?? 0),
            ':permissible_loss_percent' => (float)($data['opening_stone_balance'] ?? $data['permissible_loss_percent'] ?? 0),
            ':credit_days'              => (int)($data['credit_days'] ?? 0),
            ':credit_limit_inr'         => (float)($data['credit_limit_inr'] ?? 0),
            ':is_active'                => $isActive,
        ]);

        $newId = (int)$pdo->lastInsertId();
        try { \Services\PartyLedgerSync::syncAccount($newId); } catch (\Throwable $e) {}
        return self::getById($newId);
    }

    public static function update(int $id, array $data): array {
        $pdo = Database::getConnection();
        $existing = self::getById($id);
        if (!$existing) throw new Exception('Karigar not found.');

        // Validate name/code if provided in payload
        if (array_key_exists('karigar_name', $data) || array_key_exists('name', $data)) {
            $name = trim((string)($data['karigar_name'] ?? $data['name'] ?? ''));
            if ($name === '') throw new Exception('Karigar Name is required.');
        }
        $codeVal = null;
        if (array_key_exists('karigar_code', $data) || array_key_exists('account_code', $data)) {
            $codeVal = trim((string)($data['karigar_code'] ?? $data['account_code'] ?? ''));
            if ($codeVal === '') throw new Exception('Karigar Code is required.');
            $check = $pdo->prepare("SELECT id FROM accounts WHERE account_code = :code AND id != :id");
            $check->execute([':code' => $codeVal, ':id' => $id]);
            if ($check->fetch()) throw new Exception('Karigar Code already exists.');
        }
        if (isset($data['mobile']) && trim((string)$data['mobile']) !== '' && !preg_match('/^\d{10}$/', trim((string)$data['mobile']))) {
            throw new Exception('Mobile number must be 10 digits.');
        }

        // Normalize frontend aliases into canonical DB columns
        $normalized = [];
        if (array_key_exists('karigar_code', $data) || array_key_exists('account_code', $data)) {
            $normalized['account_code'] = $codeVal;
        }
        if (array_key_exists('karigar_name', $data) || array_key_exists('name', $data)) {
            $normalized['name'] = trim((string)($data['karigar_name'] ?? $data['name'] ?? ''));
        }
        if (array_key_exists('mobile', $data)) {
            $normalized['mobile'] = trim((string)$data['mobile']);
        }
        if (array_key_exists('alternate_mobile', $data) || array_key_exists('phone', $data)) {
            $normalized['phone'] = trim((string)($data['alternate_mobile'] ?? $data['phone'] ?? ''));
        }
        if (array_key_exists('email', $data) || array_key_exists('narration', $data)) {
            $normalized['email'] = trim((string)($data['email'] ?? $data['narration'] ?? ''));
        }
        if (array_key_exists('address', $data)) $normalized['address'] = trim((string)$data['address']);
        if (array_key_exists('city', $data))    $normalized['city'] = trim((string)$data['city']);
        if (array_key_exists('state', $data))   $normalized['state'] = trim((string)$data['state']);
        if (array_key_exists('opening_amount', $data) || array_key_exists('balance_inr', $data)) {
            $normalized['balance_inr'] = (float)($data['opening_amount'] ?? $data['balance_inr'] ?? 0);
        }
        if (array_key_exists('opening_gold_balance', $data) || array_key_exists('balance_fine_gold', $data)) {
            $normalized['balance_fine_gold'] = (float)($data['opening_gold_balance'] ?? $data['balance_fine_gold'] ?? 0);
        }
        if (array_key_exists('opening_silver_balance', $data) || array_key_exists('balance_fine_silver', $data)) {
            $normalized['balance_fine_silver'] = (float)($data['opening_silver_balance'] ?? $data['balance_fine_silver'] ?? 0);
        }
        if (array_key_exists('opening_diamond_balance', $data) || array_key_exists('default_labour_rate', $data)) {
            $normalized['default_labour_rate'] = (float)($data['opening_diamond_balance'] ?? $data['default_labour_rate'] ?? 0);
        }
        if (array_key_exists('opening_stone_balance', $data) || array_key_exists('permissible_loss_percent', $data)) {
            $normalized['permissible_loss_percent'] = (float)($data['opening_stone_balance'] ?? $data['permissible_loss_percent'] ?? 0);
        }
        if (array_key_exists('credit_days', $data)) $normalized['credit_days'] = (int)$data['credit_days'];
        if (array_key_exists('credit_limit_inr', $data)) $normalized['credit_limit_inr'] = (float)$data['credit_limit_inr'];
        if (array_key_exists('status', $data)) {
            $normalized['is_active'] = strcasecmp((string)$data['status'], 'Inactive') === 0 ? 0 : 1;
        } elseif (array_key_exists('is_active', $data)) {
            $normalized['is_active'] = (int)(bool)$data['is_active'];
        }

        if (empty($normalized)) throw new Exception('No fields to update.');

        $fields = [];
        $params = [':id' => $id];
        foreach ($normalized as $col => $val) {
            $fields[] = "$col = :$col";
            $params[":$col"] = $val;
        }

        $pdo->prepare("UPDATE accounts SET " . implode(', ', $fields) . " WHERE id = :id AND account_type = 'KARIGAR'")->execute($params);
        try { \Services\PartyLedgerSync::syncAccount($id); } catch (\Throwable $e) {}
        return self::getById($id);
    }

    public static function toggleStatus(int $id): array {
        $pdo = Database::getConnection();
        $existing = self::getById($id);
        if (!$existing) throw new Exception('Karigar not found.');
        $newStatus = $existing['is_active'] ? 0 : 1;
        $pdo->prepare("UPDATE accounts SET is_active = :s WHERE id = :id AND account_type = 'KARIGAR'")->execute([':s' => $newStatus, ':id' => $id]);
        return self::getById($id);
    }

    public static function delete(int $id): bool {
        $pdo = Database::getConnection();
        $existing = self::getById($id);
        if (!$existing) throw new Exception('Karigar not found.');

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM karigar_issues WHERE karigar_id = :id AND deleted_at IS NULL");
        $stmt->execute([':id' => $id]);
        $issues = (int)$stmt->fetchColumn();
        if ($issues > 0) throw new Exception("Cannot delete: $issues issue(s) exist for this Karigar. Deactivate instead.");

        $pdo->prepare("DELETE FROM accounts WHERE id = :id AND account_type = 'KARIGAR'")->execute([':id' => $id]);
        return true;
    }

    public static function filterOptions(): array {
        $pdo = Database::getConnection();
        $cities = $pdo->query("SELECT DISTINCT city FROM accounts WHERE account_type = 'KARIGAR' AND city != '' AND city IS NOT NULL ORDER BY city")->fetchAll(PDO::FETCH_COLUMN);
        $states = $pdo->query("SELECT DISTINCT state FROM accounts WHERE account_type = 'KARIGAR' AND state != '' AND state IS NOT NULL ORDER BY state")->fetchAll(PDO::FETCH_COLUMN);
        return ['cities' => $cities, 'states' => $states];
    }

    public static function export(array $filters): array {
        $pdo = Database::getConnection();
        [$where, $params] = self::buildWhere($filters);
        $whereStr = implode(' AND ', $where);

        $stmt = $pdo->prepare("SELECT a.id, a.account_code, a.name, a.mobile, a.phone, a.email,
                       a.address, a.city, a.state,
                       a.balance_inr, a.balance_fine_gold, a.balance_fine_silver,
                       a.default_labour_rate, a.permissible_loss_percent,
                       a.is_active, a.created_at
                FROM accounts a WHERE $whereStr ORDER BY a.name ASC");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function nextCode(): string {
        $pdo = Database::getConnection();
        $max = $pdo->query("SELECT MAX(CAST(SUBSTRING(account_code, 6) AS UNSIGNED)) FROM accounts WHERE account_type = 'KARIGAR' AND account_code LIKE 'KARI-%'")->fetchColumn();
        $next = ($max ? (int)$max : 0) + 1;
        return 'KARI-' . str_pad((string)$next, 3, '0', STR_PAD_LEFT);
    }

    private static function buildWhere(array $filters): array {
        $where  = ["a.account_type = 'KARIGAR'"];
        $params = [];

        if (!empty($filters['search'])) {
            $s = '%' . trim((string)$filters['search']) . '%';
            $where[] = "(a.name LIKE :s1 OR a.account_code LIKE :s2 OR a.mobile LIKE :s3 OR a.city LIKE :s4)";
            $params[':s1'] = $s;
            $params[':s2'] = $s;
            $params[':s3'] = $s;
            $params[':s4'] = $s;
        }
        if (!empty($filters['city'])) {
            $where[] = 'a.city = :city';
            $params[':city'] = $filters['city'];
        }
        if (!empty($filters['state'])) {
            $where[] = 'a.state = :state';
            $params[':state'] = $filters['state'];
        }
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $where[] = 'a.is_active = :is_active';
            $params[':is_active'] = (int)$filters['is_active'];
        }

        return [$where, $params];
    }
}
