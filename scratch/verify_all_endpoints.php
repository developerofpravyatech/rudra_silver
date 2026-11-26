<?php
function testGet($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, json_decode($res, true)];
}

echo "=== 1. Testing Purchase Register Summary Endpoint ===\n";
[$c1, $d1] = testGet('http://localhost/Rudra-silver/backend/api/purchase-register/summary');
echo "HTTP {$c1}: Total Records: {$d1['total_records']}, Net Purchase Value: {$d1['net_purchase_value']}, Avg Rate: {$d1['avg_rate']}, Total Amount: {$d1['total_amount']}\n";

echo "=== 2. Testing Sale Register Summary Endpoint ===\n";
[$c2, $d2] = testGet('http://localhost/Rudra-silver/backend/api/sale-register/summary');
echo "HTTP {$c2}: Total Records: {$d2['total_records']}, Net Sale Value: {$d2['net_sale_value']}, Avg Rate: {$d2['avg_rate']}, Sold Items: {$d2['total_sold_items']}, Total Amount: {$d2['total_amount']}\n";

echo "=== 3. Testing Purchase Register Filtered Summary ===\n";
[$c3, $d3] = testGet('http://localhost/Rudra-silver/backend/api/purchase-register/summary?party_name=' . urlencode('Rajesh Silver Art'));
echo "HTTP {$c3}: Filtered Purchase Records: {$d3['total_records']}, Net Value: {$d3['net_purchase_value']}\n";

echo "=== 4. Testing Sale Register Filtered Summary ===\n";
[$c4, $d4] = testGet('http://localhost/Rudra-silver/backend/api/sale-register/summary?party_name=' . urlencode('Aarti Jewellers'));
echo "HTTP {$c4}: Filtered Sale Records: {$d4['total_records']}, Net Value: {$d4['net_sale_value']}\n";

echo "=== 5. Testing Silver Bullion Date Normalization (DD-MM-YYYY) ===\n";
[$c5, $d5] = testGet('http://localhost/Rudra-silver/backend/api/silver-bullion?from_date=01-11-2026&to_date=24-11-2026');
echo "HTTP {$c5}: Silver Bullion items found: " . count($d5['items'] ?? []) . ", Total: {$d5['total']}\n";
