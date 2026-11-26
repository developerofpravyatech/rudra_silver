p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\customers\CustomerEditPage.tsx"
s = open(p, encoding='utf-8').read()
import re
for m in re.finditer(r"const validateForm", s):
    print("validateForm at", m.start())
print("handleSubmit occurrences:", s.count("handleSubmit"))
print("form onSubmit:", "onSubmit={handleSubmit}" in s)
print("onClick handleSubmit:", "onClick={handleSubmit}" in s)
print("type button count:", s.count('type="button"'))
PY