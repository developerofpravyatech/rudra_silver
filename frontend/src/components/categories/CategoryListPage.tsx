import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
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
  AlertTriangle,
} from 'lucide-react';
import { CategoryRecord, CategoryFilterParams } from '../../types';
import {
  fetchCategoriesListApi,
  deleteCategoryApi,
  fetchMetalStockFilterOptions,
  fetchAllCategoriesForExportApi,
} from '../../services/api';
import { CategoryViewModal } from './CategoryViewModal';

interface CategoryListPageProps {
  onBackToDashboard?: () => void;
  onNavigateAdd?: () => void;
  onNavigateEdit?: (id: number) => void;
}

export const CategoryListPage: React.FC<CategoryListPageProps> = ({
  onBackToDashboard,
  onNavigateAdd,
  onNavigateEdit,
}) => {
  const navigate = useNavigate();

  // Data states
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [metalItems, setMetalItems] = useState<string[]>([]);

  // Filter form states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [appliedName, setAppliedName] = useState<string>('');
  const [hsnFilter, setHsnFilter] = useState<string>('');
  const [appliedHsn, setAppliedHsn] = useState<string>('');
  const [selectedMetalType, setSelectedMetalType] = useState<string>('all');

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
  const [viewingCategory, setViewingCategory] = useState<CategoryRecord | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Load Metal Types
  useEffect(() => {
    let isMounted = true;
    fetchMetalStockFilterOptions()
      .then((opts) => {
        if (isMounted) setMetalItems(opts.items || []);
      })
      .catch((err) => console.error('Failed to load metal stock items:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch paginated categories
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    const params: CategoryFilterParams = {
      page: currentPage,
      limit: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    if (appliedSearch.trim()) params.search = appliedSearch.trim();
    if (appliedName.trim()) params.name = appliedName.trim();
    if (appliedHsn.trim()) params.hsn_code = appliedHsn.trim();
    if (selectedMetalType !== 'all') params.metal_type = selectedMetalType;

    try {
      const res = await fetchCategoriesListApi(params);
      setCategories(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load categories. Please try again.');
      setCategories([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, appliedSearch, appliedName, appliedHsn, selectedMetalType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toast Helper
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter handlers
  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchQuery);
    setAppliedName(nameFilter);
    setAppliedHsn(hsnFilter);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setNameFilter('');
    setAppliedName('');
    setHsnFilter('');
    setAppliedHsn('');
    setSelectedMetalType('all');
    setSortBy('id');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  // Sorting
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
      navigate('/categories/add');
    }
  };

  const handleGoToEdit = (id: number) => {
    if (onNavigateEdit) {
      onNavigateEdit(id);
    } else {
      navigate(`/categories/edit/${id}`);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const res = await deleteCategoryApi(deletingCategory.id);
      
      // Handle both direct API response and alternative endpoint response
      const message = res.message || `Category '${deletingCategory.name}' deleted successfully.`;
      showToast('success', message);
      setDeletingCategory(null);
      loadData();
    } catch (err: any) {
      setDeleteErrorMessage(err.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Render Metal Badge
  const renderMetalBadge = (metal: string) => {
    const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
      SILVER: { label: 'Silver', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
      GOLD: { label: 'Gold', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
      PLATINUM: { label: 'Platinum', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300' },
      DIAMOND: { label: 'Diamond', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
    };
    const b = map[metal.toUpperCase()] || { label: metal, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${b.bg} ${b.text} ${b.border}`}>
        {b.label}
      </span>
    );
  };

  // Export handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const allData = await fetchAllCategoriesForExportApi({
        search: appliedSearch || undefined,
        name: appliedName || undefined,
        hsn_code: appliedHsn || undefined,
        metal_type: selectedMetalType !== 'all' ? selectedMetalType : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (!allData || allData.length === 0) {
        showToast('error', 'No records to export.');
        return;
      }

      const headers = ['ID', 'Metal Type', 'Category Name', 'HSN Code', 'Associated Items'];
      const rows = allData.map((c) => [
        c.id,
        `"${c.metal_type}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${c.hsn_code || ''}"`,
        c.item_count || 0,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Categories_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('success', `Exported ${allData.length} category records to CSV.`);
    } catch (err: any) {
      showToast('error', err.message || 'CSV Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const allData = await fetchAllCategoriesForExportApi({
        search: appliedSearch || undefined,
        name: appliedName || undefined,
        hsn_code: appliedHsn || undefined,
        metal_type: selectedMetalType !== 'all' ? selectedMetalType : undefined,
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
        <h2>RUDRA SILVER ERP - CATEGORY LIST</h2>
        <table border="1">
          <thead>
            <tr style="background-color: #2563eb; color: #ffffff; font-weight: bold;">
              <th>ID</th>
              <th>Metal Type</th>
              <th>Category Name</th>
              <th>HSN Code</th>
              <th>Associated Items</th>
            </tr>
          </thead>
          <tbody>
      `;

      allData.forEach((c) => {
        tableHtml += `
          <tr>
            <td>${c.id}</td>
            <td>${c.metal_type}</td>
            <td>${c.name}</td>
            <td>${c.hsn_code || ''}</td>
            <td>${c.item_count || 0}</td>
          </tr>
        `;
      });

      tableHtml += `</tbody></table></body></html>`;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Categories_${new Date().toISOString().split('T')[0]}.xls`;
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

  const handleExportPDF = () => {
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
    <div className="flex-1 p-4 sm:p-6 max-w-[1600px] mx-auto w-full space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold transition-all transform animate-in slide-in-from-top-3 ${toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
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
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Category Management</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Category List
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Dashboard &nbsp;/&nbsp; Category Management &nbsp;/&nbsp;{' '}
                <span className="text-slate-800">Category List</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Add Category, Print, Export CSV, PDF, Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGoToAdd}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Section Title Banner with Blue Accent */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Category List</h2>
            <span className="text-xs font-medium text-slate-500">
              ({totalRecords} {totalRecords === 1 ? 'record' : 'records'})
            </span>
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

        {/* 2. Search & Filters Section */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <form onSubmit={handleApplyFilters} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Category Name */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Search Category Name..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
                />
              </div>



              {/* Metal Type Filter Dropdown */}
              <div className="relative">
                <select
                  value={selectedMetalType}
                  onChange={(e) => setSelectedMetalType(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All Metal Types</option>
                  {metalItems.map((it) => (
                    <option key={it} value={it}>
                      {it}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Buttons: Filter, Clear, Show Page Size */}
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium shadow-2xs transition flex items-center gap-1 bg-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clear</span>
                </button>

                <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                  <span className="text-[11px] font-medium text-slate-500">Show:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="appearance-none pl-2 pr-6 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
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

        {/* 3. Category List Table (5 Columns, Spec Order) */}
        <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap">
                  {/* 1. ID */}
                  <th
                    className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 w-20 text-center"
                    onClick={() => handleSort('id')}
                  >
                    <span>ID</span>
                    {renderSortIndicator('id')}
                  </th>

                  {/* 2. Metal Type */}
                  <th
                    className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[140px]"
                    onClick={() => handleSort('metal_type')}
                  >
                    <span>Metal Type</span>
                    {renderSortIndicator('metal_type')}
                  </th>

                  {/* 3. Category Name */}
                  <th
                    className="py-3 px-4 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[250px]"
                    onClick={() => handleSort('name')}
                  >
                    <span>Category Name</span>
                    {renderSortIndicator('name')}
                  </th>

                  {/* 4. HSN Code */}
                  <th
                    className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[120px]"
                    onClick={() => handleSort('hsn_code')}
                  >
                    <span>HSN Code</span>
                    {renderSortIndicator('hsn_code')}
                  </th>

                  {/* 5. Action */}
                  <th className="py-3 px-3 text-center min-w-[200px]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                        <span className="text-xs font-semibold text-slate-600">Loading categories...</span>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Tag className="w-8 h-8 text-slate-300" />
                        <span className="text-sm font-semibold text-slate-700">No categories found</span>
                        <p className="text-xs text-slate-400">
                          Try adjusting your search criteria or add a new category.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-blue-50/30 transition-colors duration-150 text-slate-800"
                    >
                      {/* 1. ID */}
                      <td className="py-3 px-3.5 text-center border-r border-slate-100 font-mono text-xs text-slate-600 font-bold">
                        #{cat.id}
                      </td>

                      {/* 2. Metal Type */}
                      <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                        {renderMetalBadge(cat.metal_type)}
                      </td>

                      {/* 3. Category Name */}
                      <td className="py-3 px-4 border-r border-slate-100 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span>{cat.name}</span>
                          {cat.item_count !== undefined && cat.item_count > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {cat.item_count} items
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. HSN Code */}
                      <td className="py-3 px-3.5 border-r border-slate-100 font-mono text-xs text-slate-700">
                        {cat.hsn_code || '7113'}
                      </td>

                      {/* 5. Action: View / Edit / Delete */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingCategory(cat)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="View Category"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGoToEdit(cat.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeletingCategory(cat);
                              setDeleteErrorMessage(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="Delete Category"
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
            </table>
          </div>

          {/* 4. Pagination Footer */}
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

      {/* View Category Modal */}
      {viewingCategory && (
        <CategoryViewModal
          category={viewingCategory}
          onClose={() => setViewingCategory(null)}
          onEdit={(id) => handleGoToEdit(id)}
        />
      )}

      {/* Delete Category Confirmation Dialog */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Category</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 text-slate-800">
              <p>
                <span className="font-semibold text-slate-600">Category Name:</span>{' '}
                <span className="font-bold text-slate-900">{deletingCategory.name}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-600">Metal Type:</span>{' '}
                <span className="font-semibold">{deletingCategory.metal_type}</span>
              </p>
              {deletingCategory.item_count !== undefined && deletingCategory.item_count > 0 && (
                <p className="text-red-600 font-semibold pt-1 border-t border-slate-200">
                  Note: Referenced by {deletingCategory.item_count} item(s) in the item master.
                </p>
              )}
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
                  setDeletingCategory(null);
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
