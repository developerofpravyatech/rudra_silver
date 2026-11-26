<?php
require __DIR__ . '/../backend/config/Config.php';
require __DIR__ . '/../backend/config/Database.php';
$db = \Config\Database::getConnection();
$db->exec("ALTER TABLE categories MODIFY metal_type VARCHAR(255) NOT NULL");
echo "done\n";
