<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

echo "=== METAL STOCK ROWS ===\n";
$stmt = $db->query("SELECT * FROM metal_stock LIMIT 10");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== DAILY BALANCE ROWS ===\n";
$stmt = $db->query("SELECT * FROM daily_balance LIMIT 10");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
