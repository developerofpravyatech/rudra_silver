import React from 'react';
import { X, Sparkles, Scale, Layers, Calendar, Edit3, ShieldCheck, Tag } from 'lucide-react';
import { StockItem } from '../../types';

interface StockDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
  onEdit?: (item: StockItem) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
}) => {
  if (!isOpen || !item) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ● Available in Stock
          </span>
        );
      case 'Low Stock':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            ▲ Low Stock Alert
          </span>
        );
      case 'Out of Stock':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ✕ Out of Stock
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {item.stock_code}
                </span>
                {getStatusBadge(item.status)}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{item.item_name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Weight Matrix Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>Weight & Purity Accounting</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                <p className="text-[11px] text-slate-400 font-medium">Gross Weight</p>
                <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                  {Number(item.gross_weight).toFixed(3)} g
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                <p className="text-[11px] text-slate-400 font-medium">Stone Weight</p>
                <p className="text-base font-bold font-mono text-slate-500 mt-0.5">
                  {Number(item.stone_weight).toFixed(3)} g
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                <p className="text-[11px] text-slate-400 font-medium">Other Wt</p>
                <p className="text-base font-bold font-mono text-slate-500 mt-0.5">
                  {Number(item.other_weight).toFixed(3)} g
                </p>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-center">
                <p className="text-[11px] text-blue-700 font-medium">Net Weight</p>
                <p className="text-base font-bold font-mono text-blue-900 mt-0.5">
                  {Number(item.net_weight).toFixed(3)} g
                </p>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-center">
                <p className="text-[11px] text-amber-700 font-medium">Fine Metal</p>
                <p className="text-base font-bold font-mono text-amber-900 mt-0.5">
                  {Number(item.fine_weight).toFixed(3)} g
                </p>
              </div>
            </div>
          </div>

          {/* Classification & Master Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Classification</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Metal Type</span>
                  <span className="font-semibold text-slate-800">{item.metal_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Item Group</span>
                  <span className="font-semibold text-slate-800">{item.item_group_name || 'General Jewellery'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Purity Hallmark</span>
                  <span className="font-semibold text-slate-800">
                    {item.purity_name || 'Standard'} {item.touch_purity ? `(${item.touch_purity}% touch)` : ''}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Unit of Measure</span>
                  <span className="font-semibold text-slate-800">{item.unit_name} ({item.unit_code})</span>
                </div>
              </div>
            </div>

            {/* Inventory Status & Dates */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Stocking Metrics</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Quantity</span>
                  <span className="font-bold text-slate-800">{item.quantity}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Available Stock</span>
                  <span className="font-bold text-blue-700">{item.available_stock}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Minimum Alert Level</span>
                  <span className="font-semibold text-slate-800">{item.minimum_stock_level}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Purchase Date</span>
                  <span className="font-semibold text-slate-800">{item.purchase_date || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {item.remarks && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-500 mb-1">Remarks & Hallmark Notes</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.remarks}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <span className="text-xs text-slate-400">
            ID: #{item.id} • Registered in Rudra Silver ERP
          </span>
          <div className="flex items-center space-x-3">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Stock</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;
