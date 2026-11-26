p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\karigar\KarigarEditPage.tsx"
s = open(p, encoding='utf-8').read()

s = s.replace("if (!form.name?.trim()) { setError('Karigar Name is required.'); return; }",
              "if (!form.karigar_name?.trim()) { setError('Karigar Name is required.'); return; }", 1)
s = s.replace("if (!form.account_code?.trim()) { setError('Karigar Code is required.'); return; }",
              "if (!form.karigar_code?.trim()) { setError('Karigar Code is required.'); return; }", 1)

# field references in JSX
s = s.replace("form.name", "form.karigar_name", 10)
s = s.replace("form.account_code", "form.karigar_code", 10)
s = s.replace("form.is_active", "form.status", 10)
s = s.replace("form.balance_fine_silver", "form.opening_silver_balance", 10)
s = s.replace("form.balance_inr", "form.opening_amount", 10)
s = s.replace("form.default_labour_rate", "form.opening_gold_balance", 10)
s = s.replace("form.permissible_loss_percent", "form.opening_diamond_balance", 10)
s = s.replace("form.credit_days", "form.opening_stone_balance", 10)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY