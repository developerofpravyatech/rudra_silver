-- ============================================================
-- KARIGAR MANAGEMENT MODULE - Migration
-- Rudra Silver ERP
-- ============================================================
-- NOTE: Karigar Master reuses existing `accounts` table
--       with account_type = 'KARIGAR' and group_id = 3 (Karigar group)
-- New tables: karigar_issues, karigar_issue_items,
--             karigar_receives, karigar_receive_items
-- ============================================================

-- Karigar Issue (Header)
CREATE TABLE IF NOT EXISTS `karigar_issues` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_no`      VARCHAR(30)     NOT NULL,
  `issue_date`      DATE            NOT NULL,
  `karigar_id`      INT UNSIGNED    NOT NULL COMMENT 'FK to accounts.id where account_type=KARIGAR',
  `karigar_name`    VARCHAR(120)    NOT NULL,
  `lot_no`          VARCHAR(50)     DEFAULT NULL,
  `narration`       TEXT            DEFAULT NULL,
  `remarks`         VARCHAR(255)    DEFAULT NULL,
  `total_gold_fine` DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `total_silver_fine` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_diamond_wt` DECIMAL(12,3)  NOT NULL DEFAULT 0.000,
  `total_stone_wt`  DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `total_amount`    DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  `status`          ENUM('OPEN','PARTIAL','CLOSED') NOT NULL DEFAULT 'OPEN',
  `deleted_at`      TIMESTAMP       DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_karigar_issue_voucher` (`voucher_no`),
  KEY `idx_ki_karigar_id` (`karigar_id`),
  KEY `idx_ki_issue_date` (`issue_date`),
  KEY `idx_ki_lot_no` (`lot_no`),
  KEY `idx_ki_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Karigar Issue Items (Line Items)
CREATE TABLE IF NOT EXISTS `karigar_issue_items` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `issue_id`        BIGINT UNSIGNED NOT NULL,
  `item_name`       VARCHAR(150)    NOT NULL,
  `item_type`       VARCHAR(60)     DEFAULT NULL,
  `metal_type`      ENUM('GOLD','SILVER','OTHER') NOT NULL DEFAULT 'SILVER',
  `purity`          DECIMAL(6,2)    NOT NULL DEFAULT 0.00 COMMENT 'Touch/Tunch percentage',
  `gross_weight`    DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `net_weight`      DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `diamond_weight`  DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `stone_weight`    DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `quantity`        INT UNSIGNED    NOT NULL DEFAULT 1,
  `fine_weight`     DECIMAL(12,3)   NOT NULL DEFAULT 0.000 COMMENT '(net_weight * purity)/100',
  `labour_rate`     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `labour_amount`   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `remarks`         VARCHAR(255)    DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kii_issue_id` (`issue_id`),
  CONSTRAINT `fk_kii_issue` FOREIGN KEY (`issue_id`) REFERENCES `karigar_issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Karigar Receive (Header)
CREATE TABLE IF NOT EXISTS `karigar_receives` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_no`      VARCHAR(30)     NOT NULL,
  `receive_date`    DATE            NOT NULL,
  `issue_id`        BIGINT UNSIGNED NOT NULL COMMENT 'FK to karigar_issues.id',
  `karigar_id`      INT UNSIGNED    NOT NULL,
  `karigar_name`    VARCHAR(120)    NOT NULL,
  `lot_no`          VARCHAR(50)     DEFAULT NULL,
  `narration`       TEXT            DEFAULT NULL,
  `remarks`         VARCHAR(255)    DEFAULT NULL,
  `total_gold_fine` DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `total_silver_fine` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `total_diamond_wt` DECIMAL(12,3)  NOT NULL DEFAULT 0.000,
  `total_stone_wt`  DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `total_amount`    DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  `deleted_at`      TIMESTAMP       DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_karigar_receive_voucher` (`voucher_no`),
  KEY `idx_kr_issue_id` (`issue_id`),
  KEY `idx_kr_karigar_id` (`karigar_id`),
  KEY `idx_kr_receive_date` (`receive_date`),
  KEY `idx_kr_deleted` (`deleted_at`),
  CONSTRAINT `fk_kr_issue` FOREIGN KEY (`issue_id`) REFERENCES `karigar_issues` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Karigar Receive Items (Line Items)
CREATE TABLE IF NOT EXISTS `karigar_receive_items` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `receive_id`      BIGINT UNSIGNED NOT NULL,
  `issue_item_id`   BIGINT UNSIGNED DEFAULT NULL COMMENT 'Optional FK to karigar_issue_items',
  `item_name`       VARCHAR(150)    NOT NULL,
  `item_type`       VARCHAR(60)     DEFAULT NULL,
  `metal_type`      ENUM('GOLD','SILVER','OTHER') NOT NULL DEFAULT 'SILVER',
  `purity`          DECIMAL(6,2)    NOT NULL DEFAULT 0.00,
  `gross_weight`    DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `net_weight`      DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `diamond_weight`  DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `stone_weight`    DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `quantity`        INT UNSIGNED    NOT NULL DEFAULT 1,
  `fine_weight`     DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `scrap_weight`    DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `dust_weight`     DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `loss_weight`     DECIMAL(12,3)   NOT NULL DEFAULT 0.000,
  `labour_rate`     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `labour_amount`   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `remarks`         VARCHAR(255)    DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kri_receive_id` (`receive_id`),
  CONSTRAINT `fk_kri_receive` FOREIGN KEY (`receive_id`) REFERENCES `karigar_receives` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SAMPLE DATA (10 Karigar accounts in accounts table)
-- ============================================================

-- Insert sample Karigar accounts (uses group_id=3 = Karigar group)
INSERT IGNORE INTO `accounts` (`account_code`, `group_id`, `name`, `account_type`, `mobile`, `city`, `state`, `balance_inr`, `balance_fine_gold`, `balance_fine_silver`, `is_active`)
VALUES
  ('KARI-003', 3, 'Ramesh Soni Karigar',      'KARIGAR', '9876543210', 'Rajkot',    'Gujarat', 0.00,    0.000, 0.000, 1),
  ('KARI-004', 3, 'Suresh Metalworks',         'KARIGAR', '9876543211', 'Ahmedabad', 'Gujarat', 2000.00, 0.000, 50.000,1),
  ('KARI-005', 3, 'Dinesh Jewellery Artisan',  'KARIGAR', '9876543212', 'Surat',     'Gujarat', 0.00,    0.000, 20.500,1),
  ('KARI-006', 3, 'Prakash Silver Works',      'KARIGAR', '9876543213', 'Rajkot',    'Gujarat', 1500.00, 0.000, 0.000, 1),
  ('KARI-007', 3, 'Haresh Craftsman',          'KARIGAR', '9876543214', 'Jamnagar',  'Gujarat', 0.00,    0.000, 35.200,1),
  ('KARI-008', 3, 'Naresh Artisan Workshop',   'KARIGAR', '9876543215', 'Rajkot',    'Gujarat', 3000.00, 0.000, 0.000, 1),
  ('KARI-009', 3, 'Bhavesh Silver Art',        'KARIGAR', '9876543216', 'Vadodara',  'Gujarat', 0.00,    0.000, 15.750,1),
  ('KARI-010', 3, 'Paresh Jeweller Karigar',   'KARIGAR', '9876543217', 'Rajkot',    'Gujarat', 0.00,    0.000, 0.000, 1);

-- Sample karigar_issues
INSERT IGNORE INTO `karigar_issues` (`voucher_no`, `issue_date`, `karigar_id`, `karigar_name`, `lot_no`, `narration`, `total_silver_fine`, `total_amount`, `status`)
SELECT 'KI-2026-001', '2026-11-01', a.id, a.name, 'LOT-001', 'Payal batch issue', 185.400, 0.00, 'OPEN'
FROM accounts a WHERE a.account_code='KARI-001' LIMIT 1;

INSERT IGNORE INTO `karigar_issues` (`voucher_no`, `issue_date`, `karigar_id`, `karigar_name`, `lot_no`, `narration`, `total_silver_fine`, `total_amount`, `status`)
SELECT 'KI-2026-002', '2026-11-10', a.id, a.name, 'LOT-002', 'Mangalsutra batch', 92.150, 0.00, 'CLOSED'
FROM accounts a WHERE a.account_code='KARI-002' LIMIT 1;

-- Sample issue items for KI-2026-001
INSERT IGNORE INTO `karigar_issue_items` (`issue_id`, `item_name`, `item_type`, `metal_type`, `purity`, `gross_weight`, `net_weight`, `quantity`, `fine_weight`)
SELECT ki.id, 'Silver Payal', 'Payal', 'SILVER', 92.50, 200.000, 200.000, 10, 185.000
FROM karigar_issues ki WHERE ki.voucher_no='KI-2026-001' LIMIT 1;

-- Sample karigar receive
INSERT IGNORE INTO `karigar_receives` (`voucher_no`, `receive_date`, `issue_id`, `karigar_id`, `karigar_name`, `lot_no`, `narration`, `total_silver_fine`, `total_amount`)
SELECT 'KR-2026-001', '2026-11-20', ki.id, ki.karigar_id, ki.karigar_name, ki.lot_no, 'Payal batch received', 180.000, 0.00
FROM karigar_issues ki WHERE ki.voucher_no='KI-2026-002' LIMIT 1;
