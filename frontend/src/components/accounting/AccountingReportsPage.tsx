import React, { useState, useEffect } from 'react';
import {
  BarChart3, RefreshCw, Loader2, AlertCircle, Printer, Download, FileDown
} from 'lucide-react';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';
import {
  fetchTrialBalance, fetchDayBook, fetchCashBook, fetchBankBook,
  fetchOutstandingReceivable, fetchOutstandingPayable,
  fetchProfitLoss, fetchBalanceSheet, fetchInvoiceStatusReport
} from '../../services/api';
import type {
  TrialBalanceResponse, OutstandingRow, ProfitLossResponse,
  BalanceSheetResponse, LedgerPosting, InvoiceStatusReportRow
} from '../../types';

type ReportTab = 'trial-balance' | 'day-book' | 'cash-book' | 'bank-book' | 'outstanding-receivable' | 'outstanding-payable' | 'sales-invoices' | 'purchase-invoices' | 'profit-loss' | 'balance-sheet';

interface Props {
  onBackToDashboard: () => void;
}

const TABS: Array<{ id: ReportTab; label: string }> = [
  { id: 'trial-balance',          label: 'Trial Balance' },
  { id: 'day-book',               label: 'Day Book' },
  { id: 'cash-book',              label: 'Cash Book' },
  { id: 'bank-book',              label: 'Bank Book' },
  { id: 'outstanding-receivable', label: 'Receivable' },
  { id: 'outstanding-payable',    label: 'Payable' },
  { id: 'sales-invoices',         label: 'Sales Invoices' },
  { id: 'purchase-invoices',      label: 'Purchase Invoices' },
  { id: 'profit-loss',            label: 'P & L' },
  { id: 'balance-sheet',          label: 'Balance Sheet' },
];

const fmt = (n: number) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const NATURE_COLOR: Record<string, string> = {
  ASSET:     'text-emerald-600 dark:text-emerald-400',
  LIABILITY: 'text-rose-600 dark:text-rose-400',
  INCOME:    'text-sky-600 dark:text-sky-400',
  EXPENSE:   'text-orange-600 dark:text-orange-400',
};

export const AccountingReportsPage: React.FC<Props> = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('trial-balance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [asOn, setAsOn] = useState(new Date().toISOString().slice(0, 10));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  // Report data
  const [trialBalance, setTrialBalance] = useState<TrialBalanceResponse | null>(null);
  const [dayBook, setDayBook] = useState<LedgerPosting[]>([]);
  const [cashBook, setCashBook] = useState<LedgerPosting[]>([]);
  const [bankBook, setBankBook] = useState<LedgerPosting[]>([]);
  const [receivable, setReceivable] = useState<OutstandingRow[]>([]);
  const [payable, setPayable] = useState<OutstandingRow[]>([]);
  const [pl, setPl] = useState<ProfitLossResponse | null>(null);
  const [bs, setBs] = useState<BalanceSheetResponse | null>(null);
  const [salesInvoices, setSalesInvoices] = useState<InvoiceStatusReportRow[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<InvoiceStatusReportRow[]>([]);

  const loadReport = async (tab: ReportTab) => {
    setLoading(true);
    setError(null);
    try {
      switch (tab) {
        case 'trial-balance':          setTrialBalance(await fetchTrialBalance(asOn)); break;
        case 'day-book':               setDayBook(await fetchDayBook(date)); break;
        case 'cash-book':              setCashBook(await fetchCashBook(from || undefined, to)); break;
        case 'bank-book':              setBankBook(await fetchBankBook(from || undefined, to)); break;
        case 'outstanding-receivable': setReceivable(await fetchOutstandingReceivable(asOn)); break;
        case 'outstanding-payable':    setPayable(await fetchOutstandingPayable(asOn)); break;
        case 'sales-invoices':         setSalesInvoices(await fetchInvoiceStatusReport('SALE', from ? { from, to } : {})); break;
        case 'purchase-invoices':      setPurchaseInvoices(await fetchInvoiceStatusReport('PURCHASE', from ? { from, to } : {})); break;
        case 'profit-loss':            setPl(await fetchProfitLoss(from || undefined, to)); break;
        case 'balance-sheet':          setBs(await fetchBalanceSheet(asOn)); break;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(activeTab); }, [activeTab]);

  const LedgerJournalRows: React.FC<{ entries: LedgerPosting[] }> = ({ entries }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Date</th>
            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Ledger</th>
            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Voucher</th>
            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Narration</th>
            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Dr (₹)</th>
            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Cr (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {entries.length === 0 ? (
            <tr><td colSpan={6} className="py-10 text-center text-slate-400">No entries found.</td></tr>
          ) : entries.map((e, i) => (
            <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{e.posting_date}</td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.ledger_name} <span className="text-slate-400 font-mono text-[9px]">{e.ledger_code}</span></td>
              <td className="px-4 py-2 font-mono text-slate-500">{e.voucher_no ? `${e.series ?? ''}/${e.voucher_no}` : '—'}</td>
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{e.narration || '—'}</td>
              <td className="px-4 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">{Number(e.debit) > 0 ? fmt(e.debit) : '—'}</td>
              <td className="px-4 py-2 text-right font-semibold text-rose-600 dark:text-rose-400">{Number(e.credit) > 0 ? fmt(e.credit) : '—'}</td>
            </tr>
          ))}
        </tbody>
        {entries.length > 0 && (
          <tfoot className="border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] font-semibold">
            <tr>
              <td colSpan={4} className="px-4 py-2 text-slate-600 dark:text-slate-300">Total</td>
              <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">{fmt(entries.reduce((s, e) => s + Number(e.debit), 0))}</td>
              <td className="px-4 py-2 text-right text-rose-600 dark:text-rose-400">{fmt(entries.reduce((s, e) => s + Number(e.credit), 0))}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  const OutstandingRows: React.FC<{ rows: OutstandingRow[]; type: 'receivable' | 'payable' }> = ({ rows, type }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">#</th>
            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Ledger</th>
            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Group</th>
            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Total Dr</th>
            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Total Cr</th>
            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {rows.length === 0 ? (
            <tr><td colSpan={6} className="py-10 text-center text-slate-400">No outstanding found.</td></tr>
          ) : rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{i + 1}</td>
              <td className="px-4 py-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{r.ledger_name}</p>
                <p className="font-mono text-slate-400 text-[9px]">{r.ledger_code}</p>
              </td>
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{r.group_name}</td>
              <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(r.total_dr)}</td>
              <td className="px-4 py-2 text-right text-rose-600 dark:text-rose-400 font-semibold">{fmt(r.total_cr)}</td>
              <td className="px-4 py-2 text-right">
                <span className={`font-bold ${r.balance_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  ₹{fmt(r.balance)} <span className="text-[9px] font-normal">{r.balance_type}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot className="border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] font-bold">
            <tr>
              <td colSpan={5} className="px-4 py-2 text-slate-600 dark:text-slate-300">
                Total Outstanding {type === 'receivable' ? 'Receivable' : 'Payable'}
              </td>
              <td className="px-4 py-2 text-right text-amber-600 dark:text-amber-400">
                ₹{fmt(rows.reduce((s, r) => s + Number(r.balance), 0))}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  const exportCsv = () => {
    let csv = '';
    if (activeTab === 'trial-balance' && trialBalance) {
      csv = 'Code,Ledger,Group,Nature,Debit,Credit\n' +
        trialBalance.rows.map(r => `"${r.ledger_code}","${r.ledger_name}","${r.group_name}","${r.nature}",${r.dr_balance},${r.cr_balance}`).join('\n');
    } else if (['day-book', 'cash-book', 'bank-book'].includes(activeTab)) {
      const list = activeTab === 'day-book' ? dayBook : activeTab === 'cash-book' ? cashBook : bankBook;
      csv = 'Date,Ledger,Code,Voucher,Narration,Debit,Credit\n' +
        list.map(e => `"${e.posting_date}","${e.ledger_name}","${e.ledger_code}","${e.voucher_no || ''}","${(e.narration || '').replace(/"/g, '""')}",${e.debit},${e.credit}`).join('\n');
    } else if (activeTab === 'outstanding-receivable' || activeTab === 'outstanding-payable') {
      const list = activeTab === 'outstanding-receivable' ? receivable : payable;
      csv = 'Code,Ledger,Group,Total Dr,Total Cr,Balance,Type\n' +
        list.map(r => `"${r.ledger_code}","${r.ledger_name}","${r.group_name}",${r.total_dr},${r.total_cr},${r.balance},${r.balance_type}`).join('\n');
    } else if (activeTab === 'profit-loss' && pl) {
      csv = 'Side,Group,Ledger,Amount\n' +
        pl.income.map(r => `"INCOME","${r.group_name}","${r.ledger_name}",${r.amount}`).join('\n') + '\n' +
        pl.expense.map(r => `"EXPENSE","${r.group_name}","${r.ledger_name}",${r.amount}`).join('\n');
    } else if (activeTab === 'balance-sheet' && bs) {
      csv = 'Side,Ledger,Group,Balance\n' +
        bs.assets.map(r => `"ASSET","${r.ledger_name}","${r.group_name}",${r.balance}`).join('\n') + '\n' +
        bs.liabilities.map(r => `"LIABILITY","${r.ledger_name}","${r.group_name}",${r.balance}`).join('\n');
    }
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildReportPdfOptions = (): ReportPdfOptions => {
    const dateSuffix = new Date().toISOString().slice(0, 10);
    if (activeTab === 'trial-balance' && trialBalance) {
      return {
        title: 'Trial Balance',
        filename: `Trial_Balance_${dateSuffix}.pdf`,
        orientation: 'portrait',
        filters: [{ label: 'As On', value: asOn }],
        columns: [
          { header: 'Code', dataKey: 'code' },
          { header: 'Ledger', dataKey: 'name' },
          { header: 'Group', dataKey: 'group' },
          { header: 'Nature', dataKey: 'nature' },
          { header: 'Debit (INR)', dataKey: 'dr', align: 'right' },
          { header: 'Credit (INR)', dataKey: 'cr', align: 'right' },
        ],
        data: trialBalance.rows.map(r => ({
          code: r.ledger_code,
          name: r.ledger_name,
          group: r.group_name,
          nature: r.nature,
          dr: r.dr_balance > 0 ? fmt(r.dr_balance) : '—',
          cr: r.cr_balance > 0 ? fmt(r.cr_balance) : '—',
        })),
        totals: { code: 'TOTAL', dr: fmt(trialBalance.total_dr), cr: fmt(trialBalance.total_cr) },
      };
    }

    if (['day-book', 'cash-book', 'bank-book'].includes(activeTab)) {
      const list = activeTab === 'day-book' ? dayBook : activeTab === 'cash-book' ? cashBook : bankBook;
      const titleMap: Record<string, string> = { 'day-book': 'Day Book', 'cash-book': 'Cash Book', 'bank-book': 'Bank Book' };
      return {
        title: titleMap[activeTab],
        filename: `${activeTab}_${dateSuffix}.pdf`,
        orientation: 'landscape',
        filters: activeTab === 'day-book'
          ? [{ label: 'Date', value: date }]
          : [...(from ? [{ label: 'From', value: from }] : []), { label: 'To', value: to }],
        columns: [
          { header: 'Date', dataKey: 'dt' },
          { header: 'Ledger', dataKey: 'name' },
          { header: 'Voucher', dataKey: 'vno' },
          { header: 'Narration', dataKey: 'narr' },
          { header: 'Debit (INR)', dataKey: 'dr', align: 'right' },
          { header: 'Credit (INR)', dataKey: 'cr', align: 'right' },
        ],
        data: list.map(e => ({
          dt: e.posting_date,
          name: `${e.ledger_name || ''} (${e.ledger_code || ''})`,
          vno: e.voucher_no ? `${e.series || ''}/${e.voucher_no}` : '—',
          narr: e.narration || '—',
          dr: Number(e.debit) > 0 ? fmt(e.debit) : '—',
          cr: Number(e.credit) > 0 ? fmt(e.credit) : '—',
        })),
        totals: {
          dt: 'TOTAL',
          dr: fmt(list.reduce((s, e) => s + Number(e.debit), 0)),
          cr: fmt(list.reduce((s, e) => s + Number(e.credit), 0)),
        },
      };
    }

    if (activeTab === 'outstanding-receivable' || activeTab === 'outstanding-payable') {
      const list = activeTab === 'outstanding-receivable' ? receivable : payable;
      return {
        title: activeTab === 'outstanding-receivable' ? 'Outstanding Receivable' : 'Outstanding Payable',
        filename: `${activeTab}_${dateSuffix}.pdf`,
        orientation: 'portrait',
        filters: [{ label: 'As On', value: asOn }],
        columns: [
          { header: 'Code', dataKey: 'code' },
          { header: 'Ledger', dataKey: 'name' },
          { header: 'Group', dataKey: 'group' },
          { header: 'Total Dr', dataKey: 'dr', align: 'right' },
          { header: 'Total Cr', dataKey: 'cr', align: 'right' },
          { header: 'Balance (INR)', dataKey: 'bal', align: 'right' },
        ],
        data: list.map(r => ({
          code: r.ledger_code,
          name: r.ledger_name,
          group: r.group_name,
          dr: fmt(r.total_dr),
          cr: fmt(r.total_cr),
          bal: `${fmt(r.balance)} ${r.balance_type}`,
        })),
        totals: { code: 'TOTAL', bal: fmt(list.reduce((s, r) => s + Number(r.balance), 0)) },
      };
    }

    if (activeTab === 'sales-invoices' || activeTab === 'purchase-invoices') {
      const list = activeTab === 'sales-invoices' ? salesInvoices : purchaseInvoices;
      return {
        title: activeTab === 'sales-invoices' ? 'Sales Invoice Payment Status' : 'Purchase Invoice Payment Status',
        filename: `${activeTab}_${dateSuffix}.pdf`,
        orientation: 'landscape',
        columns: [
          { header: 'Invoice No', dataKey: 'vno' },
          { header: 'Date', dataKey: 'dt' },
          { header: 'Party', dataKey: 'party' },
          { header: 'Total (INR)', dataKey: 'tot', align: 'right' },
          { header: 'Paid (INR)', dataKey: 'paid', align: 'right' },
          { header: 'Outstanding', dataKey: 'out', align: 'right' },
          { header: 'Status', dataKey: 'st', align: 'center' },
          { header: 'Payment History', dataKey: 'hist' },
        ],
        data: list.map(inv => ({
          vno: inv.voucher_no,
          dt: inv.voucher_date,
          party: inv.party_name,
          tot: fmt(inv.total_amount),
          paid: fmt(inv.paid_amount),
          out: fmt(inv.outstanding_amount),
          st: inv.payment_status,
          hist: inv.allocations?.map(a => `${a.series}/${a.voucher_no}:${fmt(a.allocated_amount)}`).join(', ') || '—',
        })),
        totals: {
          vno: 'TOTAL',
          tot: fmt(list.reduce((s, i) => s + Number(i.total_amount), 0)),
          paid: fmt(list.reduce((s, i) => s + Number(i.paid_amount), 0)),
          out: fmt(list.reduce((s, i) => s + Number(i.outstanding_amount), 0)),
        },
      };
    }

    if (activeTab === 'profit-loss' && pl) {
      const rows = [
        ...pl.income.map(r => ({ side: 'INCOME', group: r.group_name, ledger: r.ledger_name, amt: fmt(r.amount) })),
        ...pl.expense.map(r => ({ side: 'EXPENSE', group: r.group_name, ledger: r.ledger_name, amt: fmt(r.amount) })),
      ];
      return {
        title: 'Profit & Loss Statement',
        filename: `Profit_Loss_${dateSuffix}.pdf`,
        orientation: 'portrait',
        filters: [...(from ? [{ label: 'From', value: from }] : []), { label: 'To', value: to }],
        columns: [
          { header: 'Side', dataKey: 'side' },
          { header: 'Group', dataKey: 'group' },
          { header: 'Ledger', dataKey: 'ledger' },
          { header: 'Amount (INR)', dataKey: 'amt', align: 'right' },
        ],
        data: rows,
        totals: { side: pl.net_profit >= 0 ? 'NET PROFIT' : 'NET LOSS', amt: fmt(Math.abs(pl.net_profit)) },
      };
    }

    const bsRows = bs ? [
      ...bs.assets.map(r => ({ side: 'ASSET', ledger: r.ledger_name, group: r.group_name, bal: fmt(r.balance) })),
      ...bs.liabilities.map(r => ({ side: 'LIABILITY', ledger: r.ledger_name, group: r.group_name, bal: fmt(r.balance) })),
    ] : [];
    return {
      title: 'Balance Sheet',
      filename: `Balance_Sheet_${dateSuffix}.pdf`,
      orientation: 'portrait',
      filters: [{ label: 'As On', value: asOn }],
      columns: [
        { header: 'Side', dataKey: 'side' },
        { header: 'Ledger', dataKey: 'ledger' },
        { header: 'Group', dataKey: 'group' },
        { header: 'Balance (INR)', dataKey: 'bal', align: 'right' },
      ],
      data: bsRows,
      totals: bs ? { side: 'ASSETS / LIAB', ledger: `Assets: ${fmt(bs.total_assets)}`, bal: `Liab: ${fmt(bs.total_liabilities)}` } : undefined,
    };
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Accounting Reports
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Financial reports from the double-entry accounting system</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={() => printReport(buildReportPdfOptions())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={() => downloadReportPdf(buildReportPdfOptions())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 transition-colors">
              <FileDown className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={() => loadReport(activeTab)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-100 dark:border-white/5">
            {TABS.map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/5'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.01]">
            <div className="flex flex-wrap gap-3 items-center">
              {['trial-balance', 'outstanding-receivable', 'outstanding-payable', 'balance-sheet'].includes(activeTab) && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">As On</label>
                  <input type="date" value={asOn} onChange={(e) => setAsOn(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30" />
                </div>
              )}
              {activeTab === 'day-book' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30" />
                </div>
              )}
              {['cash-book', 'bank-book', 'profit-loss'].includes(activeTab) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30" />
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30" />
                </div>
              )}
              <button onClick={() => loadReport(activeTab)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm shadow-amber-500/20 transition-colors">
                Apply
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Report content */}
          <div className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Trial Balance */}
                {activeTab === 'trial-balance' && trialBalance && (
                  <div>
                    <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.01]">
                      <span className="text-xs text-slate-500">Total Debit: <strong className="text-emerald-600 dark:text-emerald-400">₹{fmt(trialBalance.total_dr)}</strong></span>
                      <span className="text-xs text-slate-500">Total Credit: <strong className="text-rose-600 dark:text-rose-400">₹{fmt(trialBalance.total_cr)}</strong></span>
                      <span className={`text-xs font-semibold ${trialBalance.is_balanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                        {trialBalance.is_balanced ? '✓ Balanced' : '⚠ Not Balanced'}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Ledger</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Group</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Nature</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Dr Balance</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Cr Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                          {trialBalance.rows.map(r => (
                            <tr key={r.ledger_id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                              <td className="px-4 py-2">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{r.ledger_name}</p>
                                <p className="font-mono text-slate-400 text-[9px]">{r.ledger_code}</p>
                              </td>
                              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{r.group_name}</td>
                              <td className="px-4 py-2">
                                <span className={`text-[10px] font-bold ${NATURE_COLOR[r.nature] || 'text-slate-500'}`}>{r.nature}</span>
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">{r.dr_balance > 0 ? fmt(r.dr_balance) : '—'}</td>
                              <td className="px-4 py-2 text-right font-semibold text-rose-600 dark:text-rose-400">{r.cr_balance > 0 ? fmt(r.cr_balance) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] font-bold">
                          <tr>
                            <td colSpan={3} className="px-4 py-2.5 text-slate-700 dark:text-slate-200">Grand Total</td>
                            <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">₹{fmt(trialBalance.total_dr)}</td>
                            <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400">₹{fmt(trialBalance.total_cr)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Day Book */}
                {activeTab === 'day-book' && <LedgerJournalRows entries={dayBook} />}
                {/* Cash Book */}
                {activeTab === 'cash-book' && <LedgerJournalRows entries={cashBook} />}
                {/* Bank Book */}
                {activeTab === 'bank-book' && <LedgerJournalRows entries={bankBook} />}
                {/* Outstanding Receivable */}
                {activeTab === 'outstanding-receivable' && <OutstandingRows rows={receivable} type="receivable" />}
                {/* Outstanding Payable */}
                {activeTab === 'outstanding-payable' && <OutstandingRows rows={payable} type="payable" />}

                {/* Sales / Purchase Invoice Payment Status & History */}
                {(activeTab === 'sales-invoices' || activeTab === 'purchase-invoices') && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Invoice No</th>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Date</th>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Party</th>
                          <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Total (₹)</th>
                          <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Paid (₹)</th>
                          <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">Outstanding (₹)</th>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Status</th>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">Payment History</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {(activeTab === 'sales-invoices' ? salesInvoices : purchaseInvoices).map(inv => (
                          <tr key={`${inv.invoice_source}-${inv.invoice_id}`} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-2 font-mono font-semibold text-slate-700 dark:text-slate-200">{inv.voucher_no}</td>
                            <td className="px-4 py-2 text-slate-500">{inv.voucher_date}</td>
                            <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">{inv.party_name}</td>
                            <td className="px-4 py-2 text-right font-semibold">{fmt(inv.total_amount)}</td>
                            <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(inv.paid_amount)}</td>
                            <td className="px-4 py-2 text-right text-rose-600 dark:text-rose-400 font-bold">{fmt(inv.outstanding_amount)}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : inv.payment_status === 'PARTIAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                              }`}>{inv.payment_status}</span>
                            </td>
                            <td className="px-4 py-2 text-[11px] text-slate-500">
                              {inv.allocations && inv.allocations.length > 0
                                ? inv.allocations.map(a => `${a.series}/${a.voucher_no} (${a.voucher_date}: ₹${fmt(a.allocated_amount)})`).join(' · ')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Profit & Loss */}
                {activeTab === 'profit-loss' && pl && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 w-1/2">Income</th>
                          <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400 w-1/4">Amount (₹)</th>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 w-1/2 border-l border-slate-200 dark:border-white/5">Expense</th>
                          <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400 w-1/4">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {Array.from({ length: Math.max(pl.income.length, pl.expense.length) }).map((_, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-2 text-sky-700 dark:text-sky-300">{pl.income[i]?.ledger_name || ''}</td>
                            <td className="px-4 py-2 text-right text-sky-600 dark:text-sky-400 font-semibold">
                              {pl.income[i] ? fmt(pl.income[i].amount) : ''}
                            </td>
                            <td className="px-4 py-2 text-orange-700 dark:text-orange-300 border-l border-slate-100 dark:border-white/5">{pl.expense[i]?.ledger_name || ''}</td>
                            <td className="px-4 py-2 text-right text-orange-600 dark:text-orange-400 font-semibold">
                              {pl.expense[i] ? fmt(pl.expense[i].amount) : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] font-bold">
                        <tr>
                          <td className="px-4 py-2.5 text-sky-700 dark:text-sky-300">Total Income</td>
                          <td className="px-4 py-2.5 text-right text-sky-600 dark:text-sky-400">₹{fmt(pl.total_income)}</td>
                          <td className="px-4 py-2.5 text-orange-700 dark:text-orange-300 border-l border-slate-200 dark:border-white/5">Total Expense</td>
                          <td className="px-4 py-2.5 text-right text-orange-600 dark:text-orange-400">₹{fmt(pl.total_expense)}</td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-white/10">
                          <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100" colSpan={2}>
                            {pl.net_profit >= 0 ? '✓ Net Profit' : '✗ Net Loss'}
                          </td>
                          <td className="px-4 py-2.5 font-bold border-l border-slate-200 dark:border-white/5" colSpan={2}>
                            <span className={`${pl.net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              ₹{fmt(Math.abs(pl.net_profit))}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Balance Sheet */}
                {activeTab === 'balance-sheet' && bs && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 w-1/2">Assets</th>
                          <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400 w-1/4">Amount (₹)</th>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 w-1/2 border-l border-slate-200 dark:border-white/5">Liabilities</th>
                          <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400 w-1/4">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {Array.from({ length: Math.max(bs.assets.length, bs.liabilities.length) }).map((_, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-2 text-emerald-700 dark:text-emerald-300">{bs.assets[i]?.ledger_name || ''}</td>
                            <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                              {bs.assets[i] ? `₹${fmt(bs.assets[i].balance)}` : ''}
                            </td>
                            <td className="px-4 py-2 text-rose-700 dark:text-rose-300 border-l border-slate-100 dark:border-white/5">{bs.liabilities[i]?.ledger_name || ''}</td>
                            <td className="px-4 py-2 text-right text-rose-600 dark:text-rose-400 font-semibold">
                              {bs.liabilities[i] ? `₹${fmt(bs.liabilities[i].balance)}` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] font-bold">
                        <tr>
                          <td className="px-4 py-2.5 text-emerald-700 dark:text-emerald-300">Total Assets</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">₹{fmt(bs.total_assets)}</td>
                          <td className="px-4 py-2.5 text-rose-700 dark:text-rose-300 border-l border-slate-200 dark:border-white/5">Total Liabilities</td>
                          <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400">₹{fmt(bs.total_liabilities)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
