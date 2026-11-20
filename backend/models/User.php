<?php
namespace Models;

use Config\Database;
use PDO;

class User {
    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, mobile, email, role, is_active, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['id'] = (int)$row['id'];
            $row['is_active'] = (bool)$row['is_active'];
        }
        return $row ?: null;
    }

    public static function findByEmail(string $email): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['id'] = (int)$row['id'];
            $row['is_active'] = (bool)$row['is_active'];
        }
        return $row ?: null;
    }
    public static function findByMobile(string $mobile): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM users WHERE mobile = :mobile LIMIT 1');
        $stmt->execute(['mobile' => $mobile]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['id'] = (int)$row['id'];
            $row['is_active'] = (bool)$row['is_active'];
        }
        return $row ?: null;
    }

    public static function countAll(): int {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT COUNT(*) FROM users');
        return (int)$stmt->fetchColumn();
    }

    public static function create(string $name, string $mobile, string $hashedPassword, string $role = 'STAFF', ?string $email = null): array {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO users (name, mobile, email, hashed_password, role, is_active, created_at)
            VALUES (:name, :mobile, :email, :hashed_password, :role, 1, NOW())
        ');
        $stmt->execute([
            'name'            => $name,
            'mobile'          => $mobile,
            'email'           => $email,
            'hashed_password' => $hashedPassword,
            'role'            => $role,
        ]);
        $id = (int)$db->lastInsertId();
        return self::findById($id);
    }

    public static function update(int $id, array $data): ?array {
        $db = Database::getConnection();
        $fields = [];
        $params = ['id' => $id];

        if (isset($data['name'])) {
            $fields[] = 'name = :name';
            $params['name'] = $data['name'];
        }
        if (isset($data['mobile'])) {
            $fields[] = 'mobile = :mobile';
            $params['mobile'] = $data['mobile'];
        }
        if (isset($data['role'])) {
            $fields[] = 'role = :role';
            $params['role'] = $data['role'];
        }
        if (isset($data['is_active'])) {
            $fields[] = 'is_active = :is_active';
            $params['is_active'] = $data['is_active'] ? 1 : 0;
        }
        if (isset($data['hashed_password'])) {
            $fields[] = 'hashed_password = :hashed_password';
            $params['hashed_password'] = $data['hashed_password'];
        }

        if (empty($fields)) {
            return self::findById($id);
        }

        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return self::findById($id);
    }

    public static function delete(int $id): bool {
        $db = Database::getConnection();
        try {
            $stmt = $db->prepare('DELETE FROM users WHERE id = :id');
            $stmt->execute(['id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
    public static function paginate(
        ?string $search = null,
        ?string $role = null,
        ?bool $isActive = null,
        int $page = 1,
        int $perPage = 10
    ): array {
        $db = Database::getConnection();
        $where = [];
        $params = [];

        if ($search !== null && trim($search) !== '') {
            $where[] = '(name LIKE :search1 OR mobile LIKE :search2)';
            $params['search1'] = '%' . trim($search) . '%';
            $params['search2'] = '%' . trim($search) . '%';
        }
        if ($role !== null && $role !== '' && $role !== 'ALL') {
            $where[] = 'role = :role';
            $params['role'] = $role;
        }
        if ($isActive !== null) {
            $where[] = 'is_active = :is_active';
            $params['is_active'] = $isActive ? 1 : 0;
        }

        $whereSql = !empty($where) ? ' WHERE ' . implode(' AND ', $where) : '';

        // Total count
        $countSql = "SELECT COUNT(*) FROM users {$whereSql}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Data
        $offset = ($page - 1) * $perPage;
        $dataSql = "SELECT id, name, mobile, role, is_active, created_at FROM users {$whereSql} ORDER BY id DESC LIMIT :limit OFFSET :offset";
        $dataStmt = $db->prepare($dataSql);
        foreach ($params as $k => $v) {
            $dataStmt->bindValue($k, $v);
        }
        $dataStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $dataStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $dataStmt->execute();

        $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['id'] = (int)$r['id'];
            $r['is_active'] = (bool)$r['is_active'];
        }

        return [
            'items'    => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $perPage,
        ];
    }
}
