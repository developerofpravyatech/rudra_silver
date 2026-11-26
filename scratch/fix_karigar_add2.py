p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\karigar\KarigarAddPage.tsx"
s = open(p, encoding='utf-8').read()

# Opening balances section
s = s.replace("value={form.balance_inr ?? 0} onChange={v => set('balance_inr', v)}",
              "value={form.opening_amount ?? 0} onChange={v => set('opening_amount', v)}", 1)
s = s.replace("value={form.balance_fine_gold ?? 0} onChange={v => set('balance_fine_gold', v)}",
              "value={form.opening_gold_balance ?? 0} onChange={v => set('opening_gold_balance', v)}", 1)
s = s.replace("value={form.balance_fine_silver ?? 0} onChange={v => set('balance_fine_silver', v)}",
              "value={form.opening_silver_balance ?? 0} onChange={v => set('opening_silver_balance', v)}", 1)

# Business terms section -> map to opening diamond/stone
s = s.replace("value={form.default_labour_rate ?? 0} onChange={v => set('default_labour_rate', v)}",
              "value={form.opening_diamond_balance ?? 0} onChange={v => set('opening_diamond_balance', v)}", 1)
s = s.replace("value={form.permissible_loss_percent ?? 0} onChange={v => set('permissible_loss_percent', v)}",
              "value={form.opening_stone_balance ?? 0} onChange={v => set('opening_stone_balance', v)}", 1)
s = s.replace("value={form.credit_days ?? 0} onChange={v => set('credit_days', v)}",
              "value={form.opening_amount ?? 0} onChange={v => set('opening_amount', v)}", 1)

# Alternate phone field
s = s.replace("value={form.phone ?? ''} onChange={v => set('phone', v)}",
              "value={form.alternate_mobile ?? ''} onChange={v => set('alternate_mobile', v)}", 1)
# Email field -> narration
s = s.replace("value={form.email ?? ''} onChange={v => set('email', v)}",
              "value={form.narration ?? ''} onChange={v => set('narration', v)}", 1)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY