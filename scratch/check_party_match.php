<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;
$db = Database::getConnection();

$parties = $db->query("SELECT DISTINCT party_name FROM sale_register")->fetchAll(PDO::FETCH_COLUMN);

echo "Checking party matches:\n";
foreach ($parties as $p) {
    $param = "%{$p}%";
    $stmt1 = $db->prepare("SELECT CustomerID, Name, FirmName, City FROM customer WHERE Name LIKE :p1 OR FirmName LIKE :p2");
    $stmt1->execute(['p1' => $param, 'p2' => $param]);
    $cMatch = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    $stmt2 = $db->prepare("SELECT id, name, company_name, city FROM accounts WHERE name LIKE :a1 OR company_name LIKE :a2");
    $stmt2->execute(['a1' => $param, 'a2' => $param]);
    $aMatch = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo "Party '{$p}':\n";
    echo "  Customer matches: " . json_encode($cMatch) . "\n";
    echo "  Accounts matches: " . json_encode($aMatch) . "\n";
}
