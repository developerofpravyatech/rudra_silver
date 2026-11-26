import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Trash2, Eye, FileText, ChevronLeft, ChevronRight, AlertCircle, Printer, FileDown } from 'lucide-react';
import type { AccountingVoucher, AccountingVoucherType } from '../../types';
import { fetchAccountingVouchers, deleteAccountingVoucher } from '../../services/api';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';

interface Props {
  onAdd: (type: AccountingVoucherType) => void;
  onView: (id: number) => void;
  onBackToDashboard: () => void;
}

const VOUCHER_TYPES: Array<{ type: AccountingVoucherType; label: string; color: string; bg: string }> = [
  { type: 'RECEIPT', label: 'Receipt', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
  { type: 'CONTRA', label: 'Contra', color: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20' },
  { type: 'JOURNAL', label: 'Journal', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' },
  { type: 'PAYMENT', label: 'Payment', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' },
];

const TYPE_BADGE: Record<string, string> = {
  RECEIPT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  PAYMENT: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  CONTRA: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
  JOURNAL: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
};

export const AccountingVoucherListPage: React.FC<Props> = ({ onAdd, onView, onBackToDashboard }) => {
  const [vouchers, setVouchers] = useState<AccountingVoucher[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (typeFilter) params.voucher_type = typeFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await fetchAccountingVouchers(params);
      setVouchers(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load vouchers.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, dateFrom, dateTo, page, limit]);

  useEffect(() => { load(); }, [load]);

  // Keyboard shortcuts F2 (Receipt), F3 (Contra), F4 (Journal), F5 (Payment)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'F2') { e.preventDefault(); onAdd('RECEIPT'); }
      else if (e.key === 'F3') { e.preventDefault(); onAdd('CONTRA'); }
      else if (e.key === 'F4') { e.preventDefault(); onAdd('JOURNAL'); }
      else if (e.key === 'F5') { e.preventDefault(); onAdd('PAYMENT'); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onAdd]);

  const handleDelete = async (id: number) => {
    if (!confirm('Cancel this voucher? This will reverse all accounting entries.')) return;
    try {
      await deleteAccountingVoucher(id);
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to cancel voucher.');
    }
  };

  const buildReportOptions = async (): Promise<ReportPdfOptions> => {
    const params: Record<string, string | number> = { page: 1, limit: 500 };
    if (search) params.search = search;
    if (typeFilter) params.voucher_type = typeFilter;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    const res = await fetchAccountingVouchers(params);
    const list = Array.isArray(res.data) ? res.data : [];
    return {
      title: 'Accounting Vouchers Register',
      filename: `Accounting_Vouchers_${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      filters: [
        ...(typeFilter ? [{ label: 'Type', value: typeFilter }] : []),
        ...(dateFrom ? [{ label: 'From', value: dateFrom }] : []),
        ...(dateTo ? [{ label: 'To', value: dateTo }] : []),
      ],
      columns: [
        { header: 'Voucher No', dataKey: 'vno' },
        { header: 'Type', dataKey: 'type' },
        { header: 'Date', dataKey: 'dt' },
        { header: 'Party / Account', dataKey: 'party' },
        { header: 'Amount (INR)', dataKey: 'amt', align: 'right' },
        { header: 'Narration', dataKey: 'narr' },
        { header: 'Status', dataKey: 'st', align: 'center' },
      ],
      data: list.map(v => ({
        vno: `${v.series ?? ''}/${v.voucher_no}`,
        type: v.voucher_type,
        dt: v.voucher_date,
        party: v.account_name || '—',
        amt: Number(v.net_amount || 0).toFixed(2),
        narr: v.narration || '—',
        st: v.status,
      })),
      totals: {
        vno: 'TOTAL',
        amt: list.reduce((s, v) => s + Number(v.net_amount || 0), 0).toFixed(2),
      },
    };
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Accounting Vouchers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receipt, Payment, Contra &amp; Journal entries</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={async () => printReport(await buildReportOptions())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={async () => downloadReportPdf(await buildReportOptions())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100">
              <FileDown className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Quick create buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VOUCHER_TYPES.map(({ type, label, color, bg }) => (
            <button key={type} onClick={() => onAdd(type)}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border ${bg} ${color} text-xs font-bold transition-all hover:shadow-sm active:scale-95`}>
              <Plus className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search narration, account..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
            </div>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
              <option value="">All Types</option>
              {VOUCHER_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
            <button onClick={() => { setSearch(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Voucher No</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Party</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Amount (₹)</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Narration</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full" /></td>)}
                    </tr>
                  ))
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 dark:text-slate-500">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No vouchers found</p>
                      <p className="text-xs mt-1 opacity-60">Create a Receipt, Payment, Contra, or Journal voucher</p>
                    </td>
                  </tr>
                ) : vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {v.series ?? ''}/{v.voucher_no}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_BADGE[v.voucher_type] || 'bg-slate-100 text-slate-600'}`}>
                        {v.voucher_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{v.voucher_date}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{v.account_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                      ₹{Number(v.net_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{v.narration || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${v.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : v.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                            : 'bg-slate-100 text-slate-500'
                        }`}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onView(v.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {v.status !== 'CANCELLED' && (
                          <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Cancel Voucher">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} vouchers
              </span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1.5 text-xs text-slate-500">Page {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
