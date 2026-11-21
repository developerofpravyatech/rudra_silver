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

export interface ItemRecord {
  id: number;
  group_name: string;
  sgst: number;
  cgst: number;
  igst: number;
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

  // Return / Exchange Policy
  return_policy_enabled: boolean;
  return_valid_days: number;
  return_deduction_percent: number;
  exchange_policy_enabled: boolean;
  exchange_valid_days: number;
  exchange_deduction_percent: number;
  return_exchange_notes?: string | null;

  // Tag Gen Restriction / Card Point
  tag_gen_restricted: boolean;
  tag_prefix: string;
  min_tag_weight: number;
  max_tag_weight: number;
  card_point_enabled: boolean;
  card_point_percentage: number;
  card_points_per_gram: number;

  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedItems {
  items: ItemRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
