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
  from_date?: string;
  to_date?: string;
  state?: string;
  group_id?: string | number;
  group_name?: string;
  balance_filter?: 'all' | 'with_balance' | 'zero_balance' | 'dia_stn_balance' | string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DailyBalanceFilterOptions {
  cities: string[];
  states: string[];
  groups: { id: number; name: string }[];
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

