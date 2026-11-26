import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Coins,
  Plus,
  Search,
  RotateCcw,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  X,
  Loader2,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  MessageCircle,
} from 'lucide-react';
import {
  SilverBullionRecord,
  SilverBullionTotals,
  SilverBullionOpening,
  SilverBullionSummary,
  SilverBullionFilterParams,
  SilverBullionFilterOptions,
} from '../../types';
import {
  fetchSilverBullionList,
  deleteSilverBullion,
  fetchSilverBullionFilterOptions,
  fetchSilverBullionExport,
} from '../../services/api';
import { showSuccessAlert, showErrorAlert, showDeleteConfirmDialog } from '../../utils/alert';
import { SilverBullionDetailModal } from './SilverBullionDetailModal';
import {
  printReport,
  downloadReportPdf,
  shareReportOnWhatsApp,
  ReportPdfOptions,
} from '../../utils/reportPdf';

interface SilverBullionListPageProps {
  onBackToDashboard?: () => void;
  onNavigateAdd?: () => void;
  onNavigateEdit?: (id: number) => void;
}

export const SilverBullionListPage: React.FC<SilverBullionListPageProps> = ({
  onBackToDashboard,
  onNavigateAdd,
  onNavigateEdit,
}) => {
  const navigate = useNavigate();

  const handleAddClick = () => {
    if (onNavigateAdd) {
      onNavigateAdd();
    } else {
      navigate('/silver-bullion/add');
    }
  };

  const handleEditClick = (id: number) => {
    if (onNavigateEdit) {
      onNavigateEdit(id);
    } else {
      navigate(`/silver-bullion/edit/${id}`);
    }
  };

  // Data states
  const [items, setItems] = useState<SilverBullionRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [totals, setTotals] = useState<SilverBullionTotals>({
    total_cr_fine: 0,
    total_cr_amount: 0,
    avg_cr_rate: 0,
    total_dr_fine: 0,
    total_dr_amount: 0,
    avg_dr_rate: 0,
  });

  const [openingBalance, setOpeningBalance] = useState<SilverBullionOpening>({
    fine: 0,
    amount: 0,
    rate: 0,
    val4: 0,
  });

  const [summary, setSummary] = useState<SilverBullionSummary>({
    day_difference_fine: 0,
    day_difference_rate: 0,
    day_difference_amount: 0,
    avg_rate_lg_rate: 0,
    avg_rate_lg_amount: 0,
    closing_fine: 0,
    closing_amount: 0,
    closing_rate: 0,
    closing_val4: 0,
  });

  // Filter options from database
  const [filterOptions, setFilterOptions] = useState<SilverBullionFilterOptions>({
    groups: [],
    parties: [],
    cities: [],
    users: [],
    salesmen: [],
    agents: [],
  });

  // Header Date Filters (defaulting to current month / today)
  const [fromDate, setFromDate] = useState<string>('2026-11-01');
  const [toDate, setToDate] = useState<string>('2026-11-24');
  const [summaryType, setSummaryType] = useState<string>('NA');

  // Header Checkbox Filters matching screenshot
  const [isBhav, setIsBhav] = useState<boolean>(false);
  const [isWoSale, setIsWoSale] = useState<boolean>(false);
  const [isInclLabour, setIsInclLabour] = useState<boolean>(false);
  const [isExclRateBook, setIsExclRateBook] = useState<boolean>(false);

  // Dropdown filter states
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedSalesman, setSelectedSalesman] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [viewingItem, setViewingItem] = useState<SilverBullionRecord | null>(null);

  // Load filter options on mount
  useEffect(() => {
    fetchSilverBullionFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Failed to load Silver Bullion filter options:', err));
  }, []);

  // Fetch list data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: SilverBullionFilterParams = {
        page: currentPage,
        limit: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      if (selectedGroup !== 'all') params.account_group_name = selectedGroup;
      if (selectedParty !== 'all') params.party_name = selectedParty;
      if (selectedCity !== 'all') params.account_city = selectedCity;
      if (selectedUser !== 'all') params.user_name = selectedUser;
      if (selectedSalesman !== 'all') params.salesman_name = selectedSalesman;
      if (selectedAgent !== 'all') params.agent_name = selectedAgent;

      if (isBhav) params.bhav = 1;
      if (isWoSale) params.wo_sale = 1;
      if (isInclLabour) params.including_labour = 1;
      if (isExclRateBook) params.exclude_rate_book = 1;

      if (appliedSearch) params.search = appliedSearch;

      const res = await fetchSilverBullionList(params);
      setItems(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
      if (res.totals) setTotals(res.totals);
      if (res.opening_balance) setOpeningBalance(res.opening_balance);
      if (res.summary) setSummary(res.summary);
    } catch (err: any) {
      console.error('Error fetching Silver Bullion:', err);
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
    selectedGroup,
    selectedParty,
    selectedCity,
    selectedUser,
    selectedSalesman,
    selectedAgent,
    isBhav,
    isWoSale,
    isInclLabour,
    isExclRateBook,
    appliedSearch,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Date Shift Buttons (Previous / Next)
  const shiftDate = (direction: 'prev' | 'next') => {
    if (!fromDate && !toDate) {
      const today = new Date().toISOString().split('T')[0];
      setFromDate(today);
      setToDate(today);
      return;
    }
    const target = new Date(toDate || fromDate);
    target.setDate(target.getDate() + (direction === 'next' ? 1 : -1));
    const formatted = target.toISOString().split('T')[0];
    setFromDate(formatted);
    setToDate(formatted);
    setCurrentPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFromDate('2026-11-01');
    setToDate('2026-11-24');
    setSummaryType('NA');
    setIsBhav(false);
    setIsWoSale(false);
    setIsInclLabour(false);
    setIsExclRateBook(false);
    setSelectedGroup('all');
    setSelectedParty('all');
    setSelectedCity('all');
    setSelectedUser('all');
    setSelectedSalesman('all');
    setSelectedAgent('all');
    setSearchQuery('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery.trim());
    setCurrentPage(1);
  };

  // Delete transaction
  const handleDelete = async (id: number, partyName: string) => {
    const result = await showDeleteConfirmDialog(
      `Silver Bullion entry #${id} for ${partyName} will be deleted.`,
      'Delete Bullion Entry?'
    );
    if (!result.isConfirmed) return;

    try {
      await deleteSilverBullion(id);
      await showSuccessAlert(`Silver Bullion entry #${id} deleted successfully.`, 'Deleted!');
      loadData();
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to delete record.', 'Error!');
    }
  };

  // Build PDF Report Options for Print, PDF Download, and WhatsApp Sharing
  const getSilverBullionReportOptions = (records: SilverBullionRecord[]): ReportPdfOptions => {
    const today = new Date().toISOString().split('T')[0];
    return {
      title: 'Silver Bullion Daily Book',
      subtitle: 'Rudra Silver Jewellery ERP',
      filename: `Silver_Bullion_${today}.pdf`,
      filters: [
        { label: 'From Date', value: fromDate || 'All' },
        { label: 'To Date', value: toDate || 'All' },
        { label: 'A/c Group', value: selectedGroup === 'all' ? 'All' : selectedGroup },
        { label: 'Party', value: selectedParty === 'all' ? 'All' : selectedParty },
        { label: 'City', value: selectedCity === 'all' ? 'All' : selectedCity },
        { label: 'Total Records', value: String(records.length) },
      ],
      columns: [
        { header: 'Date (Cr)', dataKey: 'date_cr', align: 'center' },
        { header: 'Vou No (Cr)', dataKey: 'vou_cr', align: 'left' },
        { header: 'A/c Name (Cr)', dataKey: 'party_cr', align: 'left' },
        { header: 'Fine (Cr)', dataKey: 'fine_cr', align: 'right' },
        { header: 'P.Rate (Cr)', dataKey: 'rate_cr', align: 'right' },
        { header: 'Amount (Cr)', dataKey: 'amount_cr', align: 'right' },
        { header: 'Date (Dr)', dataKey: 'date_dr', align: 'center' },
        { header: 'Vou No (Dr)', dataKey: 'vou_dr', align: 'left' },
        { header: 'A/c Name (Dr)', dataKey: 'party_dr', align: 'left' },
        { header: 'Fine (Dr)', dataKey: 'fine_dr', align: 'right' },
        { header: 'S.Rate (Dr)', dataKey: 'rate_dr', align: 'right' },
        { header: 'Amount (Dr)', dataKey: 'amount_dr', align: 'right' },
      ],
      data: records.map((r) => {
        const isCr = r.transaction_type === 'CR' || r.fine_weight > 0 || r.amount > 0;
        const isDr = r.transaction_type === 'DR' || r.fine_weight_dr > 0 || r.amount_dr > 0;
        return {
          date_cr: isCr ? r.transaction_date : '—',
          vou_cr: isCr ? r.voucher_no : '—',
          party_cr: isCr ? r.party_name : '—',
          fine_cr: isCr && r.fine_weight > 0 ? fmt(r.fine_weight, 3) : '—',
          rate_cr: isCr && r.silver_rate > 0 ? fmt(r.silver_rate, 2) : '—',
          amount_cr: isCr && r.amount > 0 ? fmtCurrency(r.amount) : '—',
          date_dr: isDr ? r.transaction_date : '—',
          vou_dr: isDr ? r.voucher_no : '—',
          party_dr: isDr ? r.party_name : '—',
          fine_dr: isDr && r.fine_weight_dr > 0 ? fmt(r.fine_weight_dr, 3) : '—',
          rate_dr: isDr && r.silver_rate_dr > 0 ? fmt(r.silver_rate_dr, 2) : '—',
          amount_dr: isDr && r.amount_dr > 0 ? fmtCurrency(r.amount_dr) : '—',
        };
      }),
      totals: {
        date_cr: '',
        vou_cr: '',
        party_cr: 'TOTAL (CR)',
        fine_cr: fmt(totals.total_cr_fine, 3),
        rate_cr: fmt(totals.avg_cr_rate, 2),
        amount_cr: `₹${fmtCurrency(totals.total_cr_amount)}`,
        date_dr: '',
        vou_dr: '',
        party_dr: 'TOTAL (DR)',
        fine_dr: fmt(totals.total_dr_fine, 3),
        rate_dr: fmt(totals.avg_dr_rate, 2),
        amount_dr: `₹${fmtCurrency(totals.total_dr_amount)}`,
      },
      orientation: 'landscape',
    };
  };

  // 1. Print Action: Formatted PDF Report with AutoTable, Repeating Headers & Totals
  const handlePrint = async () => {
    try {
      setExporting(true);
      const rows = await fetchSilverBullionExport({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        account_group_name: selectedGroup !== 'all' ? selectedGroup : undefined,
        party_name: selectedParty !== 'all' ? selectedParty : undefined,
        account_city: selectedCity !== 'all' ? selectedCity : undefined,
        search: appliedSearch || undefined,
      });
      if (!rows || rows.length === 0) {
        showErrorAlert('No Silver Bullion records available to print.', 'No Data');
        return;
      }
      await printReport(getSilverBullionReportOptions(rows));
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to print Silver Bullion report.', 'Print Error');
    } finally {
      setExporting(false);
    }
  };

  // 2. Download PDF Action: Direct PDF file download
  const handleDownloadPDF = async () => {
    try {
      setExporting(true);
      const rows = await fetchSilverBullionExport({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        account_group_name: selectedGroup !== 'all' ? selectedGroup : undefined,
        party_name: selectedParty !== 'all' ? selectedParty : undefined,
        account_city: selectedCity !== 'all' ? selectedCity : undefined,
        search: appliedSearch || undefined,
      });
      if (!rows || rows.length === 0) {
        showErrorAlert('No Silver Bullion records available to download.', 'No Data');
        return;
      }
      await downloadReportPdf(getSilverBullionReportOptions(rows));
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to download Silver Bullion PDF.', 'Download Error');
    } finally {
      setExporting(false);
    }
  };

  // 3. Share on WhatsApp Action: Web Share API file attachment or WhatsApp Web
  const handleShareWhatsApp = async () => {
    try {
      setExporting(true);
      const rows = await fetchSilverBullionExport({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        account_group_name: selectedGroup !== 'all' ? selectedGroup : undefined,
        party_name: selectedParty !== 'all' ? selectedParty : undefined,
        account_city: selectedCity !== 'all' ? selectedCity : undefined,
        search: appliedSearch || undefined,
      });
      if (!rows || rows.length === 0) {
        showErrorAlert('No Silver Bullion records available to share.', 'No Data');
        return;
      }
      await shareReportOnWhatsApp(getSilverBullionReportOptions(rows));
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to share Silver Bullion report on WhatsApp.', 'WhatsApp Error');
    } finally {
      setExporting(false);
    }
  };

  // Export CSV
  const handleExport = async () => {
    try {
      setExporting(true);
      const rows = await fetchSilverBullionExport({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        account_group_name: selectedGroup !== 'all' ? selectedGroup : undefined,
        party_name: selectedParty !== 'all' ? selectedParty : undefined,
        account_city: selectedCity !== 'all' ? selectedCity : undefined,
        search: appliedSearch || undefined,
      });

      if (!rows || rows.length === 0) {
        Swal.fire({ icon: 'info', title: 'No Data', text: 'No Silver Bullion records found to export.' });
        return;
      }

      const headers = [
        'Date (Cr)',
        'Vou No (Cr)',
        'A/c Name (Cr)',
        'Fine (Cr)',
        'P.Rate (Cr)',
        'Amount (Cr)',
        'Date (Dr)',
        'Vou No (Dr)',
        'A/c Name (Dr)',
        'Fine (Dr)',
        'S.Rate (Dr)',
        'Amount (Dr)',
      ];

      const csvRows = rows.map((r) => [
        r.transaction_type === 'CR' || r.fine_weight > 0 ? `"${r.transaction_date}"` : '""',
        r.transaction_type === 'CR' || r.fine_weight > 0 ? `"${r.voucher_no}"` : '""',
        r.transaction_type === 'CR' || r.fine_weight > 0 ? `"${r.party_name}"` : '""',
        r.fine_weight,
        r.silver_rate,
        r.amount,
        r.transaction_type === 'DR' || r.fine_weight_dr > 0 ? `"${r.transaction_date}"` : '""',
        r.transaction_type === 'DR' || r.fine_weight_dr > 0 ? `"${r.voucher_no}"` : '""',
        r.transaction_type === 'DR' || r.fine_weight_dr > 0 ? `"${r.party_name}"` : '""',
        r.fine_weight_dr,
        r.silver_rate_dr,
        r.amount_dr,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Silver_Bullion_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      showErrorAlert(err.message || 'Error exporting Silver Bullion records.', 'Export Failed');
    } finally {
      setExporting(false);
    }
  };

  const fmt = (val: number | undefined, decimals = 3) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.000' : n.toFixed(decimals);
  };

  const fmtCurrency = (val: number | undefined) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.00' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none">
      <div className="p-3 sm:p-5 lg:p-6 max-w-[1920px] mx-auto w-full space-y-3.5">
        {/* ========================================================= */}
        {/* TOP HEADER SECTION (Matches Screenshot Row 1)            */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: From/To Dates & Prev/Next & Summary Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#151922] p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08]">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-1">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="text-xs p-1 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0e121b] font-medium"
              />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-1">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="text-xs p-1 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0e121b] font-medium"
              />
            </div>

            {/* Summary Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Summary</span>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-semibold"
              >
                <option value="NA">NA</option>
                <option value="Daily">Daily</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Center: Module Title */}
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Silver Bullion
            </h1>
          </div>

          {/* Right: Checkboxes matching screenshot */}
          <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold select-none">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isBhav}
                onChange={(e) => { setIsBhav(e.target.checked); setCurrentPage(1); }}
                className="accent-amber-500 cursor-pointer"
              />
              <span>Bhav</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isWoSale}
                onChange={(e) => { setIsWoSale(e.target.checked); setCurrentPage(1); }}
                className="accent-amber-500 cursor-pointer"
              />
              <span>W/O Sale</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isInclLabour}
                onChange={(e) => { setIsInclLabour(e.target.checked); setCurrentPage(1); }}
                className="accent-amber-500 cursor-pointer"
              />
              <span>Incl.Labour</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isExclRateBook}
                onChange={(e) => { setIsExclRateBook(e.target.checked); setCurrentPage(1); }}
                className="accent-amber-500 cursor-pointer"
              />
              <span>Excl.Rate Book</span>
            </label>

            <button
              type="button"
              onClick={handlePrint}
              disabled={exporting}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1.5 bg-white dark:bg-[#141824] cursor-pointer disabled:opacity-50"
              title="Print Silver Bullion Report (A4 Landscape, Repeating Headers)"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1.5 bg-white dark:bg-[#141824] cursor-pointer disabled:opacity-50"
              title="Download Silver Bullion Report PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={exporting}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/20 cursor-pointer disabled:opacity-50"
              title="Share Silver Bullion Report on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleAddClick}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-105 transition shadow-sm flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bullion</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* OPENING BALANCE & FILTER SECTION (Screenshot Rows 2 & 3) */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-3.5 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            {/* Opening Balance 4-Box Grid (Matches screenshot top-left) */}
            <div className="lg:col-span-5 flex items-center gap-3">
              <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                Opening Balance
              </span>
              <div className="grid grid-cols-2 gap-1.5 flex-1 max-w-md">
                {/* Box 1 (Top Left) - Fine Weight */}
                <div className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-xs font-bold text-right text-rose-600 dark:text-rose-400">
                  {fmt(openingBalance.fine, 3)}
                </div>
                {/* Box 2 (Top Right) - Amount */}
                <div className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-xs font-bold text-right text-rose-600 dark:text-rose-400">
                  {fmtCurrency(openingBalance.amount)}
                </div>
                {/* Box 3 (Bottom Left - abc / rate) */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">abc</span>
                  <div className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-xs font-bold text-right text-rose-600 dark:text-rose-400 flex-1">
                    {fmt(openingBalance.rate, 2)}
                  </div>
                </div>
                {/* Box 4 (Bottom Right) */}
                <div className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-xs font-bold text-right text-slate-700 dark:text-slate-300">
                  {openingBalance.val4 ?? 0}
                </div>
              </div>
            </div>

            {/* Compact Filters Row (Matches screenshot: A/c Group, Party, City, User, S.Man, Agent) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div>
                <label className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-0.5">A/c Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => { setSelectedGroup(e.target.value); setCurrentPage(1); }}
                  className="w-full text-xs p-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-medium"
                >
                  <option value="all">ALL</option>
                  {filterOptions.groups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-0.5">Party Name</label>
                <select
                  value={selectedParty}
                  onChange={(e) => { setSelectedParty(e.target.value); setCurrentPage(1); }}
                  className="w-full text-xs p-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-medium truncate"
                >
                  <option value="all">ALL</option>
                  {filterOptions.parties.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-0.5">A/c City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
                  className="w-full text-xs p-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-medium"
                >
                  <option value="all">ALL</option>
                  {filterOptions.cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-0.5">User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
                  className="w-full text-xs p-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-medium"
                >
                  <option value="all">ALL</option>
                  {filterOptions.users.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-0.5">S.Man</label>
                <select
                  value={selectedSalesman}
                  onChange={(e) => { setSelectedSalesman(e.target.value); setCurrentPage(1); }}
                  className="w-full text-xs p-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-medium"
                >
                  <option value="all">ALL</option>
                  {filterOptions.salesmen.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-0.5">Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => { setSelectedAgent(e.target.value); setCurrentPage(1); }}
                  className="w-full text-xs p-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-medium"
                >
                  <option value="all">ALL</option>
                  {filterOptions.agents.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Search & Reset Bar */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search voucher or party..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] text-xs w-52 sm:w-64 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
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
                  className="p-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:text-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DUAL-SIDED ACCOUNTING TABLE (Credit & Debit Columns)      */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              {/* Header row 1: Cr / Dr grouping */}
              <thead>
                <tr className="bg-slate-100/90 dark:bg-[#141923] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 dark:border-white/[0.1]">
                  <th colSpan={6} className="py-2 px-3 text-center bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px] border-r border-slate-300 dark:border-white/[0.1]">
                    CREDIT SIDE (Cr) — Purchase / Receive
                  </th>
                  <th colSpan={6} className="py-2 px-3 text-center bg-rose-500/10 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 uppercase tracking-wider text-[11px] border-r border-slate-300 dark:border-white/[0.1]">
                    DEBIT SIDE (Dr) — Sale / Issue
                  </th>
                  <th className="py-2 px-3 text-center uppercase tracking-wider text-[11px]">
                    Actions
                  </th>
                </tr>
                {/* Header row 2: Detailed columns matching screenshot */}
                <tr className="bg-slate-50 dark:bg-[#11151f] text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-white/[0.08]">
                  {/* Credit Columns */}
                  <th className="py-2 px-2.5 border-r border-slate-200 dark:border-white/[0.05]">Date (Cr)</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 dark:border-white/[0.05]">Vou No. (Cr)</th>
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-white/[0.05]">A/c Name (Cr)</th>
                  <th className="py-2 px-2.5 text-right border-r border-slate-200 dark:border-white/[0.05]">Fine (Cr)</th>
                  <th className="py-2 px-2.5 text-right border-r border-slate-200 dark:border-white/[0.05]">P.Rate (Cr)</th>
                  <th className="py-2 px-3 text-right border-r-2 border-slate-400 dark:border-white/[0.15]">Amount (Cr)</th>

                  {/* Debit Columns */}
                  <th className="py-2 px-2.5 border-r border-slate-200 dark:border-white/[0.05]">Date (Dr)</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 dark:border-white/[0.05]">Vou No. (Dr)</th>
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-white/[0.05]">A/c Name (Dr)</th>
                  <th className="py-2 px-2.5 text-right border-r border-slate-200 dark:border-white/[0.05]">Fine (Dr)</th>
                  <th className="py-2 px-2.5 text-right border-r border-slate-200 dark:border-white/[0.05]">S.Rate (Dr)</th>
                  <th className="py-2 px-3 text-right border-r-2 border-slate-400 dark:border-white/[0.15]">Amount (Dr)</th>

                  {/* Actions Column */}
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-slate-800 dark:text-slate-200 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        <span className="text-xs">Loading Silver Bullion register...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400 font-semibold text-xs">
                      No Records
                    </td>
                  </tr>
                ) : (
                  items.map((r) => {
                    const isRowCr = r.transaction_type === 'CR' || r.fine_weight > 0 || r.amount > 0;
                    const isRowDr = r.transaction_type === 'DR' || r.fine_weight_dr > 0 || r.amount_dr > 0;

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition"
                      >
                        {/* Credit Side */}
                        <td className="py-2 px-2.5 font-mono text-[11px] border-r border-slate-200 dark:border-white/[0.05]">
                          {r.date_cr || (isRowCr ? r.transaction_date : '—')}
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px] border-r border-slate-200 dark:border-white/[0.05]">
                          {r.vou_no_cr || (isRowCr ? r.voucher_no : '—')}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white max-w-[180px] truncate border-r border-slate-200 dark:border-white/[0.05]" title={r.ac_name_cr || r.party_name}>
                          {r.ac_name_cr || (isRowCr ? r.party_name : '—')}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono border-r border-slate-200 dark:border-white/[0.05]">
                          {((r.fine_cr ?? r.fine_weight) > 0) ? fmt(r.fine_cr ?? r.fine_weight, 3) : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono border-r border-slate-200 dark:border-white/[0.05]">
                          {((r.p_rate_cr ?? r.silver_rate) > 0) ? fmt(r.p_rate_cr ?? r.silver_rate, 2) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 border-r-2 border-slate-400 dark:border-white/[0.15]">
                          {((r.amount_cr ?? r.amount) > 0) ? `₹${fmtCurrency(r.amount_cr ?? r.amount)}` : '—'}
                        </td>

                        {/* Debit Side */}
                        <td className="py-2 px-2.5 font-mono text-[11px] border-r border-slate-200 dark:border-white/[0.05]">
                          {r.date_dr || (isRowDr ? r.transaction_date : '—')}
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px] border-r border-slate-200 dark:border-white/[0.05]">
                          {r.vou_no_dr || (isRowDr ? r.voucher_no : '—')}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white max-w-[180px] truncate border-r border-slate-200 dark:border-white/[0.05]" title={r.ac_name_dr || r.party_name}>
                          {r.ac_name_dr || (isRowDr ? r.party_name : '—')}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono border-r border-slate-200 dark:border-white/[0.05]">
                          {((r.fine_dr ?? r.fine_weight_dr) > 0) ? fmt(r.fine_dr ?? r.fine_weight_dr, 3) : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono border-r border-slate-200 dark:border-white/[0.05]">
                          {((r.s_rate_dr ?? r.silver_rate_dr) > 0) ? fmt(r.s_rate_dr ?? r.silver_rate_dr, 2) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 border-r-2 border-slate-400 dark:border-white/[0.15]">
                          {((r.amount_dr ?? r.amount_dr) > 0) ? `₹${fmtCurrency(r.amount_dr ?? r.amount_dr)}` : '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-400">
                            <button
                              type="button"
                              onClick={() => setViewingItem(r)}
                              className="p-1 hover:text-amber-500 transition cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditClick(r.id)}
                              className="p-1 hover:text-blue-500 transition cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id, r.party_name)}
                              className="p-1 hover:text-rose-500 transition cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* TABLE TOTALS ROW (Matches bottom totals of screenshot) */}
              {items.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-[#141923] font-bold border-t-2 border-slate-300 dark:border-white/[0.1] text-xs">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-white/[0.05]">
                      Cr Totals:
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-white/[0.05]">
                      {fmt(totals.total_cr_fine, 3)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono border-r border-slate-200 dark:border-white/[0.05]">
                      {fmt(totals.avg_cr_rate, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 border-r-2 border-slate-400 dark:border-white/[0.15]">
                      ₹{fmtCurrency(totals.total_cr_amount)}
                    </td>

                    <td colSpan={3} className="py-2.5 px-3 text-right font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-white/[0.05]">
                      Dr Totals:
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-rose-700 dark:text-rose-400 border-r border-slate-200 dark:border-white/[0.05]">
                      {fmt(totals.total_dr_fine, 3)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono border-r border-slate-200 dark:border-white/[0.05]">
                      {fmt(totals.avg_dr_rate, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700 dark:text-rose-400 border-r-2 border-slate-400 dark:border-white/[0.15]">
                      ₹{fmtCurrency(totals.total_dr_amount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
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

        {/* ========================================================= */}
        {/* BOTTOM SUMMARY & ACTIONS (Exact match to screenshot bottom)*/}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-3.5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Left Action Buttons: Print, PDF, WhatsApp & Export */}
            <div className="lg:col-span-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={exporting}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Print Report"
              >
                <Printer className="w-3.5 h-3.5 text-blue-500" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={exporting}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Download PDF"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={exporting}
                className="px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-amber-500" />}
                <span>Export</span>
              </button>
            </div>

            {/* Center Calculations: Day Difference & By Avg. Rate L/G */}
            <div className="lg:col-span-5 space-y-2 text-xs">
              {/* Day Difference Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-blue-700 dark:text-blue-400 w-32 shrink-0">
                  Day Difference
                </span>
                <div className="grid grid-cols-3 gap-1.5 flex-1 max-w-sm">
                  <div className="px-2 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                    {fmt(summary.day_difference_fine, 3)}
                  </div>
                  <div className="px-2 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                    {fmt(summary.day_difference_rate, 2)}
                  </div>
                  <div className="px-2 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                    {fmtCurrency(summary.day_difference_amount)}
                  </div>
                </div>
              </div>

              {/* By Avg.Rate L/G Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-blue-700 dark:text-blue-400 w-32 shrink-0">
                  By Avg.Rate L/G
                </span>
                <div className="grid grid-cols-3 gap-1.5 flex-1 max-w-sm">
                  <div className="col-span-1"></div>
                  <div className="px-2 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                    {fmt(summary.avg_rate_lg_rate, 2)}
                  </div>
                  <div className="px-2 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                    {fmtCurrency(summary.avg_rate_lg_amount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Closing Balance 4-Box Grid (Matches screenshot bottom right) */}
            <div className="lg:col-span-4 flex items-center justify-end gap-3">
              <span className="font-extrabold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                Closing Balance
              </span>
              <div className="grid grid-cols-2 gap-1.5 w-56">
                {/* Box 1 (Top Left) - Closing Fine */}
                <div className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-xs font-bold text-right text-rose-600 dark:text-rose-400">
                  {fmt(summary.closing_fine, 3)}
                </div>
                {/* Box 2 (Top Right) - Closing Amount */}
                <div className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-xs font-bold text-right text-rose-600 dark:text-rose-400">
                  {fmtCurrency(summary.closing_amount)}
                </div>
                {/* Box 3 (Bottom Left) - Closing Rate */}
                <div className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-xs font-bold text-right text-rose-600 dark:text-rose-400">
                  {fmt(summary.closing_rate, 2)}
                </div>
                {/* Box 4 (Bottom Right) */}
                <div className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#151922] font-mono text-xs font-bold text-right text-slate-700 dark:text-slate-300">
                  {summary.closing_val4 ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewingItem && (
        <SilverBullionDetailModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={(id) => handleEditClick(id)}
        />
      )}
    </div>
  );
};

export default SilverBullionListPage;
