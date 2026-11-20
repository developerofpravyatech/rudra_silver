import React, { useState, useEffect } from 'react';
import { Scale, Search, Printer, Download } from 'lucide-react';
import { fetchDailyBalance } from '../services/api';

interface DailyBalancePageProps {
  onBackToDashboard: () => void;
}

export const DailyBalancePage: React.FC<DailyBalancePageProps> = ({ onBackToDashboard }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [party, setParty] = useState('');
  const [city, setCity] = useState('');
  const [group, setGroup] = useState('All');
  const [location, setLocation] = useState('All');
  const [withBalance, setWithBalance] = useState(false);
  const [zeroBalance, setZeroBalance] = useState(false);
  const [withoutTxn, setWithoutTxn] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = rows.filter((r: any) => {
    const q = search.trim().toLowerCase();
    if (q && !(`${r.account_name || ''} ${r.mobile || ''}`.toLowerCase().includes(q))) return false;
    const bal = Number(r.balance_inr || 0);
    if (withBalance && bal === 0) return false;
    if (zeroBalance && bal !== 0) return false;
    return true;
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDailyBalance()
      .then((data) => { if (!cancelled) setRows(data); })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const columns = ['A/c Name', 'City', 'Mobile', 'Phone', 'Balance Date', 'Pay Date', 'Gold Fine', 'Silver Fine', 'Amount', 'Dia.Wt.', 'Stn.Wt.', 'Gr.Wt. [G]', 'Gr.Wt. [S]'];

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">Daily Balance</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">View party-wise daily financial and silver/gold balances.</p>
            </div>
          </div>
          <button onClick={onBackToDashboard} className="text-xs text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300">Back</button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-white/[0.06] space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">From Date</label>
              <input type="date" className="w-full text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 px-2 py-1.5" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">To Date</label>
              <input type="date" className="w-full text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 px-2 py-1.5" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">Party Name</label>
              <input type="text" className="w-full text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 px-2 py-1.5" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">City</label>
              <input type="text" className="w-full text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 px-2 py-1.5" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">Group</label>
              <select className="w-full text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 px-2 py-1.5">
                <option>All</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">Location</label>
              <select className="w-full text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 px-2 py-1.5">
                <option>All</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold">Apply</button>
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs">Reset</button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" /> With Balance</label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" /> Zero Balance</label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" /> Without Transactions</label>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100" />
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
                <tr><td colSpan={13} className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={13} className="py-10 text-center text-rose-500 text-xs">{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={13} className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">No balance records available</td></tr>
              ) : (
                filtered.map((r: any, i: number) => (
                  <tr key={r.id || i} className="border-b border-slate-100 dark:border-white/[0.04]">
                    <td className="py-2 px-2 text-slate-800 dark:text-slate-200">{r.account_name}</td>
                    <td className="py-2 px-2">{r.city || '-'}</td>
                    <td className="py-2 px-2">{r.mobile || '-'}</td>
                    <td className="py-2 px-2">{r.phone || '-'}</td>
                    <td className="py-2 px-2">{r.balance_date || '-'}</td>
                    <td className="py-2 px-2">{r.payment_date || '-'}</td>
                    <td className="py-2 px-2 text-right">{Number(r.gold_fine || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.silver_fine || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.diamond_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.stone_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.gold_gross_weight || 0).toFixed(3)}</td>
                    <td className="py-2 px-2 text-right">{Number(r.silver_gross_weight || 0).toFixed(3)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 dark:border-white/[0.06] font-semibold text-[11px]">
                <td className="py-2 px-2">Total</td>
                <td colSpan={5} />
                <td className="py-2 px-2 text-right">{filtered.reduce((s, r) => s + Number(r.gold_fine || 0), 0).toFixed(3)}</td>
                <td className="py-2 px-2 text-right">{filtered.reduce((s, r) => s + Number(r.silver_fine || 0), 0).toFixed(3)}</td>
                <td className="py-2 px-2 text-right">{filtered.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2)}</td>
                <td className="py-2 px-2 text-right">{filtered.reduce((s, r) => s + Number(r.diamond_weight || 0), 0).toFixed(3)}</td>
                <td className="py-2 px-2 text-right">{filtered.reduce((s, r) => s + Number(r.stone_weight || 0), 0).toFixed(3)}</td>
                <td className="py-2 px-2 text-right">{filtered.reduce((s, r) => s + Number(r.gold_gross_weight || 0), 0).toFixed(3)}</td>
                <td className="py-2 px-2 text-right">{filtered.reduce((s, r) => s + Number(r.silver_gross_weight || 0), 0).toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyBalancePage;
