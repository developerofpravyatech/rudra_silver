from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from decimal import Decimal
import datetime

class ItemCalculateRequest(BaseModel):
    gross_weight: Decimal = Field(..., ge=0)
    less_weight: Decimal = Field(default=Decimal('0.000'), ge=0)
    purity_touch: Decimal = Field(..., ge=0, le=100)
    wastage_percent: Decimal = Field(default=Decimal('0.00'), ge=0)
    metal_rate_per_gram: Decimal = Field(..., ge=0)
    labour_rate: Decimal = Field(default=Decimal('0.00'), ge=0)
    labour_type: str = "PER_GRAM_NET"
    stone_amount: Decimal = Field(default=Decimal('0.00'), ge=0)
    pieces: int = 1

class ItemCalculateResponse(BaseModel):
    net_weight: Decimal
    effective_purity: Decimal
    fine_weight: Decimal
    metal_amount: Decimal
    labour_amount: Decimal
    stone_amount: Decimal
    total_item_amount: Decimal

class AccountBase(BaseModel):
    account_code: str
    name: str
    company_name: Optional[str] = None
    account_type: str
    group_id: int
    mobile: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = "Gujarat"
    gstin: Optional[str] = None
    pan_no: Optional[str] = None

class AccountResponse(AccountBase):
    id: int
    balance_inr: Decimal
    balance_fine_gold: Decimal
    balance_fine_silver: Decimal
    is_active: bool

    class Config:
        from_attributes = True

class TagResponse(BaseModel):
    id: int
    tag_number: str
    rfid_epc: Optional[str] = None
    item_id: int
    item_name: Optional[str] = None
    purity_stamp_name: Optional[str] = None
    gross_weight: Decimal
    less_weight: Decimal
    net_weight: Decimal
    purity_touch: Decimal
    wastage_percent: Decimal
    fine_weight: Decimal
    labour_rate: Decimal
    labour_code: Optional[str] = None
    huid_number: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class DailyRateResponse(BaseModel):
    id: int
    rate_date: datetime.date
    gold_24k_buy_rate: Decimal
    gold_24k_sell_rate: Decimal
    gold_22k_rate: Decimal
    silver_pure_buy_rate: Decimal
    silver_pure_sell_rate: Decimal
    silver_925_rate: Decimal

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "STAFF"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class VoucherItemCreate(BaseModel):
    tag_id: Optional[int] = None
    item_id: int
    purity_stamp_id: int
    item_description: str
    pieces: int = 1
    gross_weight: Decimal
    less_weight: Decimal = Decimal('0.000')
    net_weight: Decimal
    purity_touch: Decimal
    wastage_percent: Decimal = Decimal('0.00')
    fine_weight: Decimal
    metal_rate_per_gram: Decimal
    metal_amount: Decimal
    labour_rate: Decimal = Decimal('0.00')
    labour_amount: Decimal = Decimal('0.00')
    stone_amount: Decimal = Decimal('0.00')
    total_item_amount: Decimal
    huid_number: Optional[str] = None

class PaymentSplitCreate(BaseModel):
    payment_mode: str
    amount: Decimal
    reference_no: Optional[str] = None
    bank_name: Optional[str] = None
    metal_exchange_grams: Optional[Decimal] = Decimal('0.000')

class VoucherCreate(BaseModel):
    branch_id: int
    account_id: int
    voucher_type: str = "SALE"
    voucher_date: datetime.date
    series: str = "GST"
    gross_amount: Decimal
    discount_amount: Decimal = Decimal('0.00')
    taxable_amount: Decimal
    cgst_amount: Decimal = Decimal('0.00')
    sgst_amount: Decimal = Decimal('0.00')
    igst_amount: Decimal = Decimal('0.00')
    net_amount: Decimal
    round_off: Decimal = Decimal('0.00')
    settled_fine_gold: Decimal = Decimal('0.000')
    settled_fine_silver: Decimal = Decimal('0.000')
    settled_cash_inr: Decimal = Decimal('0.00')
    narration: Optional[str] = None
    items: List[VoucherItemCreate]
    payments: List[PaymentSplitCreate]

class DailySummaryResponse(BaseModel):
    date: datetime.date
    opening_cash: Decimal
    closing_cash: Decimal
    voucher_counts: Dict[str, int]

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "STAFF"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
