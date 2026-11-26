<?php
$base = 'http://localhost/Rudra-silver/backend/api';

function callApi($method, $path, $data = null) {
    global $base;
    $ch = curl_init($base . $path);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, json_decode($res, true), $res];
}

// 1. Karigar Master List + Next Code + Filter Options
[$c, $j] = callApi('GET', '/karigar?page=1&limit=10');
echo "GET /karigar => HTTP $c, total=" . ($j['data']['total'] ?? 'ERR') . "\n";

[$c, $j] = callApi('GET', '/karigar/next-code');
echo "GET /karigar/next-code => HTTP $c, code=" . ($j['data']['code'] ?? 'ERR') . "\n";

[$c, $j] = callApi('GET', '/karigar/filter-options');
echo "GET /karigar/filter-options => HTTP $c, cities=" . count($j['data']['cities'] ?? []) . "\n";

// 2. Karigar Create -> Update -> Toggle -> Delete
$testCode = 'KARI-TEST-' . rand(100,999);
[$c, $j, $raw] = callApi('POST', '/karigar', [
    'account_code' => $testCode,
    'name' => 'HTTP Test Karigar',
    'mobile' => '9998887776',
    'city' => 'Rajkot',
    'balance_fine_silver' => 10.5,
]);
echo "POST /karigar => HTTP $c, id=" . ($j['data']['id'] ?? $raw) . "\n";
$newKarId = $j['data']['id'] ?? 0;

if ($newKarId) {
    [$c, $j] = callApi('PUT', "/karigar/$newKarId", ['city' => 'Surat']);
    echo "PUT /karigar/$newKarId => HTTP $c, city=" . ($j['data']['city'] ?? 'ERR') . "\n";

    [$c, $j] = callApi('PATCH', "/karigar/$newKarId/toggle-status");
    echo "PATCH /karigar/$newKarId/toggle-status => HTTP $c, active=" . ($j['data']['is_active'] ?? 'ERR') . "\n";
}

// 3. Karigar Issue List + Create + Update + Receive + Delete
[$c, $j] = callApi('GET', '/karigar-issue');
echo "GET /karigar-issue => HTTP $c, total=" . ($j['data']['total'] ?? 'ERR') . "\n";

$issId = 0;
if ($newKarId) {
    [$c, $j, $raw] = callApi('POST', '/karigar-issue', [
        'issue_date' => '2026-11-26',
        'karigar_id' => $newKarId,
        'karigar_name' => 'HTTP Test Karigar',
        'lot_no' => 'LOT-TEST-99',
        'items' => [[
            'item_name' => 'Test Ring',
            'item_type' => 'Ring',
            'metal_type' => 'SILVER',
            'purity' => 92.5,
            'gross_weight' => 50,
            'net_weight' => 48,
            'diamond_weight' => 0.5,
            'stone_weight' => 1.5,
            'quantity' => 5,
            'labour_rate' => 20,
        ]],
    ]);
    echo "POST /karigar-issue => HTTP $c, voucher=" . ($j['data']['voucher_no'] ?? $raw) . "\n";
    $issId = $j['data']['id'] ?? 0;
}

$recId = 0;
if ($issId) {
    [$c, $j, $raw] = callApi('POST', '/karigar-receive', [
        'receive_date' => '2026-11-26',
        'issue_id' => $issId,
        'karigar_id' => $newKarId,
        'karigar_name' => 'HTTP Test Karigar',
        'lot_no' => 'LOT-TEST-99',
        'items' => [[
            'item_name' => 'Test Ring',
            'item_type' => 'Ring',
            'metal_type' => 'SILVER',
            'purity' => 92.5,
            'gross_weight' => 45,
            'net_weight' => 44,
            'diamond_weight' => 0.4,
            'stone_weight' => 1.2,
            'quantity' => 5,
            'labour_rate' => 20,
        ]],
    ]);
    echo "POST /karigar-receive => HTTP $c, voucher=" . ($j['data']['voucher_no'] ?? $raw) . "\n";
    $recId = $j['data']['id'] ?? 0;
}

// 4. All 6 Reports
foreach (['outstanding', 'issue-rec-report', 'lot-report', 'dia-stn-balance', 'dia-stn-group-bal', 'dia-stn-issue-rec'] as $ep) {
    [$c, $j, $raw] = callApi('GET', "/karigar-receive/$ep");
    echo "GET /karigar-receive/$ep => HTTP $c, rows=" . (is_array($j['data'] ?? null) ? count($j['data']) : $raw) . "\n";
}

// 5. Cleanup test records
if ($recId) { [$c] = callApi('DELETE', "/karigar-receive/$recId"); echo "DELETE /karigar-receive/$recId => HTTP $c\n"; }
if ($issId) { [$c] = callApi('DELETE', "/karigar-issue/$issId"); echo "DELETE /karigar-issue/$issId => HTTP $c\n"; }
if ($newKarId) { [$c] = callApi('DELETE', "/karigar/$newKarId"); echo "DELETE /karigar/$newKarId => HTTP $c\n"; }
