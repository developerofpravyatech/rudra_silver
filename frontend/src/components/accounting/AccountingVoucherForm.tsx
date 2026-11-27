import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, AlertCircle, Loader2, Printer, CheckSquare, FileDown } from 'lucide-react';
import { ReceiptVoucherForm } from './ReceiptVoucherForm';
import { PaymentVoucherForm } from './PaymentVoucherForm';
import { ContraVoucherForm } from './ContraVoucherForm';
import { JournalVoucherForm } from './JournalVoucherForm';
import type { AccountingVoucherType, OpenInvoiceItem, VoucherAllocationInput } from '../../types';
import { printVoucherPdf, downloadVoucherPdf } from '../../utils/reportPdf';
import { reqDate, reqSelect, reqPositiveNum, focusFirstError, FieldErrors } from '../../utils/validation';
import {
  fetchLedgerDropdown,
  fetchLedgerBalance,
  fetchNextVoucherNo,
  createAccountingVoucher,
  updateAccountingVoucher,
  fetchAccountingVoucherById,
  fetchOpenInvoicesForVoucher,
  type LedgerBalanceResult,
} from '../../services/api';

interface EntryRow {
  ledger_id: number;
  ledger_name: string;
  debit_amount: number;
  credit_amount: number;
  narration: string;
}

interface Props {
  voucherType: AccountingVoucherType;
  voucherId?: number | null;
  onBack: () => void;
  onSuccess: () => void;
}

const VOUCHER_LABELS: Record<AccountingVoucherType, { title: string; color: string; desc: string }> = {
  RECEIPT:  { title: 'Receipt Voucher (F2)',  color: 'text-emerald-600 dark:text-emerald-400', desc: 'Receive payment from customer & allocate against sales invoices' },
  PAYMENT:  { title: 'Payment Voucher (F5)',  color: 'text-rose-600 dark:text-rose-400',       desc: 'Pay supplier & allocate against purchase invoices' },
  CONTRA:   { title: 'Contra Voucher (F3)',   color: 'text-sky-600 dark:text-sky-400',         desc: 'Cash/Bank transfer between accounts' },
  JOURNAL:  { title: 'Journal Voucher (F4)',  color: 'text-purple-600 dark:text-purple-400',   desc: 'General journal adjustment entries' },
};

const BLANK_ENTRY: EntryRow = { ledger_id: 0, ledger_name: '', debit_amount: 0, credit_amount: 0, narration: '' };

export const AccountingVoucherForm: React.FC<Props> = ({ voucherType, voucherId, onBack, onSuccess }) => {
  const isEdit = Boolean(voucherId);
  const [activeType, setActiveType] = useState<AccountingVoucherType>(voucherType);
  const label = VOUCHER_LABELS[activeType];

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState<number>(0);
  const [secondAccountId, setSecondAccountId] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK' | 'UPI' | 'CHEQUE'>('CASH');
  const [amount, setAmount] = useState<number>(0);
  const [narration, setNarration] = useState('');
  const [voucherNo, setVoucherNo] = useState<number>(0);
  const [entries, setEntries] = useState<EntryRow[]>([{ ...BLANK_ENTRY }, { ...BLANK_ENTRY }]);
  const [useDetailedEntries, setUseDetailedEntries] = useState(false);

  // Invoice Allocations for RECEIPT / PAYMENT
  const [openInvoices, setOpenInvoices] = useState<OpenInvoiceItem[]>([]);
  const [allocMap, setAllocMap] = useState<Record<string, number>>({});

  const [accounts, setAccounts] = useState<Array<{ id: number; name: string; account_type: string }>>([]);
  const [ledgerList, setLedgerList] = useState<Array<{ id: number; ledger_name: string; ledger_code: string; group_name: string }>>([]);
  const [ledgerBalances, setLedgerBalances] = useState<Record<number, LedgerBalanceResult>>({});
  const [balanceLoading, setBalanceLoading] = useState<Record<number, boolean>>({});
  const [balanceErrors, setBalanceErrors] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [accs, leds, nextNo] = await Promise.all([
          fetch('/api/v1/accounts', { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }).then(r => r.json()),
          fetchLedgerDropdown(),
          isEdit ? Promise.resolve(0) : fetchNextVoucherNo(voucherType),
        ]);
        setAccounts(Array.isArray(accs.data) ? accs.data : (Array.isArray(accs) ? accs : []));
        setLedgerList(Array.isArray(leds) ? leds : []);
        if (!isEdit) setVoucherNo(nextNo);
      } catch {}
    };
    loadAll();

    if (isEdit && voucherId) {
      setFetchLoading(true);
      fetchAccountingVoucherById(voucherId).then((v: any) => {
        if (v.voucher_type) setActiveType(v.voucher_type);
        setDate(v.voucher_date || new Date().toISOString().slice(0, 10));
        setAccountId(v.account_id || 0);
        setSecondAccountId(v.second_account_id || 0);
        if (v.payment_mode) setPaymentMode(v.payment_mode);
        setAmount(Number(v.net_amount || 0));
        setNarration(v.narration || '');
        setVoucherNo(v.voucher_no || 0);
        if (v.entries && v.entries.length > 0) {
          setEntries(v.entries.map((e: any) => ({
            ledger_id: e.ledger_id,
            ledger_name: e.ledger_name || '',
            debit_amount: Number(e.debit_amount),
            credit_amount: Number(e.credit_amount),
            narration: e.narration || '',
          })));
          const uniqueIds = Array.from(new Set<number>(v.entries.map((e: any) => Number(e.ledger_id)).filter((id: number) => id > 0)));
          uniqueIds.forEach((lid) => { void loadLedgerBalance(lid); });
        }
        if (Array.isArray(v.allocations)) {
          const m: Record<string, number> = {};
          v.allocations.forEach((a: any) => {
            m[`${a.invoice_source}:${a.invoice_id}`] = Number(a.allocated_amount);
          });
          setAllocMap(m);
        }
      }).catch(() => setError('Failed to load voucher.')).finally(() => setFetchLoading(false));
    }
  }, [isEdit, voucherId, voucherType]);

  // Load open invoices whenever party changes for RECEIPT / PAYMENT
  useEffect(() => {
    if ((activeType === 'RECEIPT' || activeType === 'PAYMENT') && accountId > 0) {
      fetchOpenInvoicesForVoucher(activeType, accountId).then(setOpenInvoices).catch(() => setOpenInvoices([]));
    } else {
      setOpenInvoices([]);
    }
  }, [activeType, accountId]);

  const loadLedgerBalance = async (ledgerId: number) => {
    if (!ledgerId || ledgerId <= 0) return;
    setBalanceLoading(prev => ({ ...prev, [ledgerId]: true }));
    setBalanceErrors(prev => {
      if (!prev[ledgerId]) return prev;
      const next = { ...prev };
      delete next[ledgerId];
      return next;
    });
    try {
      const data = await fetchLedgerBalance(ledgerId, {
        excludeVoucherId: isEdit && voucherId ? voucherId : null,
      });
      setLedgerBalances(prev => ({ ...prev, [ledgerId]: data }));
    } catch {
      setBalanceErrors(prev => ({ ...prev, [ledgerId]: true }));
    } finally {
      setBalanceLoading(prev => ({ ...prev, [ledgerId]: false }));
    }
  };

  const addEntryRow = () => setEntries(prev => [...prev, { ...BLANK_ENTRY }]);
  const removeEntryRow = (i: number) => {
    if (entries.length <= 2) return;
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  };
  const updateEntry = (i: number, key: keyof EntryRow, val: any) => {
    setEntries(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  };
  const selectEntryLedger = (i: number, ledgerId: number) => {
    const ledger = ledgerList.find(l => l.id === ledgerId);
    updateEntry(i, 'ledger_id', ledgerId);
    updateEntry(i, 'ledger_name', ledger?.ledger_name || '');
    if (ledgerId > 0) {
      void loadLedgerBalance(ledgerId);
    }
  };

  const totalDr = entries.reduce((s, e) => s + Number(e.debit_amount), 0);
  const totalCr = entries.reduce((s, e) => s + Number(e.credit_amount), 0);
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01;

  const totalAllocated = Object.values(allocMap).reduce((s, v) => s + Number(v || 0), 0);
  const unallocated = Math.max(0, amount - totalAllocated);
  const allocationExceeded = totalAllocated > amount + 0.01;

  const toggleInvoiceAlloc = (inv: OpenInvoiceItem) => {
    const key = `${inv.invoice_source}:${inv.invoice_id}`;
    setAllocMap(prev => {
      const next = { ...prev };
      if (next[key] && next[key] > 0) {
        delete next[key];
      } else {
        const remaining = Math.max(0, amount - Object.values(prev).reduce((s, v) => s + Number(v || 0), 0));
        const autoAmt = amount > 0 ? Math.min(Number(inv.outstanding_amount), remaining) : Number(inv.outstanding_amount);
        next[key] = Number(autoAmt.toFixed(2));
        if (amount === 0) setAmount(Number(autoAmt.toFixed(2)));
      }
      return next;
    });
  };

  const setInvoiceAllocAmt = (inv: OpenInvoiceItem, val: number) => {
    const key = `${inv.invoice_source}:${inv.invoice_id}`;
    const clamped = Math.max(0, Math.min(Number(inv.outstanding_amount), val));
    setAllocMap(prev => ({ ...prev, [key]: clamped }));
  };

  const validateVoucher = (): boolean => {
    const errs: FieldErrors = {};
    const dErr = reqDate(date, 'Voucher Date');
    if (dErr) errs.date = dErr;
    const aErr = reqSelect(accountId, activeType === 'RECEIPT' ? 'a Customer / Party' : activeType === 'PAYMENT' ? 'a Supplier / Party' : 'an Account');
    if (aErr) errs.accountId = aErr;
    if (!useDetailedEntries && activeType !== 'JOURNAL') {
      const amtErr = reqPositiveNum(amount, 'Amount');
      if (amtErr) errs.amount = amtErr;
    }
    if (useDetailedEntries || activeType === 'JOURNAL') {
      const validRows = entries.filter(r => r.ledger_id > 0 && (r.debit_amount > 0 || r.credit_amount > 0));
      if (validRows.length < 2) errs.entries = 'At least 2 balanced journal rows with ledgers are required.';
      else if (!isBalanced) errs.entries = `Entries not balanced: Dr ${totalDr.toFixed(2)} ≠ Cr ${totalCr.toFixed(2)}`;
    }
    if (allocationExceeded) {
      errs.allocations = `Total allocated (₹${totalAllocated.toFixed(2)}) cannot exceed voucher amount (₹${amount.toFixed(2)}).`;
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) { focusFirstError(); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !validateVoucher()) return;

    setLoading(true);
    setError(null);
    try {
      const allocations: VoucherAllocationInput[] = Object.entries(allocMap)
        .filter(([, v]) => Number(v) > 0)
        .map(([k, v]) => {
          const [invoice_source, idStr] = k.split(':');
          return {
            invoice_source: invoice_source as VoucherAllocationInput['invoice_source'],
            invoice_id: Number(idStr),
            allocated_amount: Number(v),
          };
        });

      const payload: any = {
        voucher_type: activeType,
        voucher_date: date,
        account_id: accountId,
        second_account_id: secondAccountId || null,
        payment_mode: paymentMode,
        amount,
        net_amount: amount,
        narration,
        allocations,
      };

      if (useDetailedEntries || activeType === 'JOURNAL') {
        if (!isBalanced) throw new Error(`Entries not balanced: Dr ${totalDr.toFixed(2)} ≠ Cr ${totalCr.toFixed(2)}`);
        payload.entries = entries.filter(r => r.ledger_id > 0 && (r.debit_amount > 0 || r.credit_amount > 0));
      }

      if (isEdit && voucherId) {
        await updateAccountingVoucher(voucherId, payload);
      } else {
        await createAccountingVoucher(payload);
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Failed to save voucher.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  );

  if ((activeType as string) === 'RECEIPT' && !fetchLoading) {
    return <ReceiptVoucherForm voucherId={voucherId} onBack={onBack} onSuccess={onSuccess} />;
  }

  if ((activeType as string) === 'PAYMENT' && !fetchLoading) {
    return <PaymentVoucherForm voucherId={voucherId} onBack={onBack} onSuccess={onSuccess} />;
  }

  if ((activeType as string) === 'CONTRA' && !fetchLoading) {
    return <ContraVoucherForm voucherId={voucherId} onBack={onBack} onSuccess={onSuccess} />;
  }

  if ((activeType as string) === 'JOURNAL' && !fetchLoading) {
    return <JournalVoucherForm voucherId={voucherId} onBack={onBack} onSuccess={onSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className={`text-xl font-bold ${label.color}`}>{label.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label.desc}</p>
          </div>
          {voucherNo > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-400">
                #{voucherNo}
              </span>
              <button type="button" onClick={() => {
                const partyName = accounts.find(a => a.id === accountId)?.name || '—';
                const secName = accounts.find(a => a.id === secondAccountId)?.name || null;
                printVoucherPdf({
                  voucher_no: voucherNo || 'NEW',
                  series: activeType.slice(0, 3),
                  voucher_type: activeType,
                  voucher_date: date,
                  account_name: partyName,
                  second_account_name: secName,
                  payment_mode: paymentMode,
                  net_amount: amount,
                  narration,
                  entries: useDetailedEntries || activeType === 'JOURNAL' ? entries : undefined,
                });
              }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button type="button" onClick={() => {
                const partyName = accounts.find(a => a.id === accountId)?.name || '—';
                const secName = accounts.find(a => a.id === secondAccountId)?.name || null;
                downloadVoucherPdf({
                  voucher_no: voucherNo || 'NEW',
                  series: activeType.slice(0, 3),
                  voucher_type: activeType,
                  voucher_date: date,
                  account_name: partyName,
                  second_account_name: secName,
                  payment_mode: paymentMode,
                  net_amount: amount,
                  narration,
                  entries: useDetailedEntries || activeType === 'JOURNAL' ? entries : undefined,
                });
              }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100">
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Basic Fields */}
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date <span className="text-rose-500">*</span></label>
                <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setFieldErrors(fe => { const n={...fe}; delete n.date; return n; }); }}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${fieldErrors.date ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                {fieldErrors.date && <p className="text-rose-500 text-xs mt-1">{fieldErrors.date}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {activeType === 'RECEIPT' ? 'Customer / Party' : activeType === 'PAYMENT' ? 'Supplier / Party' : 'Account'} <span className="text-rose-500">*</span>
                </label>
                <select value={accountId} onChange={(e) => { const v = Number(e.target.value); setAccountId(v); setAllocMap({}); if (v) setFieldErrors(fe => { const n={...fe}; delete n.accountId; return n; }); }}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${fieldErrors.accountId ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`}>
                  <option value="">-- Select Party --</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.account_type})</option>)}
                </select>
                {fieldErrors.accountId && <p className="text-rose-500 text-xs mt-1">{fieldErrors.accountId}</p>}
              </div>
              {(activeType === 'RECEIPT' || activeType === 'PAYMENT') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Payment Mode</label>
                  <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30">
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              )}
              {(activeType === 'CONTRA' || activeType === 'RECEIPT' || activeType === 'PAYMENT') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {activeType === 'CONTRA' ? 'Transfer To Account' : activeType === 'RECEIPT' ? 'Deposit To (Cash/Bank)' : 'Paid From (Cash/Bank)'}
                  </label>
                  <select value={secondAccountId} onChange={(e) => setSecondAccountId(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30">
                    <option value="">-- Auto ({paymentMode === 'CASH' ? 'Cash in Hand' : 'Bank Account'}) --</option>
                    {accounts.filter(a => ['CASH','BANK'].includes(a.account_type)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount (₹) <span className="text-rose-500">*</span></label>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => { const v = Number(e.target.value); setAmount(v); if (v > 0) setFieldErrors(fe => { const n={...fe}; delete n.amount; return n; }); }}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${fieldErrors.amount ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                {fieldErrors.amount && <p className="text-rose-500 text-xs mt-1">{fieldErrors.amount}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Narration / Remarks</label>
                <input type="text" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="e.g. Payment against invoice..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30" />
              </div>
            </div>
          </div>

          {/* Against Invoice Allocation Panel for RECEIPT / PAYMENT */}
          {(activeType === 'RECEIPT' || activeType === 'PAYMENT') && accountId > 0 && (
            <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                    Against {activeType === 'RECEIPT' ? 'Sales' : 'Purchase'} Invoices
                  </h2>
                  <p className="text-xs text-slate-400">Select unpaid/partial invoices to allocate this {activeType.toLowerCase()}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">Allocated: <strong className={allocationExceeded ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}>₹{totalAllocated.toFixed(2)}</strong></span>
                  <span className="text-slate-500">Unallocated (Advance): <strong className="text-amber-600 dark:text-amber-400">₹{unallocated.toFixed(2)}</strong></span>
                </div>
              </div>

              {openInvoices.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No unpaid or partially paid invoices found for this party. Full amount will be recorded as Advance / Unallocated.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                      <tr>
                        <th className="px-3 py-2 text-left">Select</th>
                        <th className="px-3 py-2 text-left">Invoice No</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Particulars</th>
                        <th className="px-3 py-2 text-right">Total (₹)</th>
                        <th className="px-3 py-2 text-right">Paid (₹)</th>
                        <th className="px-3 py-2 text-right">Outstanding (₹)</th>
                        <th className="px-3 py-2 text-right w-36">Allocate (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {openInvoices.map((inv) => {
                        const key = `${inv.invoice_source}:${inv.invoice_id}`;
                        const alloc = allocMap[key] || 0;
                        return (
                          <tr key={key} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                            <td className="px-3 py-2">
                              <input type="checkbox" checked={alloc > 0} onChange={() => toggleInvoiceAlloc(inv)}
                                className="rounded-sm border-slate-300 text-amber-500 w-4 h-4 cursor-pointer" />
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-slate-700 dark:text-slate-200">{inv.voucher_no}</td>
                            <td className="px-3 py-2 text-slate-500">{inv.voucher_date}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{inv.particulars || '—'}</td>
                            <td className="px-3 py-2 text-right">{Number(inv.total_amount).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">{Number(inv.paid_amount).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-bold text-rose-600 dark:text-rose-400">{Number(inv.outstanding_amount).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">
                              <input type="number" min="0" max={inv.outstanding_amount} step="0.01"
                                value={alloc || ''}
                                onChange={(e) => setInvoiceAllocAmt(inv, Number(e.target.value))}
                                placeholder="0.00"
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-right font-semibold text-slate-900 dark:text-slate-100" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Journal Entries */}
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Journal Entries</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeType === 'JOURNAL' ? 'Enter balanced Dr/Cr entries' : 'Optional: override auto-entries'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {activeType !== 'JOURNAL' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={useDetailedEntries} onChange={(e) => setUseDetailedEntries(e.target.checked)}
                      className="rounded-sm border-slate-300 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">Custom entries</span>
                  </label>
                )}
                {(useDetailedEntries || activeType === 'JOURNAL') && (
                  <button type="button" onClick={addEntryRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                )}
              </div>
            </div>

            {(useDetailedEntries || activeType === 'JOURNAL') && (
              <div className="overflow-x-auto">
                {fieldErrors.entries && <p className="text-rose-500 text-xs mb-2">{fieldErrors.entries}</p>}
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-400 w-4/12">Ledger</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 w-2/12">Balance</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 w-2/12">Debit (₹)</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 w-2/12">Credit (₹)</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-400 w-2/12">Narration</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {entries.map((row, i) => {
                      const bal = row.ledger_id > 0 ? ledgerBalances[row.ledger_id] : undefined;
                      const isBalLoading = row.ledger_id > 0 && Boolean(balanceLoading[row.ledger_id]);
                      const hasBalError = row.ledger_id > 0 && Boolean(balanceErrors[row.ledger_id]);
                      return (
                      <tr key={i}>
                        <td className="px-2 py-1.5">
                          <select value={row.ledger_id} onChange={(e) => selectEntryLedger(i, Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs">
                            <option value="">-- Select Ledger --</option>
                            {ledgerList.map(l => <option key={l.id} value={l.id}>{l.ledger_name} ({l.group_name})</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 text-right whitespace-nowrap font-mono">
                          {row.ledger_id <= 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : isBalLoading ? (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                            </span>
                          ) : hasBalError ? (
                            <span className="text-rose-500">N/A</span>
                          ) : bal ? (
                            <div className="leading-tight">
                              <span className={`font-semibold ${bal.balance_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {Number(bal.balance).toFixed(2)} {bal.balance_type === 'DR' ? 'Dr' : 'Cr'}
                              </span>
                              {((bal.fine_gold ?? 0) !== 0 || (bal.fine_silver ?? 0) !== 0) && (
                                <div className="text-[10px] text-slate-400">
                                  {(bal.fine_gold ?? 0) !== 0 ? `Au ${Number(bal.fine_gold).toFixed(3)}g` : ''}
                                  {(bal.fine_gold ?? 0) !== 0 && (bal.fine_silver ?? 0) !== 0 ? ' · ' : ''}
                                  {(bal.fine_silver ?? 0) !== 0 ? `Ag ${Number(bal.fine_silver).toFixed(3)}g` : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="0.01" value={row.debit_amount || ''} onChange={(e) => updateEntry(i, 'debit_amount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs text-right" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="0.01" value={row.credit_amount || ''} onChange={(e) => updateEntry(i, 'credit_amount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs text-right" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="text" value={row.narration} onChange={(e) => updateEntry(i, 'narration', e.target.value)} placeholder="Note..."
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs" />
                        </td>
                        <td className="px-2 py-1.5">
                          <button type="button" onClick={() => removeEntryRow(i)} disabled={entries.length <= 2}
                            className="p-1 rounded text-slate-300 dark:text-slate-600 hover:text-rose-500 disabled:opacity-30">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10">
                    <tr>
                      <td className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Total</td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">{totalDr.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-bold text-rose-600 dark:text-rose-400">{totalCr.toFixed(2)}</td>
                      <td colSpan={2} className="px-3 py-2 text-right">
                        {!isBalanced && <span className="text-rose-500 text-[10px] font-semibold">⚠ Unbalanced by {Math.abs(totalDr - totalCr).toFixed(2)}</span>}
                        {isBalanced && totalDr > 0 && <span className="text-emerald-500 text-[10px] font-semibold">✓ Balanced</span>}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pb-6">
            <button type="button" onClick={onBack} disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={loading || allocationExceeded || ((useDetailedEntries || activeType === 'JOURNAL') && !isBalanced && totalDr > 0)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : isEdit ? 'Update Voucher' : 'Save Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
