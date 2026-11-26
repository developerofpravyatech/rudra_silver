<?php
require __DIR__ . '/../backend/config/Config.php';
require __DIR__ . '/../backend/config/Database.php';
$db = \Config\Database::getConnection();
$stmt = $db->query('SELECT id,name,email,mobile,role,is_active FROM users LIMIT 5');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));