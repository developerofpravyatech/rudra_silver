p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\App.tsx"
s = open(p, encoding='utf-8').read()
s = s.replace("import { StockStatusPage } from './components/StockStatusPage';\n", "", 1)
s = s.replace("<StockStatusPage", "<StockListPage", 1)
s = s.replace("</StockStatusPage>", "</StockListPage>", 1)
open(p, "w", encoding='utf-8').write(s)
print("done")
PY