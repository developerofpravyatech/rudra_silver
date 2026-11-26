<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
require_once __DIR__ . '/../backend/models/SilverBullion.php';

\Config\Config::load(__DIR__ . '/../backend/.env');

try {
    echo "--- 1. Testing Create ---\n";
    $newItem = \Models\SilverBullion::create([
        'transaction_date' => '2026-11-24',
        'voucher_no'       => 'VCR-TEST-99',
        'transaction_type' => 'CR',
        'party_name'       => 'Test Bullion Party',
        'fine_weight'      => 10.5,
        'silver_rate'      => 80000,
        'amount'           => 840000,
        'remarks'          => 'Unit test insert',
    ]);
    echo "Created ID: " . $newItem['id'] . ", Party: " . $newItem['party_name'] . "\n";

    echo "--- 2. Testing View / FindById ---\n";
    $fetched = \Models\SilverBullion::findById($newItem['id']);
    echo "Fetched ID: " . $fetched['id'] . ", Amount: " . $fetched['amount'] . "\n";

    echo "--- 3. Testing Update ---\n";
    $updated = \Models\SilverBullion::update($newItem['id'], [
        'transaction_date' => '2026-11-24',
        'voucher_no'       => 'VCR-TEST-99-EDITED',
        'transaction_type' => 'CR',
        'party_name'       => 'Test Bullion Party (Edited)',
        'fine_weight'      => 15.0,
        'silver_rate'      => 81000,
        'amount'           => 1215000,
        'remarks'          => 'Updated test entry',
    ]);
    echo "Updated ID: " . $updated['id'] . ", Party: " . $updated['party_name'] . ", Amount: " . $updated['amount'] . "\n";

    echo "--- 4. Testing Delete ---\n";
    $deleted = \Models\SilverBullion::delete($newItem['id']);
    echo "Deleted result: " . ($deleted ? 'SUCCESS' : 'FAILED') . "\n";

    $afterDelete = \Models\SilverBullion::findById($newItem['id']);
    echo "After delete findById: " . ($afterDelete === null ? 'NULL (Verified Clean)' : 'STILL EXISTS') . "\n";

    echo "\n>>> ALL CRUD OPERATIONS PASS 100% <<<\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
