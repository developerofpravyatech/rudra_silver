# SaleRegister
p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\saleRegister\SaleRegisterListPage.tsx"
s = open(p, encoding='utf-8').read()

# header
s = s.replace(
    "                  <th className=\"py-3 px-3 cursor-pointer hover:text-blue-600\" onClick={() => handleSort('item_name')}>Item Name</th>\n",
    "                  <th className=\"py-3 px-3 cursor-pointer hover:text-blue-600\" onClick={() => handleSort('item_name')}>Item Name</th>\n                  <th className=\"py-3 px-3 text-center\">Actions</th>\n",
    1
)

# td cell after item_name td
s = s.replace(
    '                      <td className="py-2.5 px-3 font-semibold text-slate-700">{r.item_name}</td>\n                     </tr>',
    '                      <td className="py-2.5 px-3 font-semibold text-slate-700">{r.item_name}</td>\n                      <td className="py-2.5 px-3 text-center">\n                        <div className="flex items-center justify-center gap-1.5 text-slate-400">\n                          <button type="button" onClick={() => setViewingRecord(r)} className="p-1 hover:text-blue-600 transition cursor-pointer" title="View Details">\n                            <Eye className="w-4 h-4" />\n                          </button>\n                          <button type="button" onClick={() => handleEditClick(r.id)} className="p-1 hover:text-amber-600 transition cursor-pointer" title="Edit Entry">\n                            <Edit2 className="w-4 h-4" />\n                          </button>\n                          <button type="button" onClick={() => handleDelete(r.id, r.voucher_no || r.item_name)} className="p-1 hover:text-rose-600 transition cursor-pointer" title="Delete Entry">\n                            <Trash2 className="w-4 h-4" />\n                          </button>\n                        </div>\n                      </td>\n                     </tr>',
    1
)

open(p, "w", encoding='utf-8').write(s)
print("sale done")

# PurchaseRegister
p2 = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\purchaseRegister\PurchaseRegisterListPage.tsx"
s2 = open(p2, encoding='utf-8').read()

s2 = s2.replace(
    "                  <th className=\"py-3 px-3 text-right cursor-pointer hover:text-blue-600\" onClick={() => handleSort('amount')}>Amount</th>\n",
    "                  <th className=\"py-3 px-3 text-right cursor-pointer hover:text-blue-600\" onClick={() => handleSort('amount')}>Amount</th>\n                  <th className=\"py-3 px-3 text-center\">Actions</th>\n",
    1
)

s2 = s2.replace(
    '                       <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{fmtCurr(r.amount)}</td>\n                     </tr>',
    '                       <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{fmtCurr(r.amount)}</td>\n                      <td className="py-2.5 px-3 text-center">\n                        <div className="flex items-center justify-center gap-1.5 text-slate-400">\n                          <button type="button" onClick={() => setViewingRecord(r)} className="p-1 hover:text-blue-600 transition cursor-pointer" title="View Details">\n                            <Eye className="w-4 h-4" />\n                          </button>\n                          <button type="button" onClick={() => handleEditClick(r.id)} className="p-1 hover:text-amber-600 transition cursor-pointer" title="Edit Entry">\n                            <Edit2 className="w-4 h-4" />\n                          </button>\n                          <button type="button" onClick={() => handleDelete(r.id, r.voucher_no || r.item_name)} className="p-1 hover:text-rose-600 transition cursor-pointer" title="Delete Entry">\n                            <Trash2 className="w-4 h-4" />\n                          </button>\n                        </div>\n                      </td>\n                     </tr>',
    1
)

open(p2, "w", encoding='utf-8').write(s2)
print("purchase done")
PY