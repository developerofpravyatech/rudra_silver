<?php
$base = 'http://localhost/Rudra-silver/backend/api';
$passed = 0; $failed = 0;

function req($m, $url, $body = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $m);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, json_decode($raw, true)];
}

function ok($cond, $msg) {
    global $passed, $failed;
    if ($cond) { $passed++; echo "  [PASS] $msg\n"; }
    else       { $failed++; echo "  [FAIL] $msg\n"; }
}

echo "=== GLOBAL REQUIRED FIELD VALIDATION BACKEND TESTS ===\n\n";

// Account Group: spaces-only name rejected
[$c, $r] = req('POST', "$base/account-groups", ['name' => '   ', 'nature' => 'ASSET']);
ok($c === 422 && !empty($r['errors']['name']), "Account Group rejects spaces-only name (HTTP $c)");

// Ledger: spaces-only name & invalid mobile rejected
[$c, $r] = req('POST', "$base/ledger", ['ledger_name' => '  ', 'group_id' => 1, 'mobile' => '123']);
ok($c === 422 && !empty($r['errors']['ledger_name']) && !empty($r['errors']['mobile']), "Ledger rejects spaces-only name and invalid mobile (HTTP $c)");

// Karigar: spaces-only name rejected
[$c, $r] = req('POST', "$base/karigar", ['karigar_code' => 'K-999', 'karigar_name' => '   ']);
ok($c === 422 && stripos($r['message'] ?? '', 'Karigar Name is required') !== false, "Karigar rejects spaces-only name (HTTP $c)");

// Accounting Voucher: zero amount rejected
[$c, $r] = req('POST', "$base/accounting-vouchers", ['voucher_type' => 'RECEIPT', 'account_id' => 1, 'amount' => 0]);
ok($c === 422, "Accounting Voucher rejects zero amount (HTTP $c)");

// Sale Return: missing party/item rejected
[$c, $r] = req('POST', "$base/sale-returns", ['party_name' => '', 'item_name' => '', 'return_amount' => 100]);
ok($c === 422, "Sale Return rejects missing party/item (HTTP $c)");

// Purchase Return: zero amount rejected
[$c, $r] = req('POST', "$base/purchase-returns", ['party_name' => 'Supplier', 'item_name' => 'Bar', 'return_amount' => 0]);
ok($c === 422, "Purchase Return rejects zero amount (HTTP $c)");

echo "\n=== RESULT: $passed PASSED, $failed FAILED ===\n";
exit($failed > 0 ? 1 : 0);
