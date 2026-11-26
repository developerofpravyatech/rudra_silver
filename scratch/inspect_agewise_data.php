<?php
ob_implicit_flush(true);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

use Config\Database;

$db = Database::getConnection();

function dumpTable($db, $sql, $title) {
    echo "\n=== $title ===\n";
    try {
        $rows = $db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            echo json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
        }
        if (empty($rows)) echo "(empty)\n";
    } catch (Throwable $e) {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
}

dumpTable($db, "SELECT * FROM account_groups", "account_groups");
dumpTable($db, "SELECT id, account_code, group_id, name, account_type, city, balance_inr, balance_fine_gold, balance_fine_silver, is_active FROM accounts", "accounts");
dumpTable($db, "SELECT CustomerID, Name, Location, City, RefBy FROM customer", "customer");
dumpTable($db, "SELECT id, voucher_no, voucher_type, voucher_date, account_id, net_amount, settled_fine_gold, settled_fine_silver, settled_cash_inr, narration FROM vouchers", "vouchers");
dumpTable($db, "SELECT * FROM payment_splits", "payment_splits");
dumpTable($db, "SELECT id, transaction_date, transaction_type, party_name, party_id, account_id, group_name, site, gold_fine, silver_fine, total_amount FROM daily_transactions LIMIT 25", "daily_transactions (first 25)");
dumpTable($db, "SELECT DISTINCT transaction_type FROM daily_transactions", "daily_transactions types");
dumpTable($db, "SELECT DISTINCT group_name FROM daily_transactions", "daily_transactions groups");
dumpTable($db, "SELECT id, party_id, account_name, city, balance_date, payment_date, gold_fine, silver_fine, amount FROM daily_balance", "daily_balance");
dumpTable($db, "SELECT id, voucher_no, voucher_date, voucher_type, party_name, account_group, branch_name, gold_weight, silver_weight, amount, sale_value, sale_return_value, is_active, deleted_at FROM sale_register", "sale_register");
dumpTable($db, "SELECT id, voucher_no, voucher_date, voucher_type, party_name, account_group, branch_name, gold_weight, silver_weight, amount, purchase_value, purchase_return_value, is_cancelled, is_active, deleted_at FROM purchase_register", "purchase_register");

