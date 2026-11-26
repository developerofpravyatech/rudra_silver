<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';
\Config\Config::load(__DIR__ . '/../.env');

$db = Config\Database::getConnection();

echo "--- CREATING DAILY_TRANSACTIONS TABLE ---\n";

$sql = "
CREATE TABLE IF NOT EXISTS daily_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    party_name VARCHAR(200) NOT NULL,
    party_id BIGINT UNSIGNED NULL DEFAULT NULL,
    ref_no VARCHAR(100) NULL DEFAULT NULL,
    narration TEXT NULL DEFAULT NULL,
    login_name VARCHAR(100) NULL DEFAULT 'Admin',
    stamp VARCHAR(50) NULL DEFAULT '92.5',
    voucher_type VARCHAR(50) NULL DEFAULT 'Regular',
    account_id INT UNSIGNED NULL DEFAULT NULL,
    series VARCHAR(50) NULL DEFAULT 'GST',
    site VARCHAR(100) NULL DEFAULT 'Main Store',
    group_name VARCHAR(100) NULL DEFAULT 'Sundry Debtors',
    pc INT NOT NULL DEFAULT 1,
    gross_weight DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    net_weight DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    dia_weight DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    stone_weight DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    gold_fine DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    silver_fine DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_undelivered TINYINT(1) NOT NULL DEFAULT 0,
    student_details VARCHAR(255) NULL DEFAULT NULL,
    created_by VARCHAR(100) NULL DEFAULT 'Admin',
    updated_by VARCHAR(100) NULL DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (transaction_date),
    INDEX idx_party (party_name),
    INDEX idx_type (transaction_type),
    INDEX idx_vtype (voucher_type),
    INDEX idx_series (series),
    INDEX idx_group (group_name),
    INDEX idx_undelivered (is_undelivered)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

$db->exec($sql);
echo "✓ Table daily_transactions created / verified.\n";

// Check if records exist
$count = (int)$db->query("SELECT COUNT(*) FROM daily_transactions")->fetchColumn();
echo "Current daily_transactions count: {$count}\n";

if ($count === 0) {
    echo "--- SEEDING 40 REALISTIC TRANSACTIONS ---\n";
    $types = ['Sale', 'Purchase', 'Receipt', 'Payment', 'Issue', 'Receive', 'Journal', 'Contra'];
    $parties = [
        'Manshukh Bhai Rathod', 'Radha Jewellers', 'Shreeji Silver Art',
        'Ambika Ornaments', 'Kalyan Bullion', 'Ratan Silver Works',
        'Vijay Silver Mart', 'Gopi Ornaments', 'Jay Ambe Jewellers',
        'Bhavani Silver Crafts', 'Royal Silver Palace', 'Laxmi Jewellers'
    ];
    $vTypes = ['Regular', 'Tax Invoice', 'Estimate', 'Delivery Challan', 'Cash Memo'];
    $seriesList = ['GST', 'BILL', 'RET', 'CHL'];
    $sites = ['Main Store', 'Vault', 'Workshop', 'Counter 1'];
    $groups = ['Sundry Debtors', 'Sundry Creditors', 'Karigar Group', 'Bullion Dealers'];
    $stamps = ['92.5', '99.9', '80.0', '70.0'];
    $logins = ['Admin', 'Operator 1', 'Accountant', 'Manager'];

    $insertStmt = $db->prepare("
        INSERT INTO daily_transactions (
            transaction_date, transaction_type, party_name, ref_no, narration,
            login_name, stamp, voucher_type, series, site, group_name,
            pc, gross_weight, net_weight, dia_weight, stone_weight,
            gold_fine, silver_fine, total_amount, is_undelivered, student_details,
            created_by, updated_by
        ) VALUES (
            :transaction_date, :transaction_type, :party_name, :ref_no, :narration,
            :login_name, :stamp, :voucher_type, :series, :site, :group_name,
            :pc, :gross_weight, :net_weight, :dia_weight, :stone_weight,
            :gold_fine, :silver_fine, :total_amount, :is_undelivered, :student_details,
            :created_by, :updated_by
        )
    ");

    for ($i = 1; $i <= 42; $i++) {
        $daysAgo = rand(0, 30);
        $tDate = date('Y-m-d', strtotime("-{$daysAgo} days"));
        $tType = $types[array_rand($types)];
        $party = $parties[array_rand($parties)];
        $vType = $vTypes[array_rand($vTypes)];
        $series = $seriesList[array_rand($seriesList)];
        $site = $sites[array_rand($sites)];
        $grp = $groups[array_rand($groups)];
        $stamp = $stamps[array_rand($stamps)];
        $login = $logins[array_rand($logins)];

        $pc = rand(1, 15);
        $grWt = round(rand(50, 2500) + (rand(1, 999) / 1000), 3);
        $stnWt = (rand(1, 10) > 6) ? round(rand(2, 45) + (rand(1, 999) / 1000), 3) : 0.000;
        $diaWt = (rand(1, 10) > 7) ? round(rand(1, 15) + (rand(1, 999) / 1000), 3) : 0.000;
        $netWt = round(max(0, $grWt - $stnWt), 3);

        $isGold = (rand(1, 10) > 8);
        $goldFine = $isGold ? round($netWt * 0.916, 3) : 0.000;
        $silverFine = !$isGold ? round($netWt * 0.925, 3) : 0.000;

        $rate = $isGold ? 7800 : 95;
        $baseAmt = round(($goldFine ?: $silverFine) * $rate, 2);
        $isNegative = in_array($tType, ['Payment', 'Purchase']);
        $totalAmount = $isNegative ? -abs($baseAmt) : abs($baseAmt);

        $isUndelivered = (rand(1, 10) > 7) ? 1 : 0;
        $studentDetails = ($isUndelivered) ? 'Design Batch 2026 / Hallmarking Apprentice' : null;

        $insertStmt->execute([
            ':transaction_date' => $tDate,
            ':transaction_type' => $tType,
            ':party_name'       => $party,
            ':ref_no'           => sprintf("%s-%04d", $series, $i + 1000),
            ':narration'        => "{$tType} entry for {$party} - {$pc} item(s)",
            ':login_name'       => $login,
            ':stamp'            => $stamp,
            ':voucher_type'     => $vType,
            ':series'           => $series,
            ':site'             => $site,
            ':group_name'       => $grp,
            ':pc'               => $pc,
            ':gross_weight'     => $grWt,
            ':net_weight'       => $netWt,
            ':dia_weight'       => $diaWt,
            ':stone_weight'     => $stnWt,
            ':gold_fine'        => $goldFine,
            ':silver_fine'      => $silverFine,
            ':total_amount'     => $totalAmount,
            ':is_undelivered'   => $isUndelivered,
            ':student_details'  => $studentDetails,
            ':created_by'       => $login,
            ':updated_by'       => $login,
        ]);
    }
    echo "✓ 42 realistic daily transaction records seeded successfully.\n";
}
