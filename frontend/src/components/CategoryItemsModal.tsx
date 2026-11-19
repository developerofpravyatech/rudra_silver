import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

interface CategoryItemsModalProps {
  categoryName: string;
  onSelectProduct: (productName: string, defaultPurity: number, approxGrossWt: number) => void;
  onClose: () => void;
  isInline?: boolean;
}

export const CategoryItemsModal: React.FC<CategoryItemsModalProps> = ({
  categoryName: initialCategory,
  onSelectProduct,
  onClose,
  isInline = true,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || 'Payal');

  // Sample stock products in each category
  const productsByCategory: Record<string, Array<{ code: string; name: string; purity: number; weight: number; pieces: number; labour: number }>> = {
    Payal: [
      { code: 'PYL-001', name: '7T Fancy Payal', purity: 80.0, weight: 124.50, pieces: 12, labour: 5.0 },
      { code: 'PYL-002', name: 'Micro Jhallar Payal', purity: 92.5, weight: 85.20, pieces: 8, labour: 7.5 },
      { code: 'PYL-003', name: 'D Payal 7T Antique', purity: 70.0, weight: 160.00, pieces: 5, labour: 4.5 },
      { code: 'PYL-004', name: 'Bridal Heavy Payal', purity: 92.5, weight: 240.00, pieces: 3, labour: 10.0 },
    ],
    Chain: [
      { code: 'CHN-101', name: 'Silver Milano Chain', purity: 92.5, weight: 32.40, pieces: 15, labour: 8.0 },
      { code: 'CHN-102', name: 'Hollow Rope Chain', purity: 92.5, weight: 18.90, pieces: 20, labour: 9.0 },
      { code: 'CHN-103', name: 'Double Link Curb Chain', purity: 80.0, weight: 45.60, pieces: 10, labour: 6.0 },
    ],
    Kada: [
      { code: 'KDA-201', name: 'CNC Designer Kada', purity: 92.5, weight: 65.00, pieces: 6, labour: 8.0 },
      { code: 'KDA-202', name: 'Panjabi Heavy Kada', purity: 80.0, weight: 95.50, pieces: 4, labour: 5.5 },
      { code: 'KDA-203', name: 'Two-Tone Antique Kada', purity: 92.5, weight: 72.00, pieces: 7, labour: 9.0 },
    ],
    Ring: [
      { code: 'RNG-301', name: 'Solitaire Zircon Silver Ring', purity: 92.5, weight: 4.80, pieces: 35, labour: 15.0 },
      { code: 'RNG-302', name: 'Micro Vinti Men Band', purity: 92.5, weight: 8.20, pieces: 22, labour: 12.0 },
    ],
    Bracelet: [
      { code: 'BRC-401', name: 'Milan Lucky Bracelet', purity: 92.5, weight: 28.50, pieces: 14, labour: 8.0 },
      { code: 'BRC-402', name: 'Baccha Lucky Charm', purity: 92.5, weight: 12.00, pieces: 18, labour: 10.0 },
    ],
    Other: [
      { code: 'OTH-501', name: 'Silver Pooja Thali Set', purity: 80.0, weight: 450.00, pieces: 2, labour: 4.0 },
      { code: 'OTH-502', name: 'Kandora Traditional Belt', purity: 70.0, weight: 380.00, pieces: 3, labour: 4.5 },
    ],
  };

  const categories = ['Payal', 'Chain', 'Kada', 'Ring', 'Bracelet', 'Other'];
  const productList = productsByCategory[activeCategory] || productsByCategory['Payal'];

  const content = (
    <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 w-full">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
              {activeCategory} &bull; Catalogue &amp; Tag Stock
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Browse available stock batches or select item for direct billing
            </p>
          </div>
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

      {/* Category selector pills */}
      <div className="px-6 pt-4 pb-1 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#0c0f16]">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-white dark:bg-[#141822] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4 text-xs overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {productList.map((prod) => (
            <div
              key={prod.code}
              className="luxury-card rounded-xl p-4 border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 dark:hover:border-amber-500/40 transition flex items-center justify-between group"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-500/20">
                    {prod.code}
                  </span>
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {prod.name}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Purity: <strong className="text-slate-800 dark:text-white">{prod.purity}%</strong></span>
                  <span>Avg Wt: <strong className="text-emerald-600 dark:text-emerald-400">{prod.weight}g</strong></span>
                  <span>Stock: <strong className="text-slate-700 dark:text-slate-300">{prod.pieces} pcs</strong></span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectProduct(prod.name, prod.purity, prod.weight);
                }}
                className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:brightness-105 transition flex items-center gap-1.5 text-xs shrink-0 shadow-sm"
              >
                <span>Bill Item</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl overflow-hidden flex flex-col">
        {content}
      </div>
    </div>
  );
};
