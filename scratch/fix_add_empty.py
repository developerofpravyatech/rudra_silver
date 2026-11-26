p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\karigar\KarigarAddPage.tsx"
s = open(p, encoding='utf-8').read()
s = s.replace("  karigar_code: '', karigar_name: '', mobile: '', alternate_mobile: '', email: '',\n",
              "  karigar_code: '', karigar_name: '', mobile: '', alternate_mobile: '',\n", 1)
open(p, "w", encoding='utf-8').write(s)
print("done")
PY