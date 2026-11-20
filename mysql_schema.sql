-- =====================================================================
-- RUDRA SILVER - NEXT-GEN JEWELLERY ERP DATABASE SCHEMA (MySQL 8.0+)
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

DROP DATABASE IF EXISTS `rudra_jewellery_erp`;
CREATE DATABASE `rudra_jewellery_erp` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `rudra_jewellery_erp`;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. ORGANIZATION, BRANCHES & COUNTERS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(50) DEFAULT NULL,
  `state` VARCHAR(50) DEFAULT 'Gujarat',
  `pincode` VARCHAR(10) DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `gstin` VARCHAR(20) DEFAULT NULL,
  `pan_no` VARCHAR(15) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `counters`;
CREATE TABLE `counters` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `branch_id` INT UNSIGNED NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(100) NOT NULL, -- e.g. "Silver Counter 1", "Gold Wholesale", "Payal Counter"
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_counters_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `branch_id` INT UNSIGNED DEFAULT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `role` ENUM('SUPERADMIN', 'ADMIN', 'MANAGER', 'BILLING_OPERATOR', 'WORKSHOP_SUPERVISOR', 'AUDITOR') NOT NULL DEFAULT 'BILLING_OPERATOR',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. ACCOUNTS & TRIPLE-CURRENCY RUNNING LEDGERS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `account_groups`;
CREATE TABLE `account_groups` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `parent_id` INT UNSIGNED DEFAULT NULL,
  `name` VARCHAR(100) NOT NULL UNIQUE, -- e.g. "Sundry Debtors", "Sundry Creditors", "Karigar", "Cash", "Bank"
  `nature` ENUM('ASSET', 'LIABILITY', 'INCOME', 'EXPENSE') NOT NULL,
  CONSTRAINT `fk_group_parent` FOREIGN KEY (`parent_id`) REFERENCES `account_groups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `account_code` VARCHAR(30) NOT NULL UNIQUE,
  `group_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `company_name` VARCHAR(120) DEFAULT NULL,
  `account_type` ENUM('CUSTOMER', 'SUPPLIER', 'KARIGAR', 'BROKER', 'BANK', 'CASH', 'EXPENSE', 'GIRVI_LOAN') NOT NULL,
  `mobile` VARCHAR(30) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(60) DEFAULT NULL,
  `state` VARCHAR(60) DEFAULT 'Gujarat',
  `gstin` VARCHAR(20) DEFAULT NULL,
  `pan_no` VARCHAR(15) DEFAULT NULL,
  `aadhaar_no` VARCHAR(20) DEFAULT NULL,
  `dob` DATE DEFAULT NULL,
  `anniversary_date` DATE DEFAULT NULL,
  `credit_days` INT UNSIGNED DEFAULT 0,
  `credit_limit_inr` DECIMAL(14,2) DEFAULT 0.00,
  
  -- Triple Currency Running Balances
  `balance_inr` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Cash / INR Balance (+Dr, -Cr)',
  `balance_fine_gold` DECIMAL(12,3) DEFAULT 0.000 COMMENT 'Pure Gold in Grams (+Dr, -Cr)',
  `balance_fine_silver` DECIMAL(12,3) DEFAULT 0.000 COMMENT 'Pure Silver in Grams (+Dr, -Cr)',
  
  -- Karigar specific terms
  `default_labour_rate` DECIMAL(10,2) DEFAULT 0.00,
  `default_wastage_percent` DECIMAL(5,2) DEFAULT 0.00,
  `permissible_loss_percent` DECIMAL(5,2) DEFAULT 0.00,

  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_accounts_group` FOREIGN KEY (`group_id`) REFERENCES `account_groups` (`id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. INVENTORY, PURITY STAMPS & JEWELLERY CATALOG
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `purity_stamps`;
CREATE TABLE `purity_stamps` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `metal_type` ENUM('GOLD', 'SILVER', 'PLATINUM', 'DIAMOND') NOT NULL,
  `name` VARCHAR(50) NOT NULL UNIQUE, -- '92.5 Sterling', '80 Silver', '70 Silver', '22K 916', '18K 750'
  `touch_purity` DECIMAL(6,2) NOT NULL COMMENT 'Purity Percentage e.g. 92.50, 80.00, 91.60',
  `huid_mandatory` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `metal_type` ENUM('GOLD', 'SILVER', 'PLATINUM', 'DIAMOND') NOT NULL,
  `name` VARCHAR(80) NOT NULL UNIQUE, -- 'Payal', 'Kandora', 'Bangles', 'Kada', 'Mangalsutra', 'Utensils'
  `hsn_code` VARCHAR(20) DEFAULT '7113'
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `items`;
CREATE TABLE `items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `category_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL, -- 'FANCY PAYAL', '7T KANDORA', 'CNC KADA', 'ANTIQ KANDORA'
  `default_stamp_id` INT UNSIGNED NOT NULL,
  `default_wastage` DECIMAL(6,2) DEFAULT 0.00 COMMENT 'Default Wastage %',
  `default_labour_rate` DECIMAL(10,2) DEFAULT 0.00,
  `labour_type` ENUM('PER_GRAM_NET', 'PER_GRAM_GROSS', 'PER_PIECE', 'PERCENTAGE') DEFAULT 'PER_GRAM_NET',
  `hsn_code` VARCHAR(20) DEFAULT '7113',
  `is_active` TINYINT(1) DEFAULT 1,
  CONSTRAINT `fk_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_items_stamp` FOREIGN KEY (`default_stamp_id`) REFERENCES `purity_stamps` (`id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. SERIALIZED INVENTORY & RFID / BARCODE TAGS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_tags`;
CREATE TABLE `inventory_tags` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tag_number` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Barcode / Printed Tag ID',
  `rfid_epc` VARCHAR(64) DEFAULT NULL UNIQUE COMMENT 'RFID Electronic Product Code',
  `item_id` INT UNSIGNED NOT NULL,
  `purity_stamp_id` INT UNSIGNED NOT NULL,
  `counter_id` INT UNSIGNED DEFAULT NULL,
  `tray_number` VARCHAR(30) DEFAULT NULL,
  
  -- Weights
  `gross_weight` DECIMAL(10,3) NOT NULL,
  `less_weight` DECIMAL(10,3) DEFAULT 0.000,
  `net_weight` DECIMAL(10,3) NOT NULL,
  `purity_touch` DECIMAL(6,2) NOT NULL,
  `wastage_percent` DECIMAL(6,2) DEFAULT 0.00,
  `fine_weight` DECIMAL(10,3) NOT NULL COMMENT 'Net Weight * (Touch + Wastage) / 100',
  
  -- Pricing & Tag Details
  `labour_rate` DECIMAL(10,2) DEFAULT 0.00,
  `labour_code` VARCHAR(20) DEFAULT NULL COMMENT 'Obfuscated labour code for tag display',
  `other_charges` DECIMAL(10,2) DEFAULT 0.00,
  `huid_number` VARCHAR(20) DEFAULT NULL COMMENT '6-digit alphanumeric Hallmark HUID',
  `image_url` VARCHAR(255) DEFAULT NULL,
  
  `status` ENUM('IN_STOCK', 'ON_APPROVAL', 'SOLD', 'MELTED', 'TRANSFERRED') DEFAULT 'IN_STOCK',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tag_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  CONSTRAINT `fk_tag_stamp` FOREIGN KEY (`purity_stamp_id`) REFERENCES `purity_stamps` (`id`),
  CONSTRAINT `fk_tag_counter` FOREIGN KEY (`counter_id`) REFERENCES `counters` (`id`) ON DELETE SET NULL,
  INDEX `idx_tags_status` (`status`),
  INDEX `idx_tags_tagnum` (`tag_number`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. TRANSACTIONS & BILLING VOUCHERS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `voucher_no` INT UNSIGNED NOT NULL,
  `series` VARCHAR(20) DEFAULT 'GST',
  `branch_id` INT UNSIGNED NOT NULL,
  `voucher_type` ENUM(
    'SALE', 'PURCHASE', 'SALE_RETURN', 'PURCHASE_RETURN', 
    'APPROVAL_ISSUE', 'APPROVAL_RETURN', 'RECEIPT', 'PAYMENT', 
    'CONTRA', 'JOURNAL', 'BHAV_CUT_GOLD', 'BHAV_CUT_SILVER', 
    'METAL_RECEIPT', 'METAL_PAYMENT', 'ORDER_ADVANCE'
  ) NOT NULL,
  `voucher_date` DATE NOT NULL,
  `account_id` INT UNSIGNED NOT NULL,
  
  -- Financial Summary
  `gross_amount` DECIMAL(15,2) DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(15,2) DEFAULT 0.00,
  `cgst_amount` DECIMAL(12,2) DEFAULT 0.00,
  `sgst_amount` DECIMAL(12,2) DEFAULT 0.00,
  `igst_amount` DECIMAL(12,2) DEFAULT 0.00,
  `net_amount` DECIMAL(15,2) DEFAULT 0.00,
  `round_off` DECIMAL(6,2) DEFAULT 0.00,

  -- Metal Settlement Breakdown
  `settled_fine_gold` DECIMAL(12,3) DEFAULT 0.000 COMMENT 'Pure Gold Weight settled on this bill',
  `settled_fine_silver` DECIMAL(12,3) DEFAULT 0.000 COMMENT 'Pure Silver Weight settled on this bill',
  `settled_cash_inr` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Currency amount settled on this bill',

  `narration` VARCHAR(255) DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_vouchers_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_vouchers_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `fk_vouchers_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_voucher_series_no` (`series`, `voucher_no`, `branch_id`),
  INDEX `idx_vouchers_date` (`voucher_date`),
  INDEX `idx_vouchers_type` (`voucher_type`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `voucher_items`;
CREATE TABLE `voucher_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `voucher_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` BIGINT UNSIGNED DEFAULT NULL,
  `item_id` INT UNSIGNED NOT NULL,
  `purity_stamp_id` INT UNSIGNED NOT NULL,
  `item_description` VARCHAR(150) NOT NULL,
  
  -- Weights
  `pieces` INT UNSIGNED DEFAULT 1,
  `gross_weight` DECIMAL(10,3) NOT NULL,
  `less_weight` DECIMAL(10,3) DEFAULT 0.000,
  `net_weight` DECIMAL(10,3) NOT NULL,
  `purity_touch` DECIMAL(6,2) NOT NULL,
  `wastage_percent` DECIMAL(6,2) DEFAULT 0.00,
  `fine_weight` DECIMAL(10,3) NOT NULL,

  -- Financials
  `metal_rate_per_gram` DECIMAL(12,2) NOT NULL,
  `metal_amount` DECIMAL(15,2) NOT NULL,
  `labour_rate` DECIMAL(10,2) DEFAULT 0.00,
  `labour_amount` DECIMAL(12,2) DEFAULT 0.00,
  `stone_amount` DECIMAL(12,2) DEFAULT 0.00,
  `total_item_amount` DECIMAL(15,2) NOT NULL,
  
  `huid_number` VARCHAR(20) DEFAULT NULL,
  CONSTRAINT `fk_vi_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vi_tag` FOREIGN KEY (`tag_id`) REFERENCES `inventory_tags` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vi_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  CONSTRAINT `fk_vi_stamp` FOREIGN KEY (`purity_stamp_id`) REFERENCES `purity_stamps` (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `payment_splits`;
CREATE TABLE `payment_splits` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `voucher_id` BIGINT UNSIGNED NOT NULL,
  `payment_mode` ENUM('CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'POS_CARD', 'OLD_METAL_EXCHANGE') NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `reference_no` VARCHAR(60) DEFAULT NULL,
  `bank_name` VARCHAR(80) DEFAULT NULL,
  `metal_exchange_grams` DECIMAL(10,3) DEFAULT 0.000,
  CONSTRAINT `fk_pay_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. KARIGAR & WORKSHOP MANUFACTURING (JOB CARDS)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `job_cards`;
CREATE TABLE `job_cards` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_no` INT UNSIGNED NOT NULL UNIQUE,
  `karigar_id` INT UNSIGNED NOT NULL,
  `branch_id` INT UNSIGNED NOT NULL,
  `target_item_id` INT UNSIGNED NOT NULL,
  `target_purity_stamp_id` INT UNSIGNED NOT NULL,
  `design_code` VARCHAR(50) DEFAULT NULL,
  `pieces` INT UNSIGNED DEFAULT 1,
  `status` ENUM('ISSUED', 'IN_PROGRESS', 'RECEIVED', 'CLOSED') DEFAULT 'ISSUED',
  `issue_date` DATE NOT NULL,
  `due_date` DATE DEFAULT NULL,

  -- Metal Issue
  `issued_gross_wt` DECIMAL(10,3) NOT NULL,
  `issued_purity` DECIMAL(6,2) NOT NULL,
  `issued_fine_wt` DECIMAL(10,3) NOT NULL,

  -- Finished Goods Receipt
  `received_gross_wt` DECIMAL(10,3) DEFAULT 0.000,
  `received_net_wt` DECIMAL(10,3) DEFAULT 0.000,
  `received_purity` DECIMAL(6,2) DEFAULT 0.00,
  `received_fine_wt` DECIMAL(10,3) DEFAULT 0.000,

  -- Scrap & Loss Reconciliation
  `scrap_returned_wt` DECIMAL(10,3) DEFAULT 0.000,
  `dust_recovered_wt` DECIMAL(10,3) DEFAULT 0.000,
  `actual_loss_wt` DECIMAL(10,3) DEFAULT 0.000,
  `permissible_loss_wt` DECIMAL(10,3) DEFAULT 0.000,

  -- Labour Wages
  `labour_rate` DECIMAL(10,2) DEFAULT 0.00,
  `labour_total_inr` DECIMAL(12,2) DEFAULT 0.00,

  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_job_karigar` FOREIGN KEY (`karigar_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `fk_job_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_job_item` FOREIGN KEY (`target_item_id`) REFERENCES `items` (`id`),
  CONSTRAINT `fk_job_stamp` FOREIGN KEY (`target_purity_stamp_id`) REFERENCES `purity_stamps` (`id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. GIRVI (PAWN BROKING / GOLD & SILVER LOAN)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `girvi_loans`;
CREATE TABLE `girvi_loans` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `loan_no` INT UNSIGNED NOT NULL UNIQUE,
  `customer_id` INT UNSIGNED NOT NULL,
  `branch_id` INT UNSIGNED NOT NULL,
  `loan_date` DATE NOT NULL,
  `principal_amount` DECIMAL(14,2) NOT NULL,
  `monthly_interest_rate` DECIMAL(5,2) NOT NULL COMMENT 'Monthly % e.g. 1.50%',
  
  -- Collateral Details
  `metal_type` ENUM('GOLD', 'SILVER') NOT NULL,
  `pledged_gross_wt` DECIMAL(10,3) NOT NULL,
  `pledged_less_wt` DECIMAL(10,3) DEFAULT 0.000,
  `pledged_net_wt` DECIMAL(10,3) NOT NULL,
  `purity_touch` DECIMAL(6,2) NOT NULL,
  `valuation_amount` DECIMAL(14,2) NOT NULL,
  `ornaments_description` VARCHAR(255) NOT NULL,
  `vault_bag_number` VARCHAR(50) DEFAULT NULL,

  `status` ENUM('ACTIVE', 'REDEEMED', 'AUCTIONED', 'DEFAULTED') DEFAULT 'ACTIVE',
  `redeemed_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_girvi_customer` FOREIGN KEY (`customer_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `fk_girvi_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `girvi_receipts`;
CREATE TABLE `girvi_receipts` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `loan_id` BIGINT UNSIGNED NOT NULL,
  `receipt_date` DATE NOT NULL,
  `principal_received` DECIMAL(14,2) DEFAULT 0.00,
  `interest_received` DECIMAL(14,2) DEFAULT 0.00,
  `discount_allowed` DECIMAL(10,2) DEFAULT 0.00,
  `total_received` DECIMAL(14,2) NOT NULL,
  `payment_mode` ENUM('CASH', 'UPI', 'BANK_TRANSFER') DEFAULT 'CASH',
  `narration` VARCHAR(200) DEFAULT NULL,
  CONSTRAINT `fk_grcpt_loan` FOREIGN KEY (`loan_id`) REFERENCES `girvi_loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. DAILY BOARD RATES (BHAV) & BULLION SAUDA
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `daily_board_rates`;
CREATE TABLE `daily_board_rates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `rate_date` DATE NOT NULL UNIQUE,
  `gold_24k_buy_rate` DECIMAL(10,2) NOT NULL COMMENT 'per 10g',
  `gold_24k_sell_rate` DECIMAL(10,2) NOT NULL COMMENT 'per 10g',
  `gold_22k_rate` DECIMAL(10,2) NOT NULL COMMENT 'per 10g',
  `silver_pure_buy_rate` DECIMAL(10,2) NOT NULL COMMENT 'per 1kg',
  `silver_pure_sell_rate` DECIMAL(10,2) NOT NULL COMMENT 'per 1kg',
  `silver_925_rate` DECIMAL(10,2) NOT NULL COMMENT 'per 1kg',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `bullion_saudas`;
CREATE TABLE `bullion_saudas` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `sauda_no` INT UNSIGNED NOT NULL UNIQUE,
  `party_id` INT UNSIGNED NOT NULL,
  `sauda_date` DATE NOT NULL,
  `metal_type` ENUM('GOLD', 'SILVER') NOT NULL,
  `order_type` ENUM('BUY', 'SELL') NOT NULL,
  `booked_rate` DECIMAL(12,2) NOT NULL,
  `total_quantity_grams` DECIMAL(12,3) NOT NULL,
  `delivered_quantity_grams` DECIMAL(12,3) DEFAULT 0.000,
  `due_date` DATE DEFAULT NULL,
  `badla_rate` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Carrying interest / badla charges',
  `status` ENUM('OPEN', 'PARTIALLY_DELIVERED', 'COMPLETED', 'CANCELLED') DEFAULT 'OPEN',
  CONSTRAINT `fk_sauda_party` FOREIGN KEY (`party_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. KITTY SAVING SCHEME (SWARNA NIDHI / MONTHLY CHIT)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `kitty_schemes`;
CREATE TABLE `kitty_schemes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `monthly_installment` DECIMAL(10,2) NOT NULL,
  `duration_months` INT UNSIGNED NOT NULL DEFAULT 11,
  `bonus_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `kitty_accounts`;
CREATE TABLE `kitty_accounts` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `membership_no` VARCHAR(40) NOT NULL UNIQUE,
  `scheme_id` INT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED NOT NULL,
  `start_date` DATE NOT NULL,
  `maturity_date` DATE NOT NULL,
  `installments_paid` INT UNSIGNED DEFAULT 0,
  `total_amount_paid` DECIMAL(12,2) DEFAULT 0.00,
  `status` ENUM('RUNNING', 'MATURED', 'REDEEMED', 'CANCELLED') DEFAULT 'RUNNING',
  CONSTRAINT `fk_kitty_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `kitty_schemes` (`id`),
  CONSTRAINT `fk_kitty_customer` FOREIGN KEY (`customer_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `kitty_installments`;
CREATE TABLE `kitty_installments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `kitty_account_id` BIGINT UNSIGNED NOT NULL,
  `installment_no` INT UNSIGNED NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `receipt_no` VARCHAR(50) DEFAULT NULL,
  CONSTRAINT `fk_kinst_account` FOREIGN KEY (`kitty_account_id`) REFERENCES `kitty_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
