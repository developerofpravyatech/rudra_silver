<?php
namespace Models;

use Config\Database;
use PDO;

class Unit {
    public static function all(?string $search = null): array {
        $db = Database::getConnection();
        $sql = "SELECT id, code, name, is_active, created_at FROM units";
        $params = [];
        if ($search !== null && $search !== '') {
            $sql .= " WHERE (name LIKE :search OR code LIKE :search2)";
            $params[':search']  = '%' . trim($search) . '%';
            $params[':search2'] = '%' . trim($search) . '%';
        }
        $sql .= " ORDER BY id ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['id']        = (int)$r['id'];
            $r['is_active'] = (int)$r['is_active'];
        }
        return $rows;
    }

    public static function getActive(): array {
        $db   = Database::getConnection();
        $stmt = $db->query("SELECT id, code, name, is_active, created_at FROM units WHERE is_active = 1 ORDER BY id ASC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['id']        = (int)$r['id'];
            $r['is_active'] = (int)$r['is_active'];
        }
        return $rows;
    }

    public static function findById(int $id): ?array {
        $db   = Database::getConnection();
        $stmt = $db->prepare("SELECT id, code, name, is_active, created_at FROM units WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['id']        = (int)$row['id'];
            $row['is_active'] = (int)$row['is_active'];
            return $row;
        }
        return null;
    }

    public static function findByName(string $name, ?int $excludeId = null): ?array {
        $db  = Database::getConnection();
        $sql = "SELECT id, code, name, is_active FROM units WHERE LOWER(name) = LOWER(:name)";
        $params = [':name' => trim($name)];
        if ($excludeId !== null) {
            $sql .= " AND id != :exclude_id";
            $params[':exclude_id'] = $excludeId;
        }
        $sql .= " LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public static function findByCode(string $code, ?int $excludeId = null): ?array {
        $db  = Database::getConnection();
        $sql = "SELECT id, code, name, is_active FROM units WHERE LOWER(code) = LOWER(:code)";
        $params = [':code' => trim($code)];
        if ($excludeId !== null) {
            $sql .= " AND id != :exclude_id";
            $params[':exclude_id'] = $excludeId;
        }
        $sql .= " LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public static function create(string $name, string $code, int $isActive = 1): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO units (code, name, is_active, created_at) VALUES (:code, :name, :is_active, NOW())");
        $stmt->execute([
            ':code'      => strtoupper(trim($code)),
            ':name'      => trim($name),
            ':is_active' => $isActive ? 1 : 0,
        ]);
        $id = (int)$db->lastInsertId();
        return self::findById($id);
    }

    public static function update(int $id, string $name, string $code, int $isActive): ?array {
        $db   = Database::getConnection();
        $stmt = $db->prepare("UPDATE units SET code = :code, name = :name, is_active = :is_active WHERE id = :id");
        $stmt->execute([
            ':code'      => strtoupper(trim($code)),
            ':name'      => trim($name),
            ':is_active' => $isActive ? 1 : 0,
            ':id'        => $id,
        ]);
        return self::findById($id);
    }

    public static function toggleStatus(int $id): ?array {
        $db   = Database::getConnection();
        $stmt = $db->prepare("UPDATE units SET is_active = IF(is_active = 1, 0, 1) WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return self::findById($id);
    }

    public static function isUsedInMetalStock(string $name): bool {
        $db = Database::getConnection();
        try {
            $stmt = $db->prepare("SELECT COUNT(*) FROM metal_stock WHERE LOWER(unit) = LOWER(:name)");
            $stmt->execute([':name' => trim($name)]);
            return ((int)$stmt->fetchColumn()) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function isUsedInStock(int $id): bool {
        $db = Database::getConnection();
        try {
            $stmt = $db->prepare("SELECT COUNT(*) FROM stock WHERE unit_id = :id");
            $stmt->execute([':id' => $id]);
            return ((int)$stmt->fetchColumn()) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function delete(int $id): bool {
        $db   = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM units WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    public static function count(): array {
        $db   = Database::getConnection();
        $stmt = $db->query("SELECT COUNT(*) AS total, SUM(is_active) AS active_count FROM units");
        $row  = $stmt->fetch(PDO::FETCH_ASSOC);
        return [
            'total'    => (int)($row['total'] ?? 0),
            'active'   => (int)($row['active_count'] ?? 0),
            'inactive' => (int)($row['total'] ?? 0) - (int)($row['active_count'] ?? 0),
        ];
    }
}
