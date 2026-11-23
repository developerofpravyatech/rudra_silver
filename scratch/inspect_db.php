<?php
require_once __DIR__ . '/../backend/config/config.php';
require_once __DIR__ . '/../backend/config/database.php';
$db = \Config\Database::getConnection();
$tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo "=== TABLES ===\n";
print_r($tables);

foreach (['metal_stock', 'stock_status', 'categories', 'customers', 'items', 'daily_balance', 'units', 'purity_stamps'] as $t) {
    if (in_array($t, $tables)) {
        echo "\n=== SCHEMA FOR $t ===\n";
        $cols = $db->query("DESCRIBE `$t`")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $col) {
            echo "{$col['Field']} - {$col['Type']} - Null:{$col['Null']} - Key:{$col['Key']} - Def:{$col['Default']}\n";
        }
    }
}
