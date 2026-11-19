from decimal import Decimal, ROUND_HALF_UP
from typing import Dict

DECIMAL_3 = Decimal('0.001')
DECIMAL_2 = Decimal('0.01')

def round_weight(val: Decimal) -> Decimal:
    return val.quantize(DECIMAL_3, rounding=ROUND_HALF_UP)

def round_amount(val: Decimal) -> Decimal:
    return val.quantize(DECIMAL_2, rounding=ROUND_HALF_UP)

def calculate_item_values(
    gross_wt: Decimal,
    less_wt: Decimal,
    purity_touch: Decimal,
    wastage_pct: Decimal,
    metal_rate_per_gram: Decimal,
    labour_rate: Decimal,
    labour_type: str = "PER_GRAM_NET",
    stone_amount: Decimal = Decimal('0.00'),
    pieces: int = 1
) -> Dict[str, Decimal]:
    net_wt = round_weight(gross_wt - less_wt)
    if net_wt < Decimal('0'):
        net_wt = Decimal('0.000')

    effective_purity = purity_touch + wastage_pct
    fine_wt = round_weight((net_wt * effective_purity) / Decimal('100'))
    metal_amount = round_amount(fine_wt * metal_rate_per_gram)

    labour_amount = Decimal('0.00')
    if labour_type == "PER_GRAM_NET":
        labour_amount = round_amount(net_wt * labour_rate)
    elif labour_type == "PER_GRAM_GROSS":
        labour_amount = round_amount(gross_wt * labour_rate)
    elif labour_type == "PER_PIECE":
        labour_amount = round_amount(Decimal(str(pieces)) * labour_rate)
    elif labour_type == "PERCENTAGE":
        labour_amount = round_amount((metal_amount * labour_rate) / Decimal('100'))

    total_item_amount = round_amount(metal_amount + labour_amount + stone_amount)

    return {
        "net_weight": net_wt,
        "effective_purity": effective_purity,
        "fine_weight": fine_wt,
        "metal_amount": metal_amount,
        "labour_amount": labour_amount,
        "stone_amount": stone_amount,
        "total_item_amount": total_item_amount
    }
