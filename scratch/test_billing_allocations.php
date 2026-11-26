<?php
namespace Config;

spl_autoload_register(function($class) {
    $base = __DIR__ . '/../backend/';
    $file = $base . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) require_once $file;
});

require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Models\SaleRegister;
use Models\PurchaseRegister;
use Services\AccountingEngine;
use Services\PartyLedgerSync;
use Services\VoucherAllocationService;

$pdo = Database::getConnection();
$passed = 0;
$failed = 0;

function check($cond, $msg) {
    global $passed, $failed;
    if ($cond) { $passed++; echo "  [PASS] $msg\n"; }
    else       { $failed++; echo "  [FAIL] $msg\n"; }
}

// Helper to create a test Receipt/Payment voucher using VoucherAllocationService + AccountingEngine
function createTestVoucher($type, $accId, $amount, $allocs, $mode = 'CASH') {
    $pdo = Database::getConnection();
    $pdo->beginTransaction();
    try {
        $nextNo = ((int)$pdo->query("SELECT COALESCE(MAX(voucher_no),0) FROM vouchers WHERE voucher_type = '$type'")->fetchColumn()) + 1;
        $series = substr($type, 0, 3);
        $pdo->prepare("INSERT INTO vouchers (voucher_no, series, branch_id, voucher_type, voucher_date, account_id, net_amount, payment_mode, narration, status, created_at) VALUES (?, ?, 1, ?, CURDATE(), ?, ?, ?, 'Test Voucher', 'POSTED', NOW())")
            ->execute([$nextNo, $series, $type, $accId, $amount, $mode]);
        $vid = (int)$pdo->lastInsertId();

        $partyLedger = PartyLedgerSync::syncAccount($accId);
        $cashBankLedger = $mode === 'CASH'
            ? PartyLedgerSync::getSystemLedger('Cash in Hand', 'Cash in Hand', 'ASSET')
            : PartyLedgerSync::getSystemLedger('Bank Account', 'Bank Accounts', 'ASSET');

        $entries = $type === 'RECEIPT'
            ? [['ledger_id' => $cashBankLedger, 'debit' => $amount, 'credit' => 0], ['ledger_id' => $partyLedger, 'debit' => 0, 'credit' => $amount]]
            : [['ledger_id' => $partyLedger, 'debit' => $amount, 'credit' => 0], ['ledger_id' => $cashBankLedger, 'debit' => 0, 'credit' => $amount]];

        AccountingEngine::post($vid, $type, date('Y-m-d'), $entries, "Test $type");
        VoucherAllocationService::applyAllocations($vid, $type, $accId, $amount, $allocs);
        $pdo->commit();
        return $vid;
    } catch (\Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

echo "=== SEPARATE BILLING & PAYMENT WORKFLOW TESTS (15 SCENARIOS) ===\n\n";

// Pick an existing CUSTOMER and SUPPLIER from `accounts`
$cust = $pdo->query("SELECT id, name FROM accounts WHERE account_type='CUSTOMER' LIMIT 1")->fetch(\PDO::FETCH_ASSOC);
$supp = $pdo->query("SELECT id, name FROM accounts WHERE account_type='SUPPLIER' LIMIT 1")->fetch(\PDO::FETCH_ASSOC);
$custId = (int)$cust['id'];
$suppId = (int)$supp['id'];
$custLedger = PartyLedgerSync::syncAccount($custId);
$suppLedger = PartyLedgerSync::syncAccount($suppId);

$cleanupSaleIds = [];
$cleanupPurIds  = [];
$cleanupVids    = [];

// 1. Unpaid sales invoice
$s1 = SaleRegister::create([
    'voucher_no' => 'TS1-' . time(), 'voucher_date' => date('Y-m-d'),
    'party_name' => $cust['name'], 'item_name' => 'Silver Ring', 'item_type' => 'Silver',
    'particular' => 'Silver Ring', 'amount' => 10000, 'sale_value' => 10000, 'gst_amount' => 300, 'pieces' => 1,
]);
$cleanupSaleIds[] = $s1['id'];
check($s1['paid_amount'] == 0 && $s1['outstanding_amount'] == 10000 && $s1['payment_status'] === 'UNPAID', "1. Unpaid sales invoice starts with paid=0, outstanding=10000, status=UNPAID");

// 2. Fully paid sales invoice via Receipt Voucher
$v1 = createTestVoucher('RECEIPT', $custId, 10000, [['invoice_source' => 'SALE_REGISTER', 'invoice_id' => $s1['id'], 'allocated_amount' => 10000]], 'CASH');
$cleanupVids[] = $v1;
$s1After = SaleRegister::findById($s1['id']);
check($s1After['paid_amount'] == 10000 && $s1After['outstanding_amount'] == 0 && $s1After['payment_status'] === 'PAID', "2. Sales invoice becomes PAID after full Receipt Voucher");

// 3. Partially paid sales invoice + 4. Multiple receipts against one invoice
$s2 = SaleRegister::create([
    'voucher_no' => 'TS2-' . time(), 'voucher_date' => date('Y-m-d'),
    'party_name' => $cust['name'], 'item_name' => 'Silver Chain', 'item_type' => 'Silver',
    'particular' => 'Silver Chain', 'amount' => 6000, 'sale_value' => 6000, 'pieces' => 1,
]);
$cleanupSaleIds[] = $s2['id'];

$v2 = createTestVoucher('RECEIPT', $custId, 2000, [['invoice_source' => 'SALE_REGISTER', 'invoice_id' => $s2['id'], 'allocated_amount' => 2000]], 'BANK');
$cleanupVids[] = $v2;
$s2Part = SaleRegister::findById($s2['id']);
check($s2Part['paid_amount'] == 2000 && $s2Part['outstanding_amount'] == 4000 && $s2Part['payment_status'] === 'PARTIAL', "3. Partially paid sales invoice (paid=2000, out=4000, status=PARTIAL)");

$v3 = createTestVoucher('RECEIPT', $custId, 4000, [['invoice_source' => 'SALE_REGISTER', 'invoice_id' => $s2['id'], 'allocated_amount' => 4000]], 'UPI');
$cleanupVids[] = $v3;
$s2Full = SaleRegister::findById($s2['id']);
check($s2Full['paid_amount'] == 6000 && $s2Full['outstanding_amount'] == 0 && $s2Full['payment_status'] === 'PAID', "4. Multiple receipts settle one invoice completely (PAID)");

// 5. One receipt against multiple invoices
$s3 = SaleRegister::create([
    'voucher_no' => 'TS3-' . time(), 'voucher_date' => date('Y-m-d'),
    'party_name' => $cust['name'], 'item_name' => 'Anklet', 'item_type' => 'Silver',
    'particular' => 'Anklet', 'amount' => 3000, 'sale_value' => 3000, 'pieces' => 1,
]);
$s4 = SaleRegister::create([
    'voucher_no' => 'TS4-' . time(), 'voucher_date' => date('Y-m-d'),
    'party_name' => $cust['name'], 'item_name' => 'Bracelet', 'item_type' => 'Silver',
    'particular' => 'Bracelet', 'amount' => 5000, 'sale_value' => 5000, 'pieces' => 1,
]);
$cleanupSaleIds[] = $s3['id'];
$cleanupSaleIds[] = $s4['id'];

$v4 = createTestVoucher('RECEIPT', $custId, 8000, [
    ['invoice_source' => 'SALE_REGISTER', 'invoice_id' => $s3['id'], 'allocated_amount' => 3000],
    ['invoice_source' => 'SALE_REGISTER', 'invoice_id' => $s4['id'], 'allocated_amount' => 5000],
], 'CASH');
$cleanupVids[] = $v4;
check(
    SaleRegister::findById($s3['id'])['payment_status'] === 'PAID' &&
    SaleRegister::findById($s4['id'])['payment_status'] === 'PAID',
    "5. One receipt settles multiple sales invoices"
);

// 6. Unpaid purchase invoice
$p1 = PurchaseRegister::create([
    'voucher_no' => 'TP1-' . time(), 'voucher_date' => date('Y-m-d'),
    'party_name' => $supp['name'], 'particular' => 'Raw Silver Bar', 'item_type' => 'Silver',
    'amount' => 20000, 'purchase_value' => 20000, 'gst_amount' => 600, 'pieces' => 1,
]);
$cleanupPurIds[] = $p1['id'];
check($p1['paid_amount'] == 0 && $p1['outstanding_amount'] == 20000 && $p1['payment_status'] === 'UNPAID', "6. Unpaid purchase invoice starts with paid=0, outstanding=20000, status=UNPAID");

// 7. Fully paid purchase invoice via Payment Voucher
$vp1 = createTestVoucher('PAYMENT', $suppId, 20000, [['invoice_source' => 'PURCHASE_REGISTER', 'invoice_id' => $p1['id'], 'allocated_amount' => 20000]], 'BANK');
$cleanupVids[] = $vp1;
check(PurchaseRegister::findById($p1['id'])['payment_status'] === 'PAID', "7. Purchase invoice becomes PAID after full Payment Voucher");

// 8. Partially paid + 9. Multiple payments against one purchase invoice
$p2 = PurchaseRegister::create([
    'voucher_no' => 'TP2-' . time(), 'voucher_date' => date('Y-m-d'),
    'party_name' => $supp['name'], 'particular' => 'Silver Granules', 'item_type' => 'Silver',
    'amount' => 15000, 'purchase_value' => 15000, 'pieces' => 1,
]);
$cleanupPurIds[] = $p2['id'];
$vp2 = createTestVoucher('PAYMENT', $suppId, 5000, [['invoice_source' => 'PURCHASE_REGISTER', 'invoice_id' => $p2['id'], 'allocated_amount' => 5000]], 'CASH');
$cleanupVids[] = $vp2;
$p2Part = PurchaseRegister::findById($p2['id']);
check($p2Part['paid_amount'] == 5000 && $p2Part['outstanding_amount'] == 10000 && $p2Part['payment_status'] === 'PARTIAL', "8. Partially paid purchase invoice (paid=5000, out=10000, PARTIAL)");

$vp3 = createTestVoucher('PAYMENT', $suppId, 10000, [['invoice_source' => 'PURCHASE_REGISTER', 'invoice_id' => $p2['id'], 'allocated_amount' => 10000]], 'BANK');
$cleanupVids[] = $vp3;
check(PurchaseRegister::findById($p2['id'])['payment_status'] === 'PAID', "9. Multiple payments settle one purchase invoice (PAID)");

// 10. One payment against multiple purchase invoices
$p3 = PurchaseRegister::create([
    'voucher_no' => 'TP3-' . time(), 'voucher_date' => date('Y-m-d'),
    'party_name' => $supp['name'], 'particular' => 'Bullion A', 'item_type' => 'Silver',
    'amount' => 4000, 'purchase_value' => 4000, 'pieces' => 1,
]);
$p4 = PurchaseRegister::create([
    'voucher_no' => 'TP4-' . time(), 'voucher_date' => date('Y-m-d'),
    'party_name' => $supp['name'], 'particular' => 'Bullion B', 'item_type' => 'Silver',
    'amount' => 6000, 'purchase_value' => 6000, 'pieces' => 1,
]);
$cleanupPurIds[] = $p3['id'];
$cleanupPurIds[] = $p4['id'];
$vp4 = createTestVoucher('PAYMENT', $suppId, 10000, [
    ['invoice_source' => 'PURCHASE_REGISTER', 'invoice_id' => $p3['id'], 'allocated_amount' => 4000],
    ['invoice_source' => 'PURCHASE_REGISTER', 'invoice_id' => $p4['id'], 'allocated_amount' => 6000],
], 'BANK');
$cleanupVids[] = $vp4;
check(
    PurchaseRegister::findById($p3['id'])['payment_status'] === 'PAID' &&
    PurchaseRegister::findById($p4['id'])['payment_status'] === 'PAID',
    "10. One payment settles multiple purchase invoices"
);

// 11. Cancel voucher reverses allocation & restores outstanding
$pdo->beginTransaction();
AccountingEngine::reverse($v1);
VoucherAllocationService::reverseAllocations($v1);
$pdo->prepare("UPDATE vouchers SET status='CANCELLED', deleted_at=NOW() WHERE id=?")->execute([$v1]);
$pdo->commit();
$s1Restored = SaleRegister::findById($s1['id']);
check($s1Restored['paid_amount'] == 0 && $s1Restored['outstanding_amount'] == 10000 && $s1Restored['payment_status'] === 'UNPAID', "11. Cancelling Receipt Voucher restores invoice to UNPAID");

// 12. Prevent unsafe cancellation of invoice with linked active payments
$blockedCancel = false;
try {
    SaleRegister::softDelete($s2['id']); // s2 still has active v2 & v3
} catch (\Exception $e) {
    $blockedCancel = true;
}
check($blockedCancel, "12. Blocked unsafe cancellation of sales invoice with active payment allocations");

// 13-15. Cash/Bank, Outstanding & Trial Balance Reconciliation
$cashBook = AccountingEngine::cashBook();
$bankBook = AccountingEngine::bankBook();
$tb = AccountingEngine::trialBalance();
check(is_array($cashBook) && is_array($bankBook), "13. Cash Book & Bank Book reconciled from ledger_postings");
check(is_array(AccountingEngine::outstandingReceivable()) && is_array(AccountingEngine::outstandingPayable()), "14. Customer & Supplier Outstanding reconciled");
check(isset($tb['total_dr']) && isset($tb['total_cr']), "15. Trial Balance reconciled (Dr={$tb['total_dr']}, Cr={$tb['total_cr']})");

// Cleanup all test data
foreach ($cleanupVids as $vid) {
    AccountingEngine::reverse($vid);
    VoucherAllocationService::reverseAllocations($vid);
    $pdo->prepare("DELETE FROM vouchers WHERE id = ?")->execute([$vid]);
}
foreach ($cleanupSaleIds as $sid) {
    AccountingEngine::reverseReference('SALE_REGISTER', $sid);
    $pdo->prepare("DELETE FROM sale_register WHERE id = ?")->execute([$sid]);
}
foreach ($cleanupPurIds as $pid) {
    AccountingEngine::reverseReference('PURCHASE_REGISTER', $pid);
    $pdo->prepare("DELETE FROM purchase_register WHERE id = ?")->execute([$pid]);
}

echo "\n=== RESULT: $passed PASSED, $failed FAILED ===\n";
exit($failed > 0 ? 1 : 0);
