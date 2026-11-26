p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\services\api.ts"
s = open(p, encoding='utf-8').read()

# createKarigar
s = s.replace(
"""  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create Karigar.');
  return json.data;
}""",
"""  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create Karigar.');
  return json;
}""", 1)

# updateKarigar
s = s.replace(
"""  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update Karigar.');
  return json.data;
}""",
"""  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update Karigar.');
  return json;
}""", 1)

# toggleKarigarStatus
s = s.replace(
"""  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to toggle status.');
  return json.data;
}""",
"""  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to toggle status.');
  return json;
}""", 1)

# viewKarigar
old_view = """export async function fetchKarigarById(id: number): Promise<KarigarRecord> {
  const res = await fetch(`/api/karigar/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Karigar.');
  const json = await res.json();
  return json.data;
}"""
new_view = """export async function fetchKarigarById(id: number): Promise<KarigarRecord> {
  const res = await fetch(`/api/karigar/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Karigar.');
  const json = await res.json();
  return json;
}"""
assert old_view in s
s = s.replace(old_view, new_view, 1)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY