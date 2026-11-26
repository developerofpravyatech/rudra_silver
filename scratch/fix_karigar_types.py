p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\types\karigar.ts"
s = open(p, encoding='utf-8').read()

old_record = """export interface KarigarRecord {
  id: number;
  account_code: string;
  name: string;
  mobile: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  balance_inr: number;
  balance_fine_gold: number;
  balance_fine_silver: number;
  default_labour_rate: number;
  permissible_loss_percent: number;
  credit_days?: number;
  credit_limit_inr?: number;
  is_active: number;
  group_name?: string;
  total_issues?: number;
  total_receives?: number;
  created_at?: string;
  updated_at?: string;
}"""

new_record = """export interface KarigarRecord {
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
  narration?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}"""

assert old_record in s
s = s.replace(old_record, new_record, 1)
open(p, "w", encoding='utf-8').write(s)
print("done")
PY