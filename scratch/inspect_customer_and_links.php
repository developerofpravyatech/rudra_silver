<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;

$db = Database::getConnection();

echo "=== CUSTOMERS TABLE COLUMNS ===\n";
$stmt = $db->query("DESCRIBE customers");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "{$r['Field']} ({$r['Type']})\n";
}

echo "\n=== SAMPLE CUSTOMERS ===\n";
$stmt = $db->query("SELECT id, name, company_name, city, group_name, phone FROM customers LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n=== SALE REGISTER PARTIES VS CUSTOMERS ===\n";
$stmt = $db->query("SELECT DISTINCT party_name, account_group, branch_name FROM sale_register");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n=== PURCHASE REGISTER PARTIES ===\n";
$stmt = $db->query("SELECT DISTINCT party_name, account_group, branch_name FROM purchase_register WHERE deleted_at IS NULL");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n=== PURCHASE REGISTER GOLD AND SILVER WEIGHT & VALUE ===\n";
$stmt = $db->query("SELECT 
    COUNT(*) as total_rows,
    SUM(gold_weight) as total_gold_wt,
    SUM(silver_weight) as total_silver_wt,
    SUM(purchase_value) as total_pur_val,
    SUM(weight) as total_wt
FROM purchase_register WHERE deleted_at IS NULL");
print_r($stmt->fetch(PDO::FETCH_ASSOC));

echo "\n=== SALE REGISTER GOLD AND SILVER WEIGHT & VALUE ===\n";
$stmt = $db->query("SELECT 
    COUNT(*) as total_rows,
    SUM(gold_weight) as total_gold_wt,
    SUM(silver_weight) as total_silver_wt,
    SUM(sale_value) as total_sale_val,
    SUM(weight) as total_wt
FROM sale_register WHERE deleted_at IS NULL");
print_r($stmt->fetch(PDO::FETCH_ASSOC));
