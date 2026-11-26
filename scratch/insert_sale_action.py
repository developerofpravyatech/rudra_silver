p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\saleRegister\SaleRegisterListPage.tsx"
s = open(p, encoding='utf-8').read()
old = '                      <td className="py-2.5 px-3 font-semibold text-slate-700">{r.item_name}</td>\n                    </tr>'
new = '''                      <td className="py-2.5 px-3 font-semibold text-slate-700">{r.item_name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-400">
                          <button type="button" onClick={() => setViewingRecord(r)} className="p-1 hover:text-blue-600 transition cursor-pointer" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleEditClick(r.id)} className="p-1 hover:text-amber-600 transition cursor-pointer" title="Edit Entry">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleDelete(r.id, r.voucher_no || r.item_name)} className="p-1 hover:text-rose-600 transition cursor-pointer" title="Delete Entry">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                     </tr>'''
assert old in s, "old not found"
s = s.replace(old, new, 1)
open(p, "w", encoding='utf-8').write(s)
print("done")
PY