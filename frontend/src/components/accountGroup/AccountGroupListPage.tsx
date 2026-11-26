import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Edit2, Trash2, ToggleLeft, ToggleRight,
  BookOpen, Layers, AlertCircle, Printer, FileDown
} from 'lucide-react';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';
import type { AccountGroup } from '../../types';
import { fetchAccountGroups, deleteAccountGroup, toggleAccountGroupStatus } from '../../services/api';
import { AccountGroupModal } from './AccountGroupModal';

interface Props {
  onBackToDashboard: () => void;
}

const NATURE_COLORS: Record<string, string> = {
  ASSET:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  LIABILITY: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  INCOME:    'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
  EXPENSE:   'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
};

export const AccountGroupListPage: React.FC<Props> = ({ onBackToDashboard }) => {
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [nature, setNature] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountGroup | null>(null);
  const [allGroups, setAllGroups] = useState<AccountGroup[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (nature) params.nature = nature;
      const res = await fetchAccountGroups(params);
      setGroups(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load account groups.');
    } finally {
      setLoading(false);
    }
  }, [search, nature, page, limit]);

  const loadAllForDropdown = useCallback(async () => {
    try {
      const res = await fetchAccountGroups({ limit: 200 });
      setAllGroups(Array.isArray(res.data) ? res.data : []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadAllForDropdown(); }, [loadAllForDropdown]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  const handleDelete = async (group: AccountGroup) => {
    if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
    try {
      await deleteAccountGroup(group.id);
      load();
    } catch (e: any) {
      alert(e.message || 'Cannot delete this group.');
    }
  };

  const handleToggle = async (group: AccountGroup) => {
    try {
      await toggleAccountGroupStatus(group.id);
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to toggle status.');
    }
  };

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (g: AccountGroup) => { setEditTarget(g); setModalOpen(true); };

  const buildReportOptions = async (): Promise<ReportPdfOptions> => {
    const res = await fetchAccountGroups({ ...(search ? { search } : {}), ...(nature ? { nature } : {}), page: 1, limit: 500 });
    const list = Array.isArray(res.data) ? res.data : [];
    return {
      title: 'Account Groups Master',
      filename: `Account_Groups_${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'portrait',
      columns: [
        { header: 'Group Name', dataKey: 'name' },
        { header: 'Code', dataKey: 'code' },
        { header: 'Nature', dataKey: 'nature', align: 'center' },
        { header: 'Parent', dataKey: 'parent' },
        { header: 'Accounts', dataKey: 'cnt', align: 'right' },
        { header: 'Status', dataKey: 'status', align: 'center' },
      ],
      data: list.map(g => ({
        name: g.name,
        code: g.code || '—',
        nature: g.nature,
        parent: g.parent_name || 'Primary',
        cnt: g.account_count ?? 0,
        status: g.is_active ? 'Active' : 'Inactive',
      })),
    };
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              Account Groups
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage account group hierarchy for the ledger system
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
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Group
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
            <select
              value={nature}
              onChange={(e) => { setNature(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            >
              <option value="">All Natures</option>
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors">
              <Search className="w-3.5 h-3.5" /> Search
            </button>
            <button type="button" onClick={() => { setSearch(''); setNature(''); setPage(1); load(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Group Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Nature</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Parent</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Accounts</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : groups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 dark:text-slate-500">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No account groups found</p>
                      <p className="text-xs mt-1 opacity-60">Create the first account group to get started</p>
                    </td>
                  </tr>
                ) : (
                  groups.map((g, idx) => (
                    <tr key={g.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{g.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{g.code || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${NATURE_COLORS[g.nature] || 'bg-slate-100 text-slate-600'}`}>
                          {g.nature}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{g.parent_name || <span className="italic opacity-40">Primary</span>}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{g.account_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          g.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                      : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-500'
                        }`}>
                          {g.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleToggle(g)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                            title={g.is_active ? 'Deactivate' : 'Activate'}>
                            {g.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(g)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors"
                            title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(g)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Delete">
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} groups
              </span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  ← Prev
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AccountGroupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={load}
        groupToEdit={editTarget}
        parentGroups={allGroups}
      />
    </div>
  );
};
