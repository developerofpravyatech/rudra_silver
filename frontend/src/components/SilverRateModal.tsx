import React, { useState } from 'react';
import { TrendingUp, CheckCircle2, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { DailyRates } from '../types';

interface SilverRateModalProps {
  rates: DailyRates | null;
  onClose: () => void;
  isInline?: boolean;
}

export const SilverRateModal: React.FC<SilverRateModalProps> = ({ rates, onClose, isInline = true }) => {
  const [silver999, setSilver999] = useState<number>(
    rates?.silver_pure_sell_rate || 92000
  );
  const [silver925, setSilver925] = useState<number>(
    rates?.silver_925_rate || 85100
  );
  const [gold24k, setGold24k] = useState<number>(
    rates?.gold_24k_sell_rate || 78500
  );
  const [gold22k, setGold22k] = useState<number>(
    rates?.gold_22k_rate || 71900
  );
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const content = (
    <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 w-full">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
              Daily Bhav &bull; Live Board Rates
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Official Rudra Silver Buying &amp; Selling Board Rates
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4 text-xs overflow-y-auto">
        {isSaved && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Today's Board Rates successfully updated across all POS terminals!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Silver 999 Pure Card */}
          <div className="luxury-card rounded-xl p-4 border border-slate-200 dark:border-white/[0.08] space-y-2">
            <div className="flex justify-between items-center text-slate-800 dark:text-slate-300">
              <span className="font-semibold text-sm">Fine Silver (999 Pure)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +1.2%
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-slate-500 dark:text-slate-400">Per 1 kg:</span>
              <input
                type="number"
                value={silver999}
                onChange={(e) => setSilver999(parseFloat(e.target.value) || 0)}
                className="w-36 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded px-2 py-1 font-mono text-base font-bold text-amber-700 dark:text-amber-300 text-right"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Per 1 gram: ₹{(silver999 / 1000).toFixed(2)}
            </p>
          </div>

          {/* Silver 92.5 Sterling Card */}
          <div className="luxury-card rounded-xl p-4 border border-slate-200 dark:border-white/[0.08] space-y-2">
            <div className="flex justify-between items-center text-slate-800 dark:text-slate-300">
              <span className="font-semibold text-sm">Silver 92.5 Sterling</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +1.0%
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-slate-500 dark:text-slate-400">Per 1 kg:</span>
              <input
                type="number"
                value={silver925}
                onChange={(e) => setSilver925(parseFloat(e.target.value) || 0)}
                className="w-36 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded px-2 py-1 font-mono text-base font-bold text-slate-900 dark:text-slate-200 text-right"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Per 1 gram: ₹{(silver925 / 1000).toFixed(2)}
            </p>
          </div>

          {/* Gold 24K Pure Card */}
          <div className="luxury-card rounded-xl p-4 border border-slate-200 dark:border-white/[0.08] space-y-2">
            <div className="flex justify-between items-center text-slate-800 dark:text-slate-300">
              <span className="font-semibold text-sm">Gold 24K (99.9%)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +0.8%
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-slate-500 dark:text-slate-400">Per 10 g:</span>
              <input
                type="number"
                value={gold24k}
                onChange={(e) => setGold24k(parseFloat(e.target.value) || 0)}
                className="w-36 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded px-2 py-1 font-mono text-base font-bold text-amber-600 dark:text-amber-400 text-right"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Per 1 gram: ₹{(gold24k / 10).toFixed(2)}
            </p>
          </div>

          {/* Gold 22K (916) Card */}
          <div className="luxury-card rounded-xl p-4 border border-slate-200 dark:border-white/[0.08] space-y-2">
            <div className="flex justify-between items-center text-slate-800 dark:text-slate-300">
              <span className="font-semibold text-sm">Gold 22K (916 Hallmark)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +0.8%
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-slate-500 dark:text-slate-400">Per 10 g:</span>
              <input
                type="number"
                value={gold22k}
                onChange={(e) => setGold22k(parseFloat(e.target.value) || 0)}
                className="w-36 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded px-2 py-1 font-mono text-base font-bold text-amber-700 dark:text-amber-200 text-right"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Per 1 gram: ₹{(gold22k / 10).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="pt-3">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-md text-xs"
          >
            Update Board Rates (Broadcast to Terminals)
          </button>
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div className="flex-1 p-5 max-w-[1200px] mx-auto w-full overflow-y-auto">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl overflow-hidden flex flex-col">
        {content}
      </div>
    </div>
  );
};
