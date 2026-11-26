<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class AccountGroup {
    public static function getAll(array $filters = []): array {
        $db = Database::getConnection();
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['search'])) {
            $where[] = '(ag.name LIKE :search OR ag.code LIKE :search)';
            $params['search'] = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['nature'])) {
            $where[] = 'ag.nature = :nature';
            $params['nature'] = $filters['nature'];
        }
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $where[] = 'ag.is_active = :is_active';
            $params['is_active'] = (int)$filters['is_active'];
        }
        if (!empty($filters['parent_id'])) {
            $where[] = 'ag.parent_id = :parent_id';
            $params['parent_id'] = (int)$filters['parent_id'];
        }

        $page = max(1, (int)($filters['page'] ?? 1));
        $limit = max(1, min(200, (int)($filters['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $sort = in_array($filters['sort'] ?? '', ['name','code','nature','created_at']) ? $filters['sort'] : 'name';
        $order = strtoupper($filters['order'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

        $whereStr = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM account_groups ag WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $db->prepare("
            SELECT ag.*, p.name AS parent_name,
                   (SELECT COUNT(*) FROM account_groups c WHERE c.parent_id = ag.id) AS child_count,
                   (SELECT COUNT(*) FROM accounts a WHERE a.group_id = ag.id) AS account_count
            FROM account_groups ag
            LEFT JOIN account_groups p ON p.id = ag.parent_id
            WHERE $whereStr
            ORDER BY ag.$sort $order
            LIMIT :limit OFFSET :offset
        ");
        foreach ($params as $k => $v) $stmt->bindValue(':' . $k, $v);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ['data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public static function getById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT ag.*, p.name AS parent_name
            FROM account_groups ag
            LEFT JOIN account_groups p ON p.id = ag.parent_id
            WHERE ag.id = :id
        ");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public static function create(array $data): array {
        $db = Database::getConnection();
        // Check unique name
        $check = $db->prepare("SELECT id FROM account_groups WHERE name = :name");
        $check->execute(['name' => $data['name']]);
        if ($check->fetch()) throw new Exception('Account group name already exists');

        $stmt = $db->prepare("
            INSERT INTO account_groups (parent_id, name, code, nature, description, is_active, created_at, updated_at)
            VALUES (:parent_id, :name, :code, :nature, :description, :is_active, NOW(), NOW())
        ");
        $stmt->execute([
            'parent_id'   => $data['parent_id'] ?? null,
            'name'        => $data['name'],
            'code'        => $data['code'] ?? null,
            'nature'      => $data['nature'],
            'description' => $data['description'] ?? null,
            'is_active'   => isset($data['is_active']) ? (int)$data['is_active'] : 1,
        ]);
        return self::getById((int)$db->lastInsertId());
    }

    public static function update(int $id, array $data): array {
        $db = Database::getConnection();
        // Check unique name (exclude self)
        $check = $db->prepare("SELECT id FROM account_groups WHERE name = :name AND id != :id");
        $check->execute(['name' => $data['name'], 'id' => $id]);
        if ($check->fetch()) throw new Exception('Account group name already exists');

        $stmt = $db->prepare("
            UPDATE account_groups 
            SET parent_id=:parent_id, name=:name, code=:code, nature=:nature,
                description=:description, is_active=:is_active, updated_at=NOW()
            WHERE id=:id
        ");
        $stmt->execute([
            'parent_id'   => $data['parent_id'] ?? null,
            'name'        => $data['name'],
            'code'        => $data['code'] ?? null,
            'nature'      => $data['nature'],
            'description' => $data['description'] ?? null,
            'is_active'   => isset($data['is_active']) ? (int)$data['is_active'] : 1,
            'id'          => $id,
        ]);
        return self::getById($id);
    }

    public static function delete(int $id): bool {
        $db = Database::getConnection();
        // Check if used
        $check = $db->prepare("SELECT COUNT(*) FROM accounts WHERE group_id = :id");
        $check->execute(['id' => $id]);
        if ((int)$check->fetchColumn() > 0) throw new Exception('Cannot delete: accounts exist in this group');

        $check2 = $db->prepare("SELECT COUNT(*) FROM account_groups WHERE parent_id = :id");
        $check2->execute(['id' => $id]);
        if ((int)$check2->fetchColumn() > 0) throw new Exception('Cannot delete: sub-groups exist');

        $check3 = $db->prepare("SELECT COUNT(*) FROM ledgers WHERE group_id = :id");
        $check3->execute(['id' => $id]);
        if ((int)$check3->fetchColumn() > 0) throw new Exception('Cannot delete: ledgers exist in this group');

        $stmt = $db->prepare("DELETE FROM account_groups WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public static function toggleStatus(int $id): array {
        $db = Database::getConnection();
        $db->prepare("UPDATE account_groups SET is_active = 1 - is_active, updated_at = NOW() WHERE id = :id")
           ->execute(['id' => $id]);
        return self::getById($id);
    }

    public static function getAllForDropdown(): array {
        $db = Database::getConnection();
        return $db->query("SELECT id, name, code, nature, parent_id FROM account_groups WHERE is_active = 1 ORDER BY nature, name")
                  ->fetchAll(PDO::FETCH_ASSOC);
    }
}
