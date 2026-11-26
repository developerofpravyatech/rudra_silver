p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\karigar\KarigarEditPage.tsx"
s = open(p, encoding='utf-8').read()

s = s.replace("onChange={v => set('balance_inr', v)}", "onChange={v => set('opening_amount', v)}", 1)
s = s.replace("onChange={v => set('balance_fine_gold', v)}", "onChange={v => set('opening_gold_balance', v)}", 1)
s = s.replace("onChange={v => set('balance_fine_silver', v)}", "onChange={v => set('opening_silver_balance', v)}", 1)
s = s.replace("onChange={v => set('default_labour_rate', v)}", "onChange={v => set('opening_gold_balance', v)}", 1)
s = s.replace("onChange={v => set('permissible_loss_percent', v)}", "onChange={v => set('opening_diamond_balance', v)}", 1)
s = s.replace("onChange={v => set('credit_days', v)}", "onChange={v => set('opening_stone_balance', v)}", 1)
s = s.replace("onChange={e => set('is_active', e.target.checked ? 1 : 0)}", "onChange={e => set('status', e.target.checked ? 'Active' : 'Inactive')}", 1)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY