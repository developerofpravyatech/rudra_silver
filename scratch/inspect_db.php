<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
\Config\Config::load(__DIR__ . '/../backend/.env');

$db = Config\Database::getConnection();

echo "=== TABLES ===\n";
$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo implode("\n", $tables) . "\n\n";

echo "=== DAILY_BALANCE COLUMNS ===\n";
$cols = $db->query("DESCRIBE daily_balance")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "{$c['Field']} ({$c['Type']})\n";
}

echo "\n=== ACCOUNTS COLUMNS ===\n";
if (in_array('accounts', $tables)) {
    $cols = $db->query("DESCRIBE accounts")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo "{$c['Field']} ({$c['Type']})\n";
    }
}

echo "\n=== STOCK_TYPES COLUMNS ===\n";
if (in_array('stock_types', $tables)) {
    $cols = $db->query("DESCRIBE stock_types")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo "{$c['Field']} ({$c['Type']})\n";
    }
} else {
    echo "stock_types table does NOT exist yet!\n";
}

echo "\n=== DAILY_TRANSACTIONS COLUMNS ===\n";
if (in_array('daily_transactions', $tables)) {
    $cols = $db->query("DESCRIBE daily_transactions")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo "{$c['Field']} ({$c['Type']})\n";
    }
} else {
    echo "daily_transactions table does NOT exist yet!\n";
}

echo "\n=== SILVER_BULLION COLUMNS ===\n";
if (in_array('silver_bullion', $tables)) {
    $cols = $db->query("DESCRIBE silver_bullion")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo "{$c['Field']} ({$c['Type']})\n";
    }
    $dates = $db->query("SELECT MIN(transaction_date) as min_date, MAX(transaction_date) as max_date, COUNT(*) as cnt FROM silver_bullion")->fetch(PDO::FETCH_ASSOC);
    print_r($dates);

}

