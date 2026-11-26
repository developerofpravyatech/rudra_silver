import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  TrendingUp,
  FileText,
  Scale,
  ChevronRight,
  Sparkles,
  Zap,
  Box,
  BarChart3,
  Loader2,
  Eye,
} from 'lucide-react';
import { DailyRates } from '../types';
import { fetchSalesOverview, fetchDashboardSummary, fetchRecentInvoices, fetchInvoiceDetail } from '../services/api';

interface MainDashboardProps {
  rates: DailyRates | null;
  onOpenNewBilling: () => void;
  onOpenLedger: () => void;
  onOpenWeighingModal: () => void;
  onOpenRateModal: () => void;
  onSelectCategory: (categoryName: string) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  rates,
  onOpenNewBilling,
  onOpenLedger,
  onOpenWeighingModal,
  onOpenRateModal,
  onSelectCategory,
}) => {
  const navigate = useNavigate();
  const [salesTimeframe, setSalesTimeframe] = useState<'Today' | '7 Days' | '30 Days'>('Today');
  const [salesData, setSalesData] = useState<{ label: string; total: number }[]>([]);
  const [salesTotals, setSalesTotals] = useState({ total: 0, paid: 0, pending: 0, count: 0 });
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<any>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

  const loadRecentInvoices = () => {
    setInvoicesLoading(true);
    fetchRecentInvoices(10)
      .then((rows) => {
        const mapped = (Array.isArray(rows) ? rows : []).slice(0, 10).map((r: any) => {
          const ps = String(r.payment_status || '').toUpperCase();
          const status = ps === 'PAID' ? 'Paid' : ps === 'PARTIAL' ? 'Partial' : 'Pending';
          return {
            rawId: Number(r.id),
            id: r.voucher_no ? `${r.series ? r.series + '-' : 'INV-'}${r.voucher_no}` : `INV-${r.id}`,
            customer: r.account_name || 'Walk-in',
            date: r.voucher_date || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'),
            weight: Number(r.total_weight || 0).toFixed(2),
            amount: Number(r.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            status,
          };
        });
        setRecentInvoices(mapped);
      })
      .catch(() => setRecentInvoices([]))
      .finally(() => setInvoicesLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setKpiLoading(true);
    fetchDashboardSummary()
      .then((res) => { if (!cancelled) setKpi(res); })
      .catch(() => { if (!cancelled) setKpi(null); })
      .finally(() => { if (!cancelled) setKpiLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    loadRecentInvoices();
  }, []);

  const rangeMap: Record<string, 'today' | '7days' | '30days'> = {
    'Today': 'today',
    '7 Days': '7days',
    '30 Days': '30days',
  };

  useEffect(() => {
    let cancelled = false;
    setSalesLoading(true);
    setSalesError(null);
    fetchSalesOverview(rangeMap[salesTimeframe])
      .then((res) => {
        if (cancelled) return;
        setSalesData(res.points.map((p) => ({ label: p.label, total: p.total })));
        setSalesTotals(res.totals);
      })
      .catch((e) => {
        if (cancelled) return;
        setSalesError(e.message || 'Failed to load sales');
        setSalesData([]);
      })
      .finally(() => {
        if (!cancelled) setSalesLoading(false);
      });
    return () => { cancelled = true; };
  }, [salesTimeframe]);

  // Auto-refresh KPI, sales data, and recent invoices every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDashboardSummary().then((res) => setKpi(res)).catch(() => { });
      fetchSalesOverview(rangeMap[salesTimeframe]).then((res) => {
        setSalesData(res.points.map((p) => ({ label: p.label, total: p.total })));
        setSalesTotals(res.totals);
      }).catch(() => { });
      loadRecentInvoices();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [salesTimeframe]);



  // Recent invoices matching the image
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  const currentSilverRate = rates?.silver_925_rate
    ? Math.round(Number(rates.silver_925_rate) / 1000)
    : 150;

  return (
    <div className="flex-1 p-6 space-y-4 max-w-[1700px] mx-auto w-full overflow-y-auto overflow-x-hidden">
      {/* Row 1: Hero Banner + 4 Stat Cards + Sales Overview Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-w-0">

        {/* 4 Summary Cards in Single Horizontal Row */}
        <div className="lg:col-span-12 grid grid-cols-4 gap-4">
          {/* Stat 1: Today's Sales */}
          <div
            onClick={onOpenNewBilling}
            className="luxury-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/[0.08] relative group hover:border-amber-400 dark:hover:border-amber-500/30 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-400/40 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <span className="font-bold text-base">₹</span>
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                &uarr; {kpi?.today_sales_pct ?? 0}%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                {kpiLoading && !kpi ? '...' : `₹${(kpi?.total_stock_value ?? kpi?.today_sales ?? 0).toLocaleString('en-IN')}`}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Total Stock
              </div>
            </div>
          </div>

          {/* Stat 2: Total Invoices */}
          <div
            onClick={onOpenLedger}
            className="luxury-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/[0.08] relative group hover:border-amber-400 dark:hover:border-amber-500/30 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-400/40 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                &uarr; {kpi?.total_invoices_pct ?? 0}%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                {kpi?.total_invoices ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Total Invoices
              </div>
            </div>
          </div>

          {/* Stat 3: Silver Sold */}
          <div
            onClick={onOpenWeighingModal}
            className="luxury-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/[0.08] relative group hover:border-amber-400 dark:hover:border-amber-500/30 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-400/40 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Scale className="w-4 h-4" />
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                &uarr; {kpi?.silver_sold_pct ?? 0}%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                {kpiLoading && !kpi ? '...' : `${(kpi?.silver_bullion_weight ?? kpi?.silver_sold ?? 0).toFixed(2)} g`}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Silver Bullion
              </div>
            </div>
          </div>

          {/* Stat 4: Silver Rate */}
          <div
            onClick={onOpenRateModal}
            className="luxury-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/[0.08] relative group hover:border-amber-400 dark:hover:border-amber-500/30 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-400/40 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                ₹{kpi?.silver_rate ?? currentSilverRate}/g
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Daily Balance
              </div>
            </div>
          </div>
        </div>

        {/* Sales Overview Line Chart */}
        <div className="lg:col-span-12 luxury-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between min-h-[200px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold text-sm">Sales Overview</span>
            </div>

            {/* Timeframe selector pills */}
            <div className="flex bg-slate-100 dark:bg-[#0a0d13] p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-[10px]">
              {(['Today', '7 Days', '30 Days'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSalesTimeframe(tf)}
                  className={`px-2.5 py-0.5 rounded-md transition font-medium ${salesTimeframe === tf
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Golden Curved Line Chart */}
          <div className="h-32 w-full pt-3 relative">
            {salesLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
              </div>
            ) : salesError ? (
              <div className="h-full flex items-center justify-center text-rose-500 text-xs">{salesError}</div>
            ) : salesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">No sales data</div>
            ) : (
              (() => {
                const max = Math.max(...salesData.map((d) => d.total), 1);
                const pts = salesData.map((d, i) => {
                  const x = salesData.length === 1 ? 210 : 40 + (i / (salesData.length - 1)) * 345;
                  const y = 115 - (d.total / max) * 100;
                  return { x, y, label: d.label, total: d.total };
                });
                const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaPath = `${linePath} L ${pts[pts.length - 1].x} 115 L ${pts[0].x} 115 Z`;
                return (
                  <svg viewBox="0 0 400 130" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="goldChartArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
                        <stop offset="70%" stopColor="#d4af37" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f3e5ab" />
                        <stop offset="50%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="#e5c05d" />
                      </linearGradient>
                    </defs>
                    <line x1="30" y1="10" x2="390" y2="10" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" strokeDasharray="3 3" />
                    <line x1="30" y1="40" x2="390" y2="40" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" strokeDasharray="3 3" />
                    <line x1="30" y1="70" x2="390" y2="70" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" strokeDasharray="3 3" />
                    <line x1="30" y1="100" x2="390" y2="100" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" strokeDasharray="3 3" />
                    <path d={areaPath} fill="url(#goldChartArea)" />
                    <path d={linePath} fill="none" stroke="url(#goldLine)" strokeWidth="2.5" strokeLinecap="round" />
                    {pts.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#d4af37" strokeWidth="2" className="filter drop-shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
                    ))}
                    {pts.map((p, i) => (
                      <text key={`t${i}`} x={p.x} y="126" fill="currentColor" className="text-slate-400 dark:text-slate-500" fontSize="8" textAnchor="middle">{p.label}</text>
                    ))}
                  </svg>
                );
              })()
            )}
          </div>

        </div>
      </div>


      {/* Row 3: Recent Invoices (Full Width - Max 10 records) */}
      <div className="grid grid-cols-1 min-w-0">
        <div className="luxury-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm">Recent Invoices</h3>
            </div>
            <button onClick={() => navigate('/invoice-history')} className="text-[11px] text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300 transition flex items-center gap-1"><span>View All Invoices</span><ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 text-[11px]">
                  <th className="pb-2 font-medium">Invoice Number</th>
                  <th className="pb-2 font-medium">Customer Name</th>
                  <th className="pb-2 font-medium">Invoice Date</th>
                  <th className="pb-2 font-medium text-right">Total Weight</th>
                  <th className="pb-2 font-medium text-right">Total Amount</th>
                  <th className="pb-2 font-medium text-center">Payment Status</th>
                  <th className="pb-2 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-sans">
                {invoicesLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading recent invoices...
                    </td>
                  </tr>
                ) : recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No recent invoices found
                    </td>
                  </tr>
                ) : recentInvoices.map((inv) => (
                  <tr
                    key={inv.rawId || inv.id}
                    onClick={() => {
                      fetchInvoiceDetail(inv.rawId).then(setViewingInvoice).catch(() => navigate('/invoice-history'));
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition cursor-pointer"
                  >
                    <td className="py-2.5 font-mono font-semibold text-amber-700 dark:text-amber-400 text-[11px]">{inv.id}</td>
                    <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{inv.customer}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">{inv.date}</td>
                    <td className="py-2.5 font-mono text-slate-700 dark:text-slate-300 text-right">{inv.weight} g</td>
                    <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-slate-200 text-right">₹ {inv.amount}</td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-500/30'
                          : inv.status === 'Partial'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950/70 dark:text-sky-400 dark:border-sky-500/30'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-500/30'
                          }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchInvoiceDetail(inv.rawId).then(setViewingInvoice).catch(() => navigate('/invoice-history'));
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300 transition"
                        title="View Invoice Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Invoice Preview Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.1] max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Invoice #{viewingInvoice.voucher_no} ({viewingInvoice.series || 'GST'})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {viewingInvoice.account_name || 'Walk-in Customer'} • {viewingInvoice.voucher_date}
                </p>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
            <div className="text-xs space-y-2 max-h-60 overflow-y-auto">
              {(viewingInvoice.items || []).map((it: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-slate-100 dark:border-white/[0.05] pb-1.5">
                  <span className="text-slate-700 dark:text-slate-200">{it.item_description || 'Silver Item'} ({Number(it.net_weight || 0).toFixed(3)} g)</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">₹{Number(it.total_item_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/[0.08] text-sm font-bold">
              <span className="text-slate-700 dark:text-slate-300">Net Total: ₹{Number(viewingInvoice.net_amount || 0).toLocaleString('en-IN')}</span>
              <button
                onClick={() => { setViewingInvoice(null); navigate('/invoice-history'); }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Open Full Invoice History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
