import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Boxes,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { fetchMetalStockView, updateMetalStock, fetchMetalStockFilterOptions } from '../../services/api';
import { MetalStockFilterOptions } from '../../types';
import { showSuccessAlert, showErrorAlert, showValidationAlert } from '../../utils/alert';

interface MetalStockEditPageProps {
  recordId: number;
  onBackToList: () => void;
}

export const MetalStockEditPage: React.FC<MetalStockEditPageProps> = ({ recordId, onBackToList }) => {
  const [filterOptions, setFilterOptions] = useState<MetalStockFilterOptions>({
    groups: [],
    items: [],
    units: ['Gm'],
    stock_types: ['Finished', 'Raw', 'Unfinish', 'Dust', 'Quality'],
  });

  const [formData, setFormData] = useState({
    stock_date: '',
    group_name: '',
    item_name: '',
    unit: 'Gm',
    pc: '',
    gross_weight: '',
    net_weight: '',
    tunch: '',
    wastage: '',
    labour_weight: '',
    rate: '',
    silver_fine: '',
    total: '',
    gold_fine: '',
    stock_type: 'Finished',
    is_approved: false,
    entry_no: '',
    photo: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load record and filter options
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      fetchMetalStockView(recordId),
      fetchMetalStockFilterOptions(),
    ])
      .then(([item, options]) => {
        if (!isMounted) return;
        setFilterOptions(options);
        setFormData({
          stock_date: item.stock_date || '',
          group_name: item.group_name || '',
          item_name: item.item_name || '',
          unit: item.unit || 'Gm',
          pc: item.pc !== null && item.pc !== undefined ? String(item.pc) : '',
          gross_weight: item.gross_weight !== null && item.gross_weight !== undefined ? String(item.gross_weight) : '',
          net_weight: item.net_weight !== null && item.net_weight !== undefined ? String(item.net_weight) : '',
          tunch: item.tunch !== null && item.tunch !== undefined ? String(item.tunch) : '',
          wastage: item.wastage !== null && item.wastage !== undefined ? String(item.wastage) : '',
          labour_weight: item.labour_weight !== null && item.labour_weight !== undefined ? String(item.labour_weight) : '',
          rate: item.rate !== null && item.rate !== undefined ? String(item.rate) : '',
          silver_fine: item.silver_fine !== null && item.silver_fine !== undefined ? String(item.silver_fine) : '',
          total: item.total !== null && item.total !== undefined ? String(item.total) : '',
          gold_fine: item.gold_fine !== null && item.gold_fine !== undefined ? String(item.gold_fine) : '',
          stock_type: item.stock_type || 'Finished',
          is_approved: Boolean(item.is_approved),
          entry_no: item.entry_no || '',
          photo: item.photo || '',
        });
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setApiError(err.message || `Failed to load metal stock record #${recordId}.`);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [recordId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.item_name.trim()) {
      errs.item_name = 'Item Name is required.';
    }
    if (!formData.stock_date) {
      errs.stock_date = 'Stock Date is required.';
    }

    const numericFields = [
      'pc',
      'gross_weight',
      'net_weight',
      'tunch',
      'wastage',
      'labour_weight',
      'rate',
      'silver_fine',
      'total',
      'gold_fine',
    ];
    numericFields.forEach((f) => {
      const val = (formData as any)[f];
      if (val !== '' && val !== null && val !== undefined) {
        const strVal = String(val).trim();
        if (isNaN(Number(strVal))) {
          errs[f] = 'Must be a valid number.';
          return;
        }
        const num = Number(strVal);
        if (num < 0) {
          errs[f] = 'Cannot be negative.';
          return;
        }
        if (strVal.includes('.')) {
          const dec = strVal.split('.')[1];
          if (dec && dec.length > 3) {
            errs[f] = 'Max 3 decimal places allowed.';
          }
        }
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validate()) {
      showValidationAlert('Please fill in all required fields and correct the highlighted errors.', 'Validation Warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        stock_date: formData.stock_date,
        group_name: formData.group_name.trim() || undefined,
        item_name: formData.item_name.trim(),
        unit: formData.unit.trim() || 'Gm',
        pc: formData.pc !== '' ? Number(formData.pc) : 0,
        gross_weight: formData.gross_weight !== '' ? Number(formData.gross_weight) : 0,
        net_weight: formData.net_weight !== '' ? Number(formData.net_weight) : 0,
        tunch: formData.tunch !== '' ? Number(formData.tunch) : 0,
        wastage: formData.wastage !== '' ? Number(formData.wastage) : 0,
        labour_weight: formData.labour_weight !== '' ? Number(formData.labour_weight) : 0,
        rate: formData.rate !== '' ? Number(formData.rate) : 0,
        silver_fine: formData.silver_fine !== '' ? Number(formData.silver_fine) : 0,
        total: formData.total !== '' ? Number(formData.total) : 0,
        gold_fine: formData.gold_fine !== '' ? Number(formData.gold_fine) : 0,
        stock_type: formData.stock_type || undefined,
        is_approved: formData.is_approved,
        entry_no: formData.entry_no.trim() || undefined,
        photo: formData.photo.trim() || undefined,
      };

      const res = await updateMetalStock(recordId, payload);
      await showSuccessAlert(res.message || 'Metal stock item updated successfully.', 'Success!');
      onBackToList();
    } catch (err: any) {
      const msg = err.message || 'Failed to update metal stock item.';
      setApiError(msg);
      showErrorAlert(msg, 'Error!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-xs font-semibold">Loading metal stock record #{recordId}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900 flex flex-col font-sans">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto w-full space-y-4">
        {/* Header Bar */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Edit Metal Stock</h1>
              <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5 font-medium">
                <span className="hover:text-blue-600 cursor-pointer" onClick={onBackToList}>
                  Metal Stock List
                </span>
                <span>/</span>
                <span className="text-slate-800 font-semibold">Record #{recordId}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToList}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to List</span>
          </button>
        </div>

        {/* Notifications */}
        {apiError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-2 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Information */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                <span>Basic Details</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stock Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-500 ${
                      errors.stock_date ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.stock_date && <p className="text-[11px] text-red-500 mt-0.5">{errors.stock_date}</p>}
                </div>

                {/* Group Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={formData.group_name}
                    onChange={(e) => handleChange('group_name', e.target.value)}
                    placeholder="e.g. SILVER ORNAMENTS"
                    list="group-options"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="group-options">
                    {filterOptions.groups.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>

                {/* Item Name (Required) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => handleChange('item_name', e.target.value)}
                    placeholder="e.g. 7T D PAYAL"
                    list="item-options"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-500 uppercase font-semibold ${
                      errors.item_name ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  <datalist id="item-options">
                    {filterOptions.items.map((it) => (
                      <option key={it} value={it} />
                    ))}
                  </datalist>
                  {errors.item_name && <p className="text-[11px] text-red-500 mt-0.5">{errors.item_name}</p>}
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                    placeholder="e.g. Gm"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Stock Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Type</label>
                  <select
                    value={formData.stock_type}
                    onChange={(e) => handleChange('stock_type', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {filterOptions.stock_types.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Entry Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Entry No.</label>
                  <input
                    type="text"
                    value={formData.entry_no}
                    onChange={(e) => handleChange('entry_no', e.target.value)}
                    placeholder="e.g. EN-2027-01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Approval Status */}
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_approved}
                      onChange={(e) => handleChange('is_approved', e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">Approval Completed</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 2: Weights, Purity & Calculations */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                <span>Weight, Rates & Financial Values</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Pc */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pc</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.pc}
                    onChange={(e) => handleChange('pc', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>

                {/* Gross Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Weight (Gr.Wt.)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.gross_weight}
                    onChange={(e) => handleChange('gross_weight', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>

                {/* Net Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Net Weight (Net.Wt.)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.net_weight}
                    onChange={(e) => handleChange('net_weight', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>

                {/* Tunch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tunch (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tunch}
                    onChange={(e) => handleChange('tunch', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>

                {/* Wastage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wastage (Wstg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wastage}
                    onChange={(e) => handleChange('wastage', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>

                {/* Labour Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Labour Wt. (Lbr. Wt)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.labour_weight}
                    onChange={(e) => handleChange('labour_weight', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>

                {/* Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => handleChange('rate', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>

                {/* Silver Fine */}
                <div>
                  <label className="block text-xs font-semibold text-blue-900 mb-1">Silver Fine (Sil.Fine)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.silver_fine}
                    onChange={(e) => handleChange('silver_fine', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-blue-50/30 text-xs focus:ring-2 focus:ring-blue-500 text-right font-semibold"
                  />
                </div>

                {/* Total */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total}
                    onChange={(e) => handleChange('total', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/30 text-xs focus:ring-2 focus:ring-blue-500 text-right font-semibold"
                  />
                </div>

                {/* Gold Fine */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gold Fine</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.gold_fine}
                    onChange={(e) => handleChange('gold_fine', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onBackToList}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Metal Stock</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default MetalStockEditPage;
