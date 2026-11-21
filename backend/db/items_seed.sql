-- =====================================================================
-- Rudra Silver ERP: 13 Realistic Item Groups Demo Seed Data
-- Matches legacy software Item List / Item Type module
-- =====================================================================

USE `rudra_silver`;

-- Update existing 5 rows (to maintain foreign key integrity with vouchers/tags)
UPDATE `items` SET 
  `group_name` = 'SILVER JEWELLERY',
  `name` = 'SILVER JEWELLERY',
  `sgst` = 1.50, `cgst` = 1.50, `igst` = 3.00,
  `hsn_code` = '7113', `job_sac` = '9988', `gstr1_display` = 'TAXABLE',
  `l_tax` = 0.00, `c_tax` = 0.00, `com_co` = 'SILVER', `gp_percentage` = 15.00,
  `op_value` = 0.00, `cl_value` = 0.00, `minimum_stock` = 0,
  `mrp_type` = 'WEIGHT_BASED', `value_rate` = 0.00, `stock_method` = 'FIFO', `tunch` = 92.50,
  `default_item` = 'Bombay Fancy Payal', `return_policy_enabled` = 1, `return_valid_days` = 7,
  `return_deduction_percent` = 0.00, `exchange_policy_enabled` = 1, `exchange_valid_days` = 15,
  `exchange_deduction_percent` = 0.00, `tag_gen_restricted` = 0, `tag_prefix` = 'SJ',
  `min_tag_weight` = 1.000, `max_tag_weight` = 500.000, `card_point_enabled` = 1,
  `card_point_percentage` = 1.00, `card_points_per_gram` = 0.50
WHERE `id` = 1;

UPDATE `items` SET 
  `group_name` = 'SILVER METAL',
  `name` = 'SILVER METAL',
  `sgst` = 1.50, `cgst` = 1.50, `igst` = 3.00,
  `hsn_code` = '7106', `job_sac` = '', `gstr1_display` = 'TAXABLE',
  `l_tax` = 0.00, `c_tax` = 0.00, `com_co` = 'BULLION', `gp_percentage` = 5.00,
  `op_value` = 0.00, `cl_value` = 0.00, `minimum_stock` = 0,
  `mrp_type` = 'RATE_CUT', `value_rate` = 0.00, `stock_method` = 'WEIGHTED_AVG', `tunch` = 99.90,
  `default_item` = 'Fine Silver Chorsa', `return_policy_enabled` = 1, `return_valid_days` = 2,
  `return_deduction_percent` = 1.00, `exchange_policy_enabled` = 1, `exchange_valid_days` = 5,
  `exchange_deduction_percent` = 1.00, `tag_gen_restricted` = 1, `tag_prefix` = 'SM',
  `min_tag_weight` = 10.000, `max_tag_weight` = 50000.000, `card_point_enabled` = 0,
  `card_point_percentage` = 0.00, `card_points_per_gram` = 0.00
WHERE `id` = 2;

UPDATE `items` SET 
  `group_name` = 'KUNDAN JEWELLERY',
  `name` = 'KUNDAN JEWELLERY',
  `sgst` = 1.50, `cgst` = 1.50, `igst` = 3.00,
  `hsn_code` = '7113', `job_sac` = '9988', `gstr1_display` = 'TAXABLE',
  `l_tax` = 0.00, `c_tax` = 0.00, `com_co` = 'KUNDAN', `gp_percentage` = 20.00,
  `op_value` = 0.00, `cl_value` = 0.00, `minimum_stock` = 0,
  `mrp_type` = 'WEIGHT_BASED', `value_rate` = 0.00, `stock_method` = 'FIFO', `tunch` = 80.00,
  `default_item` = 'Kundan Bridal Set', `return_policy_enabled` = 1, `return_valid_days` = 7,
  `return_deduction_percent` = 5.00, `exchange_policy_enabled` = 1, `exchange_valid_days` = 15,
  `exchange_deduction_percent` = 2.00, `tag_gen_restricted` = 0, `tag_prefix` = 'KJ',
  `min_tag_weight` = 5.000, `max_tag_weight` = 1000.000, `card_point_enabled` = 1,
  `card_point_percentage` = 1.50, `card_points_per_gram` = 1.00
WHERE `id` = 3;

UPDATE `items` SET 
  `group_name` = 'BRANDED JEWELLERY',
  `name` = 'BRANDED JEWELLERY',
  `sgst` = 1.50, `cgst` = 1.50, `igst` = 3.00,
  `hsn_code` = '7113', `job_sac` = '', `gstr1_display` = 'TAXABLE',
  `l_tax` = 0.00, `c_tax` = 0.00, `com_co` = 'BRANDED', `gp_percentage` = 25.00,
  `op_value` = 0.00, `cl_value` = 0.00, `minimum_stock` = 0,
  `mrp_type` = 'FIXED', `value_rate` = 0.00, `stock_method` = 'FIFO', `tunch` = 92.50,
  `default_item` = 'Designer Silver Bracelet', `return_policy_enabled` = 1, `return_valid_days` = 10,
  `return_deduction_percent` = 0.00, `exchange_policy_enabled` = 1, `exchange_valid_days` = 30,
  `exchange_deduction_percent` = 0.00, `tag_gen_restricted` = 0, `tag_prefix` = 'BJ',
  `min_tag_weight` = 2.000, `max_tag_weight` = 300.000, `card_point_enabled` = 1,
  `card_point_percentage` = 2.00, `card_points_per_gram` = 1.50
WHERE `id` = 4;

UPDATE `items` SET 
  `group_name` = 'OTHERS',
  `name` = 'OTHERS',
  `sgst` = 1.50, `cgst` = 1.50, `igst` = 3.00,
  `hsn_code` = '7113', `job_sac` = '', `gstr1_display` = 'TAXABLE',
  `l_tax` = 0.00, `c_tax` = 0.00, `com_co` = 'MISC', `gp_percentage` = 10.00,
  `op_value` = 0.00, `cl_value` = 0.00, `minimum_stock` = 0,
  `mrp_type` = 'FIXED', `value_rate` = 0.00, `stock_method` = 'FIFO', `tunch` = 0.00,
  `default_item` = 'Accessories & Packaging', `return_policy_enabled` = 0, `return_valid_days` = 0,
  `return_deduction_percent` = 0.00, `exchange_policy_enabled` = 0, `exchange_valid_days` = 0,
  `exchange_deduction_percent` = 0.00, `tag_gen_restricted` = 1, `tag_prefix` = 'OT',
  `min_tag_weight` = 0.000, `max_tag_weight` = 0.000, `card_point_enabled` = 0,
  `card_point_percentage` = 0.00, `card_points_per_gram` = 0.00
WHERE `id` = 5;

-- Insert remaining 8 items if not exist
INSERT INTO `items` (
  `id`, `group_name`, `sgst`, `cgst`, `igst`, `code`, `category_id`, `name`, `default_stamp_id`, 
  `default_wastage`, `default_labour_rate`, `labour_type`, `hsn_code`, `job_sac`, `gstr1_display`, 
  `l_tax`, `c_tax`, `com_co`, `gp_percentage`, `op_value`, `cl_value`, `minimum_stock`, 
  `mrp_type`, `value_rate`, `stock_method`, `tunch`, `default_item`, 
  `return_policy_enabled`, `return_valid_days`, `return_deduction_percent`, 
  `exchange_policy_enabled`, `exchange_valid_days`, `exchange_deduction_percent`, `return_exchange_notes`, 
  `tag_gen_restricted`, `tag_prefix`, `min_tag_weight`, `max_tag_weight`, 
  `card_point_enabled`, `card_point_percentage`, `card_points_per_gram`, `is_active`
) VALUES
(6, 'DIAMOND', 1.50, 1.50, 3.00, 'ITM-DIA-01', 5, 'DIAMOND', 1, 0.00, 0.00, 'PER_PIECE', '7102', '', 'TAXABLE', 0.00, 0.00, 'LOOSE_DIA', 12.00, 0.00, 0.00, 0, 'FIXED', 0.00, 'FIFO', 0.00, 'Certified Solitaire Diamond', 1, 3, 2.00, 1, 7, 0.00, 'Original certificate mandatory for return/exchange', 0, 'DM', 0.050, 10.000, 1, 0.50, 0.00, 1),

(7, 'DIAMOND JEWELLERY', 1.50, 1.50, 3.00, 'ITM-DIA-JW-01', 5, 'DIAMOND JEWELLERY', 5, 2.00, 150.00, 'PER_GRAM_GROSS', '7113', '9988', 'TAXABLE', 0.00, 0.00, 'STUDDED', 18.00, 0.00, 0.00, 0, 'WEIGHT_BASED', 0.00, 'FIFO', 75.00, '18K Diamond Solitaire Ring', 1, 7, 10.00, 1, 15, 0.00, '100% exchange on gold value, 90% on diamonds', 0, 'DJ', 1.000, 50.000, 1, 2.00, 1.00, 1),

(8, 'GEMS/STONES', 1.50, 1.50, 3.00, 'ITM-GEMS-01', 5, 'GEMS/STONES', 1, 0.00, 0.00, 'PER_PIECE', '7103', '', 'TAXABLE', 0.00, 0.00, 'PRECIOUS', 15.00, 0.00, 0.00, 0, 'FIXED', 0.00, 'FIFO', 0.00, 'Natural Emerald / Ruby', 1, 5, 5.00, 1, 10, 0.00, 'Laboratory test report required', 0, 'GM', 0.100, 100.000, 1, 1.00, 0.00, 1),

(9, 'GOLD JEWELLERY', 1.50, 1.50, 3.00, 'ITM-GOLD-JW-01', 5, 'GOLD JEWELLERY', 5, 3.50, 250.00, 'PER_GRAM_NET', '7113', '9988', 'TAXABLE', 0.00, 0.00, 'GOLD_ORN', 10.00, 0.00, 0.00, 0, 'WEIGHT_BASED', 0.00, 'FIFO', 91.60, '22K Hallmark Gold Necklace', 1, 7, 2.00, 1, 15, 0.00, 'HUID hallmark verification required', 0, 'GJ', 1.000, 500.000, 1, 1.00, 2.00, 1),

(10, 'GOLD METAL', 1.50, 1.50, 3.00, 'ITM-GOLD-MTL-01', 5, 'GOLD METAL', 5, 0.00, 10.00, 'PER_GRAM_NET', '7108', '', 'TAXABLE', 0.00, 0.00, 'GOLD_BULLION', 3.00, 0.00, 0.00, 0, 'RATE_CUT', 0.00, 'WEIGHTED_AVG', 99.90, '999 Fine Gold Bar 100G', 0, 0, 0.00, 1, 2, 0.50, 'Market rate settlement', 1, 'GM', 10.000, 1000.000, 0, 0.00, 0.00, 1),

(11, 'HALLMARK CHARGE', 9.00, 9.00, 18.00, 'ITM-HALLMARK-01', 1, 'HALLMARK CHARGE', 1, 0.00, 45.00, 'PER_PIECE', '9983', '9983', 'TAXABLE', 0.00, 0.00, 'SERVICE', 0.00, 0.00, 0.00, 0, 'FIXED', 45.00, 'FIFO', 0.00, 'BIS Hallmark Certification Fee', 0, 0, 0.00, 0, 0, 0.00, 'Statutory BIS charges non-refundable', 1, 'HM', 0.000, 0.000, 0, 0.00, 0.00, 1),

(12, 'PC', 1.50, 1.50, 3.00, 'ITM-PC-01', 1, 'PC', 1, 0.00, 25.00, 'PER_PIECE', '7113', '', 'TAXABLE', 0.00, 0.00, 'PIECE_BASED', 15.00, 0.00, 0.00, 0, 'FIXED', 0.00, 'FIFO', 92.50, 'Silver Nose Pin / Stud Piece', 1, 7, 0.00, 1, 15, 0.00, 'Hygiene item return check', 0, 'PC', 0.200, 10.000, 1, 1.00, 0.00, 1),

(13, 'PC RATE JEWELLERY', 1.50, 1.50, 3.00, 'ITM-PC-RATE-01', 1, 'PC RATE JEWELLERY', 1, 0.00, 50.00, 'PER_PIECE', '7113', '', 'TAXABLE', 0.00, 0.00, 'FIXED_PRICE', 20.00, 0.00, 0.00, 0, 'FIXED', 0.00, 'FIFO', 92.50, 'Silver Rakhi & Gift Articles', 1, 5, 0.00, 1, 10, 0.00, 'Seasonal item policy applies', 0, 'PR', 1.000, 100.000, 1, 1.50, 0.00, 1)

ON DUPLICATE KEY UPDATE 
  `group_name` = VALUES(`group_name`),
  `sgst` = VALUES(`sgst`),
  `cgst` = VALUES(`cgst`),
  `igst` = VALUES(`igst`),
  `hsn_code` = VALUES(`hsn_code`),
  `job_sac` = VALUES(`job_sac`),
  `gstr1_display` = VALUES(`gstr1_display`),
  `l_tax` = VALUES(`l_tax`),
  `c_tax` = VALUES(`c_tax`),
  `com_co` = VALUES(`com_co`),
  `gp_percentage` = VALUES(`gp_percentage`),
  `op_value` = VALUES(`op_value`),
  `cl_value` = VALUES(`cl_value`),
  `minimum_stock` = VALUES(`minimum_stock`),
  `mrp_type` = VALUES(`mrp_type`),
  `value_rate` = VALUES(`value_rate`),
  `stock_method` = VALUES(`stock_method`),
  `tunch` = VALUES(`tunch`),
  `default_item` = VALUES(`default_item`),
  `return_policy_enabled` = VALUES(`return_policy_enabled`),
  `return_valid_days` = VALUES(`return_valid_days`),
  `return_deduction_percent` = VALUES(`return_deduction_percent`),
  `exchange_policy_enabled` = VALUES(`exchange_policy_enabled`),
  `exchange_valid_days` = VALUES(`exchange_valid_days`),
  `exchange_deduction_percent` = VALUES(`exchange_deduction_percent`),
  `return_exchange_notes` = VALUES(`return_exchange_notes`),
  `tag_gen_restricted` = VALUES(`tag_gen_restricted`),
  `tag_prefix` = VALUES(`tag_prefix`),
  `min_tag_weight` = VALUES(`min_tag_weight`),
  `max_tag_weight` = VALUES(`max_tag_weight`),
  `card_point_enabled` = VALUES(`card_point_enabled`),
  `card_point_percentage` = VALUES(`card_point_percentage`),
  `card_points_per_gram` = VALUES(`card_points_per_gram`);
