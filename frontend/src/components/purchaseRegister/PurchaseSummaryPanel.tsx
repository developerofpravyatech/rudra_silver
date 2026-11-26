import React from 'react';
import { PurchaseRegisterSummary } from '../../types';
import { ShoppingBag, ArrowDownLeft, RotateCcw, TrendingUp, Sparkles, Scale, IndianRupee } from 'lucide-react';

interface PurchaseSummaryPanelProps {
  summary: PurchaseRegisterSummary | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const PurchaseSummaryPanel: React.FC<PurchaseSummaryPanelProps> = ({
  summary,
  loading,
  onRefresh,
}) => {
  const fmt = (num?: number, dec: number = 3) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });

  const fmtCurr = (num?: number) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">

              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                {loading ? 'Calculating...' : `${summary?.total_records || 0} Records`}
              </span>
            </div>

          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Recalculate summary"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        )}
      </div>

      {/* Grid of Key Purchase Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Purchase Weight & Pcs */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Purchase Weight</span>
            <Scale className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-base font-extrabold text-slate-900 font-mono">
            {fmt(summary?.total_weight)} <span className="text-xs font-normal text-slate-500">g</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Pcs: <strong className="text-slate-800">{summary?.total_pieces || 0}</strong>
          </div>
        </div>

        {/* Gross Purchase Value */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Purchase Value</span>
            <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-base font-extrabold text-blue-700 font-mono">
            ₹{fmtCurr(summary?.total_purchase_value)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Avg Rate: <span className="font-mono font-semibold text-slate-700">₹{fmtCurr(summary?.avg_rate)}/g</span>
          </div>
        </div>

        {/* Purchase Return */}
        <div className="bg-rose-50/60 rounded-xl p-3 border border-rose-200/60">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Purchase Return</span>
            <ArrowDownLeft className="w-3.5 h-3.5" />
          </div>
          <div className="text-base font-extrabold text-rose-700 font-mono">
            ₹{fmtCurr(summary?.total_purchase_return_value)}
          </div>
          <div className="text-[11px] text-rose-600/90 font-mono mt-0.5">
            Ret Wt: {fmt(summary?.total_return_weight)} g ({summary?.total_return_pieces || 0} pc)
          </div>
        </div>

        {/* Net Purchase Value */}
        <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Purchase Value</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="text-base font-extrabold text-emerald-700 font-mono">
            ₹{fmtCurr(summary?.net_purchase_value)}
          </div>
          <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
            Net Wt: {fmt(summary?.net_purchase_weight)} g
          </div>
        </div>

        {/* Silver & Gold Breakdown */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Metal Breakdown</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xs font-bold text-slate-700 font-mono">
            Silver: <span className="text-slate-900">{fmt(summary?.total_silver_weight)} g</span>
          </div>
          <div className="text-xs font-bold text-amber-700 font-mono mt-0.5">
            Gold: {fmt(summary?.total_gold_weight)} g
          </div>
        </div>

        {/* Total Final Amount */}
        <div className="bg-blue-600 text-white rounded-xl p-3 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-100">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Purchase Amount</span>
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-lg font-black font-mono tracking-tight">
              ₹{fmtCurr(summary?.total_amount)}
            </div>
            <div className="text-[10px] text-blue-100 font-medium">
              Net Payable (Final)
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Detailed Breakdown Bar */}
      <div className="bg-slate-50/90 rounded-xl px-3.5 py-2.5 border border-slate-200/60 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Gross Wt:</span>
          <span className="font-mono font-bold text-slate-800">{fmt(summary?.total_gross_weight)} g</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Net Wt:</span>
          <span className="font-mono font-bold text-slate-800">{fmt(summary?.total_net_weight)} g</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Diamond Wt:</span>
          <span className="font-mono font-bold text-slate-800">{fmt(summary?.total_diamond_weight)} cts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Stone Wt:</span>
          <span className="font-mono font-bold text-slate-800">{fmt(summary?.total_stone_weight)} cts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Tags:</span>
          <span className="font-mono font-bold text-slate-800">{summary?.total_tags || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Metal Pcs:</span>
          <span className="font-mono font-bold text-slate-800">{summary?.total_metal_pieces || 0}</span>
        </div>
      </div>
    </div>
  );
};
