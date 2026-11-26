import React from 'react';
import { Eye, X, Edit2, Scale, DollarSign, Calendar, FileText, UserCheck, Shield } from 'lucide-react';
import { SilverBullionRecord } from '../../types';

interface SilverBullionDetailModalProps {
  item: SilverBullionRecord;
  onClose: () => void;
  onEdit?: (id: number) => void;
}

export const SilverBullionDetailModal: React.FC<SilverBullionDetailModalProps> = ({ item, onClose, onEdit }) => {
  const fmt = (val: number | undefined, decimals = 3) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.000' : n.toFixed(decimals);
  };

  const isCr = item.transaction_type === 'CR' || item.fine_weight > 0 || item.amount > 0;
  const isDr = item.transaction_type === 'DR' || item.fine_weight_dr > 0 || item.amount_dr > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-[#0e121a] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Silver Bullion Entry #{item.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.transaction_type === 'CR'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                  {item.transaction_type === 'CR' ? 'Credit (Cr)' : 'Debit (Dr)'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{item.voucher_no || 'No Voucher No.'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs">
          {/* Party & General */}
          <div className="bg-slate-50 dark:bg-[#151922] p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Party / Account Name</span>
                <strong className="text-sm text-amber-600 dark:text-amber-400">{item.party_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Date</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{item.transaction_date}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">A/c Group</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.account_group_name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">A/c City</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.account_city || '—'}</span>
              </div>
            </div>
          </div>

          {/* Dual Credit / Debit Specs */}
          <div className="grid grid-cols-2 gap-3">
            {/* Credit Column */}
            <div className={`p-3.5 rounded-xl border ${isCr ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-50 dark:bg-[#151922] border-slate-200 dark:border-white/[0.06] opacity-60'}`}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                <span>Credit Side (Cr)</span>
              </h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Fine (Cr):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{fmt(item.fine_weight, 3)} gm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">P.Rate (Cr):</span>
                  <span className="text-slate-800 dark:text-slate-200">₹{fmt(item.silver_rate, 2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-white/[0.1] pt-1.5">
                  <span className="text-slate-400 font-sans">Amount (Cr):</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{fmt(item.amount, 2)}</span>
                </div>
              </div>
            </div>

            {/* Debit Column */}
            <div className={`p-3.5 rounded-xl border ${isDr ? 'bg-rose-500/5 border-rose-500/30' : 'bg-slate-50 dark:bg-[#151922] border-slate-200 dark:border-white/[0.06] opacity-60'}`}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1">
                <span>Debit Side (Dr)</span>
              </h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Fine (Dr):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{fmt(item.fine_weight_dr, 3)} gm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">S.Rate (Dr):</span>
                  <span className="text-slate-800 dark:text-slate-200">₹{fmt(item.silver_rate_dr, 2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-white/[0.1] pt-1.5">
                  <span className="text-slate-400 font-sans">Amount (Dr):</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">₹{fmt(item.amount_dr, 2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Staff & Metadata */}
          <div className="bg-slate-50 dark:bg-[#151922] p-3 rounded-xl border border-slate-200 dark:border-white/[0.06] grid grid-cols-3 gap-2 text-center text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">User</span>
              <strong>{item.user_name || 'Admin'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Salesman</span>
              <strong>{item.salesman_name || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Agent</span>
              <strong>{item.agent_name || '—'}</strong>
            </div>
          </div>

          {/* Checkbox Flags */}
          <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
            <span className={`px-2 py-0.5 rounded-md font-semibold border ${item.bhav ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'}`}>
              Bhav: {item.bhav ? 'Yes' : 'No'}
            </span>
            <span className={`px-2 py-0.5 rounded-md font-semibold border ${item.wo_sale ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'}`}>
              W/O Sale: {item.wo_sale ? 'Yes' : 'No'}
            </span>
            <span className={`px-2 py-0.5 rounded-md font-semibold border ${item.including_labour ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'}`}>
              Incl. Labour: {item.including_labour ? 'Yes' : 'No'}
            </span>
            <span className={`px-2 py-0.5 rounded-md font-semibold border ${item.exclude_rate_book ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'}`}>
              Excl. Rate Book: {item.exclude_rate_book ? 'Yes' : 'No'}
            </span>
          </div>

          {item.remarks && (
            <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Remarks: </span>
              {item.remarks}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item.id);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SilverBullionDetailModal;
