import React, { useState, useEffect } from 'react';
import { List, Search, Printer, Download } from 'lucide-react';
import { fetchTransactions } from '../services/api';

interface TransactionPageProps {
  onBackToDashboard: () => void;
}

export const TransactionPage: React.FC<TransactionPageProps> = ({ onBackToDashboard }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const columns = ['Date', 'Type', 'Party Name', 'Refno', 'Lnarr', 'Pc', 'Gr.Wt.', 'Net.Wt.', 'Dia.Wt.', 'Stn.Wt.', 'Gold Fine', 'Sil.Fine', 'Total'];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTransactions({ page, limit })
      .then((data) => {
        if (cancelled) return;
        setRows(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <List className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">Daily Book</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Transaction register</p>
            </div>
          </div>
          <button onClick={onBackToDashboard} className="text-xs text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300">Back</button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100" />
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Print</button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-[#171b26]">
              <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 text-[11px]">
                {columns.map((c) => <th key={c} className="pb-2 font-medium px-2 whitespace-nowrap">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={13} className="py-10 text-center text-rose-500 text-xs">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={13} className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">No Records</td></tr>
              ) : (
                rows.map((r: any, i: number) => (
                  <tr key={r.id || i} className="border-b border-slate-100 dark:border-white/[0.04]">
                    <td className="py-2 px-2">{r.transaction_date}</td>
                    <td className="py-2 px-2">{r.transaction_type}</td>
                    <td className="py-2 px-2 text-slate-800 dark:text-slate-200">{r.party_name}</td>
                    <td className="py-2 px-2">{r.reference_no}</td>
                    <td className="py-2 px-2">{r.narration}</td>
                    <td className="py-2 px-2 text-right">{r.pcs}</td>
                    <td className="py-2 px-2 text-right">{Number(r.gross_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.net_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.diamond_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.stone_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.gold_fine || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.silver_fine || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.total || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Total: {total} records</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs disabled:opacity-40">Previous</button>
            <span>Page {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={rows.length < limit} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;
