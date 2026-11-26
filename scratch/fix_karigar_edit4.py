p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\karigar\KarigarEditPage.tsx"
s = open(p, encoding='utf-8').read()

s = s.replace("value={form.phone ?? ''} onChange={v => set('phone', v)}",
              "value={form.alternate_mobile ?? ''} onChange={v => set('alternate_mobile', v)}", 1)
s = s.replace("value={form.email ?? ''} onChange={v => set('email', v)}",
              "value={form.narration ?? ''} onChange={v => set('narration', v)}", 1)
s = s.replace("value={Number(form.balance_fine_gold ?? 0)}", "value={Number(form.opening_gold_balance ?? 0)}", 1)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY