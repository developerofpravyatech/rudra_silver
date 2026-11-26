<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

$pdo = \Config\Database::getConnection();
$base = 'http://localhost/Rudra-silver/backend/api';
$passed = 0;
$failed = 0;

function req($method, $url, $body = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, json_decode($raw, true), $raw];
}

function ok($cond, $msg) {
    global $passed, $failed;
    if ($cond) { $passed++; echo "  [PASS] $msg\n"; }
    else       { $failed++; echo "  [FAIL] $msg\n"; }
}

echo "=== KARIGAR INSERT & UPDATE HTTP + MYSQL TESTS ===\n\n";

$testCode = 'KARI-T' . rand(100, 999);

// 1. Insert Karigar with exact screenshot-style payload (karigar_code, karigar_name, mobile, alternate_mobile, narration)
[$c1, $r1, $raw1] = req('POST', "$base/karigar", [
    'karigar_code'     => $testCode,
    'karigar_name'     => 'regards',
    'mobile'           => '7894560232',
    'alternate_mobile' => '8950231456',
    'narration'        => 'ramesh@gmail.com',
    'state'            => 'Gujarat',
    'status'           => 'Active',
]);
ok($c1 === 201 && !empty($r1['success']) && ($r1['data']['karigar_name'] ?? '') === 'regards', "1. Insert Karigar with exact screenshot fields ($testCode / regards) -> HTTP $c1");
$createdId = (int)($r1['data']['id'] ?? 0);

// 2. Verify saved in MySQL
$dbRow = $pdo->prepare("SELECT id, account_code, name, mobile, phone, email, is_active FROM accounts WHERE id = ?");
$dbRow->execute([$createdId]);
$row = $dbRow->fetch(\PDO::FETCH_ASSOC);
ok($row && $row['account_code'] === $testCode && $row['name'] === 'regards' && $row['mobile'] === '7894560232' && $row['phone'] === '8950231456' && $row['email'] === 'ramesh@gmail.com', "2. MySQL record verified ($testCode, regards, 7894560232)");

// 3. Reject empty Karigar Name
[$c3, $r3] = req('POST', "$base/karigar", ['karigar_code' => 'KARI-EMP', 'karigar_name' => '']);
ok($c3 === 422 && stripos($r3['message'] ?? '', 'Karigar Name is required') !== false, "3. Empty Karigar Name rejected (HTTP $c3)");

// 4. Reject spaces-only Karigar Name
[$c4, $r4] = req('POST', "$base/karigar", ['karigar_code' => 'KARI-SPC', 'karigar_name' => '    ']);
ok($c4 === 422 && stripos($r4['message'] ?? '', 'Karigar Name is required') !== false, "4. Spaces-only Karigar Name rejected (HTTP $c4)");

// 5. Insert with optional fields empty
$testCode2 = 'KARI-O' . rand(100, 999);
[$c5, $r5] = req('POST', "$base/karigar", ['karigar_code' => $testCode2, 'karigar_name' => 'Optional Empty Test']);
ok($c5 === 201 && !empty($r5['success']), "5. Insert with optional fields empty succeeded (HTTP $c5)");
$createdId2 = (int)($r5['data']['id'] ?? 0);

// 6. Edit existing Karigar without changing name (update city only, preserve email/mobile)
[$c6, $r6] = req('PUT', "$base/karigar/$createdId", ['karigar_name' => 'regards', 'city' => 'Rajkot']);
ok($c6 === 200 && ($r6['data']['karigar_name'] ?? '') === 'regards' && ($r6['data']['city'] ?? '') === 'Rajkot' && ($r6['data']['narration'] ?? '') === 'ramesh@gmail.com', "6. Update city without changing name preserves existing fields");

// 7. Update Karigar Name
[$c7, $r7] = req('PUT', "$base/karigar/$createdId", ['karigar_name' => 'Ramesh Soni']);
ok($c7 === 200 && ($r7['data']['karigar_name'] ?? '') === 'Ramesh Soni', "7. Update Karigar Name to 'Ramesh Soni' succeeded");

// 8. Reject Update with empty Karigar Name
[$c8, $r8] = req('PUT', "$base/karigar/$createdId", ['karigar_name' => '   ']);
ok($c8 === 422 && stripos($r8['message'] ?? '', 'Karigar Name is required') !== false, "8. Update with empty/spaces Karigar Name rejected (HTTP $c8)");

// 9. Verify List & Karigar Reports endpoints still HTTP 200
[$c9a, $r9a] = req('GET', "$base/karigar?search=Ramesh+Soni");
$foundInList = !empty($r9a['data']['items']) && $r9a['data']['items'][0]['karigar_name'] === 'Ramesh Soni';
ok($c9a === 200 && $foundInList, "9. Karigar list returns updated 'Ramesh Soni'");

[$c9b] = req('GET', "$base/karigar-receive/outstanding");
[$c9c] = req('GET', "$base/karigar-issue");
ok($c9b === 200 && $c9c === 200, "10. Karigar Issue & Outstanding endpoints remain HTTP 200");

// Cleanup test karigars
if ($createdId) {
    $pdo->prepare("DELETE FROM ledger_postings WHERE ledger_id IN (SELECT id FROM ledgers WHERE account_ref_id = ?)")->execute([$createdId]);
    $pdo->prepare("DELETE FROM ledgers WHERE account_ref_id = ?")->execute([$createdId]);
    req('DELETE', "$base/karigar/$createdId");
}
if ($createdId2) {
    $pdo->prepare("DELETE FROM ledger_postings WHERE ledger_id IN (SELECT id FROM ledgers WHERE account_ref_id = ?)")->execute([$createdId2]);
    $pdo->prepare("DELETE FROM ledgers WHERE account_ref_id = ?")->execute([$createdId2]);
    req('DELETE', "$base/karigar/$createdId2");
}

echo "\n=== RESULT: $passed PASSED, $failed FAILED ===\n";
exit($failed > 0 ? 1 : 0);
