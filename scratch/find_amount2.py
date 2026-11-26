p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\purchaseRegister\PurchaseRegisterListPage.tsx"
lines = open(p, encoding='utf-8').read().splitlines()
out = []
for i, l in enumerate(lines):
    if 'fmtCurr(r.amount)' in l and 'td' in l:
        out.append(str(i+1))
        out.append(lines[i])
        out.append(lines[i+1])
        break
open(r"D:\xampp\htdocs\Rudra-silver\scratch\amount_line.txt", "w", encoding='utf-8').write("\n".join(out))
print("done")
PY