import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Printer,
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
  AlertCircle,
  CheckCircle2,
  Tag,
  Package,
  Layers,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  ItemRecord,
  ItemFilterParams,
  ItemFilterOptions,
} from '../../types';
import {
  fetchItemsApi,
  deleteItemApi,
  fetchItemFilterOptionsApi,
  fetchAllItemsForExportApi,
} from '../../services/api';
import { ItemViewModal } from './ItemViewModal';

interface ItemListPageProps {
  onBackToDashboard?: () => void;
  onNavigateAdd?: () => void;
  onNavigateEdit?: (id: number) => void;
}

export const ItemListPage: React.FC<ItemListPageProps> = ({
  onBackToDashboard,
  onNavigateAdd,
  onNavigateEdit,
}) => {
  const navigate = useNavigate();

  // Data states
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filter options from database
  const [filterOptions, setFilterOptions] = useState<ItemFilterOptions>({
    categories: [],
    stamps: [],
    group_names: [],
    stock_methods: [],
    labour_types: [],
  });

  // Filter form states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [appliedName, setAppliedName] = useState<string>('');
  const [codeFilter, setCodeFilter] = useState<string>('');
  const [appliedCode, setAppliedCode] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStockMethod, setSelectedStockMethod] = useState<string>('all');
  const [selectedLabourType, setSelectedLabourType] = useState<string>('all');

  // 4 Dropdown Options for Item Master Dynamic View
  // 1. Accounting Detail, 2. MRP Detail, 3. Return/Exchange Policy, 4. Tag Gen Restriction / Card Point
  const [viewMode, setViewMode] = useState<'ACCOUNTING' | 'MRP' | 'RETURN_EXCHANGE' | 'TAG_GEN' | 'STANDARD'>('ACCOUNTING');

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

  // Modals
  const [viewingItem, setViewingItem] = useState<ItemRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Load filter options on mount
  useEffect(() => {
    let isMounted = true;
    fetchItemFilterOptionsApi()
      .then((opts) => {
        if (isMounted) setFilterOptions(opts);
      })
      .catch((err) => {
        console.error('Failed to load filter options:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch paginated data
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    const params: ItemFilterParams = {
      page: currentPage,
      limit: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    if (appliedSearch.trim()) params.search = appliedSearch.trim();
    if (appliedName.trim()) params.name = appliedName.trim();
    if (appliedCode.trim()) params.code = appliedCode.trim();
    if (selectedGroup !== 'all') params.group_name = selectedGroup;
    if (selectedCategory !== 'all') params.category_id = selectedCategory;
    if (selectedStatus !== 'all') params.is_active = selectedStatus;
    if (selectedStockMethod !== 'all') params.stock_method = selectedStockMethod;
    if (selectedLabourType !== 'all') params.labour_type = selectedLabourType;

    try {
      const res = await fetchItemsApi(params);
      setItems(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load items. Please try again.');
      setItems([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    appliedSearch,
    appliedName,
    appliedCode,
    selectedGroup,
    selectedCategory,
    selectedStatus,
    selectedStockMethod,
    selectedLabourType,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Show Toast helper
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Search Submission
  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchQuery);
    setAppliedName(nameFilter);
    setAppliedCode(codeFilter);
    setCurrentPage(1);
  };

  // Handle Reset Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setNameFilter('');
    setAppliedName('');
    setCodeFilter('');
    setAppliedCode('');
    setSelectedGroup('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedStockMethod('all');
    setSelectedLabourType('all');
    setSortBy('id');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  // Handle Column Sorting
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Navigation handlers
  const handleGoToAdd = () => {
    if (onNavigateAdd) {
      onNavigateAdd();
    } else {
      navigate('/items/add');
    }
  };

  const handleGoToEdit = (id: number) => {
    if (onNavigateEdit) {
      onNavigateEdit(id);
    } else {
      navigate(`/items/edit/${id}`);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const res = await deleteItemApi(deletingItem.id);
      showToast('success', res.message || `Item '${deletingItem.name}' deleted successfully.`);
      setDeletingItem(null);
      loadData();
    } catch (err: any) {
      setDeleteErrorMessage(err.message || 'Failed to delete item.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format Helper
  const formatNumber = (val: number | null | undefined, decimals = 2): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0.00';
    return Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Format Labour Type Badge
  const renderLabourTypeBadge = (type: string) => {
    const map: Record<string, { label: string; color: string }> = {
      PER_GRAM_NET: { label: 'Per Gm Net', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      PER_GRAM_GROSS: { label: 'Per Gm Gross', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      PER_PIECE: { label: 'Per Piece', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      PERCENTAGE: { label: 'Percentage', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    };
    const b = map[type] || { label: type || 'Standard', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${b.color}`}>
        {b.label}
      </span>
    );
  };

  // Export handlers
  const handlePrint = async () => {
    try {
      window.print();
    } catch (err) {
      console.error('Print error:', err);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const allData = await fetchAllItemsForExportApi({
        search: appliedSearch || undefined,
        name: appliedName || undefined,
        code: appliedCode || undefined,
        group_name: selectedGroup !== 'all' ? selectedGroup : undefined,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        is_active: selectedStatus !== 'all' ? selectedStatus : undefined,
        stock_method: selectedStockMethod !== 'all' ? selectedStockMethod : undefined,
        labour_type: selectedLabourType !== 'all' ? selectedLabourType : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (!allData || allData.length === 0) {
        showToast('error', 'No records to export.');
        return;
      }

      const headers = [
        'Sr. No.',
        'Item Name',
        'Item Code',
        'Group Name',
        'Category',
        'Tunch (%)',
        'Default Wastage (%)',
        'Default Labour Rate',
        'Labour Type',
        'Stock Method',
        'Status',
        'HSN Code',
        'Default Item',
      ];

      const rows = allData.map((item, idx) => [
        idx + 1,
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${(item.code || '').replace(/"/g, '""')}"`,
        `"${(item.group_name || '').replace(/"/g, '""')}"`,
        `"${(item.category_name || '').replace(/"/g, '""')}"`,
        formatNumber(item.tunch, 2),
        formatNumber(item.default_wastage, 2),
        formatNumber(item.default_labour_rate, 2),
        `"${item.labour_type || ''}"`,
        `"${item.stock_method || ''}"`,
        item.is_active ? 'Active' : 'Inactive',
        `"${item.hsn_code || ''}"`,
        `"${(item.default_item || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Item_List_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('success', `Exported ${allData.length} item records to CSV.`);
    } catch (err: any) {
      showToast('error', err.message || 'CSV Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    // Generates an Excel-compatible HTML Spreadsheet XML
    setExporting(true);
    try {
      const allData = await fetchAllItemsForExportApi({
        search: appliedSearch || undefined,
        name: appliedName || undefined,
        code: appliedCode || undefined,
        group_name: selectedGroup !== 'all' ? selectedGroup : undefined,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        is_active: selectedStatus !== 'all' ? selectedStatus : undefined,
        stock_method: selectedStockMethod !== 'all' ? selectedStockMethod : undefined,
        labour_type: selectedLabourType !== 'all' ? selectedLabourType : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (!allData || allData.length === 0) {
        showToast('error', 'No records to export.');
        return;
      }

      let tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"/></head>
        <body>
        <h2>RUDRA SILVER ERP - ITEM MASTER LIST</h2>
        <table border="1">
          <thead>
            <tr style="background-color: #2563eb; color: #ffffff; font-weight: bold;">
              <th>Sr. No.</th>
              <th>Item Name</th>
              <th>Item Code</th>
              <th>Group Name</th>
              <th>Category</th>
              <th>Tunch (%)</th>
              <th>Default Wastage (%)</th>
              <th>Default Labour Rate</th>
              <th>Labour Type</th>
              <th>Stock Method</th>
              <th>Status</th>
              <th>HSN Code</th>
            </tr>
          </thead>
          <tbody>
      `;

      allData.forEach((item, idx) => {
        tableHtml += `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.name || ''}</td>
            <td>${item.code || ''}</td>
            <td>${item.group_name || ''}</td>
            <td>${item.category_name || ''}</td>
            <td>${formatNumber(item.tunch, 2)}</td>
            <td>${formatNumber(item.default_wastage, 2)}</td>
            <td>${formatNumber(item.default_labour_rate, 2)}</td>
            <td>${item.labour_type || ''}</td>
            <td>${item.stock_method || ''}</td>
            <td>${item.is_active ? 'Active' : 'Inactive'}</td>
            <td>${item.hsn_code || ''}</td>
          </tr>
        `;
      });

      tableHtml += `</tbody></table></body></html>`;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Item_List_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('success', `Exported ${allData.length} records to Excel.`);
    } catch (err: any) {
      showToast('error', err.message || 'Excel export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    // Window print styled for PDF download
    window.print();
  };

  // Sort indicator helper
  const renderSortIndicator = (colKey: string) => {
    if (sortBy !== colKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 inline-block ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline-block ml-1" />
    );
  };

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-[1750px] mx-auto w-full space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold transition-all transform animate-in slide-in-from-top-3 ${toastMessage.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Banner & Action Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Title & Breadcrumb */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Item Master</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Item List
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Dashboard &nbsp;/&nbsp; Item Master &nbsp;/&nbsp; <span className="text-slate-800">Item List</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Add Item, Print, Export CSV, PDF, Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGoToAdd}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span> Add Item</span>
            </button>


            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 bg-white cursor-pointer disabled:opacity-50"
              title="Export as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={exporting}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 bg-white cursor-pointer disabled:opacity-50"
              title="Export as PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 bg-white cursor-pointer disabled:opacity-50"
              title="Export as Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Section Title Banner with Blue Accent & 4 Dynamic View Options Dropdown */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Item Master</h2>
            <span className="text-xs font-medium text-slate-500">
              ({totalRecords} {totalRecords === 1 ? 'record' : 'records'})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* The 4 Dropdown Options */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <label htmlFor="itemMasterViewSelect" className="text-xs font-bold text-blue-950 whitespace-nowrap">
                Detail View:
              </label>
              <select
                id="itemMasterViewSelect"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="pl-2 pr-7 py-1 text-xs font-semibold rounded-lg border border-blue-300 bg-white text-blue-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ACCOUNTING">1. Accounting Detail</option>
                <option value="MRP">2. MRP Detail</option>
                <option value="RETURN_EXCHANGE">3. Return/Exchange Policy</option>
                <option value="TAG_GEN">4. Tag Gen Restriction / Card Point</option>
                <option value="STANDARD">Standard Item View</option>
              </select>
            </div>

            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="text-xs text-slate-500 hover:text-blue-600 transition font-medium"
              >
                &larr; Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* 2. Comprehensive Search & Filters Section */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end gap-2">
            {/* Row 1: Search Inputs */}
            <div className="flex flex-wrap items-end gap-2 w-full">
              {/* General Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Any keyword (Name, Code, HSN...)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
                />
              </div>





              {/* Status Filter */}
              <div className="relative">
                <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Status</label>
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="1">Active Only</option>
                    <option value="0">Inactive Only</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>



              {/* Action Buttons: Filter, Clear, Show Page Size */}
              <div className="flex items-end space-x-2 pt-3 sm:pt-4">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium shadow-2xs transition flex items-center gap-1 bg-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clear</span>
                </button>

                {/* Show Page Size */}
                <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="appearance-none pl-2 pr-6 py-1 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 3. Item List Table with 4 Dynamic Views */}
        <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[1300px]">
              {/* Dynamic Table Header based on viewMode */}
              <thead>
                {viewMode === 'ACCOUNTING' && (
                  /* Option 1: Accounting Detail (Screenshot 1 & Screenshot 2) */
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap select-none">
                    <th className="py-3 px-2 text-center border-r border-slate-200 w-12">Sr. No.</th>
                    <th className="py-3 px-3 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[160px]" onClick={() => handleSort('group_name')}>
                      <span>Group Name</span>{renderSortIndicator('group_name')}
                    </th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[70px]">SGST</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[70px]">CGST</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[70px]">IGST</th>
                    <th className="py-3 px-2.5 text-center border-r border-slate-200 min-w-[90px]">HSN Code</th>
                    <th className="py-3 px-2.5 text-center border-r border-slate-200 min-w-[90px]">Job SAC</th>
                    <th className="py-3 px-2.5 text-center border-r border-slate-200 min-w-[100px]">Gstr1 Display</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[70px]">L.Tax</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[70px]">C.Tax</th>
                    <th className="py-3 px-2.5 text-center border-r border-slate-200 min-w-[90px]">Com.Co</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[70px]">Gp%</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[95px]">Op Value</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[95px]">Cl.Value</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[90px]">Minim.Stock</th>
                    <th className="py-3 px-2.5 text-center border-r border-slate-200 min-w-[80px]">Type</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[90px]">Value.Rate</th>
                    <th className="py-3 px-2.5 text-center border-r border-slate-200 min-w-[90px]">Stk.Method</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[80px]">Tunch</th>
                    <th className="py-3 px-3 border-r border-slate-200 min-w-[120px]">Def Item</th>
                    <th className="py-3 px-3 text-center min-w-[170px] print:hidden">Action</th>
                  </tr>
                )}

                {viewMode === 'MRP' && (
                  /* Option 2: MRP Detail (Screenshot 3) */
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap select-none">
                    <th className="py-3 px-3 text-center border-r border-slate-200 w-12">Sr. No.</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[160px]" onClick={() => handleSort('group_name')}>
                      <span>Group Name</span>{renderSortIndicator('group_name')}
                    </th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 min-w-[110px]">Sale On Mrp</th>
                    <th className="py-3 px-3 text-right border-r border-slate-200 min-w-[95px]">Divide By</th>
                    <th className="py-3 px-3 text-right border-r border-slate-200 min-w-[95px]">Into By</th>
                    <th className="py-3 px-3 text-right border-r border-slate-200 min-w-[100px]">Pur Less %</th>
                    <th className="py-3 px-3 text-right border-r border-slate-200 min-w-[100px]">Sale Less %</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 min-w-[110px]">Dis Types</th>
                    <th className="py-3 px-3 border-r border-slate-200 min-w-[130px]">Detail Salesman</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 min-w-[120px]">Update Mrp Col</th>
                    <th className="py-3 px-3 text-center min-w-[170px] print:hidden">Action</th>
                  </tr>
                )}

                {viewMode === 'RETURN_EXCHANGE' && (
                  /* Option 3: Return/Exchange Policy (Screenshot 4: Return Less % and Exchange Less % as separate grouped table headings) */
                  <>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap select-none">
                      <th rowSpan={2} className="py-2.5 px-3 text-center border-r border-slate-200 w-12 align-middle">
                        Sr. No.
                      </th>
                      <th rowSpan={2} className="py-2.5 px-3.5 border-r border-slate-200 min-w-[160px] align-middle" onClick={() => handleSort('group_name')}>
                        <span>Group Name</span>{renderSortIndicator('group_name')}
                      </th>
                      <th colSpan={5} className="py-2 px-3 text-center bg-amber-50/80 text-amber-900 border-b border-r border-amber-200 font-bold uppercase tracking-wider text-[11px]">
                        Return Less %
                      </th>
                      <th colSpan={5} className="py-2 px-3 text-center bg-blue-50/80 text-blue-900 border-b border-r border-blue-200 font-bold uppercase tracking-wider text-[11px]">
                        Exchange Less %
                      </th>
                      <th rowSpan={2} className="py-2.5 px-3 text-center min-w-[170px] align-middle print:hidden">
                        Action
                      </th>
                    </tr>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-700 font-semibold text-xs whitespace-nowrap select-none">
                      {/* Return Less % sub-columns */}
                      <th className="py-2 px-2.5 text-right border-r border-slate-200 min-w-[80px]">Item</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-200 min-w-[80px]">Labour</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-200 min-w-[80px]">Diamond</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-200 min-w-[80px]">Stone</th>
                      <th className="py-2 px-2.5 text-center border-r border-slate-200 min-w-[110px]">Metal By</th>
                      {/* Exchange Less % sub-columns */}
                      <th className="py-2 px-2.5 text-right border-r border-slate-200 min-w-[80px]">Item</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-200 min-w-[80px]">Labour</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-200 min-w-[80px]">Diamond</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-200 min-w-[80px]">Stone</th>
                      <th className="py-2 px-2.5 text-center border-r border-slate-200 min-w-[110px]">Metal By</th>
                    </tr>
                  </>
                )}

                {viewMode === 'TAG_GEN' && (
                  /* Option 4: Tag Gen Restriction / Card Point (Screenshot 5) */
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap select-none">
                    <th className="py-3 px-3 text-center border-r border-slate-200 w-12">Sr. No.</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[150px]" onClick={() => handleSort('group_name')}>
                      <span>Group Name</span>{renderSortIndicator('group_name')}
                    </th>
                    <th className="py-3 px-3 font-mono border-r border-slate-200 min-w-[100px]">Tag Code</th>
                    <th className="py-3 px-3 border-r border-slate-200 min-w-[100px]">Stamp</th>
                    <th className="py-3 px-3 border-r border-slate-200 min-w-[100px]">Metal</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[95px]">Labour</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[95px]">Polish Wt</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 min-w-[100px]">Stud Stamp</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[95px]">Dia Rate</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[95px]">Stn Rate</th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 min-w-[105px]">Re Order Level</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 min-w-[95px]">Upload</th>
                    <th className="py-3 px-3 text-center min-w-[170px] print:hidden">Action</th>
                  </tr>
                )}

                {viewMode === 'STANDARD' && (
                  /* Standard Item List View */
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap select-none">
                    <th className="py-3 px-3 text-center border-r border-slate-200 w-12">Sr. No.</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[170px]" onClick={() => handleSort('name')}>
                      <span>Item Name</span>{renderSortIndicator('name')}
                    </th>
                    <th className="py-3 px-3 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[130px]" onClick={() => handleSort('code')}>
                      <span>Item Code</span>{renderSortIndicator('code')}
                    </th>
                    <th className="py-3 px-3 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[150px]" onClick={() => handleSort('group_name')}>
                      <span>Group Name</span>{renderSortIndicator('group_name')}
                    </th>
                    <th className="py-3 px-3 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[140px]" onClick={() => handleSort('category_name')}>
                      <span>Category</span>{renderSortIndicator('category_name')}
                    </th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[80px]" onClick={() => handleSort('tunch')}>
                      <span>Tunch</span>{renderSortIndicator('tunch')}
                    </th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[95px]" onClick={() => handleSort('default_wastage')}>
                      <span>Default Wastage</span>{renderSortIndicator('default_wastage')}
                    </th>
                    <th className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[110px]" onClick={() => handleSort('default_labour_rate')}>
                      <span>Default Labour Rate</span>{renderSortIndicator('default_labour_rate')}
                    </th>
                    <th className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[105px]" onClick={() => handleSort('labour_type')}>
                      <span>Labour Type</span>{renderSortIndicator('labour_type')}
                    </th>
                    <th className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[95px]" onClick={() => handleSort('stock_method')}>
                      <span>Stock Method</span>{renderSortIndicator('stock_method')}
                    </th>
                    <th className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[80px]" onClick={() => handleSort('is_active')}>
                      <span>Status</span>{renderSortIndicator('is_active')}
                    </th>
                    <th className="py-3 px-3 text-center min-w-[190px] print:hidden">Action</th>
                  </tr>
                )}
              </thead>

              {/* Dynamic Table Body */}
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={viewMode === 'ACCOUNTING' ? 21 : viewMode === 'MRP' ? 11 : viewMode === 'RETURN_EXCHANGE' ? 13 : viewMode === 'TAG_GEN' ? 13 : 12} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                        <span className="text-xs font-semibold text-slate-600">Loading items from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === 'ACCOUNTING' ? 21 : viewMode === 'MRP' ? 11 : viewMode === 'RETURN_EXCHANGE' ? 13 : viewMode === 'TAG_GEN' ? 13 : 12} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Tag className="w-8 h-8 text-slate-300" />
                        <span className="text-sm font-semibold text-slate-700">No items found</span>
                        <p className="text-xs text-slate-400">
                          Try adjusting your search query or filters to find what you are looking for.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const srNo = (currentPage - 1) * pageSize + index + 1;

                    // Common Action buttons column
                    const actionCell = (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingItem(item)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGoToEdit(item.id)}
                            className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingItem(item);
                              setDeleteErrorMessage(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    );

                    {/* 1. Accounting Detail Row */ }
                    if (viewMode === 'ACCOUNTING') {
                      return (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors text-slate-800">
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 text-slate-400 font-mono text-xs">{srNo}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-900">
                            {item.group_name || item.name}
                            {item.name && item.name !== item.group_name && (
                              <span className="block text-[11px] text-slate-500 font-normal">{item.name}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">{formatNumber(item.sgst, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">{formatNumber(item.cgst, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">{formatNumber(item.igst, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-center border-r border-slate-100 font-mono">{item.hsn_code || '7113'}</td>
                          <td className="py-2.5 px-2.5 text-center border-r border-slate-100 text-slate-600">{item.job_sac || '—'}</td>
                          <td className="py-2.5 px-2.5 text-center border-r border-slate-100">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {item.gstr1_display || 'TAXABLE'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">{formatNumber(item.l_tax, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">{formatNumber(item.c_tax, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-center border-r border-slate-100 text-slate-600">{item.com_co || '—'}</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono font-medium text-emerald-700">{formatNumber(item.gp_percentage, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">₹{formatNumber(item.op_value, 2)}</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">₹{formatNumber(item.cl_value, 2)}</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">{item.minimum_stock ?? 0}</td>
                          <td className="py-2.5 px-2.5 text-center border-r border-slate-100">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {item.mrp_type || 'FIXED'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono font-bold text-slate-900">₹{formatNumber(item.value_rate, 2)}</td>
                          <td className="py-2.5 px-2.5 text-center border-r border-slate-100">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-800 border border-slate-200">
                              {item.stock_method || 'FIFO'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono font-bold text-slate-900">{formatNumber(item.tunch, 2)}%</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700 truncate max-w-[120px]">{item.default_item || '—'}</td>
                          {actionCell}
                        </tr>
                      );
                    }

                    {/* 2. MRP Detail Row */ }
                    if (viewMode === 'MRP') {
                      return (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors text-slate-800">
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 text-slate-400 font-mono text-xs">{srNo}</td>
                          <td className="py-2.5 px-3.5 border-r border-slate-100 font-semibold text-slate-900">
                            {item.group_name || item.name}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.sale_on_mrp || 'NO'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono font-medium">{formatNumber(item.divide_by, 2)}</td>
                          <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono font-medium">{formatNumber(item.into_by, 2)}</td>
                          <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono text-amber-700 font-medium">{formatNumber(item.pur_less_pct, 2)}%</td>
                          <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono text-emerald-700 font-medium">{formatNumber(item.sale_less_pct, 2)}%</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 text-slate-700">{item.dis_types || 'PERCENTAGE'}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700">{item.detail_salesman || '—'}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {item.update_mrp_col || 'AUTO'}
                            </span>
                          </td>
                          {actionCell}
                        </tr>
                      );
                    }

                    {/* 3. Return / Exchange Policy Row */ }
                    if (viewMode === 'RETURN_EXCHANGE') {
                      return (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors text-slate-800">
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 text-slate-400 font-mono text-xs">{srNo}</td>
                          <td className="py-2.5 px-3.5 border-r border-slate-100 font-semibold text-slate-900">{item.group_name || item.name}</td>
                          {/* Return Less % sub-columns */}
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono bg-amber-50/20">{formatNumber(item.return_item_less_pct, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono bg-amber-50/20">{formatNumber(item.return_labour_less_pct, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono bg-amber-50/20">{formatNumber(item.return_diamond_less_pct, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono bg-amber-50/20">{formatNumber(item.return_stone_less_pct, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-center border-r border-slate-100 text-slate-700 bg-amber-50/20 text-[11px]">{item.return_metal_by || 'CURRENT_RATE'}</td>
                          {/* Exchange Less % sub-columns */}
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono bg-blue-50/20">{formatNumber(item.exchange_item_less_pct, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono bg-blue-50/20">{formatNumber(item.exchange_labour_less_pct, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono bg-blue-50/20">{formatNumber(item.exchange_diamond_less_pct, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono bg-blue-50/20">{formatNumber(item.exchange_stone_less_pct, 2)}%</td>
                          <td className="py-2.5 px-2.5 text-center border-r border-slate-100 text-slate-700 bg-blue-50/20 text-[11px]">{item.exchange_metal_by || 'CURRENT_RATE'}</td>
                          {actionCell}
                        </tr>
                      );
                    }

                    {/* 4. Tag Gen Restriction / Card Point Row */ }
                    if (viewMode === 'TAG_GEN') {
                      return (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors text-slate-800">
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 text-slate-400 font-mono text-xs">{srNo}</td>
                          <td className="py-2.5 px-3.5 border-r border-slate-100 font-semibold text-slate-900">{item.group_name || item.name}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700 border-r border-slate-100">{item.code || item.tag_prefix || '—'}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 text-slate-800">{item.stamp_name || '—'}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-800">
                              {item.category_metal_type || item.category_name || 'SILVER'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono font-medium">₹{formatNumber(item.default_labour_rate, 2)}</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">{formatNumber(item.polish_wt, 3)}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 text-slate-700">{item.stud_stamp || '—'}</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono text-emerald-700">₹{formatNumber(item.dia_rate, 2)}</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono text-blue-700">₹{formatNumber(item.stn_rate, 2)}</td>
                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono">{item.re_order_level || 0}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.upload_file ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                              {item.upload_file ? 'Yes' : 'No'}
                            </span>
                          </td>
                          {actionCell}
                        </tr>
                      );
                    }

                    {/* 5. Standard View Row */ }
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors text-slate-800">
                        <td className="py-3 px-2.5 text-center border-r border-slate-100 text-slate-400 font-mono text-xs">{srNo}</td>
                        <td className="py-3 px-3.5 border-r border-slate-100 font-semibold text-slate-900">
                          {item.name || item.group_name}
                          {item.default_item && (
                            <span className="block text-[11px] text-slate-500 font-normal">{item.default_item}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 border-r border-slate-100 font-mono font-bold text-blue-700 text-xs">{item.code || '—'}</td>
                        <td className="py-3 px-3 border-r border-slate-100 text-slate-700 text-xs">{item.group_name || '—'}</td>
                        <td className="py-3 px-3 border-r border-slate-100 text-slate-800 text-xs">
                          <span className="font-medium text-slate-900">{item.category_name || `Category #${item.category_id}`}</span>
                          {item.category_metal_type && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{item.category_metal_type}</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-right border-r border-slate-100 font-mono text-slate-900 font-medium">{formatNumber(item.tunch, 2)}%</td>
                        <td className="py-3 px-2.5 text-right border-r border-slate-100 font-mono font-medium text-amber-700">{formatNumber(item.default_wastage, 2)}%</td>
                        <td className="py-3 px-2.5 text-right border-r border-slate-100 font-mono font-bold text-emerald-700">₹{formatNumber(item.default_labour_rate, 2)}</td>
                        <td className="py-3 px-2.5 text-center border-r border-slate-100 whitespace-nowrap">{renderLabourTypeBadge(item.labour_type)}</td>
                        <td className="py-3 px-2.5 text-center border-r border-slate-100 font-mono text-xs font-semibold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[10px]">{item.stock_method || 'FIFO'}</span>
                        </td>
                        <td className="py-3 px-2.5 text-center border-r border-slate-100 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${item.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {actionCell}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Table Pagination Footer */}
          <div className="bg-white px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing{' '}
              <span className="font-bold text-slate-900">
                {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * pageSize, totalRecords)}
              </span>{' '}
              of <span className="font-bold text-slate-900">{totalRecords}</span> records
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= currentPage - 2 && p <= currentPage + 2)
                )
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${currentPage === p
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Item Modal */}
      {viewingItem && (
        <ItemViewModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}

      {/* Delete Item Confirmation Dialog */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Item Confirmation</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1 text-slate-800">
              <p>
                <span className="font-semibold text-slate-600">Item Name:</span>{' '}
                <span className="font-bold">{deletingItem.name || deletingItem.group_name}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-600">Item Code:</span>{' '}
                <span className="font-mono font-bold text-blue-700">{deletingItem.code}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-600">Group:</span> {deletingItem.group_name}
              </p>
            </div>

            {deleteErrorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{deleteErrorMessage}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingItem(null);
                  setDeleteErrorMessage(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
