<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

\Config\Config::load(__DIR__ . '/../backend/.env');
$db = \Config\Database::getConnection();

echo "sale_register count: " . $db->query("SELECT COUNT(*) FROM sale_register")->fetchColumn() . "\n";
echo "purchase_register count: " . $db->query("SELECT COUNT(*) FROM purchase_register")->fetchColumn() . "\n";

$sRows = $db->query("SELECT * FROM sale_register LIMIT 2")->fetchAll(PDO::FETCH_ASSOC);
print_r($sRows);

$pRows = $db->query("SELECT * FROM purchase_register LIMIT 2")->fetchAll(PDO::FETCH_ASSOC);
print_r($pRows);
