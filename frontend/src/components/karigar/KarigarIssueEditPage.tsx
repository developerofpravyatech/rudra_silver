import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Save, Plus, Trash2 } from 'lucide-react';
import { fetchKarigarIssueById, updateKarigarIssue, fetchKarigarIssueFilterOptions } from '../../services/api';
import type { KarigarIssueItem } from '../../types';
import { reqDate, reqSelect, reqText, focusFirstError, FieldErrors } from '../../utils/validation';

interface Props {
  recordId: number;
  onBackToList: () => void;
}

const EMPTY_ITEM = (): KarigarIssueItem => ({
  item_name: '', item_type: '', metal_type: 'SILVER', purity: 92.5,
  gross_weight: 0, net_weight: 0, diamond_weight: 0, stone_weight: 0,
  quantity: 1, fine_weight: 0, labour_rate: 0, labour_amount: 0, remarks: '',
});

export const KarigarIssueEditPage: React.FC<Props> = ({ recordId, onBackToList }) => {
  const [form, setForm] = useState({
    issue_date: '', voucher_no: '', karigar_id: '', karigar_name: '', lot_no: '', narration: '', remarks: '', status: 'OPEN',
  });
  const [items, setItems] = useState<KarigarIssueItem[]>([]);
  const [karigars, setKarigars] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    fetchKarigarIssueFilterOptions().then(d => setKarigars(d.karigars)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchKarigarIssueById(recordId)
      .then(data => {
        setForm({
          issue_date: data.issue_date || '',
          voucher_no: data.voucher_no || '',
          karigar_id: String(data.karigar_id || ''),
          karigar_name: data.karigar_name || '',
          lot_no: data.lot_no || '',
          narration: data.narration || '',
          remarks: data.remarks || '',
          status: data.status || 'OPEN',
        });
        setItems(data.items && data.items.length > 0 ? data.items : [EMPTY_ITEM()]);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [recordId]);

  const updateItem = (idx: number, field: keyof KarigarIssueItem, val: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      const it = { ...updated[idx], [field]: val };
      if (field === 'net_weight' || field === 'purity') {
        it.fine_weight = parseFloat((Number(it.net_weight) * Number(it.purity) / 100).toFixed(3));
      }
      if (field === 'labour_rate' || field === 'quantity') {
        it.labour_amount = parseFloat((Number(it.labour_rate) * Number(it.quantity)).toFixed(2));
      }
      updated[idx] = it;
      return updated;
    });
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const addItem    = () => setItems(prev => [...prev, EMPTY_ITEM()]);

  const totals = items.reduce((acc, it) => ({
    silver: acc.silver + (it.metal_type === 'SILVER' ? Number(it.fine_weight) : 0),
    gold: acc.gold   + (it.metal_type === 'GOLD'   ? Number(it.fine_weight) : 0),
    amount: acc.amount + Number(it.labour_amount),
  }), { silver: 0, gold: 0, amount: 0 });

  const handleKarigarChange = (id: string) => {
    const k = karigars.find(k => String(k.id) === id);
    setForm(f => ({ ...f, karigar_id: id, karigar_name: k?.name ?? '' }));
    if (id) setFieldErrors(fe => { const n = { ...fe }; delete n.karigar_id; return n; });
  };

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
    });
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) { focusFirstError(); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !validate()) return;
    try {
      setSaving(true); setError(''); setSuccess('');
      await updateKarigarIssue(recordId, { ...form, karigar_id: Number(form.karigar_id), items: items.map(it => ({ ...it, item_name: it.item_name.trim() })) } as any);
      setSuccess('Issue voucher updated successfully!');
      setTimeout(onBackToList, 1000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isClosed = form.status === 'CLOSED';

  return (
    <div className="flex flex-col h-full bg-[#f4f6f9]">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onBackToList} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Edit Karigar Issue</h1>
            <p className="text-xs text-slate-500">{form.voucher_no} • Status: {form.status}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-6 py-6 max-w-6xl mx-auto w-full">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-xs">{success}</div>}
        {isClosed && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
            This issue voucher is CLOSED and cannot be edited.
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Issue Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Issue Date *</label>
              <input type="date" value={form.issue_date} disabled={isClosed} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Voucher No</label>
              <input type="text" value={form.voucher_no} disabled
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Karigar *</label>
              <select value={form.karigar_id} disabled={isClosed} onChange={e => handleKarigarChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Karigar</option>
                {karigars.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lot No</label>
              <input type="text" value={form.lot_no} disabled={isClosed} onChange={e => setForm(f => ({ ...f, lot_no: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Narration</label>
              <input type="text" value={form.narration} disabled={isClosed} onChange={e => setForm(f => ({ ...f, narration: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
              <input type="text" value={form.remarks} disabled={isClosed} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Item Details</h2>
            {!isClosed && (
              <button type="button" onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            )}
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
                  <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-16">Dia Wt</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-16">Stn Wt</th>
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
                      <input type="text" value={it.item_name} disabled={isClosed} onChange={e => updateItem(idx, 'item_name', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={it.item_type ?? ''} disabled={isClosed} onChange={e => updateItem(idx, 'item_type', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded" />
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={it.metal_type} disabled={isClosed} onChange={e => updateItem(idx, 'metal_type', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded">
                        <option value="SILVER">Silver</option>
                        <option value="GOLD">Gold</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.purity} step="0.01" min="0" max="100" disabled={isClosed}
                        onChange={e => updateItem(idx, 'purity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.gross_weight} step="0.001" min="0" disabled={isClosed}
                        onChange={e => updateItem(idx, 'gross_weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.net_weight} step="0.001" min="0" disabled={isClosed}
                        onChange={e => updateItem(idx, 'net_weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.diamond_weight} step="0.001" min="0" disabled={isClosed}
                        onChange={e => updateItem(idx, 'diamond_weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.stone_weight} step="0.001" min="0" disabled={isClosed}
                        onChange={e => updateItem(idx, 'stone_weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.fine_weight} readOnly
                        className="w-full px-2 py-1 text-xs border border-slate-100 rounded bg-slate-50 text-right font-semibold text-blue-700" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.quantity} step="1" min="1" disabled={isClosed}
                        onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.labour_rate} step="0.01" min="0" disabled={isClosed}
                        onChange={e => updateItem(idx, 'labour_rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={it.labour_amount} readOnly
                        className="w-full px-2 py-1 text-xs border border-slate-100 rounded bg-slate-50 text-right font-semibold text-slate-700" />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {!isClosed && items.length > 1 && (
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

          <div className="mt-4 flex gap-6 justify-end text-xs">
            <div className="text-right"><div className="text-slate-500">Total Gold Fine</div><div className="font-bold text-slate-800">{totals.gold.toFixed(3)} g</div></div>
            <div className="text-right"><div className="text-slate-500">Total Silver Fine</div><div className="font-bold text-blue-700">{totals.silver.toFixed(3)} g</div></div>
            <div className="text-right"><div className="text-slate-500">Total Labour</div><div className="font-bold text-slate-800">₹{totals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div></div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onBackToList}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          {!isClosed && (
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? 'Updating...' : 'Update Issue'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
