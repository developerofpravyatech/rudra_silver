import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users2, Save } from 'lucide-react';
import { fetchKarigarById, updateKarigar } from '../../services/api';
import type { KarigarRecord } from '../../types';
import { showErrorAlert } from '../../utils/alert';

interface Props { recordId: number; onBackToList: () => void; }

export const KarigarEditPage: React.FC<Props> = ({ recordId, onBackToList }) => {
  const [form, setForm]       = useState<Partial<KarigarRecord>>({});
  const [original, setOriginal] = useState<Partial<KarigarRecord>>({});
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
        setOriginal(data);
        setLoading(false);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [recordId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!form.karigar_name?.trim()) {
      newErrors.karigar_name = 'Karigar Name is required.';
    }
    if (!form.karigar_code?.trim()) {
      newErrors.karigar_code = 'Karigar Code is required.';
    }
    if (!form.status) {
      newErrors.status = 'Status is required.';
    } else if (form.status !== 'Active' && form.status !== 'Inactive') {
      newErrors.status = 'Status must be Active or Inactive.';
    }

    // Other field validations
    if (form.mobile && !/^\d{10}$/.test(form.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits.';
    }
    if (form.alternate_mobile && !/^\d{10}$/.test(form.alternate_mobile ?? '')) {
      newErrors.alternate_mobile = 'Alternate phone must be 10 digits.';
    }
    if (!form.address?.trim()) {
      newErrors.address = 'Address is required.';
    }
    if (!form.city?.trim()) {
      newErrors.city = 'City is required.';
    }
    if (!form.state?.trim()) {
      newErrors.state = 'State is required.';
    }
    if (!form.pincode?.trim()) {
      newErrors.pincode = 'Pincode is required.';
    }
    if (!form.narration?.trim()) {
      newErrors.narration = 'Narration/Email is required.';
    }
    if (!form.karigar_type?.trim()) {
      newErrors.karigar_type = 'Karigar Type is required.';
    }
    if (!form.metal_type?.trim()) {
      newErrors.metal_type = 'Metal Type is required.';
    }

    // Num field validations (required and non-negative)
    if (form.opening_amount === undefined || form.opening_amount === null) {
      newErrors.opening_amount = 'Opening amount is required.';
    } else if (form.opening_amount < 0) {
      newErrors.opening_amount = 'Opening amount must be >= 0.';
    }
    if (form.credit_days === undefined || form.credit_days === null) {
      newErrors.credit_days = 'Credit days is required.';
    } else if (form.credit_days < 0) {
      newErrors.credit_days = 'Credit days must be >= 0.';
    }
    if (form.opening_gold_balance === undefined || form.opening_gold_balance === null) {
      newErrors.opening_gold_balance = 'Opening gold balance is required.';
    } else if (form.opening_gold_balance < 0) {
      newErrors.opening_gold_balance = 'Opening gold balance must be >= 0.';
    }
    if (form.opening_silver_balance === undefined || form.opening_silver_balance === null) {
      newErrors.opening_silver_balance = 'Opening silver balance is required.';
    } else if (form.opening_silver_balance < 0) {
      newErrors.opening_silver_balance = 'Opening silver balance must be >= 0.';
    }
    if (form.opening_diamond_balance === undefined || form.opening_diamond_balance === null) {
      newErrors.opening_diamond_balance = 'Opening diamond balance is required.';
    } else if (form.opening_diamond_balance < 0) {
      newErrors.opening_diamond_balance = 'Opening diamond balance must be >= 0.';
    }
    if (form.opening_stone_balance === undefined || form.opening_stone_balance === null) {
      newErrors.opening_stone_balance = 'Opening stone balance is required.';
    } else if (form.opening_stone_balance < 0) {
      newErrors.opening_stone_balance = 'Opening stone balance must be >= 0.';
    }

    setFieldErrors(newErrors);
    // Only prevent submission for truly required fields (name, code, status)
    const hasRequiredErrors = newErrors.karigar_name || newErrors.karigar_code || newErrors.status;
    return Object.keys(newErrors).length === 0 || !hasRequiredErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true); setError(''); setSuccess('');
      await updateKarigar(recordId, form);
      setSuccess('Karigar updated successfully!');
      setTimeout(onBackToList, 1000);
    } catch (e: any) {
      setError(e.message);
      showErrorAlert('Failed to update karigar: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (field: keyof KarigarRecord) => (value: string) => {
    setForm(f => ({ ...f, [field]: value }));

    const newErrors: Record<string, string> = { ...fieldErrors };
    // Clear errors when user enters value
    if (field === 'karigar_name' && form.karigar_name?.trim()) {
      delete newErrors.karigar_name;
    }
    if (field === 'karigar_code' && form.karigar_code?.trim()) {
      delete newErrors.karigar_code;
    }
    if (field === 'status' && (form.status === 'Active' || form.status === 'Inactive')) {
      delete newErrors.status;
    }
    if (field === 'mobile' && /^\d{10}$/.test(form.mobile ?? '')) {
      delete newErrors.mobile;
    }
    if (field === 'alternate_mobile' && /^\d{10}$/.test(form.alternate_mobile ?? '')) {
      delete newErrors.alternate_mobile;
    }
    if (field === 'address' && form.address?.trim()) {
      delete newErrors.address;
    }
    if (field === 'city' && form.city?.trim()) {
      delete newErrors.city;
    }
    if (field === 'state' && form.state?.trim()) {
      delete newErrors.state;
    }
    if (field === 'pincode' && form.pincode?.trim()) {
      delete newErrors.pincode;
    }
    if (field === 'narration' && form.narration?.trim()) {
      delete newErrors.narration;
    }
    if (field === 'karigar_type' && form.karigar_type?.trim()) {
      delete newErrors.karigar_type;
    }
    if (field === 'metal_type' && form.metal_type?.trim()) {
      delete newErrors.metal_type;
    }
    // Clear numeric errors when text fields are filled
    if (field !== 'opening_amount' && field !== 'credit_days' && field !== 'opening_gold_balance' && field !== 'opening_silver_balance' && field !== 'opening_diamond_balance' && field !== 'opening_stone_balance') {
      delete newErrors.opening_amount;
      delete newErrors.credit_days;
      delete newErrors.opening_gold_balance;
      delete newErrors.opening_silver_balance;
      delete newErrors.opening_diamond_balance;
      delete newErrors.opening_stone_balance;
    }
    setFieldErrors(newErrors);
  };

  const handleNumChange = (field: keyof KarigarRecord) => (value: number) => {
    setForm(f => ({ ...f, [field]: value }));

    const newErrors: Record<string, string> = { ...fieldErrors };
    // Clear numeric errors when valid value entered
    if (field === 'opening_amount') {
      delete newErrors.opening_amount;
    }
    if (field === 'credit_days') {
      delete newErrors.credit_days;
    }
    if (field === 'opening_gold_balance') {
      delete newErrors.opening_gold_balance;
    }
    if (field === 'opening_silver_balance') {
      delete newErrors.opening_silver_balance;
    }
    if (field === 'opening_diamond_balance') {
      delete newErrors.opening_diamond_balance;
    }
    if (field === 'opening_stone_balance') {
      delete newErrors.opening_stone_balance;
    }
    // If user enters a valid non-negative number, clear the "required" error
    if (field === 'opening_amount' && form.opening_amount !== undefined && form.opening_amount >= 0) {
      delete newErrors.opening_amount;
    }
    if (field === 'credit_days' && form.credit_days !== undefined && form.credit_days >= 0) {
      delete newErrors.credit_days;
    }
    if (field === 'opening_gold_balance' && form.opening_gold_balance !== undefined && form.opening_gold_balance >= 0) {
      delete newErrors.opening_gold_balance;
    }
    if (field === 'opening_silver_balance' && form.opening_silver_balance !== undefined && form.opening_silver_balance >= 0) {
      delete newErrors.opening_silver_balance;
    }
    if (field === 'opening_diamond_balance' && form.opening_diamond_balance !== undefined && form.opening_diamond_balance >= 0) {
      delete newErrors.opening_diamond_balance;
    }
    if (field === 'opening_stone_balance' && form.opening_stone_balance !== undefined && form.opening_stone_balance >= 0) {
      delete newErrors.opening_stone_balance;
    }
    setFieldErrors(newErrors);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[300px] bg-slate-50">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
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
            <p className="text-xs text-slate-500">{form.karigar_code} – {form.karigar_name}</p>
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
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Karigar Code</label>
              <input type="text" value={form.karigar_code ?? ''} disabled
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            {form.karigar_code && !fieldErrors.karigar_code && <div className="text-rose-600 text-xs mt-1">Karigar Code is required.</div>}
            <Field label="Karigar Name *" value={form.karigar_name ?? ''} onChange={handleTextChange('karigar_name')} placeholder="Full name" />
            {fieldErrors.karigar_name && <div className="text-rose-600 text-xs mt-1">{fieldErrors.karigar_name}</div>}
            <Field label="Mobile Number" value={form.mobile ?? ''} onChange={handleTextChange('mobile')} placeholder="10-digit mobile" />
            {fieldErrors.mobile && <div className="text-rose-600 text-xs mt-1">{fieldErrors.mobile}</div>}
            <Field label="Alternate Phone" value={form.alternate_mobile ?? ''} onChange={handleTextChange('alternate_mobile')} placeholder="Phone / Landline" />
            <Field label="Narration" value={form.narration ?? ''} onChange={handleTextChange('narration')} placeholder="email@example.com" span={2} />
            {fieldErrors.narration && <div className="text-rose-600 text-xs mt-1">{fieldErrors.narration}</div>}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Address" value={form.address ?? ''} onChange={handleTextChange('address')} placeholder="Street address" span={2} />
            {fieldErrors.address && <div className="text-rose-600 text-xs mt-1">{fieldErrors.address}</div>}
            <Field label="City" value={form.city ?? ''} onChange={handleTextChange('city')} placeholder="City" />
            {fieldErrors.city && <div className="text-rose-600 text-xs mt-1">{fieldErrors.city}</div>}
            <Field label="State" value={form.state ?? ''} onChange={handleTextChange('state')} placeholder="State" />
            {fieldErrors.state && <div className="text-rose-600 text-xs mt-1">{fieldErrors.state}</div>}
            <Field label="Pincode" value={form.pincode ?? ''} onChange={handleTextChange('pincode')} placeholder="6-digit pincode" />
            {fieldErrors.pincode && <div className="text-rose-600 text-xs mt-1">{fieldErrors.pincode}</div>}
          </div>
        </div>

        {/* Karigar Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Karigar Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Karigar Type" value={form.karigar_type ?? ''} onChange={handleTextChange('karigar_type')} placeholder="e.g. Weaver" />
            {fieldErrors.karigar_type && <div className="text-rose-600 text-xs mt-1">{fieldErrors.karigar_type}</div>}
            <Field label="Metal Type" value={form.metal_type ?? ''} onChange={handleTextChange('metal_type')} placeholder="e.g. Silver" />
            {fieldErrors.metal_type && <div className="text-rose-600 text-xs mt-1">{fieldErrors.metal_type}</div>}
          </div>
        </div>

        {/* Opening Balances */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Opening Balances</h2>
          <div className="grid grid-cols-3 gap-4">
            <NumField label="Opening Amount (₹)" value={form.opening_amount ?? 0} onChange={handleNumChange('opening_amount')} />
            <NumField label="Credit Days" value={form.credit_days ?? 0} onChange={handleNumChange('credit_days')} step="1" />
            <NumField label="Opening Gold Fine (g)" value={form.opening_gold_balance ?? 0} onChange={handleNumChange('opening_gold_balance')} step="0.001" />
            <NumField label="Opening Silver Fine (g)" value={form.opening_silver_balance ?? 0} onChange={handleNumChange('opening_silver_balance')} step="0.001" />
          </div>
        </div>

        {/* Business Terms */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Business Terms</h2>
          <div className="grid grid-cols-3 gap-4">
            <NumField label="Default Labour Rate (₹/g)" value={form.opening_diamond_balance ?? 0} onChange={handleNumChange('opening_diamond_balance')} step="0.01" />
            <NumField label="Permissible Loss (%)" value={form.opening_stone_balance ?? 0} onChange={handleNumChange('opening_stone_balance')} step="0.01" />
            <NumField label="Credit Days" value={form.credit_days ?? 0} onChange={handleNumChange('credit_days')} step="1" />
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Status</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.status === 'Active'} onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 'Active' : 'Inactive'}))}
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
const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string; span?: number }> =
  ({ label, value, onChange, placeholder, span }) => (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

const NumField: React.FC<{ label: string; value: number; onChange: (v: number) => void; step?: string }> =
  ({ label, value, onChange, step = '0.01' }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type="number" value={value} step={step} min="0" onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );