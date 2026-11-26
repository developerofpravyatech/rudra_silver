import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, RefreshCw, Edit2, Trash2, ChevronLeft, ChevronRight, FileText, Package, Printer, FileDown } from 'lucide-react';
import { fetchKarigarIssues, fetchKarigarIssueFilterOptions, deleteKarigarIssue } from '../../services/api';
import type { KarigarIssueRecord } from '../../types';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';

interface Props {
  onNavigateAdd: () => void;
  onNavigateEdit: (id: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN:    'bg-blue-100 text-blue-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  CLOSED:  'bg-green-100 text-green-700',
};

export const KarigarIssueListPage: React.FC<Props> = ({ onNavigateAdd, onNavigateEdit }) => {
  const [items, setItems]     = useState<KarigarIssueRecord[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [karigars, setKarigars] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({ search: '', karigar_id: '', status: '', from_date: '', to_date: '', page: 1, limit: 20 });

  const totalPages = Math.ceil(total / filters.limit);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const result = await fetchKarigarIssues(filters as any);
      setItems(result.items); setTotal(result.total);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetchKarigarIssueFilterOptions().then(d => setKarigars(d.karigars)).catch(() => {});
  }, []);

  const handleDelete = async (r: KarigarIssueRecord) => {
    if (!window.confirm(`Delete Issue "${r.voucher_no}"?`)) return;
    try { await deleteKarigarIssue(r.id); load(); } catch (e: any) { alert(e.message); }
  };

  const buildReportOptions = async (): Promise<ReportPdfOptions> => {
    const res = await fetchKarigarIssues({ ...filters, page: 1, limit: 500 } as any);
    return {
      title: 'Karigar Issue Register',
      filename: `Karigar_Issues_${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      filters: [
        ...(filters.from_date ? [{ label: 'From', value: filters.from_date }] : []),
        ...(filters.to_date ? [{ label: 'To', value: filters.to_date }] : []),
        ...(filters.status ? [{ label: 'Status', value: filters.status }] : []),
      ],
      columns: [
        { header: 'Voucher No', dataKey: 'voucher_no' },
        { header: 'Date', dataKey: 'issue_date' },
        { header: 'Karigar', dataKey: 'karigar_name' },
        { header: 'Lot No', dataKey: 'lot_no' },
        { header: 'Gold Fine(g)', dataKey: 'gf', align: 'right' },
        { header: 'Silver Fine(g)', dataKey: 'sf', align: 'right' },
        { header: 'Amount (INR)', dataKey: 'amt', align: 'right' },
        { header: 'Status', dataKey: 'status', align: 'center' },
      ],
      data: res.items.map(i => ({
        voucher_no: i.voucher_no,
        issue_date: i.issue_date,
        karigar_name: i.karigar_name || '—',
        lot_no: i.lot_no || '—',
        gf: Number(i.total_gold_fine || 0).toFixed(3),
        sf: Number(i.total_silver_fine || 0).toFixed(3),
        amt: Number(i.total_amount || 0).toFixed(2),
        status: i.status,
      })),
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Karigar Issue</h1>
            <p className="text-xs text-slate-500">{total} issue voucher(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => printReport(await buildReportOptions())} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={async () => downloadReportPdf(await buildReportOptions())} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
            <FileDown className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={onNavigateAdd} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> New Issue
          </button>
        </div>
      </div>

      {/* Filters */}
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
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="PARTIAL">Partial</option>
          <option value="CLOSED">Closed</option>
        </select>
        <input type="date" value={filters.from_date} onChange={e => setFilters(f => ({ ...f, from_date: e.target.value, page: 1 }))}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={filters.to_date} onChange={e => setFilters(f => ({ ...f, to_date: e.target.value, page: 1 }))}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => setFilters({ search: '', karigar_id: '', status: '', from_date: '', to_date: '', page: 1, limit: 20 })}
          className="text-xs text-blue-600 hover:underline">Reset</button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Voucher No</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Karigar</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Lot No</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Gold Fine (g)</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Silver Fine (g)</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount (₹)</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-400">No issue vouchers found.</td></tr>
                ) : items.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-700">{r.voucher_no}</td>
                    <td className="px-4 py-3 text-slate-600">{r.issue_date}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.karigar_name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.lot_no || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{Number(r.total_gold_fine).toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{Number(r.total_silver_fine).toFixed(3)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">₹{Number(r.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => onNavigateEdit(r.id)} title="Edit"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r)} title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
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

      {/* Pagination */}
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
