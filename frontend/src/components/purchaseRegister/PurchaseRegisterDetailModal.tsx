import React from 'react';
import { X, Receipt, Calendar, User, Layers, Scale, DollarSign, Tag, CheckCircle2 } from 'lucide-react';
import { PurchaseRegisterRecord } from '../../types';

interface PurchaseRegisterDetailModalProps {
  record: PurchaseRegisterRecord | null;
  onClose: () => void;
}

export const PurchaseRegisterDetailModal: React.FC<PurchaseRegisterDetailModalProps> = ({
  record,
  onClose,
}) => {
  if (!record) return null;

  const fmt = (val: number | undefined, decimals = 3) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.000' : n.toFixed(decimals);
  };

  const fmtCurr = (val: number | undefined) => {
    const n = parseFloat(String(val || 0));
    return isNaN(n) ? '0.00' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Purchase Register Details — {record.voucher_no}
              </h3>
              <p className="text-xs text-slate-500">
                Record ID: #{record.id} • {record.register_type}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
          {/* Primary Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Voucher No</span>
              <span className="font-mono font-bold text-slate-900">{record.voucher_no}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Voucher Date</span>
              <span className="font-medium text-slate-800">{record.voucher_date}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Voucher Type</span>
              <span className="font-semibold text-blue-700">{record.voucher_type}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Register Type</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-800 text-xs font-bold inline-block">
                {record.register_type}
              </span>
            </div>
          </div>

          {/* Party & Item Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                <User className="w-4 h-4 text-blue-600" />
                <span>Party & Account</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-slate-500">Party Name:</span>
                <span className="font-bold text-slate-900">{record.party_name}</span>
                <span className="text-slate-500">Account Group:</span>
                <span className="font-medium text-slate-800">{record.account_group || '—'}</span>
                <span className="text-slate-500">Branch:</span>
                <span className="font-medium text-slate-800">{record.branch_name || '—'}</span>
                <span className="text-slate-500">Login:</span>
                <span className="font-medium text-slate-800">{record.login_name || '—'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Item Classification</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-slate-500">Particular:</span>
                <span className="font-bold text-slate-900">{record.particular}</span>
                <span className="text-slate-500">Item Group:</span>
                <span className="font-medium text-slate-800">{record.item_group || '—'}</span>
                <span className="text-slate-500">Item Code:</span>
                <span className="font-mono text-slate-800">{record.item_code || '—'}</span>
                <span className="text-slate-500">Stamp / Quality:</span>
                <span className="font-medium text-slate-800">{record.stamp || '—'} / {record.quality || '—'}</span>
                <span className="text-slate-500">Category / Series:</span>
                <span className="font-medium text-slate-800">{record.category || '—'} / {record.series || '—'}</span>
              </div>
            </div>
          </div>

          {/* Weights & Values */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>Weights & Valuation Breakdown</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Weight</span>
                <span className="font-mono font-bold text-slate-900">{fmt(record.weight)} g</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Pieces (Pc)</span>
                <span className="font-mono font-bold text-slate-900">{record.pieces}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Purchase Value</span>
                <span className="font-mono font-bold text-blue-700">₹{fmtCurr(record.purchase_value)}</span>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                <span className="text-blue-700 block text-[11px] font-semibold">Total Amount</span>
                <span className="font-mono font-extrabold text-blue-900">₹{fmtCurr(record.amount)}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Gross Weight</span>
                <span className="font-mono font-semibold text-slate-800">{fmt(record.gross_weight)} g</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Net Weight</span>
                <span className="font-mono font-semibold text-slate-800">{fmt(record.net_weight)} g</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Diamond Weight</span>
                <span className="font-mono font-semibold text-slate-800">{fmt(record.diamond_weight)} ct</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Stone Weight</span>
                <span className="font-mono font-semibold text-slate-800">{fmt(record.stone_weight)} ct</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Gold Weight</span>
                <span className="font-mono font-semibold text-amber-700">{fmt(record.gold_weight)} g</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Silver Weight</span>
                <span className="font-mono font-semibold text-slate-700">{fmt(record.silver_weight)} g</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Return Weight / Pc</span>
                <span className="font-mono font-semibold text-rose-700">{fmt(record.return_weight)} g / {record.return_pieces}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-500 block text-[11px]">P. Ret. Value</span>
                <span className="font-mono font-semibold text-rose-700">₹{fmtCurr(record.purchase_return_value)}</span>
              </div>
            </div>
          </div>

          {/* Flags & Remarks */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { label: 'Approved', active: record.is_approved },
              { label: 'Include Metal', active: record.include_metal },
              { label: 'In Stock', active: record.in_stock },
              { label: 'Net Value', active: record.net_value },
              { label: 'Selected', active: record.is_selected },
              { label: 'Excluded', active: record.is_excluded },
              { label: 'Cancelled', active: record.is_cancelled },
            ].map((f) => (
              <span
                key={f.label}
                className={`px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${
                  f.active
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {f.label}
              </span>
            ))}
          </div>

          {record.remarks && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-600 block mb-1">Remarks:</span>
              <p className="text-slate-800">{record.remarks}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
