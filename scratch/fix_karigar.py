p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\karigar\KarigarReportsPage.tsx"
s = open(p, encoding='utf-8').read()
s = s.replace("      ))\n    </tbody>", "      )))\n    </tbody>", 2)
open(p, "w", encoding='utf-8').write(s)
print("done")
PY