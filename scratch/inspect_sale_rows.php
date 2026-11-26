<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

echo "=== ALL ROWS IN sale_register ===\n";
$stmt = $db->query("SELECT id, voucher_no, voucher_date, party_name, account_group, item_name, particular, quality, weight, sale_value, return_weight, sale_return_value, gold_weight, silver_weight, amount, branch_name FROM sale_register WHERE deleted_at IS NULL");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "ID: {$r['id']} | Date: {$r['voucher_date']} | Vou: {$r['voucher_no']} | Party: {$r['party_name']} | Item: {$r['item_name']} | Qual: {$r['quality']} | Wt: {$r['weight']} | GoldWt: {$r['gold_weight']} | SilverWt: {$r['silver_weight']} | SaleVal: {$r['sale_value']} | Amt: {$r['amount']} | Branch: {$r['branch_name']}\n";
}
