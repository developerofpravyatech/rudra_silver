from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
import datetime
from decimal import Decimal

from app.db.session import get_db
from app.db.models import Account, InventoryTag, Voucher, VoucherItem, PaymentSplit, DailyBoardRate
from app.schemas.all_schemas import (
    ItemCalculateRequest, ItemCalculateResponse,
    AccountResponse, TagResponse, DailyRateResponse,
    DailySummaryResponse, VoucherCreate
)
from app.services.calculation import calculate_item_values

router = APIRouter()

@router.post("/calculate/item", response_model=ItemCalculateResponse)
def calculate_item_api(req: ItemCalculateRequest):
    return calculate_item_values(
        gross_wt=req.gross_weight,
        less_wt=req.less_weight,
        purity_touch=req.purity_touch,
        wastage_pct=req.wastage_percent,
        metal_rate_per_gram=req.metal_rate_per_gram,
        labour_rate=req.labour_rate,
        labour_type=req.labour_type,
        stone_amount=req.stone_amount,
        pieces=req.pieces
    )

@router.get("/daily-summary", response_model=DailySummaryResponse)
def get_daily_summary(
    date: Optional[datetime.date] = None,
    db: Session = Depends(get_db)
):
    target_date = date or datetime.date.today()
    
    # Query voucher counts for this date
    counts = {
        "receipt": 0, "payment": 0, "sale": 0, "purchase": 0,
        "sale_return": 0, "purchase_return": 0, "journal": 0, "contra": 0,
        "issue": 0, "receive": 0, "order": 0, "repair": 0
    }
    
    try:
        results = db.query(Voucher.voucher_type, func.count(Voucher.id)).filter(
            Voucher.voucher_date == target_date
        ).group_by(Voucher.voucher_type).all()
        
        type_map = {
            "RECEIPT": "receipt", "PAYMENT": "payment", "SALE": "sale", "PURCHASE": "purchase",
            "SALE_RETURN": "sale_return", "PURCHASE_RETURN": "purchase_return",
            "JOURNAL": "journal", "CONTRA": "contra", "APPROVAL_ISSUE": "issue",
            "APPROVAL_RETURN": "receive", "ORDER_ADVANCE": "order"
        }
        for v_type, c in results:
            k = type_map.get(v_type)
            if k:
                counts[k] = c
    except Exception:
        pass

    return DailySummaryResponse(
        date=target_date,
        opening_cash=Decimal('252400.00'),
        closing_cash=Decimal('252400.00'),
        voucher_counts=counts
    )

@router.get("/accounts", response_model=List[AccountResponse])
def get_accounts(
    query: Optional[str] = Query(None, description="Search by name or mobile"),
    account_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    try:
        q = db.query(Account).filter(Account.is_active == True)
        if query:
            q = q.filter(Account.name.ilike(f"%{query}%") | Account.mobile.ilike(f"%{query}%"))
        if account_type:
            q = q.filter(Account.account_type == account_type)
        return q.limit(limit).all()
    except Exception:
        return []

@router.get("/tags/{identifier}", response_model=TagResponse)
def lookup_tag(identifier: str, db: Session = Depends(get_db)):
    tag = db.query(InventoryTag).filter(
        (InventoryTag.tag_number == identifier) | (InventoryTag.rfid_epc == identifier)
    ).first()
    if not tag:
        raise HTTPException(status_code=404, detail=f"Tag '{identifier}' not found")
    
    return TagResponse(
        id=tag.id,
        tag_number=tag.tag_number,
        rfid_epc=tag.rfid_epc,
        item_id=tag.item_id,
        item_name=tag.item.name if tag.item else None,
        purity_stamp_name=tag.purity_stamp.name if tag.purity_stamp else None,
        gross_weight=tag.gross_weight,
        less_weight=tag.less_weight,
        net_weight=tag.net_weight,
        purity_touch=tag.purity_touch,
        wastage_percent=tag.wastage_percent,
        fine_weight=tag.fine_weight,
        labour_rate=tag.labour_rate,
        labour_code=tag.labour_code,
        huid_number=tag.huid_number,
        status=tag.status
    )

@router.get("/rates/today", response_model=Optional[DailyRateResponse])
def get_today_rates(db: Session = Depends(get_db)):
    try:
        today = datetime.date.today()
        rate = db.query(DailyBoardRate).filter(DailyBoardRate.rate_date == today).first()
        if not rate:
            rate = db.query(DailyBoardRate).order_by(desc(DailyBoardRate.rate_date)).first()
        return rate
    except Exception:
        # Fallback mockup if DB not initialized yet
        return DailyRateResponse(
            id=1,
            rate_date=datetime.date.today(),
            gold_24k_buy_rate=Decimal('78000.00'),
            gold_24k_sell_rate=Decimal('78500.00'),
            gold_22k_rate=Decimal('71900.00'),
            silver_pure_buy_rate=Decimal('91500.00'),
            silver_pure_sell_rate=Decimal('92000.00'),
            silver_925_rate=Decimal('85100.00')
        )

@router.post("/vouchers")
def create_voucher(v_in: VoucherCreate, db: Session = Depends(get_db)):
    try:
        last_vno = db.query(Voucher.voucher_no).filter(
            Voucher.branch_id == v_in.branch_id,
            Voucher.series == v_in.series
        ).order_by(desc(Voucher.voucher_no)).first()
        next_vno = (last_vno[0] + 1) if last_vno else 1

        voucher = Voucher(
            voucher_no=next_vno,
            series=v_in.series,
            branch_id=v_in.branch_id,
            voucher_type=v_in.voucher_type,
            voucher_date=v_in.voucher_date,
            account_id=v_in.account_id,
            gross_amount=v_in.gross_amount,
            discount_amount=v_in.discount_amount,
            taxable_amount=v_in.taxable_amount,
            cgst_amount=v_in.cgst_amount,
            sgst_amount=v_in.sgst_amount,
            igst_amount=v_in.igst_amount,
            net_amount=v_in.net_amount,
            round_off=v_in.round_off,
            settled_fine_gold=v_in.settled_fine_gold,
            settled_fine_silver=v_in.settled_fine_silver,
            settled_cash_inr=v_in.settled_cash_inr,
            narration=v_in.narration
        )
        db.add(voucher)
        db.flush()

        for itm in v_in.items:
            v_item = VoucherItem(
                voucher_id=voucher.id,
                tag_id=itm.tag_id,
                item_id=itm.item_id,
                purity_stamp_id=itm.purity_stamp_id,
                item_description=itm.item_description,
                pieces=itm.pieces,
                gross_weight=itm.gross_weight,
                less_weight=itm.less_weight,
                net_weight=itm.net_weight,
                purity_touch=itm.purity_touch,
                wastage_percent=itm.wastage_percent,
                fine_weight=itm.fine_weight,
                metal_rate_per_gram=itm.metal_rate_per_gram,
                metal_amount=itm.metal_amount,
                labour_rate=itm.labour_rate,
                labour_amount=itm.labour_amount,
                stone_amount=itm.stone_amount,
                total_item_amount=itm.total_item_amount,
                huid_number=itm.huid_number
            )
            db.add(v_item)

        for pay in v_in.payments:
            ps = PaymentSplit(
                voucher_id=voucher.id,
                payment_mode=pay.payment_mode,
                amount=pay.amount,
                reference_no=pay.reference_no,
                bank_name=pay.bank_name,
                metal_exchange_grams=pay.metal_exchange_grams
            )
            db.add(ps)

        acc = db.query(Account).filter(Account.id == v_in.account_id).first()
        if acc:
            if v_in.voucher_type == "SALE":
                acc.balance_inr += (v_in.net_amount - v_in.settled_cash_inr)
                acc.balance_fine_silver -= v_in.settled_fine_silver

        db.commit()
        db.refresh(voucher)
        return {
            "success": True,
            "message": "Voucher created successfully",
            "voucher_id": voucher.id,
            "voucher_no": voucher.voucher_no,
            "series": voucher.series,
            "net_amount": float(voucher.net_amount)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
