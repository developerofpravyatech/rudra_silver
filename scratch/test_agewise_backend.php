<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
require_once __DIR__ . '/../backend/models/AgeWiseReport.php';

use Models\AgeWiseReport;

echo "=== 1. ACCOUNT GROUPS ===\n";
$groups = AgeWiseReport::getAccountGroups();
echo "Count: " . count($groups) . "\n";
foreach ($groups as $g) {
    echo "  [{$g['id']}] {$g['name']} ({$g['nature']}) accounts={$g['account_count']}\n";
}

echo "\n=== 2. FILTER OPTIONS ===\n";
$opts = AgeWiseReport::getFilterOptions();
echo "Cities: " . count($opts['cities']) . ", Locations: " . count($opts['locations']) . ", RefBy: " . count($opts['ref_by_list']) . "\n";

echo "\n=== 3. REPORT (As On 2026-11-25, Interval 15, All Groups) ===\n";
$rep = AgeWiseReport::getReport(['as_on_date' => '2026-11-25', 'interval' => 15, 'balance_type' => 'silver']);
echo "Total parties: {$rep['total']}\n";
echo "Bucket labels: " . json_encode($rep['bucket_labels']) . "\n";
echo "Totals Cash: " . json_encode($rep['totals']['cash']) . "\n";
echo "Totals Gold: " . json_encode($rep['totals']['gold']) . "\n";
echo "Totals Silver: " . json_encode($rep['totals']['silver']) . "\n";

// Verify bucket sum == total for every party
$mismatch = 0;
foreach ($rep['items'] as $row) {
    foreach (['cash', 'gold', 'silver'] as $sec) {
        $sum = round($row[$sec]['current'] + $row[$sec]['bucket_1'] + $row[$sec]['bucket_2'] + $row[$sec]['bucket_3'] + $row[$sec]['old'], 2);
        $tot = round($row[$sec]['total'], 2);
        if (abs($sum - $tot) > 0.05) {
            echo "MISMATCH {$row['account_name']} ($sec): sum=$sum vs total=$tot\n";
            $mismatch++;
        }
    }
}
echo "Bucket sum vs total mismatches: $mismatch\n";

echo "\n=== 4. PARTY LEDGER (Ramesh Patel) ===\n";
$ledger = AgeWiseReport::getPartyLedger('Ramesh Patel', '2026-11-25');
echo "Found: " . ($ledger['found'] ? 'yes' : 'no') . ", Entries: " . count($ledger['entries']) . ", Closing: " . json_encode($ledger['closing']) . "\n";
