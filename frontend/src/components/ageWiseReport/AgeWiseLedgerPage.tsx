import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Printer,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { AgeWiseLedgerResponse } from '../../types';
import { fetchAgeWiseLedger } from '../../services/api';
import { showErrorAlert } from '../../utils/alert';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';

interface AgeWiseLedgerPageProps {
  partyKey: string;
  asOnDate: string;
  onBackToReport: () => void;
}

export const AgeWiseLedgerPage: React.FC<AgeWiseLedgerPageProps> = ({
  partyKey,
  asOnDate,
  onBackToReport,
}) => {
  const [ledger, setLedger] = useState<AgeWiseLedgerResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchAgeWiseLedger(partyKey, asOnDate)
      .then((res) => setLedger(res))
      .catch((err) => {
        console.error('Failed to load ledger:', err);
        showErrorAlert(err.message || 'Failed to load Party Ledger.');
      })
      .finally(() => setLoading(false));
  }, [partyKey, asOnDate]);

  const fmtCurr = (num?: number) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtWt = (num?: number) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });

  const fmtDate = (d?: string) => {
    if (!d) return '-';
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d;
  };

  const buildPdfOptions = (): ReportPdfOptions => ({
    title: `Party Ledger — ${ledger?.account_name || partyKey}`,
    filename: `Ledger_${(ledger?.account_name || partyKey).replace(/\s+/g, '_')}_${asOnDate}.pdf`,
    orientation: 'landscape',
    filters: [
      { label: 'As On Date', value: fmtDate(asOnDate) },
      { label: 'City', value: ledger?.city || '-' },
      { label: 'Group', value: ledger?.group_name || '-' },
    ],
    columns: [
      { header: 'Date', dataKey: 'date_fmt', align: 'left' },
      { header: 'Voucher No', dataKey: 'voucher_no', align: 'left' },
      { header: 'Type', dataKey: 'voucher_type', align: 'left' },
      { header: 'Particulars', dataKey: 'particulars', align: 'left' },
      { header: 'Debit (₹)', dataKey: 'debit_fmt', align: 'right' },
      { header: 'Credit (₹)', dataKey: 'credit_fmt', align: 'right' },
      { header: 'Gold Bal (g)', dataKey: 'gold_fmt', align: 'right' },
      { header: 'Silver Bal (g)', dataKey: 'silver_fmt', align: 'right' },
      { header: 'Outstanding (₹)', dataKey: 'out_fmt', align: 'right' },
    ],
    data: (ledger?.entries || []).map((e) => ({
      ...e,
      date_fmt: fmtDate(e.transaction_date),
      debit_fmt: e.debit ? fmtCurr(e.debit) : '-',
      credit_fmt: e.credit ? fmtCurr(e.credit) : '-',
      gold_fmt: fmtWt(e.gold_balance),
      silver_fmt: fmtWt(e.silver_balance),
      out_fmt: fmtCurr(e.outstanding_amount),
    })),
    totals: {
      date_fmt: 'Closing Balance',
      voucher_no: '',
      voucher_type: '',
      particulars: `${ledger?.entries.length || 0} Transactions`,
      debit_fmt: fmtCurr(ledger?.closing.debit),
      credit_fmt: fmtCurr(ledger?.closing.credit),
      gold_fmt: fmtWt(ledger?.closing.gold_balance),
      silver_fmt: fmtWt(ledger?.closing.silver_balance),
      out_fmt: fmtCurr(ledger?.closing.outstanding_amount),
    },
  });

  const handleCsv = () => {
    if (!ledger) return;
    const headers = [
      'Transaction Date',
      'Voucher Number',
      'Voucher Type',
      'Particulars',
      'Debit (INR)',
      'Credit (INR)',
      'Gold Balance (g)',
      'Silver Balance (g)',
      'Outstanding Amount (INR)',
    ];
    const rows = ledger.entries.map((e) =>
      [
        `"${e.transaction_date}"`,
        `"${(e.voucher_no || '').replace(/"/g, '""')}"`,
        `"${e.voucher_type}"`,
        `"${(e.particulars || '').replace(/"/g, '""')}"`,
        e.debit,
        e.credit,
        e.gold_balance,
        e.silver_balance,
        e.outstanding_amount,
      ].join(',')
    );
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_${ledger.account_name.replace(/\s+/g, '_')}_${asOnDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 space-y-4">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToReport}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>Back to Age Wise Report</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {ledger?.account_name || partyKey}
              </h1>
              <p className="text-xs text-slate-500">
                Detailed Party Ledger as on {fmtDate(asOnDate)} · City: {ledger?.city || '-'} · Group: {ledger?.group_name || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printReport(buildPdfOptions())}
              disabled={loading || !ledger}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => downloadReportPdf(buildPdfOptions())}
              disabled={loading || !ledger}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleCsv}
              disabled={loading || !ledger}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Loading detailed party ledger...</span>
              </div>
            ) : !ledger || ledger.entries.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No ledger transactions found up to {fmtDate(asOnDate)}.
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3 whitespace-nowrap">Transaction Date</th>
                    <th className="px-4 py-3 whitespace-nowrap">Voucher Number</th>
                    <th className="px-4 py-3 whitespace-nowrap">Voucher Type</th>
                    <th className="px-4 py-3 whitespace-nowrap">Particulars</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Debit (₹)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Credit (₹)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Gold Balance (g)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Silver Balance (g)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Outstanding Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.entries.map((row, idx) => (
                    <tr key={`${row.voucher_no}-${idx}`} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                        {fmtDate(row.transaction_date)}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {row.voucher_no}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {row.voucher_type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-800">{row.particulars}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-700 whitespace-nowrap">
                        {row.debit > 0 ? fmtCurr(row.debit) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-rose-600 whitespace-nowrap">
                        {row.credit > 0 ? fmtCurr(row.credit) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-amber-800 whitespace-nowrap">
                        {fmtWt(row.gold_balance)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                        {fmtWt(row.silver_balance)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono font-bold whitespace-nowrap ${row.outstanding_amount >= 0 ? 'text-slate-900' : 'text-rose-600'
                          }`}
                      >
                        ₹{fmtCurr(row.outstanding_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                    <td colSpan={4} className="px-4 py-3 text-right uppercase text-[11px]">
                      Closing Totals ({ledger.entries.length} Entries)
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 whitespace-nowrap">
                      ₹{fmtCurr(ledger.closing.debit)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600 whitespace-nowrap">
                      ₹{fmtCurr(ledger.closing.credit)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-800 whitespace-nowrap">
                      {fmtWt(ledger.closing.gold_balance)} g
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900 whitespace-nowrap">
                      {fmtWt(ledger.closing.silver_balance)} g
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-700 whitespace-nowrap">
                      ₹{fmtCurr(ledger.closing.outstanding_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
