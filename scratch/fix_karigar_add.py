p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\karigar\KarigarAddPage.tsx"
s = open(p, encoding='utf-8').read()

old_empty = """const EMPTY: Partial<KarigarRecord> = {
  account_code: '', name: '', mobile: '', phone: '', email: '',
  address: '', city: '', state: 'Gujarat', pincode: '',
  balance_inr: 0, balance_fine_gold: 0, balance_fine_silver: 0,
  default_labour_rate: 0, permissible_loss_percent: 0,
  credit_days: 0, credit_limit_inr: 0, is_active: 1,
};"""
new_empty = """const EMPTY: Partial<KarigarRecord> = {
  karigar_code: '', karigar_name: '', mobile: '', alternate_mobile: '', email: '',
  address: '', city: '', state: 'Gujarat', pincode: '',
  karigar_type: '', metal_type: '',
  opening_gold_balance: 0, opening_silver_balance: 0,
  opening_diamond_balance: 0, opening_stone_balance: 0,
  opening_amount: 0, narration: '', status: 'Active',
};"""
assert old_empty in s
s = s.replace(old_empty, new_empty, 1)

s = s.replace("if (!form.name?.trim()) { setError('Karigar Name is required.'); return; }",
              "if (!form.karigar_name?.trim()) { setError('Karigar Name is required.'); return; }", 1)
s = s.replace("if (!form.account_code?.trim()) { setError('Karigar Code is required.'); return; }",
              "if (!form.karigar_code?.trim()) { setError('Karigar Code is required.'); return; }", 1)

# next code
s = s.replace("fetchKarigarNextCode().then(code => setForm(f => ({ ...f, account_code: code })))",
              "fetchKarigarNextCode().then(code => setForm(f => ({ ...f, karigar_code: code })))", 1)

# form fields
s = s.replace("value={form.account_code ?? ''} onChange={v => set('account_code', v)}",
              "value={form.karigar_code ?? ''} onChange={v => set('karigar_code', v)}", 1)
s = s.replace("value={form.name ?? ''} onChange={v => set('name', v)}",
              "value={form.karigar_name ?? ''} onChange={v => set('karigar_name', v)}", 1)
s = s.replace("value={form.phone ?? ''} onChange={v => set('phone', v)}",
              "value={form.alternate_mobile ?? ''} onChange={v => set('alternate_mobile', v)}", 1)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY