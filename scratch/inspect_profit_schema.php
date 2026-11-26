<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;

$db = Database::getConnection();

function showColumns($db, $table) {
    echo "=== COLUMNS FOR {$table} ===\n";
    try {
        $stmt = $db->query("DESCRIBE {$table}");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo sprintf("%-25s %-20s %-10s %-10s\n", $row['Field'], $row['Type'], $row['Null'], $row['Default'] ?? 'NULL');
        }
    } catch (Exception $e) {
        echo "Error describing {$table}: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

$tables = ['sale_register', 'purchase_register', 'customers', 'items', 'daily_transactions', 'metal_stock'];
foreach ($tables as $t) {
    showColumns($db, $t);
}

// Check sample data from sale_register and purchase_register
echo "=== SAMPLE SALE REGISTER (1 row) ===\n";
$stmt = $db->query("SELECT * FROM sale_register LIMIT 1");
print_r($stmt->fetch(PDO::FETCH_ASSOC));

echo "=== SAMPLE PURCHASE REGISTER (1 row) ===\n";
$stmt = $db->query("SELECT * FROM purchase_register LIMIT 1");
print_r($stmt->fetch(PDO::FETCH_ASSOC));
