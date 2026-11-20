import React, { useState, useEffect } from 'react';
import { Package, Search, Printer, Download } from 'lucide-react';
import { fetchStockStatus, fetchStockStatusSummary } from '../services/api';

interface StockStatusPageProps {
  onBackToDashboard: () => void;
}

export const StockStatusPage: React.FC<StockStatusPageProps> = ({ onBackToDashboard }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchStockStatus({ page, limit: pageSize, search }), fetchStockStatusSummary()])
      .then(([list, sum]) => {
        if (cancelled) return;
        setRows(list.items || []);
        setTotal(list.total || 0);
        setSummary(sum);
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns = ['Item Name', 'Unit', 'Pc', 'Gr.Wt.', 'Net.Wt.', 'Tunch', 'Wstg', 'Lbr.Wt', 'Rate', 'Sil.Fine', 'Total', 'Gold Fine'];

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">Stock Status</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Inventory stock overview and reports</p>
            </div>
          </div>
          <button onClick={onBackToDashboard} className="text-xs text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300">Back</button>
        </div>

        {/* Filters (UI only) */}
        <div className="p-4 border-b border-slate-200 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item name..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100" />
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Print</button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-[#171b26]">
              <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 text-[11px]">
                {columns.map((c) => <th key={c} className="pb-2 font-medium px-2 whitespace-nowrap">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={12} className="py-10 text-center text-rose-500 text-xs">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={12} className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">No stock records available</td></tr>
              ) : (
                rows.map((r: any, i: number) => (
                  <tr key={r.id || i} className="border-b border-slate-100 dark:border-white/[0.04]">
                    <td className="py-2 px-2 text-slate-800 dark:text-slate-200">{r.item_name}</td>
                    <td className="py-2 px-2">{r.unit}</td>
                    <td className="py-2 px-2 text-right">{r.pcs}</td>
                    <td className="py-2 px-2 text-right">{Number(r.gross_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.net_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.tunch || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.wastage || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.labour_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.rate || 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.silver_fine || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.total || 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.gold_fine || 0).toFixed(3)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {summary && (
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-white/[0.06] font-semibold text-[11px]">
                  <td className="py-2 px-2" colSpan={2}>Total ({summary.total_items})</td>
                  <td className="py-2 px-2 text-right">{Number(summary.total_pcs || 0).toFixed(3)}</td>
                  <td className="py-2 px-2 text-right">{Number(summary.total_gross || 0).toFixed(3)}</td>
                  <td className="py-2 px-2 text-right">{Number(summary.total_net || 0).toFixed(3)}</td>
                  <td colSpan={4} />
                  <td className="py-2 px-2 text-right">{Number(summary.total_silver_fine || 0).toFixed(3)}</td>
                  <td className="py-2 px-2 text-right">{Number(summary.total_amount || 0).toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{Number(summary.total_gold_fine || 0).toFixed(3)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {rows.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} records</span>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 px-2 py-1">
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={() => setPage(1)} disabled={page <= 1} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/[0.1] disabled:opacity-40">First</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/[0.1] disabled:opacity-40">Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/[0.1] disabled:opacity-40">Next</button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/[0.1] disabled:opacity-40">Last</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockStatusPage;

