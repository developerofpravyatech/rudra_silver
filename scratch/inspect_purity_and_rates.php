<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

echo "=== SALE REGISTER ITEMS & PURITIES ===\n";
$stmt = $db->query("SELECT id, voucher_no, voucher_date, party_name, item_name, quality, stamp, weight, gross_weight, net_weight, gold_weight, silver_weight, sale_value, amount FROM sale_register WHERE deleted_at IS NULL");
$sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($sales);

echo "=== PURCHASE REGISTER ITEMS & PURITIES ===\n";
$stmt = $db->query("SELECT id, voucher_no, voucher_date, party_name, particular, quality, stamp, weight, gross_weight, net_weight, gold_weight, silver_weight, purchase_value, amount FROM purchase_register WHERE deleted_at IS NULL");
$purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($purchases);
