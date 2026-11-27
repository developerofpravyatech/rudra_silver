import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, BookOpen, Printer, FileDown, Download, RefreshCw,
  Filter, Search, BookmarkCheck, ExternalLink, AlertCircle, Calculator, Image as ImageIcon
} from 'lucide-react';
import {
  fetchLedgerBook,
  exportLedgerCsv,
  type LedgerBookResponse,
  type LedgerBookEntry,
} from '../../services/api';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';

interface Props {
  ledgerId: number;
  onBack: () => void;
}

const VOUCHER_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Vouchers' },
  { value: 'OPENING', label: 'Opening Balance' },
  { value: 'SALE_REGISTER', label: 'Sale' },
  { value: 'PURCHASE_REGISTER', label: 'Purchase' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'CONTRA', label: 'Contra' },
  { value: 'JOURNAL', label: 'Journal' },
  { value: 'SALE_RETURN', label: 'Sale Return' },
  { value: 'PURCHASE_RETURN', label: 'Purchase Return' },
];

const fmtAmt = (v: number) => (v > 0 ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');
const fmtWt = (v: number) => (v > 0 ? Number(v).toFixed(3) : '—');

export const LedgerBookPage: React.FC<Props> = ({ ledgerId, onBack }) => {
  const navigate = useNavigate();
  const storageKey = `rudra_ledger_stmt_prefs_${ledgerId}`;

  const [data, setData] = useState<LedgerBookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [showAvgBalance, setShowAvgBalance] = useState(true);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [voucherType, setVoucherType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [approval, setApproval] = useState('with_approval');
  const [diaFilter, setDiaFilter] = useState('');
  const [viewType, setViewType] = useState<'normal' | 'short'>('normal');
  const [exclude, setExclude] = useState(false);
  const [merge, setMerge] = useState<string>('no');

  // Restore saved filter selection for this ledger if available
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const prefs = JSON.parse(raw);
        if (typeof prefs.from === 'string') setFrom(prefs.from);
        if (typeof prefs.to === 'string') setTo(prefs.to);
        if (typeof prefs.voucherType === 'string') setVoucherType(prefs.voucherType);
        if (typeof prefs.approval === 'string') setApproval(prefs.approval);
        if (typeof prefs.diaFilter === 'string') setDiaFilter(prefs.diaFilter);
        if (prefs.viewType === 'short' || prefs.viewType === 'normal') setViewType(prefs.viewType);
        if (typeof prefs.exclude === 'boolean') setExclude(prefs.exclude);
        if (typeof prefs.merge === 'string') setMerge(prefs.merge);
      }
    } catch { }
  }, [storageKey]);

  const load = useCallback(async () => {
    if (!ledgerId || ledgerId <= 0) {
      setError('Invalid ledger selected.');
      setLoading(false);
      return;
    }
    if (from && to && from > to) {
      setError('From Date cannot be greater than To Date.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLedgerBook(ledgerId, from || undefined, to || undefined, {
        voucher_type: voucherType,
        search,
        exclude,
        merge,
        approval,
        dia_filter: diaFilter,
      });
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to load ledger statement.');
    } finally {
      setLoading(false);
    }
  }, [ledgerId, from, to, voucherType, search, exclude, merge, approval, diaFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveSelection = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        from, to, voucherType, approval, diaFilter, viewType, exclude, merge,
      }));
      setSavedNotice('Selection saved');
      setTimeout(() => setSavedNotice(null), 2000);
    } catch { }
  };

  const handleOpenSourceVoucher = (e: LedgerBookEntry) => {
    if (e.voucher_id) {
      navigate(`/accounting-vouchers/view/${e.voucher_id}`);
    } else if (e.reference_type === 'SALE_REGISTER' && e.reference_id) {
      navigate(`/sale-register/edit/${e.reference_id}`);
    } else if (e.reference_type === 'PURCHASE_REGISTER' && e.reference_id) {
      navigate(`/purchase-register/edit/${e.reference_id}`);
    } else if (e.reference_type === 'SALE_RETURN') {
      navigate('/returns?tab=sale');
    } else if (e.reference_type === 'PURCHASE_RETURN') {
      navigate('/returns?tab=purchase');
    }
  };

  const canOpenSource = (e: LedgerBookEntry) =>
    Boolean(
      e.voucher_id ||
      (e.reference_type === 'SALE_REGISTER' && e.reference_id) ||
      (e.reference_type === 'PURCHASE_REGISTER' && e.reference_id) ||
      e.reference_type === 'SALE_RETURN' ||
      e.reference_type === 'PURCHASE_RETURN'
    );

  const ledger = data?.ledger;
  const entries = data?.entries ?? [];
  const summary = data?.summary;

  useEffect(() => {
    if (ledger?.ledger_name) {
      document.title = `${ledger.ledger_name} - Ledger Statement | Rudra Silver`;
    }
  }, [ledger?.ledger_name]);

  const buildBookReportOptions = (): ReportPdfOptions => ({
    title: `Ledger Statement: ${ledger?.ledger_name || ''}`,
    filename: `Ledger_Statement_${ledger?.ledger_code || ledgerId}_${new Date().toISOString().slice(0, 10)}.pdf`,
    orientation: 'landscape',
    filters: [
      ...(from ? [{ label: 'From', value: from }] : []),
      { label: 'To', value: to },
      ...(ledger?.group_name ? [{ label: 'Group', value: ledger.group_name }] : []),
      ...(voucherType !== 'ALL' ? [{ label: 'Voucher Type', value: voucherType }] : []),
    ],
    columns: [
      { header: 'Gold Cr', dataKey: 'gcr', align: 'right' },
      { header: 'Silver Cr', dataKey: 'scr', align: 'right' },
      { header: 'Amount Cr', dataKey: 'cr', align: 'right' },
      { header: 'Date', dataKey: 'dt' },
      { header: 'Ref No', dataKey: 'ref' },
      { header: 'Type', dataKey: 'vtype' },
      { header: 'Narration', dataKey: 'narr' },
      { header: 'Gold Dr', dataKey: 'gdr', align: 'right' },
      { header: 'Silver Dr', dataKey: 'sdr', align: 'right' },
      { header: 'Amount Dr', dataKey: 'dr', align: 'right' },
      { header: 'Balance (INR)', dataKey: 'bal', align: 'right' },
    ],
    data: entries.map(e => ({
      gcr: fmtWt(e.gold_fine_cr),
      scr: fmtWt(e.silver_fine_cr),
      cr: fmtAmt(e.credit),
      dt: e.posting_date,
      ref: e.reference_no || '—',
      vtype: e.voucher_type || '—',
      narr: e.narration || (e.is_opening ? 'Opening Balance' : '—'),
      gdr: fmtWt(e.gold_fine_dr),
      sdr: fmtWt(e.silver_fine_dr),
      dr: fmtAmt(e.debit),
      bal: `${Number(e.running_balance).toFixed(2)} ${e.balance_type}`,
    })),
    totals: data && summary ? {
      gcr: summary.total_gold_credit.toFixed(3),
      scr: summary.total_silver_credit.toFixed(3),
      cr: summary.total_credit.toFixed(2),
      dt: 'CLOSING',
      gdr: summary.total_gold_debit.toFixed(3),
      sdr: summary.total_silver_debit.toFixed(3),
      dr: summary.total_debit.toFixed(2),
      bal: `${Number(data.closing_balance).toFixed(2)} ${data.closing_balance_type}`,
    } : undefined,
  });

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-[1440px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Back to Ledger List"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {ledger?.photo ? (
              <img src={ledger.photo} alt={ledger.ledger_name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                {ledger ? ledger.ledger_name : 'Ledger Statement'}
                {ledger?.status && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ledger.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                    }`}>{ledger.status}</span>
                )}
              </h1>
              {ledger && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {ledger.ledger_code} · {ledger.group_name}
                  {ledger.city ? ` · ${ledger.city}` : ''}
                  {ledger.mobile ? ` · ${ledger.mobile}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAvgBalance(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${showAvgBalance
                ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-400'
                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-600 dark:text-slate-300'
                }`}
            >
              <Calculator className="w-3.5 h-3.5" /> Avg Balance
            </button>
            <button
              onClick={handleSaveSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
              {savedNotice || 'Save Selection'}
            </button>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={() => printReport(buildBookReportOptions())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={() => exportLedgerCsv(ledgerId, from || undefined, to || undefined)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-100"
            >
              <Download className="w-3.5 h-3.5" /> Excel / CSV
            </button>
            <button
              onClick={() => downloadReportPdf(buildBookReportOptions())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100"
            >
              <FileDown className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">From Date</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">To Date</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Voucher Type</label>
              <select
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              >
                {VOUCHER_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Approval</label>
              <select
                value={approval}
                onChange={(e) => setApproval(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="with_approval">WITH APPROVAL</option>
                <option value="without_approval">WITHOUT APPROVAL</option>
                <option value="approval">APPROVAL</option>
                <option value="selected">SELECTED</option>
                <option value="not_selected">NOT SELECTED</option>
                <option value="account_entry">ACCOUNT ENTRY</option>
                <option value="repair">REPAIR</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Diamond / Stone</label>
              <select
                value={diaFilter}
                onChange={(e) => setDiaFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="">All</option>
                <option value="diamond">With Diamond</option>
                <option value="stone">With Stone</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">View Mode</label>
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value as 'normal' | 'short')}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="normal">Normal View</option>
                <option value="short">Short List</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search narration, ref no..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" checked={exclude} onChange={(e) => setExclude(e.target.checked)} className="rounded-sm border-slate-300 text-amber-500" />
                Exclude
              </label>
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Merge</label>
                <select
                  value={merge}
                  onChange={(e) => setMerge(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="no">No</option>
                  <option value="item_stamp_studed">Item+Stamp Studed</option>
                  <option value="item_remarks_studed">Item+Remarks Studed</option>
                  <option value="type_remarks_studed">Type+Remarks Studed</option>
                  <option value="item_stamp">Item+Stamp</option>
                  <option value="item_type">Item Type</option>
                  <option value="item_rate">Item+Rate</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFrom(''); setTo(new Date().toISOString().slice(0, 10));
                  setVoucherType('ALL'); setSearch(''); setApproval('with_approval');
                  setDiaFilter(''); setExclude(false); setMerge('no'); setViewType('normal');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Reset
              </button>
              <button
                onClick={load}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm"
              >
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards: Amount, Gold Fine, Silver Fine */}
        {data && summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Amount Balance Card */}
            <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount Balance (₹)</span>
                {showAvgBalance && (
                  <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400">
                    Avg: ₹{summary.average_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {summary.average_balance_type}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Total Dr</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{summary.total_debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Total Cr</p>
                  <p className="font-bold text-rose-600 dark:text-rose-400">₹{summary.total_credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Closing</p>
                  <p className={`font-bold ${data.closing_balance_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ₹{Number(data.closing_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {data.closing_balance_type}
                  </p>
                </div>
              </div>
            </div>

            {/* Gold Fine Balance Card */}
            <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Gold Fine Balance (g)</span>
                <span className="text-[11px] text-slate-400">{summary.entry_count} entries</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Total Dr</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{summary.total_gold_debit.toFixed(3)} g</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Total Cr</p>
                  <p className="font-bold text-rose-600 dark:text-rose-400">{summary.total_gold_credit.toFixed(3)} g</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Closing</p>
                  <p className={`font-bold ${data.closing_gold_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {Number(data.closing_gold_balance).toFixed(3)} g {data.closing_gold_type}
                  </p>
                </div>
              </div>
            </div>

            {/* Silver Fine Balance Card */}
            <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Silver Fine Balance (g)</span>
                {!ledger?.photo && (
                  <span className="text-[10px] text-slate-400 inline-flex items-center gap-1"><ImageIcon className="w-3 h-3" /> No Photo</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Total Dr</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{summary.total_silver_debit.toFixed(3)} g</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Total Cr</p>
                  <p className="font-bold text-rose-600 dark:text-rose-400">{summary.total_silver_credit.toFixed(3)} g</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Closing</p>
                  <p className={`font-bold ${data.closing_silver_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {Number(data.closing_silver_balance).toFixed(3)} g {data.closing_silver_type}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statement Table */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[65vh]">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-[#0d1118] border-b border-slate-200 dark:border-white/10 sticky top-0 z-10">
                  <tr>
                    {viewType === 'normal' && (
                      <>
                        <th className="px-3 py-2.5 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">Gold (Cr)</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">Silver (Cr)</th>
                      </>
                    )}
                    <th className="px-3 py-2.5 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">Amount (Cr)</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Date</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Ref No</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Voucher Type</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 min-w-[180px]">Narration</th>
                    {viewType === 'normal' && (
                      <>
                        <th className="px-3 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Dia Wt</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Stone Wt</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Gold (Dr)</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Silver (Dr)</th>
                      </>
                    )}
                    <th className="px-3 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Amount (Dr)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Running Balance</th>

                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={viewType === 'normal' ? 14 : 8} className="py-12 text-center text-slate-400">
                        No transactions found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    entries.map((e, i) => (
                      <tr key={`${e.id}-${i}`} className={`hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors ${e.is_opening ? 'bg-amber-50/30 dark:bg-amber-500/[0.04]' : ''}`}>
                        {viewType === 'normal' && (
                          <>
                            <td className="px-3 py-2 text-right font-mono text-rose-600 dark:text-rose-400">{fmtWt(e.gold_fine_cr)}</td>
                            <td className="px-3 py-2 text-right font-mono text-rose-600 dark:text-rose-400">{fmtWt(e.silver_fine_cr)}</td>
                          </>
                        )}
                        <td className="px-3 py-2 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">{fmtAmt(e.credit)}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{e.posting_date}</td>
                        <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">{e.reference_no || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                            {e.voucher_type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                          {e.narration || (e.is_opening ? 'Opening Balance' : '—')}
                        </td>
                        {viewType === 'normal' && (
                          <>
                            <td className="px-3 py-2 text-right font-mono text-slate-500">{fmtWt(e.diamond_weight)}</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-500">{fmtWt(e.stone_weight)}</td>
                            <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">{fmtWt(e.gold_fine_dr)}</td>
                            <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">{fmtWt(e.silver_fine_dr)}</td>
                          </>
                        )}
                        <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fmtAmt(e.debit)}</td>
                        <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                          <div className={`font-semibold ${e.balance_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {Number(e.running_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {e.balance_type}
                          </div>
                          {(e.running_gold_balance > 0 || e.running_silver_balance > 0) && (
                            <div className="text-[10px] text-slate-400">
                              {e.running_gold_balance > 0 ? `Au ${e.running_gold_balance.toFixed(3)} ${e.gold_balance_type}` : ''}
                              {e.running_gold_balance > 0 && e.running_silver_balance > 0 ? ' · ' : ''}
                              {e.running_silver_balance > 0 ? `Ag ${e.running_silver_balance.toFixed(3)} ${e.silver_balance_type}` : ''}
                            </div>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
                {data && summary && entries.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/10 font-mono font-bold">
                    <tr>
                      {viewType === 'normal' && (
                        <>
                          <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400">{summary.total_gold_credit.toFixed(3)}</td>
                          <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400">{summary.total_silver_credit.toFixed(3)}</td>
                        </>
                      )}
                      <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400">{summary.total_credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td colSpan={4} className="px-3 py-2.5 text-left font-sans text-slate-600 dark:text-slate-300">Closing Totals</td>
                      {viewType === 'normal' && (
                        <>
                          <td colSpan={2} className="px-3 py-2.5"></td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">{summary.total_gold_debit.toFixed(3)}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">{summary.total_silver_debit.toFixed(3)}</td>
                        </>
                      )}
                      <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">{summary.total_debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className={`px-3 py-2.5 text-right whitespace-nowrap ${data.closing_balance_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {Number(data.closing_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {data.closing_balance_type}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
