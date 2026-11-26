p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\categories\CategoryListPage.tsx"
s = open(p).read()

s = s.replace("metalTypes.map((mt)", "metalItems.map((it)", 1)
s = s.replace("key={mt} value={mt}", "key={it} value={it}", 1)
s = s.replace("                      {mt}\n                    </option>", "                      {it}\n                    </option>", 1)

open(p, "w").write(s)
print("done")
PY