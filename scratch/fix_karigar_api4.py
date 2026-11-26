p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\services\api.ts"
s = open(p, encoding='utf-8').read()
# Fix lines 2063 and 2088 and 2099 and 2108 by replacing json.data -> json only where karigar
# We'll replace all occurrences of "return json.data;" between fetchKarigarById and deleteKarigar
start = s.index("export async function fetchKarigarById")
end = s.index("export async function fetchKarigarFilterOptions")
seg = s[start:end]
seg2 = seg.replace("return json.data;", "return json;")
s = s[:start] + seg2 + s[end:]
open(p, "w", encoding='utf-8').write(s)
print("done")
PY