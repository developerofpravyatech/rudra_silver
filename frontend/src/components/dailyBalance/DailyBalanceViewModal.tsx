import React from 'react';
import { X, Scale, User, MapPin, Phone, Calendar } from 'lucide-react';
import { DailyBalanceRecord } from '../../types';

interface DailyBalanceViewModalProps {
  item?: DailyBalanceRecord;
  record?: DailyBalanceRecord;
  onClose: () => void;
  onEdit?: () => void;
}

export const DailyBalanceViewModal: React.FC<DailyBalanceViewModalProps> = ({ item: propItem, record, onClose, onEdit }) => {
  const item = propItem || record;
  if (!item) return null;

  const formatNumber = (val: number | null | undefined, decimals = 3): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return '—';
    return Number(val).toFixed(decimals);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase">{item.account_name}</h2>
              <p className="text-xs text-slate-500">
                Daily Balance Record #{item.id} {item.city ? `• ${item.city}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Metadata badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">City / Location</span>
              <span className="font-semibold text-slate-800">{item.city || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Mobile</span>
              <span className="font-semibold text-slate-800">{item.mobile || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Balance Date</span>
              <span className="font-semibold text-slate-800">{item.balance_date || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Payment Date</span>
              <span className="font-semibold text-slate-800">{item.payment_date || '—'}</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="py-2 px-3 text-left">Balance Property</th>
                  <th className="py-2 px-3 text-right">Value</th>
                  <th className="py-2 px-3 text-left">Balance Property</th>
                  <th className="py-2 px-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 text-slate-600 font-medium">Gold Fine</td>
                  <td className={`py-2 px-3 text-right font-bold ${item.gold_fine < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatNumber(item.gold_fine, 3)}
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-medium">Silver Fine</td>
                  <td className={`py-2 px-3 text-right font-bold ${item.silver_fine < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatNumber(item.silver_fine, 3)}
                  </td>
                </tr>
                <tr className="bg-blue-50/30">
                  <td className="py-2 px-3 text-blue-900 font-semibold">Total Amount</td>
                  <td className={`py-2 px-3 text-right font-extrabold ${item.amount < 0 ? 'text-red-600' : 'text-emerald-800'}`}>
                    ₹{formatNumber(item.amount, 2)}
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-medium">Phone</td>
                  <td className="py-2 px-3 text-right font-medium text-slate-800">
                    {item.phone || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-600 font-medium">Diamond Wt. (Dia.Wt.)</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.diamond_weight, 3)}</td>
                  <td className="py-2 px-3 text-slate-600 font-medium">Stone Wt. (Stn.Wt.)</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.stone_weight, 3)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-600 font-medium">Gold Gr.Wt. [G]</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.gold_gross_weight, 3)}</td>
                  <td className="py-2 px-3 text-slate-600 font-medium">Silver Gr.Wt. [S]</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.silver_gross_weight, 3)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-600 font-medium">Linked Party ID</td>
                  <td className="py-2 px-3 text-right text-slate-800">{item.party_id ? `#${item.party_id}` : 'Manual'}</td>
                  <td className="py-2 px-3 text-slate-600 font-medium">Group / State</td>
                  <td className="py-2 px-3 text-right text-slate-800">
                    {[item.group_name, item.account_state].filter(Boolean).join(' • ') || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Created: {item.created_at || '—'}</span>
            <span>Last Updated: {item.updated_at || '—'}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
