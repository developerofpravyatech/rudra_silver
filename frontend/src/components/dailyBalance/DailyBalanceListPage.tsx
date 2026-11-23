import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Scale,
  AlertCircle,
  CheckCircle2,
  Package,
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
  });

  // Filter form states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [balanceFilter, setBalanceFilter] = useState<string>('all');

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
  const [viewingItem, setViewingItem] = useState<DailyBalanceRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<DailyBalanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch filter options on mount
  useEffect(() => {
    fetchDailyBalanceFilterOptions()
      .then(setFilterOptions)
      .catch((err) => console.error('Failed to load daily balance options:', err));
  }, []);

  // Fetch data with server-side pagination & SQL grand totals
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const params: DailyBalanceFilterParams = {
        search: appliedSearch || undefined,
        city: selectedCity !== 'all' ? selectedCity : undefined,
        state: selectedState !== 'all' ? selectedState : undefined,
        group_id: selectedGroupId !== 'all' ? selectedGroupId : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        balance_filter: balanceFilter !== 'all' ? balanceFilter : undefined,
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
    selectedCity,
    selectedState,
    selectedGroupId,
    fromDate,
    toDate,
    balanceFilter,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toast helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Submit filter / search
  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchQuery.trim());
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setSelectedCity('all');
    setSelectedState('all');
    setSelectedGroupId('all');
    setFromDate('');
    setToDate('');
    setBalanceFilter('all');
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

  // Navigation handlers
  const handleGoToAdd = () => {
    if (onNavigateAdd) {
      onNavigateAdd();
    } else {
      navigate('/daily-balance/add');
    }
  };

  const handleGoToEdit = (id: number) => {
    if (onNavigateEdit) {
      onNavigateEdit(id);
    } else {
      navigate(`/daily-balance/edit/${id}`);
    }
  };

  // Delete action
  const confirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await deleteDailyBalance(deletingItem.id);
      showToast(`Daily balance record for "${deletingItem.account_name}" deleted.`);
      setDeletingItem(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format numbers preserving decimals and negative balances
  const formatNumber = (val: number | null | undefined, decimals = 3): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return '—';
    return Number(val).toFixed(decimals);
  };

  // Filter params helper for exports
  const getExportParams = (): DailyBalanceFilterParams => ({
    search: appliedSearch || undefined,
    city: selectedCity !== 'all' ? selectedCity : undefined,
    state: selectedState !== 'all' ? selectedState : undefined,
    group_id: selectedGroupId !== 'all' ? selectedGroupId : undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    balance_filter: balanceFilter !== 'all' ? balanceFilter : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  // Exports
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchDailyBalanceAll(getExportParams());
      if (!allRecords || allRecords.length === 0) {
        showToast('No daily balance records available to export.', 'error');
        return;
      }

      const headers = [
        'A/c Name',
        'City',
        'Mobile',
        'Phone',
        'Bal.Date',
        'Pay Date',
        'Gold Fine',
        'Sil.Fine',
        'Amount',
        'Dia.Wt.',
        'Stn.Wt.',
        'Gr.Wt. [G]',
        'Gr.Wt. [S]',
      ];

      const rows = allRecords.map((item) => [
        `"${(item.account_name || '').replace(/"/g, '""')}"`,
        `"${item.city || ''}"`,
        `"${item.mobile || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.balance_date || ''}"`,
        `"${item.payment_date || ''}"`,
        item.gold_fine,
        item.silver_fine,
        item.amount,
        item.diamond_weight,
        item.stone_weight,
        item.gold_gross_weight,
        item.silver_gross_weight,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rudra_Silver_Daily_Balance_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${allRecords.length} daily balance records to CSV.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to export CSV.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchDailyBalanceAll(getExportParams());
      if (!allRecords || allRecords.length === 0) {
        showToast('No daily balance records available to export.', 'error');
        return;
      }

      let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
      html += '<head><meta charset="utf-8"/><style>th { background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; } td { border: 1px solid #e2e8f0; }</style></head><body>';
      html += '<table><thead><tr>';
      html += '<th>A/c Name</th><th>City</th><th>Mobile</th><th>Phone</th><th>Bal.Date</th><th>Pay Date</th><th>Gold Fine</th><th>Sil.Fine</th><th>Amount</th><th>Dia.Wt.</th><th>Stn.Wt.</th><th>Gr.Wt. [G]</th><th>Gr.Wt. [S]</th>';
      html += '</tr></thead><tbody>';

      allRecords.forEach((item) => {
        html += `<tr>
          <td>${item.account_name}</td>
          <td>${item.city || ''}</td>
          <td>${item.mobile || ''}</td>
          <td>${item.phone || ''}</td>
          <td>${item.balance_date || ''}</td>
          <td>${item.payment_date || ''}</td>
          <td>${item.gold_fine}</td>
          <td>${item.silver_fine}</td>
          <td>${item.amount}</td>
          <td>${item.diamond_weight}</td>
          <td>${item.stone_weight}</td>
          <td>${item.gold_gross_weight}</td>
          <td>${item.silver_gross_weight}</td>
        </tr>`;
      });

      html += `<tr style="font-weight:bold; background-color:#e2e8f0;">
        <td>GRAND TOTAL</td>
        <td></td><td></td><td></td><td></td><td></td>
        <td>${totals.total_gold_fine}</td>
        <td>${totals.total_silver_fine}</td>
        <td>${totals.total_amount}</td>
        <td>${totals.total_diamond_weight}</td>
        <td>${totals.total_stone_weight}</td>
        <td>${totals.total_gold_gross_weight}</td>
        <td>${totals.total_silver_gross_weight}</td>
      </tr>`;

      html += '</tbody></table></body></html>';

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rudra_Silver_Daily_Balance_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Exported ${allRecords.length} daily balance records to Excel.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to export Excel.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const allRecords = await fetchDailyBalanceAll(getExportParams());
      if (!allRecords || allRecords.length === 0) {
        showToast('No daily balance records available to export.', 'error');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Pop-up blocked. Please allow pop-ups for PDF export.', 'error');
        return;
      }

      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Daily Balance - Rudra Silver ERP</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; color: #1e293b; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
            .title { font-size: 16px; font-weight: bold; color: #1e293b; }
            .subtitle { font-size: 10px; color: #64748b; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 9px; }
            th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 4px; font-weight: bold; text-align: right; }
            th:first-child, td:first-child { text-align: left; }
            th:nth-child(2), td:nth-child(2) { text-align: left; }
            th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4), th:nth-child(5), td:nth-child(5), th:nth-child(6), td:nth-child(6) { text-align: center; }
            td { border: 1px solid #e2e8f0; padding: 5px 4px; text-align: right; }
            .total-row { background: #fcf8ee; font-weight: bold; border-top: 2px solid #cbd5e1; }
            .total-box { display: inline-block; background: #fff; border: 1px solid #94a3b8; border-radius: 3px; padding: 2px 6px; }
            .negative { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">RUDRA SILVER ERP – DAILY BALANCE REPORT</div>
              <div class="subtitle">Generated on: ${new Date().toLocaleString()} | Total Records: ${allRecords.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>A/c Name</th>
                <th>City</th>
                <th>Mobile</th>
                <th>Phone</th>
                <th>Bal.Date</th>
                <th>Pay Date</th>
                <th>Gold Fine</th>
                <th>Sil.Fine</th>
                <th>Amount</th>
                <th>Dia.Wt.</th>
                <th>Stn.Wt.</th>
                <th>Gr.Wt. [G]</th>
                <th>Gr.Wt. [S]</th>
              </tr>
            </thead>
            <tbody>
              ${allRecords.map(item => `
                <tr>
                  <td>${item.account_name}</td>
                  <td>${item.city || '—'}</td>
                  <td>${item.mobile || '—'}</td>
                  <td>${item.phone || '—'}</td>
                  <td>${item.balance_date || '—'}</td>
                  <td>${item.payment_date || '—'}</td>
                  <td>${formatNumber(item.gold_fine, 3)}</td>
                  <td class="${item.silver_fine < 0 ? 'negative' : ''}">${formatNumber(item.silver_fine, 3)}</td>
                  <td class="${item.amount < 0 ? 'negative' : ''}">${formatNumber(item.amount, 2)}</td>
                  <td>${formatNumber(item.diamond_weight, 3)}</td>
                  <td>${formatNumber(item.stone_weight, 3)}</td>
                  <td>${formatNumber(item.gold_gross_weight, 3)}</td>
                  <td>${formatNumber(item.silver_gross_weight, 3)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td>GRAND TOTAL</td>
                <td></td><td></td><td></td><td></td><td></td>
                <td><span class="total-box">${formatNumber(totals.total_gold_fine, 3)}</span></td>
                <td><span class="total-box ${totals.total_silver_fine < 0 ? 'negative' : ''}">${formatNumber(totals.total_silver_fine, 3)}</span></td>
                <td><span class="total-box ${totals.total_amount < 0 ? 'negative' : ''}">${formatNumber(totals.total_amount, 2)}</span></td>
                <td><span class="total-box">${formatNumber(totals.total_diamond_weight, 3)}</span></td>
                <td><span class="total-box">${formatNumber(totals.total_stone_weight, 3)}</span></td>
                <td><span class="total-box">${formatNumber(totals.total_gold_gross_weight, 3)}</span></td>
                <td><span class="total-box">${formatNumber(totals.total_silver_gross_weight, 3)}</span></td>
              </tr>
            </tfoot>
          </table>
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(content);
      printWindow.document.close();
      showToast(`Generated printable PDF with ${allRecords.length} daily balance records.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to export PDF.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSortIndicator = (col: string) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline opacity-0 group-hover:opacity-100 transition" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 ml-1 inline" />
    );
  };

  const hasActiveFilters = Boolean(
    appliedSearch ||
    selectedCity !== 'all' ||
    selectedState !== 'all' ||
    selectedGroupId !== 'all' ||
    fromDate ||
    toDate ||
    balanceFilter !== 'all'
  );

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

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
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1850px] mx-auto w-full space-y-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Daily Balance</h1>
              <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5 font-medium">
                <span className="hover:text-blue-600 cursor-pointer" onClick={onBackToDashboard}>
                  Dashboard
                </span>
                <span>/</span>
                <span>Reports</span>
                <span>/</span>
                <span className="text-slate-700 font-semibold">Daily Balance List</span>
              </div>
            </div>
          </div>

          <div className="px-3.5 py-1 rounded-full bg-[#22c55e] text-white text-xs font-semibold shadow-xs">
            Daily Balance
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          {/* Card Top Row: Title + Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Daily Balance Sheet</h2>
            </div>

            <div className="flex items-center flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={handleGoToAdd}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Daily Balance</span>
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

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={exporting}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium shadow-2xs transition flex items-center gap-1.5 bg-white cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-red-600" />
                <span>Export PDF</span>
              </button>

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

          {/* Filters Section (Spec Section 4) */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 space-y-3 print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 items-end">
              {/* Date From */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* State Wise */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">State Wise</label>
                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">All States</option>
                    {filterOptions.states.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Location / City */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Location / City</label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">All Cities</option>
                    {filterOptions.cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Group */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Group</label>
                <div className="relative">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => {
                      setSelectedGroupId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">All Groups</option>
                    {filterOptions.groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Balance Filter Flag (With Balance, Zero Balance, Dia/Stn) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Balance Type</label>
                <div className="relative">
                  <select
                    value={balanceFilter}
                    onChange={(e) => {
                      setBalanceFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">All Balances</option>
                    <option value="with_balance">With Balance</option>
                    <option value="zero_balance">Zero Balance</option>
                    <option value="dia_stn_balance">Dia / Stn Balance</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Search by A/c Name, City, Mobile */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyFilters();
                      }
                    }}
                    placeholder="A/c, City, Phone..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setAppliedSearch('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span>Active Records: <strong className="text-slate-900 font-bold">{totalRecords}</strong></span>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => handleApplyFilters()}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium shadow-2xs transition flex items-center gap-1 bg-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clear</span>
                </button>

                <div className="flex items-center space-x-1.5 text-xs text-slate-600 pl-3 border-l border-slate-200">
                  <span className="font-medium text-slate-500">Show:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="appearance-none pl-2.5 pr-6 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                onClick={() => loadData()}
                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* 3. Daily Balance Table (14 Columns, Exact Order, Horizontal Scroll) */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[1400px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap">
                    {/* 1. A/c Name */}
                    <th
                      className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[200px]"
                      onClick={() => handleSort('account_name')}
                    >
                      <span>A/c Name</span>
                      {renderSortIndicator('account_name')}
                    </th>

                    {/* 2. City */}
                    <th
                      className="py-3 px-2.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[110px]"
                      onClick={() => handleSort('city')}
                    >
                      <span>City</span>
                      {renderSortIndicator('city')}
                    </th>

                    {/* 3. Mobile */}
                    <th
                      className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[105px]"
                      onClick={() => handleSort('mobile')}
                    >
                      <span>Mobile</span>
                      {renderSortIndicator('mobile')}
                    </th>

                    {/* 4. Phone */}
                    <th
                      className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[95px]"
                      onClick={() => handleSort('phone')}
                    >
                      <span>Phone</span>
                      {renderSortIndicator('phone')}
                    </th>

                    {/* 5. Bal.Date */}
                    <th
                      className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[95px]"
                      onClick={() => handleSort('balance_date')}
                    >
                      <span>Bal.Date</span>
                      {renderSortIndicator('balance_date')}
                    </th>

                    {/* 6. Pay Date */}
                    <th
                      className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[95px]"
                      onClick={() => handleSort('payment_date')}
                    >
                      <span>Pay Date</span>
                      {renderSortIndicator('payment_date')}
                    </th>

                    {/* 7. Gold Fine */}
                    <th
                      className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[85px]"
                      onClick={() => handleSort('gold_fine')}
                    >
                      <span>Gold Fine</span>
                      {renderSortIndicator('gold_fine')}
                    </th>

                    {/* 8. Sil.Fine */}
                    <th
                      className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[90px]"
                      onClick={() => handleSort('silver_fine')}
                    >
                      <span>Sil.Fine</span>
                      {renderSortIndicator('silver_fine')}
                    </th>

                    {/* 9. Amount */}
                    <th
                      className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[100px]"
                      onClick={() => handleSort('amount')}
                    >
                      <span>Amount</span>
                      {renderSortIndicator('amount')}
                    </th>

                    {/* 10. Dia.Wt. */}
                    <th
                      className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[80px]"
                      onClick={() => handleSort('diamond_weight')}
                    >
                      <span>Dia.Wt.</span>
                      {renderSortIndicator('diamond_weight')}
                    </th>

                    {/* 11. Stn.Wt. */}
                    <th
                      className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[80px]"
                      onClick={() => handleSort('stone_weight')}
                    >
                      <span>Stn.Wt.</span>
                      {renderSortIndicator('stone_weight')}
                    </th>

                    {/* 12. Gr.Wt. [G] */}
                    <th
                      className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[85px]"
                      onClick={() => handleSort('gold_gross_weight')}
                    >
                      <span>Gr.Wt. [G]</span>
                      {renderSortIndicator('gold_gross_weight')}
                    </th>

                    {/* 13. Gr.Wt. [S] */}
                    <th
                      className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[85px]"
                      onClick={() => handleSort('silver_gross_weight')}
                    >
                      <span>Gr.Wt. [S]</span>
                      {renderSortIndicator('silver_gross_weight')}
                    </th>

                    {/* 14. Action */}
                    <th className="py-3 px-3 text-center min-w-[210px] print:hidden">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/80">
                  {loading ? (
                    <tr>
                      <td colSpan={14} className="py-14 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                          <span className="text-xs font-semibold">Loading daily balance records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-14 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Package className="w-8 h-8 text-slate-300" />
                          <p className="text-xs font-bold text-slate-700">No daily balance records found</p>
                          <p className="text-[11px] text-slate-400">
                            {hasActiveFilters
                              ? 'No records match your active search or filter criteria.'
                              : 'No entries exist in the daily_balance database.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/30 transition-colors duration-100 group whitespace-nowrap"
                      >
                        {/* 1. A/c Name */}
                        <td className="py-3 px-3.5 border-r border-slate-200 font-bold text-slate-900 uppercase">
                          {item.account_name}
                        </td>

                        {/* 2. City */}
                        <td className="py-3 px-2.5 border-r border-slate-200 text-slate-700 font-medium uppercase">
                          {item.city || '—'}
                        </td>

                        {/* 3. Mobile */}
                        <td className="py-3 px-2.5 text-center border-r border-slate-200 text-slate-700 font-mono">
                          {item.mobile || '—'}
                        </td>

                        {/* 4. Phone */}
                        <td className="py-3 px-2.5 text-center border-r border-slate-200 text-slate-700 font-mono">
                          {item.phone || '—'}
                        </td>

                        {/* 5. Bal.Date */}
                        <td className="py-3 px-2.5 text-center border-r border-slate-200 text-slate-700 font-mono text-xs">
                          {item.balance_date || '—'}
                        </td>

                        {/* 6. Pay Date */}
                        <td className="py-3 px-2.5 text-center border-r border-slate-200 text-slate-700 font-mono text-xs">
                          {item.payment_date || '—'}
                        </td>

                        {/* 7. Gold Fine */}
                        <td className={`py-3 px-2.5 text-right border-r border-slate-200 font-mono font-medium ${item.gold_fine < 0 ? 'text-red-600' : 'text-slate-900'
                          }`}>
                          {formatNumber(item.gold_fine, 3)}
                        </td>

                        {/* 8. Sil.Fine (Preserves Negative Balances) */}
                        <td className={`py-3 px-2.5 text-right border-r border-slate-200 font-mono font-bold ${item.silver_fine < 0 ? 'text-red-600 font-extrabold' : 'text-slate-900'
                          }`}>
                          {formatNumber(item.silver_fine, 3)}
                        </td>

                        {/* 9. Amount (Preserves Negative Balances) */}
                        <td className={`py-3 px-2.5 text-right border-r border-slate-200 font-mono font-bold ${item.amount < 0 ? 'text-red-600 font-extrabold' : 'text-emerald-800'
                          }`}>
                          {formatNumber(item.amount, 2)}
                        </td>

                        {/* 10. Dia.Wt. */}
                        <td className="py-3 px-2.5 text-right border-r border-slate-200 text-slate-800 font-mono">
                          {formatNumber(item.diamond_weight, 3)}
                        </td>

                        {/* 11. Stn.Wt. */}
                        <td className="py-3 px-2.5 text-right border-r border-slate-200 text-slate-800 font-mono">
                          {formatNumber(item.stone_weight, 3)}
                        </td>

                        {/* 12. Gr.Wt. [G] */}
                        <td className="py-3 px-2.5 text-right border-r border-slate-200 text-slate-800 font-mono">
                          {formatNumber(item.gold_gross_weight, 3)}
                        </td>

                        {/* 13. Gr.Wt. [S] */}
                        <td className="py-3 px-2.5 text-right border-r border-slate-200 text-slate-800 font-mono">
                          {formatNumber(item.silver_gross_weight, 3)}
                        </td>

                        {/* 14. Action: View, Edit, Delete */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap print:hidden">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingItem(item)}
                              className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGoToEdit(item.id)}
                              className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="px-2.5 py-1.5 rounded-md bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                              title="Delete Record"
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

                {/* 4. Grand Total / Summary Footer (Spec Section 9: Preserves Negatives) */}
                <tfoot>
                  <tr className="bg-[#fcf8ee] border-t border-b border-[#dfd7c2] text-xs whitespace-nowrap">
                    {/* A/c Name */}
                    <td className="py-2.5 px-3.5 border-r border-[#dfd7c2] font-bold text-slate-800">
                      Grand Total
                    </td>

                    {/* City, Mobile, Phone, Bal.Date, Pay Date (empty) */}
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>
                    <td className="py-2.5 px-2.5 border-r border-[#dfd7c2]"></td>

                    {/* Total Gold Fine */}
                    <td className="py-2.5 px-1 text-right border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-xs sm:text-sm text-right shadow-2xs min-w-[75px] inline-block">
                        {formatNumber(totals.total_gold_fine, 3)}
                      </div>
                    </td>

                    {/* Total Silver Fine (Negative preserved) */}
                    <td className="py-2.5 px-1 text-right border-r border-[#dfd7c2]">
                      <div className={`bg-white border border-slate-300 rounded px-2 py-1 font-bold text-xs sm:text-sm text-right shadow-2xs min-w-[85px] inline-block ${totals.total_silver_fine < 0 ? 'text-red-600' : 'text-slate-900'
                        }`}>
                        {formatNumber(totals.total_silver_fine, 3)}
                      </div>
                    </td>

                    {/* Total Amount (Negative preserved) */}
                    <td className="py-2.5 px-1 text-right border-r border-[#dfd7c2]">
                      <div className={`bg-white border border-slate-300 rounded px-2 py-1 font-bold text-xs sm:text-sm text-right shadow-2xs min-w-[95px] inline-block ${totals.total_amount < 0 ? 'text-red-600' : 'text-emerald-800'
                        }`}>
                        {formatNumber(totals.total_amount, 2)}
                      </div>
                    </td>

                    {/* Total Dia.Wt. */}
                    <td className="py-2.5 px-1 text-right border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-xs sm:text-sm text-right shadow-2xs min-w-[70px] inline-block">
                        {formatNumber(totals.total_diamond_weight, 3)}
                      </div>
                    </td>

                    {/* Total Stn.Wt. */}
                    <td className="py-2.5 px-1 text-right border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-xs sm:text-sm text-right shadow-2xs min-w-[70px] inline-block">
                        {formatNumber(totals.total_stone_weight, 3)}
                      </div>
                    </td>

                    {/* Total Gr.Wt. [G] */}
                    <td className="py-2.5 px-1 text-right border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-xs sm:text-sm text-right shadow-2xs min-w-[75px] inline-block">
                        {formatNumber(totals.total_gold_gross_weight, 3)}
                      </div>
                    </td>

                    {/* Total Gr.Wt. [S] */}
                    <td className="py-2.5 px-1 text-right border-r border-[#dfd7c2]">
                      <div className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-xs sm:text-sm text-right shadow-2xs min-w-[75px] inline-block">
                        {formatNumber(totals.total_silver_gross_weight, 3)}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 border-r border-[#dfd7c2] print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. Pagination Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs sm:text-sm text-slate-600 print:hidden">
            <div>
              <span>
                Showing <strong className="text-slate-900 font-semibold">{startRecord}–{endRecord}</strong> of{' '}
                <strong className="text-slate-900 font-semibold">{totalRecords}</strong> records
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>

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

      {/* View Detail Modal */}
      {viewingItem && (
        <DailyBalanceViewModal item={viewingItem} onClose={() => setViewingItem(null)} />
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Delete Daily Balance Record</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete the daily balance entry for{' '}
                  <strong className="text-slate-800">"{deletingItem.account_name}"</strong> (ID: #{deletingItem.id})? This will permanently remove it from the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">daily_balance</code> table.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Record</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DailyBalanceListPage;
