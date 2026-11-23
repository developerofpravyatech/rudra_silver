import React from 'react';
import { X, Package, Calendar, Tag, ShieldCheck, Hash, Layers } from 'lucide-react';
import { MetalStockRecord } from '../../types';

interface MetalStockViewModalProps {
  item: MetalStockRecord;
  onClose: () => void;
}

export const MetalStockViewModal: React.FC<MetalStockViewModalProps> = ({ item, onClose }) => {
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
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase">{item.item_name}</h2>
              <p className="text-xs text-slate-500">Metal Stock Record #{item.id}</p>
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

        {/* Content Grid */}
        <div className="mt-4 space-y-4">
          {/* Metadata Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Stock Date</span>
              <span className="font-semibold text-slate-800">{item.stock_date || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Group Name</span>
              <span className="font-semibold text-slate-800">{item.group_name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Stock Type</span>
              <span className="font-semibold text-slate-800">{item.stock_type || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Approval</span>
              <span className={`font-semibold inline-block px-2 py-0.5 rounded text-[10px] ${
                item.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {item.is_approved ? 'Approved' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="py-2 px-3 text-left">Property</th>
                  <th className="py-2 px-3 text-right">Value</th>
                  <th className="py-2 px-3 text-left">Property</th>
                  <th className="py-2 px-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 text-slate-500 font-medium">Unit</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{item.unit || 'Gm'}</td>
                  <td className="py-2 px-3 text-slate-500 font-medium">Piece Count (Pc)</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.pc, 0)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-500 font-medium">Gross Weight</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.gross_weight, 3)}</td>
                  <td className="py-2 px-3 text-slate-500 font-medium">Net Weight</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.net_weight, 3)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-500 font-medium">Tunch (%)</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.tunch, 2)}</td>
                  <td className="py-2 px-3 text-slate-500 font-medium">Wastage</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.wastage, 2)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-500 font-medium">Labour Weight</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.labour_weight, 3)}</td>
                  <td className="py-2 px-3 text-slate-500 font-medium">Rate</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.rate, 2)}</td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className="py-2 px-3 text-blue-900 font-semibold">Silver Fine</td>
                  <td className="py-2 px-3 text-right font-bold text-blue-950">{formatNumber(item.silver_fine, 3)}</td>
                  <td className="py-2 px-3 text-blue-900 font-semibold">Total Amount</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-800">{formatNumber(item.total, 2)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-500 font-medium">Gold Fine</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(item.gold_fine, 3)}</td>
                  <td className="py-2 px-3 text-slate-500 font-medium">Entry Number</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{item.entry_no || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Timestamps */}
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
