import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Info,
  Receipt,
  Scale,
  Layers,
  RotateCcw,
  RefreshCw,
  Tag,
  Award,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { ItemRecord } from '../../types';

interface ItemViewModalProps {
  item: ItemRecord | null;
  onClose: () => void;
}

export const ItemViewModal: React.FC<ItemViewModalProps> = ({ item, onClose }) => {
  const [activeViewSection, setActiveViewSection] = useState<
    'ACCOUNTING' | 'MRP' | 'POLICY' | 'TAG_GEN'
  >('ACCOUNTING');

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight">{item.name || item.group_name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/20 text-white font-semibold">
                  {item.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.is_active ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'
                  }`}
                >
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Group: {item.group_name} &bull; Category: {item.category_name || `ID #${item.category_id}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Organized into Core Info + Dynamic Dropdown Sections */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          {/* Section A: Basic Information (Always Visible) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-200 text-blue-800 font-bold text-sm">
              <Info className="w-4 h-4 text-blue-600" />
              <span>A. Basic Information</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-slate-500 block">Item Name</span>
                <span className="font-semibold text-slate-900">{item.name || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Item Code</span>
                <span className="font-mono font-bold text-blue-700">{item.code || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Group Name</span>
                <span className="font-semibold text-slate-900">{item.group_name || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Category</span>
                <span className="font-medium text-slate-900">
                  {item.category_name || `ID #${item.category_id}`}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Default Stamp</span>
                <span className="font-medium text-slate-900">
                  {item.stamp_name || `ID #${item.default_stamp_id}`}
                  {item.stamp_touch_purity !== undefined && (
                    <span className="text-slate-500 ml-1">({Number(item.stamp_touch_purity).toFixed(2)}%)</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Default Item Description</span>
                <span className="font-medium text-slate-900">{item.default_item || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Status</span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    item.is_active ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {item.is_active ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-400" /> Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* DYNAMIC DETAIL VIEW SELECTION DROPDOWN (4 OPTIONS) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 shadow-2xs">
            <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Detail Configuration View</span>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="view-modal-select" className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Select Section:
              </label>
              <select
                id="view-modal-select"
                value={activeViewSection}
                onChange={(e) => setActiveViewSection(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-blue-400 bg-white font-bold text-xs text-blue-900 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                <option value="ACCOUNTING">1. Accounting Detail</option>
                <option value="MRP">2. MRP Detail</option>
                <option value="POLICY">3. Return/Exchange Policy</option>
                <option value="TAG_GEN">4. Tag Gen Restriction / Card Point</option>
              </select>
            </div>
          </div>

          {/* OPTION 1: ACCOUNTING DETAIL */}
          {activeViewSection === 'ACCOUNTING' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Tax & Registration (Screenshot 1) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-200 text-blue-800 font-bold text-sm">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>Accounting Detail – Tax & Registration</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-500 block">SGST (%)</span>
                    <span className="font-mono font-semibold text-slate-900">{Number(item.sgst).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">CGST (%)</span>
                    <span className="font-mono font-semibold text-slate-900">{Number(item.cgst).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">IGST (%)</span>
                    <span className="font-mono font-bold text-indigo-700">{Number(item.igst).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">HSN Code</span>
                    <span className="font-mono font-semibold text-slate-900">{item.hsn_code || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Job SAC</span>
                    <span className="font-mono text-slate-900">{item.job_sac || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">GSTR1 Display</span>
                    <span className="font-medium text-slate-900">{item.gstr1_display || 'TAXABLE'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">L Tax (%)</span>
                    <span className="font-mono text-slate-900">{Number(item.l_tax).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">C Tax (%)</span>
                    <span className="font-mono text-slate-900">{Number(item.c_tax).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Com.Co</span>
                    <span className="font-semibold text-slate-900">{item.com_co || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">GP Percentage</span>
                    <span className="font-mono text-slate-900">{Number(item.gp_percentage).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Opening Value</span>
                    <span className="font-mono text-slate-900">₹{Number(item.op_value).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Closing Value</span>
                    <span className="font-mono text-slate-900">₹{Number(item.cl_value).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Minimum Stock</span>
                    <span className="font-mono text-slate-900">{item.minimum_stock || 0}</span>
                  </div>
                </div>
              </div>

              {/* Valuation & Stock Rules (Screenshot 2) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-200 text-blue-800 font-bold text-sm">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Valuation & Stock Rules</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Type (MRP Type)</span>
                    <span className="font-semibold text-blue-700">{item.mrp_type || 'FIXED'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Value.Rate</span>
                    <span className="font-mono text-slate-900">₹{Number(item.value_rate).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Stk.Method</span>
                    <span className="font-semibold text-slate-900">{item.stock_method || 'FIFO'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tunch (%)</span>
                    <span className="font-mono font-bold text-slate-900">{Number(item.tunch).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Def Item</span>
                    <span className="font-medium text-slate-900">{item.default_item || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 2: MRP DETAIL (Screenshot 3) */}
          {activeViewSection === 'MRP' && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-200 text-blue-800 font-bold text-sm">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>MRP Detail Configuration</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 block">Group Name</span>
                  <span className="font-semibold text-slate-900">{item.group_name || '—'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Sale On Mrp</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.sale_on_mrp === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {item.sale_on_mrp || 'NO'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Divide By</span>
                  <span className="font-mono text-slate-900">{Number(item.divide_by ?? 1).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Into By</span>
                  <span className="font-mono text-slate-900">{Number(item.into_by ?? 1).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Pur Less %</span>
                  <span className="font-mono text-amber-700 font-bold">{Number(item.pur_less_pct ?? 0).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Sale Less %</span>
                  <span className="font-mono text-emerald-700 font-bold">{Number(item.sale_less_pct ?? 0).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Dis Types</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono">{item.dis_types || 'PERCENTAGE'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Detail Salesman</span>
                  <span className="font-medium text-slate-900">{item.detail_salesman || '—'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Update Mrp Col</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">{item.update_mrp_col || 'AUTO'}</span>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 3: RETURN/EXCHANGE POLICY (Screenshot 4) */}
          {activeViewSection === 'POLICY' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Return Less % */}
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/20">
                <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-blue-200 text-blue-800 font-bold text-sm">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>A. Return Less %</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Group Name</span>
                    <span className="font-semibold text-slate-900">{item.group_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Item Less %</span>
                    <span className="font-mono font-bold text-slate-900">{Number(item.return_item_less_pct ?? item.return_deduction_percent ?? 0).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Labour Less %</span>
                    <span className="font-mono text-slate-900">{Number(item.return_labour_less_pct ?? 0).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Diamond Less %</span>
                    <span className="font-mono text-slate-900">{Number(item.return_diamond_less_pct ?? 0).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Stone Less %</span>
                    <span className="font-mono text-slate-900">{Number(item.return_stone_less_pct ?? 0).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Metal By</span>
                    <span className="font-mono font-semibold text-blue-700">{item.return_metal_by || 'CURRENT_RATE'}</span>
                  </div>
                </div>
              </div>

              {/* Exchange Less % */}
              <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/20">
                <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-indigo-200 text-indigo-800 font-bold text-sm">
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                  <span>B. Exchange Less %</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Item Less %</span>
                    <span className="font-mono font-bold text-slate-900">{Number(item.exchange_item_less_pct ?? item.exchange_deduction_percent ?? 0).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Labour Less %</span>
                    <span className="font-mono text-slate-900">{Number(item.exchange_labour_less_pct ?? 0).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Diamond Less %</span>
                    <span className="font-mono text-slate-900">{Number(item.exchange_diamond_less_pct ?? 0).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Stone Less %</span>
                    <span className="font-mono text-slate-900">{Number(item.exchange_stone_less_pct ?? 0).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Metal By</span>
                    <span className="font-mono font-semibold text-indigo-700">{item.exchange_metal_by || 'CURRENT_RATE'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 4: TAG GEN RESTRICTION / CARD POINT (Screenshot 5) */}
          {activeViewSection === 'TAG_GEN' && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-200 text-blue-800 font-bold text-sm">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Tag Gen Restriction / Card Point Details</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 block">Group Name</span>
                  <span className="font-semibold text-slate-900">{item.group_name || '—'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Tag Code</span>
                  <span className="font-mono font-bold text-blue-700">{item.tag_prefix || item.code || '—'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Stamp</span>
                  <span className="font-medium text-slate-900">{item.stamp_name || `Stamp #${item.default_stamp_id}`}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Metal</span>
                  <span className="font-semibold text-amber-800">{item.category_metal_type || 'SILVER'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Labour Rate</span>
                  <span className="font-mono font-bold text-emerald-700">₹{Number(item.default_labour_rate).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Polish Wt</span>
                  <span className="font-mono text-slate-900">{Number(item.polish_wt ?? 0).toFixed(3)} g</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Stud Stamp</span>
                  <span className="font-mono text-slate-900">{item.stud_stamp || '—'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Dia Rate</span>
                  <span className="font-mono text-slate-900">₹{Number(item.dia_rate ?? 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Stn Rate</span>
                  <span className="font-mono text-slate-900">₹{Number(item.stn_rate ?? 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Re Order Level</span>
                  <span className="font-mono font-bold text-slate-900">{item.re_order_level ?? item.minimum_stock ?? 0}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Upload File</span>
                  <span className="font-mono text-slate-700">{item.upload_file || 'None'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200 pt-3">
            <span>Created: {item.created_at || '—'}</span>
            <span>Last Updated: {item.updated_at || '—'}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
