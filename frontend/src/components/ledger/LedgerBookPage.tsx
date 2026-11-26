import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, BookOpen, Printer, FileDown } from 'lucide-react';
import type { Ledger, LedgerPosting } from '../../types';
import { fetchLedgerBook } from '../../services/api';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';

interface Props {
  ledgerId: number;
  onBack: () => void;
}

export const LedgerBookPage: React.FC<Props> = ({ ledgerId, onBack }) => {
  const [data, setData] = useState<{ ledger: Ledger; entries: LedgerPosting[]; closing_balance: number; closing_balance_type: 'DR' | 'CR' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLedgerBook(ledgerId, from || undefined, to || undefined);
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to load ledger book.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ledgerId, from, to]);

  const ledger = data?.ledger;
  const entries = data?.entries ?? [];

  const buildBookReportOptions = (): ReportPdfOptions => ({
    title: `Ledger Book: ${ledger?.ledger_name || ''}`,
    filename: `Ledger_${ledger?.ledger_code || ledgerId}_${new Date().toISOString().slice(0, 10)}.pdf`,
    orientation: 'portrait',
    filters: [
      ...(from ? [{ label: 'From', value: from }] : []),
      { label: 'To', value: to },
      ...(ledger?.group_name ? [{ label: 'Group', value: ledger.group_name }] : []),
    ],
    columns: [
      { header: 'Date', dataKey: 'dt' },
      { header: 'Particulars', dataKey: 'narr' },
      { header: 'Voucher', dataKey: 'vno' },
      { header: 'Debit (INR)', dataKey: 'dr', align: 'right' },
      { header: 'Credit (INR)', dataKey: 'cr', align: 'right' },
      { header: 'Balance (INR)', dataKey: 'bal', align: 'right' },
    ],
    data: entries.map(e => ({
      dt: e.posting_date,
      narr: e.narration || (e.is_opening ? 'Opening Balance' : '—'),
      vno: e.voucher_no ? `${e.series ?? ''}/${e.voucher_no}` : (e.is_opening ? 'Opening' : '—'),
      dr: Number(e.debit) > 0 ? Number(e.debit).toFixed(2) : '—',
      cr: Number(e.credit) > 0 ? Number(e.credit).toFixed(2) : '—',
      bal: `${Number(e.running_balance).toFixed(2)} ${e.balance_type}`,
    })),
    totals: data ? {
      dt: 'CLOSING',
      dr: entries.reduce((s, e) => s + Number(e.debit), 0).toFixed(2),
      cr: entries.reduce((s, e) => s + Number(e.credit), 0).toFixed(2),
      bal: `${Number(data.closing_balance).toFixed(2)} ${data.closing_balance_type}`,
    } : undefined,
  });

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                {ledger ? ledger.ledger_name : 'Ledger Book'}
              </h1>
              {ledger && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ledger.ledger_code} · {ledger.group_name}</p>}
            </div>
          </div>
          {/* Date filters */}
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30" />
            <button onClick={() => printReport(buildBookReportOptions())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={() => downloadReportPdf(buildBookReportOptions())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100">
              <FileDown className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Debit</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ₹{entries.reduce((s, e) => s + Number(e.debit), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Credit</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                ₹{entries.reduce((s, e) => s + Number(e.credit), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Closing Balance</p>
              <p className={`text-lg font-bold ${data.closing_balance_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                ₹{Number(data.closing_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <span className="text-xs ml-1 font-normal">{data.closing_balance_type}</span>
              </p>
            </div>
          </div>
        )}

        {/* Entries table */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-500 text-sm">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Particulars</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Voucher</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Debit (₹)</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Credit (₹)</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {entries.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400">No transactions in this period.</td></tr>
                  ) : entries.map((e, i) => (
                    <tr key={e.id ?? i} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{e.posting_date}</td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">
                        <p>{e.narration || (e.is_opening ? 'Opening Balance' : '—')}</p>
                        {e.reference_type && <p className="text-[9px] text-slate-400">{e.reference_type}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono">
                        {e.voucher_no ? `${e.series ?? ''}/${e.voucher_no}` : e.is_opening ? 'Opening' : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {Number(e.debit) > 0 ? Number(e.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                        {Number(e.credit) > 0 ? Number(e.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`font-semibold ${e.balance_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {Number(e.running_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          <span className="text-[9px] ml-0.5 font-normal">{e.balance_type}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
