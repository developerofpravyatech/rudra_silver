<?php
namespace Services;

use Config\Database;
use PDO;

class InventoryPostingService {
    public static function postMovement(
        string $referenceType,
        int $referenceId,
        string $movementType,
        string $itemName,
        string $itemCode,
        float $quantity,
        float $grossWeight,
        float $netWeight,
        string $postingDate,
        string $narration
    ): void {
        $db = Database::getConnection();
        self::reverseMovement($referenceType, $referenceId);

        $stmt = $db->prepare("
            INSERT INTO stock_movements (
                reference_type, reference_id, movement_type, item_name, item_code,
                quantity, gross_weight, net_weight, posting_date, narration, created_at
            ) VALUES (
                :reference_type, :reference_id, :movement_type, :item_name, :item_code,
                :quantity, :gross_weight, :net_weight, :posting_date, :narration, NOW()
            )
        ");
        $stmt->execute([
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'movement_type' => strtoupper($movementType),
            'item_name' => $itemName,
            'item_code' => $itemCode !== '' ? $itemCode : null,
            'quantity' => $quantity,
            'gross_weight' => $grossWeight,
            'net_weight' => $netWeight,
            'posting_date' => $postingDate,
            'narration' => $narration,
        ]);
    }

    public static function reverseMovement(string $referenceType, int $referenceId): void {
        $db = Database::getConnection();
        $db->prepare("
            UPDATE stock_movements
            SET reversed_at = NOW()
            WHERE reference_type = :reference_type
              AND reference_id = :reference_id
              AND reversed_at IS NULL
        ")->execute([
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);
    }

    public static function stockBalance(?string $asOnDate = null): array {
        $db = Database::getConnection();
        $where = 'reversed_at IS NULL';
        $params = [];
        if ($asOnDate) {
            $where .= ' AND posting_date <= :as_on';
            $params['as_on'] = $asOnDate;
        }

        $stmt = $db->prepare("
            SELECT item_name,
                   SUM(CASE WHEN movement_type IN ('PURCHASE','SALE_RETURN') THEN 1 ELSE -1 END * quantity) AS quantity,
                   SUM(CASE WHEN movement_type IN ('PURCHASE','SALE_RETURN') THEN 1 ELSE -1 END * gross_weight) AS gross_weight,
                   SUM(CASE WHEN movement_type IN ('PURCHASE','SALE_RETURN') THEN 1 ELSE -1 END * net_weight) AS net_weight
            FROM stock_movements
            WHERE $where
            GROUP BY item_name
            ORDER BY item_name ASC
        ");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function postDaily(
        string $transactionType,
        string $partyName,
        string $referenceNo,
        string $postingDate,
        float $totalAmount,
        float $grossWeight,
        float $netWeight,
        string $narration,
        int $pieces = 0
    ): void {
        $db = Database::getConnection();
        $db->prepare("DELETE FROM daily_transactions WHERE ref_no = :ref AND transaction_type = :type")
           ->execute(['ref' => $referenceNo, 'type' => $transactionType]);

        $stmt = $db->prepare("
            INSERT INTO daily_transactions (
                transaction_date, transaction_type, party_name, ref_no, narration,
                login_name, stamp, voucher_type, series, site, group_name,
                pc, gross_weight, net_weight, dia_weight, stone_weight,
                gold_fine, silver_fine, total_amount, is_undelivered, student_details,
                created_by, updated_by, created_at, updated_at
            ) VALUES (
                :date, :type, :party, :ref, :narration,
                :voucher_type, :pc, :gross, :net, 0, 0,
                0, 0, :amount, 'System', 'System', NOW(), NOW()
            )
        ");
        $stmt->execute([
            'date' => $postingDate,
            'type' => $transactionType,
            'party' => $partyName,
            'ref' => $referenceNo,
            'narration' => $narration,
            'voucher_type' => strtoupper($transactionType),
            'pc' => max(0, $pieces),
            'gross' => $grossWeight,
            'net' => $netWeight,
            'amount' => $totalAmount,
        ]);
    }

    public static function reverseDaily(string $transactionType, string $referenceNo): void {
        $db = Database::getConnection();
        $db->prepare("DELETE FROM daily_transactions WHERE ref_no = :ref AND transaction_type = :type")
           ->execute(['ref' => $referenceNo, 'type' => $transactionType]);
    }
}
