-- RUDRA SILVER ERP - STOCK ITEMS MIGRATION & MASTER TABLES
USE `rudra_silver`;

-- 1. Units of measurement master table
CREATE TABLE IF NOT EXISTS `units` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(50) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `units` (`id`, `code`, `name`) VALUES
(1, 'GMS', 'Grams'),
(2, 'PCS', 'Pieces'),
(3, 'KG', 'Kilograms'),
(4, 'CT', 'Carats');

-- 2. Stock items table
CREATE TABLE IF NOT EXISTS `stock_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `stock_code` VARCHAR(50) NOT NULL UNIQUE,
  `item_name` VARCHAR(150) NOT NULL,
  `item_id` INT UNSIGNED DEFAULT NULL,
  `item_group_id` INT UNSIGNED DEFAULT NULL,
  `metal_type` ENUM('Silver', 'Gold', 'Platinum', 'Diamond', 'Other') NOT NULL DEFAULT 'Silver',
  `purity_id` INT UNSIGNED DEFAULT NULL,
  `gross_weight` DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  `stone_weight` DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  `other_weight` DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  `net_weight` DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  `fine_weight` DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  `quantity` INT NOT NULL DEFAULT 1,
  `available_stock` INT NOT NULL DEFAULT 1,
  `minimum_stock_level` INT NOT NULL DEFAULT 0,
  `unit_id` INT UNSIGNED DEFAULT 1,
  `purchase_date` DATE DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `status` ENUM('Available', 'Low Stock', 'Out of Stock') NOT NULL DEFAULT 'Available',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_stock_code` (`stock_code`),
  KEY `idx_item_name` (`item_name`),
  KEY `idx_metal_type` (`metal_type`),
  KEY `idx_status` (`status`),
  KEY `idx_item_group_id` (`item_group_id`),
  KEY `idx_purity_id` (`purity_id`),
  KEY `idx_unit_id` (`unit_id`),
  CONSTRAINT `fk_stock_purity` FOREIGN KEY (`purity_id`) REFERENCES `purity_stamps` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stock_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seed realistic Rudra Silver stock data
INSERT INTO `stock_items` 
(`stock_code`, `item_name`, `item_id`, `item_group_id`, `metal_type`, `purity_id`, `gross_weight`, `stone_weight`, `other_weight`, `net_weight`, `fine_weight`, `quantity`, `available_stock`, `minimum_stock_level`, `unit_id`, `purchase_date`, `remarks`, `status`)
VALUES
('STK-2026-0001', 'Silver Antique Bridal Payal 925', 1, 1, 'Silver', 1, 142.500, 4.500, 0.000, 138.000, 127.650, 10, 10, 2, 1, '2026-11-10', 'Hallmarked 925 handcrafted antique finish', 'Available'),
('STK-2026-0002', 'Bombay Designer Fancy Payal', 1, 1, 'Silver', 2, 85.200, 2.200, 0.000, 83.000, 66.400, 18, 18, 3, 1, '2026-11-12', 'Traditional 80 touch silver payal pair', 'Available'),
('STK-2026-0003', 'Rajkot Heavy Men Kada 925', 1, 1, 'Silver', 1, 62.400, 0.000, 0.000, 62.400, 57.720, 14, 14, 2, 1, '2026-11-14', 'Solid sterling silver kada with laser engraving', 'Available'),
('STK-2026-0004', 'Silver Pooja Thali Set 5 Pcs', 1, 1, 'Silver', 2, 345.000, 0.000, 0.000, 345.000, 276.000, 6, 6, 2, 1, '2026-11-05', 'Embossed floral design devotional thali set', 'Available'),
('STK-2026-0005', 'Fine Silver Bullion Bar 999 100g', 2, 2, 'Silver', 4, 100.000, 0.000, 0.000, 100.000, 99.900, 25, 25, 5, 1, '2026-11-18', 'LBMA certified 99.9 pure silver bullion minted bar', 'Available'),
('STK-2026-0006', 'Kundan Choker Necklace Set', 3, 3, 'Silver', 1, 118.600, 22.400, 1.200, 95.000, 87.875, 4, 4, 1, 1, '2026-11-15', 'Victorian finish silver base with synthetic kundan', 'Available'),
('STK-2026-0007', 'Silver Sindoor Box Kamal Design', 1, 1, 'Silver', 2, 32.100, 1.100, 0.000, 31.000, 24.800, 2, 2, 5, 1, '2026-11-02', 'Low stock alert item for daily pooja gifting', 'Low Stock'),
('STK-2026-0008', 'Fine Silver Lakshmi Ganesh Coin 10g', 2, 2, 'Silver', 4, 10.000, 0.000, 0.000, 10.000, 9.990, 0, 0, 10, 1, '2026-10-25', 'Festive coin batch currently out of stock', 'Out of Stock'),
('STK-2026-0009', 'Gold 22K Hallmarked Wedding Ring', 9, 9, 'Gold', 5, 5.800, 0.300, 0.000, 5.500, 5.038, 8, 8, 2, 1, '2026-11-16', '22K 916 HUID certified classic gent ring', 'Available'),
('STK-2026-0010', 'Sterling Silver Wine Goblet Set', 1, 1, 'Silver', 1, 280.000, 0.000, 0.000, 280.000, 259.000, 3, 3, 1, 1, '2026-11-08', 'Pair of royal silver dinner goblets', 'Available'),
('STK-2026-0011', 'Designer Cz Silver Bracelet', 4, 4, 'Silver', 1, 18.250, 1.250, 0.000, 17.000, 15.725, 12, 12, 2, 1, '2026-11-19', 'Rhodium polished anti-tarnish CZ cubic zirconia', 'Available'),
('STK-2026-0012', 'Traditional Silver Bichhiya (Toe Ring)', 1, 1, 'Silver', 3, 12.000, 0.500, 0.000, 11.500, 8.050, 1, 1, 6, 1, '2026-11-01', 'Handmade floral 70 touch toe ring pair', 'Low Stock')
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
