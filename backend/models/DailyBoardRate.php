<?php
namespace Models;

use Config\Database;
use PDO;

class DailyBoardRate {
    public static function getTodayOrLatest(): ?array {
        $db = Database::getConnection();
        
        $stmt = $db->prepare('SELECT * FROM daily_board_rates WHERE rate_date = CURDATE() ORDER BY id DESC LIMIT 1');
        $stmt->execute();
        $rate = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$rate) {
            $stmt = $db->query('SELECT * FROM daily_board_rates ORDER BY rate_date DESC, id DESC LIMIT 1');
            $rate = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$rate) {
            return [
                'id'                   => 1,
                'rate_date'            => date('Y-m-d'),
                'gold_24k_buy_rate'    => 78000.00,
                'gold_24k_sell_rate'   => 78500.00,
                'gold_22k_rate'        => 71900.00,
                'silver_pure_buy_rate' => 91500.00,
                'silver_pure_sell_rate'=> 92000.00,
                'silver_925_rate'      => 85100.00,
            ];
        }

        // Cast numeric fields
        foreach ($rate as $k => $v) {
            if ($k !== 'id' && $k !== 'rate_date' && is_numeric($v)) {
                $rate[$k] = (float)$v;
            }
        }
        $rate['id'] = (int)$rate['id'];

        return $rate;
    }
}
