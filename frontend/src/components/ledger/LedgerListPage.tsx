import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Edit2, Trash2, ChevronLeft, ChevronRight,
  BookOpen, AlertCircle, Eye, Download, Printer, FileDown, ArrowUpDown
} from 'lucide-react';
import type { Ledger } from '../../types';
import { fetchLedgers, deleteLedger, fetchLedgerFilterOptions, exportLedgerCsv } from '../../services/api';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';

interface Props {
  onBackToDashboard: () => void;
  onAdd: () => void;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
}

const NATURE_COLORS: Record<string, string> = {
  ASSET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  LIABILITY: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  INCOME: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
  EXPENSE: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
};

export const LedgerListPage: React.FC<Props> = ({ onBackToDashboard, onAdd, onEdit, onView }) => {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [sortBy, setSortBy] = useState<string>('ledger_name');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterOptions, setFilterOptions] = useState<{ groups: Array<{ id: number; name: string }>; cities: string[] }>({ groups: [], cities: [] });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit, sort_by: sortBy, sort_dir: sortDir };
      if (search) params.search = search;
      if (groupFilter) params.group_id = groupFilter;
      if (cityFilter) params.city = cityFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await fetchLedgers(params);
      setLedgers(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load ledgers.');
    } finally {
      setLoading(false);
    }
  }, [search, groupFilter, cityFilter, statusFilter, sortBy, sortDir, page, limit]);

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(d => (d === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(col);
      setSortDir('ASC');
    }
    setPage(1);
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetchLedgerFilterOptions().then(d => setFilterOptions(d)).catch(() => { });
  }, []);

  const handleDelete = async (l: Ledger) => {
    if (!confirm(`Delete ledger "${l.ledger_name}"? This cannot be undone.`)) return;
    try {
      await deleteLedger(l.id);
      load();
    } catch (e: any) {
      alert(e.message || 'Cannot delete this ledger.');
    }
  };

  const buildReportOptions = async (): Promise<ReportPdfOptions> => {
    const params: Record<string, string | number> = { page: 1, limit: 500 };
    if (search) params.search = search;
    if (groupFilter) params.group_id = groupFilter;
    if (statusFilter) params.status = statusFilter;
    const res = await fetchLedgers(params);
    const list = Array.isArray(res.data) ? res.data : [];
    return {
      title: 'Ledger Master List',
      filename: `Ledger_Master_${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      columns: [
        { header: 'Code', dataKey: 'code' },
        { header: 'Ledger Name', dataKey: 'name' },
        { header: 'Group', dataKey: 'group' },
        { header: 'Mobile', dataKey: 'mobile' },
        { header: 'City', dataKey: 'city' },
        { header: 'Opening Bal (INR)', dataKey: 'ob', align: 'right' },
        { header: 'Status', dataKey: 'status', align: 'center' },
      ],
      data: list.map(l => ({
        code: l.ledger_code,
        name: l.ledger_name,
        group: l.group_name || '—',
        mobile: l.mobile || '—',
        city: l.city || '—',
        ob: l.opening_balance_type !== 'NIL' ? `${Number(l.opening_balance).toFixed(2)} ${l.opening_balance_type}` : '0.00',
        status: l.status,
      })),
    };
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              Ledger Master
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {total} ledger{total !== 1 ? 's' : ''} in the system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={async () => printReport(await buildReportOptions())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={async () => downloadReportPdf(await buildReportOptions())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100">
              <FileDown className="w-4 h-4" /> PDF
            </button>

            <button
              onClick={() => exportLedgerCsv(ledgers?.[0]?.id)}
              disabled={ledgers.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ledger name, code or mobile..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 min-w-[150px]"
            >
              <option value="">All Groups</option>
              {filterOptions.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 min-w-[130px]"
            >
              <option value="">All Cities</option>
              {filterOptions.cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button onClick={() => { setSearch(''); setGroupFilter(''); setCityFilter(''); setStatusFilter('ACTIVE'); setSortBy('ledger_name'); setSortDir('ASC'); setPage(1); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">#</th>
                  <th onClick={() => toggleSort('ledger_code')} className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-amber-600 select-none">
                    <span className="inline-flex items-center gap-1">Code <ArrowUpDown className="w-3 h-3 opacity-60" /></span>
                  </th>
                  <th onClick={() => toggleSort('ledger_name')} className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-amber-600 select-none">
                    <span className="inline-flex items-center gap-1">Ledger Name <ArrowUpDown className="w-3 h-3 opacity-60" /></span>
                  </th>
                  <th onClick={() => toggleSort('group_name')} className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-amber-600 select-none">
                    <span className="inline-flex items-center gap-1">Group <ArrowUpDown className="w-3 h-3 opacity-60" /></span>
                  </th>
                  <th onClick={() => toggleSort('mobile')} className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-amber-600 select-none">
                    <span className="inline-flex items-center gap-1">Mobile <ArrowUpDown className="w-3 h-3 opacity-60" /></span>
                  </th>
                  <th onClick={() => toggleSort('city')} className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-amber-600 select-none">
                    <span className="inline-flex items-center gap-1">City <ArrowUpDown className="w-3 h-3 opacity-60" /></span>
                  </th>
                  <th onClick={() => toggleSort('opening_balance')} className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-amber-600 select-none">
                    <span className="inline-flex items-center justify-end gap-1">Opening Bal <ArrowUpDown className="w-3 h-3 opacity-60" /></span>
                  </th>
                  <th onClick={() => toggleSort('status')} className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-amber-600 select-none">
                    <span className="inline-flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 opacity-60" /></span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : ledgers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400 dark:text-slate-500">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No ledgers found</p>
                      <p className="text-xs mt-1 opacity-60">Create the first ledger to get started</p>
                    </td>
                  </tr>
                ) : (
                  ledgers.map((l, idx) => (
                    <tr
                      key={l.id}
                      onClick={() => onView(l.id)}
                      className="hover:bg-amber-50/40 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{l.ledger_code}</td>
                      <td className="px-4 py-3 font-semibold text-amber-700 dark:text-amber-400 hover:underline">{l.ledger_name}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-slate-700 dark:text-slate-200">{l.group_name}</p>
                          {l.group_nature && (
                            <span className={`mt-0.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${NATURE_COLORS[l.group_nature] || ''}`}>
                              {l.group_nature}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{l.mobile || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{l.city || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${l.opening_balance_type === 'DR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {l.opening_balance_type !== 'NIL' ? (
                            <>₹{Number(l.opening_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[9px]">{l.opening_balance_type}</span></>
                          ) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${l.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-500'
                          }`}>{l.status}</span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => onView(l.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors" title="Open Ledger Statement">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(l.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(l)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} ledgers
                </span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 text-xs"
                >
                  {[10, 20, 50, 100].map(n => (
                    <option key={n} value={n}>{n} / page</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">Page {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
