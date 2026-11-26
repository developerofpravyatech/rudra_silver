<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

echo "=== ACCOUNTS ROWS ===\n";
$stmt = $db->query("SELECT id, name, company_name, account_type, city FROM accounts LIMIT 20");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== CUSTOMER ROWS ===\n";
$stmt = $db->query("SELECT CustomerID, Name, FirmName, City FROM customer LIMIT 20");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== ACCOUNT GROUPS ===\n";
$stmt = $db->query("SELECT * FROM account_groups");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
