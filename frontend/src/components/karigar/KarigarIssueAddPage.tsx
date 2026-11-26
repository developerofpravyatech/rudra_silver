import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Save, Plus, Trash2 } from 'lucide-react';
import { createKarigarIssue, fetchKarigarIssueFilterOptions } from '../../services/api';
import type { KarigarIssueItem } from '../../types';
import { showErrorAlert } from '../../utils/alert';
import { reqDate, reqSelect, reqText, nonNegNum, focusFirstError, FieldErrors } from '../../utils/validation';

interface Props { onBackToList: () => void; }

const EMPTY_ITEM = (): KarigarIssueItem => ({
  item_name: '', item_type: '', metal_type: 'SILVER', purity: 92.5,
  gross_weight: 0, net_weight: 0, diamond_weight: 0, stone_weight: 0,
  quantity: 1, fine_weight: 0, labour_rate: 0, labour_amount: 0, remarks: '',
});

export const KarigarIssueAddPage: React.FC<Props> = ({ onBackToList }) => {
  const [form, setForm] = useState({
    issue_date: new Date().toISOString().split('T')[0],
    voucher_no: '', karigar_id: '', karigar_name: '', lot_no: '', narration: '', remarks: '',
  });
  const [items, setItems] = useState<KarigarIssueItem[]>([EMPTY_ITEM()]);
  const [karigars, setKarigars] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    fetchKarigarIssueFilterOptions().then(d => setKarigars(d.karigars)).catch(() => {});
  }, []);

  const updateItem = (idx: number, field: keyof KarigarIssueItem, val: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      const it = { ...updated[idx], [field]: val };
      // Auto-calculate fine weight
      if (field === 'net_weight' || field === 'purity') {
        it.fine_weight = parseFloat((Number(it.net_weight) * Number(it.purity) / 100).toFixed(3));
      }
      // Auto-calculate labour amount
      if (field === 'labour_rate' || field === 'quantity') {
        it.labour_amount = parseFloat((Number(it.labour_rate) * Number(it.quantity)).toFixed(2));
      }
      updated[idx] = it;
      return updated;
    });
    if (field === 'item_name' && String(val).trim()) {
      setFieldErrors(fe => { const n = { ...fe }; delete n[`item_${idx}_name`]; return n; });
    }
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const addItem    = () => setItems(prev => [...prev, EMPTY_ITEM()]);

  const totals = items.reduce((acc, it) => ({
    silver: acc.silver + (it.metal_type === 'SILVER' ? Number(it.fine_weight) : 0),
    gold: acc.gold   + (it.metal_type === 'GOLD'   ? Number(it.fine_weight) : 0),
    amount: acc.amount + Number(it.labour_amount),
  }), { silver: 0, gold: 0, amount: 0 });

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    const dErr = reqDate(form.issue_date, 'Issue Date');
    if (dErr) errs.issue_date = dErr;
    const kErr = reqSelect(form.karigar_id, 'a Karigar');
    if (kErr) errs.karigar_id = kErr;
    if (items.length === 0) errs.items = 'At least one item row is required.';
    items.forEach((it, idx) => {
      const nErr = reqText(it.item_name, 'Item Name');
      if (nErr) errs[`item_${idx}_name`] = nErr;
      const wErr = nonNegNum(it.net_weight, 'Net weight');
      if (wErr) errs[`item_${idx}_net`] = wErr;
    });
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstError();
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !validate()) return;
    try {
      setSaving(true); setError(''); setSuccess('');
      await createKarigarIssue({
        ...form,
        voucher_no: form.voucher_no.trim(),
        lot_no: form.lot_no.trim(),
        karigar_id: Number(form.karigar_id),
        items: items.map(it => ({ ...it, item_name: it.item_name.trim() })),
      } as any);
      setSuccess('Issue voucher created successfully!');
      setTimeout(onBackToList, 1000);
    } catch (e: any) {
      setError(e.message);
      showErrorAlert('Failed to create issue voucher: ' + (e.message || ''));
    } finally { setSaving(false); }
  };

  const handleKarigarChange = (id: string) => {
    const k = karigars.find(k => String(k.id) === id);
    setForm(f => ({ ...f, karigar_id: id, karigar_name: k?.name ?? '' }));
    if (id) setFieldErrors(fe => { const n = { ...fe }; delete n.karigar_id; return n; });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onBackToList} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">New Karigar Issue</h1>
            <p className="text-xs text-slate-500">Record metal, diamond and stone issued to karigar for job work</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-6 py-6 max-w-6xl mx-auto w-full">
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-xs">{success}</div>}

        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Issue Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Issue Date *</label>
              <input type="date" value={form.issue_date} onChange={e => {
                  const v = e.target.value;
                  setForm(f => ({ ...f, issue_date: v }));
                  if (v) setFieldErrors(fe => { const n = { ...fe }; delete n.issue_date; return n; });
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.issue_date ? 'border-rose-400' : 'border-slate-300'}`} />
              {fieldErrors.issue_date && <div className="text-rose-600 text-xs mt-1">{fieldErrors.issue_date}</div>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Voucher No (auto if blank)</label>
              <input type="text" value={form.voucher_no} onChange={e => setForm(f => ({ ...f, voucher_no: e.target.value }))}
                placeholder="e.g. KI-2026-003"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Karigar *</label>
              <select value={form.karigar_id} onChange={e => handleKarigarChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.karigar_id ? 'border-rose-400' : 'border-slate-300'}`}>
                <option value="">Select Karigar</option>
                {karigars.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
              {fieldErrors.karigar_id && <div className="text-rose-600 text-xs mt-1">{fieldErrors.karigar_id}</div>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lot No</label>
              <input type="text" value={form.lot_no} onChange={e => setForm(f => ({ ...f, lot_no: e.target.value }))}
                placeholder="e.g. LOT-003"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Narration</label>
              <input type="text" value={form.narration} onChange={e => setForm(f => ({ ...f, narration: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
              <input type="text" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Item Details</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-32">Item Name *</th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-24">Type</th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-20">Metal</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-16">Purity%</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-20">Gross Wt</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-20">Net Wt</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-20">Fine Wt</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-12">Qty</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-20">Labour/pc</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-20">Labour Amt</th>
                  <th className="px-2 py-2 text-center font-semibold text-slate-600 min-w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="px-2 py-1.5">
                      <input type="text" value={it.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={it.item_type ?? ''} onChange={e => updateItem(idx, 'item_type', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={it.metal_type} onChange={e => updateItem(idx, 'metal_type', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="SILVER">Silver</option>
                        <option value="GOLD">Gold</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.purity} step="0.01" min="0" max="100"
                        onChange={e => updateItem(idx, 'purity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.gross_weight} step="0.001" min="0"
                        onChange={e => updateItem(idx, 'gross_weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.net_weight} step="0.001" min="0"
                        onChange={e => updateItem(idx, 'net_weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.fine_weight} readOnly
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-right font-semibold text-blue-600" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.quantity} step="1" min="1"
                        onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.labour_rate} step="0.01" min="0"
                        onChange={e => updateItem(idx, 'labour_rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.labour_amount} readOnly
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-right font-semibold text-slate-700" />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex gap-6 justify-end text-xs">
            <div className="text-right">
              <div className="text-slate-500">Total Gold Fine</div>
              <div className="font-bold text-slate-800">{totals.gold.toFixed(3)} g</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">Total Silver Fine</div>
              <div className="font-bold text-blue-700">{totals.silver.toFixed(3)} g</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">Total Labour</div>
              <div className="font-bold text-slate-800">₹{totals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onBackToList}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Issue'}
          </button>
        </div>
      </form>
    </div>
  );
};