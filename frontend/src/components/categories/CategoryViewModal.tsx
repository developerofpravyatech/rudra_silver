import React from 'react';
import { X, Layers, Edit3, Tag, Hash, Package } from 'lucide-react';
import { CategoryRecord } from '../../types';

interface CategoryViewModalProps {
  category: CategoryRecord | null;
  onClose: () => void;
  onEdit?: (id: number) => void;
}

export const CategoryViewModal: React.FC<CategoryViewModalProps> = ({
  category,
  onClose,
  onEdit,
}) => {
  if (!category) return null;

  const renderMetalBadge = (metal: string) => {
    const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
      SILVER: { label: 'Silver', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
      GOLD: { label: 'Gold', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
      PLATINUM: { label: 'Platinum', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300' },
      DIAMOND: { label: 'Diamond', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
    };
    const b = map[metal.toUpperCase()] || { label: metal, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${b.bg} ${b.text} ${b.border}`}>
        {b.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">{category.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/20 text-white font-semibold">
                  ID #{category.id}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">Category Details & Information</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-800">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Category ID:
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">#{category.id}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Category Name:
              </span>
              <span className="font-bold text-slate-900 text-sm">{category.name}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Metal Type:
              </span>
              <div>{renderMetalBadge(category.metal_type)}</div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium">HSN Code:</span>
              <span className="font-mono font-semibold text-slate-900">{category.hsn_code || '—'}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400" /> Associated Items:
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {category.item_count !== undefined ? `${category.item_count} items` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Back to List
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(category.id);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Category</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
