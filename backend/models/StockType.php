<?php
namespace Models;

use Config\Database;
use PDO;

class StockType {
    public static function all(bool $includeInactive = true): array {
        $db = Database::getConnection();
        try {
            $sql = "SELECT id, name, is_active, created_at FROM stock_types";
            if (!$includeInactive) {
                $sql .= " WHERE is_active = 1";
            }
            $sql .= " ORDER BY id ASC";
            $stmt = $db->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                foreach ($rows as &$r) {
                    $r['id'] = (int)$r['id'];
                    $r['is_active'] = (int)$r['is_active'];
                }
                return $rows;
            }
        } catch (\Exception $e) {
            // fallback
        }

        return [
            ['id' => 1, 'name' => 'Finished', 'is_active' => 1],
            ['id' => 2, 'name' => 'Raw', 'is_active' => 1],
            ['id' => 3, 'name' => 'Unfinish', 'is_active' => 1],
            ['id' => 4, 'name' => 'Dust', 'is_active' => 1],
            ['id' => 5, 'name' => 'Quality', 'is_active' => 1],
        ];
    }

    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, name, is_active, created_at FROM stock_types WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['id'] = (int)$row['id'];
            $row['is_active'] = (int)$row['is_active'];
            return $row;
        }
        return null;
    }

    public static function findByName(string $name, ?int $excludeId = null): ?array {
        $db = Database::getConnection();
        $sql = "SELECT id, name, is_active FROM stock_types WHERE LOWER(name) = LOWER(:name)";
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

    public static function create(string $name, int $isActive = 1): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO stock_types (name, is_active, created_at) VALUES (:name, :is_active, NOW())");
        $stmt->execute([
            ':name'      => trim($name),
            ':is_active' => $isActive ? 1 : 0
        ]);
        $id = (int)$db->lastInsertId();
        return self::findById($id);
    }

    public static function update(int $id, string $name, int $isActive): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE stock_types SET name = :name, is_active = :is_active WHERE id = :id");
        $stmt->execute([
            ':name'      => trim($name),
            ':is_active' => $isActive ? 1 : 0,
            ':id'        => $id
        ]);
        return self::findById($id);
    }

    public static function isUsedInMetalStock(string $name): bool {
        $db = Database::getConnection();
        try {
            $stmt = $db->prepare("SELECT COUNT(*) FROM metal_stock WHERE LOWER(stock_type) = LOWER(:name)");
            $stmt->execute([':name' => trim($name)]);
            return ((int)$stmt->fetchColumn()) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function delete(int $id): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM stock_types WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    public static function names(): array {
        $all = self::all(false);
        return array_column($all, 'name');
    }
}
