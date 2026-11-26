<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
\Config\Config::load(__DIR__ . '/../backend/.env');

$db = Config\Database::getConnection();

$count = (int)$db->query("SELECT COUNT(*) FROM stock_types")->fetchColumn();
echo "Current stock_types count: {$count}\n";

if ($count === 0) {
    $types = ['Finished', 'Raw', 'Unfinish', 'Dust', 'Quality'];
    $stmt = $db->prepare("INSERT INTO stock_types (name, is_active, created_at) VALUES (:name, 1, NOW())");
    foreach ($types as $t) {
        $stmt->execute([':name' => $t]);
    }
    echo "Inserted default stock types.\n";
}
