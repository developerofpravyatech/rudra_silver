p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\stock\StockAddPage.tsx"
s = open(p, encoding='utf-8').read()

repls = [
 ("errs.item_name = 'Item Name is required.';", "errs.item_name = 'This field is required.';"),
 ("errs.unit = 'Unit is required.';", "errs.unit = 'This field is required.';"),
 ("errs.pc = 'Pieces is required.';", "errs.pc = 'This field is required.';"),
 ("errs.gross_weight = 'Gross Weight is required.';", "errs.gross_weight = 'This field is required.';"),
 ("errs.net_weight = 'Net Weight is required.';", "errs.net_weight = 'This field is required.';"),
 ("errs.tunch = 'Tunch is required.';", "errs.tunch = 'This field is required.';"),
 ("errs.wastage = 'Wastage is required.';", "errs.wastage = 'This field is required.';"),
 ("errs.labour_weight = 'Labour Weight is required.';", "errs.labour_weight = 'This field is required.';"),
 ("errs.rate = 'Rate is required.';", "errs.rate = 'This field is required.';"),
 ("errs.silver_fine = 'Silver Fine is required.';", "errs.silver_fine = 'This field is required.';"),
 ("errs.total = 'Total Amount is required.';", "errs.total = 'This field is required.';"),
 ("errs.gold_fine = 'Gold Fine is required.';", "errs.gold_fine = 'This field is required.';"),
]
for a,b in repls:
    if a in s:
        s = s.replace(a,b,1)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY