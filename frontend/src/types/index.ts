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
