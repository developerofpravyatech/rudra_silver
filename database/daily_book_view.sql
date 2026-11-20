-- Daily Book Transaction View
-- Reuses existing vouchers + accounts tables. No duplicate data.

CREATE OR REPLACE VIEW v_daily_book AS
SELECT
    v.id AS id,
    v.id AS voucher_id,
    v.account_id AS party_id,
    v.voucher_date AS transaction_date,
    v.voucher_type AS transaction_type,
    v.series AS series,
    v.voucher_no AS reference_no,
    v.narration AS narration,
    a.name AS party_name,
    a.city AS city,
    a.mobile AS mobile,
    a.phone AS phone,
    0 AS pcs,
    v.settled_fine_gold AS gold_fine,
    v.settled_fine_silver AS silver_fine,
    v.net_amount AS total,
    v.created_by,
    v.created_at
FROM vouchers v
LEFT JOIN accounts a ON a.id = v.account_id;
