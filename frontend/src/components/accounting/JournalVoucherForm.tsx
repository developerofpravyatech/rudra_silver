import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Printer,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  CheckCircle2,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { printVoucherPdf } from '../../utils/reportPdf';
import {
  fetchLedgerDropdown,
  fetchLedgerBalance,
  fetchNextVoucherNo,
  fetchVoucherBranches,
  fetchAdjacentVoucherId,
  createAccountingVoucher,
  updateAccountingVoucher,
  deleteAccountingVoucher,
  fetchAccountingVoucherById,
  type LedgerBalanceResult,
} from '../../services/api';

interface LedgerOption {
  id: number;
  ledger_code: string;
  ledger_name: string;
  group_name: string;
  account_type?: string;
  mobile?: string;
  city?: string;
}

interface VoucherRow {
  type: 'Dr' | 'Cr';
  ledger_id: number;
  ledger_name: string;
  sub_account: string;
  debit_amount: string;
  credit_amount: string;
  narration: string;
}

interface Props {
  voucherId?: number | null;
  onBack: () => void;
  onSuccess?: () => void;
}

const createBlankRow = (type: 'Dr' | 'Cr' = 'Dr'): VoucherRow => ({
  type,
  ledger_id: 0,
  ledger_name: '',
  sub_account: '',
  debit_amount: '',
  credit_amount: '',
  narration: '',
});

const SearchablePartySelect: React.FC<{
  value: number;
  options: LedgerOption[];
  onChange: (ledgerId: number) => void;
  hasError?: boolean;
}> = ({ value, options, onChange, hasError }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((o) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      o.ledger_name.toLowerCase().includes(q) ||
      (o.group_name || '').toLowerCase().includes(q) ||
      (o.ledger_code || '').toLowerCase().includes(q) ||
      (o.mobile || '').toLowerCase().includes(q) ||
      (o.city || '').toLowerCase().includes(q)
    );
  });

  return (
    <div ref={containerRef} className="relative w-full">
      <button type="button" onClick={() => { setOpen((prev) => !prev); setQuery(''); }}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left text-xs transition bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 ${
          hasError ? 'border-rose-400' : 'border-slate-200 dark:border-white/10 hover:border-purple-400'
        }`}>
        <span className="truncate font-medium">{selected ? selected.ledger_name : '-- Select Ledger Account --'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 sm:w-80 bg-white dark:bg-[#161b26] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-1.5 bg-slate-50 dark:bg-[#11151e]">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input type="text" autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search account name, group, mobile..." className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none" />
            {query && <button type="button" onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>}
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">No matching accounts found</div>
            ) : (
              filtered.map((opt) => (
                <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setOpen(false); setQuery(''); }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-purple-50 dark:hover:bg-purple-500/10 transition flex items-center justify-between gap-2 ${opt.id === value ? 'bg-purple-50/70 dark:bg-purple-500/15 font-semibold' : ''}`}>
                  <div className="min-w-0">
                    <div className="text-slate-800 dark:text-slate-100 truncate">{opt.ledger_name}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {opt.group_name}{opt.city ? ` • ${opt.city}` : ''}{opt.mobile ? ` • ${opt.mobile}` : ''}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 shrink-0">{opt.ledger_code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const JournalVoucherForm: React.FC<Props> = ({ voucherId: initialVoucherId, onBack }) => {
  const [currentId, setCurrentId] = useState<number | null>(initialVoucherId || null);
  const isEdit = Boolean(currentId);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [series, setSeries] = useState('JNL');
  const [branchId, setBranchId] = useState<number>(1);
  const [voucherNo, setVoucherNo] = useState<number>(1);
  const [voucherStatus, setVoucherStatus] = useState<string>('NEW');
  const [commonNarration, setCommonNarration] = useState('');

  const [prevId, setPrevId] = useState<number | null>(null);
  const [nextId, setNextId] = useState<number | null>(null);

  // Journal: starts with 2 blank rows, freely choose Dr/Cr
  const [rows, setRows] = useState<VoucherRow[]>([createBlankRow('Dr'), createBlankRow('Cr')]);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);

  const [branches, setBranches] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [ledgerOptions, setLedgerOptions] = useState<LedgerOption[]>([]);
  const [ledgerBalances, setLedgerBalances] = useState<Record<number, LedgerBalanceResult>>({});
  const [balanceLoading, setBalanceLoading] = useState<Record<number, boolean>>({});

  const [fetchLoading, setFetchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadLedgerBalance = useCallback(async (ledgerId: number, excludeVid?: number | null) => {
    if (!ledgerId || ledgerId <= 0) return;
    setBalanceLoading((prev) => ({ ...prev, [ledgerId]: true }));
    try {
      const data = await fetchLedgerBalance(ledgerId, { excludeVoucherId: excludeVid || null });
      setLedgerBalances((prev) => ({ ...prev, [ledgerId]: data }));
    } catch { } finally {
      setBalanceLoading((prev) => ({ ...prev, [ledgerId]: false }));
    }
  }, []);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [leds, accsRes, branchList] = await Promise.all([
          fetchLedgerDropdown(),
          fetch('/api/v1/accounts?limit=200', { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }).then((r) => r.json()).catch(() => []),
          fetchVoucherBranches(),
        ]);
        const accList: Array<any> = Array.isArray(accsRes) ? accsRes : (Array.isArray(accsRes?.data) ? accsRes.data : []);
        const accByName = new Map<string, any>();
        accList.forEach((a) => { if (a.name) accByName.set(String(a.name).toLowerCase(), a); });
        const merged: LedgerOption[] = (Array.isArray(leds) ? leds : []).map((l: any) => {
          const acc = accByName.get(String(l.ledger_name || '').toLowerCase());
          return { id: Number(l.id), ledger_code: l.ledger_code || '', ledger_name: l.ledger_name || '', group_name: l.group_name || '', account_type: acc?.account_type, mobile: acc?.mobile, city: acc?.city };
        });
        setLedgerOptions(merged);
        setBranches(branchList.length > 0 ? branchList : [{ id: 1, code: 'HO-RAJ', name: 'Rudra Silver Head Office' }]);
      } catch { }
    };
    loadMasters();
  }, []);

  const loadVoucherById = useCallback(async (id: number) => {
    setFetchLoading(true); setError(null); setSuccessMsg(null); setFieldErrors({});
    try {
      const v: any = await fetchAccountingVoucherById(id);
      setCurrentId(id);
      setDate(v.voucher_date || new Date().toISOString().slice(0, 10));
      setSeries(v.series || 'JNL');
      setBranchId(Number(v.branch_id || 1));
      setVoucherNo(Number(v.voucher_no || 0));
      setVoucherStatus(v.status || 'POSTED');
      setCommonNarration(v.narration || '');
      setPrevId(v.prev_id ? Number(v.prev_id) : null);
      setNextId(v.next_id ? Number(v.next_id) : null);
      if (Array.isArray(v.entries) && v.entries.length > 0) {
        const mapped: VoucherRow[] = v.entries.map((e: any) => {
          const dr = Number(e.debit_amount || 0); const cr = Number(e.credit_amount || 0);
          return { type: cr > 0 && dr === 0 ? 'Cr' : 'Dr', ledger_id: Number(e.ledger_id), ledger_name: e.ledger_name || '', sub_account: e.sub_account || '', debit_amount: dr > 0 ? dr.toFixed(2) : '', credit_amount: cr > 0 ? cr.toFixed(2) : '', narration: e.narration || '' };
        });
        while (mapped.length < 2) mapped.push(createBlankRow('Cr'));
        setRows(mapped);
        const ids = Array.from(new Set<number>(mapped.map((r) => r.ledger_id).filter((lid) => lid > 0)));
        ids.forEach((lid) => { void loadLedgerBalance(lid, id); });
      } else {
        setRows([createBlankRow('Dr'), createBlankRow('Cr')]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load journal voucher.');
    } finally { setFetchLoading(false); }
  }, [loadLedgerBalance]);

  const resetToNew = useCallback(async (targetSeries: string = series) => {
    setCurrentId(null); setDate(new Date().toISOString().slice(0, 10)); setVoucherStatus('NEW');
    setCommonNarration(''); setRows([createBlankRow('Dr'), createBlankRow('Cr')]); setError(null); setFieldErrors({}); setNextId(null);
    try {
      const [nextNo, latestPrev] = await Promise.all([fetchNextVoucherNo('JOURNAL', targetSeries), fetchAdjacentVoucherId('JOURNAL', 0, 'prev')]);
      setVoucherNo(nextNo); setPrevId(latestPrev);
    } catch { }
  }, [series]);

  useEffect(() => {
    if (initialVoucherId) void loadVoucherById(initialVoucherId);
    else void resetToNew('JNL');
  }, [initialVoucherId, loadVoucherById, resetToNew]);

  const addRow = () => setRows((prev) => [...prev, createBlankRow('Dr')]);
  const removeRow = (index: number) => { if (rows.length <= 2) return; setRows((prev) => prev.filter((_, i) => i !== index)); };

  const handleRowTypeChange = (index: number, newType: 'Dr' | 'Cr') => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== index) return r;
      if (newType === 'Dr') return { ...r, type: 'Dr', debit_amount: r.debit_amount || r.credit_amount, credit_amount: '' };
      return { ...r, type: 'Cr', credit_amount: r.credit_amount || r.debit_amount, debit_amount: '' };
    }));
  };

  const handleRowPartyChange = (index: number, ledgerId: number) => {
    const found = ledgerOptions.find((l) => l.id === ledgerId);
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ledger_id: ledgerId, ledger_name: found?.ledger_name || '' } : r)));
    setActiveRowIndex(index);
    setFieldErrors((fe) => { const n = { ...fe }; delete n.entries; return n; });
    if (ledgerId > 0) void loadLedgerBalance(ledgerId, currentId);
  };

  const handleRowAmountChange = (index: number, side: 'Dr' | 'Cr', val: string) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== index) return r;
      if (side === 'Dr') return { ...r, type: 'Dr', debit_amount: val, credit_amount: '' };
      return { ...r, type: 'Cr', credit_amount: val, debit_amount: '' };
    }));
    setFieldErrors((fe) => { const n = { ...fe }; delete n.entries; return n; });
  };

  const handleRowFieldChange = (index: number, key: 'sub_account' | 'narration', val: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: val } : r)));
  };

  const totalDr = rows.reduce((s, r) => s + (parseFloat(r.debit_amount) || 0), 0);
  const totalCr = rows.reduce((s, r) => s + (parseFloat(r.credit_amount) || 0), 0);
  const diff = Math.abs(totalDr - totalCr);
  const isBalanced = diff < 0.01 && totalDr > 0;

  const previewRow = rows[activeRowIndex]?.ledger_id > 0 ? rows[activeRowIndex] : rows.find((r) => r.ledger_id > 0);
  const previewBal = previewRow && previewRow.ledger_id > 0 ? ledgerBalances[previewRow.ledger_id] : undefined;

  const getProjectedClosing = () => {
    if (!previewRow || !previewBal) return null;
    const curSigned = previewBal.balance_type === 'DR' ? previewBal.balance : -previewBal.balance;
    const rowDr = parseFloat(previewRow.debit_amount) || 0; const rowCr = parseFloat(previewRow.credit_amount) || 0;
    const nextSigned = curSigned + rowDr - rowCr;
    return { ledgerName: previewRow.ledger_name, amount: Math.abs(nextSigned), type: nextSigned >= 0 ? 'Dr' : 'Cr' };
  };
  const closingPreview = getProjectedClosing();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!date) errs.date = 'Date is required.';
    if (!series.trim()) errs.series = 'Series is required.';
    const nonEmptyRows = rows.filter((r) => r.ledger_id > 0 || (parseFloat(r.debit_amount) || 0) > 0 || (parseFloat(r.credit_amount) || 0) > 0);
    if (nonEmptyRows.length < 2) {
      errs.entries = 'At least 2 valid accounting entries (Dr & Cr) are required.';
    } else {
      for (let i = 0; i < nonEmptyRows.length; i++) {
        const r = nonEmptyRows[i];
        const amt = (parseFloat(r.debit_amount) || 0) + (parseFloat(r.credit_amount) || 0);
        if (!r.ledger_id || r.ledger_id <= 0) { errs.entries = `Row ${i + 1}: Ledger account selection is required.`; break; }
        if (amt <= 0) { errs.entries = `Row ${i + 1}: Amount must be greater than zero.`; break; }
      }
      if (!errs.entries && Math.abs(totalDr - totalCr) >= 0.01) {
        errs.entries = `Debit (₹${totalDr.toFixed(2)}) and Credit (₹${totalCr.toFixed(2)}) totals must match. Journal entries must be balanced.`;
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true); setError(null); setSuccessMsg(null);
    try {
      const validEntries = rows
        .filter((r) => r.ledger_id > 0 && ((parseFloat(r.debit_amount) || 0) > 0 || (parseFloat(r.credit_amount) || 0) > 0))
        .map((r) => ({ ledger_id: r.ledger_id, sub_account: r.sub_account.trim() || null, debit_amount: parseFloat(r.debit_amount) || 0, credit_amount: parseFloat(r.credit_amount) || 0, narration: r.narration.trim() || commonNarration.trim() || '' }));
      const payload: any = { voucher_type: 'JOURNAL', voucher_date: date, series: series.trim().toUpperCase(), branch_id: branchId, is_pdc: 0, amount: Number(totalDr.toFixed(2)), net_amount: Number(totalDr.toFixed(2)), narration: commonNarration.trim(), entries: validEntries };
      if (isEdit && currentId) {
        await updateAccountingVoucher(currentId, payload);
        setSuccessMsg(`Journal Voucher #${voucherNo} updated successfully!`);
        await loadVoucherById(currentId);
      } else {
        const res: any = await createAccountingVoucher(payload);
        const createdId = Number(res.voucher_id); const createdNo = Number(res.voucher_no || voucherNo);
        setSuccessMsg(`Journal Voucher #${createdNo} saved successfully!`);
        if (createdId > 0) await loadVoucherById(createdId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save journal voucher.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!currentId || saving) return;
    const result = await Swal.fire({ title: 'Delete Journal Voucher?', text: `Cancel Journal #${voucherNo}? All corresponding ledger postings will be reversed.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', cancelButtonColor: '#64748b', confirmButtonText: 'Yes, Delete', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    setSaving(true); setError(null);
    try {
      await deleteAccountingVoucher(currentId);
      Swal.fire({ icon: 'success', title: 'Deleted!', text: `Journal #${voucherNo} deleted and ledger postings reversed.`, timer: 1600, showConfirmButton: false });
      const fallbackId = prevId || nextId;
      if (fallbackId) await loadVoucherById(fallbackId);
      else await resetToNew(series);
    } catch (err: any) {
      setError(err.message || 'Failed to delete journal voucher.');
    } finally { setSaving(false); }
  };

  const handleNavigate = async (direction: 'prev' | 'next') => {
    if (fetchLoading || saving) return;
    const targetId = direction === 'prev' ? prevId : nextId;
    if (targetId) { await loadVoucherById(targetId); return; }
    const fetchedId = await fetchAdjacentVoucherId('JOURNAL', currentId || 0, direction);
    if (fetchedId) await loadVoucherById(fetchedId);
  };

  const handlePrint = () => {
    const validEntries = rows.filter((r) => r.ledger_id > 0 && ((parseFloat(r.debit_amount) || 0) > 0 || (parseFloat(r.credit_amount) || 0) > 0)).map((r) => {
      const opt = ledgerOptions.find((l) => l.id === r.ledger_id);
      return { ledger_code: opt?.ledger_code || '—', ledger_name: r.sub_account ? `${r.ledger_name} (${r.sub_account})` : r.ledger_name, narration: r.narration || commonNarration, debit_amount: parseFloat(r.debit_amount) || 0, credit_amount: parseFloat(r.credit_amount) || 0 };
    });
    const drParty = rows.find((r) => r.type === 'Dr' && r.ledger_name)?.ledger_name || '—';
    printVoucherPdf({ voucher_no: voucherNo || 'NEW', series: series || 'JNL', voucher_type: 'JOURNAL', voucher_date: date, account_name: drParty, second_account_name: null, payment_mode: 'JOURNAL', net_amount: totalDr, narration: commonNarration, entries: validEntries });
  };

  if (fetchLoading) {
    return <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer" title="Back to Vouchers">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-purple-600 dark:text-purple-400">Journal Voucher</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">General journal adjustment entries with balanced Dr/Cr</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-xs font-bold text-purple-700 dark:text-purple-400 font-mono">{series}/{voucherNo}</span>
            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${voucherStatus === 'NEW' ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' : voucherStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>{voucherStatus}</span>
          </div>
        </div>

        <form onSubmit={handleSave} noValidate className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
          {successMsg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{successMsg}</span></div>}

          {/* Header Card */}
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date <span className="text-rose-500">*</span></label>
                <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setFieldErrors((fe) => { const n = { ...fe }; delete n.date; return n; }); }}
                  className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${fieldErrors.date ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                {fieldErrors.date && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.date}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Series <span className="text-rose-500">*</span></label>
                <input type="text" value={series} maxLength={10}
                  onChange={(e) => { const val = e.target.value.toUpperCase(); setSeries(val); setFieldErrors((fe) => { const n = { ...fe }; delete n.series; return n; }); }}
                  onBlur={() => { if (!isEdit && series.trim()) fetchNextVoucherNo('JOURNAL', series.trim()).then(setVoucherNo).catch(() => {}); }}
                  placeholder="JNL"
                  className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${fieldErrors.series ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                {fieldErrors.series && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.series}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Site</label>
                <select value={branchId} onChange={(e) => setBranchId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Voucher Number</label>
                <input type="text" readOnly value={voucherNo > 0 ? String(voucherNo) : 'Auto'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] text-slate-700 dark:text-slate-200 text-xs font-mono font-bold cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Transaction Grid */}
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Journal Entries</h2>
                <p className="text-[11px] text-slate-400">Enter balanced Debit &amp; Credit entries — Total Dr must equal Total Cr</p>
              </div>
              <button type="button" onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-semibold hover:bg-purple-100 transition-colors cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            {fieldErrors.entries && <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">{fieldErrors.entries}</div>}
            <div className="overflow-x-visible">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.03] border-y border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="px-2 py-2.5 text-left w-20">Type</th>
                    <th className="px-2 py-2.5 text-left min-w-[220px]">Ledger Account</th>
                    <th className="px-2 py-2.5 text-left w-36">Sub A/c</th>
                    <th className="px-2 py-2.5 text-right w-32">Balance</th>
                    <th className="px-2 py-2.5 text-right w-28">Dr (₹)</th>
                    <th className="px-2 py-2.5 text-right w-28">Cr (₹)</th>
                    <th className="px-2 py-2.5 text-left min-w-[150px]">Narration</th>
                    <th className="px-2 py-2.5 w-9"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {rows.map((row, i) => {
                    const bal = row.ledger_id > 0 ? ledgerBalances[row.ledger_id] : undefined;
                    const isBalLoading = row.ledger_id > 0 && Boolean(balanceLoading[row.ledger_id]);
                    return (
                      <tr key={i} onClick={() => setActiveRowIndex(i)} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                        <td className="px-2 py-2">
                          <select value={row.type} onChange={(e) => handleRowTypeChange(i, e.target.value as 'Dr' | 'Cr')}
                            className={`w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold ${row.type === 'Dr' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            <option value="Dr">Dr</option>
                            <option value="Cr">Cr</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <SearchablePartySelect value={row.ledger_id} options={ledgerOptions} onChange={(lid) => handleRowPartyChange(i, lid)} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={row.sub_account} onChange={(e) => handleRowFieldChange(i, 'sub_account', e.target.value)}
                            placeholder="Sub A/c..." className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs" />
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap font-mono">
                          {row.ledger_id <= 0 ? <span className="text-slate-400">—</span>
                          : isBalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline text-purple-500" />
                          : bal ? (
                            <div className="leading-tight">
                              <span className={`font-semibold ${bal.balance_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                ₹{Number(bal.balance).toFixed(2)} {bal.balance_type === 'DR' ? 'Dr' : 'Cr'}
                              </span>
                              {((bal.fine_gold ?? 0) !== 0 || (bal.fine_silver ?? 0) !== 0) && (
                                <div className="text-[10px] text-slate-400">
                                  {(bal.fine_gold ?? 0) !== 0 ? `Au ${Number(bal.fine_gold).toFixed(3)}g ` : ''}
                                  {(bal.fine_silver ?? 0) !== 0 ? `Ag ${Number(bal.fine_silver).toFixed(3)}g` : ''}
                                </div>
                              )}
                            </div>
                          ) : <span className="text-slate-400">₹0.00</span>}
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="0" step="0.01" value={row.debit_amount} onChange={(e) => handleRowAmountChange(i, 'Dr', e.target.value)} placeholder="0.00"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs text-right font-mono font-semibold" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="0" step="0.01" value={row.credit_amount} onChange={(e) => handleRowAmountChange(i, 'Cr', e.target.value)} placeholder="0.00"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs text-right font-mono font-semibold" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={row.narration} onChange={(e) => handleRowFieldChange(i, 'narration', e.target.value)}
                            placeholder="Row narration..." className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs" />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button type="button" onClick={() => removeRow(i)} disabled={rows.length <= 2}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer" title="Remove Row">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Running totals footer */}
                <tfoot className="bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Total</td>
                    <td className="px-3 py-2 text-right text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">₹{totalDr.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-xs font-bold text-rose-700 dark:text-rose-400 font-mono">₹{totalCr.toFixed(2)}</td>
                    <td colSpan={2} className="px-3 py-2 text-right">
                      {!isBalanced && totalDr > 0 && <span className="text-rose-500 text-[10px] font-semibold">⚠ Unbalanced by ₹{diff.toFixed(2)}</span>}
                      {isBalanced && <span className="text-emerald-500 text-[10px] font-semibold">✓ Balanced</span>}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-6">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Common Narration</label>
                <input type="text" value={commonNarration} onChange={(e) => setCommonNarration(e.target.value)}
                  placeholder="Enter common narration for this journal..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
              </div>
              <div className="lg:col-span-6 grid grid-cols-3 gap-3 text-right">
                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/20">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Debit</div>
                  <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">₹{totalDr.toFixed(2)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/70 dark:border-rose-500/20">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Credit</div>
                  <div className="text-sm font-bold font-mono text-rose-700 dark:text-rose-400">₹{totalCr.toFixed(2)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-500/10 border border-purple-200/70 dark:border-purple-500/20">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase truncate">
                    {closingPreview ? `Closing (${closingPreview.ledgerName})` : 'Balance Check'}
                  </div>
                  <div className="text-sm font-bold font-mono text-purple-700 dark:text-purple-400">
                    {closingPreview ? `₹${closingPreview.amount.toFixed(2)} ${closingPreview.type}` : isBalanced ? '✓ Balanced' : `Diff ₹${diff.toFixed(2)}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => resetToNew(series)} disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50">
                <FilePlus2 className="w-3.5 h-3.5 text-sky-500" /><span>New</span>
              </button>
              <button type="button" onClick={() => handleNavigate('prev')} disabled={saving || !prevId}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40">
                <ChevronLeft className="w-3.5 h-3.5" /><span>Previous</span>
              </button>
              <button type="button" onClick={() => handleNavigate('next')} disabled={saving || !nextId}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40">
                <span>Next</span><ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={handlePrint} disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50">
                <Printer className="w-3.5 h-3.5 text-amber-500" /><span>Print</span>
              </button>
              {isEdit && (
                <button type="button" onClick={handleDelete} disabled={saving}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /><span>Delete</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={onBack} disabled={saving}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
