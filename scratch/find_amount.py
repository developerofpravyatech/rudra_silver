p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\purchaseRegister\PurchaseRegisterListPage.tsx"
lines = open(p, encoding='utf-8').read().splitlines()
for i, l in enumerate(lines):
    if 'fmtCurr(r.amount)' in l and 'td' in l:
        print(i+1)
        print(repr(lines[i]))
        print(repr(lines[i+1]))
        break
PY