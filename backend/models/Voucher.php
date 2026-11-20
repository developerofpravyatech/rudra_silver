<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class Voucher {
    public static function getById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT v.*, a.name AS account_name, a.mobile AS account_mobile FROM vouchers v LEFT JOIN accounts a ON a.id = v.account_id WHERE v.id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $voucher = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$voucher) return null;

        $iStmt = $db->prepare('SELECT * FROM voucher_items WHERE voucher_id = :id');
        $iStmt->execute(['id' => $id]);
        $voucher['items'] = $iStmt->fetchAll(PDO::FETCH_ASSOC);
        return $voucher;
    }
    public static function getDailySummary(?string $dateStr = null): array {
        $db = Database::getConnection();
        $targetDate = $dateStr ?: date('Y-m-d');

        $counts = [
            "receipt" => 0, "payment" => 0, "sale" => 0, "purchase" => 0,
            "sale_return" => 0, "purchase_return" => 0, "journal" => 0, "contra" => 0,
            "issue" => 0, "receive" => 0, "order" => 0, "repair" => 0
        ];

        try {
            $stmt = $db->prepare('
                SELECT voucher_type, COUNT(id) AS cnt 
                FROM vouchers 
                WHERE voucher_date = :vdate 
                GROUP BY voucher_type
            ');
            $stmt->execute(['vdate' => $targetDate]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $typeMap = [
                "RECEIPT" => "receipt", "PAYMENT" => "payment", "SALE" => "sale", "PURCHASE" => "purchase",
                "SALE_RETURN" => "sale_return", "PURCHASE_RETURN" => "purchase_return",
                "JOURNAL" => "journal", "CONTRA" => "contra", "APPROVAL_ISSUE" => "issue",
                "APPROVAL_RETURN" => "receive", "ORDER_ADVANCE" => "order"
            ];

            foreach ($results as $row) {
                $type = $row['voucher_type'];
                if (isset($typeMap[$type])) {
                    $counts[$typeMap[$type]] = (int)$row['cnt'];
                }
            }
        } catch (Exception $e) {
            // Ignore DB errors and return counts
        }

        return [
            'date'           => $targetDate,
            'opening_cash'   => 252400.00,
            'closing_cash'   => 252400.00,
            'voucher_counts' => $counts
        ];
    }

    public static function create(array $data): array {
        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            $branchId = (int)($data['branch_id'] ?? 1);
            $series   = $data['series'] ?? 'GST';

            // Find next voucher_no
            $stmt = $db->prepare('
                SELECT voucher_no FROM vouchers 
                WHERE branch_id = :branch_id AND series = :series 
                ORDER BY voucher_no DESC LIMIT 1
            ');
            $stmt->execute(['branch_id' => $branchId, 'series' => $series]);
            $lastNo = $stmt->fetchColumn();
            $nextVno = $lastNo ? ((int)$lastNo + 1) : 1;

            $vStmt = $db->prepare('
                INSERT INTO vouchers (
                    voucher_no, series, branch_id, voucher_type, voucher_date,
                    account_id, gross_amount, discount_amount, taxable_amount,
                    cgst_amount, sgst_amount, igst_amount, net_amount, round_off,
                    settled_fine_gold, settled_fine_silver, settled_cash_inr, narration,
                    created_at
                ) VALUES (
                    :voucher_no, :series, :branch_id, :voucher_type, :voucher_date,
                    :account_id, :gross_amount, :discount_amount, :taxable_amount,
                    :cgst_amount, :sgst_amount, :igst_amount, :net_amount, :round_off,
                    :settled_fine_gold, :settled_fine_silver, :settled_cash_inr, :narration,
                    NOW()
                )
            ');

            $vStmt->execute([
                'voucher_no'          => $nextVno,
                'series'              => $series,
                'branch_id'           => $branchId,
                'voucher_type'        => $data['voucher_type'] ?? 'SALE',
                'voucher_date'        => $data['voucher_date'] ?? date('Y-m-d'),
                'account_id'          => (int)$data['account_id'],
                'gross_amount'        => (float)($data['gross_amount'] ?? 0),
                'discount_amount'     => (float)($data['discount_amount'] ?? 0),
                'taxable_amount'      => (float)($data['taxable_amount'] ?? 0),
                'cgst_amount'         => (float)($data['cgst_amount'] ?? 0),
                'sgst_amount'         => (float)($data['sgst_amount'] ?? 0),
                'igst_amount'         => (float)($data['igst_amount'] ?? 0),
                'net_amount'          => (float)($data['net_amount'] ?? 0),
                'round_off'           => (float)($data['round_off'] ?? 0),
                'settled_fine_gold'   => (float)($data['settled_fine_gold'] ?? 0),
                'settled_fine_silver' => (float)($data['settled_fine_silver'] ?? 0),
                'settled_cash_inr'    => (float)($data['settled_cash_inr'] ?? 0),
                'narration'           => $data['narration'] ?? null,
            ]);

            $voucherId = (int)$db->lastInsertId();

            // Insert Items
            if (!empty($data['items']) && is_array($data['items'])) {
                $iStmt = $db->prepare('
                    INSERT INTO voucher_items (
                        voucher_id, tag_id, item_id, purity_stamp_id, item_description,
                        pieces, gross_weight, less_weight, net_weight, purity_touch,
                        wastage_percent, fine_weight, metal_rate_per_gram, metal_amount,
                        labour_rate, labour_amount, stone_amount, total_item_amount, huid_number
                    ) VALUES (
                        :voucher_id, :tag_id, :item_id, :purity_stamp_id, :item_description,
                        :pieces, :gross_weight, :less_weight, :net_weight, :purity_touch,
                        :wastage_percent, :fine_weight, :metal_rate_per_gram, :metal_amount,
                        :labour_rate, :labour_amount, :stone_amount, :total_item_amount, :huid_number
                    )
                ');

                foreach ($data['items'] as $itm) {
                    $iStmt->execute([
                        'voucher_id'          => $voucherId,
                        'tag_id'              => $itm['tag_id'] ?? null,
                        'item_id'             => (int)$itm['item_id'],
                        'purity_stamp_id'     => (int)$itm['purity_stamp_id'],
                        'item_description'    => $itm['item_description'] ?? '',
                        'pieces'              => (int)($itm['pieces'] ?? 1),
                        'gross_weight'        => (float)($itm['gross_weight'] ?? 0),
                        'less_weight'         => (float)($itm['less_weight'] ?? 0),
                        'net_weight'          => (float)($itm['net_weight'] ?? 0),
                        'purity_touch'        => (float)($itm['purity_touch'] ?? 0),
                        'wastage_percent'     => (float)($itm['wastage_percent'] ?? 0),
                        'fine_weight'         => (float)($itm['fine_weight'] ?? 0),
                        'metal_rate_per_gram' => (float)($itm['metal_rate_per_gram'] ?? 0),
                        'metal_amount'        => (float)($itm['metal_amount'] ?? 0),
                        'labour_rate'         => (float)($itm['labour_rate'] ?? 0),
                        'labour_amount'       => (float)($itm['labour_amount'] ?? 0),
                        'stone_amount'        => (float)($itm['stone_amount'] ?? 0),
                        'total_item_amount'   => (float)($itm['total_item_amount'] ?? 0),
                        'huid_number'         => $itm['huid_number'] ?? null,
                    ]);
                }
            }

            // Insert Payments
            if (!empty($data['payments']) && is_array($data['payments'])) {
                $pStmt = $db->prepare('
                    INSERT INTO payment_splits (
                        voucher_id, payment_mode, amount, reference_no, bank_name, metal_exchange_grams
                    ) VALUES (
                        :voucher_id, :payment_mode, :amount, :reference_no, :bank_name, :metal_exchange_grams
                    )
                ');

                foreach ($data['payments'] as $pay) {
                    $pStmt->execute([
                        'voucher_id'           => $voucherId,
                        'payment_mode'         => $pay['payment_mode'] ?? 'CASH',
                        'amount'               => (float)($pay['amount'] ?? 0),
                        'reference_no'         => $pay['reference_no'] ?? null,
                        'bank_name'            => $pay['bank_name'] ?? null,
                        'metal_exchange_grams' => (float)($pay['metal_exchange_grams'] ?? 0),
                    ]);
                }
            }

            // Update Account Balance
            if (($data['voucher_type'] ?? 'SALE') === 'SALE') {
                $accStmt = $db->prepare('
                    UPDATE accounts 
                    SET balance_inr = balance_inr + :inr_diff,
                        balance_fine_silver = balance_fine_silver - :silver_diff
                    WHERE id = :acc_id
                ');
                $inrDiff = (float)($data['net_amount'] ?? 0) - (float)($data['settled_cash_inr'] ?? 0);
                $silverDiff = (float)($data['settled_fine_silver'] ?? 0);
                $accStmt->execute([
                    'inr_diff'    => $inrDiff,
                    'silver_diff' => $silverDiff,
                    'acc_id'      => (int)$data['account_id'],
                ]);
            }

            $db->commit();

            return [
                "success"    => true,
                "message"    => "Voucher created successfully",
                "voucher_id" => $voucherId,
                "voucher_no" => $nextVno,
                "series"     => $series,
                "net_amount" => (float)($data['net_amount'] ?? 0),
            ];
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}
