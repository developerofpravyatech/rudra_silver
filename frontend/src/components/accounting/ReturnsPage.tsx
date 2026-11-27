import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { RotateCcw, Plus, Trash2, Search, RefreshCw, AlertCircle, X, Save, Loader2, Printer, FileDown } from 'lucide-react';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';
import { reqDate, reqText, reqPositiveNum, nonNegNum, FieldErrors } from '../../utils/validation';
import {
  fetchSaleReturns, createSaleReturn, deleteSaleReturn,
  fetchPurchaseReturns, createPurchaseReturn, deletePurchaseReturn,
  ReturnRecord
} from '../../services/api';

interface Props {
  onBackToDashboard: () => void;
}

export const ReturnsPage: React.FC<Props> = () => {
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab') === 'purchase' ? 'purchase' : 'sale';
  const [tab, setTab] = useState<'sale' | 'purchase'>(initialTab);

  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab');
    if (t === 'purchase' || t === 'sale') {
      setTab(t);
    }
  }, [location.search]);
  const [rows, setRows] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [originalVoucherNo, setOriginalVoucherNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [itemName, setItemName] = useState('');
  const [metalType, setMetalType] = useState('Silver');
  const [returnPieces, setReturnPieces] = useState(1);
  const [returnWeight, setReturnWeight] = useState(0);
  const [returnAmount, setReturnAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [refundMode, setRefundMode] = useState('ADJUSTMENT');
  const [narration, setNarration] = useState('');
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const data = tab === 'sale' ? await fetchSaleReturns(params) : await fetchPurchaseReturns(params);
      setRows(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load returns.');
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  const validateReturn = (): boolean => {
    const errs: FieldErrors = {};
    const dErr = reqDate(returnDate, 'Return Date');
    if (dErr) errs.returnDate = dErr;
    const pErr = reqText(partyName, tab === 'sale' ? 'Customer Name' : 'Supplier Name');
    if (pErr) errs.partyName = pErr;
    const iErr = reqText(itemName, 'Item Name');
    if (iErr) errs.itemName = iErr;
    const aErr = reqPositiveNum(returnAmount, 'Return Amount');
    if (aErr) errs.returnAmount = aErr;
    const gErr = nonNegNum(gstAmount, 'GST');
    if (gErr) errs.gstAmount = gErr;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !validateReturn()) return;
    const total = Number(returnAmount) + Number(gstAmount);
    setSaving(true);
    setFormErr(null);
    try {
      const payload = {
        return_date: returnDate,
        original_voucher_no: originalVoucherNo || undefined,
        party_name: partyName.trim(),
        item_name: itemName.trim(),
        metal_type: metalType,
        return_pieces: returnPieces,
        return_weight: returnWeight,
        return_amount: returnAmount,
        gst_amount: gstAmount,
        total_amount: total,
        refund_mode: refundMode,
        narration: narration || undefined,
      };
      if (tab === 'sale') await createSaleReturn(payload);
      else await createPurchaseReturn(payload);
      setShowModal(false);
      setPartyName(''); setItemName(''); setOriginalVoucherNo(''); setReturnAmount(0); setGstAmount(0); setNarration('');
      load();
    } catch (e: any) {
      setFormErr(e.message || 'Failed to save return.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this return? This will reverse the accounting entries.')) return;
    try {
      if (tab === 'sale') await deleteSaleReturn(id);
      else await deletePurchaseReturn(id);
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to cancel return.');
    }
  };

  const buildReportOptions = (): ReportPdfOptions => ({
    title: tab === 'sale' ? 'Sales Return Register' : 'Purchase Return Register',
    filename: `${tab === 'sale' ? 'Sales_Returns' : 'Purchase_Returns'}_${new Date().toISOString().slice(0, 10)}.pdf`,
    orientation: 'landscape',
    columns: [
      { header: 'Return No', dataKey: 'rno' },
      { header: 'Date', dataKey: 'dt' },
      { header: 'Orig Inv', dataKey: 'orig' },
      { header: tab === 'sale' ? 'Customer' : 'Supplier', dataKey: 'party' },
      { header: 'Item', dataKey: 'item' },
      { header: 'Pcs', dataKey: 'pcs', align: 'center' },
      { header: 'Weight(g)', dataKey: 'wt', align: 'right' },
      { header: 'Total (INR)', dataKey: 'tot', align: 'right' },
      { header: 'Status', dataKey: 'st', align: 'center' },
    ],
    data: rows.map(r => ({
      rno: r.return_no,
      dt: r.return_date,
      orig: r.original_voucher_no || '—',
      party: r.party_name,
      item: r.item_name,
      pcs: r.return_pieces,
      wt: Number(r.return_weight).toFixed(3),
      tot: Number(r.total_amount).toFixed(2),
      st: r.status,
    })),
    totals: {
      rno: 'TOTAL',
      wt: rows.reduce((s, r) => s + Number(r.return_weight), 0).toFixed(3),
      tot: rows.reduce((s, r) => s + Number(r.total_amount), 0).toFixed(2),
    },
  });

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              Sales &amp; Purchase Returns
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record returns with automatic double-entry ledger reversal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => printReport(buildReportOptions())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => downloadReportPdf(buildReportOptions())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100">
              <FileDown className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => { setFormErr(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-all">
              <Plus className="w-4 h-4" /> New {tab === 'sale' ? 'Sales Return' : 'Purchase Return'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('sale')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === 'sale' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white dark:bg-[#12161f] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'}`}>
            Sales Returns
          </button>
          <button onClick={() => setTab('purchase')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === 'purchase' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white dark:bg-[#12161f] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'}`}>
            Purchase Returns
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search return no, party, item..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30" />
          </div>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          {error && (
            <div className="p-4 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Return No</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Orig. Inv</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">{tab === 'sale' ? 'Customer' : 'Supplier'}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Item</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Wt (g)</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Total (₹)</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {loading ? (
                  <tr><td colSpan={9} className="py-12 text-center text-slate-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={9} className="py-14 text-center text-slate-400">No {tab} returns found.</td></tr>
                ) : rows.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-200">{r.return_no}</td>
                    <td className="px-4 py-3 text-slate-500">{r.return_date}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{r.original_voucher_no || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{r.party_name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.item_name} ({r.return_pieces} pcs)</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{Number(r.return_weight).toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">₹{Number(r.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'POSTED' && (
                        <button onClick={() => handleCancel(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Cancel Return">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                New {tab === 'sale' ? 'Sales Return' : 'Purchase Return'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} noValidate className="p-6 space-y-3 text-xs">
              {formErr && <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{formErr}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Return Date *</label>
                  <input type="date" value={returnDate} onChange={e => { setReturnDate(e.target.value); setFieldErrors(fe => { const n={...fe}; delete n.returnDate; return n; }); }}
                    className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 ${fieldErrors.returnDate ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                  {fieldErrors.returnDate && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.returnDate}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Original Invoice No</label>
                  <input type="text" value={originalVoucherNo} onChange={e => setOriginalVoucherNo(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">{tab === 'sale' ? 'Customer Name' : 'Supplier Name'} *</label>
                  <input type="text" value={partyName} onChange={e => { setPartyName(e.target.value); if (e.target.value.trim()) setFieldErrors(fe => { const n={...fe}; delete n.partyName; return n; }); }} placeholder="Party Name"
                    className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 ${fieldErrors.partyName ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                  {fieldErrors.partyName && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.partyName}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Item Name *</label>
                  <input type="text" value={itemName} onChange={e => { setItemName(e.target.value); if (e.target.value.trim()) setFieldErrors(fe => { const n={...fe}; delete n.itemName; return n; }); }} placeholder="Item Name"
                    className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 ${fieldErrors.itemName ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                  {fieldErrors.itemName && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.itemName}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Metal Type</label>
                  <select value={metalType} onChange={e => setMetalType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Refund / Settlement</label>
                  <select value={refundMode} onChange={e => setRefundMode(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
                    <option value="ADJUSTMENT">Ledger Adjustment</option>
                    <option value="CASH">Cash Refund</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Pieces</label>
                  <input type="number" min="0" value={returnPieces} onChange={e => setReturnPieces(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Weight (g)</label>
                  <input type="number" min="0" step="0.001" value={returnWeight} onChange={e => setReturnWeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Return Amount (₹) *</label>
                  <input type="number" min="0" step="0.01" value={returnAmount} onChange={e => { setReturnAmount(Number(e.target.value)); if (Number(e.target.value) > 0) setFieldErrors(fe => { const n={...fe}; delete n.returnAmount; return n; }); }}
                    className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 ${fieldErrors.returnAmount ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                  {fieldErrors.returnAmount && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.returnAmount}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">GST (₹)</label>
                  <input type="number" min="0" step="0.01" value={gstAmount} onChange={e => setGstAmount(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Narration</label>
                <input type="text" value={narration} onChange={e => setNarration(e.target.value)} placeholder="Reason for return..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
