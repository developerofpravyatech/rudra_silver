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

$steps = [];
$errors = [];

// STEP 1: Enhance account_groups table
$steps[] = 'Enhancing account_groups table...';
try {
    // Add missing columns
    $cols = $pdo->query('DESCRIBE account_groups')->fetchAll(\PDO::FETCH_COLUMN);
    if (!in_array('description', $cols)) {
        $pdo->exec('ALTER TABLE account_groups ADD COLUMN description VARCHAR(255) NULL AFTER nature');
    }
    if (!in_array('is_active', $cols)) {
        $pdo->exec('ALTER TABLE account_groups ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER description');
    }
    if (!in_array('code', $cols)) {
        $pdo->exec('ALTER TABLE account_groups ADD COLUMN code VARCHAR(20) NULL AFTER name');
    }
    if (!in_array('created_at', $cols)) {
        $pdo->exec('ALTER TABLE account_groups ADD COLUMN created_at DATETIME DEFAULT NULL');
        $pdo->exec('ALTER TABLE account_groups ADD COLUMN updated_at DATETIME DEFAULT NULL');
    }
    echo 'OK: account_groups enhanced' . PHP_EOL;
} catch(\Exception $e) { $errors[] = 'account_groups: ' . $e->getMessage(); echo 'ERR: ' . $e->getMessage() . PHP_EOL; }

// STEP 2: Create ledgers table
$steps[] = 'Creating ledgers table...';
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS ledgers (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        ledger_code VARCHAR(30) NOT NULL UNIQUE,
        ledger_name VARCHAR(150) NOT NULL,
        group_id INT UNSIGNED NOT NULL,
        opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        opening_balance_type ENUM('DR','CR','NIL') NOT NULL DEFAULT 'NIL',
        opening_balance_date DATE NULL,
        address VARCHAR(255) NULL,
        mobile VARCHAR(30) NULL,
        city VARCHAR(60) NULL,
        state VARCHAR(60) NULL,
        gst_no VARCHAR(20) NULL,
        pan_no VARCHAR(15) NULL,
        email VARCHAR(100) NULL,
        contact_person VARCHAR(100) NULL,
        description TEXT NULL,
        status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        account_ref_id INT UNSIGNED NULL COMMENT 'FK to accounts.id for party integration',
        created_at DATETIME DEFAULT NULL,
        updated_at DATETIME DEFAULT NULL,
        INDEX idx_group_id (group_id),
        INDEX idx_account_ref_id (account_ref_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo 'OK: ledgers table created' . PHP_EOL;
} catch(\Exception $e) { $errors[] = 'ledgers: ' . $e->getMessage(); echo 'ERR: ' . $e->getMessage() . PHP_EOL; }

// STEP 3: Create ledger_postings table
$steps[] = 'Creating ledger_postings table...';
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS ledger_postings (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        ledger_id INT UNSIGNED NOT NULL,
        voucher_id BIGINT UNSIGNED NULL,
        reference_type VARCHAR(50) NULL COMMENT 'RECEIPT,PAYMENT,CONTRA,JOURNAL,SALE,PURCHASE,etc.',
        reference_id BIGINT UNSIGNED NULL,
        debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        running_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        balance_type ENUM('DR','CR') NOT NULL DEFAULT 'DR',
        posting_date DATE NOT NULL,
        narration VARCHAR(255) NULL,
        is_opening TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT NULL,
        INDEX idx_ledger_id (ledger_id),
        INDEX idx_posting_date (posting_date),
        INDEX idx_voucher_id (voucher_id),
        INDEX idx_reference (reference_type, reference_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo 'OK: ledger_postings table created' . PHP_EOL;
} catch(\Exception $e) { $errors[] = 'ledger_postings: ' . $e->getMessage(); echo 'ERR: ' . $e->getMessage() . PHP_EOL; }

// STEP 4: Create accounting_vouchers table (double-entry voucher entries)
$steps[] = 'Creating voucher_entries table...';
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS voucher_entries (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        voucher_id BIGINT UNSIGNED NOT NULL,
        ledger_id INT UNSIGNED NOT NULL,
        debit_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        credit_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        narration VARCHAR(255) NULL,
        created_at DATETIME DEFAULT NULL,
        INDEX idx_voucher_id (voucher_id),
        INDEX idx_ledger_id (ledger_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo 'OK: voucher_entries table created' . PHP_EOL;
} catch(\Exception $e) { $errors[] = 'voucher_entries: ' . $e->getMessage(); echo 'ERR: ' . $e->getMessage() . PHP_EOL; }

// STEP 5: Enhance vouchers table with missing columns
$steps[] = 'Enhancing vouchers table...';
try {
    $cols = array_map(fn($r) => $r['Field'], $pdo->query('DESCRIBE vouchers')->fetchAll(\PDO::FETCH_ASSOC));
    if (!in_array('status', $cols)) {
        $pdo->exec("ALTER TABLE vouchers ADD COLUMN status ENUM('DRAFT','POSTED','CANCELLED') NOT NULL DEFAULT 'POSTED' AFTER narration");
    }
    if (!in_array('updated_at', $cols)) {
        $pdo->exec("ALTER TABLE vouchers ADD COLUMN updated_at DATETIME DEFAULT NULL");
    }
    if (!in_array('deleted_at', $cols)) {
        $pdo->exec("ALTER TABLE vouchers ADD COLUMN deleted_at DATETIME DEFAULT NULL");
    }
    if (!in_array('second_account_id', $cols)) {
        $pdo->exec("ALTER TABLE vouchers ADD COLUMN second_account_id INT UNSIGNED NULL COMMENT 'For CONTRA: bank account; for JOURNAL: credit side ledger'");
    }
    echo 'OK: vouchers enhanced' . PHP_EOL;
} catch(\Exception $e) { $errors[] = 'vouchers enhance: ' . $e->getMessage(); echo 'ERR: ' . $e->getMessage() . PHP_EOL; }

// STEP 6: Seed extra account_groups if needed
$steps[] = 'Seeding account groups...';
try {
    $existing = $pdo->query('SELECT name FROM account_groups')->fetchAll(\PDO::FETCH_COLUMN);
    $groups = [
        ['name' => 'Capital Accounts', 'nature' => 'LIABILITY', 'code' => 'CAP'],
        ['name' => 'Loans & Liabilities', 'nature' => 'LIABILITY', 'code' => 'LOAN'],
        ['name' => 'Fixed Assets', 'nature' => 'ASSET', 'code' => 'FA'],
        ['name' => 'Direct Income', 'nature' => 'INCOME', 'code' => 'DI'],
        ['name' => 'Indirect Income', 'nature' => 'INCOME', 'code' => 'II'],
        ['name' => 'Direct Expenses', 'nature' => 'EXPENSE', 'code' => 'DE'],
        ['name' => 'Indirect Expenses', 'nature' => 'EXPENSE', 'code' => 'IE'],
        ['name' => 'Sales Accounts', 'nature' => 'INCOME', 'code' => 'SALES'],
        ['name' => 'Purchase Accounts', 'nature' => 'EXPENSE', 'code' => 'PURCH'],
        ['name' => 'Duties & Taxes', 'nature' => 'LIABILITY', 'code' => 'TAX'],
    ];
    $stmt = $pdo->prepare("INSERT INTO account_groups (name, code, nature, is_active, created_at) VALUES (?, ?, ?, 1, NOW())");
    $cnt = 0;
    foreach($groups as $g) {
        if (!in_array($g['name'], $existing)) {
            $stmt->execute([$g['name'], $g['code'], $g['nature']]);
            $cnt++;
        }
    }
    echo "OK: $cnt new account groups seeded" . PHP_EOL;
} catch(\Exception $e) { $errors[] = 'seed groups: ' . $e->getMessage(); echo 'ERR: ' . $e->getMessage() . PHP_EOL; }

// STEP 7: Auto-create ledgers for existing accounts
$steps[] = 'Creating ledgers for existing accounts...';
try {
    $accounts = $pdo->query("SELECT a.*, ag.id as ag_id FROM accounts a LEFT JOIN account_groups ag ON a.group_id = ag.id")->fetchAll(\PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("INSERT INTO ledgers (ledger_code, ledger_name, group_id, opening_balance, opening_balance_type, mobile, city, state, gst_no, pan_no, email, status, account_ref_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, NOW())
        ON DUPLICATE KEY UPDATE account_ref_id = VALUES(account_ref_id)");
    
    $cnt = 0;
    foreach($accounts as $acc) {
        $ob = abs((float)($acc['balance_inr'] ?? 0));
        $obType = 'NIL';
        if($ob > 0) {
            if(in_array($acc['account_type'], ['CUSTOMER','KARIGAR'])) $obType = 'DR';
            elseif(in_array($acc['account_type'], ['SUPPLIER'])) $obType = 'CR';
            else $obType = 'DR';
        }
        $groupId = $acc['ag_id'] ?? 1;
        $stmt->execute([
            'L-' . str_pad($acc['id'], 4, '0', STR_PAD_LEFT),
            $acc['name'],
            $groupId,
            $ob,
            $obType,
            $acc['mobile'] ?? null,
            $acc['city'] ?? null,
            $acc['state'] ?? null,
            $acc['gstin'] ?? null,
            $acc['pan_no'] ?? null,
            $acc['email'] ?? null,
            $acc['id']
        ]);
        $cnt++;
    }
    echo "OK: $cnt ledgers created/updated for accounts" . PHP_EOL;
} catch(\Exception $e) { $errors[] = 'create ledgers: ' . $e->getMessage(); echo 'ERR: ' . $e->getMessage() . PHP_EOL; }

echo PHP_EOL . '--- SUMMARY ---' . PHP_EOL;
echo 'Steps: ' . count($steps) . PHP_EOL;
echo 'Errors: ' . count($errors) . PHP_EOL;
if($errors) echo implode(PHP_EOL, $errors) . PHP_EOL;
echo 'DONE' . PHP_EOL;
