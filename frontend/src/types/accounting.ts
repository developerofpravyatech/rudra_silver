export type AccountNature = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';

export interface AccountGroup {
  id: number;
  parent_id?: number | null;
  parent_name?: string | null;
  name: string;
  code?: string | null;
  nature: AccountNature;
  description?: string | null;
  is_active: number | boolean;
  child_count?: number;
  account_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type BalanceType = 'DR' | 'CR' | 'NIL';

export interface Ledger {
  id: number;
  ledger_code: string;
  ledger_name: string;
  group_id: number;
  group_name?: string;
  group_nature?: AccountNature;
  opening_balance: number;
  opening_balance_type: BalanceType;
  opening_balance_date?: string | null;
  address?: string | null;
  mobile?: string | null;
  city?: string | null;
  state?: string | null;
  gst_no?: string | null;
  pan_no?: string | null;
  email?: string | null;
  contact_person?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  account_ref_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface LedgerPosting {
  id: number;
  ledger_id: number;
  ledger_name?: string;
  ledger_code?: string;
  voucher_id?: number | null;
  reference_type?: string | null;
  reference_id?: number | null;
  debit: number;
  credit: number;
  running_balance: number;
  balance_type: 'DR' | 'CR';
  posting_date: string;
  narration?: string | null;
  is_opening: number;
  voucher_type?: string;
  voucher_no?: number;
  series?: string;
}

export interface VoucherEntryItem {
  id?: number;
  voucher_id?: number;
  ledger_id: number;
  ledger_name?: string;
  ledger_code?: string;
  debit_amount: number;
  credit_amount: number;
  narration?: string;
}

export type AccountingVoucherType = 'RECEIPT' | 'PAYMENT' | 'CONTRA' | 'JOURNAL';

export interface AccountingVoucher {
  id: number;
  voucher_no: number;
  series?: string;
  branch_id?: number;
  voucher_type: AccountingVoucherType;
  voucher_date: string;
  account_id: number;
  account_name?: string;
  account_mobile?: string;
  second_account_id?: number | null;
  second_account_name?: string | null;
  net_amount: number;
  narration?: string | null;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  entries?: VoucherEntryItem[];
  created_at?: string;
  updated_at?: string;
}

export interface TrialBalanceRow {
  ledger_id: number;
  ledger_name: string;
  ledger_code: string;
  group_name: string;
  nature: AccountNature;
  total_dr: number;
  total_cr: number;
  balance: number;
  balance_type: 'DR' | 'CR';
  dr_balance: number;
  cr_balance: number;
}

export interface TrialBalanceResponse {
  rows: TrialBalanceRow[];
  total_dr: number;
  total_cr: number;
  is_balanced: boolean;
}

export interface OutstandingRow {
  id: number;
  ledger_name: string;
  ledger_code: string;
  group_name: string;
  total_dr: number;
  total_cr: number;
  balance: number;
  balance_type: 'DR' | 'CR';
}

export interface ProfitLossResponse {
  income: Array<{ nature: string; group_name: string; ledger_name: string; amount: number }>;
  expense: Array<{ nature: string; group_name: string; ledger_name: string; amount: number }>;
  total_income: number;
  total_expense: number;
  net_profit: number;
}

export interface BalanceSheetResponse {
  assets: TrialBalanceRow[];
  liabilities: TrialBalanceRow[];
  total_assets: number;
  total_liabilities: number;
  is_balanced: boolean;
}

export interface OpenInvoiceItem {
  invoice_source: 'SALE_REGISTER' | 'PURCHASE_REGISTER' | 'VOUCHER';
  invoice_id: number;
  voucher_no: string;
  voucher_date: string;
  party_name: string;
  particulars: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: 'UNPAID' | 'PARTIAL' | 'PAID';
}

export interface VoucherAllocationInput {
  invoice_source: 'SALE_REGISTER' | 'PURCHASE_REGISTER' | 'VOUCHER';
  invoice_id: number;
  allocated_amount: number;
}

export interface InvoiceStatusReportRow extends OpenInvoiceItem {
  allocations?: Array<{
    allocated_amount: number;
    voucher_id: number;
    voucher_no: number;
    series: string;
    voucher_type: string;
    voucher_date: string;
    payment_mode?: string;
  }>;
}
