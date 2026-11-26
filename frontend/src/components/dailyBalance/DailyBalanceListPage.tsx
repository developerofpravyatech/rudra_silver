import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  X,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Scale,
  AlertCircle,
  CheckCircle2,
  Calculator,
  PhoneCall,
  Calendar,
  Layers,
  TrendingUp,
  SlidersHorizontal,
  DollarSign,
  Bookmark,
  CheckSquare,
  Square,
  Printer,
  MessageCircle,
} from 'lucide-react';
import {
  DailyBalanceRecord,
  PaginatedDailyBalance,
  DailyBalanceTotals,
  DailyBalanceFilterParams,
  DailyBalanceFilterOptions,
} from '../../types';
import {
  fetchDailyBalanceList,
  deleteDailyBalance,
  fetchDailyBalanceFilterOptions,
  fetchDailyBalanceAll,
} from '../../services/api';
import { DailyBalanceViewModal } from './DailyBalanceViewModal';
import {
  printReport,
  downloadReportPdf,
  shareReportOnWhatsApp,
  ReportPdfOptions,
} from '../../utils/reportPdf';

interface DailyBalanceListPageProps {
  onBackToDashboard?: () => void;
  onNavigateAdd?: () => void;
  onNavigateEdit?: (id: number) => void;
}

export const DailyBalanceListPage: React.FC<DailyBalanceListPageProps> = ({
  onBackToDashboard,
  onNavigateAdd,
  onNavigateEdit,
}) => {
  const navigate = useNavigate();

  // Data states
  const [items, setItems] = useState<DailyBalanceRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totals, setTotals] = useState<DailyBalanceTotals>({
    total_gold_fine: 0,
    total_silver_fine: 0,
    total_amount: 0,
    total_diamond_weight: 0,
    total_stone_weight: 0,
    total_gold_gross_weight: 0,
    total_silver_gross_weight: 0,
  });

  // Filter options from database
  const [filterOptions, setFilterOptions] = useState<DailyBalanceFilterOptions>({
    cities: [],
    states: [],
    groups: [],
    locations: [],
    ref_bys: [],
    occupations: [],
    types: [],
  });

  // Row 1 - Date & Main filters
  const [balanceDate, setBalanceDate] = useState<string>('');
  const [openingDate, setOpeningDate] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [showAdvFilter, setShowAdvFilter] = useState<boolean>(true);

  // Row 2 - Additional filters
  const [selectedRefBy, setSelectedRefBy] = useState<string>('all');
  const [selectedOccupation, setSelectedOccupation] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');

  // Row 3 - Checkboxes
  const [withBalance, setWithBalance] = useState<boolean>(true);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [isAllRecords, setIsAllRecords] = useState<boolean>(false);
  const [hisabFinal, setHisabFinal] = useState<boolean>(false);
  const [withoutTransact, setWithoutTransact] = useState<boolean>(false);
  const [zeroBalance, setZeroBalance] = useState<boolean>(false);
  const [hisabPending, setHisabPending] = useState<boolean>(false);
  const [diaStnBalance, setDiaStnBalance] = useState<boolean>(false);
  const [highPriority, setHighPriority] = useState<boolean>(false);
  const [withLastSpDate, setWithLastSpDate] = useState<boolean>(false);

  // Row 4 - Toolbar state triggers
  const [groupWiseView, setGroupWiseView] = useState<boolean>(false);
  const [outstandingOnly, setOutstandingOnly] = useState<boolean>(false);
  const [agentHpOnly, setAgentHpOnly] = useState<boolean>(false);

  // Modals for Toolbar actions
  const [showConverterModal, setShowConverterModal] = useState<boolean>(false);
  const [showPayDateModal, setShowPayDateModal] = useState<boolean>(false);
  const [showCallLogModal, setShowCallLogModal] = useState<boolean>(false);
  const [showBalDateModal, setShowBalDateModal] = useState<boolean>(false);
  const [showAmountFilterModal, setShowAmountFilterModal] = useState<boolean>(false);

  // Specific date/amount modal filter values
  const [payFromDate, setPayFromDate] = useState<string>('');
  const [payToDate, setPayToDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Converter Modal States
  const [converterMetal, setConverterMetal] = useState<'SILVER' | 'GOLD'>('SILVER');
  const [converterWeight, setConverterWeight] = useState<string>('100');
  const [converterPurity, setConverterPurity] = useState<string>('92.5');
  const [converterRate, setConverterRate] = useState<string>('95');

  // Call Log Modal States
  const [callLogParty, setCallLogParty] = useState<string>('');
  const [callLogNotes, setCallLogNotes] = useState<string>('');
  const [callLogsList, setCallLogsList] = useState<Array<{ id: number; party: string; notes: string; time: string }>>([
    { id: 1, party: 'Manshukh Bhai Rathod', notes: 'Discussed pending silver fine balance settlement on next Friday.', time: '2026-11-24 10:30' },
    { id: 2, party: 'Radha Jewellers', notes: 'Payment receipt dispatched via RTGS.', time: '2026-11-23 15:45' },
  ]);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // UI status
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View & Delete Modals
  const [viewingItem, setViewingItem] = useState<DailyBalanceRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<DailyBalanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch filter options on mount
  useEffect(() => {
    fetchDailyBalanceFilterOptions()
      .then(setFilterOptions)
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  // Dependent dropdown: reload cities when selectedState changes
  useEffect(() => {
    if (selectedState && selectedState !== 'all' && selectedState !== 'ALL STATE') {
      fetchDailyBalanceFilterOptions(selectedState)
        .then((opts) => {
          setFilterOptions((prev) => ({ ...prev, cities: opts.cities }));
        })
        .catch((err) => console.error('Failed to load dependent cities:', err));
    }
  }, [selectedState]);

  // Load daily balance records from backend API
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const params: DailyBalanceFilterParams = {
        search: appliedSearch || undefined,
        date: balanceDate || undefined,
        opening_date: openingDate || undefined,
        from_date: payFromDate || undefined,
        to_date: payToDate || undefined,
        state: selectedState !== 'all' ? selectedState : undefined,
        city: selectedCity !== 'all' ? selectedCity : undefined,
        location: selectedLocation !== 'all' ? selectedLocation : undefined,
        group_id: selectedGroupId !== 'all' ? selectedGroupId : undefined,
        ref_by: selectedRefBy !== 'all' ? selectedRefBy : undefined,
        occupation: selectedOccupation !== 'all' ? selectedOccupation : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,

        // Checkbox flags (if isAllRecords is checked, ignore restrictive balance flags)
        with_balance: !isAllRecords && withBalance ? 1 : undefined,
        zero_balance: !isAllRecords && zeroBalance ? 1 : undefined,
        dia_stn_balance: !isAllRecords && diaStnBalance ? 1 : undefined,
        opening: !isAllRecords && isOpening ? 1 : undefined,
        hisab_final: !isAllRecords && hisabFinal ? 1 : undefined,
        hisab_pending: !isAllRecords && hisabPending ? 1 : undefined,
        without_transact: !isAllRecords && withoutTransact ? 1 : undefined,
        high_priority: !isAllRecords && highPriority ? 1 : undefined,
        with_last_sp_date: !isAllRecords && withLastSpDate ? 1 : undefined,

        // Toolbar action filter flags
        outstanding_only: outstandingOnly ? 1 : undefined,
        agent_hp_only: agentHpOnly ? 1 : undefined,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,

        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: pageSize,
      };

      const res: PaginatedDailyBalance = await fetchDailyBalanceList(params);
      setItems(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
      if (res.totals) {
        setTotals(res.totals);
      }
    } catch (err: any) {
      setApiError(err.message || 'Unable to connect to Daily Balance API.');
    } finally {
      setLoading(false);
    }
  }, [
    appliedSearch,
    balanceDate,
    openingDate,
    payFromDate,
    payToDate,
    selectedState,
    selectedCity,
    selectedLocation,
    selectedGroupId,
    selectedRefBy,
    selectedOccupation,
    selectedType,
    withBalance,
    zeroBalance,
    diaStnBalance,
    isOpening,
    isAllRecords,
    hisabFinal,
    hisabPending,
    withoutTransact,
    highPriority,
    withLastSpDate,
    outstandingOnly,
    agentHpOnly,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toast notifier
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Search submission
  const handleApplySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchQuery.trim());
  };

  // Clear / Reset All filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setBalanceDate('');
    setOpeningDate('');
    setSelectedState('all');
    setSelectedCity('all');
    setSelectedLocation('all');
    setSelectedGroupId('all');
    setSelectedRefBy('all');
    setSelectedOccupation('all');
    setSelectedType('all');
    setWithBalance(false);
    setIsOpening(false);
    setIsAllRecords(false);
    setHisabFinal(false);
    setWithoutTransact(false);
    setZeroBalance(false);
    setHisabPending(false);
    setDiaStnBalance(false);
    setHighPriority(false);
    setWithLastSpDate(false);
    setOutstandingOnly(false);
    setAgentHpOnly(false);
    setPayFromDate('');
    setPayToDate('');
    setMinAmount('');
    setMaxAmount('');
    setGroupWiseView(false);
    setSortBy('id');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  // "All Records" button: clear restrictions and load all
  const handleAllRecords = () => {
    setIsAllRecords(true);
    setWithBalance(false);
    setZeroBalance(false);
    setDiaStnBalance(false);
    setIsOpening(false);
    setHisabFinal(false);
    setHisabPending(false);
    setWithoutTransact(false);
    setHighPriority(false);
    setWithLastSpDate(false);
    setOutstandingOnly(false);
    setAgentHpOnly(false);
    setCurrentPage(1);
  };

  // Group-wise records calculation for Group Wise view
  const groupedItems = useMemo(() => {
    if (!groupWiseView) return null;
    const map = new Map<string, DailyBalanceRecord[]>();
    items.forEach((item) => {
      const gName = (item as any).group_name || 'General Group';
      if (!map.has(gName)) map.set(gName, []);
      map.get(gName)!.push(item);
    });
    return Array.from(map.entries()).map(([group, records]) => {
      const subTotalAmount = records.reduce((s, r) => s + (r.amount || 0), 0);
      const subTotalGold = records.reduce((s, r) => s + (r.gold_fine || 0), 0);
      const subTotalSilver = records.reduce((s, r) => s + (r.silver_fine || 0), 0);
      return { group, records, subTotalAmount, subTotalGold, subTotalSilver };
    });
  }, [items, groupWiseView]);

  // Format numbers helper
  const formatNum = (val: number | string | undefined, decimals = 3) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.000' : n.toFixed(decimals);
  };

  // Helper to compile current filter parameters
  const getCurrentFilterParams = (): DailyBalanceFilterParams => ({
    search: appliedSearch || undefined,
    date: balanceDate || undefined,
    opening_date: openingDate || undefined,
    from_date: payFromDate || undefined,
    to_date: payToDate || undefined,
    state: selectedState !== 'all' ? selectedState : undefined,
    city: selectedCity !== 'all' ? selectedCity : undefined,
    location: selectedLocation !== 'all' ? selectedLocation : undefined,
    group_id: selectedGroupId !== 'all' ? selectedGroupId : undefined,
    ref_by: selectedRefBy !== 'all' ? selectedRefBy : undefined,
    occupation: selectedOccupation !== 'all' ? selectedOccupation : undefined,
    type: selectedType !== 'all' ? selectedType : undefined,

    with_balance: !isAllRecords && withBalance ? 1 : undefined,
    zero_balance: !isAllRecords && zeroBalance ? 1 : undefined,
    dia_stn_balance: !isAllRecords && diaStnBalance ? 1 : undefined,
    opening: !isAllRecords && isOpening ? 1 : undefined,
    hisab_final: !isAllRecords && hisabFinal ? 1 : undefined,
    hisab_pending: !isAllRecords && hisabPending ? 1 : undefined,
    without_transact: !isAllRecords && withoutTransact ? 1 : undefined,
    high_priority: !isAllRecords && highPriority ? 1 : undefined,
    with_last_sp_date: !isAllRecords && withLastSpDate ? 1 : undefined,

    outstanding_only: outstandingOnly ? 1 : undefined,
    agent_hp_only: agentHpOnly ? 1 : undefined,
    min_amount: minAmount ? parseFloat(minAmount) : undefined,
    max_amount: maxAmount ? parseFloat(maxAmount) : undefined,

    sort_by: sortBy,
    sort_order: sortOrder,
  });

  // Build PDF Report Options for Print, PDF Download, and WhatsApp Sharing
  const getDailyBalanceReportOptions = (records: DailyBalanceRecord[]): ReportPdfOptions => {
    const today = new Date().toISOString().split('T')[0];
    const groupLabel = selectedGroupId === 'all'
      ? 'All'
      : (filterOptions.groups.find((g) => String(g.id) === selectedGroupId)?.name || selectedGroupId);

    return {
      title: 'Daily Balance Report',
      subtitle: 'Rudra Silver Jewellery ERP',
      filename: `Daily_Balance_${today}.pdf`,
      filters: [
        { label: 'Date', value: balanceDate || 'All' },
        { label: 'State', value: selectedState === 'all' ? 'All' : selectedState },
        { label: 'City', value: selectedCity === 'all' ? 'All' : selectedCity },
        { label: 'Group', value: groupLabel },
        { label: 'Search', value: appliedSearch || 'All' },
        { label: 'Total Records', value: String(records.length) },
      ],
      columns: [
        { header: 'Bal Date', dataKey: 'balance_date', align: 'center' },
        { header: 'Account Name', dataKey: 'account_name', align: 'left' },
        { header: 'City', dataKey: 'city', align: 'left' },
        { header: 'Group', dataKey: 'group_name', align: 'left' },
        { header: 'Mobile', dataKey: 'mobile', align: 'center' },
        { header: 'Gold Fine', dataKey: 'gold_fine', align: 'right' },
        { header: 'Sil. Fine', dataKey: 'silver_fine', align: 'right' },
        { header: 'Gold Gr.Wt', dataKey: 'gold_gross_weight', align: 'right' },
        { header: 'Sil Gr.Wt', dataKey: 'silver_gross_weight', align: 'right' },
        { header: 'Dia Wt', dataKey: 'diamond_weight', align: 'right' },
        { header: 'Stn Wt', dataKey: 'stone_weight', align: 'right' },
        { header: 'Amount (₹)', dataKey: 'amount', align: 'right' },
      ],
      data: records.map((r) => ({
        balance_date: r.balance_date || '—',
        account_name: r.account_name || '—',
        city: r.city || '—',
        group_name: (r as any).group_name || '—',
        mobile: r.mobile || r.phone || '—',
        gold_fine: formatNum(r.gold_fine, 3),
        silver_fine: formatNum(r.silver_fine, 3),
        gold_gross_weight: formatNum(r.gold_gross_weight, 3),
        silver_gross_weight: formatNum(r.silver_gross_weight, 3),
        diamond_weight: formatNum(r.diamond_weight, 3),
        stone_weight: formatNum(r.stone_weight, 3),
        amount: formatNum(r.amount, 2),
      })),
      totals: {
        balance_date: '',
        account_name: 'GRAND TOTAL',
        city: '',
        group_name: '',
        mobile: '',
        gold_fine: formatNum(totals.total_gold_fine, 3),
        silver_fine: formatNum(totals.total_silver_fine, 3),
        gold_gross_weight: formatNum(totals.total_gold_gross_weight, 3),
        silver_gross_weight: formatNum(totals.total_silver_gross_weight, 3),
        diamond_weight: formatNum(totals.total_diamond_weight, 3),
        stone_weight: formatNum(totals.total_stone_weight, 3),
        amount: `₹${formatNum(totals.total_amount, 2)}`,
      },
      orientation: 'landscape',
    };
  };

  // 1. Print Handler: Opens formatted print preview
  const handlePrint = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchDailyBalanceAll(getCurrentFilterParams());
      if (!allRecords || allRecords.length === 0) {
        showToast('No daily balance data available to print.', 'error');
        return;
      }
      await printReport(getDailyBalanceReportOptions(allRecords));
    } catch (err: any) {
      showToast(err.message || 'Failed to print report.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // 2. Download PDF Handler: Triggers direct PDF file download
  const handleDownloadPDF = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchDailyBalanceAll(getCurrentFilterParams());
      if (!allRecords || allRecords.length === 0) {
        showToast('No daily balance data available to export as PDF.', 'error');
        return;
      }
      await downloadReportPdf(getDailyBalanceReportOptions(allRecords));
    } catch (err: any) {
      showToast(err.message || 'Failed to download PDF.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // 3. Share on WhatsApp Handler: Native Web Share API or WhatsApp Web prefilled message
  const handleShareWhatsApp = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchDailyBalanceAll(getCurrentFilterParams());
      if (!allRecords || allRecords.length === 0) {
        showToast('No daily balance data available to share on WhatsApp.', 'error');
        return;
      }
      await shareReportOnWhatsApp(getDailyBalanceReportOptions(allRecords));
    } catch (err: any) {
      showToast(err.message || 'Failed to share on WhatsApp.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-3 text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                : 'bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="p-3 sm:p-5 lg:p-6 max-w-[1900px] mx-auto w-full space-y-3.5">
        {/* Header Card */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-xs shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Daily Balance
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5 font-medium">
                <span className="hover:text-amber-500 cursor-pointer" onClick={onBackToDashboard}>
                  Dashboard
                </span>
                <span>/</span>
                <span>Reports</span>
                <span>/</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Daily Balance Sheet</span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1.5 bg-white dark:bg-[#141824] cursor-pointer disabled:opacity-50"
              title="Print Daily Balance Report (A4 Landscape, Repeating Headers)"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1.5 bg-white dark:bg-[#141824] cursor-pointer disabled:opacity-50"
              title="Download Daily Balance Report PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-600/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/20 cursor-pointer disabled:opacity-50"
              title="Share Daily Balance Report on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onNavigateAdd}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-105 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Daily Balance</span>
            </button>
          </div>
        </div>

        {/* ADVANCED FILTER & TOOLBAR CARD */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-4 space-y-3">
          {/* ROW 1: Date & Main Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 items-end">
            {/* Balance Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={balanceDate}
                onChange={(e) => {
                  setBalanceDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Opening Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Opening Date
              </label>
              <input
                type="date"
                value={openingDate}
                onChange={(e) => {
                  setOpeningDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* State Wise */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                State
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('all');
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">ALL STATE</option>
                  {filterOptions.states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* City Wise (Dependent on State) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                City
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">ALL CITY</option>
                  {filterOptions.cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Location
              </label>
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">ALL</option>
                  {(filterOptions.locations || []).map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Group */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Group
              </label>
              <div className="relative">
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">ALL</option>
                  {filterOptions.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Adv. Filter Button */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvFilter((v) => !v)}
                className={`w-full py-1.5 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  showAdvFilter
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-slate-300 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Adv. Filter</span>
              </button>
            </div>
          </div>

          {/* ROW 2: Additional Dropdown Filters & Search */}
          {showAdvFilter && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 items-end pt-1 border-t border-slate-100 dark:border-white/[0.04]">
              {/* Ref By */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ref By
                </label>
                <div className="relative">
                  <select
                    value={selectedRefBy}
                    onChange={(e) => {
                      setSelectedRefBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">ALL</option>
                    {(filterOptions.ref_bys || []).map((ref) => (
                      <option key={ref} value={ref}>
                        {ref}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Occupation
                </label>
                <div className="relative">
                  <select
                    value={selectedOccupation}
                    onChange={(e) => {
                      setSelectedOccupation(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">ALL</option>
                    {(filterOptions.occupations || []).map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Type
                </label>
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Normal</option>
                    {(filterOptions.types || ['Normal', 'Customer', 'Supplier', 'Karigar', 'Broker', 'Bank', 'Cash', 'Expense']).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Search with # field */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Search (# A/c, City, Mobile)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">#</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
                    placeholder="Enter name, phone, city..."
                    className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Action Buttons: Search + Filter */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleApplySearch}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySearch()}
                  className="py-1.5 px-3 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
                  title="Apply Filter"
                >
                  Filter
                </button>
              </div>

              {/* Clear / All Records */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Clear all filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
                <button
                  type="button"
                  onClick={handleAllRecords}
                  className="flex-1 py-1.5 px-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-xs transition cursor-pointer"
                  title="Show all unfiltered records"
                >
                  All Records
                </button>
              </div>
            </div>
          )}

          {/* ROW 3: Checkbox Filters (All 10 from Screenshot 2) */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 text-xs">
              {/* With Balance */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={withBalance}
                  onChange={(e) => {
                    setWithBalance(e.target.checked);
                    setIsAllRecords(false);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">With Balance</span>
              </label>

              {/* Opening */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={isOpening}
                  onChange={(e) => {
                    setIsOpening(e.target.checked);
                    setIsAllRecords(false);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">Opening</span>
              </label>

              {/* All */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={isAllRecords}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleAllRecords();
                    } else {
                      setIsAllRecords(false);
                    }
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">All</span>
              </label>

              {/* Hisab Final */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={hisabFinal}
                  onChange={(e) => {
                    setHisabFinal(e.target.checked);
                    setIsAllRecords(false);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">Hisab Final</span>
              </label>

              {/* Without Transact */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={withoutTransact}
                  onChange={(e) => {
                    setWithoutTransact(e.target.checked);
                    setIsAllRecords(false);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">Without Transact</span>
              </label>

              {/* Zero Balance */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={zeroBalance}
                  onChange={(e) => {
                    setZeroBalance(e.target.checked);
                    setIsAllRecords(false);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">Zero Balance</span>
              </label>

              {/* Hisab Pending */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={hisabPending}
                  onChange={(e) => {
                    setHisabPending(e.target.checked);
                    setIsAllRecords(false);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">Hisab Pending</span>
              </label>

              {/* Dia/Stn Balance */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={diaStnBalance}
                  onChange={(e) => {
                    setDiaStnBalance(e.target.checked);
                    setIsAllRecords(false);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">Dia/Stn Balance</span>
              </label>

              {/* High Priority */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={highPriority}
                  onChange={(e) => {
                    setHighPriority(e.target.checked);
                    setIsAllRecords(false);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">High Priority</span>
              </label>

              {/* With Last S/P/Hisab Date */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400">
                <input
                  type="checkbox"
                  checked={withLastSpDate}
                  onChange={(e) => {
                    setWithLastSpDate(e.target.checked);
                    setIsAllRecords(false);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium">With Last S/P/Hisab</span>
              </label>
            </div>
          </div>

          {/* ROW 4: Action Toolbar (All 8 Buttons from Screenshot 1) */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04]">
            <div className="flex items-center flex-wrap gap-2">
              {/* 1. Group Wise */}
              <button
                type="button"
                onClick={() => setGroupWiseView((v) => !v)}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  groupWiseView
                    ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-xs'
                    : 'border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#141824] text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
                title="Toggle Group Wise View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Group Wise</span>
              </button>

              {/* 2. OutStanding */}
              <button
                type="button"
                onClick={() => {
                  setOutstandingOnly((v) => !v);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  outstandingOnly
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                    : 'border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#141824] text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                }`}
                title="Filter positive outstanding balances"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>OutStanding</span>
              </button>

              {/* 3. Converter */}
              <button
                type="button"
                onClick={() => setShowConverterModal(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#141824] hover:border-amber-400 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Open fine weight & currency converter"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-500" />
                <span>Converter</span>
              </button>

              {/* 4. Pay/SP Date */}
              <button
                type="button"
                onClick={() => setShowPayDateModal(true)}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  payFromDate || payToDate
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#141824] text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
                title="Payment / Settlement date filter"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Pay/SP Date {payFromDate || payToDate ? '•' : ''}</span>
              </button>

              {/* 5. Agent/HP */}
              <button
                type="button"
                onClick={() => {
                  setAgentHpOnly((v) => !v);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  agentHpOnly
                    ? 'border-purple-500 bg-purple-500 text-white shadow-xs'
                    : 'border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#141824] text-slate-700 dark:text-slate-300 hover:border-purple-400'
                }`}
                title="Filter Agent / High Priority accounts"
              >
                <Bookmark className="w-3.5 h-3.5 text-purple-500" />
                <span>Agent/HP</span>
              </button>

              {/* 6. Call Log */}
              <button
                type="button"
                onClick={() => setShowCallLogModal(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#141824] hover:border-amber-400 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Customer follow-up call logs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
                <span>Call Log</span>
              </button>

              {/* 7. Bal Date */}
              <button
                type="button"
                onClick={() => setShowBalDateModal(true)}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  balanceDate
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#141824] text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
                title="Pick single balance date"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Bal Date {balanceDate ? `(${balanceDate})` : ''}</span>
              </button>

              {/* 8. Amount Filter */}
              <button
                type="button"
                onClick={() => setShowAmountFilterModal(true)}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  minAmount || maxAmount
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#141824] text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
                title="Min / Max amount range filter"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>Amount Filter {minAmount || maxAmount ? '•' : ''}</span>
              </button>
            </div>
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs overflow-hidden">
          {/* Table Header Info Row */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>Showing records {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}</span>
              {groupWiseView && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                  Group-Wise Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141824] text-xs font-semibold focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table Scroll Area */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#121622] text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">A/c Name</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Group</th>
                  <th className="py-2.5 px-3">Mobile / Phone</th>
                  <th className="py-2.5 px-3">Bal. Date</th>
                  <th className="py-2.5 px-3">Pay Date</th>
                  <th className="py-2.5 px-3 text-right">Gold Fine</th>
                  <th className="py-2.5 px-3 text-right">Sil. Fine</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-right">Dia. Wt.</th>
                  <th className="py-2.5 px-3 text-right">Stn. Wt.</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                      <span>Loading Daily Balance records...</span>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      No matching records found. Try adjusting or clearing your filters.
                    </td>
                  </tr>
                ) : groupWiseView && groupedItems ? (
                  /* GROUP-WISE ACCORDION VIEW */
                  groupedItems.map((grp) => (
                    <React.Fragment key={grp.group}>
                      <tr className="bg-amber-500/10 dark:bg-amber-500/5 font-bold text-amber-700 dark:text-amber-300">
                        <td colSpan={6} className="py-2 px-3">
                          📁 Group: {grp.group} ({grp.records.length} accounts)
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{formatNum(grp.subTotalGold, 3)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatNum(grp.subTotalSilver, 3)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">₹{formatNum(grp.subTotalAmount, 2)}</td>
                        <td colSpan={3}></td>
                      </tr>
                      {grp.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 pl-6">
                            {r.account_name}
                          </td>
                          <td className="py-2 px-3">{r.city || '—'}</td>
                          <td className="py-2 px-3">{grp.group}</td>
                          <td className="py-2 px-3 font-mono">{r.mobile || r.phone || '—'}</td>
                          <td className="py-2 px-3">{r.balance_date || '—'}</td>
                          <td className="py-2 px-3">{r.payment_date || '—'}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatNum(r.gold_fine, 3)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatNum(r.silver_fine, 3)}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">₹{formatNum(r.amount, 2)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatNum(r.diamond_weight, 3)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatNum(r.stone_weight, 3)}</td>
                          <td className="py-2 px-3 text-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setViewingItem(r)}
                              className="p-1 text-slate-400 hover:text-amber-500"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {onNavigateEdit && (
                              <button
                                type="button"
                                onClick={() => onNavigateEdit(r.id)}
                                className="p-1 text-slate-400 hover:text-blue-500"
                                title="Edit Record"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  /* STANDARD FLAT LIST */
                  items.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {r.account_name}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.city || '—'}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{(r as any).group_name || 'General'}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{r.mobile || r.phone || '—'}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.balance_date || '—'}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.payment_date || '—'}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatNum(r.gold_fine, 3)}</td>
                      <td className={`py-2 px-3 text-right font-mono ${r.silver_fine < 0 ? 'text-rose-500' : ''}`}>
                        {formatNum(r.silver_fine, 3)}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-semibold ${r.amount < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-slate-100'}`}>
                        ₹{formatNum(r.amount, 2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{formatNum(r.diamond_weight, 3)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatNum(r.stone_weight, 3)}</td>
                      <td className="py-2 px-3 text-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setViewingItem(r)}
                          className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {onNavigateEdit && (
                          <button
                            type="button"
                            onClick={() => onNavigateEdit(r.id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeletingItem(r)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* GRAND TOTALS FOOTER */}
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-white/[0.1] bg-amber-500/10 dark:bg-amber-500/5 font-bold text-slate-900 dark:text-white">
                  <td colSpan={6} className="py-3 px-3 uppercase tracking-wider text-xs">
                    Grand Totals (Across {totalRecords} records)
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{formatNum(totals.total_gold_fine, 3)}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatNum(totals.total_silver_fine, 3)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    ₹{formatNum(totals.total_amount, 2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{formatNum(totals.total_diamond_weight, 3)}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatNum(totals.total_stone_weight, 3)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ROW 5: Pagination Controls */}
          <div className="px-5 py-3 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold">{currentPage}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Converter Modal */}
      {showConverterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151e] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-500" />
                <span>Fine Metal &amp; Rate Converter</span>
              </h3>
              <button onClick={() => setShowConverterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Metal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConverterMetal('SILVER');
                      setConverterPurity('92.5');
                      setConverterRate('95');
                    }}
                    className={`py-1.5 rounded-xl font-bold border transition ${
                      converterMetal === 'SILVER'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-slate-200 dark:border-white/[0.1]'
                    }`}
                  >
                    Silver
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConverterMetal('GOLD');
                      setConverterPurity('91.6');
                      setConverterRate('7800');
                    }}
                    className={`py-1.5 rounded-xl font-bold border transition ${
                      converterMetal === 'GOLD'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-slate-200 dark:border-white/[0.1]'
                    }`}
                  >
                    Gold
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Gross Weight (Grams)</label>
                <input
                  type="number"
                  value={converterWeight}
                  onChange={(e) => setConverterWeight(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28] font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Purity (%)</label>
                  <input
                    type="number"
                    value={converterPurity}
                    onChange={(e) => setConverterPurity(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Rate (₹/gm)</label>
                  <input
                    type="number"
                    value={converterRate}
                    onChange={(e) => setConverterRate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28] font-mono text-xs"
                  />
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fine Weight:</span>
                  <span className="font-bold font-mono">
                    {((parseFloat(converterWeight || '0') * parseFloat(converterPurity || '0')) / 100).toFixed(3)} gm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calculated Value:</span>
                  <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                    ₹{(
                      ((parseFloat(converterWeight || '0') * parseFloat(converterPurity || '0')) / 100) *
                      parseFloat(converterRate || '0')
                    ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowConverterModal(false)}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Close Converter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Pay/SP Date Modal */}
      {showPayDateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151e] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Payment / SP Date Range</span>
              </h3>
              <button onClick={() => setShowPayDateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Payment Date From</label>
                <input
                  type="date"
                  value={payFromDate}
                  onChange={(e) => setPayFromDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28] text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Payment Date To</label>
                <input
                  type="date"
                  value={payToDate}
                  onChange={(e) => setPayToDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28] text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPayFromDate('');
                  setPayToDate('');
                  setShowPayDateModal(false);
                  setCurrentPage(1);
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] text-xs"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPayDateModal(false);
                  setCurrentPage(1);
                }}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Call Log Modal */}
      {showCallLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151e] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-500" />
                <span>Customer Communication &amp; Call Logs</span>
              </h3>
              <button onClick={() => setShowCallLogModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Logs List */}
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {callLogsList.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#181d28] border border-slate-200 dark:border-white/[0.06]">
                  <div className="flex justify-between items-center mb-1 font-semibold">
                    <span>{log.party}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{log.notes}</p>
                </div>
              ))}
            </div>

            {/* Add New Log */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <label className="font-semibold block">Add Interaction Note</label>
              <input
                type="text"
                value={callLogParty}
                onChange={(e) => setCallLogParty(e.target.value)}
                placeholder="Party / Customer Name"
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28]"
              />
              <textarea
                value={callLogNotes}
                onChange={(e) => setCallLogNotes(e.target.value)}
                placeholder="Call notes, follow-up remarks..."
                rows={2}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28]"
              />
              <button
                type="button"
                onClick={() => {
                  if (callLogParty && callLogNotes) {
                    setCallLogsList((prev) => [
                      {
                        id: Date.now(),
                        party: callLogParty,
                        notes: callLogNotes,
                        time: new Date().toISOString().replace('T', ' ').substring(0, 16),
                      },
                      ...prev,
                    ]);
                    setCallLogParty('');
                    setCallLogNotes('');
                    showToast('Call note logged successfully.');
                  }
                }}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Save Call Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Bal Date Modal */}
      {showBalDateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151e] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Filter by Balance Date</span>
              </h3>
              <button onClick={() => setShowBalDateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <input
                type="date"
                value={balanceDate}
                onChange={(e) => setBalanceDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28] text-xs font-semibold"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBalanceDate('');
                  setShowBalDateModal(false);
                  setCurrentPage(1);
                }}
                className="flex-1 py-1.5 rounded-xl border text-xs"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBalDateModal(false);
                  setCurrentPage(1);
                }}
                className="flex-1 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Amount Filter Modal */}
      {showAmountFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151e] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Amount Range Filter</span>
              </h3>
              <button onClick={() => setShowAmountFilterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Minimum Amount (₹)</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28] font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Maximum Amount (₹)</label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#181d28] font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMinAmount('');
                  setMaxAmount('');
                  setShowAmountFilterModal(false);
                  setCurrentPage(1);
                }}
                className="flex-1 py-2 rounded-xl border text-xs"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAmountFilterModal(false);
                  setCurrentPage(1);
                }}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {viewingItem && (
        <DailyBalanceViewModal
          record={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={onNavigateEdit ? () => onNavigateEdit(viewingItem.id) : undefined}
        />
      )}

      {/* Delete Item Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151e] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Delete Daily Balance Record?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the daily balance entry for{' '}
              <strong className="text-slate-800 dark:text-slate-200">{deletingItem.account_name}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteDailyBalance(deletingItem.id);
                    showToast('Record deleted successfully.');
                    setDeletingItem(null);
                    loadData();
                  } catch (err: any) {
                    showToast(err.message || 'Failed to delete record.', 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
