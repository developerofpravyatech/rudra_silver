<?php
namespace Config;

// Bootstrap the namespace autoloading
spl_autoload_register(function($class) {
    $base = __DIR__ . '/../backend/';
    $file = $base . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) require_once $file;
});

require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

$pdo = Database::getConnection();
$tables = $pdo->query('SHOW TABLES')->fetchAll(\PDO::FETCH_COLUMN);
echo 'ALL TABLES:' . PHP_EOL;
echo implode(', ', $tables) . PHP_EOL;

$keyTables = ['account_groups','accounts','vouchers','voucher_items','ledgers','ledger_postings','payment_splits'];
foreach($keyTables as $t) {
    if(in_array($t, $tables)) {
        $cols = $pdo->query('DESCRIBE ' . $t)->fetchAll(\PDO::FETCH_ASSOC);
        echo PHP_EOL . 'TABLE: ' . $t . PHP_EOL;
        foreach($cols as $c) echo '  ' . $c['Field'] . ' | ' . $c['Type'] . ' | NULL=' . $c['Null'] . PHP_EOL;
        $cnt = $pdo->query('SELECT COUNT(*) FROM ' . $t)->fetchColumn();
        echo '  ROWS: ' . $cnt . PHP_EOL;
    } else {
        echo PHP_EOL . 'TABLE NOT FOUND: ' . $t . PHP_EOL;
    }
}

echo PHP_EOL . 'ACCOUNTS TABLE STRUCTURE:' . PHP_EOL;
$cols = $pdo->query('DESCRIBE accounts')->fetchAll(\PDO::FETCH_ASSOC);
foreach($cols as $c) echo '  ' . $c['Field'] . ' | ' . $c['Type'] . PHP_EOL;
$cnt = $pdo->query('SELECT COUNT(*) FROM accounts')->fetchColumn();
echo '  ROWS: ' . $cnt . PHP_EOL;

$types = $pdo->query('SELECT account_type, COUNT(*) as cnt FROM accounts GROUP BY account_type')->fetchAll(\PDO::FETCH_ASSOC);
echo '  TYPES: ';
foreach($types as $t2) echo $t2['account_type'] . '=' . $t2['cnt'] . ' ';
echo PHP_EOL;

// Check if account_groups has needed columns
echo PHP_EOL . 'ACCOUNT_GROUPS (if exists):' . PHP_EOL;
if(in_array('account_groups', $tables)) {
    $cols = $pdo->query('DESCRIBE account_groups')->fetchAll(\PDO::FETCH_ASSOC);
    foreach($cols as $c) echo '  ' . $c['Field'] . ' | ' . $c['Type'] . PHP_EOL;
    $rows = $pdo->query('SELECT * FROM account_groups LIMIT 10')->fetchAll(\PDO::FETCH_ASSOC);
    echo '  SAMPLE ROWS:' . PHP_EOL;
    foreach($rows as $r) echo '    ' . json_encode($r) . PHP_EOL;
} else {
    echo '  NOT EXISTS' . PHP_EOL;
}
