
import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Search,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  FileDown,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trash2,
} from 'lucide-react';

import {
  fetchInvoiceDetail,
  fetchInvoicesPaginated,
  deleteInvoice,
} from '../services/api';

import {
  printInvoicePdf,
  downloadInvoicePdf,
} from '../utils/reportPdf';

import { InvoiceDetailModal } from './InvoiceDetailModal';

interface InvoiceHistoryPageProps {
  onBackToDashboard: () => void;
}

interface InvoiceListItem {
  id: string;
  rawId: number;
  voucher_no: string;
  voucher_date: string;
  voucher_type: string;
  account_name: string;
  account_mobile: string;
  gross_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  payment_mode: string;
  payment_status: string;
  items_count: number;
  series: string;
}

interface InvoiceHistoryPageState {
  invoices: InvoiceListItem[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  searchQuery: string;
  voucherTypeFilter: 'ALL' | 'SALE' | 'PURCHASE';
  paymentStatusFilter: 'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID';
  dateFrom: string;
  dateTo: string;
  printSuccess: string | null;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toText = (value: unknown): string => {
  return value == null ? '' : String(value);
};

const formatCurrency = (value: number): string => {
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const normalizeInvoice = (item: any): InvoiceListItem | null => {
  const rawId = Number(item.id);

  if (!Number.isFinite(rawId) || rawId <= 0) {
    return null;
  }

  return {
    id: String(rawId),
    rawId,
    voucher_no: toText(
      item.voucher_no ?? item.invoice_no ?? item.invoice_number
    ),
    voucher_date: toText(
      item.voucher_date ?? item.invoice_date ?? item.date
    ),
    voucher_type: toText(
      item.voucher_type ?? item.invoice_type ?? item.type
    ).toUpperCase(),
    account_name: toText(
      item.account_name ?? item.party_name ?? item.customer_name
    ),
    account_mobile: toText(
      item.account_mobile ?? item.mobile ?? item.phone
    ),
    gross_amount: toNumber(
      item.gross_amount ?? item.subtotal ?? item.taxable_amount
    ),
    discount_amount: toNumber(
      item.discount_amount ?? item.discount
    ),
    tax_amount: toNumber(
      item.tax_amount ?? item.gst_amount ?? item.tax
    ),
    net_amount: toNumber(
      item.net_amount ?? item.grand_total ?? item.total_amount
    ),
    payment_mode: toText(
      item.payment_mode ?? item.payment_method
    ) || '-',
    payment_status: toText(
      item.payment_status ?? item.status
    ).toUpperCase() || 'UNPAID',
    items_count: toNumber(
      item.items_count ?? item.total_items ?? item.item_count
    ),
    series: toText(item.series),
  };
};

export const InvoiceHistoryPage: React.FC<InvoiceHistoryPageProps> = ({
  onBackToDashboard,
}) => {
  const [state, setState] = useState<InvoiceHistoryPageState>({
    invoices: [],
    loading: true,
    error: null,
    page: 1,
    totalPages: 1,
    totalRecords: 0,
    pageSize: 50,
    searchQuery: '',
    voucherTypeFilter: 'ALL',
    paymentStatusFilter: 'ALL',
    dateFrom: '',
    dateTo: '',
    printSuccess: null,
  });

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const {
    invoices,
    loading,
    error,
    page,
    totalPages,
    totalRecords,
    pageSize,
    searchQuery,
    voucherTypeFilter,
    paymentStatusFilter,
    dateFrom,
    dateTo,
    printSuccess,
  } = state;

  // Load invoices from backend.
  const loadInvoices = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (voucherTypeFilter !== 'ALL') {
        params.voucher_type = voucherTypeFilter;
      }

      if (paymentStatusFilter !== 'ALL') {
        params.payment_status = paymentStatusFilter;
      }

      if (dateFrom) {
        params.from_date = dateFrom;
      }

      if (dateTo) {
        params.to_date = dateTo;
      }

      const response = await fetchInvoicesPaginated(params);

      const records = Array.isArray(response?.items)
        ? response.items
        : [];

      const normalizedInvoices = records
        .map(normalizeInvoice)
        .filter(
          (invoice): invoice is InvoiceListItem => invoice !== null
        );

      setState((prev) => ({
        ...prev,
        invoices: normalizedInvoices,
        loading: false,
        error: null,
        totalPages: Math.max(1, toNumber(response?.totalPages) || 1),
        totalRecords: toNumber(response?.total),
      }));
    } catch (err: any) {
      console.error('Failed to load invoices:', err);

      setState((prev) => ({
        ...prev,
        invoices: [],
        loading: false,
        error:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load invoices.',
      }));
    }
  }, [
    page,
    pageSize,
    searchQuery,
    voucherTypeFilter,
    paymentStatusFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Handle page correction after deleting the last record on a page.
  useEffect(() => {
    if (!loading && page > totalPages) {
      setState((prev) => ({
        ...prev,
        page: Math.max(1, totalPages),
      }));
    }
  }, [loading, page, totalPages]);

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState((prev) => ({
      ...prev,
      searchQuery: e.target.value,
      page: 1,
    }));
  };

  const handleVoucherTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setState((prev) => ({
      ...prev,
      voucherTypeFilter: e.target.value as 'ALL' | 'SALE' | 'PURCHASE',
      page: 1,
    }));
  };

  const handlePaymentStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setState((prev) => ({
      ...prev,
      paymentStatusFilter: e.target.value as
        | 'ALL'
        | 'PAID'
        | 'PARTIAL'
        | 'UNPAID',
      page: 1,
    }));
  };

  const handleDateFromChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState((prev) => ({
      ...prev,
      dateFrom: e.target.value,
      page: 1,
    }));
  };

  const handleDateToChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState((prev) => ({
      ...prev,
      dateTo: e.target.value,
      page: 1,
    }));
  };

  const handlePageSizeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setState((prev) => ({
      ...prev,
      pageSize: Number(e.target.value),
      page: 1,
    }));
  };

  const handlePrint = async (invoice: InvoiceListItem) => {
    if (actionLoadingId !== null) return;

    try {
      setActionLoadingId(invoice.rawId);

      const invoiceData = await fetchInvoiceDetail(invoice.rawId);

      if (!invoiceData) {
        throw new Error('Invoice details not found.');
      }

      printInvoicePdf(invoiceData);

      setState((prev) => ({
        ...prev,
        printSuccess: `Invoice ${invoice.voucher_no} is ready for printing.`,
      }));

      window.setTimeout(() => {
        setState((prev) => ({
          ...prev,
          printSuccess: null,
        }));
      }, 3500);
    } catch (err: any) {
      console.error('Invoice print error:', err);
      alert(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load invoice for printing.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadPdf = async (invoice: InvoiceListItem) => {
    if (actionLoadingId !== null) return;

    try {
      setActionLoadingId(invoice.rawId);

      const invoiceData = await fetchInvoiceDetail(invoice.rawId);

      if (!invoiceData) {
        throw new Error('Invoice details not found.');
      }

      downloadInvoicePdf(invoiceData);
    } catch (err: any) {
      console.error('Invoice PDF error:', err);
      alert(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to download invoice PDF.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleView = async (invoice: InvoiceListItem) => {
    if (actionLoadingId !== null) return;

    try {
      setActionLoadingId(invoice.rawId);

      const invoiceData = await fetchInvoiceDetail(invoice.rawId);

      if (!invoiceData) {
        throw new Error('Invoice details not found.');
      }

      setSelectedInvoice(invoiceData);
    } catch (err: any) {
      console.error('Invoice view error:', err);
      alert(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load invoice details.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete invoice.
  const handleDelete = async (invoice: InvoiceListItem) => {
    if (actionLoadingId !== null) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete invoice ${invoice.voucher_no}?`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(invoice.rawId);

      // Uses the current ID mapping from the list response.
      await deleteInvoice(invoice.rawId);

      // Refresh the list from backend after successful deletion.
      // Do not also manually filter the previous state.
      if (invoices.length === 1 && page > 1) {
        setState((prev) => ({
          ...prev,
          page: prev.page - 1,
        }));
      } else {
        await loadInvoices();
      }

      alert('Invoice deleted successfully.');
    } catch (err: any) {
      console.error('Invoice delete error:', err);

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete invoice. Please try again.';

      alert(errorMessage);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRetry = () => {
    loadInvoices();
  };

  const getPaymentStatusBadge = (status: string): string => {
    const upper = status.toUpperCase();

    if (upper === 'PAID') {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-500/30';
    }

    if (upper === 'PARTIAL') {
      return 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-500/30';
    }

    if (upper === 'UNPAID') {
      return 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-400 dark:border-rose-500/30';
    }

    return 'bg-slate-100 text-slate-700 border border-slate-200 dark:text-slate-400 dark:border-white/[0.08]';
  };

  const getPaymentStatusText = (status: string): string => {
    const upper = status.toUpperCase();

    if (upper === 'PAID') return 'Paid';
    if (upper === 'PARTIAL') return 'Partial';
    if (upper === 'UNPAID') return 'Unpaid';

    return 'Unknown';
  };

  const totalGross = invoices.reduce(
    (sum, invoice) => sum + invoice.gross_amount,
    0
  );

  const totalGST = invoices.reduce(
    (sum, invoice) => sum + invoice.tax_amount,
    0
  );

  const totalNet = invoices.reduce(
    (sum, invoice) => sum + invoice.net_amount,
    0
  );

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">

        {/* Header */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-300/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>

            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
                Invoice History & Sales Register
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Search, Review, Audit and Reprint GST Tax Invoices
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Print Notification */}
        {printSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{printSuccess}</span>
          </div>
        )}

        {/* Filters */}
        <div className="p-5 flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-white/[0.06]">

          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search invoice #, customer or mobile..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 pl-9 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Voucher Type */}
          <div className="relative">
            <select
              value={voucherTypeFilter}
              onChange={handleVoucherTypeChange}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="SALE">Sale</option>
              <option value="PURCHASE">Purchase</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Payment Status */}
          <div className="relative">
            <select
              value={paymentStatusFilter}
              onChange={handlePaymentStatusChange}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={handleDateFromChange}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={handleDateToChange}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Page Size */}
          <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
            <span className="font-medium text-slate-500">Show:</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="appearance-none pl-3 pr-7 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="rounded-xl bg-slate-50 dark:bg-[#0b0e14] p-3 border border-slate-200 dark:border-white/[0.06]">
            <p className="text-[10px] text-slate-500">Taxable Amount - Current Page</p>
            <p className="font-bold text-sm mt-1">{formatCurrency(totalGross)}</p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#0b0e14] p-3 border border-slate-200 dark:border-white/[0.06]">
            <p className="text-[10px] text-slate-500">GST - Current Page</p>
            <p className="font-bold text-sm mt-1">{formatCurrency(totalGST)}</p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#0b0e14] p-3 border border-slate-200 dark:border-white/[0.06]">
            <p className="text-[10px] text-slate-500">Net Total - Current Page</p>
            <p className="font-bold text-sm mt-1">{formatCurrency(totalNet)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-white/[0.08]">
                <th className="p-3">Customer Name</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Type</th>
                <th className="p-3 text-center">Items</th>
                <th className="p-3 text-right">Taxable (₹)</th>
                <th className="p-3 text-right">GST (₹)</th>
                <th className="p-3 text-right">Net Total (₹)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-amber-500" />
                    <p className="text-xs text-slate-500 mt-2">
                      Loading invoices...
                    </p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.rawId}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition"
                  >
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {invoice.account_name || '-'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {invoice.account_mobile || '-'}
                      </div>
                    </td>

                    <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">
                      {invoice.voucher_date || '-'}
                    </td>

                    <td className="p-3 text-center">
                      {invoice.voucher_type || '-'}
                    </td>

                    <td className="p-3 text-center">
                      {invoice.items_count}
                    </td>

                    <td className="p-3 text-right">
                      {formatCurrency(invoice.gross_amount)}
                    </td>

                    <td className="p-3 text-right">
                      {formatCurrency(invoice.tax_amount)}
                    </td>

                    <td className="p-3 text-right font-bold">
                      {formatCurrency(invoice.net_amount)}
                    </td>

                    <td className="p-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrint(invoice)}
                          disabled={actionLoadingId !== null}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 text-slate-600 hover:text-amber-700 disabled:opacity-50"
                          title="Reprint Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(invoice)}
                          disabled={actionLoadingId !== null}
                          className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 disabled:opacity-50"
                          title="Download Invoice PDF"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleView(invoice)}
                          disabled={actionLoadingId !== null}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 text-slate-600 hover:text-amber-700 disabled:opacity-50"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(invoice)}
                          disabled={actionLoadingId !== null}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 disabled:opacity-50"
                          title="Delete Invoice"
                        >
                          {actionLoadingId === invoice.rawId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-white/[0.06]">
            <span className="text-xs text-slate-600">
              Showing{' '}
              <strong>
                {totalRecords === 0
                  ? 0
                  : (page - 1) * pageSize + 1}
                –
                {Math.min(page * pageSize, totalRecords)}
              </strong>{' '}
              of <strong>{totalRecords}</strong> records
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={page <= 1 || loading || actionLoadingId !== null}
                className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      page: pageNumber,
                    }))
                  }
                  disabled={loading || actionLoadingId !== null}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${pageNumber === page
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'border border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    page: Math.min(totalPages, prev.page + 1),
                  }))
                }
                disabled={
                  page >= totalPages ||
                  loading ||
                  actionLoadingId !== null
                }
                className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 m-5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-center">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />

            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
              Error Loading Invoices
            </h4>

            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-medium text-xs hover:bg-amber-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Invoice Detail Modal */}
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      </div>
    </div>
  );
};
