<?php
$base = 'http://localhost/Rudra-silver/backend/api';
function getApi($path) {
    global $base;
    $ch = curl_init($base . $path);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, json_decode($res, true), $res];
}

[$c, $g] = getApi('/age-wise/groups');
echo "GET /age-wise/groups => HTTP $c, count=" . count($g['items'] ?? $g['data'] ?? $g ?? []) . "\n";

[$c, $fo] = getApi('/age-wise/filter-options');
echo "GET /age-wise/filter-options => HTTP $c, cities=" . count($fo['cities'] ?? []) . ", locations=" . count($fo['locations'] ?? []) . ", ref_by=" . count($fo['ref_by'] ?? []) . "\n";

[$c, $r] = getApi('/age-wise/report?as_on_date=2026-11-26&interval=15&balance_type=silver&page=1&limit=10');
echo "GET /age-wise/report (15d silver) => HTTP $c, total=" . ($r['total'] ?? 'ERR') . ", labels=" . json_encode($r['bucket_labels'] ?? []) . "\n";

[$c, $r2] = getApi('/age-wise/report?as_on_date=2026-11-26&interval=10&balance_type=gold&group_ids=1,2&page=1&limit=10');
echo "GET /age-wise/report (10d gold, groups 1,2) => HTTP $c, total=" . ($r2['total'] ?? 'ERR') . ", labels=" . json_encode($r2['bucket_labels'] ?? []) . "\n";

[$c, $exp] = getApi('/age-wise/export?as_on_date=2026-11-26&interval=15&balance_type=silver');
echo "GET /age-wise/export => HTTP $c, rows=" . count($exp['items'] ?? []) . "\n";

$firstParty = $r['items'][0]['party_key'] ?? '';
if ($firstParty) {
    [$c, $led] = getApi('/age-wise/ledger?party_key=' . urlencode($firstParty) . '&as_on_date=2026-11-26');
    echo "GET /age-wise/ledger ($firstParty) => HTTP $c, found=" . ($led['found'] ? 'true' : 'false') . ", entries=" . count($led['entries'] ?? []) . "\n";
}
