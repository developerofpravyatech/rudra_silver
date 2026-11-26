p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\services\api.ts"
s = open(p, encoding='utf-8').read()
s = s.replace("  if (params.in_stock !== undefined && params.in_stock !== '') qs.set('in_stock', String(Number(params.in_stock)));\n", "  if (params.in_stock !== undefined) qs.set('in_stock', String(Number(params.in_stock)));\n", 1)
s = s.replace("  if (params.net_value !== undefined && params.net_value !== '') qs.set('net_value', String(Number(params.net_value)));\n", "  if (params.net_value !== undefined) qs.set('net_value', String(Number(params.net_value)));\n", 1)
s = s.replace("  if (params.is_approved !== undefined && params.is_approved !== '') qs.set('is_approved', String(Number(params.is_approved)));\n", "  if (params.is_approved !== undefined) qs.set('is_approved', String(Number(params.is_approved)));\n", 1)
s = s.replace("  if (params.is_excluded !== undefined && params.is_excluded !== '') qs.set('is_excluded', String(Number(params.is_excluded)));\n", "  if (params.is_excluded !== undefined) qs.set('is_excluded', String(Number(params.is_excluded)));\n", 1)
s = s.replace("  if (params.include_metal !== undefined && params.include_metal !== '') qs.set('include_metal', String(Number(params.include_metal)));\n", "  if (params.include_metal !== undefined) qs.set('include_metal', String(Number(params.include_metal)));\n", 1)
open(p, "w", encoding='utf-8').write(s)
print("done")
PY