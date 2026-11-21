import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  Calculator,
  Tag,
  RefreshCw,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText
} from 'lucide-react';
import { ItemRecord } from '../types';
import { createItemApi, updateItemApi } from '../services/api';

interface ItemFormPageProps {
  item?: ItemRecord | null;
  onBack: () => void;
  onSaved: (item: ItemRecord) => void;
}

type TabType = 'accounting' | 'mrp' | 'policy' | 'tagging';

const initialFormState: Partial<ItemRecord> = {
  group_name: '',
  sgst: 1.50,
  cgst: 1.50,
  igst: 3.00,
  hsn_code: '7113',
  job_sac: '',
  gstr1_display: 'TAXABLE',
  l_tax: 0.00,
  c_tax: 0.00,
  com_co: '',
  gp_percentage: 0.00,
  op_value: 0.00,
  cl_value: 0.00,
  minimum_stock: 0,

  // MRP Detail
  mrp_type: 'FIXED',
  value_rate: 0.00,
  stock_method: 'FIFO',
  tunch: 0.00,
  default_item: '',

  // Return / Exchange Policy
  return_policy_enabled: true,
  return_valid_days: 7,
  return_deduction_percent: 0.00,
  exchange_policy_enabled: true,
  exchange_valid_days: 15,
  exchange_deduction_percent: 0.00,
  return_exchange_notes: '',

  // Tag Gen Restriction / Card Point
  tag_gen_restricted: false,
  tag_prefix: '',
  min_tag_weight: 0.000,
  max_tag_weight: 0.000,
  card_point_enabled: false,
  card_point_percentage: 0.00,
  card_points_per_gram: 0.00,

  is_active: true,
};

export const ItemFormPage: React.FC<ItemFormPageProps> = ({ item, onBack, onSaved }) => {
  const isEdit = !!item?.id;
  const [activeTab, setActiveTab] = useState<TabType>('accounting');
  const [formData, setFormData] = useState<Partial<ItemRecord>>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData(initialFormState);
    }
  }, [item]);

  const handleChange = (field: keyof ItemRecord, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-calculate IGST if SGST and CGST change
      if (field === 'sgst' || field === 'cgst') {
        const s = field === 'sgst' ? Number(value || 0) : Number(prev.sgst || 0);
        const c = field === 'cgst' ? Number(value || 0) : Number(prev.cgst || 0);
        next.igst = Number((s + c).toFixed(2));
      }
      return next;
    });
  };

  const handleReset = () => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData(initialFormState);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.group_name || formData.group_name.trim() === '') {
      setError('Group Name is required.');
      setActiveTab('accounting');
      return;
    }

    setLoading(true);
    try {
      let result: ItemRecord;
      if (isEdit && item?.id) {
        result = await updateItemApi(item.id, formData);
        setSuccess(`Item '${result.group_name}' updated successfully!`);
      } else {
        result = await createItemApi(formData);
        setSuccess(`New item '${result.group_name}' created successfully!`);
      }

      setTimeout(() => {
        onSaved(result);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save item details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-5 max-w-[1500px] mx-auto w-full space-y-4 overflow-y-auto">
      {/* Luxury Container */}
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 bg-white dark:bg-[#0c0f16]">
        {/* Header Bar */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isEdit ? `Edit Item: ${item?.group_name}` : 'Add New Item'}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-mono bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                  {isEdit ? `ID: #${item?.id}` : 'New Record'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure Accounting, Tax Rates, MRP valuation, Return policies &amp; Tagging rules
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Item List</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-white/[0.08] px-6 bg-slate-50/50 dark:bg-[#10141f]">
          <button
            type="button"
            onClick={() => setActiveTab('accounting')}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'accounting'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>1. Accounting Detail</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mrp')}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'mrp'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>2. MRP Detail</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'policy'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>3. Return / Exchange Policy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tagging')}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'tagging'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>4. Tag Gen Restriction / Card Point</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* TAB 1: Accounting Detail */}
          {activeTab === 'accounting' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Group Name */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Group Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SILVER JEWELLERY, GOLD METAL, DIAMOND"
                    value={formData.group_name || ''}
                    onChange={(e) => handleChange('group_name', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Unique item group classification name.</p>
                </div>

                {/* HSN Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    placeholder="7113 (Jewellery) / 7106 (Silver)"
                    value={formData.hsn_code || ''}
                    onChange={(e) => handleChange('hsn_code', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* GST Trio */}
                <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-[#151a26] border border-amber-200 dark:border-amber-500/20 col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
                      SGST (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sgst ?? 1.50}
                      onChange={(e) => handleChange('sgst', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-[#0c0f16] text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
                      CGST (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cgst ?? 1.50}
                      onChange={(e) => handleChange('cgst', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-[#0c0f16] text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
                      IGST (%) <span className="text-[10px] text-amber-600 dark:text-amber-400">(SGST + CGST)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.igst ?? 3.00}
                      onChange={(e) => handleChange('igst', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-[#0c0f16] text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Job SAC */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Job SAC
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9988"
                    value={formData.job_sac || ''}
                    onChange={(e) => handleChange('job_sac', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* GSTR1 Display */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    GSTR1 Display
                  </label>
                  <select
                    value={formData.gstr1_display || 'TAXABLE'}
                    onChange={(e) => handleChange('gstr1_display', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="TAXABLE">TAXABLE</option>
                    <option value="EXEMPTED">EXEMPTED</option>
                    <option value="NIL RATED">NIL RATED</option>
                    <option value="NON GST">NON GST</option>
                  </select>
                </div>

                {/* Com.Co */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Com.Co (Commodity / Company)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SILVER, BULLION, KUNDAN"
                    value={formData.com_co || ''}
                    onChange={(e) => handleChange('com_co', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* L.Tax & C.Tax */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    L.Tax (%) Local Tax
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.l_tax ?? 0.00}
                    onChange={(e) => handleChange('l_tax', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    C.Tax (%) Central Tax
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.c_tax ?? 0.00}
                    onChange={(e) => handleChange('c_tax', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* GP% */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    GP% (Gross Profit Target)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.gp_percentage ?? 0.00}
                    onChange={(e) => handleChange('gp_percentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Opening Value & Closing Value */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Opening Value (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.op_value ?? 0.00}
                    onChange={(e) => handleChange('op_value', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Closing Value (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cl_value ?? 0.00}
                    onChange={(e) => handleChange('cl_value', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Minimum Stock */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Minimum Stock Alert (Qty)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimum_stock ?? 0}
                    onChange={(e) => handleChange('minimum_stock', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MRP Detail */}
          {activeTab === 'mrp' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* MRP Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    MRP Type
                  </label>
                  <select
                    value={formData.mrp_type || 'FIXED'}
                    onChange={(e) => handleChange('mrp_type', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="FIXED">FIXED (Piece Rate / Tag MRP)</option>
                    <option value="WEIGHT_BASED">WEIGHT_BASED (Gross/Net Rate)</option>
                    <option value="RATE_CUT">RATE_CUT (Bullion MCX Cut)</option>
                    <option value="PERCENTAGE">PERCENTAGE (Markup over metal)</option>
                  </select>
                </div>

                {/* Value Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Value Rate (₹ / Rate Cut)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value_rate ?? 0.00}
                    onChange={(e) => handleChange('value_rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Stock Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Stock Valuation Method
                  </label>
                  <select
                    value={formData.stock_method || 'FIFO'}
                    onChange={(e) => handleChange('stock_method', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="FIFO">FIFO (First In First Out)</option>
                    <option value="WEIGHTED_AVG">WEIGHTED AVG (Weighted Average Cost)</option>
                    <option value="LIFO">LIFO (Last In First Out)</option>
                  </select>
                </div>

                {/* Tunch (Purity Touch) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tunch (Standard Touch Purity %)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tunch ?? 0.00}
                    onChange={(e) => handleChange('tunch', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">e.g. 92.50 (Silver), 99.90 (Bullion), 91.60 (22K Gold)</p>
                </div>

                {/* Default Item Name */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Item Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bombay Fancy Payal, Chorsa Bullion Bar"
                    value={formData.default_item || ''}
                    onChange={(e) => handleChange('default_item', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Return / Exchange Policy */}
          {activeTab === 'policy' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Return Policy Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#131722] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                      <span>Customer Return Policy</span>
                    </h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.return_policy_enabled}
                        onChange={(e) => handleChange('return_policy_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Return Window (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={!formData.return_policy_enabled}
                      value={formData.return_valid_days ?? 7}
                      onChange={(e) => handleChange('return_valid_days', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0f16] text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Return Deduction (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!formData.return_policy_enabled}
                      value={formData.return_deduction_percent ?? 0.00}
                      onChange={(e) => handleChange('return_deduction_percent', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0f16] text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Exchange Policy Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#131722] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                      <span>Item Exchange Policy</span>
                    </h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.exchange_policy_enabled}
                        onChange={(e) => handleChange('exchange_policy_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Exchange Window (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={!formData.exchange_policy_enabled}
                      value={formData.exchange_valid_days ?? 15}
                      onChange={(e) => handleChange('exchange_valid_days', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0f16] text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Exchange Deduction (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!formData.exchange_policy_enabled}
                      value={formData.exchange_deduction_percent ?? 0.00}
                      onChange={(e) => handleChange('exchange_deduction_percent', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0f16] text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Policy Terms & Notes */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Policy Terms / Invoice Disclaimer Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Original bill & tag mandatory. No deduction on silver exchange within 15 days."
                    value={formData.return_exchange_notes || ''}
                    onChange={(e) => handleChange('return_exchange_notes', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#131722] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Tag Gen Restriction / Card Point */}
          {activeTab === 'tagging' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tag Generation Restriction */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#131722] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tag Generation Restriction</span>
                    </h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.tag_gen_restricted}
                        onChange={(e) => handleChange('tag_gen_restricted', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tag Prefix
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SJ, SM, KJ, BJ"
                      value={formData.tag_prefix || ''}
                      onChange={(e) => handleChange('tag_prefix', e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0f16] text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Min Tag Weight (g)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.min_tag_weight ?? 0.000}
                        onChange={(e) => handleChange('min_tag_weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0f16] text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Max Tag Weight (g)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.max_tag_weight ?? 0.000}
                        onChange={(e) => handleChange('max_tag_weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0f16] text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Loyalty Card Points */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#131722] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Loyalty / Customer Card Points</span>
                    </h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.card_point_enabled}
                        onChange={(e) => handleChange('card_point_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Card Point Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!formData.card_point_enabled}
                      value={formData.card_point_percentage ?? 0.00}
                      onChange={(e) => handleChange('card_point_percentage', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0f16] text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Points Per Gram (Flat)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!formData.card_point_enabled}
                      value={formData.card_points_per_gram ?? 0.00}
                      onChange={(e) => handleChange('card_points_per_gram', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0f16] text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-medium text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] hover:brightness-105 active:scale-[0.99] text-slate-950 font-bold text-xs tracking-wide shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Update Item' : 'Save Item'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
