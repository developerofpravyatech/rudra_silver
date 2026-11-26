p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\services\api.ts"
lines = open(p, encoding='utf-8').read().splitlines(keepends=True)
# zero-based indices for lines 2088, 2099, 2109
for ln in [2088, 2099, 2109]:
    i = ln - 1
    if 'return json.data;' in lines[i]:
        lines[i] = lines[i].replace('return json.data;', 'return json;')
open(p, "w", encoding='utf-8').write("".join(lines))
print("done")
PY