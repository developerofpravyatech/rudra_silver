<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
$pdo = \Config\Database::getConnection();
foreach(['sale_register','purchase_register','vouchers'] as $t) {
    echo '=== ' . $t . ' ===' . PHP_EOL;
    foreach($pdo->query('DESCRIBE ' . $t)->fetchAll(PDO::FETCH_ASSOC) as $c) {
        echo '  ' . $c['Field'] . ' | ' . $c['Type'] . PHP_EOL;
    }
}
