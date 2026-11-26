<?php
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';
require_once __DIR__ . '/../backend/models/SilverBullion.php';

\Config\Config::load(__DIR__ . '/../backend/.env');

$filters = [
    'from_date' => '2026-11-01',
    'to_date' => '2026-11-24',
];

$res = \Models\SilverBullion::paginate($filters, 'transaction_date', 'desc', 1, 10);
echo "Total: " . $res['total'] . "\n";
echo "Items count: " . count($res['items']) . "\n";
print_r($res);
