<?php
require_once __DIR__ . '/../backend/config/config.php';
require_once __DIR__ . '/../backend/config/database.php';

$db = \Config\Database::getConnection();

$db->exec("CREATE TABLE IF NOT EXISTS stock_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(50) NULL,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$db->exec("INSERT IGNORE INTO stock_types (id, name, code, sort_order) VALUES 
    (1, 'Finished', 'FINISHED', 1),
    (2, 'Raw', 'RAW', 2),
    (3, 'Unfinish', 'UNFINISH', 3),
    (4, 'Dust', 'DUST', 4),
    (5, 'Quality', 'QUALITY', 5)");

echo "stock_types table ready\n";
print_r($db->query('SELECT * FROM stock_types')->fetchAll(PDO::FETCH_ASSOC));
