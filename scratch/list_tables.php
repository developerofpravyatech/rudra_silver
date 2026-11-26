<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

echo "=== ALL TABLES IN RUDRA_SILVER ===\n";
foreach ($db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $t) {
    echo $t . "\n";
}
