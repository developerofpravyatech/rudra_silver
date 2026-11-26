<?php
$pdo = new PDO('mysql:host=localhost;dbname=rudra_silver', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = ['job_cards', 'metal_stock', 'stock_types', 'stock_status', 'branches'];
foreach ($tables as $t) {
    echo "=== TABLE: $t ===" . PHP_EOL;
    $cols = $pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) echo "  {$c['Field']} ({$c['Type']}) {$c['Null']} default={$c['Default']}" . PHP_EOL;
    $cnt = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
    echo "  ROWS: $cnt" . PHP_EOL;
    if ($cnt > 0 && $cnt < 10) {
        $rows = $pdo->query("SELECT * FROM $t LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) echo "  ROW: " . json_encode($r) . PHP_EOL;
    }
    echo PHP_EOL;
}

// Check KARIGAR accounts
echo "=== KARIGAR ACCOUNTS ===" . PHP_EOL;
$rows = $pdo->query("SELECT id, account_code, name, city, balance_inr, balance_fine_gold, balance_fine_silver, is_active FROM accounts WHERE account_type='KARIGAR'")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) echo json_encode($r) . PHP_EOL;

echo PHP_EOL . 'DONE' . PHP_EOL;
