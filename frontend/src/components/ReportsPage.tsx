import React, { useState } from 'react';
import { BarChart3, ArrowLeft, Calendar, FileSpreadsheet, ArrowUpRight, TrendingUp } from 'lucide-react';
import { DailySummary } from '../types';
import { DailyEntryDashboard } from './DailyEntryDashboard';

interface ReportsPageProps {
  summary: DailySummary;
  onOpenVoucher: (type: string) => void;
  onOpenLedger: () => void;
  onBackToDashboard: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  summary,
  onOpenVoucher,
  onOpenLedger,
  onBackToDashboard,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'daily-entry' | 'summary' | 'tax-register'>('daily-entry');

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
                Reports &amp; Daily Entry Hub
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Classical Jwelly Daily Entry Dashboard, Financial Summaries &amp; Tax Registers
              </p>
            </div>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#0c0f16] flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveReportTab('daily-entry')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeReportTab === 'daily-entry'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-white dark:bg-[#141822] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              Classical Daily Entry
            </button>
            <button
              onClick={() => setActiveReportTab('summary')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeReportTab === 'summary'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-white dark:bg-[#141822] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              Daily Financial Summary
            </button>
            <button
              onClick={() => setActiveReportTab('tax-register')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeReportTab === 'tax-register'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-white dark:bg-[#141822] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              GST Tax Summary
            </button>
          </div>

          <button
            onClick={() => alert('Exporting report as Excel spreadsheet...')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-medium text-xs hover:bg-emerald-100 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeReportTab === 'daily-entry' && (
            <div className="overflow-x-auto">
              <DailyEntryDashboard
                summary={summary}
                onOpenVoucher={onOpenVoucher}
                onOpenLedger={onOpenLedger}
              />
            </div>
          )}

          {activeReportTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="luxury-card rounded-xl p-4 border border-slate-200 dark:border-white/[0.08]">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Opening Cash Balance</span>
                  <div className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-300 mt-1">₹{summary.opening_cash.toLocaleString()}</div>
                </div>
                <div className="luxury-card rounded-xl p-4 border border-slate-200 dark:border-white/[0.08]">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Closing Cash Balance</span>
                  <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">₹{summary.closing_cash.toLocaleString()}</div>
                </div>
                <div className="luxury-card rounded-xl p-4 border border-slate-200 dark:border-white/[0.08]">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Sales Receipts</span>
                  <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1">₹48,750</div>
                </div>
                <div className="luxury-card rounded-xl p-4 border border-slate-200 dark:border-white/[0.08]">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Fine Silver Movement</span>
                  <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1">320.50 g</div>
                </div>
              </div>

              <div className="luxury-card rounded-xl p-5 border border-slate-200 dark:border-white/[0.08] space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Voucher Breakdown</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs font-mono">
                  {Object.entries(summary.voucher_counts).map(([key, count]) => (
                    <div key={key} className="p-3 bg-slate-50 dark:bg-[#141822] rounded-lg border border-slate-200 dark:border-white/[0.06] flex justify-between items-center">
                      <span className="font-sans capitalize text-slate-600 dark:text-slate-400">{key.replace('_', ' ')}:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeReportTab === 'tax-register' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-[#141822] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">GSTR-1 Monthly Sales Return Summary</h4>
                  <p className="text-slate-500 dark:text-slate-400">Total Taxable Value &amp; GST Output Liabilities</p>
                </div>
                <div className="flex items-center space-x-4 font-mono font-bold text-right">
                  <div>
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">CGST (1.5%)</div>
                    <div className="text-slate-800 dark:text-slate-200">₹731.25</div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">SGST (1.5%)</div>
                    <div className="text-slate-800 dark:text-slate-200">₹731.25</div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Total GST</div>
                    <div className="text-amber-700 dark:text-amber-300 text-sm">₹1,462.50</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
