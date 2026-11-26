import re

files = [
    r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\saleRegister\SaleRegisterListPage.tsx",
    r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\purchaseRegister\PurchaseRegisterListPage.tsx",
]

for p in files:
    s = open(p, encoding='utf-8').read()
    # Remove Actions header
    s = s.replace('                  <th className="py-3 px-3 text-center">Actions</th>\n', '', 1)
    # Remove the action td cell block
    pattern = re.compile(r'                      <td className="py-2\.5 px-3 text-center">\n.*?                      </td>\n', re.S)
    s2 = pattern.sub('', s, count=1)
    if s2 == s:
        print("NO TD REMOVED in", p)
    else:
        print("TD removed in", p)
    open(p, "w", encoding='utf-8').write(s2)
print("done")
PY