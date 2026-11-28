import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  RefreshCw,
  RotateCcw,
  Loader2,
  AlertCircle,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
} from 'lucide-react';
import { fetchDetailedCashBook, type CashBookDetailedResponse } from '../../services/api';

const fmt = (n: number) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  if (!iso) return '—';
  const p = iso.split('-');
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : iso;
};

const shiftDate = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const CashBookReport: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [groupId, setGroupId] = useState<string>('ALL');
  const [ledgerId, setLedgerId] = useState<string>('ALL');
  const [city, setCity] = useState<string>('ALL');
  const [userId, setUserId] = useState<string>('ALL');

  const [data, setData] = useState<CashBookDetailedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  const loadData = useCallback(
    async (overrides?: Partial<{ from: string; to: string; group_id: string; ledger_id: string; city: string; user_id: string }>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchDetailedCashBook({
          from: overrides?.from ?? fromDate,
          to: overrides?.to ?? toDate,
          group_id: overrides?.group_id ?? groupId,
          ledger_id: overrides?.ledger_id ?? ledgerId,
          city: overrides?.city ?? city,
          user_id: overrides?.user_id ?? userId,
        });
        setData(res);
        setPage(1);
      } catch (e: any) {
        setError(e.message || 'Failed to load Cash Book.');
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate, groupId, ledgerId, city, userId]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleShiftPeriod = (direction: -1 | 1) => {
    const start = new Date(`${fromDate}T00:00:00`).getTime();
    const end = new Date(`${toDate}T00:00:00`).getTime();
    const spanDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
    const delta = spanDays * direction;
    const nextFrom = shiftDate(fromDate, delta);
    const nextTo = shiftDate(toDate, delta);
    setFromDate(nextFrom);
    setToDate(nextTo);
  };

  const handleReset = () => {
    setFromDate(today);
    setToDate(today);
    setGroupId('ALL');
    setLedgerId('ALL');
    setCity('ALL');
    setUserId('ALL');
  };

  const creditEntries = data?.credit_entries || [];
  const debitEntries = data?.debit_entries || [];
  const maxRows = Math.max(creditEntries.length, debitEntries.length);
  const totalPages = Math.max(1, Math.ceil(maxRows / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(maxRows, startIdx + pageSize);
  const rowIndices = Array.from({ length: Math.max(0, endIdx - startIdx) }, (_, i) => startIdx + i);

  const filteredParties = (data?.options.parties || []).filter(
    (p) => groupId === 'ALL' || String(p.group_id) === groupId
  );

  const handleExportExcel = () => {
    if (!data) return;
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines: string[] = [];
    lines.push([esc('Rudra Silver ERP - Cash Book')].join(','));
    lines.push([esc('From Date'), esc(data.from), esc('To Date'), esc(data.to), esc('Opening Balance'), esc(fmt(data.opening_balance))].join(','));
    lines.push('');
    lines.push([
      esc('Date (Cr)'), esc('Voucher No. (Cr)'), esc('A/c Name (Cr)'), esc('Sub A/c (Cr)'), esc('Particular (Cr)'), esc('Amount (Cr)'),
      esc('Date (Dr)'), esc('Voucher No. (Dr)'), esc('A/c Name (Dr)'), esc('Sub A/c (Dr)'), esc('Particular (Dr)'), esc('Amount (Dr)'),
    ].join(','));

    for (let i = 0; i < maxRows; i++) {
      const c = creditEntries[i];
      const d = debitEntries[i];
      lines.push([
        esc(c ? fmtDate(c.date) : ''), esc(c?.voucher_no || ''), esc(c?.account_name || ''), esc(c?.sub_account || ''), esc(c?.particular || ''), esc(c ? c.amount.toFixed(2) : ''),
        esc(d ? fmtDate(d.date) : ''), esc(d?.voucher_no || ''), esc(d?.account_name || ''), esc(d?.sub_account || ''), esc(d?.particular || ''), esc(d ? d.amount.toFixed(2) : ''),
      ].join(','));
    }

    lines.push('');
    lines.push([esc('Total Credit'), esc(data.credit_total.toFixed(2)), esc('Total Debit'), esc(data.debit_total.toFixed(2)), esc('Day Difference'), esc(data.day_difference.toFixed(2)), esc('Closing Balance'), esc(data.closing_balance.toFixed(2))].join(','));

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CashBook_${data.from}_to_${data.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!data) return;
    const w = window.open('', '_blank', 'width=1100,height=780');
    if (!w) return;
    const rowsHtml = Array.from({ length: maxRows }, (_, i) => {
      const c = creditEntries[i];
      const d = debitEntries[i];
      return `<tr>
        <td>${c ? fmtDate(c.date) : ''}</td>
        <td>${c?.voucher_no || ''}</td>
        <td>${c?.account_name || ''}</td>
        <td>${c?.sub_account || ''}</td>
        <td>${c?.particular || ''}</td>
        <td style="text-align:right;font-weight:600">${c ? '₹' + fmt(c.amount) : ''}</td>
        <td style="border-left:2px solid #cbd5e1">${d ? fmtDate(d.date) : ''}</td>
        <td>${d?.voucher_no || ''}</td>
        <td>${d?.account_name || ''}</td>
        <td>${d?.sub_account || ''}</td>
        <td>${d?.particular || ''}</td>
        <td style="text-align:right;font-weight:600">${d ? '₹' + fmt(d.amount) : ''}</td>
      </tr>`;
    }).join('');

    const grpLabel = groupId === 'ALL' ? 'ALL' : (data.options.groups.find((g) => String(g.id) === groupId)?.name || groupId);
    const partyLabel = ledgerId === 'ALL' ? 'ALL' : (data.options.parties.find((p) => String(p.id) === ledgerId)?.ledger_name || ledgerId);
    const userLabel = userId === 'ALL' ? 'ALL' : (data.options.users.find((u) => String(u.id) === userId)?.name || userId);

    w.document.write(`<!doctype html><html><head><title>Cash Book (${data.from} to ${data.to})</title>
      <style>
        body{font-family:Segoe UI,Arial,sans-serif;padding:20px;color:#0f172a;font-size:11px}
        h1{margin:0 0 4px;font-size:18px}
        .meta{color:#475569;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:14px}
        .ob{padding:8px 12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:10px;font-weight:700}
        table{width:100%;border-collapse:collapse;margin-bottom:14px}
        th,td{border:1px solid #e2e8f0;padding:5px 6px;vertical-align:top}
        th{background:#f1f5f9;font-size:10px;text-transform:uppercase}
        .sum{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .card{border:1px solid #cbd5e1;border-radius:6px;padding:8px 10px}
        .lbl{font-size:10px;color:#64748b;text-transform:uppercase}
        .val{font-size:14px;font-weight:700;margin-top:2px}
      </style></head><body>
      <h1>Cash Book</h1>
      <div class="meta">
        <span><strong>From:</strong> ${fmtDate(data.from)}</span>
        <span><strong>To:</strong> ${fmtDate(data.to)}</span>
        <span><strong>A/c Group:</strong> ${grpLabel}</span>
        <span><strong>Party:</strong> ${partyLabel}</span>
        <span><strong>City:</strong> ${city}</span>
        <span><strong>User:</strong> ${userLabel}</span>
      </div>
      <div class="ob">Opening Balance: ₹${fmt(Math.abs(data.opening_balance))} ${data.opening_balance >= 0 ? 'Dr' : 'Cr'}</div>
      <table>
        <thead>
          <tr><th colspan="6" style="background:#ecfdf5;color:#065f46">CREDIT SIDE (Receipts / Inflow)</th><th colspan="6" style="background:#fff1f2;color:#9f1239;border-left:2px solid #cbd5e1">DEBIT SIDE (Payments / Outflow)</th></tr>
          <tr>
            <th>Date</th><th>Vch No.</th><th>A/c Name</th><th>Sub A/c</th><th>Particular</th><th style="text-align:right">Amount</th>
            <th style="border-left:2px solid #cbd5e1">Date</th><th>Vch No.</th><th>A/c Name</th><th>Sub A/c</th><th>Particular</th><th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>${rowsHtml || '<tr><td colspan="12" style="text-align:center;padding:16px">No cash transactions in this period</td></tr>'}</tbody>
      </table>
      <div class="sum">
        <div class="card"><div class="lbl">Total Credit</div><div class="val">₹${fmt(data.credit_total)}</div></div>
        <div class="card"><div class="lbl">Total Debit</div><div class="val">₹${fmt(data.debit_total)}</div></div>
        <div class="card"><div class="lbl">Day Difference</div><div class="val">₹${fmt(data.day_difference)}</div></div>
        <div class="card"><div class="lbl">Closing Balance</div><div class="val">₹${fmt(Math.abs(data.closing_balance))} ${data.closing_balance >= 0 ? 'Dr' : 'Cr'}</div></div>
      </div>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">A/c Group</label>
            <select
              value={groupId}
              onChange={(e) => { setGroupId(e.target.value); setLedgerId('ALL'); }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">ALL</option>
              {(data?.options.groups || []).map((g) => (
                <option key={g.id} value={String(g.id)}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Party Name</label>
            <select
              value={ledgerId}
              onChange={(e) => setLedgerId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">ALL</option>
              {filteredParties.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.ledger_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">A/c City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">ALL</option>
              {(data?.options.cities || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">User</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">ALL</option>
              {(data?.options.users || []).map((u) => (
                <option key={u.id} value={String(u.id)}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleShiftPeriod(-1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              type="button"
              onClick={() => handleShiftPeriod(1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Apply Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!data || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" /> Print
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={!data || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Opening Balance Banner */}
      <div className="bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
          <Wallet className="w-4 h-4" />
          <span>Opening Balance (Before {fmtDate(fromDate)})</span>
        </div>
        <div className={`text-base font-extrabold font-mono ${(data?.opening_balance ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
          ₹{fmt(Math.abs(data?.opening_balance ?? 0))} {(data?.opening_balance ?? 0) >= 0 ? 'Dr' : 'Cr'}
        </div>
      </div>

      {/* Two-Sided Aligned Cash Book Table */}
      <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        {loading && !data ? (
          <div className="py-16 flex items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Loading Cash Book...
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-[11px] border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th colSpan={6} className="px-3 py-2 text-center font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-b border-r-2 border-slate-300 dark:border-white/15 uppercase tracking-wider">
                    Credit Side (Cr) — Cash Receipts
                  </th>
                  <th colSpan={6} className="px-3 py-2 text-center font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-b border-slate-300 dark:border-white/15 uppercase tracking-wider">
                    Debit Side (Dr) — Cash Payments
                  </th>
                </tr>
                <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-white/10">
                  <th className="px-2.5 py-2 text-left whitespace-nowrap">Date (Cr)</th>
                  <th className="px-2.5 py-2 text-left whitespace-nowrap">Voucher No.</th>
                  <th className="px-2.5 py-2 text-left min-w-[130px]">A/c Name (Cr)</th>
                  <th className="px-2.5 py-2 text-left whitespace-nowrap">Sub A/c</th>
                  <th className="px-2.5 py-2 text-left min-w-[120px]">Particular</th>
                  <th className="px-2.5 py-2 text-right whitespace-nowrap border-r-2 border-slate-300 dark:border-white/15">Amount (Cr)</th>

                  <th className="px-2.5 py-2 text-left whitespace-nowrap">Date (Dr)</th>
                  <th className="px-2.5 py-2 text-left whitespace-nowrap">Voucher No.</th>
                  <th className="px-2.5 py-2 text-left min-w-[130px]">A/c Name (Dr)</th>
                  <th className="px-2.5 py-2 text-left whitespace-nowrap">Sub A/c</th>
                  <th className="px-2.5 py-2 text-left min-w-[120px]">Particular</th>
                  <th className="px-2.5 py-2 text-right whitespace-nowrap">Amount (Dr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {maxRows === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400 text-xs">
                      No cash transactions found for the selected date range and filters.
                    </td>
                  </tr>
                ) : (
                  rowIndices.map((idx) => {
                    const cr = creditEntries[idx];
                    const dr = debitEntries[idx];
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                        {/* Credit Side */}
                        <td className="px-2.5 py-2 whitespace-nowrap text-slate-500">{cr ? fmtDate(cr.date) : ''}</td>
                        <td className="px-2.5 py-2 whitespace-nowrap font-mono font-semibold text-slate-700 dark:text-slate-200">{cr?.voucher_no || ''}</td>
                        <td className="px-2.5 py-2 font-medium text-slate-800 dark:text-slate-100">{cr?.account_name || ''}</td>
                        <td className="px-2.5 py-2 text-slate-500">{cr?.sub_account || ''}</td>
                        <td className="px-2.5 py-2 text-slate-500 truncate max-w-[180px]">{cr?.particular || ''}</td>
                        <td className="px-2.5 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap border-r-2 border-slate-200 dark:border-white/10">
                          {cr ? `₹${fmt(cr.amount)}` : ''}
                        </td>

                        {/* Debit Side */}
                        <td className="px-2.5 py-2 whitespace-nowrap text-slate-500">{dr ? fmtDate(dr.date) : ''}</td>
                        <td className="px-2.5 py-2 whitespace-nowrap font-mono font-semibold text-slate-700 dark:text-slate-200">{dr?.voucher_no || ''}</td>
                        <td className="px-2.5 py-2 font-medium text-slate-800 dark:text-slate-100">{dr?.account_name || ''}</td>
                        <td className="px-2.5 py-2 text-slate-500">{dr?.sub_account || ''}</td>
                        <td className="px-2.5 py-2 text-slate-500 truncate max-w-[180px]">{dr?.particular || ''}</td>
                        <td className="px-2.5 py-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {dr ? `₹${fmt(dr.amount)}` : ''}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-500">Page {page} of {totalPages} ({maxRows} rows)</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 cursor-pointer">Prev</button>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 cursor-pointer">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#12161f] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Credit</div>
            <div className="text-lg font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
              ₹{fmt(data?.credit_total ?? 0)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#12161f] border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Debit</div>
            <div className="text-lg font-extrabold font-mono text-rose-700 dark:text-rose-400">
              ₹{fmt(data?.debit_total ?? 0)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#12161f] border border-sky-200 dark:border-sky-500/20 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Day Difference</div>
            <div className={`text-lg font-extrabold font-mono ${(data?.day_difference ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {(data?.day_difference ?? 0) < 0 ? '-' : '+'}₹{fmt(Math.abs(data?.day_difference ?? 0))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#12161f] border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Closing Balance</div>
            <div className={`text-lg font-extrabold font-mono ${(data?.closing_balance ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              ₹{fmt(Math.abs(data?.closing_balance ?? 0))} {(data?.closing_balance ?? 0) >= 0 ? 'Dr' : 'Cr'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
