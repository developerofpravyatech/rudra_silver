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

// 1. Create sale_returns table
$pdo->exec("CREATE TABLE IF NOT EXISTS sale_returns (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    return_no VARCHAR(30) NOT NULL,
    return_date DATE NOT NULL,
    sale_register_id BIGINT UNSIGNED NULL,
    original_voucher_no VARCHAR(50) NULL,
    party_name VARCHAR(150) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    metal_type VARCHAR(50) DEFAULT 'Silver',
    return_pieces INT NOT NULL DEFAULT 0,
    return_weight DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    return_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    refund_mode VARCHAR(30) DEFAULT 'ADJUSTMENT',
    narration VARCHAR(255) NULL,
    status ENUM('POSTED','CANCELLED') NOT NULL DEFAULT 'POSTED',
    created_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT NULL,
    deleted_at DATETIME DEFAULT NULL,
    INDEX idx_return_date (return_date),
    INDEX idx_sale_reg (sale_register_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
echo "OK: sale_returns table ready\n";

// 2. Create purchase_returns table
$pdo->exec("CREATE TABLE IF NOT EXISTS purchase_returns (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    return_no VARCHAR(30) NOT NULL,
    return_date DATE NOT NULL,
    purchase_register_id BIGINT UNSIGNED NULL,
    original_voucher_no VARCHAR(50) NULL,
    party_name VARCHAR(150) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    metal_type VARCHAR(50) DEFAULT 'Silver',
    return_pieces INT NOT NULL DEFAULT 0,
    return_weight DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    return_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    refund_mode VARCHAR(30) DEFAULT 'ADJUSTMENT',
    narration VARCHAR(255) NULL,
    status ENUM('POSTED','CANCELLED') NOT NULL DEFAULT 'POSTED',
    created_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT NULL,
    deleted_at DATETIME DEFAULT NULL,
    INDEX idx_return_date (return_date),
    INDEX idx_purchase_reg (purchase_register_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
echo "OK: purchase_returns table ready\n";

// 3. Ensure opening balance postings exist for all ledgers with opening_balance > 0
$ledgers = $pdo->query("SELECT id, opening_balance, opening_balance_type, opening_balance_date FROM ledgers WHERE opening_balance > 0 AND opening_balance_type IN ('DR','CR')")->fetchAll(\PDO::FETCH_ASSOC);
$obCount = 0;
foreach ($ledgers as $l) {
    $chk = $pdo->prepare("SELECT id FROM ledger_postings WHERE ledger_id = ? AND is_opening = 1 LIMIT 1");
    $chk->execute([$l['id']]);
    if (!$chk->fetchColumn()) {
        $pdo->prepare("INSERT INTO ledger_postings (ledger_id, debit, credit, running_balance, balance_type, posting_date, narration, is_opening, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Opening Balance', 1, NOW())")
            ->execute([
                $l['id'],
                $l['opening_balance_type'] === 'DR' ? $l['opening_balance'] : 0,
                $l['opening_balance_type'] === 'CR' ? $l['opening_balance'] : 0,
                $l['opening_balance'],
                $l['opening_balance_type'],
                $l['opening_balance_date'] ?: date('Y-m-d'),
            ]);
        $obCount++;
    }
}
echo "OK: $obCount opening balance postings synced\n";

// 4. Seed standard system ledgers
\Services\PartyLedgerSync::getSystemLedger('Sales Account', 'Sales Accounts', 'INCOME');
\Services\PartyLedgerSync::getSystemLedger('Purchase Account', 'Purchase Accounts', 'EXPENSE');
\Services\PartyLedgerSync::getSystemLedger('Sales Return Account', 'Sales Accounts', 'INCOME');
\Services\PartyLedgerSync::getSystemLedger('Purchase Return Account', 'Purchase Accounts', 'EXPENSE');
\Services\PartyLedgerSync::getSystemLedger('Cash in Hand', 'Cash in Hand', 'ASSET');
echo "OK: System ledgers ensured\n";
