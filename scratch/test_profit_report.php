<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
require_once __DIR__ . '/../backend/models/CustomerProfitReport.php';

use Models\CustomerProfitReport;

echo "=== 1. FILTER OPTIONS ===\n";
$opts = CustomerProfitReport::filterOptions();
print_r($opts);

echo "\n=== 2. DETAILED REPORT (Customer-Wise) ===\n";
$detailed = CustomerProfitReport::paginate([], 'account_name', 'asc', 1, 20, 'detailed');
print_r($detailed);

echo "\n=== 3. VOUCHER WISE REPORT (Transaction-Level) ===\n";
$voucherWise = CustomerProfitReport::paginate([], 'voucher_date', 'asc', 1, 20, 'voucher_wise');
print_r($voucherWise);

echo "\n=== 4. BOTTOM SUMMARY (ALL matching records) ===\n";
$summary = CustomerProfitReport::getSummary([]);
print_r($summary);

echo "\n=== 5. FILTERED BY SITE ('Rajkot Main') ===\n";
$filtered = CustomerProfitReport::paginate(['site' => 'Rajkot Main'], 'account_name', 'asc', 1, 20, 'detailed');
print_r($filtered);
