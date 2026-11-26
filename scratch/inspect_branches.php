<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

echo "=== BRANCHES DATA ===\n";
$stmt = $db->query("SELECT * FROM branches");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
