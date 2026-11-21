import React, { useState, useEffect } from 'react';
import { Clock, Search, Printer, ArrowLeft, CheckCircle2, Eye, Loader2 } from 'lucide-react';
import { fetchInvoiceDetail, fetchRecentInvoices } from '../services/api';

interface InvoiceHistoryPageProps {
  onBackToDashboard: () => void;
}

interface InvoiceRecord {
  id: string;
  rawId?: number;
  customer: string;
  mobile: string;
  dateTime: string;
  itemsCount: number;
  grossAmount: number;
  gstAmount: number;
  netAmount: number;
  paymentMode: string;
  status: 'Paid' | 'Pending';
}

const DEFAULT_INVOICES: InvoiceRecord[] = [
  { id: 'INV-1001', rawId: 1, customer: 'Neha Patel', mobile: '9876543210', dateTime: '14 Nov 2026, 02:45 PM', itemsCount: 2, grossAmount: 8249.51, gstAmount: 247.49, netAmount: 8497, paymentMode: 'UPI', status: 'Paid' },
  { id: 'INV-1000', rawId: 2, customer: 'Rahul Sharma', mobile: '9822334455', dateTime: '14 Nov 2026, 01:30 PM', itemsCount: 3, grossAmount: 12087.38, gstAmount: 362.62, netAmount: 12450, paymentMode: 'CASH', status: 'Paid' },
  { id: 'INV-0999', rawId: 3, customer: 'Priya Shah', mobile: '9711223344', dateTime: '14 Nov 2026, 12:15 PM', itemsCount: 1, grossAmount: 6048.54, gstAmount: 181.46, netAmount: 6230, paymentMode: 'BANK_TRANSFER', status: 'Paid' },
  { id: 'INV-0998', rawId: 4, customer: 'Amit Desai', mobile: '9655443322', dateTime: '14 Nov 2026, 11:50 AM', itemsCount: 2, grossAmount: 8854.37, gstAmount: 265.63, netAmount: 9120, paymentMode: 'CASH', status: 'Pending' },
  { id: 'INV-0997', rawId: 5, customer: 'Deepak Verma', mobile: '9544332211', dateTime: '13 Nov 2026, 05:20 PM', itemsCount: 4, grossAmount: 24650.48, gstAmount: 739.52, netAmount: 25390, paymentMode: 'UPI', status: 'Paid' },
  { id: 'INV-0996', rawId: 6, customer: 'Sunita Joshi', mobile: '9433221100', dateTime: '13 Nov 2026, 03:10 PM', itemsCount: 1, grossAmount: 4368.93, gstAmount: 131.07, netAmount: 4500, paymentMode: 'CASH', status: 'Paid' },
];

export const InvoiceHistoryPage: React.FC<InvoiceHistoryPageProps> = ({ onBackToDashboard }) => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(DEFAULT_INVOICES);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Pending'>('ALL');
  const [printSuccess, setPrintSuccess] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    fetchRecentInvoices(50)
      .then((items: any[]) => {
        if (Array.isArray(items) && items.length > 0) {
          const mapped: InvoiceRecord[] = items.map((it: any) => ({
            id: String(it.voucher_no ? `INV-${it.voucher_no}` : `INV-${it.id}`),
            rawId: Number(it.id),
            customer: it.account_name || 'Walk-in Customer',
            mobile: it.account_mobile || '-',
            dateTime: it.voucher_date || it.created_at,
            itemsCount: Number(it.items_count || 1),
            grossAmount: Number(it.gross_amount || it.net_amount || 0),
            gstAmount: Number(it.gst_amount || 0),
            netAmount: Number(it.net_amount || 0),
            paymentMode: 'CASH',
            status: 'Paid',
          }));
          setInvoices(mapped);
        }
      })
      .catch((e) => console.error('Failed to load recent invoices:', e))
      .finally(() => setLoadingList(false));
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.mobile.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTargetId = (inv: InvoiceRecord): number => {
    if (inv.rawId) return inv.rawId;
    const num = inv.id.replace(/\D/g, '');
    return num ? Number(num) : 1;
  };

  const handlePrint = async (inv: InvoiceRecord) => {
    try {
      const targetId = getTargetId(inv);
      const invoiceData = await fetchInvoiceDetail(targetId);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<pre style="font-family: monospace; padding: 20px;">${JSON.stringify(invoiceData, null, 2)}</pre>`);
        w.document.close();
        w.print();
      }
      setPrintSuccess(`Invoice ${inv.id} sent to print dialog.`);
      setTimeout(() => setPrintSuccess(null), 3500);
    } catch (e) {
      alert('Failed to load invoice for printing.');
    }
  };

  const handleView = async (inv: InvoiceRecord) => {
    setLoadingInvoice(true);
    try {
      const targetId = getTargetId(inv);
      const invoiceData = await fetchInvoiceDetail(targetId);
      setViewingInvoice(invoiceData);
    } catch (e) {
      alert('Failed to load invoice details.');
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
                Invoice History &amp; Sales Register
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Search, Review, Audit and Reprint GST Tax Invoices
              </p>
            </div>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Print Notification Toast */}
        {printSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{printSuccess}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search invoice #, customer or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pl-9 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center space-x-2">
            {(['ALL', 'Paid', 'Pending'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-white dark:bg-[#141822] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-white/[0.08]">
                <th className="p-3">Invoice #</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Date &amp; Time</th>
                <th className="p-3 text-center">Items</th>
                <th className="p-3 text-right">Taxable (₹)</th>
                <th className="p-3 text-right">GST 3% (₹)</th>
                <th className="p-3 text-right">Net Total (₹)</th>
                <th className="p-3 text-center">Payment</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-mono">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                  <td className="p-3 font-bold text-amber-700 dark:text-amber-400">{inv.id}</td>
                  <td className="p-3 font-sans">
                    <div className="font-semibold text-slate-900 dark:text-white">{inv.customer}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{inv.mobile}</div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">{inv.dateTime}</td>
                  <td className="p-3 text-center text-slate-700 dark:text-slate-300">{inv.itemsCount}</td>
                  <td className="p-3 text-right text-slate-700 dark:text-slate-300">₹{inv.grossAmount.toFixed(2)}</td>
                  <td className="p-3 text-right text-slate-500 dark:text-slate-400">₹{inv.gstAmount.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">₹{inv.netAmount.toLocaleString()}</td>
                  <td className="p-3 text-center font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-[#1a2130] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                      {inv.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-center font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-500/30'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-500/30'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-center font-sans">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => handlePrint(inv)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 transition"
                        title="Reprint Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleView(inv)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 transition"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingInvoice(null)}>
          <div className="bg-white dark:bg-[#141822] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm">Invoice #{viewingInvoice.voucher_no || viewingInvoice.id}</h3>
              <button onClick={() => setViewingInvoice(null)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">✕</button>
            </div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(viewingInvoice, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
