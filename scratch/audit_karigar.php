<?php
$pdo = new PDO('mysql:host=localhost;dbname=rudra_silver', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// List all tables
$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo 'ALL TABLES: ' . implode(', ', $tables) . PHP_EOL . PHP_EOL;

// Check for karigar-related tables
$rel = array_filter($tables, fn($t) => preg_match('/karigar|issue|receive|lot|diamond|stone|metal|stock|job/i', $t));
echo 'RELEVANT TABLES: ' . implode(', ', $rel) . PHP_EOL . PHP_EOL;

// Check accounts with KARIGAR type
$stmt = $pdo->query("DESCRIBE accounts");
echo 'ACCOUNTS COLUMNS: '; 
foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) echo $r['Field'].'('.$r['Type'].') '; 
echo PHP_EOL;

$cnt = $pdo->query("SELECT COUNT(*) FROM accounts WHERE account_type='KARIGAR'")->fetchColumn();
echo 'KARIGAR accounts rows: ' . $cnt . PHP_EOL;

// account_groups 
$grps = $pdo->query('SELECT id, name, nature FROM account_groups')->fetchAll(PDO::FETCH_ASSOC);
echo 'ACCOUNT GROUPS: '; 
foreach($grps as $g) echo $g['id'].'='.$g['name'].'('.$g['nature'].') '; 
echo PHP_EOL . PHP_EOL;

// Check if any existing tables have karigar data
foreach ($tables as $t) {
    if (preg_match('/karigar/i', $t)) {
        $cols = $pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_COLUMN, 0);
        $cnt2 = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
        echo "TABLE: $t | Rows: $cnt2 | Cols: " . implode(', ', $cols) . PHP_EOL;
    }
}

// Check items/item_master
foreach ($tables as $t) {
    if (preg_match('/item/i', $t)) {
        $cols = $pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_COLUMN, 0);
        $cnt2 = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
        echo "TABLE: $t | Rows: $cnt2 | Cols: " . implode(', ', $cols) . PHP_EOL;
    }
}

echo PHP_EOL . 'DONE' . PHP_EOL;
