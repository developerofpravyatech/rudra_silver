import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  FileSpreadsheet,
  Tag,
  Calculator,
  RefreshCw,
  Award,
  Layers
} from 'lucide-react';
import { ItemRecord } from '../types';
import { fetchItemsApi, deleteItemApi } from '../services/api';

interface ItemListPageProps {
  onAddNew: () => void;
  onEditItem: (item: ItemRecord) => void;
}

export const ItemListPage: React.FC<ItemListPageProps> = ({ onAddNew, onEditItem }) => {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [hsnSearch, setHsnSearch] = useState('');

  // Modals
  const [viewingItem, setViewingItem] = useState<ItemRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchItemsApi({
        search: search.trim() || undefined,
        group_name: groupSearch.trim() || undefined,
        hsn_code: hsnSearch.trim() || undefined,
        page,
        limit,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load items list.');
    } finally {
      setLoading(false);
    }
  }, [search, groupSearch, hsnSearch, page, limit]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleResetFilters = () => {
    setSearch('');
    setGroupSearch('');
    setHsnSearch('');
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteItemApi(deletingItem.id);
      setActionSuccess(`Item '${deletingItem.group_name}' (ID #${deletingItem.id}) deleted successfully.`);
      setDeletingItem(null);
      setTimeout(() => setActionSuccess(null), 3500);
      loadItems();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete item.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      {/* Luxury Container */}
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 bg-white dark:bg-[#0c0f16]">
        {/* Header Bar */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex flex-wrap justify-between items-center gap-4 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-display font-bold text-base tracking-wide text-slate-900 dark:text-white">
                  Item List
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                  {total} Groups Total
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Item Types, Group Classifications, Tax Rates, MRP Valuations &amp; Policy Rules
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onAddNew}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] hover:brightness-105 active:scale-[0.99] text-slate-950 font-bold text-xs tracking-wide shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#10141f] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search by Group Name */}
            <div className="relative w-56">
              <input
                type="text"
                placeholder="Search Group Name..."
                value={groupSearch}
                onChange={(e) => {
                  setGroupSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 pl-8 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Search by HSN Code */}
            <div className="relative w-44">
              <input
                type="text"
                placeholder="Search HSN Code..."
                value={hsnSearch}
                onChange={(e) => {
                  setHsnSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 pl-8 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* General Search */}
            <div className="relative w-56">
              <input
                type="text"
                placeholder="Filter all fields..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 pl-8 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {(search || groupSearch || hsnSearch) && (
              <button
                onClick={handleResetFilters}
                className="p-2 rounded-lg border border-slate-300 dark:border-white/[0.1] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Rows per page */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0b0e14] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Data Table with Full Horizontal Scrolling for all columns from BOTH screenshots */}
        <div className="overflow-x-auto relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-[#0c0f16]/70 z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading Items from MySQL...</span>
              </div>
            </div>
          )}

          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-white/[0.08]">
                <th className="p-3 sticky left-0 z-20 bg-slate-100 dark:bg-[#0b0e14] text-center w-12">#</th>
                <th className="p-3 sticky left-12 z-20 bg-slate-100 dark:bg-[#0b0e14]">Group Name</th>
                <th className="p-3 text-right">SGST (%)</th>
                <th className="p-3 text-right">CGST (%)</th>
                <th className="p-3 text-right">IGST (%)</th>
                <th className="p-3 text-center">HSN Code</th>
                <th className="p-3">Job SAC</th>
                <th className="p-3">GSTR-1</th>
                <th className="p-3 text-right">L.Tax (%)</th>
                <th className="p-3 text-right">C.Tax (%)</th>
                <th className="p-3">Com.Co</th>
                <th className="p-3 text-right">GP %</th>
                <th className="p-3 text-right">Opening Value</th>
                <th className="p-3 text-right">Closing Value</th>
                <th className="p-3 text-center">Min Stock</th>

                {/* MRP Detail Columns */}
                <th className="p-3">MRP Type</th>
                <th className="p-3 text-right">Value Rate</th>
                <th className="p-3">Stock Method</th>
                <th className="p-3 text-right">Tunch (%)</th>
                <th className="p-3">Default Item</th>

                {/* Return / Exchange Policy Columns */}
                <th className="p-3 text-center">Return Window</th>
                <th className="p-3 text-center">Exchange Window</th>

                {/* Tag & Loyalty Columns */}
                <th className="p-3 text-center">Tag Prefix</th>
                <th className="p-3 text-center">Tag Weight Range</th>
                <th className="p-3 text-center">Card Points</th>

                <th className="p-3 text-center sticky right-0 z-20 bg-slate-100 dark:bg-[#0b0e14]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-mono text-[11px]">
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={26} className="p-12 text-center text-slate-500 font-sans">
                    No items found matching your filters.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr
                    key={it.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition group"
                  >
                    {/* Sticky ID */}
                    <td className="p-3 text-center font-bold text-slate-500 dark:text-slate-400 sticky left-0 z-10 bg-white group-hover:bg-slate-50 dark:bg-[#0c0f16] dark:group-hover:bg-[#111622]">
                      {it.id}
                    </td>

                    {/* Sticky Group Name */}
                    <td className="p-3 font-sans font-bold text-slate-900 dark:text-white sticky left-12 z-10 bg-white group-hover:bg-slate-50 dark:bg-[#0c0f16] dark:group-hover:bg-[#111622] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>{it.group_name}</span>
                      </div>
                    </td>

                    {/* Accounting Columns */}
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">{it.sgst.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">{it.cgst.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-amber-700 dark:text-amber-400">{it.igst.toFixed(2)}</td>
                    <td className="p-3 text-center font-semibold text-slate-800 dark:text-slate-200">{it.hsn_code || '-'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{it.job_sac || '-'}</td>
                    <td className="p-3 font-sans">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                        {it.gstr1_display || 'TAXABLE'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-500 dark:text-slate-400">{it.l_tax.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-500 dark:text-slate-400">{it.c_tax.toFixed(2)}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-sans">{it.com_co || '-'}</td>
                    <td className="p-3 text-right font-semibold text-slate-800 dark:text-slate-200">{it.gp_percentage.toFixed(2)}%</td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">₹{it.op_value.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">₹{it.cl_value.toFixed(2)}</td>
                    <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">{it.minimum_stock}</td>

                    {/* MRP Columns */}
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/20">
                        {it.mrp_type}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">₹{it.value_rate.toFixed(2)}</td>
                    <td className="p-3 font-sans text-slate-600 dark:text-slate-400">{it.stock_method}</td>
                    <td className="p-3 text-right font-bold text-amber-700 dark:text-amber-400">{it.tunch > 0 ? `${it.tunch.toFixed(2)}%` : '-'}</td>
                    <td className="p-3 font-sans text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{it.default_item || '-'}</td>

                    {/* Policy Columns */}
                    <td className="p-3 text-center font-sans">
                      {it.return_policy_enabled ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {it.return_valid_days}d ({it.return_deduction_percent}%)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Disabled</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-sans">
                      {it.exchange_policy_enabled ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {it.exchange_valid_days}d ({it.exchange_deduction_percent}%)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Disabled</span>
                      )}
                    </td>

                    {/* Tagging Columns */}
                    <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">
                      {it.tag_prefix || '-'}
                    </td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                      {it.max_tag_weight > 0 ? `${it.min_tag_weight.toFixed(1)} - ${it.max_tag_weight.toFixed(1)}g` : '-'}
                    </td>
                    <td className="p-3 text-center font-sans">
                      {it.card_point_enabled ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          {it.card_point_percentage}% / ₹{it.card_points_per_gram}/g
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">No</span>
                      )}
                    </td>

                    {/* Sticky Actions */}
                    <td className="p-3 text-center sticky right-0 z-10 bg-white group-hover:bg-slate-50 dark:bg-[#0c0f16] dark:group-hover:bg-[#111622] shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setViewingItem(it)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditItem(it)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 transition cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(it)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-rose-400 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#10141f] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing <span className="font-bold text-slate-900 dark:text-white">{items.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-900 dark:text-white">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{total}</span> items
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  page === p
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'border border-slate-300 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Item Details Modal */}
      {viewingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="luxury-card bg-white dark:bg-[#121622] rounded-2xl border border-amber-500/30 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/[0.08] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  #{viewingItem.id}
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    {viewingItem.group_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    HSN: {viewingItem.hsn_code || 'N/A'} &bull; SAC: {viewingItem.job_sac || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* 1. Accounting */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c0f16] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/[0.06] pb-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Accounting &amp; Tax</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[11px]">
                  <span className="text-slate-500">SGST:</span>
                  <span className="text-right font-bold">{viewingItem.sgst.toFixed(2)}%</span>
                  <span className="text-slate-500">CGST:</span>
                  <span className="text-right font-bold">{viewingItem.cgst.toFixed(2)}%</span>
                  <span className="text-slate-500">IGST:</span>
                  <span className="text-right font-bold text-amber-600">{viewingItem.igst.toFixed(2)}%</span>
                  <span className="text-slate-500">GSTR-1 Display:</span>
                  <span className="text-right">{viewingItem.gstr1_display}</span>
                  <span className="text-slate-500">GP Target:</span>
                  <span className="text-right font-bold">{viewingItem.gp_percentage.toFixed(2)}%</span>
                  <span className="text-slate-500">Minimum Stock:</span>
                  <span className="text-right font-bold">{viewingItem.minimum_stock} pcs</span>
                </div>
              </div>

              {/* 2. MRP & Valuation */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c0f16] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/[0.06] pb-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>MRP &amp; Valuation</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[11px]">
                  <span className="text-slate-500">MRP Type:</span>
                  <span className="text-right font-bold">{viewingItem.mrp_type}</span>
                  <span className="text-slate-500">Value Rate:</span>
                  <span className="text-right">₹{viewingItem.value_rate.toFixed(2)}</span>
                  <span className="text-slate-500">Stock Method:</span>
                  <span className="text-right">{viewingItem.stock_method}</span>
                  <span className="text-slate-500">Touch Purity (Tunch):</span>
                  <span className="text-right font-bold text-amber-600">{viewingItem.tunch.toFixed(2)}%</span>
                  <span className="text-slate-500">Default Item:</span>
                  <span className="text-right truncate font-sans">{viewingItem.default_item || 'None'}</span>
                </div>
              </div>

              {/* 3. Return & Exchange Policy */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c0f16] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/[0.06] pb-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Return &amp; Exchange Policy</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[11px]">
                  <span className="text-slate-500">Return Allowed:</span>
                  <span className="text-right">{viewingItem.return_policy_enabled ? `Yes (${viewingItem.return_valid_days} days)` : 'No'}</span>
                  <span className="text-slate-500">Return Deduction:</span>
                  <span className="text-right">{viewingItem.return_deduction_percent.toFixed(2)}%</span>
                  <span className="text-slate-500">Exchange Allowed:</span>
                  <span className="text-right">{viewingItem.exchange_policy_enabled ? `Yes (${viewingItem.exchange_valid_days} days)` : 'No'}</span>
                  <span className="text-slate-500">Exchange Deduction:</span>
                  <span className="text-right">{viewingItem.exchange_deduction_percent.toFixed(2)}%</span>
                </div>
                {viewingItem.return_exchange_notes && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 font-sans">
                    Note: {viewingItem.return_exchange_notes}
                  </p>
                )}
              </div>

              {/* 4. Tagging & Loyalty */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c0f16] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/[0.06] pb-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Tagging &amp; Loyalty</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[11px]">
                  <span className="text-slate-500">Tag Restricted:</span>
                  <span className="text-right">{viewingItem.tag_gen_restricted ? 'Yes' : 'No'}</span>
                  <span className="text-slate-500">Tag Prefix:</span>
                  <span className="text-right font-bold text-amber-600">{viewingItem.tag_prefix || 'None'}</span>
                  <span className="text-slate-500">Weight Range:</span>
                  <span className="text-right">{viewingItem.min_tag_weight} - {viewingItem.max_tag_weight}g</span>
                  <span className="text-slate-500">Card Point %:</span>
                  <span className="text-right">{viewingItem.card_point_percentage.toFixed(2)}%</span>
                  <span className="text-slate-500">Points/Gram:</span>
                  <span className="text-right font-bold">₹{viewingItem.card_points_per_gram.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
              <button
                onClick={() => {
                  const it = viewingItem;
                  setViewingItem(null);
                  onEditItem(it);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
              >
                Edit Item
              </button>
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => !deleteLoading && setDeletingItem(null)}
        >
          <div
            className="luxury-card bg-white dark:bg-[#121622] rounded-2xl border border-rose-500/40 p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Delete Item Group?
                </h4>
                <p className="text-[11px] text-slate-500">Permanent database action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">'{deletingItem.group_name}'</strong> (ID #{deletingItem.id})?
            </p>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px]">
              Note: Items that have been used in past invoices or RFID tags cannot be deleted and will be protected by the system.
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? (
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
