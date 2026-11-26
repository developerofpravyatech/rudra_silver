import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Loader2,
  ShoppingBag,
  Scale,
  Layers,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import {
  SaleRegisterRecord,
  SaleRegisterFilterOptions,
} from '../../types';
import {
  createSaleRegister,
  fetchSaleRegisterFilterOptions,
} from '../../services/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alert';

interface SaleRegisterAddPageProps {
  onBackToList?: () => void;
}

export const SaleRegisterAddPage: React.FC<SaleRegisterAddPageProps> = ({
  onBackToList,
}) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    if (onBackToList) onBackToList();
    else navigate('/sale-register');
  };

  const [filterOptions, setFilterOptions] = useState<SaleRegisterFilterOptions>({
    parties: [],
    account_groups: [],
    item_groups: [],
    item_codes: [],
    stamps: [],
    branches: [],
    item_types: [],
    categories: [],
    series: [],
    qualities: [],
    voucher_types: [],
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<SaleRegisterRecord>>({
    voucher_no: '',
    voucher_date: new Date().toISOString().split('T')[0],
    voucher_type: 'SALE',
    party_name: '',
    account_group: '',
    item_group: '',
    item_code: '',
    stamp: '',
    branch_name: 'Rajkot Main',
    login_name: 'admin',
    register_type: 'TAGGED',
    item_name: '',
    particular: '',
    item_type: '',
    category: '',
    series: '',
    quality: '',
    weight: 0,
    pieces: 0,
    sale_value: 0,
    return_weight: 0,
    return_pieces: 0,
    sale_return_value: 0,
    gross_weight: 0,
    net_weight: 0,
    diamond_weight: 0,
    stone_weight: 0,
    tags: 0,
    metal_pieces: 0,
    gold_weight: 0,
    silver_weight: 0,
    amount: 0,
    is_sold: 1,
    in_stock: 0,
    net_value: 1,
    is_approved: 1,
    is_excluded: 0,
    include_metal: 1,
    remarks: '',
  });

  useEffect(() => {
    fetchSaleRegisterFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  const handleFieldChange = (field: keyof SaleRegisterRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: keyof SaleRegisterRecord) => {
    const requiredFields: (keyof SaleRegisterRecord)[] = [
      'voucher_no',
      'voucher_date',
      'party_name',
      'item_name',
      'item_type',
    ];
    if (requiredFields.includes(field)) {
      const val = String(formData[field] ?? '').trim();
      if (!val) {
        setFormErrors((prev) => ({ ...prev, [field]: 'This field is required.' }));
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!String(formData.voucher_no ?? '').trim()) errors.voucher_no = 'This field is required.';
    if (!String(formData.voucher_date ?? '').trim()) errors.voucher_date = 'This field is required.';
    if (!String(formData.party_name ?? '').trim()) errors.party_name = 'This field is required.';
    if (!String(formData.item_name ?? '').trim()) errors.item_name = 'This field is required.';
    if (!String(formData.item_type ?? '').trim()) errors.item_type = 'This field is required.';

    const numericFields: (keyof SaleRegisterRecord)[] = [
      'weight', 'pieces', 'sale_value', 'return_weight', 'return_pieces',
      'sale_return_value', 'gross_weight', 'net_weight', 'diamond_weight',
      'stone_weight', 'tags', 'metal_pieces', 'gold_weight', 'silver_weight', 'amount',
    ];
    for (const nf of numericFields) {
      const v = Number(formData[nf] ?? 0);
      if (isNaN(v) || v < 0) {
        errors[nf] = 'Value must be a non-negative number.';
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const el = document.querySelector(`[name="${firstKey}"]`) as HTMLElement | null;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setApiError(null);
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await createSaleRegister(formData);
      await showSuccessAlert('Sale Register entry added successfully.', 'Created!');
      handleCancel();
    } catch (err: any) {
      const msg = err.message || 'Failed to save sale register entry.';
      setApiError(msg);
      showErrorAlert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 text-xs rounded-xl border bg-white text-slate-900 focus:outline-hidden focus:ring-2 transition ${
      formErrors[field]
        ? 'border-rose-500 focus:ring-rose-200'
        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <span>Add Sale Register Entry</span>
              </h1>
              <p className="text-xs text-slate-500">Create a new sale register record in MySQL</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="sale-add-form"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{submitting ? 'Saving...' : 'Save Sale'}</span>
            </button>
          </div>
        </div>

        {apiError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form id="sale-add-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Voucher & Party Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Voucher & Party Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Voucher Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="voucher_no"
                  value={formData.voucher_no || ''}
                  onChange={(e) => handleFieldChange('voucher_no', e.target.value)}
                  onBlur={() => handleBlur('voucher_no')}
                  placeholder="e.g. SAL-2026-011"
                  className={inputClass('voucher_no')}
                />
                {formErrors.voucher_no && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.voucher_no}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Voucher Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="voucher_date"
                  value={formData.voucher_date || ''}
                  onChange={(e) => handleFieldChange('voucher_date', e.target.value)}
                  onBlur={() => handleBlur('voucher_date')}
                  className={inputClass('voucher_date')}
                />
                {formErrors.voucher_date && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.voucher_date}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Party Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="party_name"
                  list="sale-party-list"
                  value={formData.party_name || ''}
                  onChange={(e) => handleFieldChange('party_name', e.target.value)}
                  onBlur={() => handleBlur('party_name')}
                  placeholder="Enter or select party"
                  className={inputClass('party_name')}
                />
                <datalist id="sale-party-list">
                  {filterOptions.parties.map((p) => <option key={p} value={p} />)}
                </datalist>
                {formErrors.party_name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.party_name}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Voucher Type</label>
                <input
                  type="text"
                  name="voucher_type"
                  value={formData.voucher_type || ''}
                  onChange={(e) => handleFieldChange('voucher_type', e.target.value)}
                  className={inputClass('voucher_type')}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name || ''}
                  onChange={(e) => handleFieldChange('item_name', e.target.value)}
                  onBlur={() => handleBlur('item_name')}
                  placeholder="e.g. Gold Ring"
                  className={inputClass('item_name')}
                />
                {formErrors.item_name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.item_name}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Item Type <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="item_type"
                  list="sale-itemtype-list"
                  value={formData.item_type || ''}
                  onChange={(e) => handleFieldChange('item_type', e.target.value)}
                  onBlur={() => handleBlur('item_type')}
                  placeholder="e.g. Ring"
                  className={inputClass('item_type')}
                />
                <datalist id="sale-itemtype-list">
                  {filterOptions.item_types.map((t) => <option key={t} value={t} />)}
                </datalist>
                {formErrors.item_type && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.item_type}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Particular</label>
                <input
                  type="text"
                  name="particular"
                  value={formData.particular || ''}
                  onChange={(e) => handleFieldChange('particular', e.target.value)}
                  placeholder="e.g. 22K Gold Ring"
                  className={inputClass('particular')}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Register Type</label>
                <select
                  name="register_type"
                  value={formData.register_type || 'TAGGED'}
                  onChange={(e) => handleFieldChange('register_type', e.target.value)}
                  className={inputClass('register_type')}
                >
                  <option value="ALL">ALL</option>
                  <option value="TAGGED">TAGGED</option>
                  <option value="LOOSE">LOOSE</option>
                  <option value="JOB">JOB</option>
                  <option value="ORDER">ORDER</option>
                  <option value="W_O_TAG">W/O TAG</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Classification */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Item Classification & Metadata</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Group</label>
                <input
                  type="text"
                  name="account_group"
                  value={formData.account_group || ''}
                  onChange={(e) => handleFieldChange('account_group', e.target.value)}
                  className={inputClass('account_group')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Item Group</label>
                <input
                  type="text"
                  name="item_group"
                  value={formData.item_group || ''}
                  onChange={(e) => handleFieldChange('item_group', e.target.value)}
                  className={inputClass('item_group')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Item Code</label>
                <input
                  type="text"
                  name="item_code"
                  value={formData.item_code || ''}
                  onChange={(e) => handleFieldChange('item_code', e.target.value)}
                  className={inputClass('item_code')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Stamp</label>
                <input
                  type="text"
                  name="stamp"
                  value={formData.stamp || ''}
                  onChange={(e) => handleFieldChange('stamp', e.target.value)}
                  className={inputClass('stamp')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch</label>
                <input
                  type="text"
                  name="branch_name"
                  value={formData.branch_name || ''}
                  onChange={(e) => handleFieldChange('branch_name', e.target.value)}
                  className={inputClass('branch_name')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category || ''}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className={inputClass('category')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Series</label>
                <input
                  type="text"
                  name="series"
                  value={formData.series || ''}
                  onChange={(e) => handleFieldChange('series', e.target.value)}
                  className={inputClass('series')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Quality</label>
                <input
                  type="text"
                  name="quality"
                  value={formData.quality || ''}
                  onChange={(e) => handleFieldChange('quality', e.target.value)}
                  className={inputClass('quality')}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Weights & Values */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scale className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Weights, Pieces & Valuation</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { key: 'weight', label: 'Weight (g)', step: '0.001' },
                { key: 'pieces', label: 'Pieces (Pc)', step: '1' },
                { key: 'sale_value', label: 'Sale Value (₹)', step: '0.01' },
                { key: 'return_weight', label: 'Return Weight (g)', step: '0.001' },
                { key: 'return_pieces', label: 'Return Pieces', step: '1' },
                { key: 'sale_return_value', label: 'Sale Return Val (₹)', step: '0.01' },
                { key: 'gross_weight', label: 'Gross Weight (g)', step: '0.001' },
                { key: 'net_weight', label: 'Net Weight (g)', step: '0.001' },
                { key: 'diamond_weight', label: 'Diamond Weight (ct)', step: '0.001' },
                { key: 'stone_weight', label: 'Stone Weight (ct)', step: '0.001' },
                { key: 'tags', label: 'Tags', step: '1' },
                { key: 'metal_pieces', label: 'Metal Pieces', step: '1' },
                { key: 'gold_weight', label: 'Gold Weight (g)', step: '0.001' },
                { key: 'silver_weight', label: 'Silver Weight (g)', step: '0.001' },
                { key: 'amount', label: 'Total Amount (₹)', step: '0.01' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{f.label}</label>
                  <input
                    type="number"
                    name={f.key}
                    step={f.step}
                    min="0"
                    value={(formData as any)[f.key] ?? 0}
                    onChange={(e) => handleFieldChange(f.key as keyof SaleRegisterRecord, e.target.value)}
                    className={`${inputClass(f.key)} text-right font-mono`}
                  />
                  {formErrors[f.key] && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors[f.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Flags & Remarks */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Status Flags & Remarks</h2>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
              {[
                { key: 'is_sold', label: 'Sold' },
                { key: 'in_stock', label: 'In Stock' },
                { key: 'net_value', label: 'Net Value' },
                { key: 'is_approved', label: 'Approvals' },
                { key: 'is_excluded', label: 'Exclude' },
                { key: 'include_metal', label: 'Include Metal' },
              ].map((cb) => (
                <label key={cb.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean((formData as any)[cb.key])}
                    onChange={(e) => handleFieldChange(cb.key as keyof SaleRegisterRecord, e.target.checked ? 1 : 0)}
                    className="accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                  <span>{cb.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Remarks</label>
              <textarea
                name="remarks"
                rows={2}
                value={formData.remarks || ''}
                onChange={(e) => handleFieldChange('remarks', e.target.value)}
                placeholder="Optional notes or remarks..."
                className={inputClass('remarks')}
              />
            </div>
          </div>

          {/* Bottom Form Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs px-5 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{submitting ? 'Saving...' : 'Save Sale'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
