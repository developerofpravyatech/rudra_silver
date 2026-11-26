import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  Search,
  Printer,
  Download,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  X,
  Loader2,
  ArrowUpDown,
  FileSpreadsheet,
  ShieldCheck,
  CheckSquare,
  FileText,
  MessageCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  DailyTransactionRecord,
  DailyTransactionTotals,
  DailyTransactionFilterParams,
  DailyTransactionFilterOptions,
} from '../../types';
import {
  fetchDailyTransactions,
  deleteDailyTransaction,
  fetchDailyTransactionFilterOptions,
  fetchDailyTransactionsExport,
} from '../../services/api';
import { showSuccessAlert, showErrorAlert, showDeleteConfirmDialog } from '../../utils/alert';
import { TransactionDetailModal, TransactionViewModal } from './TransactionDetailModal';
import {
  printReport,
  downloadReportPdf,
  shareReportOnWhatsApp,
  ReportPdfOptions,
} from '../../utils/reportPdf';

interface TransactionsListProps {
  onBackToDashboard?: () => void;
  onNavigateAdd?: () => void;
  onNavigateEdit?: (id: number) => void;
}

export const TransactionListPage: React.FC<TransactionsListProps> = ({
  onBackToDashboard,
  onNavigateAdd,
  onNavigateEdit,
}) => {
  const navigate = useNavigate();

  const handleAddClick = () => {
    if (onNavigateAdd) {
      onNavigateAdd();
    } else {
      navigate('/transactions/add');
    }
  };

  const handleEditClick = (id: number) => {
    if (onNavigateEdit) {
      onNavigateEdit(id);
    } else {
      navigate(`/transactions/edit/${id}`);
    }
  };

  // Data states
  const [items, setItems] = useState<DailyTransactionRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totals, setTotals] = useState<DailyTransactionTotals>({
    total_pc: 0,
    total_gross_weight: 0,
    total_net_weight: 0,
    total_dia_weight: 0,
    total_stone_weight: 0,
    total_gold_fine: 0,
    total_silver_fine: 0,
    total_amount: 0,
  });

  // Filter options from database
  const [filterOptions, setFilterOptions] = useState<DailyTransactionFilterOptions>({
    groups: [],
    logins: [],
    stamps: [],
    voucher_types: [],
    series: [],
    sites: [],
    types: [],
    parties: [],
  });

  // Date controls
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedDateOption, setSelectedDateOption] = useState<string>('all');

  // Dropdown filter states
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedLogin, setSelectedLogin] = useState<string>('all');
  const [selectedStamp, setSelectedStamp] = useState<string>('all');
  const [selectedVoucherType, setSelectedVoucherType] = useState<string>('all');
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Radio view filter
  const [radioView, setRadioView] = useState<'Short' | 'Detailed' | '3.Dr/Cr' | 'Voucher' | 'Detail2'>('Detailed');

  // Checkbox filters
  const [isUndelivered, setIsUndelivered] = useState<boolean>(false);
  const [hasStudDetails, setHasStudDetails] = useState<boolean>(false);
  const [accountsOnly, setAccountsOnly] = useState<boolean>(false);
  const [excludeZero, setExcludeZero] = useState<boolean>(false);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  const [showAdvFilter, setShowAdvFilter] = useState<boolean>(true);

  // Grouping modes triggered by toolbar
  const [activeGrouping, setActiveGrouping] = useState<'NONE' | 'VOUCHER' | 'TYPE' | 'GROUP' | 'JOB'>('NONE');

  // Selected row IDs for bulk operations
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<string>('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  // View modal state
  const [viewingItem, setViewingItem] = useState<DailyTransactionRecord | null>(null);

  // Load filter options
  useEffect(() => {
    fetchDailyTransactionFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Failed to load transaction options:', err));
  }, []);

  // Fetch data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: DailyTransactionFilterParams = {
        page: currentPage,
        limit: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (selectedDateOption !== 'all') params.date_option = selectedDateOption;

      if (selectedGroup !== 'all') params.group_name = selectedGroup;
      if (selectedLogin !== 'all') params.login_name = selectedLogin;
      if (selectedStamp !== 'all') params.stamp = selectedStamp;
      if (selectedVoucherType !== 'all') params.voucher_type = selectedVoucherType;
      if (selectedParty !== 'all') params.party_name = selectedParty;
      if (selectedSeries !== 'all') params.series = selectedSeries;
      if (selectedSite !== 'all') params.site = selectedSite;
      if (selectedType !== 'all') params.transaction_type = selectedType;

      if (isUndelivered) params.is_undelivered = 1;
      if (hasStudDetails) params.stud_details = 1;
      if (excludeZero) params.exclude = 1;

      if (appliedSearch) params.search = appliedSearch;

      const res = await fetchDailyTransactions(params);
      setItems(res.items);
      setTotalRecords(res.total);
      setTotalPages(res.total_pages);
      setTotals(res.totals);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    fromDate,
    toDate,
    selectedDateOption,
    selectedGroup,
    selectedLogin,
    selectedStamp,
    selectedVoucherType,
    selectedParty,
    selectedSeries,
    selectedSite,
    selectedType,
    isUndelivered,
    hasStudDetails,
    accountsOnly,
    excludeZero,
    appliedSearch,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick Date presets
  const handleQuickDate = (option: string) => {
    setSelectedDateOption(option);
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (option === 'prev') {
      const prev = new Date(today);
      prev.setDate(prev.getDate() - 1);
      setFromDate(toYMD(prev));
      setToDate(toYMD(prev));
    } else if (option === 'next') {
      const next = new Date(today);
      next.setDate(next.getDate() + 1);
      setFromDate(toYMD(next));
      setToDate(toYMD(next));
    } else if (option === 'today') {
      setFromDate(toYMD(today));
      setToDate(toYMD(today));
    } else {
      setFromDate('');
      setToDate('');
    }
    setCurrentPage(1);
  };

  // Reset all filters
  const handleAllRecords = () => {
    setFromDate('');
    setToDate('');
    setSelectedDateOption('all');
    setSelectedGroup('all');
    setSelectedLogin('all');
    setSelectedStamp('all');
    setSelectedVoucherType('all');
    setSelectedParty('all');
    setSelectedSeries('all');
    setSelectedSite('all');
    setSelectedType('all');
    setIsUndelivered(false);
    setHasStudDetails(false);
    setAccountsOnly(false);
    setExcludeZero(false);
    setSearchQuery('');
    setAppliedSearch('');
    setActiveGrouping('NONE');
    setCurrentPage(1);
  };

  // Search trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery.trim());
    setCurrentPage(1);
  };

  // Delete transaction
  const handleDelete = async (id: number, partyName: string) => {
    const result = await showDeleteConfirmDialog(
      `Transaction #${id} for ${partyName} will be permanently removed.`,
      'Delete Transaction?'
    );
    if (!result.isConfirmed) return;

    try {
      await deleteDailyTransaction(id);
      await showSuccessAlert(`Transaction #${id} deleted successfully.`, 'Deleted!');
      setSelectedRowIds((prev) => prev.filter((rId) => rId !== id));
      loadData();
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to delete transaction.', 'Error!');
    }
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedRowIds.length === items.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(items.map((i) => i.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Helper to compile active transaction filter parameters
  const getCurrentFilterParams = (): DailyTransactionFilterParams => ({
    search: appliedSearch || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    group_name: selectedGroup !== 'all' ? selectedGroup : undefined,
    login_name: selectedLogin !== 'all' ? selectedLogin : undefined,
    stamp: selectedStamp !== 'all' ? selectedStamp : undefined,
    voucher_type: selectedVoucherType !== 'all' ? selectedVoucherType : undefined,
    party_name: selectedParty !== 'all' ? selectedParty : undefined,
    series: selectedSeries !== 'all' ? selectedSeries : undefined,
    site: selectedSite !== 'all' ? selectedSite : undefined,
    transaction_type: selectedType !== 'all' ? selectedType : undefined,
    is_undelivered: isUndelivered ? true : undefined,
    stud_details: hasStudDetails ? true : undefined,
    exclude: excludeZero ? true : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  // Build PDF Report Options for Print, PDF Download, and WhatsApp Sharing
  const getTransactionReportOptions = (records: DailyTransactionRecord[]): ReportPdfOptions => {
    const today = new Date().toISOString().split('T')[0];
    return {
      title: 'Daily Transactions Report',
      subtitle: 'Rudra Silver Jewellery ERP',
      filename: `Daily_Transaction_${today}.pdf`,
      filters: [
        { label: 'From Date', value: fromDate || 'All' },
        { label: 'To Date', value: toDate || 'All' },
        { label: 'Type', value: selectedType === 'all' ? 'All' : selectedType },
        { label: 'Group', value: selectedGroup === 'all' ? 'All' : selectedGroup },
        { label: 'Search', value: appliedSearch || 'All' },
        { label: 'Total Records', value: String(records.length) },
      ],
      columns: [
        { header: 'Date', dataKey: 'transaction_date', align: 'center' },
        { header: 'Type', dataKey: 'transaction_type', align: 'left' },
        { header: 'Party Name', dataKey: 'party_name', align: 'left' },
        { header: 'Ref No.', dataKey: 'ref_no', align: 'left' },
        { header: 'Narration', dataKey: 'narration', align: 'left' },
        { header: 'Pc', dataKey: 'pc', align: 'right' },
        { header: 'Gr. Wt', dataKey: 'gross_weight', align: 'right' },
        { header: 'Net Wt', dataKey: 'net_weight', align: 'right' },
        { header: 'Dia. Wt', dataKey: 'dia_weight', align: 'right' },
        { header: 'Stn. Wt', dataKey: 'stone_weight', align: 'right' },
        { header: 'Gold Fine', dataKey: 'gold_fine', align: 'right' },
        { header: 'Sil. Fine', dataKey: 'silver_fine', align: 'right' },
        { header: 'Total (₹)', dataKey: 'total_amount', align: 'right' },
      ],
      data: records.map((r) => ({
        transaction_date: r.transaction_date || '—',
        transaction_type: r.transaction_type || '—',
        party_name: r.party_name || '—',
        ref_no: r.ref_no || '—',
        narration: r.narration || '—',
        pc: r.pc !== undefined && r.pc !== null ? String(r.pc) : '—',
        gross_weight: Number(r.gross_weight || 0).toFixed(3),
        net_weight: Number(r.net_weight || 0).toFixed(3),
        dia_weight: Number(r.dia_weight || 0).toFixed(3),
        stone_weight: Number(r.stone_weight || 0).toFixed(3),
        gold_fine: Number(r.gold_fine || 0).toFixed(3),
        silver_fine: Number(r.silver_fine || 0).toFixed(3),
        total_amount: Number(r.total_amount || 0).toFixed(2),
      })),
      totals: {
        transaction_date: '',
        transaction_type: '',
        party_name: 'GRAND TOTAL',
        ref_no: '',
        narration: '',
        pc: String(totals.total_pc || 0),
        gross_weight: Number(totals.total_gross_weight || 0).toFixed(3),
        net_weight: Number(totals.total_net_weight || 0).toFixed(3),
        dia_weight: Number(totals.total_dia_weight || 0).toFixed(3),
        stone_weight: Number(totals.total_stone_weight || 0).toFixed(3),
        gold_fine: Number(totals.total_gold_fine || 0).toFixed(3),
        silver_fine: Number(totals.total_silver_fine || 0).toFixed(3),
        total_amount: `₹${Number(totals.total_amount || 0).toFixed(2)}`,
      },
      orientation: 'landscape',
    };
  };

  // 1. Print Handler: Opens formatted print preview (A4 Landscape, repeating headers)
  const handlePrint = async () => {
    try {
      setExporting(true);
      const rows = await fetchDailyTransactionsExport(getCurrentFilterParams());
      if (!rows || rows.length === 0) {
        showErrorAlert('No transactions found to print.', 'No Data');
        return;
      }
      await printReport(getTransactionReportOptions(rows));
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to print transactions report.', 'Print Error');
    } finally {
      setExporting(false);
    }
  };

  // 2. Download PDF Handler: Direct PDF file download
  const handleDownloadPDF = async () => {
    try {
      setExporting(true);
      const rows = await fetchDailyTransactionsExport(getCurrentFilterParams());
      if (!rows || rows.length === 0) {
        showErrorAlert('No transactions found to download as PDF.', 'No Data');
        return;
      }
      await downloadReportPdf(getTransactionReportOptions(rows));
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to download PDF report.', 'Download Error');
    } finally {
      setExporting(false);
    }
  };

  // 3. Share on WhatsApp Handler: Native Web Share API or WhatsApp Web prefilled message
  const handleShareWhatsApp = async () => {
    try {
      setExporting(true);
      const rows = await fetchDailyTransactionsExport(getCurrentFilterParams());
      if (!rows || rows.length === 0) {
        showErrorAlert('No transactions found to share on WhatsApp.', 'No Data');
        return;
      }
      await shareReportOnWhatsApp(getTransactionReportOptions(rows));
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to share report on WhatsApp.', 'WhatsApp Error');
    } finally {
      setExporting(false);
    }
  };

  // Export CSV Handler
  const handleExport = async () => {
    try {
      setExporting(true);
      const rows = await fetchDailyTransactionsExport({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        group_name: selectedGroup !== 'all' ? selectedGroup : undefined,
        voucher_type: selectedVoucherType !== 'all' ? selectedVoucherType : undefined,
        search: appliedSearch || undefined,
      });

      if (!rows || rows.length === 0) {
        Swal.fire({ icon: 'info', title: 'No Data', text: 'No transactions found to export.' });
        return;
      }

      const headers = ['Date', 'Type', 'Party Name', 'Ref No.', 'Narration', 'Pc', 'Gr.Wt', 'Net.Wt', 'Dia.Wt', 'Stn.Wt', 'Gold Fine', 'Silver Fine', 'Total'];
      const csvRows = rows.map((r) => [
        `"${r.transaction_date}"`,
        `"${r.transaction_type}"`,
        `"${r.party_name}"`,
        `"${r.ref_no || ''}"`,
        `"${r.narration || ''}"`,
        r.pc,
        r.gross_weight,
        r.net_weight,
        r.dia_weight,
        r.stone_weight,
        r.gold_fine,
        r.silver_fine,
        r.total_amount,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Daily_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      showErrorAlert(err.message || 'Error exporting transactions.', 'Export Failed');
    } finally {
      setExporting(false);
    }
  };

  // Grouped items helper
  const groupedData = useMemo(() => {
    if (activeGrouping === 'NONE') return null;
    const map = new Map<string, DailyTransactionRecord[]>();
    items.forEach((item) => {
      let key = 'Other';
      if (activeGrouping === 'VOUCHER') key = item.voucher_type || 'Regular';
      else if (activeGrouping === 'TYPE') key = item.transaction_type || 'General';
      else if (activeGrouping === 'GROUP') key = item.group_name || 'General Group';
      else if (activeGrouping === 'JOB') key = item.series || 'Standard Job';

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).map(([groupName, records]) => ({
      groupName,
      records,
      subTotalPc: records.reduce((s, r) => s + (r.pc || 0), 0),
      subTotalGrWt: records.reduce((s, r) => s + (r.gross_weight || 0), 0),
      subTotalNetWt: records.reduce((s, r) => s + (r.net_weight || 0), 0),
      subTotalAmount: records.reduce((s, r) => s + (r.total_amount || 0), 0),
    }));
  }, [items, activeGrouping]);

  const fmt = (val: number | undefined, decimals = 3) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.000' : n.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none">
      <div className="p-3 sm:p-5 lg:p-6 max-w-[1900px] mx-auto w-full space-y-3.5">
        {/* TOP HEADER */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-xs shrink-0">
              <List className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Daily Transaction
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5 font-medium">
                <span
                  className="hover:text-amber-500 cursor-pointer"
                  onClick={onBackToDashboard || (() => navigate('/'))}
                >
                  Dashboard
                </span>
                <span>/</span>
                <span>Transactions</span>
                <span>/</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Daily Register</span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1.5 bg-white dark:bg-[#141824] cursor-pointer disabled:opacity-50"
              title="Print Transactions Report (A4 Landscape, Repeating Headers)"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1.5 bg-white dark:bg-[#141824] cursor-pointer disabled:opacity-50"
              title="Download Transactions Report PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-600/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/20 cursor-pointer disabled:opacity-50"
              title="Share Transactions Report on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => loadData()}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAddClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-105 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-4 space-y-3">
          {/* Row 1: Date & Main Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 items-end">
            <div>
              <button
                type="button"
                onClick={handleAllRecords}
                className="w-full py-1.5 px-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs transition cursor-pointer"
              >
                All Records
              </button>
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDate('today')}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold border ${selectedDateOption === 'today' ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' : 'border-slate-200 dark:border-white/[0.1]'}`}
              >
                Today
              </button>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922]"
              />
            </div>

            {/* Quick Dropdown: Series */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Series</label>
              <select
                value={selectedSeries}
                onChange={(e) => { setSelectedSeries(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922]"
              >
                <option value="all">ALL Series</option>
                {filterOptions.series.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Quick Dropdown: Site */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Site</label>
              <select
                value={selectedSite}
                onChange={(e) => { setSelectedSite(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922]"
              >
                <option value="all">ALL Site</option>
                {filterOptions.sites.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Quick Dropdown: Type */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Type</label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-semibold text-amber-600 dark:text-amber-400"
              >
                <option value="all">ALL Types</option>
                {['Sale', 'Purchase', 'Receipt', 'Payment', 'Issue', 'Receive', 'Journal', 'Contra'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Toggle Advanced Filter */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvFilter(!showAdvFilter)}
                className="w-full py-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showAdvFilter ? 'Less Filters' : 'Adv. Filter'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Secondary Dropdowns (Toggled or Always on wide) */}
          {showAdvFilter && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {/* GName */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Group Name</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => { setSelectedGroup(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922]"
                  >
                    <option value="all">ALL GName</option>
                    {filterOptions.groups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Login */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Login User</label>
                  <select
                    value={selectedLogin}
                    onChange={(e) => { setSelectedLogin(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922]"
                  >
                    <option value="all">ALL Login</option>
                    {filterOptions.logins.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Stamp */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Stamp / Purity</label>
                  <select
                    value={selectedStamp}
                    onChange={(e) => { setSelectedStamp(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922]"
                  >
                    <option value="all">ALL Stamp</option>
                    {filterOptions.stamps.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* VType */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Voucher Type</label>
                  <select
                    value={selectedVoucherType}
                    onChange={(e) => { setSelectedVoucherType(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922]"
                  >
                    <option value="all">ALL VType</option>
                    {filterOptions.voucher_types.map((vt) => (
                      <option key={vt} value={vt}>{vt}</option>
                    ))}
                  </select>
                </div>

                {/* Party (All A/C) */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Account / Party</label>
                  <select
                    value={selectedParty}
                    onChange={(e) => { setSelectedParty(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922]"
                  >
                    <option value="all">ALL A/C</option>
                    {filterOptions.parties.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Radios, Checkboxes & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Radios */}
                <div className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-[#151922] p-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/[0.06]">
                  {(['Short', 'Detailed', '3.Dr/Cr', 'Voucher', 'Detail2'] as const).map((mode) => (
                    <label key={mode} className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="radioView"
                        checked={radioView === mode}
                        onChange={() => setRadioView(mode)}
                        className="accent-amber-500 cursor-pointer"
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap items-center gap-3.5 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isUndelivered}
                      onChange={(e) => { setIsUndelivered(e.target.checked); setCurrentPage(1); }}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <span>Undeliver</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasStudDetails}
                      onChange={(e) => { setHasStudDetails(e.target.checked); setCurrentPage(1); }}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <span>Stud Details</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={accountsOnly}
                      onChange={(e) => { setAccountsOnly(e.target.checked); setCurrentPage(1); }}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <span>Accounts</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={excludeZero}
                      onChange={(e) => { setExcludeZero(e.target.checked); setCurrentPage(1); }}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <span>Exclude 0</span>
                  </label>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search voucher, party, ref..."
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] text-xs w-48 sm:w-60 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    Filter
                  </button>
                  {appliedSearch && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setAppliedSearch(''); setCurrentPage(1); }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs text-slate-500 hover:text-slate-800"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100/80 dark:bg-[#141923] text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedRowIds.length === items.length}
                      onChange={toggleSelectAll}
                      className="accent-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => { setSortBy('transaction_date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1"><span>Date</span><ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => { setSortBy('transaction_type'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1"><span>Type</span><ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => { setSortBy('party_name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1"><span>Party Name</span><ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th className="py-2.5 px-3">Ref No.</th>
                  <th className="py-2.5 px-3">Narration</th>
                  <th className="py-2.5 px-3 text-right">Pc</th>
                  <th className="py-2.5 px-3 text-right">Gr. Wt.</th>
                  <th className="py-2.5 px-3 text-right">Net Wt.</th>
                  <th className="py-2.5 px-3 text-right">Dia. Wt.</th>
                  <th className="py-2.5 px-3 text-right">Stn. Wt.</th>
                  <th className="py-2.5 px-3 text-right">Gold Fine</th>
                  <th className="py-2.5 px-3 text-right">Silver Fine</th>
                  <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => { setSortBy('total_amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center justify-end gap-1"><span>Total</span><ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-slate-700 dark:text-slate-300 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        <span className="text-xs">Loading transaction register...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileSpreadsheet className="w-8 h-8 opacity-40 text-amber-500" />
                        <span className="text-sm font-semibold">No daily transactions found</span>
                        <p className="text-xs max-w-sm">No transaction records match the current filters. Adjust your criteria or click All Records.</p>
                      </div>
                    </td>
                  </tr>
                ) : groupedData ? (
                  groupedData.map((group) => (
                    <React.Fragment key={group.groupName}>
                      <tr className="bg-amber-500/10 dark:bg-amber-500/15 font-bold text-amber-800 dark:text-amber-300">
                        <td colSpan={6} className="py-2 px-3 text-xs uppercase tracking-wide">
                          [ {group.groupName} ] ({group.records.length} records)
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{group.subTotalPc}</td>
                        <td className="py-2 px-3 text-right font-mono">{fmt(group.subTotalGrWt)}</td>
                        <td className="py-2 px-3 text-right font-mono">{fmt(group.subTotalNetWt)}</td>
                        <td colSpan={4}></td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          ₹{fmt(group.subTotalAmount, 2)}
                        </td>
                        <td></td>
                      </tr>
                      {group.records.map((r) => (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition ${selectedRowIds.includes(r.id) ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''}`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedRowIds.includes(r.id)}
                              onChange={() => toggleSelectRow(r.id)}
                              className="accent-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px]">{r.transaction_date}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.transaction_type === 'Sale' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                r.transaction_type === 'Purchase' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                  r.transaction_type === 'Payment' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                    'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                              }`}>
                              {r.transaction_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate" title={r.party_name}>
                            {r.party_name}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{r.ref_no || '—'}</td>
                          <td className="py-2 px-3 text-slate-500 max-w-[180px] truncate" title={r.narration}>{r.narration || '—'}</td>
                          <td className="py-2 px-3 text-right font-mono">{r.pc}</td>
                          <td className="py-2 px-3 text-right font-mono">{fmt(r.gross_weight)}</td>
                          <td className="py-2 px-3 text-right font-mono">{fmt(r.net_weight)}</td>
                          <td className="py-2 px-3 text-right font-mono">{fmt(r.dia_weight)}</td>
                          <td className="py-2 px-3 text-right font-mono">{fmt(r.stone_weight)}</td>
                          <td className="py-2 px-3 text-right font-mono">{fmt(r.gold_fine)}</td>
                          <td className="py-2 px-3 text-right font-mono">{fmt(r.silver_fine)}</td>
                          <td className={`py-2 px-3 text-right font-mono font-bold ${r.total_amount < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                            ₹{fmt(r.total_amount, 2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-slate-400">
                              <button onClick={() => setViewingItem(r)} className="p-1 hover:text-amber-500 cursor-pointer" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleEditClick(r.id)} className="p-1 hover:text-blue-500 cursor-pointer" title="Edit on page"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(r.id, r.party_name)} className="p-1 hover:text-rose-500 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  items.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition ${selectedRowIds.includes(r.id) ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''}`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(r.id)}
                          onChange={() => toggleSelectRow(r.id)}
                          className="accent-amber-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{r.transaction_date}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.transaction_type === 'Sale' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            r.transaction_type === 'Purchase' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                              r.transaction_type === 'Payment' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                          }`}>
                          {r.transaction_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate" title={r.party_name}>
                        {r.party_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{r.ref_no || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[180px] truncate" title={r.narration}>{r.narration || '—'}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{r.pc}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{fmt(r.gross_weight)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{fmt(r.net_weight)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{fmt(r.dia_weight)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{fmt(r.stone_weight)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{fmt(r.gold_fine)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{fmt(r.silver_fine)}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${r.total_amount < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        ₹{fmt(r.total_amount, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-400">
                          <button onClick={() => setViewingItem(r)} className="p-1 hover:text-amber-500 cursor-pointer" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleEditClick(r.id)} className="p-1 hover:text-blue-500 cursor-pointer" title="Edit on page"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(r.id, r.party_name)} className="p-1 hover:text-rose-500 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* SUMMARY CALCULATIONS ROW */}
              {items.length > 0 && (
                <tfoot className="bg-amber-500/10 dark:bg-amber-500/20 font-bold border-t-2 border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs">
                  <tr>
                    <td colSpan={6} className="py-3 px-3 uppercase tracking-wider text-[11px]">
                      Register Summary ({totalRecords} matching records total)
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{totals.total_pc}</td>
                    <td className="py-3 px-3 text-right font-mono">{fmt(totals.total_gross_weight)}</td>
                    <td className="py-3 px-3 text-right font-mono">{fmt(totals.total_net_weight)}</td>
                    <td className="py-3 px-3 text-right font-mono">{fmt(totals.total_dia_weight)}</td>
                    <td className="py-3 px-3 text-right font-mono">{fmt(totals.total_stone_weight)}</td>
                    <td className="py-3 px-3 text-right font-mono">{fmt(totals.total_gold_fine)}</td>
                    <td className="py-3 px-3 text-right font-mono">{fmt(totals.total_silver_fine)}</td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-amber-600 dark:text-amber-400">
                      ₹{fmt(totals.total_amount, 2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>Showing {items.length} of {totalRecords} records</span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] p-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold px-2">Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION TOOLBAR */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={exporting}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Print Transactions Report"
            >
              <Printer className="w-3.5 h-3.5 text-blue-500" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Download Transactions PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={exporting}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-amber-500" />}
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAdvFilter(!showAdvFilter)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Check All</span>
            </button>
            <button
              type="button"
              onClick={() => Swal.fire({ icon: 'success', title: 'Audit Saved', text: 'Audit markers synchronized successfully.' })}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>AuditSave</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Grouping:</span>
            <button
              type="button"
              onClick={() => setActiveGrouping(activeGrouping === 'VOUCHER' ? 'NONE' : 'VOUCHER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${activeGrouping === 'VOUCHER'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                  : 'border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
            >
              Voucher Wise
            </button>
            <button
              type="button"
              onClick={() => setActiveGrouping(activeGrouping === 'TYPE' ? 'NONE' : 'TYPE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${activeGrouping === 'TYPE'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                  : 'border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
            >
              Type Wise
            </button>
            <button
              type="button"
              onClick={() => setActiveGrouping(activeGrouping === 'GROUP' ? 'NONE' : 'GROUP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${activeGrouping === 'GROUP'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                  : 'border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
            >
              Group Wise
            </button>
            <button
              type="button"
              onClick={() => setActiveGrouping(activeGrouping === 'JOB' ? 'NONE' : 'JOB')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${activeGrouping === 'JOB'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                  : 'border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
            >
              Job Wise
            </button>
          </div>
        </div>
      </div>

      {/* VIEW TRANSACTION MODAL */}
      {viewingItem && (
        <TransactionViewModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={(id) => handleEditClick(id)}
        />
      )}
    </div>
  );
};

export const TransactionsList = TransactionListPage;
export default TransactionListPage;
