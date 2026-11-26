<?php
function testGet($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, json_decode($res, true)];
}

echo "=== 1. Test HTTP GET /api/customer-profit-report (detailed) ===\n";
[$c1, $d1] = testGet('http://localhost/Rudra-silver/backend/api/customer-profit-report?report_type=detailed');
echo "HTTP {$c1}: Total customers: " . count($d1['items'] ?? []) . "\n";

echo "=== 2. Test HTTP GET /api/customer-profit-report/summary ===\n";
[$c2, $d2] = testGet('http://localhost/Rudra-silver/backend/api/customer-profit-report/summary');
echo "HTTP {$c2}: Total Profit in Amount: {$d2['profit_in_amount']}, Gold Wt: {$d2['gold_weight']}, Silver Wt: {$d2['silver_weight']}\n";

echo "=== 3. Test HTTP GET /api/customer-profit-report/filter-options ===\n";
[$c3, $d3] = testGet('http://localhost/Rudra-silver/backend/api/customer-profit-report/filter-options');
echo "HTTP {$c3}: Cities: " . count($d3['cities'] ?? []) . ", Groups: " . count($d3['groups'] ?? []) . ", Sites: " . count($d3['sites'] ?? []) . "\n";
