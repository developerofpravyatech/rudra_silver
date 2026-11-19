import React, { useState } from 'react';
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
} from 'lucide-react';
import { DailyRates } from '../types';

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
  const [salesTimeframe, setSalesTimeframe] = useState<'Today' | '7 Days' | '30 Days'>('Today');

  // Categories matching the image
  const categories = [
    {
      id: 'payal',
      name: 'Payal',
      image: '/assets/cat-payal.jpg',
    },
    {
      id: 'chain',
      name: 'Chain',
      image: '/assets/cat-chain.jpg',
    },
    {
      id: 'kada',
      name: 'Kada',
      image: '/assets/cat-kada.jpg',
    },
    {
      id: 'ring',
      name: 'Ring',
      image: '/assets/cat-ring.jpg',
    },
    {
      id: 'bracelet',
      name: 'Bracelet',
      image: '/assets/cat-bracelet.jpg',
    },
    {
      id: 'other',
      name: 'Other',
      image: '/assets/cat-other.jpg',
    },
  ];

  // Recent invoices matching the image
  const recentInvoices = [
    {
      id: 'INV-1001',
      customer: 'Neha Patel',
      dateTime: '14 Nov 2026, 02:45 PM',
      amount: '8,497',
      status: 'Paid',
    },
    {
      id: 'INV-1000',
      customer: 'Rahul Sharma',
      dateTime: '14 Nov 2026, 01:30 PM',
      amount: '12,450',
      status: 'Paid',
    },
    {
      id: 'INV-0999',
      customer: 'Priya Shah',
      dateTime: '14 Nov 2026, 12:15 PM',
      amount: '6,230',
      status: 'Paid',
    },
    {
      id: 'INV-0998',
      customer: 'Amit Desai',
      dateTime: '14 Nov 2026, 11:50 AM',
      amount: '9,120',
      status: 'Pending',
    },
  ];

  const currentSilverRate = rates?.silver_925_rate
    ? Math.round(Number(rates.silver_925_rate) / 1000)
    : 150;

  return (
    <div className="flex-1 p-6 space-y-4 max-w-[1700px] mx-auto w-full overflow-y-auto overflow-x-hidden">
      {/* Row 1: Hero Banner + 4 Stat Cards + Sales Overview Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-w-0">
        {/* Hero Card */}
        <div className="lg:col-span-4 luxury-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-slate-200 dark:border-white/[0.08] min-h-[200px]">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-1.5">
            <h2 className="font-display text-2xl font-bold tracking-[0.15em] text-slate-900 dark:text-white">
              RUDRA SILVER
            </h2>
            <p className="font-serif italic text-amber-700 dark:text-amber-300/90 text-sm tracking-wide">
              Premium Silver Jewellery
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
              Elegance in Every Detail
            </p>

            <div className="pt-4">
              <button
                onClick={() => onSelectCategory('Payal')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-400/60 text-amber-900 dark:text-amber-200 text-xs font-semibold hover:border-amber-400 hover:text-amber-950 dark:hover:text-white transition shadow-sm group"
              >
                <span>View Collection</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Product Showcase Graphic */}
          <div className="absolute right-2 -bottom-2 w-48 h-48 pointer-events-none flex items-center justify-center">
            <img
              src="/assets/hero-jewellery.png"
              alt="Silver Jewellery"
              className="w-44 h-44 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              loading="lazy"
            />
          </div>

          {/* Carousel dots */}
          <div className="flex space-x-1.5 pt-4 relative z-10">
            <span className="w-5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
          </div>
        </div>

        {/* 4 Stat Cards in 2x2 Grid */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
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
                &uarr; 12%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                ₹48,750
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Today's Sales
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
                &uarr; 8%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                28
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
                &uarr; 15%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                320.50 g
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Silver Sold
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
                ₹{currentSilverRate}/g
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Silver Rate
              </div>
            </div>
          </div>
        </div>

        {/* Sales Overview Line Chart */}
        <div className="lg:col-span-4 luxury-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between min-h-[200px]">
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
                  className={`px-2.5 py-0.5 rounded-md transition font-medium ${
                    salesTimeframe === tf
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

              {/* Grid Lines */}
              <line x1="30" y1="10" x2="390" y2="10" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" strokeDasharray="3 3" />
              <line x1="30" y1="40" x2="390" y2="40" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" strokeDasharray="3 3" />
              <line x1="30" y1="70" x2="390" y2="70" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" strokeDasharray="3 3" />
              <line x1="30" y1="100" x2="390" y2="100" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" strokeDasharray="3 3" />

              {/* Y Axis text */}
              <text x="5" y="14" fill="#64748b" fontSize="9" fontFamily="monospace">40k</text>
              <text x="5" y="44" fill="#64748b" fontSize="9" fontFamily="monospace">30k</text>
              <text x="5" y="74" fill="#64748b" fontSize="9" fontFamily="monospace">20k</text>
              <text x="5" y="104" fill="#64748b" fontSize="9" fontFamily="monospace">10k</text>
              <text x="12" y="125" fill="#64748b" fontSize="9" fontFamily="monospace">0</text>

              {/* Area fill */}
              <path
                d="M 40 98 Q 90 85 140 88 T 240 75 T 320 60 T 385 20 L 385 115 L 40 115 Z"
                fill="url(#goldChartArea)"
              />

              {/* Smooth Spline Curve */}
              <path
                d="M 40 98 Q 90 85 140 88 T 240 75 T 320 60 T 385 20"
                fill="none"
                stroke="url(#goldLine)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              {[
                { cx: 40, cy: 98 },
                { cx: 100, cy: 87 },
                { cx: 160, cy: 88 },
                { cx: 230, cy: 75 },
                { cx: 300, cy: 62 },
                { cx: 345, cy: 68 },
                { cx: 385, cy: 20 },
              ].map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.cx}
                  cy={pt.cy}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#d4af37"
                  strokeWidth="2"
                  className="filter drop-shadow-[0_0_4px_rgba(212,175,55,0.8)]"
                />
              ))}

              {/* X Axis text */}
              <text x="35" y="126" fill="#94a3b8" fontSize="8.5">9AM</text>
              <text x="95" y="126" fill="#94a3b8" fontSize="8.5">11AM</text>
              <text x="160" y="126" fill="#94a3b8" fontSize="8.5">1PM</text>
              <text x="230" y="126" fill="#94a3b8" fontSize="8.5">3PM</text>
              <text x="300" y="126" fill="#94a3b8" fontSize="8.5">5PM</text>
              <text x="370" y="126" fill="#94a3b8" fontSize="8.5">7PM</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Row 2: Jewellery Categories + Inventory Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-w-0">
        {/* Jewellery Categories Card */}
        <div className="lg:col-span-8 luxury-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 mb-4">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-sm">Jewellery Categories</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => {
              return (
                <div
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.name)}
                  className="bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-white/[0.07] hover:border-amber-400 dark:hover:border-amber-500/40 rounded-xl p-3 flex flex-col items-center justify-between cursor-pointer group transition-all duration-300 hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:-translate-y-0.5"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white dark:bg-[#0a0d14] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between w-full px-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                      {cat.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory Summary Card */}
        <div className="lg:col-span-4 luxury-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <Box className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm">Inventory Summary</h3>
            </div>
            <button
              onClick={onOpenLedger}
              className="text-[11px] text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300 transition flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            {/* Circular Progress Ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-[#1c222e]"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#inventoryGradient)"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="55.2"
                  strokeLinecap="round"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="inventoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f3e5ab" />
                    <stop offset="100%" stopColor="#d4af37" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">78%</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-tight">Stock Healthy</span>
              </div>
            </div>

            {/* Inventory Legend */}
            <div className="space-y-2.5 text-xs pr-4">
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500 dark:text-slate-400">Total Stock:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">12.5 kg</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-500 dark:text-slate-400">Available:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">9.8 kg</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-500 dark:text-slate-400">Low Stock:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">2.7 kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Invoices + Quick Actions + Luxury Brand Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-w-0">
        {/* Recent Invoices Table */}
        <div className="lg:col-span-5 luxury-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm">Recent Invoices</h3>
            </div>
            <button
              onClick={onOpenNewBilling}
              className="text-[11px] text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300 transition flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 text-[11px]">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Customer Name</th>
                  <th className="pb-2 font-medium">Date &amp; Time</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-sans">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                    <td className="py-2.5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{inv.id}</td>
                    <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{inv.customer}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">{inv.dateTime}</td>
                    <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-slate-200 text-right">₹ {inv.amount}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-500/30'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-500/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="lg:col-span-3 luxury-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 mb-3">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-sm">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5 flex-1">
            <button
              onClick={onOpenWeighingModal}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-white/[0.07] hover:border-amber-400 dark:hover:border-amber-500/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex flex-col items-center justify-center space-y-1.5 transition group"
            >
              <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Weigh Item</span>
            </button>

            <button
              onClick={onOpenNewBilling}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-white/[0.07] hover:border-amber-400 dark:hover:border-amber-500/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex flex-col items-center justify-center space-y-1.5 transition group"
            >
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">New Invoice</span>
            </button>

            <button
              onClick={() => onSelectCategory('Payal')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-white/[0.07] hover:border-amber-400 dark:hover:border-amber-500/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex flex-col items-center justify-center space-y-1.5 transition group"
            >
              <Box className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Add Item</span>
            </button>

            <button
              onClick={onOpenLedger}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-white/[0.07] hover:border-amber-400 dark:hover:border-amber-500/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex flex-col items-center justify-center space-y-1.5 transition group"
            >
              <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">View Reports</span>
            </button>
          </div>
        </div>

        {/* Brand Luxury Showcase Card */}
        <div className="lg:col-span-4 luxury-card-gold rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[190px]">
          <div className="relative z-10 space-y-1">
            <div className="font-script text-3xl gold-gradient-text tracking-wide font-normal">
              Rudra Silver
            </div>
            <p className="font-serif text-slate-600 dark:text-slate-300 text-xs italic">
              Where Purity Meets Luxury
            </p>
          </div>

          {/* Luxury Ring Graphic Showcase */}
          <div className="absolute right-0 -bottom-3 w-48 h-48 pointer-events-none flex items-center justify-center">
            <img
              src="/assets/luxury-ring.jpg"
              alt="Diamond Silver Ring"
              className="w-40 h-40 object-contain rounded-full shadow-[0_0_35px_rgba(212,175,55,0.25)]"
              loading="lazy"
            />
          </div>

          <div className="relative z-10 pt-4">
            <span className="text-[10px] text-amber-800 dark:text-amber-300/90 font-mono tracking-wider uppercase border border-amber-400/50 dark:border-amber-500/30 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10">
              92.5 Hallmark Sterling
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
