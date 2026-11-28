import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Truck,
  HardHat,
  Box,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  TrendingUp,
  Calendar,
  RefreshCw,
  ArrowRight,
  Loader2,
  Printer,
  FileDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { DailyRates } from '../types';
import {
  fetchDashboardOverview,
  fetchInvoicesPaginated,
  fetchInvoiceDetail,
  type DashboardOverviewData,
} from '../services/api';
import { printInvoicePdf, downloadInvoicePdf } from '../utils/reportPdf';
import { InvoiceDetailModal } from './InvoiceDetailModal';

interface MainDashboardProps {
  rates: DailyRates | null;
  onOpenNewBilling: () => void;
  onOpenLedger: () => void;
  onOpenWeighingModal: () => void;
  onOpenRateModal: () => void;
  onSelectCategory: (categoryName: string) => void;
}

const formatINR = (val: number, decimals = 2): string =>
  `₹${Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

const formatCompactAxis = (val: number): string => {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs === 0) return '0';
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (abs >= 1000) return `${sign}${Math.round(abs / 1000)}k`;
  return `${sign}${Math.round(abs)}`;
};

const formatDisplayDate = (iso: string): string => {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const formatVoucherTypeLabel = (vt: string): string => {
  const u = (vt || '').toUpperCase();
  if (u === 'RECEIPT') return 'Receipt';
  if (u === 'PAYMENT') return 'Payment';
  if (u === 'CONTRA') return 'Contra';
  if (u === 'JOURNAL') return 'Journal';
  return vt;
};

const formatVoucherNo = (series: string | null | undefined, no: number | string, vt: string): string => {
  const prefix = (series || vt.slice(0, 3) || 'VCH').toUpperCase();
  const numStr = String(no ?? '').padStart(4, '0');
  return `${prefix}-${numStr}`;
};

export const MainDashboard: React.FC<MainDashboardProps> = () => {
  const navigate = useNavigate();

  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const [fromDate, setFromDate] = useState<string>(defaultFrom);
  const [toDate, setToDate] = useState<string>(defaultTo);
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive hover state
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const [hoveredRateIdx, setHoveredRateIdx] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<'cash' | 'bank' | 'others' | null>(null);

  // Recent Invoices (5 per page, matching /invoice-history)
  const [invoices, setInvoices] = useState<Array<{
    id: string;
    rawId: number;
    customer: string;
    mobile: string;
    dateTime: string;
    itemsCount: number;
    grossAmount: number;
    gstAmount: number;
    netAmount: number;
    paymentMode: string;
    status: 'Paid' | 'Pending';
  }>>([]);
  const [invoicePage, setInvoicePage] = useState<number>(1);
  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(true);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [printSuccess, setPrintSuccess] = useState<string | null>(null);

  const loadRecentInvoices = useCallback(async (page = invoicePage) => {
    setInvoicesLoading(true);
    try {
      const res = await fetchInvoicesPaginated(page, 5);
      const mapped = res.items.map((it: any) => ({
        id: String(it.voucher_no ? `INV-${it.voucher_no}` : `INV-${it.id}`),
        rawId: Number(it.id),
        customer: it.account_name || 'Walk-in Customer',
        mobile: it.account_mobile || '-',
        dateTime: it.voucher_date || it.created_at || '-',
        itemsCount: Number(it.items_count || 1),
        grossAmount: Number(it.gross_amount || it.net_amount || 0),
        gstAmount: Number(it.gst_amount || 0),
        netAmount: Number(it.net_amount || 0),
        paymentMode: String(it.payment_mode || 'CASH'),
        status: (String(it.payment_status || '').toUpperCase() === 'UNPAID' || String(it.payment_status || '').toUpperCase() === 'PENDING'
          ? 'Pending'
          : 'Paid') as 'Paid' | 'Pending',
      }));
      setInvoices(mapped);
      setInvoiceTotal(res.total);
    } catch {
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoicePage]);

  useEffect(() => {
    void loadRecentInvoices(invoicePage);
  }, [invoicePage, loadRecentInvoices]);

  const handlePrintInvoice = async (rawId: number, labelId: string) => {
    try {
      const invoiceData = await fetchInvoiceDetail(rawId);
      printInvoicePdf(invoiceData);
      setPrintSuccess(`Invoice ${labelId} formatted for printing.`);
      setTimeout(() => setPrintSuccess(null), 3500);
    } catch {
      alert('Failed to load invoice for printing.');
    }
  };

  const handleDownloadInvoicePdf = async (rawId: number) => {
    try {
      const invoiceData = await fetchInvoiceDetail(rawId);
      downloadInvoicePdf(invoiceData);
    } catch {
      alert('Failed to download invoice PDF.');
    }
  };

  const handleViewInvoice = async (rawId: number) => {
    try {
      const invoiceData = await fetchInvoiceDetail(rawId);
      setViewingInvoice(invoiceData);
    } catch {
      alert('Failed to load invoice details.');
    }
  };

  const totalInvoicePages = Math.max(1, Math.ceil(invoiceTotal / 5));

  const [ratePeriod, setRatePeriod] = useState<'7d' | '15d' | '30d' | '3m' | '6m' | '1y'>('30d');

  const loadDashboard = useCallback(async (f = fromDate, t = toDate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboardOverview(f, t, ratePeriod);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, ratePeriod]);

  useEffect(() => {
    void loadDashboard(fromDate, toDate);
  }, [fromDate, toDate, loadDashboard]);

  const counts = data?.counts || { customers: 0, suppliers: 0, karigars: 0, items: 0 };
  const dailySeries = data?.daily_balance || [];
  const accSummary = data?.account_summary || {
    cash: 0,
    bank: 0,
    others: 0,
    total: 0,
    cash_pct: 0,
    bank_pct: 0,
    others_pct: 0,
  };
  const rateTrend = data?.rate_trend || { period: ratePeriod, points: [], latest: null };

  // Daily Balance Chart geometry
  const dailyChart = (() => {
    const W = 680;
    const H = 205;
    const padL = 48;
    const padR = 16;
    const padT = 14;
    const padB = 28;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const allVals = dailySeries.flatMap((d) => [d.receipt, d.payment, d.closing_balance]);
    const rawMax = Math.max(...allVals, 1000);
    const rawMin = Math.min(...allVals, 0);
    const minVal = rawMin < 0 ? rawMin * 1.1 : 0;
    const maxVal = rawMax <= minVal ? minVal + 1000 : rawMax * 1.12;
    const span = maxVal - minVal || 1;

    const getX = (i: number) =>
      dailySeries.length <= 1 ? padL + plotW / 2 : padL + (i / (dailySeries.length - 1)) * plotW;
    const getY = (v: number) => padT + plotH - ((v - minVal) / span) * plotH;

    const pts = dailySeries.map((d, i) => ({
      ...d,
      x: getX(i),
      yRec: getY(d.receipt),
      yPay: getY(d.payment),
      yClose: getY(d.closing_balance),
    }));

    const buildPath = (key: 'yRec' | 'yPay' | 'yClose') =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p[key].toFixed(1)}`).join(' ');

    const closePath = buildPath('yClose');
    const closeArea =
      pts.length > 0
        ? `${closePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`
        : '';

    const yTicks = [0, 0.33, 0.66, 1].map((t) => {
      const val = minVal + span * t;
      return { val, y: getY(val), label: formatCompactAxis(val) };
    });

    const xStep = Math.max(1, Math.ceil(pts.length / 7));

    return { W, H, padL, padR, padT, plotH, pts, recPath: buildPath('yRec'), payPath: buildPath('yPay'), closePath, closeArea, yTicks, xStep };
  })();

  // Account Wise Donut Chart geometry
  const donut = (() => {
    const r = 56;
    const cx = 74;
    const cy = 74;
    const circ = 2 * Math.PI * r;
    const total = accSummary.total > 0 ? accSummary.total : 1;

    const segments = [
      { key: 'cash' as const, label: 'Cash', value: accSummary.cash, pct: accSummary.cash_pct, color: '#1d72f3' },
      { key: 'bank' as const, label: 'Bank', value: accSummary.bank, pct: accSummary.bank_pct, color: '#16a34a' },
      { key: 'others' as const, label: 'Others', value: accSummary.others, pct: accSummary.others_pct, color: '#f59e0b' },
    ];

    let offsetAcc = 0;
    const arcs = segments.map((s) => {
      const frac = accSummary.total > 0 ? s.value / total : 0;
      const len = frac * circ;
      const arc = {
        ...s,
        dashArray: `${len.toFixed(2)} ${(circ - len).toFixed(2)}`,
        dashOffset: (-offsetAcc).toFixed(2),
      };
      offsetAcc += len;
      return arc;
    });

    return { r, cx, cy, circ, arcs };
  })();

  // Gold & Silver Rate Trend Line Chart geometry
  const rateChart = (() => {
    const W = 740;
    const H = 175;
    const padL = 54;
    const padR = 18;
    const padT = 14;
    const padB = 26;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const ptsRaw = rateTrend.points;
    const allRates = ptsRaw.flatMap((p) => [p.gold_rate, p.silver_rate]).filter((v) => v > 0);
    const minVal = allRates.length > 0 ? Math.max(0, Math.floor(Math.min(...allRates) * 0.92)) : 0;
    const maxVal = allRates.length > 0 ? Math.ceil(Math.max(...allRates) * 1.08) : 100000;
    const span = maxVal - minVal || 1;

    const getX = (i: number) =>
      ptsRaw.length <= 1 ? padL + plotW / 2 : padL + (i / (ptsRaw.length - 1)) * plotW;
    const getY = (v: number) => padT + plotH - ((v - minVal) / span) * plotH;

    const pts = ptsRaw.map((p, i) => ({
      ...p,
      x: getX(i),
      yGold: getY(p.gold_rate),
      ySilver: getY(p.silver_rate),
    }));

    const buildLine = (key: 'yGold' | 'ySilver') =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p[key].toFixed(1)}`).join(' ');

    const yTicks = [0, 0.33, 0.66, 1].map((t) => {
      const val = minVal + span * t;
      return { val, y: getY(val), label: formatCompactAxis(val) };
    });

    const xStep = Math.max(1, Math.ceil(pts.length / 8));

    return { W, H, padL, padR, padT, plotH, pts, goldPath: buildLine('yGold'), silverPath: buildLine('ySilver'), yTicks, xStep };
  })();

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 max-w-[1700px] mx-auto w-full overflow-y-auto overflow-x-hidden bg-[#f4f7fc] dark:bg-[#080a0d]">
      {/* Top Date Range Filter & Refresh Bar */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <div className="flex items-center gap-2 bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 shadow-xs">
          <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="From Date"
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="To Date"
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(fromDate, toDate)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1668e3] hover:bg-[#1257c2] text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Row 1: 4 Count Cards (Left) + Daily Balance Overview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: 2x2 Total Count Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {/* Card 1: Total Customers */}
          <div
            onClick={() => navigate('/accounts')}
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#eff6ff] via-[#f6faff] to-[#dcebff] dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-100/90 dark:border-blue-500/20 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-3.5 min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100/90 dark:bg-blue-500/20 flex items-center justify-center text-[#1668e3] dark:text-blue-400 shrink-0 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div className="min-w-0 z-10">
              <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                Total Customers
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {loading && !data ? '—' : counts.customers.toLocaleString('en-IN')}
              </div>
            </div>
            <svg viewBox="0 0 200 40" className="absolute bottom-0 left-0 w-full h-7 opacity-40 pointer-events-none" preserveAspectRatio="none">
              <path d="M0,28 C55,8 135,40 200,18 L200,40 L0,40 Z" fill="#93c5fd" />
            </svg>
          </div>

          {/* Card 2: Total Suppliers */}
          <div
            onClick={() => navigate('/accounts')}
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#ecfdf5] via-[#f4fef9] to-[#d5fae5] dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-100/90 dark:border-emerald-500/20 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-3.5 min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/90 dark:bg-emerald-500/20 flex items-center justify-center text-[#16a34a] dark:text-emerald-400 shrink-0 shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div className="min-w-0 z-10">
              <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                Total Suppliers
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {loading && !data ? '—' : counts.suppliers.toLocaleString('en-IN')}
              </div>
            </div>
            <svg viewBox="0 0 200 40" className="absolute bottom-0 left-0 w-full h-7 opacity-40 pointer-events-none" preserveAspectRatio="none">
              <path d="M0,26 C65,40 130,8 200,24 L200,40 L0,40 Z" fill="#86efac" />
            </svg>
          </div>

          {/* Card 3: Total Karigars */}
          <div
            onClick={() => navigate('/karigar')}
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#fff7ed] via-[#fffbf5] to-[#ffe6cc] dark:from-amber-950/40 dark:to-amber-900/20 border border-orange-100/90 dark:border-amber-500/20 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-3.5 min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-100/90 dark:bg-orange-500/20 flex items-center justify-center text-[#ea580c] dark:text-orange-400 shrink-0 shadow-xs">
              <HardHat className="w-6 h-6" />
            </div>
            <div className="min-w-0 z-10">
              <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                Total Karigars
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {loading && !data ? '—' : counts.karigars.toLocaleString('en-IN')}
              </div>
            </div>
            <svg viewBox="0 0 200 40" className="absolute bottom-0 left-0 w-full h-7 opacity-40 pointer-events-none" preserveAspectRatio="none">
              <path d="M0,22 C60,6 140,38 200,20 L200,40 L0,40 Z" fill="#fdba74" />
            </svg>
          </div>

          {/* Card 4: Total Items */}
          <div
            onClick={() => navigate('/items')}
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#f5f3ff] via-[#faf8ff] to-[#e9e2ff] dark:from-purple-950/40 dark:to-purple-900/20 border border-purple-100/90 dark:border-purple-500/20 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-3.5 min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100/90 dark:bg-purple-500/20 flex items-center justify-center text-[#7c3aed] dark:text-purple-400 shrink-0 shadow-xs">
              <Box className="w-6 h-6" />
            </div>
            <div className="min-w-0 z-10">
              <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                Total Items
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {loading && !data ? '—' : counts.items.toLocaleString('en-IN')}
              </div>
            </div>
            <svg viewBox="0 0 200 40" className="absolute bottom-0 left-0 w-full h-7 opacity-40 pointer-events-none" preserveAspectRatio="none">
              <path d="M0,30 C70,12 130,36 200,16 L200,40 L0,40 Z" fill="#c4b5fd" />
            </svg>
          </div>
        </div>

        {/* Right: Daily Balance Overview Line Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#12161f] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1668e3]" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Daily Balance Overview</h2>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1d72f3]" /> Receipt
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" /> Payment
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Closing Balance
              </span>
            </div>
          </div>

          <div className="relative w-full h-[205px]">
            {loading && !data ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#1668e3]" /> Loading chart...
              </div>
            ) : dailyChart.pts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No voucher activity in selected date range
              </div>
            ) : (
              <>
                <svg viewBox={`0 0 ${dailyChart.W} ${dailyChart.H}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="closingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {dailyChart.yTicks.map((t, idx) => (
                    <g key={idx}>
                      <line
                        x1={dailyChart.padL}
                        y1={t.y}
                        x2={dailyChart.W - dailyChart.padR}
                        y2={t.y}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-white/[0.06]"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={dailyChart.padL - 8}
                        y={t.y + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="currentColor"
                        className="text-slate-400 dark:text-slate-500"
                      >
                        {t.label}
                      </text>
                    </g>
                  ))}

                  {dailyChart.closeArea && <path d={dailyChart.closeArea} fill="url(#closingAreaGrad)" />}
                  <path d={dailyChart.closePath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={dailyChart.recPath} fill="none" stroke="#1d72f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={dailyChart.payPath} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  {dailyChart.pts.map((p, i) => (
                    <g
                      key={p.date}
                      onMouseEnter={() => setHoveredDayIdx(i)}
                      onMouseLeave={() => setHoveredDayIdx(null)}
                      className="cursor-pointer"
                    >
                      <rect x={p.x - 10} y={dailyChart.padT} width="20" height={dailyChart.plotH} fill="transparent" />
                      <circle cx={p.x} cy={p.yClose} r={hoveredDayIdx === i ? 4.5 : 2.8} fill="#fff" stroke="#f59e0b" strokeWidth="2" />
                      <circle cx={p.x} cy={p.yRec} r={hoveredDayIdx === i ? 4.5 : 2.8} fill="#fff" stroke="#1d72f3" strokeWidth="2" />
                      <circle cx={p.x} cy={p.yPay} r={hoveredDayIdx === i ? 4.5 : 2.8} fill="#fff" stroke="#16a34a" strokeWidth="2" />
                      {(i % dailyChart.xStep === 0 || i === dailyChart.pts.length - 1) && (
                        <text
                          x={p.x}
                          y={dailyChart.H - 6}
                          textAnchor="middle"
                          fontSize="10"
                          fill="currentColor"
                          className="text-slate-500 dark:text-slate-400"
                        >
                          {p.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {hoveredDayIdx !== null && dailyChart.pts[hoveredDayIdx] && (
                  <div className="absolute top-1 right-2 z-20 bg-slate-900/95 text-white rounded-xl px-3 py-2 text-[11px] shadow-lg pointer-events-none space-y-0.5">
                    <div className="font-bold text-slate-200 border-b border-white/10 pb-1 mb-1">
                      {formatDisplayDate(dailyChart.pts[hoveredDayIdx].date)}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-blue-300">Receipt:</span>
                      <span className="font-mono font-semibold">{formatINR(dailyChart.pts[hoveredDayIdx].receipt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-emerald-300">Payment:</span>
                      <span className="font-mono font-semibold">{formatINR(dailyChart.pts[hoveredDayIdx].payment)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-amber-300">Closing:</span>
                      <span className="font-mono font-semibold">{formatINR(dailyChart.pts[hoveredDayIdx].closing_balance)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Account Wise Summary (Left) + Monthly Trend (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Account Wise Summary */}
        <div className="lg:col-span-4 bg-white dark:bg-[#12161f] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon className="w-4 h-4 text-[#1668e3]" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Account Wise Summary</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-auto py-2">
            {/* Donut SVG */}
            <div className="relative w-[156px] h-[156px] shrink-0">
              <svg viewBox="0 0 148 148" className="w-full h-full -rotate-90">
                <circle
                  cx={donut.cx}
                  cy={donut.cy}
                  r={donut.r}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-white/5"
                  strokeWidth="22"
                />
                {donut.arcs.map((arc) => (
                  <circle
                    key={arc.key}
                    cx={donut.cx}
                    cy={donut.cy}
                    r={donut.r}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={hoveredSlice === arc.key ? 26 : 22}
                    strokeDasharray={arc.dashArray}
                    strokeDashoffset={arc.dashOffset}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice(arc.key)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono leading-tight">
                  {formatINR(accSummary.total, 0)}
                </div>
                <div className="text-[11px] font-medium text-slate-400">Total</div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 w-full sm:w-auto">
              {donut.arcs.map((arc) => (
                <div
                  key={arc.key}
                  onMouseEnter={() => setHoveredSlice(arc.key)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className={`flex items-start gap-2.5 p-1.5 rounded-lg transition cursor-pointer ${hoveredSlice === arc.key ? 'bg-slate-50 dark:bg-white/5' : ''
                    }`}
                >
                  <span className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: arc.color }} />
                  <div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{arc.label}</div>
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(arc.value, 0)}{' '}
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        ({arc.pct}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Gold & Silver Rate Trend Chart (replaces Monthly Trend) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#12161f] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Gold &amp; Silver Rate Trend</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Gold Rate
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Silver Rate
                </span>
              </div>

              <select
                value={ratePeriod}
                onChange={(e) => setRatePeriod(e.target.value as any)}
                aria-label="Rate Trend Period"
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="7d">7 Days</option>
                <option value="15d">15 Days</option>
                <option value="30d">30 Days</option>
                <option value="3m">3 Months</option>
                <option value="6m">6 Months</option>
                <option value="1y">1 Year</option>
              </select>
            </div>
          </div>

          <div className="relative w-full h-[175px]">
            {loading && !data ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Loading rate trend...
              </div>
            ) : rateChart.pts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No historical Gold &amp; Silver rate records found for this period.
              </div>
            ) : (
              <>
                <svg viewBox={`0 0 ${rateChart.W} ${rateChart.H}`} className="w-full h-full overflow-visible">
                  {rateChart.yTicks.map((t, idx) => (
                    <g key={idx}>
                      <line
                        x1={rateChart.padL}
                        y1={t.y}
                        x2={rateChart.W - rateChart.padR}
                        y2={t.y}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-white/[0.06]"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={rateChart.padL - 8}
                        y={t.y + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="currentColor"
                        className="text-slate-400 dark:text-slate-500"
                      >
                        ₹{t.label}
                      </text>
                    </g>
                  ))}

                  <path d={rateChart.goldPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={rateChart.silverPath} fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {rateChart.pts.map((p, i) => (
                    <g
                      key={p.date}
                      onMouseEnter={() => setHoveredRateIdx(i)}
                      onMouseLeave={() => setHoveredRateIdx(null)}
                      className="cursor-pointer"
                    >
                      <rect x={p.x - 14} y={rateChart.padT} width="28" height={rateChart.plotH} fill="transparent" />
                      <circle cx={p.x} cy={p.yGold} r={hoveredRateIdx === i ? 5 : 3.5} fill="#fff" stroke="#f59e0b" strokeWidth="2.2" />
                      <circle cx={p.x} cy={p.ySilver} r={hoveredRateIdx === i ? 5 : 3.5} fill="#fff" stroke="#64748b" strokeWidth="2.2" />
                      {(i % rateChart.xStep === 0 || i === rateChart.pts.length - 1) && (
                        <text
                          x={p.x}
                          y={rateChart.H - 6}
                          textAnchor="middle"
                          fontSize="10"
                          fill="currentColor"
                          className="text-slate-500 dark:text-slate-400"
                        >
                          {p.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {hoveredRateIdx !== null && rateChart.pts[hoveredRateIdx] && (
                  <div className="absolute top-1 right-2 z-20 bg-slate-900/95 text-white rounded-xl px-3 py-2 text-[11px] shadow-lg pointer-events-none space-y-0.5">
                    <div className="font-bold text-slate-200 border-b border-white/10 pb-1 mb-1">
                      {formatDisplayDate(rateChart.pts[hoveredRateIdx].date)}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-amber-300">Gold (24K):</span>
                      <span className="font-mono font-semibold">{formatINR(rateChart.pts[hoveredRateIdx].gold_rate)}/10g</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-300">Silver (999):</span>
                      <span className="font-mono font-semibold">{formatINR(rateChart.pts[hoveredRateIdx].silver_rate)}/kg</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Latest Gold & Silver Rate Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20">
              <div>
                <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Latest Gold Rate (24K)</div>
                <div className="text-[10px] text-amber-700/70 dark:text-amber-400/70">
                  {rateTrend.latest ? `As on ${formatDisplayDate(rateTrend.latest.date)} • ${rateTrend.latest.gold_unit}` : 'No rate recorded'}
                </div>
              </div>
              <div className="text-base font-extrabold font-mono text-amber-700 dark:text-amber-300">
                {rateTrend.latest ? formatINR(rateTrend.latest.gold_rate, 0) : '—'}
              </div>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
              <div>
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Latest Silver Rate (999)</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {rateTrend.latest ? `As on ${formatDisplayDate(rateTrend.latest.date)} • ${rateTrend.latest.silver_unit}` : 'No rate recorded'}
                </div>
              </div>
              <div className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-100">
                {rateTrend.latest ? formatINR(rateTrend.latest.silver_rate, 0) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Invoices (Full width so Actions & all 10 columns fit with zero scrolling) */}
      <div className="bg-white dark:bg-[#12161f] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1668e3]" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Invoices</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/invoice-history')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1668e3] hover:text-[#1257c2] cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {printSuccess && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{printSuccess}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-white/[0.08]">
                <th className="px-2.5 py-2 whitespace-nowrap">Invoice #</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Customer Name</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Date &amp; Time</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">Items</th>
                <th className="px-2.5 py-2 text-right whitespace-nowrap">Taxable (₹)</th>
                <th className="px-2.5 py-2 text-right whitespace-nowrap">GST 3% (₹)</th>
                <th className="px-2.5 py-2 text-right whitespace-nowrap">Net Total (₹)</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">Payment</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">Status</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-mono">
              {invoicesLoading ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400 font-sans">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400 font-sans">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.rawId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                    <td className="px-2.5 py-2 font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">{inv.id}</td>
                    <td className="px-2.5 py-2 font-sans">
                      <div className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{inv.customer}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{inv.mobile}</div>
                    </td>
                    <td className="px-2.5 py-2 text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">{inv.dateTime}</td>
                    <td className="px-2.5 py-2 text-center text-slate-700 dark:text-slate-300">{inv.itemsCount}</td>
                    <td className="px-2.5 py-2 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap">₹{inv.grossAmount.toFixed(2)}</td>
                    <td className="px-2.5 py-2 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">₹{inv.gstAmount.toFixed(2)}</td>
                    <td className="px-2.5 py-2 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">₹{inv.netAmount.toLocaleString()}</td>
                    <td className="px-2.5 py-2 text-center font-sans whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-[#1a2130] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                        {inv.paymentMode}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-center font-sans whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-500/30'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-500/30'
                          }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-center font-sans whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintInvoice(inv.rawId, inv.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 transition cursor-pointer"
                          title="Reprint Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoicePdf(inv.rawId)}
                          className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
                          title="Download Invoice PDF"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewInvoice(inv.rawId)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (5 records per page) */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-700 dark:text-slate-200">{invoicePage}</strong> of{' '}
            <strong className="text-slate-700 dark:text-slate-200">{totalInvoicePages}</strong>
            {invoiceTotal > 0 ? ` (${invoiceTotal} total)` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
              disabled={invoicePage <= 1 || invoicesLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              onClick={() => setInvoicePage((p) => Math.min(totalInvoicePages, p + 1))}
              disabled={invoicePage >= totalInvoicePages || invoicesLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Exact Invoice Details Popup reused from /invoice-history */}
      <InvoiceDetailModal invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />
    </div>
  );
};
