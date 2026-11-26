import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users2, Save } from 'lucide-react';
import { fetchKarigarById, updateKarigar } from '../../services/api';
import type { KarigarRecord } from '../../types';
import { showErrorAlert } from '../../utils/alert';

interface Props { recordId: number; onBackToList: () => void; }

export const KarigarEditPage: React.FC<Props> = ({ recordId, onBackToList }) => {
  const [form, setForm]       = useState<Partial<KarigarRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    fetchKarigarById(recordId)
      .then(data => {
        setForm(data);
        setLoading(false);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [recordId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = (form.karigar_name ?? '').trim();
    const trimmedCode = (form.karigar_code ?? '').trim();

    if (!trimmedCode) {
      newErrors.karigar_code = 'Karigar Code is required.';
    }
    if (!trimmedName) {
      newErrors.karigar_name = 'Karigar Name is required.';
    }
    if (form.status !== 'Active' && form.status !== 'Inactive') {
      newErrors.status = 'Status must be Active or Inactive.';
    }

    const mobile = (form.mobile ?? '').trim();
    if (mobile && !/^\d{10}$/.test(mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits.';
    }
    const altMobile = (form.alternate_mobile ?? '').trim();
    if (altMobile && !/^\d{10}$/.test(altMobile)) {
      newErrors.alternate_mobile = 'Alternate phone must be 10 digits.';
    }
    const email = (form.narration ?? '').trim();
    if (email && email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.narration = 'Please enter a valid email address.';
    }
    const pincode = (form.pincode ?? '').trim();
    if (pincode && !/^\d{6}$/.test(pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits.';
    }

    if ((form.opening_amount ?? 0) < 0) newErrors.opening_amount = 'Opening amount must be >= 0.';
    if ((form.credit_days ?? 0) < 0) newErrors.credit_days = 'Credit days must be >= 0.';
    if ((form.opening_gold_balance ?? 0) < 0) newErrors.opening_gold_balance = 'Opening gold balance must be >= 0.';
    if ((form.opening_silver_balance ?? 0) < 0) newErrors.opening_silver_balance = 'Opening silver balance must be >= 0.';
    if ((form.opening_diamond_balance ?? 0) < 0) newErrors.opening_diamond_balance = 'Default labour rate must be >= 0.';
    if ((form.opening_stone_balance ?? 0) < 0) newErrors.opening_stone_balance = 'Permissible loss must be >= 0.';

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true); setError(''); setSuccess('');
      const payload: Partial<KarigarRecord> = {
        ...form,
        karigar_code: (form.karigar_code ?? '').trim(),
        karigar_name: (form.karigar_name ?? '').trim(),
        mobile: (form.mobile ?? '').trim(),
        alternate_mobile: (form.alternate_mobile ?? '').trim(),
        narration: (form.narration ?? '').trim(),
        address: (form.address ?? '').trim(),
        city: (form.city ?? '').trim(),
        state: (form.state ?? '').trim(),
        pincode: (form.pincode ?? '').trim(),
      };
      await updateKarigar(recordId, payload);
      setSuccess('Karigar updated successfully!');
      setTimeout(onBackToList, 800);
    } catch (e: any) {
      const msg = e?.message === 'Failed to fetch'
        ? 'Network error: Unable to reach server. Please check your connection.'
        : (e?.message || 'Failed to update karigar.');
      setError(msg);
      showErrorAlert('Failed to update karigar: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (field: keyof KarigarRecord) => (value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (error) setError('');

    const newErrors: Record<string, string> = { ...fieldErrors };
    const trimmed = value.trim();

    if (field === 'karigar_name') {
      if (trimmed) delete newErrors.karigar_name;
    } else if (field === 'karigar_code') {
      if (trimmed) delete newErrors.karigar_code;
    } else if (field === 'mobile') {
      if (!trimmed || /^\d{10}$/.test(trimmed)) delete newErrors.mobile;
    } else if (field === 'alternate_mobile') {
      if (!trimmed || /^\d{10}$/.test(trimmed)) delete newErrors.alternate_mobile;
    } else if (field === 'pincode') {
      if (!trimmed || /^\d{6}$/.test(trimmed)) delete newErrors.pincode;
    } else if (field === 'narration') {
      if (!trimmed || !trimmed.includes('@') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        delete newErrors.narration;
      }
    } else {
      delete newErrors[field];
    }
    setFieldErrors(newErrors);
  };

  const handleNumChange = (field: keyof KarigarRecord) => (value: number) => {
    setForm(f => ({ ...f, [field]: value }));
    if (error) setError('');
    const newErrors: Record<string, string> = { ...fieldErrors };
    if (value >= 0) delete newErrors[field];
    setFieldErrors(newErrors);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onBackToList} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
            <Users2 className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Edit Karigar</h1>
            <p className="text-xs text-slate-500">{form.karigar_code} — {form.karigar_name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-6 py-6 max-w-4xl mx-auto w-full">
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-xs">{success}</div>}

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Karigar Code *" value={form.karigar_code ?? ''} onChange={handleTextChange('karigar_code')} placeholder="e.g. KARI-011" error={fieldErrors.karigar_code} />
            <Field label="Karigar Name *" value={form.karigar_name ?? ''} onChange={handleTextChange('karigar_name')} placeholder="Full name" error={fieldErrors.karigar_name} />
            <Field label="Mobile Number" value={form.mobile ?? ''} onChange={handleTextChange('mobile')} placeholder="10-digit mobile" error={fieldErrors.mobile} />
            <Field label="Alternate Phone" value={form.alternate_mobile ?? ''} onChange={handleTextChange('alternate_mobile')} placeholder="Phone / Landline" error={fieldErrors.alternate_mobile} />
            <Field label="Email" value={form.narration ?? ''} onChange={handleTextChange('narration')} placeholder="email@example.com" span={2} error={fieldErrors.narration} />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Address" value={form.address ?? ''} onChange={handleTextChange('address')} placeholder="Street address" span={2} error={fieldErrors.address} />
            <Field label="City" value={form.city ?? ''} onChange={handleTextChange('city')} placeholder="City" error={fieldErrors.city} />
            <Field label="State" value={form.state ?? ''} onChange={handleTextChange('state')} placeholder="State" error={fieldErrors.state} />
            <Field label="Pincode" value={form.pincode ?? ''} onChange={handleTextChange('pincode')} placeholder="6-digit pincode" error={fieldErrors.pincode} />
          </div>
        </div>

        {/* Karigar Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Karigar Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Karigar Type" value={form.karigar_type ?? ''} onChange={handleTextChange('karigar_type')} placeholder="e.g. Weaver" error={fieldErrors.karigar_type} />
            <Field label="Metal Type" value={form.metal_type ?? ''} onChange={handleTextChange('metal_type')} placeholder="e.g. Silver" error={fieldErrors.metal_type} />
          </div>
        </div>

        {/* Opening Balances */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Opening Balances</h2>
          <div className="grid grid-cols-3 gap-4">
            <NumField label="Opening Amount (₹)" value={form.opening_amount ?? 0} onChange={handleNumChange('opening_amount')} error={fieldErrors.opening_amount} />
            <NumField label="Credit Days" value={form.credit_days ?? 0} onChange={handleNumChange('credit_days')} step="1" error={fieldErrors.credit_days} />
            <NumField label="Opening Gold Fine (g)" value={form.opening_gold_balance ?? 0} onChange={handleNumChange('opening_gold_balance')} step="0.001" error={fieldErrors.opening_gold_balance} />
            <NumField label="Opening Silver Fine (g)" value={form.opening_silver_balance ?? 0} onChange={handleNumChange('opening_silver_balance')} step="0.001" error={fieldErrors.opening_silver_balance} />
          </div>
        </div>

        {/* Business Terms */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Business Terms</h2>
          <div className="grid grid-cols-3 gap-4">
            <NumField label="Default Labour Rate (₹/g)" value={form.opening_diamond_balance ?? 0} onChange={handleNumChange('opening_diamond_balance')} step="0.01" error={fieldErrors.opening_diamond_balance} />
            <NumField label="Permissible Loss (%)" value={form.opening_stone_balance ?? 0} onChange={handleNumChange('opening_stone_balance')} step="0.01" error={fieldErrors.opening_stone_balance} />
            <NumField label="Credit Days" value={form.credit_days ?? 0} onChange={handleNumChange('credit_days')} step="1" error={fieldErrors.credit_days} />
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Status</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.status === 'Active'} onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 'Active' : 'Inactive' }))}
              className="w-4 h-4 accent-blue-500" />
            <span className="text-sm text-slate-700">Active Karigar</span>
          </label>
          {fieldErrors.status && <div className="text-rose-600 text-xs mt-1">{fieldErrors.status}</div>}
        </div>

        <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
          <button type="button" onClick={onBackToList}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Updating...' : 'Update Karigar'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Helper field components
const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string; span?: number; error?: string }> =
  ({ label, value, onChange, placeholder, span, error }) => (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-rose-400' : 'border-slate-300'}`} />
      {error && <div className="text-rose-600 text-xs mt-1">{error}</div>}
    </div>
  );

const NumField: React.FC<{ label: string; value: number; onChange: (v: number) => void; step?: string; error?: string }> =
  ({ label, value, onChange, step = '0.01', error }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type="number" value={value} step={step} min="0" onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-rose-400' : 'border-slate-300'}`} />
      {error && <div className="text-rose-600 text-xs mt-1">{error}</div>}
    </div>
  );
