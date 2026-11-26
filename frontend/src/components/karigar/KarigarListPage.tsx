import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, RefreshCw, Download, Edit2, Trash2, Loader2,
  Power, Users2, ChevronLeft, ChevronRight,
  MapPin, Phone, Coins
} from 'lucide-react';
import {
  fetchKarigars, fetchKarigarFilterOptions,
  toggleKarigarStatus, deleteKarigar,
} from '../../services/api';
import type { KarigarRecord, KarigarFilterParams } from '../../types';
import { showErrorAlert } from '../../utils/alert';

interface Props {
  onNavigateAdd: () => void;
  onNavigateEdit: (id: number) => void;
  onBackToDashboard: () => void;
}

export const KarigarListPage: React.FC<Props> = ({ onNavigateAdd, onNavigateEdit }) => {
  useEffect(() => {
    document.title = 'Karigar | Rudra Silver';
  }, []);

  const [items, setItems]           = useState<KarigarRecord[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [cities, setCities]         = useState<string[]>([]);
  const [filters, setFilters]       = useState<KarigarFilterParams>({
    search: '', city: '', status: '', sort_by: 'name', sort_order: 'ASC', page: 1, limit: 25,
  });

  const totalPages = Math.ceil(total / (filters.limit ?? 25));

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const result = await fetchKarigars(filters);
      setItems(result.items ?? []);
      setTotal(result.total);
    } catch (e: any) {
      setError(e.message);
      showErrorAlert(e.message || 'Failed to load Karigar list.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetchKarigarFilterOptions().then(d => setCities(d.cities || [])).catch(() => {});
  }, []);

  const handleDelete = async (record: KarigarRecord) => {
    if (!window.confirm(`Delete Karigar "${record.karigar_name}"?\nThis cannot be undone.`)) return;
    try {
      await deleteKarigar(record.id);
      load();
    } catch (e: any) {
      showErrorAlert('Error deleting karigar: ' + (e.message || ''));
    }
  };

  const handleToggle = async (record: KarigarRecord) => {
    const action = record.status === 'Active' ? 'Deactivate' : 'Activate';
    if (!window.confirm(`${action} "${record.karigar_name}"?`)) return;
    try {
      await toggleKarigarStatus(record.id);
      load();
    } catch (e: any) {
      showErrorAlert('Error toggling karigar status: ' + (e.message || ''));
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.city) params.set('city', filters.city);
    if (filters.is_active !== '') params.set('is_active', filters.is_active ?? '');
    params.set('format', 'csv');
    window.open(`/api/karigar/export?${params.toString()}`, '_blank');
  };

  const setPage = (p: number) => setFilters(f => ({ ...f, page: p }));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
            <Users2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Karigar Master</h1>
            <p className="text-xs text-slate-500">{total} karigar(s) registered</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={onNavigateAdd} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Add Karigar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Filters */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, mobile..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.city}
            onChange={e => setFilters(f => ({ ...f, city: e.target.value, page: 1 }))}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filters.is_active}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', city: '', is_active: '', sort_by: 'name', sort_order: 'ASC', page: 1, limit: 25 })}
            className="text-xs text-blue-600 hover:underline ml-2">Reset
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden">
          {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm mb-3">⚠ {error}</div>}
          {loading ? (
            <div className="flex-1 min-h-[300px] flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 font-medium">Loading Karigar list...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 min-h-[300px] items-center justify-center text-slate-500 text-sm">
              No Karigars found. Use the button above to add a new karigar.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Karigar Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Mobile</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">City</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Silver Fine (g)</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount (₹)</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Issues</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-slate-400">No Karigars found.</td></tr>
                  ) : items.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600">{k.karigar_code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{k.karigar_name}</div>
                        {k.state && <div className="text-slate-400 text-[11px]">{k.state}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{k.mobile || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {k.city || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {Number(k.opening_silver_balance).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        ₹{Number(k.opening_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${'bg-green-100 text-green-700'}`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => onNavigateEdit(k.id)} title="Edit"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleToggle(k)} title='Toggle'
                            className="p-1.5 rounded-lg transition-colors hover:bg-orange-50 text-orange-500">
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(k)} title="Delete"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Showing {((filters.page ?? 1) - 1) * (filters.limit ?? 25) + 1}–{Math.min((filters.page ?? 1) * (filters.limit ?? 25), total)} of {total}
        </span>
        <div className="flex gap-1">
          <button onClick={() => setPage(Math.max(1, (filters.page ?? 1) - 1))} disabled={(filters.page ?? 1) <= 1}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 text-xs rounded-lg border ${filters.page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-slate-50'}`}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(Math.min(totalPages, (filters.page ?? 1) + 1))} disabled={(filters.page ?? 1) >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Next</span>
          </button>
        </div>
      </div>
    </div>
  );
};