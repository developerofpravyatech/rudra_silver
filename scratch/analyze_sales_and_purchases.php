<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

echo "=== SALE REGISTER DATES AND METALS ===\n";
$stmt = $db->query("SELECT 
    id, voucher_no, voucher_date, party_name, category, quality, weight, gold_weight, silver_weight, sale_value, amount
FROM sale_register WHERE deleted_at IS NULL ORDER BY voucher_date ASC");
$sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($sales as $s) {
    echo "Sale ID {$s['id']}: Date={$s['voucher_date']}, Vou={$s['voucher_no']}, Party={$s['party_name']}, Cat={$s['category']}, Qual={$s['quality']}, Wt={$s['weight']}, GoldWt={$s['gold_weight']}, SilWt={$s['silver_weight']}, SaleVal={$s['sale_value']}, Amt={$s['amount']}\n";
}

echo "\n=== PURCHASE REGISTER DATES AND METALS ===\n";
$stmt = $db->query("SELECT 
    id, voucher_no, voucher_date, party_name, category, quality, weight, gold_weight, silver_weight, purchase_value, amount
FROM purchase_register WHERE deleted_at IS NULL ORDER BY voucher_date ASC");
$purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($purchases as $p) {
    echo "Pur ID {$p['id']}: Date={$p['voucher_date']}, Vou={$p['voucher_no']}, Party={$p['party_name']}, Cat={$p['category']}, Qual={$p['quality']}, Wt={$p['weight']}, GoldWt={$p['gold_weight']}, SilWt={$p['silver_weight']}, PurVal={$p['purchase_value']}, Amt={$p['amount']}\n";
}
