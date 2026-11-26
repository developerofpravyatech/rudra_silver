// Karigar types for Rudra Silver ERP

export interface KarigarRecord {
  id: number;
  karigar_code: string;
  karigar_name: string;
  mobile?: string | null;
  alternate_mobile?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  karigar_type?: string | null;
  metal_type?: string | null;
  opening_gold_balance: number;
  opening_silver_balance: number;
  opening_diamond_balance: number;
  opening_stone_balance: number;
  opening_amount: number;
  credit_days: number;
  narration?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface KarigarFilterParams {
  search?: string;
  city?: string;
  state?: string;
  is_active?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedKarigars {
  items: KarigarRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface KarigarIssueItem {
  id?: number;
  issue_id?: number;
  item_name: string;
  item_type?: string;
  metal_type: 'GOLD' | 'SILVER' | 'OTHER';
  purity: number;
  gross_weight: number;
  net_weight: number;
  diamond_weight: number;
  stone_weight: number;
  quantity: number;
  fine_weight: number;
  labour_rate: number;
  labour_amount: number;
  remarks?: string;
}

export interface KarigarIssueRecord {
  id: number;
  voucher_no: string;
  issue_date: string;
  karigar_id: number;
  karigar_name: string;
  lot_no?: string;
  narration?: string;
  remarks?: string;
  total_gold_fine: number;
  total_silver_fine: number;
  total_diamond_wt: number;
  total_stone_wt: number;
  total_amount: number;
  status: 'OPEN' | 'PARTIAL' | 'CLOSED';
  receive_count?: number;
  items?: KarigarIssueItem[];
  created_at?: string;
}

export interface KarigarReceiveItem {
  id?: number;
  receive_id?: number;
  issue_item_id?: number;
  item_name: string;
  item_type?: string;
  metal_type: 'GOLD' | 'SILVER' | 'OTHER';
  purity: number;
  gross_weight: number;
  net_weight: number;
  diamond_weight: number;
  stone_weight: number;
  quantity: number;
  fine_weight: number;
  scrap_weight: number;
  dust_weight: number;
  loss_weight: number;
  labour_rate: number;
  labour_amount: number;
  remarks?: string;
}

export interface KarigarReceiveRecord {
  id: number;
  voucher_no: string;
  receive_date: string;
  issue_id: number;
  issue_voucher_no?: string;
  karigar_id: number;
  karigar_name: string;
  lot_no?: string;
  narration?: string;
  remarks?: string;
  total_gold_fine: number;
  total_silver_fine: number;
  total_diamond_wt: number;
  total_stone_wt: number;
  total_amount: number;
  items?: KarigarReceiveItem[];
  created_at?: string;
}

export interface KarigarOutstandingRecord {
  karigar_id: number;
  account_code: string;
  karigar_name: string;
  city?: string;
  mobile?: string;
  total_issued_gold: number;
  total_issued_silver: number;
  total_received_gold: number;
  total_received_silver: number;
  outstanding_gold: number;
  outstanding_silver: number;
  open_lots: number;
}

export interface KarigarIssueRecReport {
  issue_id: number;
  issue_voucher: string;
  issue_date: string;
  karigar_name: string;
  lot_no?: string;
  issue_status: string;
  issued_gold: number;
  issued_silver: number;
  issued_diamond: number;
  issued_stone: number;
  received_gold: number;
  received_silver: number;
  received_diamond: number;
  received_stone: number;
  balance_gold: number;
  balance_silver: number;
  receive_vouchers?: string;
}

export interface KarigarLotReport {
  lot_no: string;
  karigar_name: string;
  karigar_id: number;
  first_issue_date: string;
  last_issue_date: string;
  issue_count: number;
  total_issued_gold: number;
  total_issued_silver: number;
  total_issued_diamond: number;
  total_received_gold: number;
  total_received_silver: number;
  balance_gold: number;
  balance_silver: number;
}

export interface KarigarDiaStnBalance {
  karigar_id: number;
  account_code: string;
  karigar_name: string;
  city?: string;
  diamond_issued: number;
  diamond_received: number;
  diamond_balance: number;
  stone_issued: number;
  stone_received: number;
  stone_balance: number;
}

export interface KarigarDiaStnGroupBalance {
  karigar_id: number;
  karigar_name: string;
  group_name: string;
  item_category: string;
  issued_qty: number;
  issued_diamond: number;
  issued_stone: number;
  received_qty: number;
  received_diamond: number;
  received_stone: number;
  pending_qty: number;
  weight_balance: number;
}

export interface KarigarDiaStnIssueRec {
  tx_date: string;
  voucher_no: string;
  tx_type: 'ISSUE' | 'RECEIVE';
  karigar_name: string;
  lot_no?: string;
  item_name: string;
  item_type?: string;
  issue_qty: number;
  receive_qty: number;
  diamond_weight: number;
  stone_weight: number;
}
