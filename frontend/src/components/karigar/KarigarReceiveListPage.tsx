import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, RefreshCw, Trash2, ChevronLeft, ChevronRight, PackageCheck } from 'lucide-react';
import { fetchKarigarReceives, fetchKarigarReceiveFilterOptions, deleteKarigarReceive } from '../../services/api';
import type { KarigarReceiveRecord } from '../../types';

interface Props {
  onNavigateAdd: () => void;
}

export const KarigarReceiveListPage: React.FC<Props> = ({ onNavigateAdd }) => {
  const [items, setItems]     = useState<KarigarReceiveRecord[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [karigars, setKarigars] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({ search: '', karigar_id: '', from_date: '', to_date: '', page: 1, limit: 20 });

  const totalPages = Math.ceil(total / filters.limit);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const result = await fetchKarigarReceives(filters as any);
      setItems(result.items); setTotal(result.total);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetchKarigarReceiveFilterOptions().then(d => setKarigars(d.karigars)).catch(() => {});
  }, []);

  const handleDelete = async (r: KarigarReceiveRecord) => {
    if (!window.confirm(`Delete Receive "${r.voucher_no}"?`)) return;
    try { await deleteKarigarReceive(r.id); load(); } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f6f9]">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
            <PackageCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Karigar Receive</h1>
            <p className="text-xs text-slate-500">{total} receive voucher(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={onNavigateAdd} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
            <Plus className="w-3.5 h-3.5" /> New Receive
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-slate-100 px-6 py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Search voucher, karigar, lot..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filters.karigar_id} onChange={e => setFilters(f => ({ ...f, karigar_id: e.target.value, page: 1 }))}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Karigars</option>
          {karigars.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <input type="date" value={filters.from_date} onChange={e => setFilters(f => ({ ...f, from_date: e.target.value, page: 1 }))}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2" />
        <input type="date" value={filters.to_date} onChange={e => setFilters(f => ({ ...f, to_date: e.target.value, page: 1 }))}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2" />
        <button onClick={() => setFilters({ search: '', karigar_id: '', from_date: '', to_date: '', page: 1, limit: 20 })}
          className="text-xs text-blue-600 hover:underline">Reset</button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Voucher No</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Karigar</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Issue Ref</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Lot No</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Silver Fine (g)</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount (₹)</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400">No receive vouchers found.</td></tr>
                ) : items.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-green-700">{r.voucher_no}</td>
                    <td className="px-4 py-3 text-slate-600">{r.receive_date}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.karigar_name}</td>
                    <td className="px-4 py-3 font-mono text-blue-600">{r.issue_voucher_no || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.lot_no || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{Number(r.total_silver_fine).toFixed(3)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">₹{Number(r.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDelete(r)} title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">Showing {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)} of {total}</span>
          <div className="flex gap-1">
            <button onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))} disabled={filters.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <button onClick={() => setFilters(f => ({ ...f, page: Math.min(totalPages, f.page + 1) }))} disabled={filters.page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}
    </div>
  );
};
