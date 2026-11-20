<?php
namespace Models;

use Config\Database;
use PDO;

class Account {
    public static function search(?string $query = null, ?string $accountType = null, int $limit = 100): array {
        $db = Database::getConnection();
        $where = ['is_active = 1'];
        $params = [];

        if ($query !== null && trim($query) !== '') {
            $where[] = '(name LIKE :q1 OR mobile LIKE :q2 OR account_code LIKE :q3)';
            $params['q1'] = '%' . trim($query) . '%';
            $params['q2'] = '%' . trim($query) . '%';
            $params['q3'] = '%' . trim($query) . '%';
        }

        if ($accountType !== null && trim($accountType) !== '') {
            $where[] = 'account_type = :account_type';
            $params['account_type'] = $accountType;
        }

        $sql = 'SELECT * FROM accounts WHERE ' . implode(' AND ', $where) . ' ORDER BY name ASC LIMIT :limit';
        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['id'] = (int)$r['id'];
            $r['group_id'] = (int)$r['group_id'];
            $r['is_active'] = (bool)$r['is_active'];
            $r['balance_inr'] = (float)$r['balance_inr'];
            $r['balance_fine_gold'] = (float)$r['balance_fine_gold'];
            $r['balance_fine_silver'] = (float)$r['balance_fine_silver'];
        }

        return $rows;
    }
}
