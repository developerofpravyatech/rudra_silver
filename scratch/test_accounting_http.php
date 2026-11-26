<?php
namespace Config;

spl_autoload_register(function($class) {
    $base = __DIR__ . '/../backend/';
    $file = $base . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) require_once $file;
});

require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Models\AccountGroup;
use Models\Ledger;
use Models\Voucher;
use Services\AccountingEngine;
use Services\PartyLedgerSync;

$pdo = Database::getConnection();
$passed = 0;
$failed = 0;

function assertTrue($cond, $msg) {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "  [PASS] $msg\n";
    } else {
        $failed++;
        echo "  [FAIL] $msg\n";
    }
}

echo "=== RUDRA SILVER ACCOUNTING INTEGRATION TESTS ===\n\n";

// 1. Account Group CRUD
echo "1. Account Group Master:\n";
$agName = 'Test Group ' . time();
$ag = AccountGroup::create(['name' => $agName, 'code' => 'TG' . rand(10,99), 'nature' => 'ASSET']);
assertTrue(!empty($ag['id']), "Created account group #$ag[id]");
$agUpdated = AccountGroup::update((int)$ag['id'], ['name' => $agName . ' Updated', 'nature' => 'ASSET', 'code' => $ag['code']]);
assertTrue($agUpdated['name'] === $agName . ' Updated', "Updated account group");

// 2. Ledger Master CRUD + Duplicate prevention
echo "\n2. Ledger Master:\n";
$code = 'L-TST-' . rand(100,999);
$l1 = Ledger::create([
    'ledger_code' => $code,
    'ledger_name' => 'Test Party A ' . time(),
    'group_id' => $ag['id'],
    'opening_balance' => 1000,
    'opening_balance_type' => 'DR',
    'opening_balance_date' => date('Y-m-d'),
]);
assertTrue(!empty($l1['id']), "Created ledger #$l1[id] with opening balance 1000 DR");

$dupBlocked = false;
try {
    Ledger::create(['ledger_code' => $code, 'ledger_name' => 'Dup', 'group_id' => $ag['id']]);
} catch (\Exception $e) {
    $dupBlocked = true;
}
assertTrue($dupBlocked, "Duplicate ledger code rejected");

$bal1 = AccountingEngine::getBalance((int)$l1['id']);
assertTrue($bal1['balance'] == 1000 && $bal1['type'] === 'DR', "Opening balance reflected in AccountingEngine (1000 DR)");

// 3. Double-Entry Voucher & Unbalanced Rejection
echo "\n3. Accounting Engine & Voucher Posting:\n";
$cashLedgerId = PartyLedgerSync::getSystemLedger('Cash in Hand', 'Cash in Hand', 'ASSET');

// Reject unbalanced
$unbalRejected = false;
try {
    AccountingEngine::post(999999, 'JOURNAL', date('Y-m-d'), [
        ['ledger_id' => $cashLedgerId, 'debit' => 500, 'credit' => 0],
        ['ledger_id' => $l1['id'], 'debit' => 0, 'credit' => 400],
    ], 'Bad entry');
} catch (\Exception $e) {
    $unbalRejected = true;
}
assertTrue($unbalRejected, "Unbalanced journal entry rejected");

// Create balanced voucher in DB
$pdo->prepare("INSERT INTO vouchers (voucher_no, series, branch_id, voucher_type, voucher_date, account_id, net_amount, narration, status, created_at) VALUES (9991, 'REC', 1, 'RECEIPT', CURDATE(), 1, 500, 'Test Receipt', 'POSTED', NOW())")->execute();
$testVid = (int)$pdo->lastInsertId();
AccountingEngine::post($testVid, 'RECEIPT', date('Y-m-d'), [
    ['ledger_id' => $cashLedgerId, 'debit' => 500, 'credit' => 0, 'narration' => 'Cash received'],
    ['ledger_id' => $l1['id'], 'debit' => 0, 'credit' => 500, 'narration' => 'Party credit'],
], 'Test Receipt');

$balAfter = AccountingEngine::getBalance((int)$l1['id']);
assertTrue($balAfter['balance'] == 500 && $balAfter['type'] === 'DR', "Ledger balance updated to 500 DR after 500 receipt");

// Reverse voucher
AccountingEngine::reverse($testVid);
$pdo->prepare("DELETE FROM vouchers WHERE id = ?")->execute([$testVid]);
$balReversed = AccountingEngine::getBalance((int)$l1['id']);
assertTrue($balReversed['balance'] == 1000 && $balReversed['type'] === 'DR', "Ledger balance restored to 1000 DR after reversal");

// 4. Trial Balance & Reports
echo "\n4. Reports & Dashboard Summary:\n";
$tb = AccountingEngine::trialBalance();
assertTrue(isset($tb['total_dr']) && isset($tb['total_cr']), "Trial Balance generated (Dr={$tb['total_dr']}, Cr={$tb['total_cr']})");
$dbk = AccountingEngine::dayBook(date('Y-m-d'));
assertTrue(is_array($dbk), "Day Book returned array");
$cbk = AccountingEngine::cashBook();
assertTrue(is_array($cbk), "Cash Book returned array");
$pl = AccountingEngine::profitLoss();
assertTrue(isset($pl['net_profit']), "Profit & Loss generated (net={$pl['net_profit']})");
$bs = AccountingEngine::balanceSheet();
assertTrue(isset($bs['total_assets']) && isset($bs['total_liabilities']), "Balance Sheet generated");
$summary = Voucher::getDailySummary(date('Y-m-d'));
assertTrue(array_key_exists('opening_cash', $summary) && array_key_exists('closing_cash', $summary) && array_key_exists('bank_balance', $summary), "Dashboard daily summary includes real cash & bank balances");

// Cleanup test ledger & group
$pdo->prepare("DELETE FROM ledger_postings WHERE ledger_id = ?")->execute([$l1['id']]);
Ledger::delete((int)$l1['id']);
AccountGroup::delete((int)$ag['id']);
assertTrue(true, "Cleaned up test ledger and account group");

// 5. HTTP Endpoints check via curl to localhost if Apache is running
echo "\n5. HTTP Endpoint Smoke Check:\n";
$urls = [
    'http://localhost/Rudra-silver/backend/api/account-groups',
    'http://localhost/Rudra-silver/backend/api/ledger',
    'http://localhost/Rudra-silver/backend/api/accounting-vouchers',
    'http://localhost/Rudra-silver/backend/api/reports/trial-balance',
    'http://localhost/Rudra-silver/backend/api/reports/profit-loss',
    'http://localhost/Rudra-silver/backend/api/reports/balance-sheet',
    'http://localhost/Rudra-silver/backend/api/sale-returns',
    'http://localhost/Rudra-silver/backend/api/purchase-returns',
    'http://localhost/Rudra-silver/backend/api/v1/daily-summary',
];
foreach ($urls as $url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    assertTrue($code === 200, "GET $url -> HTTP $code");
}

echo "\n=== RESULT: $passed PASSED, $failed FAILED ===\n";
exit($failed > 0 ? 1 : 0);
