import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  Printer,
  FileText,
  MessageCircle,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';
import {
  CustomerProfitDetailedRecord,
  CustomerProfitVoucherRecord,
  CustomerProfitFilterParams,
  CustomerProfitFilterOptions,
  CustomerProfitSummary,
  CustomerProfitAvgRates,
} from '../../types';
import {
  fetchCustomerProfitReport,
  fetchCustomerProfitSummary,
  fetchCustomerProfitFilterOptions,
  fetchCustomerProfitExport,
} from '../../services/api';
import { showErrorAlert } from '../../utils/alert';
import {
  printReport,
  downloadReportPdf,
  shareReportOnWhatsApp,
  ReportPdfOptions,
} from '../../utils/reportPdf';
import { CustomerProfitSummaryPanel } from './CustomerProfitSummaryPanel';

export const CustomerProfitReportPage: React.FC = () => {
  // Data state
  const [items, setItems] = useState<
    (CustomerProfitDetailedRecord | CustomerProfitVoucherRecord)[]
  >([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [avgRates, setAvgRates] = useState<CustomerProfitAvgRates>({
    gold_avg_purchase_rate: 0,
    silver_avg_purchase_rate: 0,
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState<CustomerProfitFilterOptions>({
    cities: [],
    groups: [],
    salesmen: [],
    sites: [],
  });

  // Draft Filter Inputs (applied on Apply Filter / Reset / Search)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [city, setCity] = useState<string>('all');
  const [group, setGroup] = useState<string>('all');
  const [salesman, setSalesman] = useState<string>('all');
  const [site, setSite] = useState<string>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [reportType, setReportType] = useState<'detailed' | 'voucher_wise'>('detailed');

  // Applied Filters (trigger server fetch)
  const [appliedFilters, setAppliedFilters] = useState<CustomerProfitFilterParams>({
    report_type: 'detailed',
  });

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('profit_in_amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<CustomerProfitSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchCustomerProfitFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  useEffect(() => {
    document.title = 'Customer-profit-report | Rudra Silver';
  }, []);

  const buildRequestParams = useCallback(
    (includePagination: boolean = true): CustomerProfitFilterParams => {
      const params: CustomerProfitFilterParams = {
        ...appliedFilters,
        report_type: reportType,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (includePagination) {
        params.page = currentPage;
        params.limit = pageSize;
      }
      return params;
    },
    [appliedFilters, reportType, sortBy, sortOrder, currentPage, pageSize]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchCustomerProfitReport(buildRequestParams(true));
      setItems(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
      if (res.avg_rates) setAvgRates(res.avg_rates);
    } catch (err: any) {
      console.error('Failed to load Customer Profit Report:', err);
      showErrorAlert(err.message || 'Failed to load Customer Profit Report.');
    } finally {
      setLoading(false);
    }
  }, [buildRequestParams]);

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await fetchCustomerProfitSummary(buildRequestParams(false));
      setSummaryData(res);
    } catch (err: any) {
      console.error('Failed to load Customer Profit Summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [buildRequestParams]);

  useEffect(() => {
    loadData();
    loadSummary();
  }, [loadData, loadSummary]);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    setAppliedFilters({
      search: searchInput.trim() || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      city: city !== 'all' ? city : undefined,
      group: group !== 'all' ? group : undefined,
      salesman: salesman !== 'all' ? salesman : undefined,
      site: site !== 'all' ? site : undefined,
      report_type: reportType,
    });
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setCity('all');
    setGroup('all');
    setSalesman('all');
    setSite('all');
    setSearchInput('');
    setCurrentPage(1);
    setSortBy(reportType === 'detailed' ? 'profit_in_amount' : 'voucher_date');
    setSortOrder('desc');
    setAppliedFilters({
      report_type: reportType,
    });
  };

  const handleReportTypeChange = (nextType: 'detailed' | 'voucher_wise') => {
    setReportType(nextType);
    setCurrentPage(1);
    setSortBy(nextType === 'detailed' ? 'profit_in_amount' : 'voucher_date');
    setSortOrder('desc');
    setAppliedFilters((prev) => ({
      ...prev,
      report_type: nextType,
    }));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 inline-block ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline-block ml-1" />
    );
  };

  const fmtWt = (num?: number) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });

  const fmtCurr = (num?: number) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  // Export Helpers
  const buildReportOptions = async (): Promise<ReportPdfOptions> => {
    const allRows = await fetchCustomerProfitExport(buildRequestParams(false));
    const activeFilterList = [
      { label: 'Mode', value: reportType === 'detailed' ? 'Detailed (Customer Wise)' : 'Voucher Wise' },
      { label: 'From', value: appliedFilters.from_date || '' },
      { label: 'To', value: appliedFilters.to_date || '' },
      { label: 'City', value: appliedFilters.city || '' },
      { label: 'Group', value: appliedFilters.group || '' },
      { label: 'Sale Man', value: appliedFilters.salesman || '' },
      { label: 'Site', value: appliedFilters.site || '' },
      { label: 'Search', value: appliedFilters.search || '' },
    ];

    if (reportType === 'detailed') {
      const detailedRows = allRows as CustomerProfitDetailedRecord[];
      return {
        title: 'Customer Wise Profit Report (Detailed)',
        filename: `Customer_Profit_Detailed_${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape',
        filters: activeFilterList,
        columns: [
          { header: 'A/c Name', dataKey: 'account_name', align: 'left' },
          { header: 'Vouchers', dataKey: 'voucher_count', align: 'right' },
          { header: 'Sold Gold Wt (g)', dataKey: 'sold_gold_fmt', align: 'right' },
          { header: 'Sold Silver Wt (g)', dataKey: 'sold_silver_fmt', align: 'right' },
          { header: 'Profit Gold Fine (g)', dataKey: 'profit_gold_fmt', align: 'right' },
          { header: 'Profit Sil. Fine (g)', dataKey: 'profit_silver_fmt', align: 'right' },
          { header: 'Profit In Amount (₹)', dataKey: 'profit_amt_fmt', align: 'right' },
        ],
        data: detailedRows.map((r) => ({
          ...r,
          sold_gold_fmt: fmtWt(r.sold_gold_weight),
          sold_silver_fmt: fmtWt(r.sold_silver_weight),
          profit_gold_fmt: fmtWt(r.profit_gold_fine),
          profit_silver_fmt: fmtWt(r.profit_silver_fine),
          profit_amt_fmt: fmtCurr(r.profit_in_amount),
        })),
        totals: {
          account_name: 'Grand Total',
          voucher_count: summaryData?.total_vouchers || 0,
          sold_gold_fmt: fmtWt(summaryData?.gold_weight),
          sold_silver_fmt: fmtWt(summaryData?.silver_weight),
          profit_gold_fmt: fmtWt(summaryData?.gold_profit_fine),
          profit_silver_fmt: fmtWt(summaryData?.silver_profit_fine),
          profit_amt_fmt: fmtCurr(summaryData?.profit_in_amount),
        },
      };
    }

    const voucherRows = allRows as CustomerProfitVoucherRecord[];
    return {
      title: 'Customer Wise Profit Report (Voucher Wise)',
      filename: `Customer_Profit_Voucher_Wise_${new Date().toISOString().split('T')[0]}.pdf`,
      orientation: 'landscape',
      filters: activeFilterList,
      columns: [
        { header: 'Date', dataKey: 'date_fmt', align: 'left' },
        { header: 'Voucher No', dataKey: 'voucher_no', align: 'left' },
        { header: 'Customer Name', dataKey: 'party_name', align: 'left' },
        { header: 'Item Name', dataKey: 'item_name', align: 'left' },
        { header: 'Gold Wt (g)', dataKey: 'gold_fmt', align: 'right' },
        { header: 'Silver Wt (g)', dataKey: 'silver_fmt', align: 'right' },
        { header: 'Gold Profit Fine (g)', dataKey: 'profit_gold_fmt', align: 'right' },
        { header: 'Silver Profit Fine (g)', dataKey: 'profit_silver_fmt', align: 'right' },
        { header: 'Profit Amount (₹)', dataKey: 'profit_amt_fmt', align: 'right' },
      ],
      data: voucherRows.map((r) => ({
        ...r,
        date_fmt: formatDisplayDate(r.voucher_date),
        gold_fmt: fmtWt(r.gold_weight),
        silver_fmt: fmtWt(r.silver_weight),
        profit_gold_fmt: fmtWt(r.profit_gold_fine),
        profit_silver_fmt: fmtWt(r.profit_silver_fine),
        profit_amt_fmt: fmtCurr(r.profit_in_amount),
      })),
      totals: {
        date_fmt: 'Grand Total',
        voucher_no: '',
        party_name: `${summaryData?.total_vouchers || 0} Vouchers`,
        item_name: '',
        gold_fmt: fmtWt(summaryData?.gold_weight),
        silver_fmt: fmtWt(summaryData?.silver_weight),
        profit_gold_fmt: fmtWt(summaryData?.gold_profit_fine),
        profit_silver_fmt: fmtWt(summaryData?.silver_profit_fine),
        profit_amt_fmt: fmtCurr(summaryData?.profit_in_amount),
      },
    };
  };

  const handlePrint = async () => {
    try {
      setExporting(true);
      await printReport(await buildReportOptions());
    } catch (err: any) {
      showErrorAlert(err.message || 'Print failed.');
    } finally {
      setExporting(false);
    }
  };

  const handlePdf = async () => {
    try {
      setExporting(true);
      await downloadReportPdf(await buildReportOptions());
    } catch (err: any) {
      showErrorAlert(err.message || 'PDF export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleWhatsApp = async () => {
    try {
      setExporting(true);
      await shareReportOnWhatsApp(await buildReportOptions());
    } catch (err: any) {
      showErrorAlert(err.message || 'WhatsApp share failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleCsvExport = async () => {
    try {
      setExporting(true);
      const rows = await fetchCustomerProfitExport(buildRequestParams(false));
      let csvContent = '';

      if (reportType === 'detailed') {
        const headers = [
          'A/c Name',
          'Vouchers',
          'Sold Gold Wt (g)',
          'Sold Silver Wt (g)',
          'Profit Gold Fine (g)',
          'Profit Sil. Fine (g)',
          'Profit In Amount (INR)',
        ];
        const detailedRows = rows as CustomerProfitDetailedRecord[];
        csvContent = [
          headers.join(','),
          ...detailedRows.map((r) =>
            [
              `"${(r.account_name || '').replace(/"/g, '""')}"`,
              r.voucher_count,
              r.sold_gold_weight,
              r.sold_silver_weight,
              r.profit_gold_fine,
              r.profit_silver_fine,
              r.profit_in_amount,
            ].join(',')
          ),
        ].join('\n');
      } else {
        const headers = [
          'Date',
          'Voucher No',
          'Customer Name',
          'Item Name',
          'Gold Wt (g)',
          'Silver Wt (g)',
          'Gold Profit Fine (g)',
          'Silver Profit Fine (g)',
          'Profit Amount (INR)',
        ];
        const voucherRows = rows as CustomerProfitVoucherRecord[];
        csvContent = [
          headers.join(','),
          ...voucherRows.map((r) =>
            [
              `"${r.voucher_date}"`,
              `"${(r.voucher_no || '').replace(/"/g, '""')}"`,
              `"${(r.party_name || '').replace(/"/g, '""')}"`,
              `"${(r.item_name || '').replace(/"/g, '""')}"`,
              r.gold_weight,
              r.silver_weight,
              r.profit_gold_fine,
              r.profit_silver_fine,
              r.profit_in_amount,
            ].join(',')
          ),
        ].join('\n');
      }

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Customer_Profit_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showErrorAlert(err.message || 'CSV export failed.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 space-y-4">
      <div className="max-w-[1920px] mx-auto space-y-4">
        {/* TOP HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Customer Wise Profit Report
              </h1>
              <p className="text-xs text-slate-500">
                Customer-level & voucher-level gold/silver profit analysis (Avg Purchase Rate)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handlePdf}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleCsvExport}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* FILTER SECTION */}
        <form
          onSubmit={handleApplyFilters}
          className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Date From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Date To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              >
                <option value="all">All Cities</option>
                {filterOptions.cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Group
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              >
                <option value="all">All Groups</option>
                {filterOptions.groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Sale Man
              </label>
              <select
                value={salesman}
                onChange={(e) => setSalesman(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              >
                <option value="all">All Salesmen</option>
                {filterOptions.salesmen.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Site
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              >
                <option value="all">All Sites</option>
                {filterOptions.sites.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Second Row: Report Type Toggle + Search + Apply/Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              {/* Report Type Radio/Pill Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleReportTypeChange('detailed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${reportType === 'detailed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Detailed
                </button>
                <button
                  type="button"
                  onClick={() => handleReportTypeChange('voucher_wise')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${reportType === 'voucher_wise'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Voucher Wise
                </button>
              </div>

              {/* Search Input */}
              <div className="relative min-w-[240px] sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search customer name..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply Filter</span>
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>
        </form>

        {/* DATA TABLE SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Top Bar */}
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                Showing {items.length} of {totalRecords} records
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-[11px] text-slate-500">
                Gold Cost: ₹{fmtCurr(avgRates.gold_avg_purchase_rate)}/g · Silver Cost: ₹
                {fmtCurr(avgRates.silver_avg_purchase_rate)}/g
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-medium">Rows per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-600"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Calculating customer profit...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-1.5">
                <TrendingUp className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No Profit Records Found</p>
                <p className="text-xs text-slate-400">
                  Try adjusting your date range or filter selections.
                </p>
              </div>
            ) : reportType === 'detailed' ? (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th
                      onClick={() => handleSort('account_name')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      A/c Name {renderSortIcon('account_name')}
                    </th>
                    <th
                      onClick={() => handleSort('sold_gold_weight')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Sold Gold Wt {renderSortIcon('sold_gold_weight')}
                    </th>
                    <th
                      onClick={() => handleSort('sold_silver_weight')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Sold Silver Wt {renderSortIcon('sold_silver_weight')}
                    </th>
                    <th
                      onClick={() => handleSort('profit_gold_fine')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Profit Gold Fine {renderSortIcon('profit_gold_fine')}
                    </th>
                    <th
                      onClick={() => handleSort('profit_silver_fine')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Profit Sil. Fine {renderSortIcon('profit_silver_fine')}
                    </th>
                    <th
                      onClick={() => handleSort('profit_in_amount')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Profit In Amount {renderSortIcon('profit_in_amount')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(items as CustomerProfitDetailedRecord[]).map((row, idx) => {
                    const isPositive = row.profit_in_amount >= 0;
                    return (
                      <tr
                        key={`${row.account_name}-${idx}`}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{row.account_name}</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-mono">
                              {row.voucher_count} vch
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-amber-800 whitespace-nowrap">
                          {fmtWt(row.sold_gold_weight)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-800 whitespace-nowrap">
                          {fmtWt(row.sold_silver_weight)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-semibold whitespace-nowrap ${row.profit_gold_fine >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                        >
                          {fmtWt(row.profit_gold_fine)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-semibold whitespace-nowrap ${row.profit_silver_fine >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                        >
                          {fmtWt(row.profit_silver_fine)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${isPositive ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                        >
                          ₹{fmtCurr(row.profit_in_amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th
                      onClick={() => handleSort('voucher_date')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Date {renderSortIcon('voucher_date')}
                    </th>
                    <th
                      onClick={() => handleSort('voucher_no')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Voucher Number {renderSortIcon('voucher_no')}
                    </th>
                    <th
                      onClick={() => handleSort('party_name')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Customer Name {renderSortIcon('party_name')}
                    </th>
                    <th
                      onClick={() => handleSort('item_name')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Item Name {renderSortIcon('item_name')}
                    </th>
                    <th
                      onClick={() => handleSort('gold_weight')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Gold Weight {renderSortIcon('gold_weight')}
                    </th>
                    <th
                      onClick={() => handleSort('silver_weight')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Silver Weight {renderSortIcon('silver_weight')}
                    </th>
                    <th
                      onClick={() => handleSort('profit_gold_fine')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Gold Profit Fine {renderSortIcon('profit_gold_fine')}
                    </th>
                    <th
                      onClick={() => handleSort('profit_silver_fine')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Silver Profit Fine {renderSortIcon('profit_silver_fine')}
                    </th>
                    <th
                      onClick={() => handleSort('profit_in_amount')}
                      className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
                    >
                      Profit Amount {renderSortIcon('profit_in_amount')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(items as CustomerProfitVoucherRecord[]).map((row) => {
                    const isPositive = row.profit_in_amount >= 0;
                    return (
                      <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                          {formatDisplayDate(row.voucher_date)}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-700 whitespace-nowrap">
                          {row.voucher_no}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {row.party_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {row.item_name}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-amber-800 whitespace-nowrap">
                          {fmtWt(row.gold_weight)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-800 whitespace-nowrap">
                          {fmtWt(row.silver_weight)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-semibold whitespace-nowrap ${row.profit_gold_fine >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                        >
                          {fmtWt(row.profit_gold_fine)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-semibold whitespace-nowrap ${row.profit_silver_fine >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                        >
                          {fmtWt(row.profit_silver_fine)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${isPositive ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                        >
                          ₹{fmtCurr(row.profit_in_amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong> ({totalRecords} total)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || loading}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SUMMARY PANEL */}
        <CustomerProfitSummaryPanel
          summary={summaryData}
          loading={summaryLoading}
          onRefresh={loadSummary}
        />
      </div>
    </div>
  );
};
