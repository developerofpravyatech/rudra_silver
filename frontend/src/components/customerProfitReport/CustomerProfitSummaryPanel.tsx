import React from 'react';
import { CustomerProfitSummary } from '../../types';
import {
  TrendingUp,
  RotateCcw,
  Sparkles,
  Scale,
  IndianRupee,
  Users,
  FileText,
} from 'lucide-react';

interface CustomerProfitSummaryPanelProps {
  summary: CustomerProfitSummary | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const CustomerProfitSummaryPanel: React.FC<CustomerProfitSummaryPanelProps> = ({
  summary,
  loading,
  onRefresh,
}) => {
  const fmtWt = (num?: number) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });

  const fmtCurr = (num?: number) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const isAmtPositive = (summary?.profit_in_amount || 0) >= 0;
  const isGoldProfitPositive = (summary?.gold_profit_fine || 0) >= 0;
  const isSilverProfitPositive = (summary?.silver_profit_fine || 0) >= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Customer Profit Summary
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1">
              <Users className="w-3 h-3" />
              {loading ? 'Calculating...' : `${summary?.total_customers || 0} Customers`}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {summary?.total_vouchers || 0} Vouchers
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Average Purchase Rates Info */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-600">
            <span>
              Gold Avg Rate:{' '}
              <strong className="font-mono text-amber-700">
                ₹{fmtCurr(summary?.gold_avg_rate)}/g
              </strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Silver Avg Rate:{' '}
              <strong className="font-mono text-slate-800">
                ₹{fmtCurr(summary?.silver_avg_rate)}/g
              </strong>
            </span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Recalculate profit summary"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
              <span>Recalculate</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Key Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Gold Wt */}
        <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-200/70">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gold Wt</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-extrabold text-slate-900 font-mono text-right">
            {fmtWt(summary?.gold_weight)}{' '}
            <span className="text-xs font-normal text-slate-500">g</span>
          </div>
          <div className="text-[11px] text-amber-700/80 mt-0.5 text-right">
            Total Sold Gold
          </div>
        </div>

        {/* 2. Silver Wt */}
        <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Silver Wt</span>
            <Scale className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-extrabold text-slate-900 font-mono text-right">
            {fmtWt(summary?.silver_weight)}{' '}
            <span className="text-xs font-normal text-slate-500">g</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 text-right">
            Total Sold Silver
          </div>
        </div>

        {/* 3. Gold Profit */}
        <div
          className={`rounded-xl p-3.5 border ${
            isGoldProfitPositive
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-rose-50/60 border-rose-200'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-1 ${
              isGoldProfitPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">Gold Profit</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div
            className={`text-lg font-extrabold font-mono text-right ${
              isGoldProfitPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {fmtWt(summary?.gold_profit_fine)}{' '}
            <span className="text-xs font-normal opacity-75">g</span>
          </div>
          <div
            className={`text-[11px] mt-0.5 text-right ${
              isGoldProfitPositive ? 'text-emerald-700/80' : 'text-rose-700/80'
            }`}
          >
            Fine Gold Equivalent
          </div>
        </div>

        {/* 4. Silver Profit */}
        <div
          className={`rounded-xl p-3.5 border ${
            isSilverProfitPositive
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-rose-50/60 border-rose-200'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-1 ${
              isSilverProfitPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">Silver Profit</span>
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div
            className={`text-lg font-extrabold font-mono text-right ${
              isSilverProfitPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {fmtWt(summary?.silver_profit_fine)}{' '}
            <span className="text-xs font-normal opacity-75">g</span>
          </div>
          <div
            className={`text-[11px] mt-0.5 text-right ${
              isSilverProfitPositive ? 'text-emerald-700/80' : 'text-rose-700/80'
            }`}
          >
            Fine Silver Equivalent
          </div>
        </div>

        {/* 5. Amt. Profit */}
        <div
          className={`rounded-xl p-3.5 shadow-xs flex flex-col justify-between text-white ${
            isAmtPositive ? 'bg-blue-600' : 'bg-rose-600'
          }`}
        >
          <div className="flex items-center justify-between text-white/85">
            <span className="text-[10px] font-bold uppercase tracking-wider">Amt. Profit</span>
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-lg font-black font-mono tracking-tight text-right">
              ₹{fmtCurr(summary?.profit_in_amount)}
            </div>
            <div className="text-[10px] text-white/80 font-medium text-right">
              Across All Matching Records
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Avg Rates Bar */}
      <div className="sm:hidden flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
        <span>
          Gold Avg: <strong className="font-mono text-amber-700">₹{fmtCurr(summary?.gold_avg_rate)}/g</strong>
        </span>
        <span>
          Silver Avg: <strong className="font-mono text-slate-800">₹{fmtCurr(summary?.silver_avg_rate)}/g</strong>
        </span>
      </div>
    </div>
  );
};
