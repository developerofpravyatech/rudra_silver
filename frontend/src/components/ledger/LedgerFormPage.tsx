import React, { useState, useEffect } from 'react';
import { Save, X, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import type { Ledger, AccountGroup } from '../../types';
import { createLedger, updateLedger, fetchLedgerById, fetchLedgerNextCode, fetchAccountGroupsDropdown } from '../../services/api';
import { reqText, reqSelect, nonNegNum, optMobile, optEmail, focusFirstError, FieldErrors } from '../../utils/validation';

interface Props {
  ledgerId?: number | null;
  onBack: () => void;
  onSuccess: () => void;
}

const BLANK: Partial<Ledger> = {
  ledger_code: '',
  ledger_name: '',
  group_id: 0,
  opening_balance: 0,
  opening_balance_type: 'NIL',
  opening_balance_date: '',
  address: '',
  mobile: '',
  city: '',
  state: '',
  gst_no: '',
  pan_no: '',
  email: '',
  contact_person: '',
  description: '',
  status: 'ACTIVE',
};

export const LedgerFormPage: React.FC<Props> = ({ ledgerId, onBack, onSuccess }) => {
  const isEdit = Boolean(ledgerId);
  const [form, setForm] = useState<Partial<Ledger>>(BLANK);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    fetchAccountGroupsDropdown().then(setGroups).catch(() => {});
    if (isEdit && ledgerId) {
      setFetchLoading(true);
      fetchLedgerById(ledgerId)
        .then((l) => setForm({ ...BLANK, ...l }))
        .catch(() => setError('Failed to load ledger data.'))
        .finally(() => setFetchLoading(false));
    } else {
      fetchLedgerNextCode()
        .then((code) => setForm((f) => ({ ...f, ledger_code: code })))
        .catch(() => {});
    }
  }, [ledgerId, isEdit]);

  const set = (key: keyof Ledger, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (error) setError(null);
    setFieldErrors((fe) => {
      if (!fe[key]) return fe;
      const next = { ...fe };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    const cErr = reqText(form.ledger_code, 'Ledger Code');
    if (cErr) errs.ledger_code = cErr;
    const nErr = reqText(form.ledger_name, 'Ledger Name');
    if (nErr) errs.ledger_name = nErr;
    const gErr = reqSelect(form.group_id, 'an Account Group');
    if (gErr) errs.group_id = gErr;
    const obErr = nonNegNum(form.opening_balance, 'Opening Balance');
    if (obErr) errs.opening_balance = obErr;
    const mErr = optMobile(form.mobile, 'Mobile');
    if (mErr) errs.mobile = mErr;
    const eErr = optEmail(form.email, 'Email');
    if (eErr) errs.email = eErr;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) { focusFirstError(); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !validate()) return;

    setLoading(true);
    setError(null);
    try {
      const payload: Partial<Ledger> = {
        ...form,
        ledger_code: String(form.ledger_code ?? '').trim(),
        ledger_name: String(form.ledger_name ?? '').trim(),
      };
      if (isEdit && ledgerId) {
        await updateLedger(ledgerId, payload);
      } else {
        await createLedger(payload);
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Failed to save ledger.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080a0d] p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{isEdit ? 'Edit Ledger' : 'Create New Ledger'}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{isEdit ? 'Update ledger details' : 'Add a new ledger account to the system'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Ledger Code <span className="text-rose-500">*</span></label>
                <input type="text" value={form.ledger_code || ''} onChange={(e) => set('ledger_code', e.target.value.toUpperCase())} placeholder="e.g. L-0001"
                  className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 font-mono ${fieldErrors.ledger_code ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                {fieldErrors.ledger_code && <p className="text-rose-500 text-xs mt-1">{fieldErrors.ledger_code}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Ledger Name <span className="text-rose-500">*</span></label>
                <input type="text" value={form.ledger_name || ''} onChange={(e) => set('ledger_name', e.target.value)} placeholder="e.g. Customer ABC"
                  className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${fieldErrors.ledger_name ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`} />
                {fieldErrors.ledger_name && <p className="text-rose-500 text-xs mt-1">{fieldErrors.ledger_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Account Group <span className="text-rose-500">*</span></label>
                <select value={form.group_id || ''} onChange={(e) => set('group_id', Number(e.target.value))}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${fieldErrors.group_id ? 'border-rose-400' : 'border-slate-200 dark:border-white/10'}`}>
                  <option value="">-- Select Group --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.nature})</option>)}
                </select>
                {fieldErrors.group_id && <p className="text-rose-500 text-xs mt-1">{fieldErrors.group_id}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Status</label>
                <select value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value as Ledger['status'])}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opening Balance */}
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Opening Balance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.opening_balance || 0} onChange={(e) => set('opening_balance', Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Balance Type</label>
                <select value={form.opening_balance_type || 'NIL'} onChange={(e) => set('opening_balance_type', e.target.value as Ledger['opening_balance_type'])}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
                  <option value="NIL">Not Applicable</option>
                  <option value="DR">Debit (Dr)</option>
                  <option value="CR">Credit (Cr)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">As of Date</label>
                <input type="date" value={form.opening_balance_date || ''} onChange={(e) => set('opening_balance_date', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'mobile', label: 'Mobile', placeholder: '+91 9876543210' },
                { key: 'email', label: 'Email', placeholder: 'name@email.com' },
                { key: 'contact_person', label: 'Contact Person', placeholder: 'e.g. Ramesh Patel' },
                { key: 'city', label: 'City', placeholder: 'e.g. Ahmedabad' },
                { key: 'state', label: 'State', placeholder: 'e.g. Gujarat' },
                { key: 'gst_no', label: 'GST Number', placeholder: 'e.g. 24ABCDE1234F1Z5' },
                { key: 'pan_no', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</label>
                  <input type="text" value={(form as any)[key] || ''} onChange={(e) => set(key as keyof Ledger, e.target.value)} placeholder={placeholder}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Address</label>
                <textarea rows={2} value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Enter address..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Description / Notes</label>
                <textarea rows={2} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Any additional notes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pb-4">
            <button type="button" onClick={onBack} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : isEdit ? 'Update Ledger' : 'Create Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
