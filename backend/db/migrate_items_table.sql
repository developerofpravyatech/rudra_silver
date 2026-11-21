-- =====================================================================
-- Rudra Silver ERP: Migration for Items Module
-- Extends items table with complete legacy Item List / Item Type schema
-- =====================================================================

USE `rudra_silver`;

-- 1. Relax existing column constraints if needed
ALTER TABLE `items` 
  MODIFY `code` VARCHAR(50) NULL,
  MODIFY `category_id` INT UNSIGNED NULL DEFAULT 1,
  MODIFY `default_stamp_id` INT UNSIGNED NULL DEFAULT 1,
  MODIFY `name` VARCHAR(100) NULL;

-- 2. Add columns if not already present
-- Accounting Detail
ALTER TABLE `items`
  ADD COLUMN IF NOT EXISTS `group_name` VARCHAR(100) NOT NULL DEFAULT '' AFTER `id`,
  ADD COLUMN IF NOT EXISTS `sgst` DECIMAL(5,2) NOT NULL DEFAULT 1.50 AFTER `group_name`,
  ADD COLUMN IF NOT EXISTS `cgst` DECIMAL(5,2) NOT NULL DEFAULT 1.50 AFTER `sgst`,
  ADD COLUMN IF NOT EXISTS `igst` DECIMAL(5,2) NOT NULL DEFAULT 3.00 AFTER `cgst`,
  ADD COLUMN IF NOT EXISTS `job_sac` VARCHAR(20) DEFAULT '' AFTER `hsn_code`,
  ADD COLUMN IF NOT EXISTS `gstr1_display` VARCHAR(50) DEFAULT 'TAXABLE' AFTER `job_sac`,
  ADD COLUMN IF NOT EXISTS `l_tax` DECIMAL(5,2) DEFAULT 0.00 AFTER `gstr1_display`,
  ADD COLUMN IF NOT EXISTS `c_tax` DECIMAL(5,2) DEFAULT 0.00 AFTER `l_tax`,
  ADD COLUMN IF NOT EXISTS `com_co` VARCHAR(50) DEFAULT '' AFTER `c_tax`,
  ADD COLUMN IF NOT EXISTS `gp_percentage` DECIMAL(6,2) DEFAULT 0.00 AFTER `com_co`,
  ADD COLUMN IF NOT EXISTS `op_value` DECIMAL(15,2) DEFAULT 0.00 AFTER `gp_percentage`,
  ADD COLUMN IF NOT EXISTS `cl_value` DECIMAL(15,2) DEFAULT 0.00 AFTER `op_value`,
  ADD COLUMN IF NOT EXISTS `minimum_stock` INT DEFAULT 0 AFTER `cl_value`;

-- MRP Detail
ALTER TABLE `items`
  ADD COLUMN IF NOT EXISTS `mrp_type` VARCHAR(30) DEFAULT 'FIXED' AFTER `minimum_stock`,
  ADD COLUMN IF NOT EXISTS `value_rate` DECIMAL(12,2) DEFAULT 0.00 AFTER `mrp_type`,
  ADD COLUMN IF NOT EXISTS `stock_method` VARCHAR(50) DEFAULT 'FIFO' AFTER `value_rate`,
  ADD COLUMN IF NOT EXISTS `tunch` DECIMAL(6,2) DEFAULT 0.00 AFTER `stock_method`,
  ADD COLUMN IF NOT EXISTS `default_item` VARCHAR(100) DEFAULT '' AFTER `tunch`;

-- Return / Exchange Policy
ALTER TABLE `items`
  ADD COLUMN IF NOT EXISTS `return_policy_enabled` TINYINT(1) DEFAULT 1 AFTER `default_item`,
  ADD COLUMN IF NOT EXISTS `return_valid_days` INT DEFAULT 7 AFTER `return_policy_enabled`,
  ADD COLUMN IF NOT EXISTS `return_deduction_percent` DECIMAL(5,2) DEFAULT 0.00 AFTER `return_valid_days`,
  ADD COLUMN IF NOT EXISTS `exchange_policy_enabled` TINYINT(1) DEFAULT 1 AFTER `return_deduction_percent`,
  ADD COLUMN IF NOT EXISTS `exchange_valid_days` INT DEFAULT 15 AFTER `exchange_policy_enabled`,
  ADD COLUMN IF NOT EXISTS `exchange_deduction_percent` DECIMAL(5,2) DEFAULT 0.00 AFTER `exchange_valid_days`,
  ADD COLUMN IF NOT EXISTS `return_exchange_notes` TEXT DEFAULT NULL AFTER `exchange_deduction_percent`;

-- Tag Gen Restriction / Card Point
ALTER TABLE `items`
  ADD COLUMN IF NOT EXISTS `tag_gen_restricted` TINYINT(1) DEFAULT 0 AFTER `return_exchange_notes`,
  ADD COLUMN IF NOT EXISTS `tag_prefix` VARCHAR(10) DEFAULT '' AFTER `tag_gen_restricted`,
  ADD COLUMN IF NOT EXISTS `min_tag_weight` DECIMAL(10,3) DEFAULT 0.000 AFTER `tag_prefix`,
  ADD COLUMN IF NOT EXISTS `max_tag_weight` DECIMAL(10,3) DEFAULT 0.000 AFTER `min_tag_weight`,
  ADD COLUMN IF NOT EXISTS `card_point_enabled` TINYINT(1) DEFAULT 0 AFTER `max_tag_weight`,
  ADD COLUMN IF NOT EXISTS `card_point_percentage` DECIMAL(5,2) DEFAULT 0.00 AFTER `card_point_enabled`,
  ADD COLUMN IF NOT EXISTS `card_points_per_gram` DECIMAL(8,2) DEFAULT 0.00 AFTER `card_point_percentage`;

-- Timestamps
ALTER TABLE `items`
  ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `is_active`,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;
