import React, { useState, useEffect } from 'react';
import { Account } from '../types';
import { searchAccounts } from '../services/api';
import { Search, Users, ArrowLeft } from 'lucide-react';

interface AccountLedgerModalProps {
  onClose: () => void;
  isInline?: boolean;
}

export const AccountLedgerModal: React.FC<AccountLedgerModalProps> = ({ onClose, isInline = true }) => {
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    searchAccounts(query).then(setAccounts);
  }, [query]);

  const content = (
    <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 w-full">
      {/* Title Bar */}
      <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
        <div className="flex items-center space-x-2.5">
          <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="font-display font-bold tracking-wider text-sm text-slate-900 dark:text-white">
            Party Ledgers  &bull; Triple-Currency Balance
          </span>
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
      <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search by party name or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="bg-white dark:bg-[#141822] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-white/[0.08]">
                  <th className="p-3">Code</th>
                  <th className="p-3">Party Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3 text-right">Cash Balance (₹)</th>
                  <th className="p-3 text-right">Fine Gold (g)</th>
                  <th className="p-3 text-right">Fine Silver (g)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-mono">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                      No accounts found. Type above to search.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                      <td className="p-3 font-bold text-slate-600 dark:text-slate-300">{acc.account_code}</td>
                      <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">{acc.name}</td>
                      <td className="p-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-[#1a2130] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/20">
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-slate-500 dark:text-slate-400">{acc.mobile}</td>
                      <td
                        className={`p-3 text-right font-bold ${acc.balance_inr < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                      >
                        ₹{acc.balance_inr.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-amber-700 dark:text-amber-400 font-bold">
                        {acc.balance_fine_gold.toFixed(3)} g
                      </td>
                      <td className="p-3 text-right text-slate-800 dark:text-slate-200 font-bold">
                        {acc.balance_fine_silver.toFixed(3)} g
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div className="flex-1 p-5 max-w-[1400px] mx-auto w-full overflow-y-auto">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden">
        {content}
      </div>
    </div>
  );
};
