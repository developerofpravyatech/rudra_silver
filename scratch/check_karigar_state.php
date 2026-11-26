<?php
$pdo = new PDO('mysql:host=localhost;dbname=rudra_silver', 'root', '');
$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) {
    if (stripos($t, 'karigar') !== false) {
        $cnt = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo "$t: $cnt rows\n";
    }
}
$kc = $pdo->query("SELECT COUNT(*) FROM accounts WHERE account_type='KARIGAR'")->fetchColumn();
echo "accounts(KARIGAR): $kc rows\n";
