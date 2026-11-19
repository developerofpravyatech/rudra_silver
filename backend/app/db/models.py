from sqlalchemy import (
    Column, Integer, BigInteger, String, Numeric, Date, DateTime, 
    ForeignKey, Text, Boolean, Enum
)
from sqlalchemy.orm import relationship
from app.db.session import Base

class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(String(255))
    city = Column(String(50))
    state = Column(String(50), default="Gujarat")
    pincode = Column(String(10))
    phone = Column(String(30))
    gstin = Column(String(20))
    pan_no = Column(String(15))
    is_active = Column(Boolean, default=True)

class Counter(Base):
    __tablename__ = "counters"
    id = Column(Integer, primary_key=True, autoincrement=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    code = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)

class AccountGroup(Base):
    __tablename__ = "account_groups"
    id = Column(Integer, primary_key=True, autoincrement=True)
    parent_id = Column(Integer, ForeignKey("account_groups.id"), nullable=True)
    name = Column(String(100), unique=True, nullable=False)
    nature = Column(Enum("ASSET", "LIABILITY", "INCOME", "EXPENSE"), nullable=False)

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    account_code = Column(String(30), unique=True, nullable=False)
    group_id = Column(Integer, ForeignKey("account_groups.id"), nullable=False)
    name = Column(String(120), nullable=False)
    company_name = Column(String(120))
    account_type = Column(
        Enum("CUSTOMER", "SUPPLIER", "KARIGAR", "BROKER", "BANK", "CASH", "EXPENSE", "GIRVI_LOAN"),
        nullable=False
    )
    mobile = Column(String(30), nullable=False)
    phone = Column(String(30))
    email = Column(String(100))
    address = Column(String(255))
    city = Column(String(60))
    state = Column(String(60), default="Gujarat")
    gstin = Column(String(20))
    pan_no = Column(String(15))
    aadhaar_no = Column(String(20))
    dob = Column(Date)
    anniversary_date = Column(Date)
    credit_days = Column(Integer, default=0)
    credit_limit_inr = Column(Numeric(14, 2), default=0.00)

    # Triple Currency Balances
    balance_inr = Column(Numeric(15, 2), default=0.00)
    balance_fine_gold = Column(Numeric(12, 3), default=0.000)
    balance_fine_silver = Column(Numeric(12, 3), default=0.000)

    default_labour_rate = Column(Numeric(10, 2), default=0.00)
    default_wastage_percent = Column(Numeric(5, 2), default=0.00)
    permissible_loss_percent = Column(Numeric(5, 2), default=0.00)
    is_active = Column(Boolean, default=True)

    group = relationship("AccountGroup")

class PurityStamp(Base):
    __tablename__ = "purity_stamps"
    id = Column(Integer, primary_key=True, autoincrement=True)
    metal_type = Column(Enum("GOLD", "SILVER", "PLATINUM", "DIAMOND"), nullable=False)
    name = Column(String(50), unique=True, nullable=False)
    touch_purity = Column(Numeric(6, 2), nullable=False)
    huid_mandatory = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, autoincrement=True)
    metal_type = Column(Enum("GOLD", "SILVER", "PLATINUM", "DIAMOND"), nullable=False)
    name = Column(String(80), unique=True, nullable=False)
    hsn_code = Column(String(20), default="7113")

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(30), unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String(100), nullable=False)
    default_stamp_id = Column(Integer, ForeignKey("purity_stamps.id"), nullable=False)
    default_wastage = Column(Numeric(6, 2), default=0.00)
    default_labour_rate = Column(Numeric(10, 2), default=0.00)
    labour_type = Column(Enum("PER_GRAM_NET", "PER_GRAM_GROSS", "PER_PIECE", "PERCENTAGE"), default="PER_GRAM_NET")
    hsn_code = Column(String(20), default="7113")
    is_active = Column(Boolean, default=True)

    category = relationship("Category")
    default_stamp = relationship("PurityStamp")

class InventoryTag(Base):
    __tablename__ = "inventory_tags"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tag_number = Column(String(50), unique=True, nullable=False)
    rfid_epc = Column(String(64), unique=True, nullable=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    purity_stamp_id = Column(Integer, ForeignKey("purity_stamps.id"), nullable=False)
    counter_id = Column(Integer, ForeignKey("counters.id"), nullable=True)
    tray_number = Column(String(30))

    gross_weight = Column(Numeric(10, 3), nullable=False)
    less_weight = Column(Numeric(10, 3), default=0.000)
    net_weight = Column(Numeric(10, 3), nullable=False)
    purity_touch = Column(Numeric(6, 2), nullable=False)
    wastage_percent = Column(Numeric(6, 2), default=0.00)
    fine_weight = Column(Numeric(10, 3), nullable=False)

    labour_rate = Column(Numeric(10, 2), default=0.00)
    labour_code = Column(String(20))
    other_charges = Column(Numeric(10, 2), default=0.00)
    huid_number = Column(String(20))
    image_url = Column(String(255))
    status = Column(Enum("IN_STOCK", "ON_APPROVAL", "SOLD", "MELTED", "TRANSFERRED"), default="IN_STOCK")

    item = relationship("Item")
    purity_stamp = relationship("PurityStamp")

class Voucher(Base):
    __tablename__ = "vouchers"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    voucher_no = Column(Integer, nullable=False)
    series = Column(String(20), default="GST")
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    voucher_type = Column(
        Enum(
            "SALE", "PURCHASE", "SALE_RETURN", "PURCHASE_RETURN", 
            "APPROVAL_ISSUE", "APPROVAL_RETURN", "RECEIPT", "PAYMENT", 
            "CONTRA", "JOURNAL", "BHAV_CUT_GOLD", "BHAV_CUT_SILVER", 
            "METAL_RECEIPT", "METAL_PAYMENT", "ORDER_ADVANCE"
        ),
        nullable=False
    )
    voucher_date = Column(Date, nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)

    gross_amount = Column(Numeric(15, 2), default=0.00)
    discount_amount = Column(Numeric(12, 2), default=0.00)
    taxable_amount = Column(Numeric(15, 2), default=0.00)
    cgst_amount = Column(Numeric(12, 2), default=0.00)
    sgst_amount = Column(Numeric(12, 2), default=0.00)
    igst_amount = Column(Numeric(12, 2), default=0.00)
    net_amount = Column(Numeric(15, 2), default=0.00)
    round_off = Column(Numeric(6, 2), default=0.00)

    settled_fine_gold = Column(Numeric(12, 3), default=0.000)
    settled_fine_silver = Column(Numeric(12, 3), default=0.000)
    settled_cash_inr = Column(Numeric(15, 2), default=0.00)

    narration = Column(String(255))
    account = relationship("Account")
    items = relationship("VoucherItem", back_populates="voucher", cascade="all, delete-orphan")
    payments = relationship("PaymentSplit", back_populates="voucher", cascade="all, delete-orphan")

class VoucherItem(Base):
    __tablename__ = "voucher_items"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    voucher_id = Column(BigInteger, ForeignKey("vouchers.id"), nullable=False)
    tag_id = Column(BigInteger, ForeignKey("inventory_tags.id"), nullable=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    purity_stamp_id = Column(Integer, ForeignKey("purity_stamps.id"), nullable=False)
    item_description = Column(String(150), nullable=False)

    pieces = Column(Integer, default=1)
    gross_weight = Column(Numeric(10, 3), nullable=False)
    less_weight = Column(Numeric(10, 3), default=0.000)
    net_weight = Column(Numeric(10, 3), nullable=False)
    purity_touch = Column(Numeric(6, 2), nullable=False)
    wastage_percent = Column(Numeric(6, 2), default=0.00)
    fine_weight = Column(Numeric(10, 3), nullable=False)

    metal_rate_per_gram = Column(Numeric(12, 2), nullable=False)
    metal_amount = Column(Numeric(15, 2), nullable=False)
    labour_rate = Column(Numeric(10, 2), default=0.00)
    labour_amount = Column(Numeric(12, 2), default=0.00)
    stone_amount = Column(Numeric(12, 2), default=0.00)
    total_item_amount = Column(Numeric(15, 2), nullable=False)
    huid_number = Column(String(20))

    voucher = relationship("Voucher", back_populates="items")
    tag = relationship("InventoryTag")
    item = relationship("Item")
    purity_stamp = relationship("PurityStamp")

class PaymentSplit(Base):
    __tablename__ = "payment_splits"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    voucher_id = Column(BigInteger, ForeignKey("vouchers.id"), nullable=False)
    payment_mode = Column(
        Enum("CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "POS_CARD", "OLD_METAL_EXCHANGE"),
        nullable=False
    )
    amount = Column(Numeric(15, 2), nullable=False)
    reference_no = Column(String(60))
    bank_name = Column(String(80))
    metal_exchange_grams = Column(Numeric(10, 3), default=0.000)

    voucher = relationship("Voucher", back_populates="payments")

class DailyBoardRate(Base):
    __tablename__ = "daily_board_rates"
    id = Column(Integer, primary_key=True, autoincrement=True)
    rate_date = Column(Date, unique=True, nullable=False)
    gold_24k_buy_rate = Column(Numeric(10, 2), nullable=False)
    gold_24k_sell_rate = Column(Numeric(10, 2), nullable=False)
    gold_22k_rate = Column(Numeric(10, 2), nullable=False)
    silver_pure_buy_rate = Column(Numeric(10, 2), nullable=False)
    silver_pure_sell_rate = Column(Numeric(10, 2), nullable=False)
    silver_925_rate = Column(Numeric(10, 2), nullable=False)

import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum("ADMIN", "STAFF"), default="STAFF", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
