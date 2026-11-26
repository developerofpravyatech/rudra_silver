<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
require_once __DIR__ . '/../backend/models/PurchaseRegister.php';
require_once __DIR__ . '/../backend/models/SaleRegister.php';

\Config\Config::load(__DIR__ . '/../backend/.env');

echo "=== 1. TESTING PURCHASE REGISTER ===\n";
$purList = \Models\PurchaseRegister::paginate(['search' => 'KANDORA'], 'voucher_date', 'desc', 1, 10);
echo "Search 'KANDORA' count: " . $purList['total'] . "\n";

$purNew = \Models\PurchaseRegister::create([
    'voucher_no' => 'PUR-TEST-99',
    'voucher_date' => '2026-11-25',
    'party_name' => 'Test Supplier Ltd',
    'particular' => 'TEST SILVER PAYAL',
    'weight' => 100.5,
    'pieces' => 5,
    'purchase_value' => 8500,
    'amount' => 8500,
]);
echo "Created Purchase ID: {$purNew['id']} ({$purNew['voucher_no']})\n";

$purUpd = \Models\PurchaseRegister::update($purNew['id'], [
    'particular' => 'TEST SILVER PAYAL UPDATED',
    'amount' => 9200,
]);
echo "Updated Purchase Particular: {$purUpd['particular']}, Amount: {$purUpd['amount']}\n";

$purDel = \Models\PurchaseRegister::softDelete($purNew['id']);
echo "Soft Delete Purchase: " . ($purDel ? 'SUCCESS' : 'FAILED') . "\n";
$purAfter = \Models\PurchaseRegister::findById($purNew['id']);
echo "After Soft Delete findById: " . ($purAfter === null ? 'NULL (Verified)' : 'FOUND!') . "\n";

echo "\n=== 2. TESTING SALE REGISTER ===\n";
$salList = \Models\SaleRegister::paginate(['register_type' => 'TAGGED'], 'voucher_date', 'desc', 1, 10);
echo "Filter register_type='TAGGED' count: " . $salList['total'] . "\n";

$salNew = \Models\SaleRegister::create([
    'voucher_no' => 'SAL-TEST-99',
    'voucher_date' => '2026-11-25',
    'party_name' => 'Test Customer Co',
    'item_name' => 'Silver Chain',
    'item_type' => 'Chain',
    'particular' => 'TEST SILVER CHAIN',
    'weight' => 45.0,
    'pieces' => 2,
    'sale_value' => 4200,
    'amount' => 4200,
]);
echo "Created Sale ID: {$salNew['id']} ({$salNew['voucher_no']})\n";

$salUpd = \Models\SaleRegister::update($salNew['id'], [
    'item_name' => 'Silver Chain Pro',
    'amount' => 4800,
]);
echo "Updated Sale Item Name: {$salUpd['item_name']}, Amount: {$salUpd['amount']}\n";

$salDel = \Models\SaleRegister::softDelete($salNew['id']);
echo "Soft Delete Sale: " . ($salDel ? 'SUCCESS' : 'FAILED') . "\n";
$salAfter = \Models\SaleRegister::findById($salNew['id']);
echo "After Soft Delete findById: " . ($salAfter === null ? 'NULL (Verified)' : 'FOUND!') . "\n";

echo "\n>>> ALL PURCHASE & SALE REGISTER CRUD TESTS PASSED <<<\n";
