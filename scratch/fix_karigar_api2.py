p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\services\api.ts"
s = open(p, encoding='utf-8').read()

# fetchKarigars
old1 = """export async function fetchKarigars(params: KarigarFilterParams): Promise<PaginatedKarigars> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Karigar list.');
  const json = await res.json();
  return json.data;
}"""
new1 = """export async function fetchKarigars(params: KarigarFilterParams): Promise<PaginatedKarigars> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Karigar list.');
  const json = await res.json();
  return json;
}"""
assert old1 in s
s = s.replace(old1, new1, 1)

old2 = """export async function fetchKarigarFilterOptions(): Promise<{ cities: string[]; states: string[] }> {
  const res = await fetch('/api/karigar/filter-options', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load filter options.');
  const json = await res.json();
  return json.data;
}"""
new2 = """export async function fetchKarigarFilterOptions(): Promise<{ cities: string[]; karigar_types: string[]; metal_types: string[] }> {
  const res = await fetch('/api/karigar/filter-options', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load filter options.');
  const json = await res.json();
  return json;
}"""
assert old2 in s
s = s.replace(old2, new2, 1)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY