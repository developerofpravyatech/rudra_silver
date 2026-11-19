import React, { useState } from 'react';
import { Box, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { BillingItem } from '../types';

interface InventoryPageProps {
  initialCategory?: string | null;
  onSelectForBilling: (item: Partial<BillingItem>) => void;
  onBackToDashboard: () => void;
}

interface InventoryItem {
  tag: string;
  category: string;
  name: string;
  purity: number;
  grossWt: number;
  lessWt: number;
  netWt: number;
  fineWt: number;
  labourRate: number;
  status: 'In Stock' | 'Low Stock' | 'Reserved';
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  initialCategory,
  onSelectForBilling,
  onBackToDashboard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [purityFilter, setPurityFilter] = useState<string>('ALL');

  const inventoryData: InventoryItem[] = [
    { tag: 'TAG-PYL-01', category: 'Payal', name: '7T Fancy Antique Payal', purity: 80.0, grossWt: 124.50, lessWt: 0.0, netWt: 124.50, fineWt: 99.60, labourRate: 5.0, status: 'In Stock' },
    { tag: 'TAG-PYL-02', category: 'Payal', name: 'Micro Jhallar Bridal Payal', purity: 92.5, grossWt: 85.20, lessWt: 1.2, netWt: 84.00, fineWt: 77.70, labourRate: 7.5, status: 'In Stock' },
    { tag: 'TAG-PYL-03', category: 'Payal', name: 'D Payal 7T Antique Finish', purity: 70.0, grossWt: 160.00, lessWt: 0.0, netWt: 160.00, fineWt: 112.00, labourRate: 4.5, status: 'Low Stock' },
    { tag: 'TAG-CHN-01', category: 'Chain', name: 'Silver Milano Italian Chain', purity: 92.5, grossWt: 32.40, lessWt: 0.0, netWt: 32.40, fineWt: 29.97, labourRate: 8.0, status: 'In Stock' },
    { tag: 'TAG-CHN-02', category: 'Chain', name: 'Hollow Rope Fancy Chain', purity: 92.5, grossWt: 18.90, lessWt: 0.0, netWt: 18.90, fineWt: 17.48, labourRate: 9.0, status: 'In Stock' },
    { tag: 'TAG-CHN-03', category: 'Chain', name: 'Double Link Curb Chain', purity: 80.0, grossWt: 45.60, lessWt: 0.0, netWt: 45.60, fineWt: 36.48, labourRate: 6.0, status: 'In Stock' },
    { tag: 'TAG-KDA-01', category: 'Kada', name: 'CNC Designer Men Kada', purity: 92.5, grossWt: 65.00, lessWt: 0.0, netWt: 65.00, fineWt: 60.12, labourRate: 8.0, status: 'In Stock' },
    { tag: 'TAG-KDA-02', category: 'Kada', name: 'Panjabi Heavy Sterling Kada', purity: 80.0, grossWt: 95.50, lessWt: 0.0, netWt: 95.50, fineWt: 76.40, labourRate: 5.5, status: 'Low Stock' },
    { tag: 'TAG-RNG-01', category: 'Ring', name: 'Solitaire Zircon Silver Ring', purity: 92.5, grossWt: 4.80, lessWt: 0.3, netWt: 4.50, fineWt: 4.16, labourRate: 15.0, status: 'In Stock' },
    { tag: 'TAG-RNG-02', category: 'Ring', name: 'Micro Vinti Men Signet Ring', purity: 92.5, grossWt: 8.20, lessWt: 0.0, netWt: 8.20, fineWt: 7.58, labourRate: 12.0, status: 'In Stock' },
    { tag: 'TAG-BRC-01', category: 'Bracelet', name: 'Milan Lucky Silver Bracelet', purity: 92.5, grossWt: 28.50, lessWt: 0.0, netWt: 28.50, fineWt: 26.36, labourRate: 8.0, status: 'In Stock' },
    { tag: 'TAG-OTH-01', category: 'Other', name: 'Silver Pooja Thali Complete Set', purity: 80.0, grossWt: 450.00, lessWt: 0.0, netWt: 450.00, fineWt: 360.00, labourRate: 4.0, status: 'In Stock' },
  ];

  const categories = ['ALL', 'Payal', 'Chain', 'Kada', 'Ring', 'Bracelet', 'Other'];

  const filteredItems = inventoryData.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPurity = purityFilter === 'ALL' || item.purity.toString() === purityFilter;
    return matchesCat && matchesSearch && matchesPurity;
  });

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      {/* Top Header Card */}
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
                Live Inventory &amp; Stock Catalogue
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Category Stock, Hallmarked Tags &amp; Silver Bullion Balance
              </p>
            </div>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Quick Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#0c0f16]">
          <div className="p-3 bg-white dark:bg-[#141822] rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Silver Stock</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">12.500 kg</div>
          </div>
          <div className="p-3 bg-white dark:bg-[#141822] rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Available Tag Stock</span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">9.800 kg</div>
          </div>
          <div className="p-3 bg-white dark:bg-[#141822] rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Low Stock Alert</span>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">2 Categories</div>
          </div>
          <div className="p-3 bg-white dark:bg-[#141822] rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Barcode Tags</span>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">{filteredItems.length} Items</div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-white dark:bg-[#141822] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search tag or item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 pl-8 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={purityFilter}
              onChange={(e) => setPurityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs text-slate-900 dark:text-white"
            >
              <option value="ALL">All Purities</option>
              <option value="92.5">92.5% Sterling</option>
              <option value="80">80.0% Standard</option>
              <option value="70">70.0% Antique</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-white/[0.08]">
                <th className="p-3">Tag #</th>
                <th className="p-3">Category</th>
                <th className="p-3">Item Description</th>
                <th className="p-3 text-right">Purity %</th>
                <th className="p-3 text-right">Gross Wt</th>
                <th className="p-3 text-right">Less Wt</th>
                <th className="p-3 text-right">Net Wt</th>
                <th className="p-3 text-right">Fine Wt</th>
                <th className="p-3 text-right">Labour/g</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-mono">
              {filteredItems.map((item) => (
                <tr key={item.tag} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                  <td className="p-3 font-bold text-amber-700 dark:text-amber-400">{item.tag}</td>
                  <td className="p-3 font-sans text-slate-600 dark:text-slate-300">{item.category}</td>
                  <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">{item.name}</td>
                  <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">{item.purity}%</td>
                  <td className="p-3 text-right text-slate-700 dark:text-slate-300">{item.grossWt.toFixed(2)} g</td>
                  <td className="p-3 text-right text-slate-500 dark:text-slate-400">{item.lessWt.toFixed(2)} g</td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{item.netWt.toFixed(2)} g</td>
                  <td className="p-3 text-right text-amber-700 dark:text-amber-300 font-bold">{item.fineWt.toFixed(2)} g</td>
                  <td className="p-3 text-right text-slate-600 dark:text-slate-400">₹{item.labourRate}/g</td>
                  <td className="p-3 text-center font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === 'In Stock'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-500/30'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-center font-sans">
                    <button
                      onClick={() =>
                        onSelectForBilling({
                          tagNumber: item.tag,
                          description: item.name,
                          grossWeight: item.grossWt,
                          lessWeight: item.lessWt,
                          purityTouch: item.purity,
                          labourRate: item.labourRate,
                        })
                      }
                      className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded font-bold text-[11px] hover:brightness-105 transition flex items-center gap-1 mx-auto"
                    >
                      <span>Bill</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
