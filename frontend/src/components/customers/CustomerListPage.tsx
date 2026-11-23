import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
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
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import { CustomerRecord, CustomerFilterParams } from '../../types';
import { fetchCustomersApi, deleteCustomerApi } from '../../services/api';
import { CustomerViewModal } from './CustomerViewModal';

interface CustomerListPageProps {
  onBackToDashboard?: () => void;
  onNavigateAdd?: () => void;
  onNavigateEdit?: (id: number) => void;
}

export const CustomerListPage: React.FC<CustomerListPageProps> = ({
  onBackToDashboard,
  onNavigateAdd,
  onNavigateEdit,
}) => {
  const navigate = useNavigate();

  // Data states
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Sorting and pagination
  const [sortBy, setSortBy] = useState<string>('Name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // UI status
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modal states
  const [viewingCustomer, setViewingCustomer] =
    useState<CustomerRecord | null>(null);

  const [deletingCustomer, setDeletingCustomer] =
    useState<CustomerRecord | null>(null);

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteErrorMessage, setDeleteErrorMessage] =
    useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch customers
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    const params: CustomerFilterParams = {
      page: currentPage,
      limit: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    try {
      const res = await fetchCustomersApi(params);

      setCustomers(res.data || []);
      setTotalRecords(res.total || 0);
      setTotalPages(Math.max(1, res.total_pages || 1));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load customers. Please try again.';

      setApiError(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, debouncedSearch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Auto-hide toast
  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((previous) =>
        previous === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }

    setCurrentPage(1);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  // Delete customer
  const handleConfirmDelete = async () => {
    if (!deletingCustomer || isDeleting) return;

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const customerId = deletingCustomer.CustomerID;
      const res = await deleteCustomerApi(customerId);

      setToastMessage({
        type: 'success',
        text:
          res.message ||
          `Customer #${customerId} deleted successfully.`,
      });

      setDeletingCustomer(null);
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to delete customer.';

      setDeleteErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-400 inline-block ml-1 opacity-50" />
      );
    }

    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline-block ml-1" />
    );
  };

  // Pagination bounds
  const startIndex =
    totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const endIndex = Math.min(currentPage * pageSize, totalRecords);

  // Navigation helpers
  const handleAddCustomer = () => {
    if (onNavigateAdd) {
      onNavigateAdd();
    } else {
      navigate('/customers/add');
    }
  };

  const handleEditCustomer = (id: number) => {
    if (onNavigateEdit) {
      onNavigateEdit(id);
    } else {
      navigate(`/customers/edit/${id}`);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-[1600px] mx-auto w-full space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold transition-all transform animate-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
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

      {/* Header Banner & Action Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Title & Breadcrumb */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Customer Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Customer List
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Dashboard &nbsp;/&nbsp; Customer Management &nbsp;/&nbsp;{' '}
                <span className="text-slate-800">Customer List</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              title="Refresh list"
              aria-label="Refresh customer list"
              disabled={loading}
              className="p-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
            </button>

            <button
              type="button"
              onClick={handleAddCustomer}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Section Title Banner with Blue Accent */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Customer List
            </h2>
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

        {/* Search & Filters Section */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Customer */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Customer Name..."
                  className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                  <span className="text-[11px] font-medium text-slate-500">
                    Show:
                  </span>
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
          </div>
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
              onClick={() => void loadData()}
              className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Customer List Table */}
        <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap">
                  <th
                    className="py-3 px-4 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[200px]"
                    onClick={() => handleSort('Name')}
                  >
                    <span>Name</span>
                    {renderSortIndicator('Name')}
                  </th>

                  <th
                    className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[140px]"
                    onClick={() => handleSort('Mobile')}
                  >
                    <span>Mobile</span>
                    {renderSortIndicator('Mobile')}
                  </th>

                  <th
                    className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[140px]"
                    onClick={() => handleSort('City')}
                  >
                    <span>City</span>
                    {renderSortIndicator('City')}
                  </th>

                  <th
                    className="py-3 px-3.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 min-w-[120px]"
                    onClick={() => handleSort('Country')}
                  >
                    <span>Country</span>
                    {renderSortIndicator('Country')}
                  </th>

                  <th className="py-3 px-3 text-center min-w-[200px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                        <span className="text-xs font-semibold text-slate-600">
                          Loading customers...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <span className="text-sm font-semibold text-slate-700">
                          No customers found
                        </span>
                        <p className="text-xs text-slate-400">
                          {debouncedSearch
                            ? `No results matched "${debouncedSearch}". Try clearing your search.`
                            : "You haven't added any customers yet."}
                        </p>
                        {debouncedSearch ? (
                          <button
                            type="button"
                            onClick={handleClearSearch}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition mt-2"
                          >
                            Clear Search
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleAddCustomer}
                            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition mt-2"
                          >
                            Add First Customer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.CustomerID}
                      className="hover:bg-blue-50/30 transition-colors duration-150 text-slate-800"
                    >
                      {/* Name */}
                      <td className="py-3 px-4 border-r border-slate-100 font-semibold text-slate-900">
                        <span>{customer.Name}</span>
                      </td>

                      {/* Mobile */}
                      <td className="py-3 px-3.5 border-r border-slate-100 text-slate-600 whitespace-nowrap">
                        {customer.Mobile || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* City */}
                      <td className="py-3 px-3.5 border-r border-slate-100 font-medium text-slate-700 whitespace-nowrap">
                        {customer.City || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Country */}
                      <td className="py-3 px-3.5 border-r border-slate-100 text-slate-600 whitespace-nowrap">
                        {customer.Country || 'India'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingCustomer(customer)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="View Customer Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleEditCustomer(customer.CustomerID)
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeletingCustomer(customer);
                              setDeleteErrorMessage(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="Delete Customer"
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

          {/* Pagination Footer */}
          <div className="bg-white px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing{' '}
              <span className="font-bold text-slate-900">{startIndex}</span> to{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-900">{totalRecords}</span>{' '}
              records
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
                      {showEllipsis && (
                        <span className="px-1 text-slate-400">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currentPage === p
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
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

      {/* View Customer Modal */}
      <CustomerViewModal
        customer={viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        onEdit={(id) => {
          setViewingCustomer(null);
          handleEditCustomer(id);
        }}
      />

      {/* Delete Customer Confirmation Dialog */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Delete Customer
                </h3>
                <p className="text-xs text-slate-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 text-slate-800">
              <p>
                <span className="font-semibold text-slate-600">
                  Customer Name:
                </span>{' '}
                <span className="font-bold text-slate-900">
                  {deletingCustomer.Name}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-600">
                  Customer ID:
                </span>{' '}
                <span className="font-mono font-semibold text-blue-600">
                  #{deletingCustomer.CustomerID}
                </span>
              </p>
              {deletingCustomer.FirmName && (
                <p>
                  <span className="font-semibold text-slate-600">
                    Firm Name:
                  </span>{' '}
                  <span className="font-semibold">
                    {deletingCustomer.FirmName}
                  </span>
                </p>
              )}
              {deletingCustomer.Mobile && (
                <p>
                  <span className="font-semibold text-slate-600">Mobile:</span>{' '}
                  <span className="font-semibold">
                    {deletingCustomer.Mobile}
                  </span>
                </p>
              )}
              {deletingCustomer.City && (
                <p>
                  <span className="font-semibold text-slate-600">
                    City / Country:
                  </span>{' '}
                  <span className="font-semibold">
                    {deletingCustomer.City},{' '}
                    {deletingCustomer.Country || 'India'}
                  </span>
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
                  setDeletingCustomer(null);
                  setDeleteErrorMessage(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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

export default CustomerListPage;
