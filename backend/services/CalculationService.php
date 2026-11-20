<?php
namespace Services;

class CalculationService {
    public static function calculateItemValues(
        float $grossWt,
        float $lessWt,
        float $purityTouch,
        float $wastagePct,
        float $metalRatePerGram,
        float $labourRate,
        string $labourType = "PER_GRAM_NET",
        float $stoneAmount = 0.00,
        int $pieces = 1
    ): array {
        $netWt = round($grossWt - $lessWt, 3);
        if ($netWt < 0) {
            $netWt = 0.000;
        }

        $effectivePurity = round($purityTouch + $wastagePct, 3);
        $fineWt = round(($netWt * $effectivePurity) / 100.0, 3);
        $metalAmount = round($fineWt * $metalRatePerGram, 2);

        $labourAmount = 0.00;
        switch ($labourType) {
            case "PER_GRAM_NET":
                $labourAmount = round($netWt * $labourRate, 2);
                break;
            case "PER_GRAM_GROSS":
                $labourAmount = round($grossWt * $labourRate, 2);
                break;
            case "PER_PIECE":
                $labourAmount = round($pieces * $labourRate, 2);
                break;
            case "PERCENTAGE":
                $labourAmount = round(($metalAmount * $labourRate) / 100.0, 2);
                break;
            default:
                $labourAmount = round($netWt * $labourRate, 2);
        }

        $totalItemAmount = round($metalAmount + $labourAmount + $stoneAmount, 2);

        return [
            "net_weight"        => $netWt,
            "effective_purity"  => $effectivePurity,
            "fine_weight"       => $fineWt,
            "metal_amount"      => $metalAmount,
            "labour_amount"     => $labourAmount,
            "stone_amount"      => $stoneAmount,
            "total_item_amount" => $totalItemAmount
        ];
    }
}
