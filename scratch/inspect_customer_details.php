<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

function descTable($db, $tbl) {
    echo "=== {$tbl} ===\n";
    $stmt = $db->query("DESCRIBE {$tbl}");
    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo sprintf("%-25s %-20s %-10s\n", $r['Field'], $r['Type'], $r['Null']);
    }
    echo "\n";
}

descTable($db, 'customer');
descTable($db, 'accounts');
descTable($db, 'branches');

echo "=== SAMPLE customer ===\n";
$stmt = $db->query("SELECT * FROM customer LIMIT 2");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== SAMPLE accounts ===\n";
$stmt = $db->query("SELECT * FROM accounts LIMIT 2");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== ALL ROWS IN sale_register ===\n";
$stmt = $db->query("SELECT id, voucher_no, voucher_date, party_name, account_group, item_name, particular, quality, weight, sale_value, return_weight, sale_return_value, gold_weight, silver_weight, amount, branch_name FROM sale_register WHERE deleted_at IS NULL");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== ALL ROWS IN purchase_register ===\n";
$stmt = $db->query("SELECT id, voucher_no, voucher_date, party_name, account_group, particular, quality, weight, purchase_value, return_weight, purchase_return_value, gold_weight, silver_weight, amount, branch_name FROM purchase_register WHERE deleted_at IS NULL");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
