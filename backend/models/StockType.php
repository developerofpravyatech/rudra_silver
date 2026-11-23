<?php
namespace Models;

use Config\Database;
use PDO;

class StockType {
    public static function all(): array {
        $db = Database::getConnection();
        try {
            $stmt = $db->query("SELECT id, name, code, is_active FROM stock_types WHERE is_active = 1 ORDER BY sort_order ASC, name ASC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                return $rows;
            }
        } catch (\Exception $e) {
            // fallback
        }

        return [
            ['id' => 1, 'name' => 'Finished', 'code' => 'FINISHED', 'is_active' => 1],
            ['id' => 2, 'name' => 'Raw', 'code' => 'RAW', 'is_active' => 1],
            ['id' => 3, 'name' => 'Unfinish', 'code' => 'UNFINISH', 'is_active' => 1],
            ['id' => 4, 'name' => 'Dust', 'code' => 'DUST', 'is_active' => 1],
            ['id' => 5, 'name' => 'Quality', 'code' => 'QUALITY', 'is_active' => 1],
        ];
    }

    public static function names(): array {
        $all = self::all();
        return array_column($all, 'name');
    }
}
