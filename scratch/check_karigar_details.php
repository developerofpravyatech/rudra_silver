<?php
$pdo = new PDO('mysql:host=localhost;dbname=rudra_silver', 'root', '');
echo "=== karigar_issues ===\n";
foreach ($pdo->query("SELECT id, voucher_no, karigar_id, karigar_name, lot_no, status FROM karigar_issues")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo json_encode($r) . "\n";
}
echo "=== karigars table ===\n";
foreach ($pdo->query("SELECT id, karigar_code, karigar_name, status FROM karigars LIMIT 5")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo json_encode($r) . "\n";
}
echo "=== accounts(KARIGAR) ===\n";
foreach ($pdo->query("SELECT id, account_code, name, is_active FROM accounts WHERE account_type='KARIGAR' LIMIT 5")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo json_encode($r) . "\n";
}
