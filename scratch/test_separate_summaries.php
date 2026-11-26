<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
require_once __DIR__ . '/../backend/models/PurchaseRegister.php';
require_once __DIR__ . '/../backend/models/SaleRegister.php';

use Models\PurchaseRegister;
use Models\SaleRegister;

echo "=== TEST PURCHASE REGISTER SUMMARY ===\n";
$purSummary = PurchaseRegister::getSummary([]);
print_r($purSummary);

echo "\n=== TEST SALE REGISTER SUMMARY ===\n";
$saleSummary = SaleRegister::getSummary([]);
print_r($saleSummary);

echo "\n=== TEST FILTERED PURCHASE SUMMARY (Party = 'Rajesh Silver') ===\n";
$filteredPur = PurchaseRegister::getSummary(['party_name' => 'Rajesh Silver']);
print_r($filteredPur);

echo "\n=== TEST FILTERED SALE SUMMARY (Party = 'Aarti Jewellers') ===\n";
$filteredSale = SaleRegister::getSummary(['party_name' => 'Aarti Jewellers']);
print_r($filteredSale);
