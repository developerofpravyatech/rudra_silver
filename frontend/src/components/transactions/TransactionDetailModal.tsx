import React from 'react';
import { Eye, X } from 'lucide-react';
import { DailyTransactionRecord } from '../../types';

interface TransactionDetailModalProps {
  item: DailyTransactionRecord;
  onClose: () => void;
  onEdit?: (id: number) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ item, onClose, onEdit }) => {
  const fmt = (val: number | undefined, decimals = 3) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.000' : n.toFixed(decimals);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-[#11151e] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
          <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900 dark:text-white">
            <Eye className="w-4 h-4 text-amber-500" />
            <span>Transaction #{item.id} Details</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
          <div>
            <span className="text-slate-400 block text-[11px]">Date</span>
            <strong>{item.transaction_date}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Type</span>
            <strong>{item.transaction_type}</strong>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 block text-[11px]">Party Name</span>
            <strong className="text-sm text-amber-600 dark:text-amber-400">{item.party_name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Ref No</span>
            <strong className="font-mono">{item.ref_no || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Series / Site</span>
            <strong>{item.series} / {item.site}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Voucher Type</span>
            <strong>{item.voucher_type}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Stamp / Purity</span>
            <strong>{item.stamp || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Pieces</span>
            <strong className="font-mono">{item.pc}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Gr. Weight</span>
            <strong className="font-mono">{fmt(item.gross_weight)} gm</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Net Weight</span>
            <strong className="font-mono">{fmt(item.net_weight)} gm</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Silver Fine</span>
            <strong className="font-mono">{fmt(item.silver_fine)} gm</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Gold Fine</span>
            <strong className="font-mono">{fmt(item.gold_fine)} gm</strong>
          </div>

          <div className="col-span-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex justify-between items-center">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Total Amount</span>
            <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
              ₹{fmt(item.total_amount, 2)}
            </span>
          </div>

          {item.narration && (
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px]">Narration</span>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5">{item.narration}</p>
            </div>
          )}

          {item.student_details && (
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px]">Student / Apprentice Info</span>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5">{item.student_details}</p>
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/[0.08]">
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item.id);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-semibold cursor-pointer"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const TransactionViewModal = TransactionDetailModal;
