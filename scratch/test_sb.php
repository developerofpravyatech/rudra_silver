<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

\Config\Config::load(__DIR__ . '/../backend/.env');
$db = \Config\Database::getConnection();

$rows = $db->query("SELECT * FROM silver_bullion LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
echo "Count: " . count($rows) . "\n";
print_r($rows);
