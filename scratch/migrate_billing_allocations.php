<?php
namespace Config;

spl_autoload_register(function($class) {
    $base = __DIR__ . '/../backend/';
    $file = $base . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) require_once $file;
});

require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

$pdo = Database::getConnection();
$pdo->exec("SET SESSION sql_mode = ''");

// 1. Enhance sale_register
$cols = $pdo->query("DESCRIBE sale_register")->fetchAll(\PDO::FETCH_COLUMN);
if (!in_array('gst_amount', $cols)) {
    $pdo->exec("ALTER TABLE sale_register ADD COLUMN gst_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER amount");
}
if (!in_array('paid_amount', $cols)) {
    $pdo->exec("ALTER TABLE sale_register ADD COLUMN paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER gst_amount");
}
if (!in_array('outstanding_amount', $cols)) {
    $pdo->exec("ALTER TABLE sale_register ADD COLUMN outstanding_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER paid_amount");
}
if (!in_array('payment_status', $cols)) {
    $pdo->exec("ALTER TABLE sale_register ADD COLUMN payment_status ENUM('UNPAID','PARTIAL','PAID') NOT NULL DEFAULT 'UNPAID' AFTER outstanding_amount");
}
// Backfill outstanding_amount for existing rows where paid_amount = 0 and outstanding_amount = 0
$pdo->exec("UPDATE sale_register SET outstanding_amount = GREATEST(amount, sale_value) WHERE paid_amount = 0 AND outstanding_amount = 0 AND deleted_at IS NULL");
echo "OK: sale_register enhanced\n";

// 2. Enhance purchase_register
$pcols = $pdo->query("DESCRIBE purchase_register")->fetchAll(\PDO::FETCH_COLUMN);
if (!in_array('gst_amount', $pcols)) {
    $pdo->exec("ALTER TABLE purchase_register ADD COLUMN gst_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER amount");
}
if (!in_array('paid_amount', $pcols)) {
    $pdo->exec("ALTER TABLE purchase_register ADD COLUMN paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER gst_amount");
}
if (!in_array('outstanding_amount', $pcols)) {
    $pdo->exec("ALTER TABLE purchase_register ADD COLUMN outstanding_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER paid_amount");
}
if (!in_array('payment_status', $pcols)) {
    $pdo->exec("ALTER TABLE purchase_register ADD COLUMN payment_status ENUM('UNPAID','PARTIAL','PAID') NOT NULL DEFAULT 'UNPAID' AFTER outstanding_amount");
}
$pdo->exec("UPDATE purchase_register SET outstanding_amount = GREATEST(amount, purchase_value) WHERE paid_amount = 0 AND outstanding_amount = 0 AND deleted_at IS NULL");
echo "OK: purchase_register enhanced\n";

// 3. Enhance vouchers
$vcols = $pdo->query("DESCRIBE vouchers")->fetchAll(\PDO::FETCH_COLUMN);
if (!in_array('payment_mode', $vcols)) {
    $pdo->exec("ALTER TABLE vouchers ADD COLUMN payment_mode VARCHAR(30) DEFAULT 'CASH' AFTER narration");
}
if (!in_array('paid_amount', $vcols)) {
    $pdo->exec("ALTER TABLE vouchers ADD COLUMN paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER net_amount");
}
if (!in_array('outstanding_amount', $vcols)) {
    $pdo->exec("ALTER TABLE vouchers ADD COLUMN outstanding_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER paid_amount");
}
if (!in_array('payment_status', $vcols)) {
    $pdo->exec("ALTER TABLE vouchers ADD COLUMN payment_status ENUM('UNPAID','PARTIAL','PAID') NOT NULL DEFAULT 'UNPAID' AFTER outstanding_amount");
}
if (!in_array('unallocated_amount', $vcols)) {
    $pdo->exec("ALTER TABLE vouchers ADD COLUMN unallocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER payment_status");
}
$pdo->exec("UPDATE vouchers SET outstanding_amount = net_amount WHERE voucher_type IN ('SALE','PURCHASE') AND paid_amount = 0 AND outstanding_amount = 0");
echo "OK: vouchers enhanced\n";

// 4. Create voucher_allocations table
$pdo->exec("CREATE TABLE IF NOT EXISTS voucher_allocations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    voucher_id BIGINT UNSIGNED NOT NULL,
    invoice_source ENUM('SALE_REGISTER','PURCHASE_REGISTER','VOUCHER') NOT NULL,
    invoice_id BIGINT UNSIGNED NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME DEFAULT NULL,
    INDEX idx_voucher (voucher_id),
    INDEX idx_invoice (invoice_source, invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
echo "OK: voucher_allocations table ready\n";

// 5. Ensure GST & Bank system ledgers exist
\Services\PartyLedgerSync::getSystemLedger('GST Output', 'Duties & Taxes', 'LIABILITY');
\Services\PartyLedgerSync::getSystemLedger('GST Input', 'Duties & Taxes', 'LIABILITY');
\Services\PartyLedgerSync::getSystemLedger('Bank Account', 'Bank Accounts', 'ASSET');
echo "OK: GST & Bank system ledgers ensured\n";
