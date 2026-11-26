p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\karigar\KarigarListPage.tsx"
s = open(p, encoding='utf-8').read()

# filter options
s = s.replace("fetchKarigarFilterOptions().then(d => setCities(d.cities)).catch(() => {});",
              "fetchKarigarFilterOptions().then(d => setCities(d.cities || [])).catch(() => {});", 1)

# delete confirm
s = s.replace('Delete Karigar "${record.name}"', 'Delete Karigar "${record.karigar_name}"', 1)
# toggle confirm
s = s.replace('`${action} "${record.name}"?`', '`${action} "${record.karigar_name}"?`', 1)

# table fields
s = s.replace("{k.account_code}", "{k.karigar_code}", 1)
s = s.replace("{k.name}", "{k.karigar_name}", 1)
s = s.replace("{k.state &&", "{k.state &&", 1)
s = s.replace("Number(k.balance_fine_silver).toFixed(3)", "Number(k.opening_silver_balance).toFixed(3)", 1)
s = s.replace("Number(k.balance_inr).toLocaleString", "Number(k.opening_amount).toLocaleString", 1)
s = s.replace("{k.total_issues ?? 0}", "{0}", 1)
s = s.replace("{k.is_active ? 'Active' : 'Inactive'}", "{k.status}", 1)
s = s.replace("k.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'", "'bg-green-100 text-green-700'", 1)
s = s.replace("title={k.is_active ? 'Deactivate' : 'Activate'}", "title='Toggle'", 1)
s = s.replace("className={`p-1.5 rounded-lg transition-colors ${k.is_active ? 'hover:bg-orange-50 text-orange-500' : 'hover:bg-green-50 text-green-600'}`}", "className=\"p-1.5 rounded-lg transition-colors hover:bg-orange-50 text-orange-500\"", 1)

# filter is_active -> status
s = s.replace("is_active: '',", "status: '',", 1)
s = s.replace("setFilters(f => ({ ...f, is_active: e.target.value, page: 1 }))", "setFilters(f => ({ ...f, status: e.target.value, page: 1 }))", 1)
s = s.replace("<option value=\"\">All Status</option>\n            <option value=\"1\">Active</option>\n            <option value=\"0\">Inactive</option>",
              "<option value=\"\">All Status</option>\n            <option value=\"Active\">Active</option>\n            <option value=\"Inactive\">Inactive</option>", 1)

# handleToggle uses is_active; update to status
s = s.replace("const action = record.is_active ? 'Deactivate' : 'Activate';", "const action = record.status === 'Active' ? 'Deactivate' : 'Activate';", 1)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY