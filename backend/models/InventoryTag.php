<?php
namespace Models;

use Config\Database;
use PDO;

class InventoryTag {
    public static function lookup(string $identifier): ?array {
        $db = Database::getConnection();
        $sql = '
            SELECT 
                t.*,
                i.name AS item_name,
                ps.name AS purity_stamp_name
            FROM inventory_tags t
            LEFT JOIN items i ON t.item_id = i.id
            LEFT JOIN purity_stamps ps ON t.purity_stamp_id = ps.id
            WHERE t.tag_number = :id1 OR t.rfid_epc = :id2
            LIMIT 1
        ';
        $stmt = $db->prepare($sql);
        $stmt->execute(['id1' => $identifier, 'id2' => $identifier]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return null;

        // Cast numeric types
        $row['id'] = (int)$row['id'];
        $row['item_id'] = (int)$row['item_id'];
        $row['purity_stamp_id'] = (int)$row['purity_stamp_id'];
        $row['gross_weight'] = (float)$row['gross_weight'];
        $row['less_weight'] = (float)$row['less_weight'];
        $row['net_weight'] = (float)$row['net_weight'];
        $row['purity_touch'] = (float)$row['purity_touch'];
        $row['wastage_percent'] = (float)$row['wastage_percent'];
        $row['fine_weight'] = (float)$row['fine_weight'];
        $row['labour_rate'] = (float)$row['labour_rate'];

        return $row;
    }
}
