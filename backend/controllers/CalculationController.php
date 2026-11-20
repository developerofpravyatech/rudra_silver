<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Services\CalculationService;

class CalculationController {
    public static function calculateItem(): void {
        $body = Validator::getJsonBody();

        $grossWt       = (float)($body['gross_weight'] ?? 0);
        $lessWt        = (float)($body['less_weight'] ?? 0);
        $purityTouch   = (float)($body['purity_touch'] ?? 0);
        $wastagePct    = (float)($body['wastage_percent'] ?? 0);
        $metalRate     = (float)($body['metal_rate_per_gram'] ?? 0);
        $labourRate    = (float)($body['labour_rate'] ?? 0);
        $labourType    = $body['labour_type'] ?? 'PER_GRAM_NET';
        $stoneAmount   = (float)($body['stone_amount'] ?? 0);
        $pieces        = (int)($body['pieces'] ?? 1);

        $res = CalculationService::calculateItemValues(
            $grossWt,
            $lessWt,
            $purityTouch,
            $wastagePct,
            $metalRate,
            $labourRate,
            $labourType,
            $stoneAmount,
            $pieces
        );

        Response::json($res);
    }
}
