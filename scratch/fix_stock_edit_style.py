p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\stock\StockEditPage.tsx"
s = open(p).read()

old_block = """              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { field: 'pc', label: 'Pieces (Pc)', state: pc, setter: setPc },
                  { field: 'gross_weight', label: 'Gross Wt (Gr.Wt.)', state: grossWeight, setter: setGrossWeight },
                  { field: 'net_weight', label: 'Net Wt (Net.Wt.)', state: netWeight, setter: setNetWeight },
                  { field: 'tunch', label: 'Tunch %', state: tunch, setter: setTunch },
                  { field: 'wastage', label: 'Wastage (Wstg)', state: wastage, setter: setWastage },
                  { field: 'labour_weight', label: 'Labour Wt (Lbr.Wt)', state: labourWeight, setter: setLabourWeight },
                  { field: 'rate', label: 'Rate (₹)', state: rate, setter: setRate },
                  { field: 'silver_fine', label: 'Silver Fine (Sil.Fine)', state: silverFine, setter: setSilverFine },
                  { field: 'total', label: 'Total Amount', state: total, setter: setTotal },
                  { field: 'gold_fine', label: 'Gold Fine', state: goldFine, setter: setGoldFine },
                ].map(({ field, label, state, setter }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name={field}
                      step="0.001"
                      value={state}
                      onChange={(e) => { setter(e.target.value); clearError(field); }}
                      onBlur={() => { if (!state.trim()) setFieldErrors((prev) => ({ ...prev, [field]: 'This field is required.' })); }}
                      placeholder="0.000"
                      className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                    />
                    {fieldErrors[field] && <p className="text-[11px] text-red-500 mt-1">{fieldErrors[field]}</p>}
                  </div>
                ))}
              </div>"""

new_block = """              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Pc */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pieces (Pc) <span className="text-red-500">*</span></label>
                  <input type="number" name="pc" step="0.001" value={pc} onChange={(e) => { setPc(e.target.value); clearError('pc'); }} onBlur={() => { if (!pc.trim()) setFieldErrors((prev) => ({ ...prev, pc: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.pc ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.pc && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.pc}</p>}
                </div>

                {/* Gross Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Wt (Gr.Wt.) <span className="text-red-500">*</span></label>
                  <input type="number" name="gross_weight" step="0.001" value={grossWeight} onChange={(e) => { setGrossWeight(e.target.value); clearError('gross_weight'); }} onBlur={() => { if (!grossWeight.trim()) setFieldErrors((prev) => ({ ...prev, gross_weight: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.gross_weight ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.gross_weight && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.gross_weight}</p>}
                </div>

                {/* Net Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Net Wt (Net.Wt.) <span className="text-red-500">*</span></label>
                  <input type="number" name="net_weight" step="0.001" value={netWeight} onChange={(e) => { setNetWeight(e.target.value); clearError('net_weight'); }} onBlur={() => { if (!netWeight.trim()) setFieldErrors((prev) => ({ ...prev, net_weight: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border bg-blue-50/40 font-mono font-bold text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.net_weight ? 'border-red-400 bg-red-50' : 'border-blue-200'}`} />
                  {fieldErrors.net_weight && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.net_weight}</p>}
                </div>

                {/* Tunch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tunch % <span className="text-red-500">*</span></label>
                  <input type="number" name="tunch" step="0.001" value={tunch} onChange={(e) => { setTunch(e.target.value); clearError('tunch'); }} onBlur={() => { if (!tunch.trim()) setFieldErrors((prev) => ({ ...prev, tunch: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.tunch ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.tunch && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.tunch}</p>}
                </div>

                {/* Wastage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wastage (Wstg) <span className="text-red-500">*</span></label>
                  <input type="number" name="wastage" step="0.001" value={wastage} onChange={(e) => { setWastage(e.target.value); clearError('wastage'); }} onBlur={() => { if (!wastage.trim()) setFieldErrors((prev) => ({ ...prev, wastage: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.wastage ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.wastage && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.wastage}</p>}
                </div>

                {/* Labour Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Labour Wt (Lbr.Wt) <span className="text-red-500">*</span></label>
                  <input type="number" name="labour_weight" step="0.001" value={labourWeight} onChange={(e) => { setLabourWeight(e.target.value); clearError('labour_weight'); }} onBlur={() => { if (!labourWeight.trim()) setFieldErrors((prev) => ({ ...prev, labour_weight: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.labour_weight ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.labour_weight && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.labour_weight}</p>}
                </div>

                {/* Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate (₹) <span className="text-red-500">*</span></label>
                  <input type="number" name="rate" step="0.001" value={rate} onChange={(e) => { setRate(e.target.value); clearError('rate'); }} onBlur={() => { if (!rate.trim()) setFieldErrors((prev) => ({ ...prev, rate: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.rate ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.rate && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.rate}</p>}
                </div>

                {/* Silver Fine */}
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">Silver Fine (Sil.Fine) <span className="text-red-500">*</span></label>
                  <input type="number" name="silver_fine" step="0.001" value={silverFine} onChange={(e) => { setSilverFine(e.target.value); clearError('silver_fine'); }} onBlur={() => { if (!silverFine.trim()) setFieldErrors((prev) => ({ ...prev, silver_fine: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border bg-amber-50/40 font-mono font-bold text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.silver_fine ? 'border-red-400 bg-red-50' : 'border-amber-200'}`} />
                  {fieldErrors.silver_fine && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.silver_fine}</p>}
                </div>

                {/* Total */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Total Amount <span className="text-red-500">*</span></label>
                  <input type="number" name="total" step="0.001" value={total} onChange={(e) => { setTotal(e.target.value); clearError('total'); }} onBlur={() => { if (!total.trim()) setFieldErrors((prev) => ({ ...prev, total: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono font-bold text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.total ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.total && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.total}</p>}
                </div>

                {/* Gold Fine */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gold Fine <span className="text-red-500">*</span></label>
                  <input type="number" name="gold_fine" step="0.001" value={goldFine} onChange={(e) => { setGoldFine(e.target.value); clearError('gold_fine'); }} onBlur={() => { if (!goldFine.trim()) setFieldErrors((prev) => ({ ...prev, gold_fine: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.gold_fine ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.gold_fine && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.gold_fine}</p>}
                </div>
              </div>"""

assert old_block in s
s = s.replace(old_block, new_block, 1)
open(p, "w").write(s)
print("done")
PY