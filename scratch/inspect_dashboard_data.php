<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
$pdo = \Config\Database::getConnection();

foreach(['silver_bullion','metal_stock','stock_status','inventory_tags'] as $t) {
    echo "=== $t ===\n";
    foreach($pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_ASSOC) as $c) {
        echo "  {$c['Field']} ({$c['Type']})\n";
    }
    echo "  COUNT=" . $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn() . "\n";
}
echo "=== vouchers SALE count ===\n";
print_r($pdo->query("SELECT COUNT(*) as cnt, COALESCE(SUM(net_amount),0) as amt FROM vouchers WHERE voucher_type='SALE' AND deleted_at IS NULL")->fetch(PDO::FETCH_ASSOC));
echo "=== sale_register count ===\n";
print_r($pdo->query("SELECT COUNT(*) as cnt, COALESCE(SUM(GREATEST(amount,sale_value)),0) as amt FROM sale_register WHERE deleted_at IS NULL")->fetch(PDO::FETCH_ASSOC));
