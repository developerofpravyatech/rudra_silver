<?php
$pdo = new PDO('mysql:host=localhost;dbname=rudra_silver', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Disable strict mode for session to allow TIMESTAMP NULL defaults
$pdo->exec("SET SESSION sql_mode = ''");

$statements = [

"CREATE TABLE IF NOT EXISTS `karigar_issues` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_no`      VARCHAR(30)     NOT NULL,
  `issue_date`      DATE            NOT NULL,
  `karigar_id`      INT UNSIGNED    NOT NULL,
  `karigar_name`    VARCHAR(120)    NOT NULL,
  `lot_no`          VARCHAR(50)     DEFAULT NULL,
  `narration`       TEXT            DEFAULT NULL,
  `remarks`         VARCHAR(255)    DEFAULT NULL,
  `total_gold_fine`   DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_silver_fine` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_diamond_wt`  DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_stone_wt`    DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_amount`      DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status`          ENUM('OPEN','PARTIAL','CLOSED') NOT NULL DEFAULT 'OPEN',
  `deleted_at`      DATETIME        DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_karigar_issue_voucher` (`voucher_no`),
  KEY `idx_ki_karigar_id` (`karigar_id`),
  KEY `idx_ki_issue_date` (`issue_date`),
  KEY `idx_ki_lot_no` (`lot_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"CREATE TABLE IF NOT EXISTS `karigar_issue_items` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `issue_id`       BIGINT UNSIGNED NOT NULL,
  `item_name`      VARCHAR(150)    NOT NULL,
  `item_type`      VARCHAR(60)     DEFAULT NULL,
  `metal_type`     ENUM('GOLD','SILVER','OTHER') NOT NULL DEFAULT 'SILVER',
  `purity`         DECIMAL(6,2)    NOT NULL DEFAULT 0.00,
  `gross_weight`   DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `net_weight`     DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `diamond_weight` DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `stone_weight`   DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `quantity`       INT UNSIGNED    NOT NULL DEFAULT 1,
  `fine_weight`    DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `labour_rate`    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `labour_amount`  DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `remarks`        VARCHAR(255)    DEFAULT NULL,
  `created_at`     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kii_issue_id` (`issue_id`),
  CONSTRAINT `fk_kii_issue` FOREIGN KEY (`issue_id`) REFERENCES `karigar_issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"CREATE TABLE IF NOT EXISTS `karigar_receives` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_no`      VARCHAR(30)     NOT NULL,
  `receive_date`    DATE            NOT NULL,
  `issue_id`        BIGINT UNSIGNED NOT NULL,
  `karigar_id`      INT UNSIGNED    NOT NULL,
  `karigar_name`    VARCHAR(120)    NOT NULL,
  `lot_no`          VARCHAR(50)     DEFAULT NULL,
  `narration`       TEXT            DEFAULT NULL,
  `remarks`         VARCHAR(255)    DEFAULT NULL,
  `total_gold_fine`   DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_silver_fine` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_diamond_wt`  DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_stone_wt`    DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_amount`      DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `deleted_at`      DATETIME        DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_karigar_receive_voucher` (`voucher_no`),
  KEY `idx_kr_issue_id` (`issue_id`),
  KEY `idx_kr_karigar_id` (`karigar_id`),
  KEY `idx_kr_receive_date` (`receive_date`),
  CONSTRAINT `fk_kr_issue` FOREIGN KEY (`issue_id`) REFERENCES `karigar_issues` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"CREATE TABLE IF NOT EXISTS `karigar_receive_items` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `receive_id`     BIGINT UNSIGNED NOT NULL,
  `issue_item_id`  BIGINT UNSIGNED DEFAULT NULL,
  `item_name`      VARCHAR(150)    NOT NULL,
  `item_type`      VARCHAR(60)     DEFAULT NULL,
  `metal_type`     ENUM('GOLD','SILVER','OTHER') NOT NULL DEFAULT 'SILVER',
  `purity`         DECIMAL(6,2)    NOT NULL DEFAULT 0.00,
  `gross_weight`   DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `net_weight`     DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `diamond_weight` DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `stone_weight`   DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `quantity`       INT UNSIGNED    NOT NULL DEFAULT 1,
  `fine_weight`    DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `scrap_weight`   DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `dust_weight`    DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `loss_weight`    DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `labour_rate`    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `labour_amount`  DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `remarks`        VARCHAR(255)    DEFAULT NULL,
  `created_at`     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kri_receive_id` (`receive_id`),
  CONSTRAINT `fk_kri_receive` FOREIGN KEY (`receive_id`) REFERENCES `karigar_receives` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"INSERT IGNORE INTO `accounts` (`account_code`, `group_id`, `name`, `account_type`, `mobile`, `city`, `state`, `balance_inr`, `balance_fine_gold`, `balance_fine_silver`, `is_active`)
VALUES
  ('KARI-003', 3, 'Ramesh Soni Karigar',      'KARIGAR', '9876543210', 'Rajkot',    'Gujarat', 0.00,    0.000, 0.000, 1),
  ('KARI-004', 3, 'Suresh Metalworks',         'KARIGAR', '9876543211', 'Ahmedabad', 'Gujarat', 2000.00, 0.000, 50.000,1),
  ('KARI-005', 3, 'Dinesh Jewellery Artisan',  'KARIGAR', '9876543212', 'Surat',     'Gujarat', 0.00,    0.000, 20.500,1),
  ('KARI-006', 3, 'Prakash Silver Works',      'KARIGAR', '9876543213', 'Rajkot',    'Gujarat', 1500.00, 0.000, 0.000, 1),
  ('KARI-007', 3, 'Haresh Craftsman',          'KARIGAR', '9876543214', 'Jamnagar',  'Gujarat', 0.00,    0.000, 35.200,1),
  ('KARI-008', 3, 'Naresh Artisan Workshop',   'KARIGAR', '9876543215', 'Rajkot',    'Gujarat', 3000.00, 0.000, 0.000, 1),
  ('KARI-009', 3, 'Bhavesh Silver Art',        'KARIGAR', '9876543216', 'Vadodara',  'Gujarat', 0.00,    0.000, 15.750,1),
  ('KARI-010', 3, 'Paresh Jeweller Karigar',   'KARIGAR', '9876543217', 'Rajkot',    'Gujarat', 0.00,    0.000, 0.000, 1)",
];

$ok = 0; $err = 0;
foreach ($statements as $i => $stmt) {
    try {
        $pdo->exec($stmt);
        echo "OK[$i]: " . substr(trim($stmt), 0, 70) . PHP_EOL;
        $ok++;
    } catch (Exception $e) {
        echo "ERR[$i]: " . $e->getMessage() . PHP_EOL;
        $err++;
    }
}

// Sample issues
try {
    $kar1 = $pdo->query("SELECT id FROM accounts WHERE account_code='KARI-001'")->fetchColumn();
    $kar2 = $pdo->query("SELECT id FROM accounts WHERE account_code='KARI-002'")->fetchColumn();

    if ($kar1) {
        $existing = $pdo->query("SELECT id FROM karigar_issues WHERE voucher_no='KI-2026-001'")->fetchColumn();
        if (!$existing) {
            $pdo->exec("INSERT INTO karigar_issues (voucher_no,issue_date,karigar_id,karigar_name,lot_no,narration,total_silver_fine,status)
                VALUES ('KI-2026-001','2026-11-01',$kar1,'Babubhai Payalwala','LOT-001','Payal batch issue',185.400,'OPEN')");
            $issueid = $pdo->lastInsertId();
            $pdo->exec("INSERT INTO karigar_issue_items (issue_id,item_name,item_type,metal_type,purity,gross_weight,net_weight,quantity,fine_weight)
                VALUES ($issueid,'Silver Payal','Payal','SILVER',92.50,200.000,200.000,10,185.000)");
            echo "Issue KI-2026-001 + items created" . PHP_EOL;
        }
    }
    if ($kar2) {
        $existing = $pdo->query("SELECT id FROM karigar_issues WHERE voucher_no='KI-2026-002'")->fetchColumn();
        if (!$existing) {
            $pdo->exec("INSERT INTO karigar_issues (voucher_no,issue_date,karigar_id,karigar_name,lot_no,narration,total_silver_fine,status)
                VALUES ('KI-2026-002','2026-11-10',$kar2,'Mansukh Art Jewellers','LOT-002','Mangalsutra batch',92.150,'PARTIAL')");
            $issueid2 = $pdo->lastInsertId();
            $pdo->exec("INSERT INTO karigar_issue_items (issue_id,item_name,item_type,metal_type,purity,gross_weight,net_weight,quantity,fine_weight)
                VALUES ($issueid2,'Silver Mangalsutra','Mangalsutra','SILVER',99.90,100.000,92.000,3,91.908)");
            $pdo->exec("INSERT INTO karigar_receives (voucher_no,receive_date,issue_id,karigar_id,karigar_name,lot_no,narration,total_silver_fine)
                VALUES ('KR-2026-001','2026-11-20',$issueid2,$kar2,'Mansukh Art Jewellers','LOT-002','Received finished goods',90.000)");
            $recid = $pdo->lastInsertId();
            $pdo->exec("INSERT INTO karigar_receive_items (receive_id,item_name,item_type,metal_type,purity,gross_weight,net_weight,quantity,fine_weight,loss_weight)
                VALUES ($recid,'Silver Mangalsutra','Mangalsutra','SILVER',99.90,91.000,91.000,3,90.909,1.000)");
            echo "Issue KI-2026-002 + Receive KR-2026-001 created" . PHP_EOL;
        }
    }
} catch (Exception $e) {
    echo "SAMPLE DATA ERR: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL . "TOTAL OK=$ok ERR=$err" . PHP_EOL;
foreach (['karigar_issues','karigar_issue_items','karigar_receives','karigar_receive_items'] as $t) {
    $cnt = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
    echo "TABLE $t: $cnt rows" . PHP_EOL;
}
$kc = $pdo->query("SELECT COUNT(*) FROM accounts WHERE account_type='KARIGAR'")->fetchColumn();
echo "KARIGAR accounts total: $kc" . PHP_EOL;
