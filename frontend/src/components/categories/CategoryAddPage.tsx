import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Layers,
  Tag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  Hash,
} from 'lucide-react';
import {
  createCategoryApi,
  checkCategoryNameDuplicateApi,
  fetchCategoryMetalTypesApi,
} from '../../services/api';
import { showSuccessAlert, showErrorAlert, showValidationAlert } from '../../utils/alert';

interface CategoryAddPageProps {
  onBackToList?: () => void;
}

export const CategoryAddPage: React.FC<CategoryAddPageProps> = ({ onBackToList }) => {
  const navigate = useNavigate();

  const [metalTypes, setMetalTypes] = useState<string[]>(['GOLD', 'SILVER', 'PLATINUM', 'DIAMOND']);
  const [formData, setFormData] = useState({
    metal_type: 'SILVER',
    name: '',
    hsn_code: '7113',
  });

  const [nameStatus, setNameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchCategoryMetalTypesApi()
      .then((types) => {
        if (isMounted) {
          setMetalTypes(types);
          if (types.length > 0 && !types.includes(formData.metal_type)) {
            setFormData((prev) => ({ ...prev, metal_type: types[0] }));
          }
        }
      })
      .catch((err) => console.error('Failed to load metal types:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheckName = async (nameToTest: string) => {
    const trimmed = nameToTest.trim();
    if (!trimmed) {
      setNameStatus({ checking: false });
      return;
    }

    setNameStatus({ checking: true });
    try {
      const res = await checkCategoryNameDuplicateApi(trimmed);
      setNameStatus({
        checking: false,
        available: res.available,
        message: res.message,
      });
      if (!res.available) {
        setFormErrors((prev) => ({ ...prev, name: res.message }));
      } else {
        setFormErrors((prev) => {
          const next = { ...prev };
          delete next.name;
          return next;
        });
      }
    } catch {
      setNameStatus({ checking: false });
    }
  };

  const handleBack = () => {
    if (onBackToList) {
      onBackToList();
    } else {
      navigate('/categories');
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Category Name is required.';
    } else if (nameStatus.available === false) {
      errors.name = nameStatus.message || 'Category Name is already taken.';
    }

    if (!formData.metal_type.trim()) {
      errors.metal_type = 'Metal Type is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showValidationAlert('Please fill in all required fields and resolve errors.', 'Validation Warning');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const created = await createCategoryApi({
        metal_type: formData.metal_type,
        name: formData.name.trim(),
        hsn_code: formData.hsn_code.trim() || '7113',
      });
      await showSuccessAlert(`Category '${created.name}' created successfully!`, 'Success!');
      handleBack();
    } catch (err: any) {
      const msg = err.message || 'Failed to create category. Please check inputs.';
      setApiError(msg);
      showErrorAlert(msg, 'Error!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-[900px] mx-auto w-full space-y-4">
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
            title="Back to Category List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Add New Category</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                New Record
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Dashboard &nbsp;/&nbsp; Category Management &nbsp;/&nbsp; <span className="text-slate-800">Add Category</span>
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
            <span>Save Category</span>
          </button>
        </div>
      </div>

      {/* API Error Alert */}
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Category Information</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Metal Type Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Metal Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.metal_type}
              onChange={(e) => setFormData({ ...formData, metal_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {metalTypes.map((mt) => (
                <option key={mt} value={mt}>
                  {mt}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Pre-defined precious metal classification.</p>
          </div>

          {/* HSN Code */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              HSN Code <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.hsn_code}
              onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
              placeholder="e.g. 7113"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default GST HSN code for items in this category.</p>
          </div>

          {/* Category Name (Full width) */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Category Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.name;
                      return next;
                    });
                  }
                }}
                onBlur={(e) => handleCheckName(e.target.value)}
                placeholder="e.g. Gold Bangles & Kadas"
                maxLength={80}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 ${
                  formErrors.name || nameStatus.available === false
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20 text-red-800'
                    : nameStatus.available === true
                    ? 'border-emerald-400 focus:ring-emerald-200 bg-emerald-50/20 text-emerald-800'
                    : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {nameStatus.checking && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                {!nameStatus.checking && nameStatus.available === true && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
                {!nameStatus.checking && nameStatus.available === false && (
                  <X className="w-4 h-4 text-red-600" />
                )}
              </div>
            </div>
            {formErrors.name && (
              <span className="text-[11px] text-red-600 font-medium mt-1 block">{formErrors.name}</span>
            )}
            {!formErrors.name && nameStatus.message && (
              <span
                className={`text-[11px] font-medium mt-1 block ${
                  nameStatus.available ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {nameStatus.message}
              </span>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
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
            <span>Save Category</span>
          </button>
        </div>
      </form>
    </div>
  );
};
