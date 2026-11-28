import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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
  Edit3,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Boxes,
  AlertCircle,
  CheckCircle2,
  Package,
  Printer,
  MessageCircle,
} from 'lucide-react';
import { printReport, downloadReportPdf, shareReportOnWhatsApp, ReportPdfOptions } from '../../utils/reportPdf';
import { StockStatusRecord, PaginatedStockStatus, StockStatusTotals, StockStatusFilterParams } from '../../types';
import { fetchStockStatusList, deleteStockStatus, fetchStockStatusUnits, fetchStockStatusAll } from '../../services/api';
import { showSuccessAlert, showErrorAlert, showDeleteConfirmDialog } from '../../utils/alert';

interface StockListPageProps {
  onBackToDashboard?: () => void;
  onNavigateAdd?: () => void;
  onNavigateEdit?: (id: number) => void;
}

export const StockListPage: React.FC<StockListPageProps> = ({
  onBackToDashboard,
  onNavigateAdd,
  onNavigateEdit,
}) => {
  const navigate = useNavigate();

  // Data states
  const [items, setItems] = useState<StockStatusRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totals, setTotals] = useState<StockStatusTotals>({
    total_pc: 0,
    total_gross_weight: 0,
    total_net_weight: 0,
    total_silver_fine: 0,
    total_amount: 0,
  });

  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [filterCapabilities, setFilterCapabilities] = useState<{ with_approval: boolean; entry_wise: boolean }>({
    with_approval: false,
    entry_wise: false,
  });

  // Search, Filter, Sort, Pagination states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [typeWiseGroup, setTypeWiseGroup] = useState<string>('ALL GROUP');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [itemType, setItemType] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<string>('ALL ITEM');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [withApproval, setWithApproval] = useState<boolean>(false);
  const [entryWise, setEntryWise] = useState<boolean>(false);
  const [kachiListActive, setKachiListActive] = useState<boolean>(false);
  const [itemWiseActive, setItemWiseActive] = useState<boolean>(false);
  const [showAllRecords, setShowAllRecords] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // UI / Status states
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete operation state
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load available units once
  useEffect(() => {
    fetchStockStatusUnits()
      .then(setAvailableUnits)
      .catch((err) => console.error('Failed to load units:', err));
  }, []);

  // Load item names for the Item Wise dropdown from existing stock records.
  useEffect(() => {
    fetchStockStatusAll({})
      .then((records) => {
        const names = Array.from(new Set((records || []).map((record) => record.item_name).filter(Boolean)));
        setAvailableItems(names.sort((a, b) => a.localeCompare(b)));
      })
      .catch((err) => console.error('Failed to load stock item filter options:', err));
  }, []);

  const getAppliedFilterParams = (): StockStatusFilterParams => ({
    search: appliedSearch || undefined,
    unit: selectedUnit !== 'all' ? selectedUnit : undefined,
    type_wise_group: typeWiseGroup !== 'ALL GROUP' ? typeWiseGroup : undefined,
    status_filter: statusFilter !== 'All' ? statusFilter : undefined,
    item_type: itemType !== 'All' ? itemType : undefined,
    item_dropdown: selectedItem !== 'ALL ITEM' ? selectedItem : undefined,
    date_from: dateFilter || undefined,
    date_to: dateFilter || undefined,
    approval_flag: withApproval ? 'With Approval' : undefined,
    entry_wise_flag: entryWise ? 'With Entry Wise' : undefined,
    kachi_list: kachiListActive ? 'Kachi' : undefined,
    item_wise_filter: itemWiseActive ? (selectedItem !== 'ALL ITEM' ? selectedItem : appliedSearch || undefined) : undefined,
    all_records: showAllRecords,
  });

  // Fetch stock_status data with server-side pagination, search, filters & grand totals
  const loadStockData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const params: StockStatusFilterParams = {
        ...getAppliedFilterParams(),
        sort_by: sortBy,
        sort_order: sortOrder,
        page: showAllRecords ? 1 : currentPage,
        limit: showAllRecords ? 5000 : pageSize,
      };

      const res: PaginatedStockStatus = await fetchStockStatusList(params);
      setItems(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
      setFilterCapabilities(res.filter_capabilities || { with_approval: false, entry_wise: false });
      if (res.totals) {
        setTotals(res.totals);
      }
    } catch (err: any) {
      setApiError(err.message || 'Unable to connect to the Stock Status API.');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, selectedUnit, typeWiseGroup, statusFilter, itemType, selectedItem, dateFilter, withApproval, entryWise, kachiListActive, itemWiseActive, showAllRecords, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  // Toast notifier
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Search submission
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setSelectedUnit('all');
    setTypeWiseGroup('ALL GROUP');
    setStatusFilter('All');
    setItemType('All');
    setSelectedItem('ALL ITEM');
    setDateFilter('');
    setWithApproval(false);
    setEntryWise(false);
    setKachiListActive(false);
    setItemWiseActive(false);
    setShowAllRecords(false);
    setSortBy('id');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  // Sorting toggle
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Navigation handlers for Add & Edit separate pages
  const handleGoToAdd = () => {
    if (onNavigateAdd) {
      onNavigateAdd();
    } else {
      navigate('/stock/add');
    }
  };

  const handleGoToEdit = (id: number) => {
    if (onNavigateEdit) {
      onNavigateEdit(id);
    } else {
      navigate(`/stock/edit/${id}`);
    }
  };

  // Delete action with SweetAlert2 confirmation dialog
  const handleDeleteItem = async (item: StockStatusRecord) => {
    const result = await showDeleteConfirmDialog(
      'This stock record will be deleted.',
      'Are you sure?'
    );

    if (result.isConfirmed) {
      setIsDeleting(true);
      try {
        await deleteStockStatus(item.id);
        await showSuccessAlert(`Stock record "${item.item_name}" deleted successfully.`, 'Success!');
        loadStockData();
      } catch (err: any) {
        const rawMsg = err?.message || 'Failed to delete stock. Please try again.';
        const safeMsg = rawMsg.includes('SQL') || rawMsg.includes('PDO')
          ? 'Failed to delete stock. Please try again.'
          : rawMsg;
        await showErrorAlert(safeMsg, 'Error!');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Helper number formatter preserving negative numbers & decimals
  const formatNumber = (val: number | null | undefined, decimals = 3): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return '—';
    return Number(val).toFixed(decimals);
  };

  // Export CSV of ALL matching records
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchStockStatusAll(getAppliedFilterParams());

      if (!allRecords || allRecords.length === 0) {
        showToast('No stock data available to export.', 'error');
        return;
      }

      const headers = [
        'Item Name',
        'Unit',
        'Pc',
        'Gr.Wt.',
        'Net.Wt.',
        'Tunch',
        'Wstg',
        'Lbr.Wt',
        'Rate',
        'Sil.Fine',
        'Total',
        'Gold Fine',
      ];

      const rows = allRecords.map((item) => [
        `"${(item.item_name || '').replace(/"/g, '""')}"`,
        `"${item.unit || 'Gm'}"`,
        item.pc !== null ? item.pc : '',
        item.gross_weight !== null ? item.gross_weight : '',
        item.net_weight !== null ? item.net_weight : '',
        item.tunch !== null ? item.tunch : '',
        item.wastage !== null ? item.wastage : '',
        item.labour_weight !== null ? item.labour_weight : '',
        item.rate !== null ? item.rate : '',
        item.silver_fine !== null ? item.silver_fine : '',
        item.total !== null ? item.total : '',
        item.gold_fine !== null ? item.gold_fine : '',
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rudra_Silver_Stock_List_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${allRecords.length} stock records to CSV successfully.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to export CSV.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Export Excel of ALL matching records (.xls format)
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchStockStatusAll(getAppliedFilterParams());

      if (!allRecords || allRecords.length === 0) {
        showToast('No stock data available to export.', 'error');
        return;
      }

      let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
      html += '<head><meta charset="utf-8"/><style>th { background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; } td { border: 1px solid #e2e8f0; }</style></head><body>';
      html += '<table>';
      html += '<thead><tr>';
      html += '<th>Item Name</th><th>Unit</th><th>Pc</th><th>Gr.Wt.</th><th>Net.Wt.</th><th>Tunch</th><th>Wstg</th><th>Lbr.Wt</th><th>Rate</th><th>Sil.Fine</th><th>Total</th><th>Gold Fine</th>';
      html += '</tr></thead><tbody>';

      allRecords.forEach((item) => {
        html += `<tr>
          <td>${item.item_name}</td>
          <td>${item.unit || 'Gm'}</td>
          <td>${item.pc !== null ? item.pc : ''}</td>
          <td>${item.gross_weight !== null ? item.gross_weight : ''}</td>
          <td>${item.net_weight !== null ? item.net_weight : ''}</td>
          <td>${item.tunch !== null ? item.tunch : ''}</td>
          <td>${item.wastage !== null ? item.wastage : ''}</td>
          <td>${item.labour_weight !== null ? item.labour_weight : ''}</td>
          <td>${item.rate !== null ? item.rate : ''}</td>
          <td>${item.silver_fine !== null ? item.silver_fine : ''}</td>
          <td>${item.total !== null ? item.total : ''}</td>
          <td>${item.gold_fine !== null ? item.gold_fine : ''}</td>
        </tr>`;
      });

      // Add Grand Totals row in Excel
      html += `<tr style="font-weight:bold; background-color:#e2e8f0;">
        <td>GRAND TOTAL</td>
        <td></td>
        <td>${totals.total_pc}</td>
        <td>${totals.total_gross_weight}</td>
        <td>${totals.total_net_weight}</td>
        <td></td><td></td><td></td><td></td>
        <td>${totals.total_silver_fine}</td>
        <td>${totals.total_amount}</td>
        <td>${totals.total_gold_fine || ''}</td>
      </tr>`;

      html += '</tbody></table></body></html>';

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rudra_Silver_Stock_List_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Exported ${allRecords.length} stock records to Excel successfully.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to export Excel.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Build PDF Report Options for Print, PDF Download, and WhatsApp Sharing
  const getStockReportOptions = (records: StockStatusRecord[]): ReportPdfOptions => {
    const today = new Date().toISOString().split('T')[0];
    return {
      title: 'Stock List Report',
      subtitle: 'Rudra Silver Jewellery ERP',
      filename: `Stock_List_${today}.pdf`,
      filters: [
        { label: 'Unit', value: selectedUnit === 'all' ? 'All Units' : selectedUnit },
        { label: 'Group', value: typeWiseGroup },
        { label: 'Status', value: statusFilter },
        { label: 'Item Type', value: itemType },
        { label: 'Item', value: selectedItem },
        { label: 'Date', value: dateFilter || 'All Dates' },
        { label: 'Search', value: appliedSearch || 'All' },
        { label: 'Total Records', value: String(records.length) },
      ],
      columns: [
        { header: 'Item Name', dataKey: 'item_name', align: 'left' },
        { header: 'Unit', dataKey: 'unit', align: 'center' },
        { header: 'Pc', dataKey: 'pc', align: 'right' },
        { header: 'Gr. Wt', dataKey: 'gross_weight', align: 'right' },
        { header: 'Net Wt', dataKey: 'net_weight', align: 'right' },
        { header: 'Tunch', dataKey: 'tunch', align: 'right' },
        { header: 'Wstg', dataKey: 'wastage', align: 'right' },
        { header: 'Lbr. Wt', dataKey: 'labour_weight', align: 'right' },
        { header: 'Rate', dataKey: 'rate', align: 'right' },
        { header: 'Sil. Fine', dataKey: 'silver_fine', align: 'right' },
        { header: 'Total (₹)', dataKey: 'total', align: 'right' },
        { header: 'Gold Fine', dataKey: 'gold_fine', align: 'right' },
      ],
      data: records.map((r) => ({
        item_name: r.item_name,
        unit: r.unit || 'Gm',
        pc: r.pc ?? '—',
        gross_weight: formatNumber(r.gross_weight, 3),
        net_weight: formatNumber(r.net_weight, 3),
        tunch: formatNumber(r.tunch, 2),
        wastage: formatNumber(r.wastage, 2),
        labour_weight: formatNumber(r.labour_weight, 3),
        rate: formatNumber(r.rate, 2),
        silver_fine: formatNumber(r.silver_fine, 3),
        total: formatNumber(r.total, 2),
        gold_fine: formatNumber(r.gold_fine, 3),
      })),
      totals: {
        item_name: 'GRAND TOTAL',
        unit: '',
        pc: String(totals.total_pc),
        gross_weight: formatNumber(totals.total_gross_weight, 3),
        net_weight: formatNumber(totals.total_net_weight, 3),
        tunch: '',
        wastage: '',
        labour_weight: '',
        rate: '',
        silver_fine: formatNumber(totals.total_silver_fine, 3),
        total: `₹${formatNumber(totals.total_amount, 2)}`,
        gold_fine: '',
      },
      orientation: 'landscape',
    };
  };

  // 1. Print Action: Formatted PDF Report with Header, AutoTable & Totals
  const handlePrint = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchStockStatusAll(getAppliedFilterParams());

      if (!allRecords || allRecords.length === 0) {
        showToast('No stock data available to print.', 'error');
        return;
      }

      await printReport(getStockReportOptions(allRecords));
    } catch (err: any) {
      showToast(err.message || 'Failed to print report.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // 2. Download PDF Action: Direct PDF File Download (Stock_List_YYYY-MM-DD.pdf)
  const handleDownloadPDF = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchStockStatusAll(getAppliedFilterParams());

      if (!allRecords || allRecords.length === 0) {
        showToast('No stock data available to export as PDF.', 'error');
        return;
      }

      await downloadReportPdf(getStockReportOptions(allRecords));
    } catch (err: any) {
      showToast(err.message || 'Failed to download PDF.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // 3. Share on WhatsApp Action: Web Share API file attachment or Web link fallback
  const handleShareWhatsApp = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchStockStatusAll(getAppliedFilterParams());

      if (!allRecords || allRecords.length === 0) {
        showToast('No stock data available to share on WhatsApp.', 'error');
        return;
      }

      await shareReportOnWhatsApp(getStockReportOptions(allRecords));
    } catch (err: any) {
      showToast(err.message || 'Failed to share on WhatsApp.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Export PDF legacy alias
  const handleExportPDF = handleDownloadPDF;

  const renderSortIndicator = (col: string) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline opacity-0 group-hover:opacity-100 transition" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 ml-1 inline" />
    );
  };

  const hasActiveFilters = Boolean(appliedSearch || selectedUnit !== 'all' || typeWiseGroup !== 'ALL GROUP' || statusFilter !== 'All' || itemType !== 'All' || selectedItem !== 'ALL ITEM' || dateFilter || withApproval || entryWise || kachiListActive || itemWiseActive);

  // Pagination calculation
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900 flex flex-col font-sans">
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-3 text-sm font-semibold ${toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
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
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1700px] mx-auto w-full space-y-4">
        {/* 1. Header Card (Matching exact design reference) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Blue 3D Cube Icon Container */}
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shadow-blue-500/20 shrink-0">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Stock Management</h1>
              <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5 font-medium">
                <span
                  className="hover:text-blue-600 cursor-pointer"
                  onClick={onBackToDashboard}
                >
                  Dashboard
                </span>
                <span>/</span>
                <span>Stock Management</span>
                <span>/</span>
                <span className="text-slate-700 font-semibold">Stock List</span>
              </div>
            </div>
          </div>

          {/* Green Pill Badge */}
          <div className="px-3.5 py-1 rounded-full bg-[#22c55e] text-white text-xs font-semibold shadow-xs">
            Stock List
          </div>
        </div>

        {/* 2. Main Content Card (Stock List Table, Filters, Actions, Grand Total) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          {/* Card Top Row: Title + Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
            {/* Title with vertical Royal Blue accent bar */}
            <div className="flex items-center space-x-2.5">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Stock List</h2>
            </div>

            {/* Top Action Buttons (Exact sequence from screenshot) */}
            <div className="flex items-center flex-wrap gap-2 print:hidden">
              {/* + Add Stock (Royal Blue Button) */}
              <button
                type="button"
                onClick={handleGoToAdd}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Stock</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                disabled={exporting}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium shadow-2xs transition flex items-center gap-1.5 bg-white cursor-pointer disabled:opacity-50"
                title="Print Stock Report (A4 Landscape, Repeating Headers)"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Print</span>
              </button>

              {/* Download PDF Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={exporting}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium shadow-2xs transition flex items-center gap-1.5 bg-white cursor-pointer disabled:opacity-50"
                title="Download Stock Report PDF"
              >
                <FileText className="w-4 h-4 text-red-600" />
                <span>PDF</span>
              </button>

              {/* Share on WhatsApp Button */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={exporting}
                className="px-3.5 py-2 rounded-lg border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-medium shadow-2xs transition flex items-center gap-1.5 bg-emerald-50/60 cursor-pointer disabled:opacity-50"
                title="Share Stock Report on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={exporting}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium shadow-2xs transition flex items-center gap-1.5 bg-white cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              {/* Export Excel Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium shadow-2xs transition flex items-center gap-1.5 bg-white cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Section */}
          <div className="space-y-3 pt-1 pb-2 print:hidden">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-64 max-w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchSubmit(); } }}
                  placeholder="Search Item Name..."
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button type="button" onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select value={typeWiseGroup} onChange={(e) => { setTypeWiseGroup(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800">
                <option value="ALL GROUP">ALL GROUP</option>
                <option value="Finished">Finished</option>
                <option value="Raw">Raw</option>
                <option value="Unfinish">Unfinish</option>
                <option value="Dust">Dust</option>
                <option value="Quality">Quality</option>
              </select>

              <select value={selectedUnit} onChange={(e) => { setSelectedUnit(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800">
                <option value="all">ALL UNITS</option>
                {availableUnits.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>

              <select value={selectedItem} onChange={(e) => { setSelectedItem(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 max-w-[220px]">
                <option value="ALL ITEM">ALL ITEM</option>
                {availableItems.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>

              <select value={itemType} onChange={(e) => { setItemType(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800">
                {['All', 'Finished', 'Raw', 'Unfinish', 'Dust', 'Quality'].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>

              <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} aria-label="Stock date filter" className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800" />

              <label className="flex items-center gap-1.5 text-xs text-slate-700">
                <input type="checkbox" checked={withApproval} disabled={!filterCapabilities.with_approval} title={!filterCapabilities.with_approval ? 'Approval field is not available in the current stock_status table.' : undefined} onChange={(e) => { setWithApproval(e.target.checked); setCurrentPage(1); }} />
                With Approval
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700">
                <input type="checkbox" checked={entryWise} disabled={!filterCapabilities.entry_wise} title={!filterCapabilities.entry_wise ? 'Entry-wise field is not available in the current stock_status table.' : undefined} onChange={(e) => { setEntryWise(e.target.checked); setCurrentPage(1); }} />
                Entry Wise
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-2">
              <span className="text-xs font-semibold text-slate-500">Stock Status:</span>
              {['In Stock', 'All', 'M.Stock', 'Studed', 'Negative', 'WO Studed', 'Sh/Ex', 'Batch'].map((option) => (
                <label key={option} className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input type="radio" name="stock-status-filter" value={option} checked={statusFilter === option} onChange={() => { setStatusFilter(option); setCurrentPage(1); }} />
                  {option}
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-2">
              <span className="text-xs font-semibold text-slate-500">Item Type:</span>
              {['All', 'Finished', 'Raw', 'Unfinish', 'Dust', 'Quality'].map((option) => (
                <label key={option} className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input type="radio" name="stock-item-type-filter" value={option} checked={itemType === option} onChange={() => { setItemType(option); setCurrentPage(1); }} />
                  {option}
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => { setKachiListActive((v) => !v); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${kachiListActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}>F8 Kachi List</button>
              <button type="button" onClick={() => { setItemWiseActive((v) => !v); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${itemWiseActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}>F5 Item Wise</button>
              <button type="button" onClick={() => { setShowAllRecords(true); setCurrentPage(1); }} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium">All Records</button>
              <button type="button" onClick={() => { setShowAllRecords(false); setCurrentPage(1); }} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium">Paginated</button>
              <button type="button" onClick={() => handleSearchSubmit()} className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" />Filter</button>
              <button type="button" onClick={handleResetFilters} className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-slate-500" />Clear</button>
            </div>
            {/* Show Records Dropdown (Far Right) */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-600 shrink-0">
              <span className="font-medium text-slate-500">Show:</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* API Error Box */}
          {apiError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{apiError}</span>
              </div>
              <button
                type="button"
                onClick={() => loadStockData()}
                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* 3. Stock Data Table (13 Columns in exact order, light grey borders) */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap">
                    {/* 1. Item Name */}
                    <th
                      className="py-2 px-2 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[150px]"
                      onClick={() => handleSort('item_name')}
                    >
                      <span>Item Name</span>
                      {renderSortIndicator('item_name')}
                    </th>

                    {/* 2. Unit */}
                    <th
                      className="py-2 px-2 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[50px]"
                      onClick={() => handleSort('unit')}
                    >
                      <span>Unit</span>
                      {renderSortIndicator('unit')}
                    </th>

                    {/* 3. Pc */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[55px]"
                      onClick={() => handleSort('pc')}
                    >
                      <span>Pc</span>
                      {renderSortIndicator('pc')}
                    </th>

                    {/* 4. Gr.Wt. */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[70px]"
                      onClick={() => handleSort('gross_weight')}
                    >
                      <span>Gr.Wt.</span>
                      {renderSortIndicator('gross_weight')}
                    </th>

                    {/* 5. Net.Wt. */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[70px]"
                      onClick={() => handleSort('net_weight')}
                    >
                      <span>Net.Wt.</span>
                      {renderSortIndicator('net_weight')}
                    </th>

                    {/* 6. Tunch */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[60px]"
                      onClick={() => handleSort('tunch')}
                    >
                      <span>Tunch</span>
                      {renderSortIndicator('tunch')}
                    </th>

                    {/* 7. Wstg */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[55px]"
                      onClick={() => handleSort('wastage')}
                    >
                      <span>Wstg</span>
                      {renderSortIndicator('wastage')}
                    </th>

                    {/* 8. Lbr.Wt */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[60px]"
                      onClick={() => handleSort('labour_weight')}
                    >
                      <span>Lbr.Wt</span>
                      {renderSortIndicator('labour_weight')}
                    </th>

                    {/* 9. Rate */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[65px]"
                      onClick={() => handleSort('rate')}
                    >
                      <span>Rate</span>
                      {renderSortIndicator('rate')}
                    </th>

                    {/* 10. Sil.Fine */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[65px]"
                      onClick={() => handleSort('silver_fine')}
                    >
                      <span>Sil.Fine</span>
                      {renderSortIndicator('silver_fine')}
                    </th>

                    {/* 11. Total */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[75px]"
                      onClick={() => handleSort('total')}
                    >
                      <span>Total</span>
                      {renderSortIndicator('total')}
                    </th>

                    {/* 12. Gold Fine */}
                    <th
                      className="py-2 px-2 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[65px]"
                      onClick={() => handleSort('gold_fine')}
                    >
                      <span>Gold Fine</span>
                      {renderSortIndicator('gold_fine')}
                    </th>

                    {/* 13. Action */}
                    <th className="py-3 px-3 text-center min-w-[110px] print:hidden">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/80">
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="py-14 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                          <span className="text-xs font-semibold">Loading stock records from MySQL stock_status...</span>
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-14 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Package className="w-8 h-8 text-slate-300" />
                          <p className="text-xs font-bold text-slate-700">No stock records found</p>
                          <p className="text-[11px] text-slate-400">
                            {hasActiveFilters
                              ? 'No items match your active search or unit filter.'
                              : 'No records exist in stock_status table.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/30 transition-colors duration-100 group"
                      >
                        {/* 1. Item Name */}
                        <td className="py-2 px-2 border-r border-slate-200 font-bold text-slate-900 uppercase">
                          {item.item_name}
                        </td>

                        {/* 2. Unit */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-700 font-medium">
                          {item.unit || 'Gm'}
                        </td>

                        {/* 3. Pc */}
                        <td
                          className={`py-2 px-2 text-right border-r border-slate-200 font-medium ${item.pc !== null && item.pc < 0 ? 'text-red-600' : 'text-slate-900'
                            }`}
                        >
                          {item.pc !== null ? item.pc : '—'}
                        </td>

                        {/* 4. Gr.Wt. */}
                        <td
                          className={`py-2 px-2 text-right border-r border-slate-200 font-medium ${item.gross_weight !== null && item.gross_weight < 0 ? 'text-red-600' : 'text-slate-900'
                            }`}
                        >
                          {formatNumber(item.gross_weight, 3)}
                        </td>

                        {/* 5. Net.Wt. */}
                        <td
                          className={`py-2 px-2 text-right border-r border-slate-200 font-medium ${item.net_weight !== null && item.net_weight < 0 ? 'text-red-600' : 'text-slate-900'
                            }`}
                        >
                          {formatNumber(item.net_weight, 3)}
                        </td>

                        {/* 6. Tunch */}
                        <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-800">
                          {formatNumber(item.tunch, 2)}
                        </td>

                        {/* 7. Wstg */}
                        <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-800">
                          {formatNumber(item.wastage, 2)}
                        </td>

                        {/* 8. Lbr.Wt */}
                        <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-800">
                          {formatNumber(item.labour_weight, 3)}
                        </td>

                        {/* 9. Rate */}
                        <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-800">
                          {formatNumber(item.rate, 3)}
                        </td>

                        {/* 10. Sil.Fine */}
                        <td
                          className={`py-2 px-2 text-right border-r border-slate-200 font-medium ${item.silver_fine !== null && item.silver_fine < 0 ? 'text-red-600' : 'text-slate-900'
                            }`}
                        >
                          {formatNumber(item.silver_fine, 3)}
                        </td>

                        {/* 11. Total */}
                        <td
                          className={`py-2 px-2 text-right border-r border-slate-200 font-medium ${item.total !== null && item.total < 0 ? 'text-red-600' : 'text-slate-900'
                            }`}
                        >
                          {formatNumber(item.total, 3)}
                        </td>

                        {/* 12. Gold Fine */}
                        <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-800">
                          {formatNumber(item.gold_fine, 3)}
                        </td>

                        {/* 13. Action: Update & Delete buttons */}
                        <td className="py-2 px-2 text-center whitespace-nowrap print:hidden">
                          <div className="flex items-center justify-center space-x-2">
                            {/* Update Button (Royal Blue) */}
                            <button
                              type="button"
                              onClick={() => handleGoToEdit(item.id)}
                              className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Update</span>
                            </button>

                            {/* Delete Button with SweetAlert2 confirmation */}
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              disabled={isDeleting}
                              className="px-2.5 py-1.5 rounded-md bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* 4. GRAND TOTAL FOOTER (Highest Priority: matches exact screenshot) */}
                <tfoot>
                  <tr className="bg-[#fcf8ee] border-t border-b border-[#dfd7c2] text-xs whitespace-nowrap">
                    {/* Item Name: empty cell */}
                    <td className="py-2 px-2.5 border-r border-[#dfd7c2]"></td>

                    {/* Unit: empty cell */}
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>

                    {/* Total Pc Box */}
                    <td className="py-2.5 px-1.5 text-center border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2.5 py-1 font-bold text-slate-900 text-xs sm:text-sm text-center shadow-2xs min-w-[55px] inline-block">
                        {totals.total_pc}
                      </div>
                    </td>

                    {/* Total Gross Weight Box */}
                    <td className="py-2.5 px-1.5 text-right border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2.5 py-1 font-bold text-slate-900 text-xs sm:text-sm text-right shadow-2xs min-w-[70px] inline-block">
                        {formatNumber(totals.total_gross_weight, 3)}
                      </div>
                    </td>

                    {/* Total Net Weight Box */}
                    <td className="py-2.5 px-1.5 text-right border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2.5 py-1 font-bold text-slate-900 text-xs sm:text-sm text-right shadow-2xs min-w-[70px] inline-block">
                        {formatNumber(totals.total_net_weight, 3)}
                      </div>
                    </td>

                    {/* Tunch: empty cell */}
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>

                    {/* Wstg: empty cell */}
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>

                    {/* Lbr.Wt: empty cell */}
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>

                    {/* Rate: empty cell */}
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>

                    {/* Total Silver Fine Box */}
                    <td className="py-2.5 px-1.5 text-right border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2.5 py-1 font-bold text-slate-900 text-xs sm:text-sm text-right shadow-2xs min-w-[65px] inline-block">
                        {formatNumber(totals.total_silver_fine, 3)}
                      </div>
                    </td>

                    {/* Total Amount Box */}
                    <td className="py-2.5 px-1.5 text-right border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2.5 py-1 font-bold text-slate-900 text-xs sm:text-sm text-right shadow-2xs min-w-[65px] inline-block">
                        {Math.round(totals.total_amount)}
                      </div>
                    </td>

                    {/* Gold Fine: empty cell */}
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>

                    {/* Action: empty cell */}
                    <td className="py-2 px-2 border-r border-[#dfd7c2] print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. Pagination Section (Below table) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs sm:text-sm text-slate-600 print:hidden">
            <div>
              <span>
                Showing <strong className="text-slate-900 font-semibold">{startRecord}–{endRecord}</strong> of{' '}
                <strong className="text-slate-900 font-semibold">{totalRecords}</strong> records
              </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-1.5">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>

              {/* Page Number Buttons */}
              {getPageNumbers().map((p, idx) =>
                typeof p === 'number' ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${currentPage === p
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-slate-400">
                    ...
                  </span>
                )
              )}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StockListPage;
