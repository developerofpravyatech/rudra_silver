import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  X,
  Loader2,
  ShoppingBag,
  Printer,
  FileText,
  MessageCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  SaleRegisterRecord,
  SaleRegisterTotals,
  SaleRegisterFilterParams,
  SaleRegisterFilterOptions,
  SaleRegisterSummary,
} from '../../types';
import {
  fetchSaleRegisterList,
  deleteSaleRegister,
  fetchSaleRegisterFilterOptions,
  fetchSaleRegisterExport,
  fetchSaleRegisterSummary,
} from '../../services/api';
import { showSuccessAlert, showErrorAlert, showDeleteConfirmDialog } from '../../utils/alert';
import { printReport, downloadReportPdf, shareReportOnWhatsApp, ReportPdfOptions } from '../../utils/reportPdf';
import { SaleRegisterDetailModal } from './SaleRegisterDetailModal';
import { SaleSummaryPanel } from './SaleSummaryPanel';

interface SaleRegisterListPageProps {
  onBackToDashboard?: () => void;
  onNavigateAdd?: () => void;
  onNavigateEdit?: (id: number) => void;
}

export const SaleRegisterListPage: React.FC<SaleRegisterListPageProps> = ({
  onNavigateAdd,
  onNavigateEdit,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sale Register | Rudra Silver';
  }, []);

  const handleAddClick = () => {
    if (onNavigateAdd) onNavigateAdd();
    else navigate('/sale-register/add');
  };

  const handleEditClick = (id: number) => {
    if (onNavigateEdit) onNavigateEdit(id);
    else navigate(`/sale-register/edit/${id}`);
  };

  // Data state
  const [items, setItems] = useState<SaleRegisterRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totals, setTotals] = useState<SaleRegisterTotals>({
    weight: 0,
    pieces: 0,
    sale_value: 0,
    return_weight: 0,
    return_pieces: 0,
    sale_return_value: 0,
    gross_weight: 0,
    net_weight: 0,
    diamond_weight: 0,
    stone_weight: 0,
    tags: 0,
    metal_pieces: 0,
    gold_weight: 0,
    silver_weight: 0,
    amount: 0,
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState<SaleRegisterFilterOptions>({
    parties: [],
    account_groups: [],
    item_groups: [],
    item_codes: [],
    stamps: [],
    branches: [],
    item_types: [],
    categories: [],
    series: [],
    qualities: [],
    voucher_types: [],
  });

  // Filter states
  const [showOtherFilters, setShowOtherFilters] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [partyName, setPartyName] = useState<string>('all');
  const [accountGroup, setAccountGroup] = useState<string>('all');
  const [itemGroup, setItemGroup] = useState<string>('all');
  const [itemCode, setItemCode] = useState<string>('all');
  const [stamp, setStamp] = useState<string>('all');
  const [branchName, setBranchName] = useState<string>('all');
  const [itemType, setItemType] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [series, setSeries] = useState<string>('all');
  const [quality, setQuality] = useState<string>('all');
  const [voucherType, setVoucherType] = useState<string>('all');
  const [registerType, setRegisterType] = useState<string>('ALL');

  // Checkboxes
  const [isSold, setIsSold] = useState<boolean>(false);
  const [inStock, setInStock] = useState<boolean>(false);
  const [netValue, setNetValue] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isExcluded, setIsExcluded] = useState<boolean>(false);
  const [includeMetal, setIncludeMetal] = useState<boolean>(false);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('voucher_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [viewingRecord, setViewingRecord] = useState<SaleRegisterRecord | null>(null);

  // Independent Sale Register  State
  const [summaryData, setSummaryData] = useState<SaleRegisterSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchSaleRegisterFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  const buildFilterParams = useCallback((): SaleRegisterFilterParams => {
    const params: SaleRegisterFilterParams = {
      page: currentPage,
      limit: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (appliedSearch) params.search = appliedSearch;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (partyName !== 'all') params.party_name = partyName;
    if (accountGroup !== 'all') params.account_group = accountGroup;
    if (itemGroup !== 'all') params.item_group = itemGroup;
    if (itemCode !== 'all') params.item_code = itemCode;
    if (stamp !== 'all') params.stamp = stamp;
    if (branchName !== 'all') params.branch_name = branchName;
    if (itemType !== 'all') params.item_type = itemType;
    if (category !== 'all') params.category = category;
    if (series !== 'all') params.series = series;
    if (quality !== 'all') params.quality = quality;
    if (voucherType !== 'all') params.voucher_type = voucherType;
    if (registerType !== 'ALL') params.register_type = registerType;

    if (isSold) params.is_sold = 1;
    if (inStock) params.in_stock = 1;
    if (netValue) params.net_value = 1;
    if (isApproved) params.is_approved = 1;
    if (isExcluded) params.is_excluded = 1;
    if (includeMetal) params.include_metal = 1;

    return params;
  }, [
    currentPage, pageSize, sortBy, sortOrder, appliedSearch,
    fromDate, toDate, partyName, accountGroup, itemGroup,
    itemCode, stamp, branchName, itemType, category, series,
    quality, voucherType, registerType,
    isSold, inStock, netValue, isApproved, isExcluded, includeMetal,
  ]);

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      // Construct filter params excluding pagination/sorting
      const params: SaleRegisterFilterParams = {};
      if (appliedSearch) params.search = appliedSearch;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (partyName !== 'all') params.party_name = partyName;
      if (accountGroup !== 'all') params.account_group = accountGroup;
      if (itemGroup !== 'all') params.item_group = itemGroup;
      if (itemCode !== 'all') params.item_code = itemCode;
      if (stamp !== 'all') params.stamp = stamp;
      if (branchName !== 'all') params.branch_name = branchName;
      if (itemType !== 'all') params.item_type = itemType;
      if (category !== 'all') params.category = category;
      if (series !== 'all') params.series = series;
      if (quality !== 'all') params.quality = quality;
      if (voucherType !== 'all') params.voucher_type = voucherType;
      if (registerType !== 'ALL') params.register_type = registerType;

      if (isSold) params.is_sold = 1;
      if (inStock) params.in_stock = 1;
      if (netValue) params.net_value = 1;
      if (isApproved) params.is_approved = 1;
      if (isExcluded) params.is_excluded = 1;
      if (includeMetal) params.include_metal = 1;

      const res = await fetchSaleRegisterSummary(params);
      setSummaryData(res);
    } catch (err: any) {
      console.error('Failed to load Sale Register :', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [
    appliedSearch, fromDate, toDate, partyName, accountGroup, itemGroup,
    itemCode, stamp, branchName, itemType, category, series,
    quality, voucherType, registerType,
    isSold, inStock, netValue, isApproved, isExcluded, includeMetal,
  ]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchSaleRegisterList(buildFilterParams());
      setItems(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
      if (res.totals) setTotals(res.totals);
    } catch (err: any) {
      console.error('Failed to load Sale Register:', err);
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams]);

  useEffect(() => {
    loadData();
    loadSummary();
  }, [loadData, loadSummary]);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchInput);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setFromDate('');
    setToDate('');
    setPartyName('all');
    setAccountGroup('all');
    setItemGroup('all');
    setItemCode('all');
    setStamp('all');
    setBranchName('all');
    setItemType('all');
    setCategory('all');
    setSeries('all');
    setQuality('all');
    setVoucherType('all');
    setRegisterType('ALL');
    setIsSold(false);
    setInStock(false);
    setNetValue(false);
    setIsApproved(false);
    setIsExcluded(false);
    setIncludeMetal(false);
    setCurrentPage(1);
  };

  const handleDelete = async (id: number, label: string) => {
    const confirmed = await showDeleteConfirmDialog(
      `Are you sure you want to delete Sale Entry "${label}"?`,
      'Confirm Delete'
    );
    if (!confirmed) return;

    try {
      await deleteSaleRegister(id);
      await showSuccessAlert('Sale Register entry deleted successfully.', 'Deleted!');
      loadData();
      loadSummary();
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to delete entry.');
    }
  };

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const fmt = (val: number | undefined, decimals = 3) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.000' : n.toFixed(decimals);
  };

  const fmtCurr = (val: number | undefined) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.00' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const buildReportOptions = async (): Promise<ReportPdfOptions> => {
    const allRows = await fetchSaleRegisterExport(buildFilterParams());
    return {
      title: 'Sale Register Report',
      filename: `Sale_Register_${new Date().toISOString().split('T')[0]}.pdf`,
      orientation: 'landscape',
      filters: [
        { label: 'From', value: fromDate },
        { label: 'To', value: toDate },
        { label: 'Party', value: partyName },
        { label: 'Register Type', value: registerType },
        { label: 'Search', value: appliedSearch },
      ],
      columns: [
        { header: 'Particular', dataKey: 'particular', align: 'left' },
        { header: 'Item Name', dataKey: 'item_name', align: 'left' },
        { header: 'Weight', dataKey: 'weight_fmt', align: 'right' },
        { header: 'Pc', dataKey: 'pieces', align: 'right' },
        { header: 'Sale Value', dataKey: 'sale_value_fmt', align: 'right' },
        { header: 'Ret Wt', dataKey: 'return_weight_fmt', align: 'right' },
        { header: 'Ret Val', dataKey: 'sale_return_value_fmt', align: 'right' },
        { header: 'Gr. Wt', dataKey: 'gross_weight_fmt', align: 'right' },
        { header: 'Net Wt', dataKey: 'net_weight_fmt', align: 'right' },
        { header: 'Gold', dataKey: 'gold_weight_fmt', align: 'right' },
        { header: 'Silver', dataKey: 'silver_weight_fmt', align: 'right' },
        { header: 'Amount', dataKey: 'amount_fmt', align: 'right' },
      ],
      data: allRows.map((r) => ({
        ...r,
        weight_fmt: fmt(r.weight),
        sale_value_fmt: fmtCurr(r.sale_value),
        return_weight_fmt: fmt(r.return_weight),
        sale_return_value_fmt: fmtCurr(r.sale_return_value),
        gross_weight_fmt: fmt(r.gross_weight),
        net_weight_fmt: fmt(r.net_weight),
        gold_weight_fmt: fmt(r.gold_weight),
        silver_weight_fmt: fmt(r.silver_weight),
        amount_fmt: fmtCurr(r.amount),
      })),
      totals: {
        particular: 'Grand Total',
        weight_fmt: fmt(totals.weight),
        pieces: totals.pieces,
        sale_value_fmt: fmtCurr(totals.sale_value),
        return_weight_fmt: fmt(totals.return_weight),
        sale_return_value_fmt: fmtCurr(totals.sale_return_value),
        gross_weight_fmt: fmt(totals.gross_weight),
        net_weight_fmt: fmt(totals.net_weight),
        gold_weight_fmt: fmt(totals.gold_weight),
        silver_weight_fmt: fmt(totals.silver_weight),
        amount_fmt: fmtCurr(totals.amount),
      },
    };
  };

  const handlePrint = async () => {
    try {
      setExporting(true);
      await printReport(await buildReportOptions());
    } finally {
      setExporting(false);
    }
  };

  const handlePdf = async () => {
    try {
      setExporting(true);
      await downloadReportPdf(await buildReportOptions());
    } finally {
      setExporting(false);
    }
  };

  const handleWhatsApp = async () => {
    try {
      setExporting(true);
      await shareReportOnWhatsApp(await buildReportOptions());
    } finally {
      setExporting(false);
    }
  };

  const handleCsvExport = async () => {
    try {
      setExporting(true);
      const rows = await fetchSaleRegisterExport(buildFilterParams());
      const headers = [
        'Voucher No', 'Date', 'Party Name', 'Particular', 'Item Name', 'Weight', 'Pc',
        'Sale Value', 'Ret Wt', 'Ret Pc', 'Sale Ret Value', 'Gr. Wt', 'Net Wt',
        'Dia Wt', 'Stn Wt', 'Tags', 'Metal Pc', 'Gold', 'Silver', 'Amount'
      ];
      const csvRows = [
        headers.join(','),
        ...rows.map((r) => [
          `"${r.voucher_no}"`, `"${r.voucher_date}"`, `"${r.party_name}"`, `"${r.particular}"`, `"${r.item_name}"`,
          r.weight, r.pieces, r.sale_value, r.return_weight, r.return_pieces,
          r.sale_return_value, r.gross_weight, r.net_weight, r.diamond_weight,
          r.stone_weight, r.tags, r.metal_pieces, r.gold_weight, r.silver_weight, r.amount
        ].join(','))
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sale_Register_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showErrorAlert(err.message || 'Export failed.');
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
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Sale Register</h1>
              <p className="text-xs text-slate-500">
                Manage sale entries, returns, weights & metal breakdowns
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
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={handleAddClick}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sale</span>
            </button>
          </div>
        </div>

        {/* FILTER SECTION */}
        <form onSubmit={handleApplyFilters} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          {/* Primary Compact Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Party Name</label>
              <select
                value={partyName}
                onChange={(e) => { setPartyName(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white outline-hidden"
              >
                <option value="all">ALL</option>
                {filterOptions.parties.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account Group</label>
              <select
                value={accountGroup}
                onChange={(e) => { setAccountGroup(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white outline-hidden"
              >
                <option value="all">ALL</option>
                {filterOptions.account_groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Item Group</label>
              <select
                value={itemGroup}
                onChange={(e) => { setItemGroup(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white outline-hidden"
              >
                <option value="all">ALL</option>
                {filterOptions.item_groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Item Code</label>
              <select
                value={itemCode}
                onChange={(e) => { setItemCode(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white outline-hidden"
              >
                <option value="all">ALL</option>
                {filterOptions.item_codes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Branch</label>
              <select
                value={branchName}
                onChange={(e) => { setBranchName(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white outline-hidden"
              >
                <option value="all">ALL</option>
                {filterOptions.branches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Register Type</label>
              <select
                value={registerType}
                onChange={(e) => { setRegisterType(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white outline-hidden font-semibold"
              >
                <option value="ALL">All</option>
                <option value="TAGGED">Tagged</option>
                <option value="LOOSE">Loose</option>
                <option value="JOB">Job</option>
                <option value="ORDER">Order</option>
                <option value="W_O_TAG">W/O Tag</option>
              </select>
            </div>
          </div>

          {/* Expandable Other Filters */}
          {showOtherFilters && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs bg-slate-50/70 p-3 rounded-xl">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stamp</label>
                <select
                  value={stamp}
                  onChange={(e) => { setStamp(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                >
                  <option value="all">ALL</option>
                  {filterOptions.stamps.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Item Type</label>
                <select
                  value={itemType}
                  onChange={(e) => { setItemType(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                >
                  <option value="all">ALL</option>
                  {filterOptions.item_types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                >
                  <option value="all">ALL</option>
                  {filterOptions.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Series</label>
                <select
                  value={series}
                  onChange={(e) => { setSeries(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                >
                  <option value="all">ALL</option>
                  {filterOptions.series.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quality</label>
                <select
                  value={quality}
                  onChange={(e) => { setQuality(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                >
                  <option value="all">ALL</option>
                  {filterOptions.qualities.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Voucher Type</label>
                <select
                  value={voucherType}
                  onChange={(e) => { setVoucherType(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                >
                  <option value="all">ALL</option>
                  {filterOptions.voucher_types.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Checkboxes + Search + Apply/Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
              {[
                { label: 'Sold', state: isSold, set: setIsSold },
                { label: 'In Stock', state: inStock, set: setInStock },
                { label: 'Net Value', state: netValue, set: setNetValue },
                { label: 'Approvals', state: isApproved, set: setIsApproved },
                { label: 'Exclude', state: isExcluded, set: setIsExcluded },
                { label: 'Include Metal', state: includeMetal, set: setIncludeMetal },
              ].map((cb) => (
                <label key={cb.label} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cb.state}
                    onChange={(e) => { cb.set(e.target.checked); setCurrentPage(1); }}
                    className="accent-blue-600 cursor-pointer"
                  />
                  <span>{cb.label}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search voucher, party, item, code..."
                  className="pl-8 pr-7 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs w-56 sm:w-64 focus:bg-white focus:border-blue-600 outline-hidden"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(''); setAppliedSearch(''); setCurrentPage(1); }}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowOtherFilters((p) => !p)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>More Filters</span>
                {showOtherFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Apply Filter
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>
        </form>

        {/* DATA TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200 z-10">
                <tr>
                  <th className="py-3 px-3 cursor-pointer hover:text-blue-600" onClick={() => handleSort('particular')}>Particular</th>
                  <th className="py-3 px-2.5 text-right cursor-pointer hover:text-blue-600" onClick={() => handleSort('weight')}>Weight</th>
                  <th className="py-3 px-2.5 text-right cursor-pointer hover:text-blue-600" onClick={() => handleSort('pieces')}>Pc</th>
                  <th className="py-3 px-2.5 text-right cursor-pointer hover:text-blue-600" onClick={() => handleSort('sale_value')}>Sale Value</th>
                  <th className="py-3 px-2.5 text-right">Return Weight</th>
                  <th className="py-3 px-2.5 text-right">Return Pc</th>
                  <th className="py-3 px-2.5 text-right">Sale Return Value</th>
                  <th className="py-3 px-2.5 text-right">Gross Weight</th>
                  <th className="py-3 px-2.5 text-right">Net Weight</th>
                  <th className="py-3 px-2.5 text-right">Diamond Weight</th>
                  <th className="py-3 px-2.5 text-right">Stone Weight</th>
                  <th className="py-3 px-2.5 text-right">Tags</th>
                  <th className="py-3 px-2.5 text-right">Metal Pc</th>
                  <th className="py-3 px-2.5 text-right">Gold</th>
                  <th className="py-3 px-2.5 text-right">Silver</th>
                  <th className="py-3 px-3 text-right cursor-pointer hover:text-blue-600" onClick={() => handleSort('amount')}>Amount</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-blue-600" onClick={() => handleSort('item_name')}>Item Name</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={18} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span>Loading Sale Register...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-12 text-center text-slate-400 font-semibold">
                      No Sale Register records found.
                    </td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div>{r.particular || r.item_name}</div>
                        <div className="text-[10px] font-normal text-slate-500">
                          {r.voucher_no} • {r.voucher_date} • {r.party_name}
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{fmt(r.weight)}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{r.pieces}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-blue-700 font-semibold">₹{fmtCurr(r.sale_value)}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{fmt(r.return_weight)}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{r.return_pieces}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-rose-600">₹{fmtCurr(r.sale_return_value)}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{fmt(r.gross_weight)}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{fmt(r.net_weight)}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{fmt(r.diamond_weight)}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{fmt(r.stone_weight)}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{r.tags}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{r.metal_pieces}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-amber-700">{fmt(r.gold_weight)}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-slate-600">{fmt(r.silver_weight)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{fmtCurr(r.amount)}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{r.item_name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-400">
                          <button type="button" onClick={() => setViewingRecord(r)} className="p-1 hover:text-blue-600 transition cursor-pointer" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleEditClick(r.id)} className="p-1 hover:text-amber-600 transition cursor-pointer" title="Edit Entry">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleDelete(r.id, r.voucher_no || r.item_name)} className="p-1 hover:text-rose-600 transition cursor-pointer" title="Delete Entry">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong className="text-slate-900">{items.length}</strong> of{' '}
                <strong className="text-slate-900">{totalRecords}</strong> records
              </span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="px-3 py-1 font-bold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/*  PANEL */}
        <SaleSummaryPanel
          summary={summaryData}
          loading={summaryLoading}
          onRefresh={loadSummary}
        />
      </div>

      {/* View Details Modal */}
      <SaleRegisterDetailModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
      />
    </div>
  );
};
