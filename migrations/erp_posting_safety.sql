-- ERP posting safety migration
-- Existing transaction data is preserved. This migration only adds missing posting support.

CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reference_type VARCHAR(32) NOT NULL,
    reference_id BIGINT UNSIGNED NOT NULL,
    movement_type VARCHAR(16) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    item_code VARCHAR(50) NULL,
    quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    gross_weight DECIMAL(18,3) NOT NULL DEFAULT 0,
    net_weight DECIMAL(18,3) NOT NULL DEFAULT 0,
    posting_date DATE NOT NULL,
    narration VARCHAR(255) NULL,
    reversed_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_stock_movements_reference (reference_type, reference_id),
    INDEX idx_stock_movements_date_item (posting_date, item_name),
    INDEX idx_stock_movements_reversed (reversed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

