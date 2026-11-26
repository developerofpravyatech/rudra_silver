import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Info,
  Receipt,
  Scale,
  Package,
  RotateCcw,
  RefreshCw,
  Tag,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react';
import {
  createItemApi,
  fetchItemCategoriesApi,
  fetchItemPurityStampsApi,
  checkItemCodeDuplicateApi,
} from '../../services/api';
import { CategoryOption, PurityStampOption } from '../../types';
import { showSuccessAlert, showErrorAlert, showValidationAlert } from '../../utils/alert';

interface ItemAddPageProps {
  onBackToList?: () => void;
}

export const ItemAddPage: React.FC<ItemAddPageProps> = ({ onBackToList }) => {
  const navigate = useNavigate();

  // Dropdown options loaded from existing MySQL tables
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stamps, setStamps] = useState<PurityStampOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState<boolean>(true);

  // Form Data State organized into 8 sections (A to H)
  const [formData, setFormData] = useState({
    // A. Basic Information
    group_name: '',
    code: '',
    category_id: 1,
    name: '',
    default_stamp_id: 1,
    default_item: '',
    is_active: true,

    // B. Tax Information
    sgst: '1.50',
    cgst: '1.50',
    igst: '3.00',
    hsn_code: '7113',
    job_sac: '',
    gstr1_display: 'TAXABLE',
    l_tax: '0.00',
    c_tax: '0.00',

    // C. Jewellery and Labour Information
    default_wastage: '0.00',
    default_labour_rate: '0.00',
    labour_type: 'PER_GRAM_NET',
    tunch: '0.00',
    com_co: '',
    gp_percentage: '0.00',

    // D. Stock and Valuation Information
    op_value: '0.00',
    cl_value: '0.00',
    minimum_stock: '0',
    mrp_type: 'FIXED',
    value_rate: '0.00',
    stock_method: 'FIFO',

    // E. Return Policy
    return_policy_enabled: true,
    return_valid_days: '7',
    return_deduction_percent: '0.00',
    return_exchange_notes: '',

    // F. Exchange Policy
    exchange_policy_enabled: true,
    exchange_valid_days: '15',
    exchange_deduction_percent: '0.00',

    // G. Tag Generation Settings
    tag_gen_restricted: false,
    tag_prefix: '',
    min_tag_weight: '0.000',
    max_tag_weight: '0.000',

    // H. Card Point Settings
    card_point_enabled: false,
    card_point_percentage: '0.00',
    card_points_per_gram: '0.00',

    // Additional backend preserved defaults
    sale_on_mrp: 'NO',
    divide_by: '1.00',
    into_by: '1.00',
    pur_less_pct: '0.00',
    sale_less_pct: '0.00',
    dis_types: 'PERCENTAGE',
    detail_salesman: '',
    update_mrp_col: 'AUTO',
    return_item_less_pct: '0.00',
    return_labour_less_pct: '0.00',
    return_diamond_less_pct: '0.00',
    return_stone_less_pct: '0.00',
    return_metal_by: 'CURRENT_RATE',
    exchange_item_less_pct: '0.00',
    exchange_labour_less_pct: '0.00',
    exchange_diamond_less_pct: '0.00',
    exchange_stone_less_pct: '0.00',
    exchange_metal_by: 'CURRENT_RATE',
    polish_wt: '0.000',
    stud_stamp: '',
    dia_rate: '0.00',
    stn_rate: '0.00',
    re_order_level: '0',
    upload_file: '',
  });

  // Code uniqueness state
  const [codeStatus, setCodeStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Submission & Validation States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load Categories & Purity Stamps from MySQL DB
  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchItemCategoriesApi(), fetchItemPurityStampsApi()])
      .then(([cats, stmps]) => {
        if (!isMounted) return;
        setCategories(cats);
        setStamps(stmps);
        if (cats.length > 0 && !formData.category_id) {
          setFormData((prev) => ({ ...prev, category_id: cats[0].id }));
        }
        if (stmps.length > 0 && !formData.default_stamp_id) {
          setFormData((prev) => ({
            ...prev,
            default_stamp_id: stmps[0].id,
            tunch: String(stmps[0].touch_purity),
          }));
        }
      })
      .catch((err) => {
        console.error('Error loading dropdowns:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingDropdowns(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Check unique item code against database
  const handleCheckCode = async (rawCode: string) => {
    const trimmed = rawCode.trim().toUpperCase();
    if (!trimmed) {
      setCodeStatus({ checking: false });
      return;
    }

    setCodeStatus({ checking: true });
    try {
      const res = await checkItemCodeDuplicateApi(trimmed);
      setCodeStatus({
        checking: false,
        available: res.available,
        message: res.message,
      });
      if (!res.available) {
        setFormErrors((prev) => ({ ...prev, code: res.message }));
      } else {
        setFormErrors((prev) => {
          const next = { ...prev };
          delete next.code;
          return next;
        });
      }
    } catch (err: any) {
      setCodeStatus({ checking: false });
    }
  };

  // General field change
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Auto update IGST when SGST or CGST changes
      if (field === 'sgst' || field === 'cgst') {
        const s = parseFloat(field === 'sgst' ? value : next.sgst) || 0;
        const c = parseFloat(field === 'cgst' ? value : next.cgst) || 0;
        next.igst = (s + c).toFixed(2);
      }

      // If stamp changes, update default tunch purity
      if (field === 'default_stamp_id') {
        const selectedStamp = stamps.find((s) => s.id === Number(value));
        if (selectedStamp) {
          next.tunch = String(selectedStamp.touch_purity);
        }
      }

      return next;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBack = () => {
    if (onBackToList) {
      onBackToList();
    } else {
      navigate('/items');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'This field is required.';
    }

    if (!formData.code.trim()) {
      errors.code = 'This field is required.';
    } else if (codeStatus.available === false) {
      errors.code = codeStatus.message || 'Item Code is already in use.';
    }

    if (!formData.group_name.trim()) {
      errors.group_name = 'This field is required.';
    }

    if (isNaN(Number(formData.tunch)) || Number(formData.tunch) < 0 || Number(formData.tunch) > 100) {
      errors.tunch = 'Tunch must be between 0 and 100.';
    }

    setFormErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      setTimeout(() => {
        const el = (document.querySelector(`[name="${firstInvalid}"]`) ||
                    document.querySelector('.border-red-400, .border-red-500, .border-red-600')) as HTMLElement | null;
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    const payload = {
      // A. Basic Information
      group_name: formData.group_name.trim(),
      code: formData.code.trim().toUpperCase(),
      category_id: Number(formData.category_id),
      name: formData.name.trim(),
      default_stamp_id: Number(formData.default_stamp_id),
      default_item: formData.default_item.trim(),
      is_active: formData.is_active,

      // B. Tax Information
      sgst: parseFloat(formData.sgst) || 0,
      cgst: parseFloat(formData.cgst) || 0,
      igst: parseFloat(formData.igst) || 0,
      hsn_code: formData.hsn_code.trim(),
      job_sac: formData.job_sac.trim(),
      gstr1_display: formData.gstr1_display.trim(),
      l_tax: parseFloat(formData.l_tax) || 0,
      c_tax: parseFloat(formData.c_tax) || 0,

      // C. Jewellery and Labour Information
      default_wastage: parseFloat(formData.default_wastage) || 0,
      default_labour_rate: parseFloat(formData.default_labour_rate) || 0,
      labour_type: formData.labour_type,
      tunch: parseFloat(formData.tunch) || 0,
      com_co: formData.com_co.trim(),
      gp_percentage: parseFloat(formData.gp_percentage) || 0,

      // D. Stock and Valuation Information
      op_value: parseFloat(formData.op_value) || 0,
      cl_value: parseFloat(formData.cl_value) || 0,
      minimum_stock: parseInt(formData.minimum_stock, 10) || 0,
      mrp_type: formData.mrp_type.trim(),
      value_rate: parseFloat(formData.value_rate) || 0,
      stock_method: formData.stock_method.trim(),

      // E. Return Policy
      return_policy_enabled: formData.return_policy_enabled,
      return_valid_days: parseInt(formData.return_valid_days, 10) || 0,
      return_deduction_percent: parseFloat(formData.return_deduction_percent) || 0,
      return_exchange_notes: formData.return_exchange_notes.trim() || null,

      // F. Exchange Policy
      exchange_policy_enabled: formData.exchange_policy_enabled,
      exchange_valid_days: parseInt(formData.exchange_valid_days, 10) || 0,
      exchange_deduction_percent: parseFloat(formData.exchange_deduction_percent) || 0,

      // G. Tag Generation Settings
      tag_gen_restricted: formData.tag_gen_restricted,
      tag_prefix: formData.tag_prefix.trim().toUpperCase(),
      min_tag_weight: parseFloat(formData.min_tag_weight) || 0,
      max_tag_weight: parseFloat(formData.max_tag_weight) || 0,

      // H. Card Point Settings
      card_point_enabled: formData.card_point_enabled,
      card_point_percentage: parseFloat(formData.card_point_percentage) || 0,
      card_points_per_gram: parseFloat(formData.card_points_per_gram) || 0,

      // Other backend supported defaults
      sale_on_mrp: formData.sale_on_mrp.trim(),
      divide_by: parseFloat(formData.divide_by) || 1.0,
      into_by: parseFloat(formData.into_by) || 1.0,
      pur_less_pct: parseFloat(formData.pur_less_pct) || 0,
      sale_less_pct: parseFloat(formData.sale_less_pct) || 0,
      dis_types: formData.dis_types.trim(),
      detail_salesman: formData.detail_salesman.trim(),
      update_mrp_col: formData.update_mrp_col.trim(),
      return_item_less_pct: parseFloat(formData.return_item_less_pct) || 0,
      return_labour_less_pct: parseFloat(formData.return_labour_less_pct) || 0,
      return_diamond_less_pct: parseFloat(formData.return_diamond_less_pct) || 0,
      return_stone_less_pct: parseFloat(formData.return_stone_less_pct) || 0,
      return_metal_by: formData.return_metal_by.trim(),
      exchange_item_less_pct: parseFloat(formData.exchange_item_less_pct) || 0,
      exchange_labour_less_pct: parseFloat(formData.exchange_labour_less_pct) || 0,
      exchange_diamond_less_pct: parseFloat(formData.exchange_diamond_less_pct) || 0,
      exchange_stone_less_pct: parseFloat(formData.exchange_stone_less_pct) || 0,
      exchange_metal_by: formData.exchange_metal_by.trim(),
      polish_wt: parseFloat(formData.polish_wt) || 0,
      stud_stamp: formData.stud_stamp.trim(),
      dia_rate: parseFloat(formData.dia_rate) || 0,
      stn_rate: parseFloat(formData.stn_rate) || 0,
      re_order_level: parseInt(formData.re_order_level, 10) || 0,
      upload_file: formData.upload_file.trim(),
    };

    try {
      const created = await createItemApi(payload);
      setSuccessToast(`Item '${created.name}' (${created.code}) created successfully!`);
      setTimeout(() => {
        handleBack();
      }, 1200);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create item. Please check inputs.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-4">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl bg-emerald-600 text-white flex items-center space-x-2 text-sm font-semibold animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Back to Item List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Add New Item</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                New Record
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Dashboard &nbsp;/&nbsp; Item Master &nbsp;/&nbsp; <span className="text-slate-800">Add Item</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Item</span>
          </button>
        </div>
      </div>

      {/* Global Error Alert */}
      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Organized into 8 Clear Sections (A to H) */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ========================================================= */}
        {/* SECTION A: Basic Information */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <Info className="w-4 h-4 text-blue-600" />
            <span>A. Basic Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Group Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="group_name"
                value={formData.group_name}
                onChange={(e) => handleChange('group_name', e.target.value)}
                onBlur={() => {
                  if (!formData.group_name.trim()) {
                    setFormErrors((prev) => ({ ...prev, group_name: 'This field is required.' }));
                  }
                }}
                placeholder="e.g. SILVER JEWELLERY"
                className={`w-full px-3 py-2 rounded-xl border text-xs text-slate-800 focus:outline-hidden focus:ring-2 ${
                  formErrors.group_name
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                    : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {formErrors.group_name && (
                <span className="text-[11px] text-red-600 font-medium mt-1 block">{formErrors.group_name}</span>
              )}
            </div>

            {/* Item Code (with uniqueness check) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Item Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={(e) => {
                    handleChange('code', e.target.value.toUpperCase());
                  }}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setFormErrors((prev) => ({ ...prev, code: 'This field is required.' }));
                    } else {
                      handleCheckCode(e.target.value);
                    }
                  }}
                  placeholder="e.g. ITM-PAYAL-02"
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-bold text-xs uppercase focus:outline-hidden focus:ring-2 ${
                    formErrors.code || codeStatus.available === false
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30 text-red-800'
                      : codeStatus.available === true
                      ? 'border-emerald-400 focus:ring-emerald-200 bg-emerald-50/20 text-emerald-800'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600 text-blue-700'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {codeStatus.checking && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                  {!codeStatus.checking && codeStatus.available === true && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                  {!codeStatus.checking && codeStatus.available === false && (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
              {formErrors.code && (
                <span className="text-[11px] text-red-600 font-medium mt-1 block">{formErrors.code}</span>
              )}
              {!formErrors.code && codeStatus.message && (
                <span
                  className={`text-[11px] font-medium mt-1 block ${
                    codeStatus.available ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {codeStatus.message}
                </span>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.metal_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Item Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => {
                  handleChange('name', e.target.value);
                  if (!formData.group_name) {
                    handleChange('group_name', e.target.value);
                  }
                }}
                onBlur={() => {
                  if (!formData.name.trim()) {
                    setFormErrors((prev) => ({ ...prev, name: 'This field is required.' }));
                  }
                }}
                placeholder="e.g. SILVER PAYAL"
                className={`w-full px-3 py-2 rounded-xl border text-xs text-slate-800 focus:outline-hidden focus:ring-2 ${
                  formErrors.name
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                    : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {formErrors.name && (
                <span className="text-[11px] text-red-600 font-medium mt-1 block">{formErrors.name}</span>
              )}
            </div>

            {/* Default Stamp */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Default Stamp (Purity)</label>
              <select
                value={formData.default_stamp_id}
                onChange={(e) => handleChange('default_stamp_id', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {stamps.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({Number(s.touch_purity).toFixed(2)}% - {s.metal_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Default Item */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Default Item Description</label>
              <input
                type="text"
                value={formData.default_item}
                onChange={(e) => handleChange('default_item', e.target.value)}
                placeholder="e.g. Bombay Fancy Payal"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center pt-2">
              <label className="inline-flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">Item is Active & Enabled</span>
              </label>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION B: Tax Information */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>B. Tax Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* SGST */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">SGST (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sgst}
                onChange={(e) => handleChange('sgst', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* CGST */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">CGST (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cgst}
                onChange={(e) => handleChange('cgst', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* IGST (Auto computed from SGST + CGST) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">IGST (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.igst}
                onChange={(e) => handleChange('igst', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* HSN Code */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">HSN Code</label>
              <input
                type="text"
                value={formData.hsn_code}
                onChange={(e) => handleChange('hsn_code', e.target.value)}
                placeholder="e.g. 7113"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Job SAC */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Job SAC</label>
              <input
                type="text"
                value={formData.job_sac}
                onChange={(e) => handleChange('job_sac', e.target.value)}
                placeholder="e.g. 998892"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* GSTR1 Display */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">GSTR1 Display</label>
              <select
                value={formData.gstr1_display}
                onChange={(e) => handleChange('gstr1_display', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="TAXABLE">TAXABLE</option>
                <option value="EXEMPTED">EXEMPTED</option>
                <option value="NIL_RATED">NIL RATED</option>
                <option value="NON_GST">NON GST</option>
              </select>
            </div>

            {/* L Tax */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">L Tax (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.l_tax}
                onChange={(e) => handleChange('l_tax', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* C Tax */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">C Tax (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.c_tax}
                onChange={(e) => handleChange('c_tax', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION C: Jewellery and Labour Information */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <Scale className="w-4 h-4 text-blue-600" />
            <span>C. Jewellery and Labour Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Default Wastage */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Default Wastage (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.default_wastage}
                onChange={(e) => handleChange('default_wastage', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Default Labour Rate */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Default Labour Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.default_labour_rate}
                onChange={(e) => handleChange('default_labour_rate', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 ${
                  formErrors.default_labour_rate
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                    : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {formErrors.default_labour_rate && (
                <span className="text-[11px] text-red-600 font-medium mt-1 block">
                  {formErrors.default_labour_rate}
                </span>
              )}
            </div>

            {/* Labour Type - strictly ENUM values from DB */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Labour Type</label>
              <select
                value={formData.labour_type}
                onChange={(e) => handleChange('labour_type', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="PER_GRAM_NET">PER_GRAM_NET (Per Gm Net)</option>
                <option value="PER_GRAM_GROSS">PER_GRAM_GROSS (Per Gm Gross)</option>
                <option value="PER_PIECE">PER_PIECE (Per Piece)</option>
                <option value="PERCENTAGE">PERCENTAGE (Percentage)</option>
              </select>
            </div>

            {/* Tunch */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tunch (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tunch}
                onChange={(e) => handleChange('tunch', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 ${
                  formErrors.tunch
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                    : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {formErrors.tunch && (
                <span className="text-[11px] text-red-600 font-medium mt-1 block">{formErrors.tunch}</span>
              )}
            </div>

            {/* Company Code */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Company Code (Com.Co)</label>
              <input
                type="text"
                value={formData.com_co}
                onChange={(e) => handleChange('com_co', e.target.value)}
                placeholder="e.g. CC-01"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* GP Percentage */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">GP Percentage (Gp %)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.gp_percentage}
                onChange={(e) => handleChange('gp_percentage', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION D: Stock and Valuation Information */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <Package className="w-4 h-4 text-blue-600" />
            <span>D. Stock and Valuation Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Opening Value */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Opening Value (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.op_value}
                onChange={(e) => handleChange('op_value', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Closing Value */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Closing Value (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cl_value}
                onChange={(e) => handleChange('cl_value', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Minimum Stock */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Stock (Qty)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.minimum_stock}
                onChange={(e) => handleChange('minimum_stock', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* MRP Type */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">MRP Type</label>
              <select
                value={formData.mrp_type}
                onChange={(e) => handleChange('mrp_type', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="FIXED">FIXED</option>
                <option value="VARIABLE">VARIABLE</option>
                <option value="RATE_CUT">RATE_CUT</option>
              </select>
            </div>

            {/* Value Rate */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Value Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.value_rate}
                onChange={(e) => handleChange('value_rate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stock Method */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Stock Method</label>
              <select
                value={formData.stock_method}
                onChange={(e) => handleChange('stock_method', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="FIFO">FIFO (First In First Out)</option>
                <option value="LIFO">LIFO (Last In First Out)</option>
                <option value="AVERAGE">AVERAGE (Average Cost)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION E: Return Policy */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <RotateCcw className="w-4 h-4 text-blue-600" />
            <span>E. Return Policy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Return Policy Enabled */}
            <div className="flex items-center pt-2">
              <label className="inline-flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.return_policy_enabled}
                  onChange={(e) => handleChange('return_policy_enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">Return Policy Enabled</span>
              </label>
            </div>

            {/* Return Valid Days */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Return Valid Days</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.return_valid_days}
                onChange={(e) => handleChange('return_valid_days', e.target.value)}
                disabled={!formData.return_policy_enabled}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>

            {/* Return Deduction Percent */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Return Deduction Percent (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.return_deduction_percent}
                onChange={(e) => handleChange('return_deduction_percent', e.target.value)}
                disabled={!formData.return_policy_enabled}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>

            {/* Return / Exchange Notes */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-bold text-slate-700 block mb-1">Return / Exchange Notes</label>
              <textarea
                rows={2}
                value={formData.return_exchange_notes}
                onChange={(e) => handleChange('return_exchange_notes', e.target.value)}
                placeholder="Enter special terms or conditions for returns/exchanges..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION F: Exchange Policy */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span>F. Exchange Policy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Exchange Policy Enabled */}
            <div className="flex items-center pt-2">
              <label className="inline-flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.exchange_policy_enabled}
                  onChange={(e) => handleChange('exchange_policy_enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">Exchange Policy Enabled</span>
              </label>
            </div>

            {/* Exchange Valid Days */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Exchange Valid Days</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.exchange_valid_days}
                onChange={(e) => handleChange('exchange_valid_days', e.target.value)}
                disabled={!formData.exchange_policy_enabled}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>

            {/* Exchange Deduction Percent */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Exchange Deduction Percent (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.exchange_deduction_percent}
                onChange={(e) => handleChange('exchange_deduction_percent', e.target.value)}
                disabled={!formData.exchange_policy_enabled}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION G: Tag Generation Settings */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <Tag className="w-4 h-4 text-blue-600" />
            <span>G. Tag Generation Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tag Generation Restricted */}
            <div className="flex items-center pt-2">
              <label className="inline-flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.tag_gen_restricted}
                  onChange={(e) => handleChange('tag_gen_restricted', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">Tag Gen Restricted</span>
              </label>
            </div>

            {/* Tag Prefix */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tag Prefix</label>
              <input
                type="text"
                value={formData.tag_prefix}
                onChange={(e) => handleChange('tag_prefix', e.target.value.toUpperCase())}
                placeholder="e.g. SLV"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Minimum Tag Weight */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Tag Weight (gms)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.min_tag_weight}
                onChange={(e) => handleChange('min_tag_weight', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Maximum Tag Weight */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Maximum Tag Weight (gms)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.max_tag_weight}
                onChange={(e) => handleChange('max_tag_weight', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION H: Card Point Settings */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <Award className="w-4 h-4 text-blue-600" />
            <span>H. Card Point Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card Point Enabled */}
            <div className="flex items-center pt-2">
              <label className="inline-flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.card_point_enabled}
                  onChange={(e) => handleChange('card_point_enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">Card Point Enabled</span>
              </label>
            </div>

            {/* Card Point Percentage */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Card Point Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.card_point_percentage}
                onChange={(e) => handleChange('card_point_percentage', e.target.value)}
                disabled={!formData.card_point_enabled}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>

            {/* Card Points Per Gram */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Card Points Per Gram</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.card_points_per_gram}
                onChange={(e) => handleChange('card_points_per_gram', e.target.value)}
                disabled={!formData.card_point_enabled}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions Bar at Bottom */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Item Record</span>
          </button>
        </div>
      </form>
    </div>
  );
};
