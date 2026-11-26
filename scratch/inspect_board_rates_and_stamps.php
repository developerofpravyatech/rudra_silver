<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

echo "=== PURITY STAMPS TABLE ===\n";
$stmt = $db->query("SELECT * FROM purity_stamps");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== DAILY BOARD RATES ===\n";
$stmt = $db->query("SELECT * FROM daily_board_rates ORDER BY rate_date DESC LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== BULLION SAUDAS ===\n";
$stmt = $db->query("SELECT * FROM bullion_saudas LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== DAILY TRANSACTIONS GOLD/SILVER ===\n";
$stmt = $db->query("SELECT DISTINCT voucher_type, SUM(gold_fine) as gf, SUM(silver_fine) as sf, SUM(total_amount) as amt FROM daily_transactions GROUP BY voucher_type");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== VOUCHERS & VOUCHER ITEMS ===\n";
$stmt = $db->query("SELECT COUNT(*) as v_count FROM vouchers");
print_r($stmt->fetch(PDO::FETCH_ASSOC));
$stmt = $db->query("SELECT COUNT(*) as vi_count FROM voucher_items");
print_r($stmt->fetch(PDO::FETCH_ASSOC));
