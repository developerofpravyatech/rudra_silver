p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\purchaseRegister\PurchaseRegisterListPage.tsx"
lines = open(p, encoding='utf-8').read().splitlines(keepends=True)

# find index of Amount td line
idx = None
for i, l in enumerate(lines):
    if 'fmtCurr(r.amount)' in l and '<td' in l:
        idx = i
        break
assert idx is not None

action_td = '''                      <td className="py-2.5 px-3 text-center">
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
'''

# insert after idx
lines.insert(idx+1, action_td + "\n")
open(p, "w", encoding='utf-8').write("".join(lines))
print("done")
PY