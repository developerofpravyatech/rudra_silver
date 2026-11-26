export interface Account {
  id: number;
  account_code: string;
  name: string;
  company_name?: string;
  account_type: 'CUSTOMER' | 'SUPPLIER' | 'KARIGAR' | 'BROKER' | 'BANK' | 'CASH';
  mobile: string;
  city?: string;
  balance_inr: number;
  balance_fine_gold: number;
  balance_fine_silver: number;
}

export interface InventoryTag {
  id: number;
  tag_number: string;
  rfid_epc?: string;
  item_id: number;
  item_name?: string;
  purity_stamp_name?: string;
  gross_weight: number;
  less_weight: number;
  net_weight: number;
  purity_touch: number;
  wastage_percent: number;
  fine_weight: number;
  labour_rate: number;
  labour_code?: string;
  huid_number?: string;
  status: string;
}

export interface DailyRates {
  id: number;
  rate_date: string;
  gold_24k_buy_rate: number;
  gold_24k_sell_rate: number;
  gold_22k_rate: number;
  silver_pure_buy_rate: number;
  silver_pure_sell_rate: number;
  silver_925_rate: number;
}

export interface DailySummary {
  date: string;
  opening_cash: number;
  closing_cash: number;
  voucher_counts: Record<string, number>;
}

export interface BillingItem {
  id: string;
  tagId?: number;
  tagNumber: string;
  description: string;
  itemId: number;
  purityStampId: number;
  pieces: number;
  grossWeight: number;
  lessWeight: number;
  netWeight: number;
  purityTouch: number;
  wastagePercent: number;
  fineWeight: number;
  metalRatePerGram: number;
  metalAmount: number;
  labourRate: number;
  labourType: 'PER_GRAM_NET' | 'PER_GRAM_GROSS' | 'PER_PIECE' | 'PERCENTAGE';
  labourAmount: number;
  stoneAmount: number;
  totalItemAmount: number;
  huidNumber?: string;
}

export interface VoucherTypeOptions {
  receipt: 'RECEIPT' | 'F2';
  payment: 'PAYMENT' | 'F5';
  contra: 'CONTRA' | 'F3';
  journal: 'JOURNAL' | 'F4';
}

export interface VoucherCommonFields {
  voucher_date: string;
  voucher_series: string;
  site: string;
  voucher_type: keyof VoucherTypeOptions;
  ledger_party_name: string;
  sub_account?: string;
  current_ledger_balance: number;
  debit_amount: number;
  credit_amount: number;
  narration: string;
  common_narration: string;
  total_debit: number;
  total_credit: number;
  difference: number;
  closing_balance: number;
}

export interface VoucherLineItem {
  id?: number;
  tag_id?: number;
  item_id: number;
  purity_stamp_id: number;
  item_description: string;
  pieces: number;
  gross_weight: number;
  less_weight: number;
  net_weight: number;
  purity_touch: number;
  wastage_percent: number;
  fine_weight: number;
  metal_rate_per_gram: number;
  metal_amount: number;
  labour_rate: number;
  labour_amount: number;
  stone_amount: number;
  total_item_amount: number;
  huid_number?: string;
}

export interface PaymentSplit {
  id?: number;
  payment_mode: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | 'POS_CARD' | 'OLD_METAL_EXCHANGE';
  amount: number;
  reference_no?: string;
  bank_name?: string;
  metal_exchange_grams?: number;
}

export interface JournalEntry {
  ledger_id: number;
  debit: number;
  credit: number;
  narration?: string;
}

export interface CreateVoucherPayload {
  voucher_date: string;
  voucher_series?: string;
  site?: string;
  voucher_type: keyof VoucherTypeOptions | string;
  account_id: number;
  sub_account?: number;
  items: any[];
  payments?: PaymentSplit[];
  narration?: string;
  common_narration?: string;
  [key: string]: any;
}

export interface AuthUser {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
  is_active: boolean;
  created_at?: string;
}

export interface UserListItem {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
  is_active: boolean;
  created_at?: string;
}

export interface PaginatedUsers {
  items: UserListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface CategoryOption {
  id: number;
  name: string;
  metal_type: string;
  hsn_code?: string;
}

export interface CategoryRecord {
  id: number;
  metal_type: 'GOLD' | 'SILVER' | 'PLATINUM' | 'DIAMOND' | string;
  name: string;
  hsn_code: string;
  item_count?: number;
}

export interface PaginatedCategories {
  items: CategoryRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CategoryFilterParams {
  search?: string;
  name?: string;
  hsn_code?: string;
  metal_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PurityStampOption {
  id: number;
  name: string;
  touch_purity: number;
  metal_type: string;
  is_active: boolean;
}

export interface ItemRecord {
  id: number;
  group_name: string;
  sgst: number;
  cgst: number;
  igst: number;
  code: string;
  category_id: number;
  name: string;
  default_stamp_id: number;
  default_wastage: number;
  default_labour_rate: number;
  labour_type: 'PER_GRAM_NET' | 'PER_GRAM_GROSS' | 'PER_PIECE' | 'PERCENTAGE' | string;
  hsn_code: string;
  job_sac: string;
  gstr1_display: string;
  l_tax: number;
  c_tax: number;
  com_co: string;
  gp_percentage: number;
  op_value: number;
  cl_value: number;
  minimum_stock: number;

  // MRP Detail
  mrp_type: string;
  value_rate: number;
  stock_method: string;
  tunch: number;
  default_item: string;
  sale_on_mrp?: string;
  divide_by?: number;
  into_by?: number;
  pur_less_pct?: number;
  sale_less_pct?: number;
  dis_types?: string;
  detail_salesman?: string;
  update_mrp_col?: string;

  // Return / Exchange Policy
  return_policy_enabled: boolean;
  return_valid_days: number;
  return_deduction_percent: number;
  exchange_policy_enabled: boolean;
  exchange_valid_days: number;
  exchange_deduction_percent: number;
  return_exchange_notes?: string | null;
  return_item_less_pct?: number;
  return_labour_less_pct?: number;
  return_diamond_less_pct?: number;
  return_stone_less_pct?: number;
  return_metal_by?: string;
  exchange_item_less_pct?: number;
  exchange_labour_less_pct?: number;
  exchange_diamond_less_pct?: number;
  exchange_stone_less_pct?: number;
  exchange_metal_by?: string;

  // Tag Gen Restriction / Card Point
  tag_gen_restricted: boolean;
  tag_prefix: string;
  min_tag_weight: number;
  max_tag_weight: number;
  card_point_enabled: boolean;
  card_point_percentage: number;
  card_points_per_gram: number;
  polish_wt?: number;
  stud_stamp?: string;
  dia_rate?: number;
  stn_rate?: number;
  re_order_level?: number;
  upload_file?: string;

  is_active: boolean;
  created_at?: string;
  updated_at?: string;

  // Joined display fields
  category_name?: string;
  category_metal_type?: string;
  stamp_name?: string;
  stamp_touch_purity?: number;
}

export interface ItemFilterOptions {
  categories: CategoryOption[];
  stamps: PurityStampOption[];
  group_names: string[];
  stock_methods: string[];
  labour_types: string[];
}

export interface ItemFilterParams {
  search?: string;
  name?: string;
  code?: string;
  group_name?: string;
  category_id?: number | string;
  is_active?: string | number;
  stock_method?: string;
  labour_type?: string;
  hsn_code?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedItems {
  items: ItemRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface StockItem {
  id: number;
  stock_code: string;
  item_name: string;
  item_id?: number | null;
  item_group_id?: number | null;
  item_group_name?: string;
  metal_type: string;
  purity_id?: number | null;
  purity_name?: string;
  touch_purity?: number;
  gross_weight: number;
  stone_weight: number;
  other_weight: number;
  net_weight: number;
  fine_weight: number;
  quantity: number;
  available_stock: number;
  minimum_stock_level: number;
  unit_id?: number | null;
  unit_code?: string;
  unit_name?: string;
  purchase_date?: string | null;
  remarks?: string | null;
  status: 'Available' | 'Low Stock' | 'Out of Stock' | string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedStockItems {
  items: StockItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface StockFilterParams {
  search?: string;
  metal_type?: string;
  item_group_id?: number | string;
  purity_id?: number | string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface StockDropdownOptions {
  item_groups: { id: number; name: string; hsn_code?: string; tunch?: number }[];
  purities: { id: number; name: string; metal_type: string; touch_purity: number }[];
  units: { id: number; code: string; name: string }[];
  metal_types: string[];
  statuses: string[];
  next_code: string;
}

export interface StockStatusRecord {
  id: number;
  item_name: string;
  unit: string | null;
  pc: number | null;
  gross_weight: number | null;
  net_weight: number | null;
  tunch: number | null;
  wastage: number | null;
  labour_weight: number | null;
  rate: number | null;
  silver_fine: number | null;
  total: number | null;
  gold_fine: number | null;
  is_sample?: boolean | number;
  created_at?: string;
}

export interface StockStatusTotals {
  total_pc: number;
  total_gross_weight: number;
  total_net_weight: number;
  total_silver_fine: number;
  total_amount: number;
  total_gold_fine?: number;
}

export interface PaginatedStockStatus {
  items: StockStatusRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  totals: StockStatusTotals;
}

export interface StockStatusFilterParams {
  search?: string;
  unit?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MetalStockRecord {
  id: number;
  stock_date: string;
  group_name: string;
  item_name: string;
  unit: string;
  pc: number;
  gross_weight: number;
  net_weight: number;
  tunch: number;
  wastage: number;
  labour_weight: number;
  rate: number;
  silver_fine: number;
  total: number;
  gold_fine: number;
  stock_type: string;
  is_approved: boolean;
  entry_no: string;
  photo: string;
  created_at?: string;
  updated_at?: string;
}

export interface MetalStockTotals {
  total_pc: number;
  total_gross_weight: number;
  total_net_weight: number;
  total_silver_fine: number;
  total_amount: number;
  total_gold_fine: number;
}

export interface PaginatedMetalStock {
  items: MetalStockRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  totals: MetalStockTotals;
}

export interface MetalStockFilterParams {
  search?: string;
  group_name?: string;
  item_name?: string;
  stock_type?: string;
  unit?: string;
  from_date?: string;
  to_date?: string;
  stock_date?: string;
  is_approved?: string | number | boolean;
  entry_wise?: boolean | string;
  entry_no?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MetalStockFilterOptions {
  groups: string[];
  items: string[];
  units: string[];
  stock_types: string[];
}

export interface DailyBalanceRecord {
  id: number;
  party_id?: number | null;
  account_name: string;
  city: string;
  mobile: string;
  phone: string;
  balance_date: string;
  payment_date: string;
  gold_fine: number;
  silver_fine: number;
  amount: number;
  diamond_weight: number;
  stone_weight: number;
  gold_gross_weight: number;
  silver_gross_weight: number;
  created_at?: string;
  updated_at?: string;
  account_state?: string;
  group_name?: string;
}

export interface DailyBalanceTotals {
  total_gold_fine: number;
  total_silver_fine: number;
  total_amount: number;
  total_diamond_weight: number;
  total_stone_weight: number;
  total_gold_gross_weight: number;
  total_silver_gross_weight: number;
}

export interface PaginatedDailyBalance {
  items: DailyBalanceRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  totals: DailyBalanceTotals;
}

export interface DailyBalanceFilterParams {
  search?: string;
  account_name?: string;
  city?: string;
  state?: string;
  location?: string;
  group_id?: string | number;
  group_name?: string;
  ref_by?: string;
  occupation?: string;
  type?: string;
  date?: string;
  opening_date?: string;
  from_date?: string;
  to_date?: string;
  balance_filter?: 'all' | 'with_balance' | 'zero_balance' | 'dia_stn_balance' | string;
  with_balance?: boolean | number;
  zero_balance?: boolean | number;
  dia_stn_balance?: boolean | number;
  opening?: boolean | number;
  hisab_final?: boolean | number;
  hisab_pending?: boolean | number;
  without_transact?: boolean | number;
  high_priority?: boolean | number;
  with_last_sp_date?: boolean | number;
  min_amount?: number;
  max_amount?: number;
  outstanding_only?: boolean | number;
  agent_hp_only?: boolean | number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DailyBalanceFilterOptions {
  cities: string[];
  states: string[];
  locations?: string[];
  groups: { id: number; name: string }[];
  ref_bys?: string[];
  occupations?: string[];
  types?: string[];
}

export interface AccountLookupItem {
  id: number;
  name: string;
  company_name?: string;
  city?: string;
  mobile?: string;
  phone?: string;
  state?: string;
}

// -------------------------------------------------------------
// CUSTOMER MANAGEMENT MODULE TYPES
// -------------------------------------------------------------

export interface CustomerRecord {
  CustomerID: number;
  Name: string;
  Address1?: string | null;
  Address2?: string | null;
  Address3?: string | null;
  FirmName?: string | null;
  Location?: string | null;
  Occupation?: string | null;
  City?: string | null;
  Pin?: string | null;
  Country?: string | null;
  Phone?: string | null;
  Mobile?: string | null;
  Email?: string | null;
  DOB?: string | null;
  Anniversary?: string | null;
  Spouse?: string | null;
  SpouseDOB?: string | null;
  Gender: 'Male' | 'Female' | 'Other';
  Married: number | boolean;
  JewKnow?: string | null;
  Education?: string | null;
  Potential: number | string;
  PANNo?: string | null;
  Aadhaar?: string | null;
  GSTNo?: string | null;
  RefBy?: string | null;
  Remarks?: string | null;
  RingSize?: string | null;
  BangleSize?: string | null;
  LeaveBlank?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface PaginatedCustomers {
  data: CustomerRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CustomerFilterParams {
  search?: string;
  name?: string;
  city?: string;
  location?: string;
  mobile?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}



// -------------------------------------------------------------
// DAILY TRANSACTION MODULE TYPES
// -------------------------------------------------------------

export interface DailyTransactionRecord {
  id: number;
  transaction_date: string;
  transaction_type: string;
  party_name: string;
  party_id?: number | null;
  ref_no?: string;
  narration?: string;
  login_name?: string;
  stamp?: string;
  voucher_type?: string;
  account_id?: number | null;
  series?: string;
  site?: string;
  group_name?: string;
  pc: number;
  gross_weight: number;
  net_weight: number;
  dia_weight: number;
  stone_weight: number;
  gold_fine: number;
  silver_fine: number;
  total_amount: number;
  is_undelivered: number;
  student_details?: string | null;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyTransactionTotals {
  total_pc: number;
  total_gross_weight: number;
  total_net_weight: number;
  total_dia_weight: number;
  total_stone_weight: number;
  total_gold_fine: number;
  total_silver_fine: number;
  total_amount: number;
}

export interface PaginatedDailyTransactions {
  items: DailyTransactionRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  totals: DailyTransactionTotals;
}

export interface DailyTransactionFilterParams {
  search?: string;
  from_date?: string;
  to_date?: string;
  group_name?: string;
  login_name?: string;
  stamp?: string;
  voucher_type?: string;
  party_name?: string;
  series?: string;
  site?: string;
  transaction_type?: string;
  is_undelivered?: boolean | number;
  stud_details?: boolean | number;
  exclude?: boolean | number;
  per_page?: number;
  date_option?: string;
  has_student_details?: boolean | number;
  accounts_only?: boolean | number;
  exclude_zero?: boolean | number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DailyTransactionFilterOptions {
  groups: string[];
  logins: string[];
  stamps: string[];
  voucher_types: string[];
  series: string[];
  sites: string[];
  types: string[];
  parties: string[];
}

// -------------------------------------------------------------
// Silver Bullion Types
// -------------------------------------------------------------

export interface SilverBullionRecord {
  id: number;
  transaction_date: string;
  voucher_no: string;
  transaction_type: 'CR' | 'DR' | string;
  party_id?: number | null;
  party_name: string;
  account_group_id?: number | null;
  account_group_name?: string;
  account_city?: string;
  user_id?: number | null;
  user_name?: string;
  salesman_id?: number | null;
  salesman_name?: string;
  agent_id?: number | null;
  agent_name?: string;
  fine_weight: number;
  silver_rate: number;
  amount: number;
  fine_weight_dr: number;
  silver_rate_dr: number;
  amount_dr: number;
  date_cr?: string;
  vou_no_cr?: string;
  ac_name_cr?: string;
  fine_cr?: number;
  p_rate_cr?: number;
  amount_cr?: number;
  date_dr?: string;
  vou_no_dr?: string;
  ac_name_dr?: string;
  fine_dr?: number;
  s_rate_dr?: number;
  amount_dr_val?: number;
  bhav: number;
  wo_sale: number;
  including_labour: number;
  exclude_rate_book: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SilverBullionTotals {
  total_cr_fine: number;
  total_cr_amount: number;
  avg_cr_rate: number;
  total_dr_fine: number;
  total_dr_amount: number;
  avg_dr_rate: number;
}

export interface SilverBullionOpening {
  fine: number;
  amount: number;
  rate: number;
  val4?: number;
}

export interface SilverBullionSummary {
  day_difference_fine: number;
  day_difference_rate: number;
  day_difference_amount: number;
  avg_rate_lg_rate: number;
  avg_rate_lg_amount: number;
  closing_fine: number;
  closing_amount: number;
  closing_rate: number;
  closing_val4?: number;
}

export interface PaginatedSilverBullion {
  items: SilverBullionRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  totals: SilverBullionTotals;
  opening_balance: SilverBullionOpening;
  summary: SilverBullionSummary;
}

export interface SilverBullionFilterParams {
  search?: string;
  from_date?: string;
  to_date?: string;
  account_group_name?: string;
  party_name?: string;
  account_city?: string;
  user_name?: string;
  salesman_name?: string;
  agent_name?: string;
  bhav?: number | boolean;
  wo_sale?: number | boolean;
  including_labour?: number | boolean;
  exclude_rate_book?: number | boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SilverBullionFilterOptions {
  groups: string[];
  parties: string[];
  cities: string[];
  users: string[];
  salesmen: string[];
  agents: string[];
}

// -------------------------------------------------------------
// Purchase Register Types
// -------------------------------------------------------------

export interface PurchaseRegisterRecord {
  id: number;
  voucher_no: string;
  voucher_date: string;
  voucher_type: string;
  party_name: string;
  account_group?: string;
  item_group?: string;
  item_code?: string;
  stamp?: string;
  branch_name?: string;
  login_name?: string;
  register_type: 'ALL' | 'TAGGED' | 'LOOSE' | 'JOB' | 'ORDER' | 'W_O_TAG' | string;
  particular: string;
  item_type?: string;
  category?: string;
  series?: string;
  quality?: string;
  weight: number;
  pieces: number;
  purchase_value: number;
  return_weight: number;
  return_pieces: number;
  purchase_return_value: number;
  gross_weight: number;
  net_weight: number;
  diamond_weight: number;
  stone_weight: number;
  tags: number;
  metal_pieces: number;
  gold_weight: number;
  silver_weight: number;
  amount: number;
  is_selected: number;
  is_approved: number;
  is_excluded: number;
  is_cancelled: number;
  include_metal: number;
  in_stock: number;
  net_value: number;
  is_active: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseRegisterTotals {
  weight: number;
  pieces: number;
  purchase_value: number;
  return_weight: number;
  return_pieces: number;
  purchase_return_value: number;
  gross_weight: number;
  net_weight: number;
  diamond_weight: number;
  stone_weight: number;
  tags: number;
  metal_pieces: number;
  gold_weight: number;
  silver_weight: number;
  amount: number;
}

export interface PurchaseRegisterSummary {
  total_records: number;
  total_weight: number;
  total_pieces: number;
  total_purchase_value: number;
  total_return_weight: number;
  total_return_pieces: number;
  total_purchase_return_value: number;
  net_purchase_value: number;
  net_purchase_weight: number;
  net_purchase_pieces: number;
  total_gross_weight: number;
  total_net_weight: number;
  total_diamond_weight: number;
  total_stone_weight: number;
  total_tags: number;
  total_metal_pieces: number;
  total_gold_weight: number;
  total_silver_weight: number;
  total_amount: number;
  avg_rate: number;
}

export interface PaginatedPurchaseRegister {
  items: PurchaseRegisterRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  totals: PurchaseRegisterTotals;
}

export interface PurchaseRegisterFilterParams {
  search?: string;
  from_date?: string;
  to_date?: string;
  party_name?: string;
  account_group?: string;
  item_group?: string;
  item_code?: string;
  stamp?: string;
  branch_name?: string;
  login_name?: string;
  register_type?: string;
  voucher_type?: string;
  quality?: string;
  item_type?: string;
  category?: string;
  series?: string;
  is_selected?: number | boolean;
  is_approved?: number | boolean;
  is_excluded?: number | boolean;
  is_cancelled?: number | boolean;
  include_metal?: number | boolean;
  in_stock?: number | boolean;
  net_value?: number | boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PurchaseRegisterFilterOptions {
  parties: string[];
  account_groups: string[];
  item_groups: string[];
  item_codes: string[];
  stamps: string[];
  branches: string[];
  logins: string[];
  qualities: string[];
  item_types: string[];
  categories: string[];
  series: string[];
  voucher_types: string[];
}

// -------------------------------------------------------------
// Sale Register Types
// -------------------------------------------------------------

export interface SaleRegisterRecord {
  id: number;
  voucher_no: string;
  voucher_date: string;
  voucher_type: string;
  party_name: string;
  account_group?: string;
  item_group?: string;
  item_code?: string;
  stamp?: string;
  branch_name?: string;
  login_name?: string;
  register_type: 'ALL' | 'TAGGED' | 'LOOSE' | 'JOB' | 'ORDER' | 'W_O_TAG' | string;
  item_name: string;
  particular: string;
  item_type: string;
  category?: string;
  series?: string;
  quality?: string;
  weight: number;
  pieces: number;
  sale_value: number;
  return_weight: number;
  return_pieces: number;
  sale_return_value: number;
  gross_weight: number;
  net_weight: number;
  diamond_weight: number;
  stone_weight: number;
  tags: number;
  metal_pieces: number;
  gold_weight: number;
  silver_weight: number;
  amount: number;
  is_selected: number;
  is_approved: number;
  is_excluded: number;
  include_metal: number;
  is_sold: number;
  in_stock: number;
  net_value: number;
  is_active: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SaleRegisterTotals {
  weight: number;
  pieces: number;
  sale_value: number;
  return_weight: number;
  return_pieces: number;
  sale_return_value: number;
  gross_weight: number;
  net_weight: number;
  diamond_weight: number;
  stone_weight: number;
  tags: number;
  metal_pieces: number;
  gold_weight: number;
  silver_weight: number;
  amount: number;
}

export interface SaleRegisterSummary {
  total_records: number;
  total_weight: number;
  total_pieces: number;
  total_sale_value: number;
  total_return_weight: number;
  total_return_pieces: number;
  total_sale_return_value: number;
  net_sale_value: number;
  net_sale_weight: number;
  net_sale_pieces: number;
  total_gross_weight: number;
  total_net_weight: number;
  total_diamond_weight: number;
  total_stone_weight: number;
  total_tags: number;
  total_metal_pieces: number;
  total_gold_weight: number;
  total_silver_weight: number;
  total_amount: number;
  avg_rate: number;
  total_sold_items: number;
}

export interface PaginatedSaleRegister {
  items: SaleRegisterRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  totals: SaleRegisterTotals;
}

export interface SaleRegisterFilterParams {
  search?: string;
  from_date?: string;
  to_date?: string;
  party_name?: string;
  account_group?: string;
  item_group?: string;
  item_code?: string;
  stamp?: string;
  branch_name?: string;
  item_type?: string;
  category?: string;
  series?: string;
  quality?: string;
  voucher_type?: string;
  register_type?: string;
  is_sold?: number | boolean;
  in_stock?: number | boolean;
  net_value?: number | boolean;
  is_approved?: number | boolean;
  is_excluded?: number | boolean;
  include_metal?: number | boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SaleRegisterFilterOptions {
  parties: string[];
  account_groups: string[];
  item_groups: string[];
  item_codes: string[];
  stamps: string[];
  branches: string[];
  item_types: string[];
  categories: string[];
  series: string[];
  qualities: string[];
  voucher_types: string[];
}

// -------------------------------------------------------------
// Customer Wise Profit Report Types
// -------------------------------------------------------------

export interface CustomerProfitDetailedRecord {
  account_name: string;
  sold_gold_weight: number;
  sold_silver_weight: number;
  profit_gold_fine: number;
  profit_silver_fine: number;
  profit_in_amount: number;
  voucher_count: number;
  branch_name?: string;
  account_group?: string;
}

export interface CustomerProfitVoucherRecord {
  id: number;
  voucher_date: string;
  voucher_no: string;
  party_name: string;
  item_name: string;
  gold_weight: number;
  silver_weight: number;
  profit_gold_fine: number;
  profit_silver_fine: number;
  profit_in_amount: number;
  sale_value?: number;
  amount?: number;
  branch_name?: string;
  account_group?: string;
}

export interface CustomerProfitAvgRates {
  gold_avg_purchase_rate: number;
  silver_avg_purchase_rate: number;
}

export interface CustomerProfitSummary {
  total_customers: number;
  total_vouchers: number;
  gold_weight: number;
  silver_weight: number;
  gold_profit_fine: number;
  silver_profit_fine: number;
  profit_in_amount: number;
  gold_avg_rate: number;
  silver_avg_rate: number;
}

export interface CustomerProfitFilterParams {
  search?: string;
  from_date?: string;
  to_date?: string;
  city?: string;
  group?: string;
  salesman?: string;
  site?: string;
  report_type?: 'detailed' | 'voucher_wise';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerProfitFilterOptions {
  cities: string[];
  groups: string[];
  salesmen: string[];
  sites: string[];
}

export interface PaginatedCustomerProfit {
  items: (CustomerProfitDetailedRecord | CustomerProfitVoucherRecord)[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  report_type: 'detailed' | 'voucher_wise';
  avg_rates: CustomerProfitAvgRates;
}

// -------------------------------------------------------------
// Age Wise List / Ageing Analysis Types
// -------------------------------------------------------------

export interface AccountGroupItem {
  id: number;
  parent_id: number | null;
  name: string;
  nature: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | string;
  account_count: number;
}

export interface AgeWiseFilterOptions {
  cities: string[];
  locations: string[];
  ref_by_list: string[];
  groups: AccountGroupItem[];
}

export interface AgeWiseBuckets {
  current: number;
  bucket_1: number;
  bucket_2: number;
  bucket_3: number;
  old: number;
  total: number;
}

export interface AgeWisePartyRow {
  party_key: string;
  account_id: number | null;
  account_name: string;
  city: string;
  location: string;
  ref_by: string;
  group_id: number | null;
  group_name: string;
  cash: AgeWiseBuckets;
  gold: AgeWiseBuckets;
  silver: AgeWiseBuckets;
}

export interface AgeWiseBucketLabels {
  current: string;
  bucket_1: string;
  bucket_2: string;
  bucket_3: string;
  old: string;
}

export interface AgeWiseTotals {
  cash: AgeWiseBuckets;
  gold: AgeWiseBuckets;
  silver: AgeWiseBuckets;
}

export interface AgeWiseFilterParams {
  as_on_date?: string;
  group_ids?: number[];
  city?: string;
  location?: string;
  ref_by?: string;
  interval?: number;
  balance_type?: 'gold' | 'silver';
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedAgeWiseReport {
  items: AgeWisePartyRow[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  as_on_date: string;
  interval: number;
  balance_type: 'gold' | 'silver';
  bucket_labels: AgeWiseBucketLabels;
  totals: AgeWiseTotals;
}

export interface AgeWiseLedgerEntry {
  transaction_date: string;
  voucher_no: string;
  voucher_type: string;
  particulars: string;
  debit: number;
  credit: number;
  gold_balance: number;
  silver_balance: number;
  outstanding_amount: number;
}

export interface AgeWiseLedgerResponse {
  found: boolean;
  account_name: string;
  city: string;
  location?: string;
  ref_by?: string;
  group_name: string;
  as_on_date: string;
  entries: AgeWiseLedgerEntry[];
  closing: {
    debit: number;
    credit: number;
    outstanding_amount: number;
    gold_balance: number;
    silver_balance: number;
  };
}

export * from './karigar';

export * from './accounting';
