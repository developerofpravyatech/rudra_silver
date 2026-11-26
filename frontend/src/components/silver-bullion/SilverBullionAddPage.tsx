import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Loader2,
  Layers,
  Coins,
  Scale,
  DollarSign,
  AlertCircle,
  Users,
} from 'lucide-react';
import {
  SilverBullionRecord,
  SilverBullionFilterOptions,
} from '../../types';
import {
  createSilverBullion,
  fetchSilverBullionFilterOptions,
} from '../../services/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alert';

interface SilverBullionAddPageProps {
  onBackToList?: () => void;
}

export const SilverBullionAddPage: React.FC<SilverBullionAddPageProps> = ({ onBackToList }) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    if (onBackToList) {
      onBackToList();
    } else {
      navigate('/silver-bullion');
    }
  };

  // Master dropdown options
  const [filterOptions, setFilterOptions] = useState<SilverBullionFilterOptions>({
    groups: [],
    parties: [],
    cities: [],
    users: [],
    salesmen: [],
    agents: [],
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form states matching silver_bullion table
  const [formData, setFormData] = useState<Partial<SilverBullionRecord>>({
    transaction_date: new Date().toISOString().split('T')[0],
    voucher_no: '',
    transaction_type: 'CR',
    party_name: '',
    account_group_name: '',
    account_city: '',
    user_name: 'Admin',
    salesman_name: '',
    agent_name: '',
    fine_weight: 0,
    silver_rate: 0,
    amount: 0,
    fine_weight_dr: 0,
    silver_rate_dr: 0,
    amount_dr: 0,
    bhav: 0,
    wo_sale: 0,
    including_labour: 0,
    exclude_rate_book: 0,
    remarks: '',
  });

  // Validation field errors: field -> "This field is required."
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSilverBullionFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  // Auto-calculate Cr Amount when fine_weight or silver_rate changes
  const handleCrFineChange = (fine: number) => {
    const rate = Number(formData.silver_rate || 0);
    const amt = fine > 0 && rate > 0 ? parseFloat((fine * rate).toFixed(2)) : Number(formData.amount || 0);
    setFormData((prev) => ({ ...prev, fine_weight: fine, amount: amt }));
  };

  const handleCrRateChange = (rate: number) => {
    const fine = Number(formData.fine_weight || 0);
    const amt = fine > 0 && rate > 0 ? parseFloat((fine * rate).toFixed(2)) : Number(formData.amount || 0);
    setFormData((prev) => ({ ...prev, silver_rate: rate, amount: amt }));
  };

  // Auto-calculate Dr Amount when fine_weight_dr or silver_rate_dr changes
  const handleDrFineChange = (fineDr: number) => {
    const rateDr = Number(formData.silver_rate_dr || 0);
    const amtDr = fineDr > 0 && rateDr > 0 ? parseFloat((fineDr * rateDr).toFixed(2)) : Number(formData.amount_dr || 0);
    setFormData((prev) => ({ ...prev, fine_weight_dr: fineDr, amount_dr: amtDr }));
  };

  const handleDrRateChange = (rateDr: number) => {
    const fineDr = Number(formData.fine_weight_dr || 0);
    const amtDr = fineDr > 0 && rateDr > 0 ? parseFloat((fineDr * rateDr).toFixed(2)) : Number(formData.amount_dr || 0);
    setFormData((prev) => ({ ...prev, silver_rate_dr: rateDr, amount_dr: amtDr }));
  };

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.transaction_date || !formData.transaction_date.trim()) {
      errors.transaction_date = 'This field is required.';
    }
    if (!formData.transaction_type || !formData.transaction_type.trim()) {
      errors.transaction_type = 'This field is required.';
    }
    if (!formData.party_name || !formData.party_name.trim()) {
      errors.party_name = 'This field is required.';
    }
    if (!formData.fine_weight) {
      errors.fine_weight = 'This field is required.';
    }
    if (!formData.silver_rate) {
      errors.silver_rate = 'This field is required.';
    }
    if (!formData.amount) {
      errors.amount = 'This field is required.';
    }

    setFormErrors(errors);

    // Scroll and focus first invalid field without popup
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      setTimeout(() => {
        const el = (document.querySelector(`[name="${firstInvalid}"]`) ||
                    document.querySelector('.border-red-500, .border-rose-500')) as HTMLElement | null;
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await createSilverBullion(formData);
      await showSuccessAlert('Silver Bullion transaction entry saved successfully.', 'Success!');
      handleCancel();
    } catch (err: any) {
      const msg = err.message || 'Failed to save Silver Bullion transaction.';
      setApiError(msg);
      showErrorAlert(msg, 'Error!');
    } finally {
      setSubmitting(false);
    }
  };

  const isCr = formData.transaction_type === 'CR';

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Header & Breadcrumb */}
        <div className="pb-4 border-b border-slate-200 dark:border-white/[0.08]">
          <nav className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mb-1.5">
            <button
              type="button"
              onClick={handleCancel}
              className="hover:text-amber-500 transition cursor-pointer"
            >
              Dashboard
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={handleCancel}
              className="hover:text-amber-500 transition cursor-pointer"
            >
              Silver Bullion
            </button>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">Add Silver Bullion</span>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Back to Silver Bullion List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-6 h-6 text-amber-500" />
                  Add Silver Bullion Entry
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Record Credit / Debit fine silver bullion transaction in daily register.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Entry</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start space-x-3 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Section 1: Transaction Identification */}
          <div className="bg-white dark:bg-[#0e121a] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-slate-100 dark:border-white/[0.06] pb-2 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>1. Transaction & Party Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Transaction Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  value={formData.transaction_date || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, transaction_date: e.target.value });
                    clearError('transaction_date');
                  }}
                  onBlur={() => {
                    if (!formData.transaction_date) {
                      setFormErrors((prev) => ({ ...prev, transaction_date: 'This field is required.' }));
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-[#151922] font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${
                    formErrors.transaction_date ? 'border-red-500 bg-red-50/20' : 'border-slate-300 dark:border-white/[0.1]'
                  }`}
                />
                {formErrors.transaction_date && (
                  <p className="text-[11px] text-red-500 mt-1">{formErrors.transaction_date}</p>
                )}
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="transaction_type"
                  value={formData.transaction_type || 'CR'}
                  onChange={(e) => {
                    setFormData({ ...formData, transaction_type: e.target.value });
                    clearError('transaction_type');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                >
                  <option value="CR">Credit (Cr) - Purchase / Receive</option>
                  <option value="DR">Debit (Dr) - Sale / Issue</option>
                </select>
                {formErrors.transaction_type && (
                  <p className="text-[11px] text-red-500 mt-1">{formErrors.transaction_type}</p>
                )}
              </div>

              {/* Voucher No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher No.
                </label>
                <input
                  type="text"
                  name="voucher_no"
                  value={formData.voucher_no || ''}
                  onChange={(e) => setFormData({ ...formData, voucher_no: e.target.value })}
                  placeholder="Auto-generated if blank (e.g. SB-CR-1001)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Party Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Party / Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="party_name"
                  value={formData.party_name || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, party_name: e.target.value });
                    clearError('party_name');
                  }}
                  onBlur={() => {
                    if (!formData.party_name || !formData.party_name.trim()) {
                      setFormErrors((prev) => ({ ...prev, party_name: 'This field is required.' }));
                    }
                  }}
                  placeholder="e.g. SHREEJI JEWELLERS"
                  list="bullion-parties-list"
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold uppercase tracking-wide focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${
                    formErrors.party_name
                      ? 'border-red-500 bg-red-50/20 text-red-900 dark:text-red-300'
                      : 'border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922]'
                  }`}
                />
                <datalist id="bullion-parties-list">
                  {filterOptions.parties.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                {formErrors.party_name && (
                  <p className="text-[11px] text-red-500 mt-1">{formErrors.party_name}</p>
                )}
              </div>

              {/* Account Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  A/c Group
                </label>
                <input
                  type="text"
                  name="account_group_name"
                  value={formData.account_group_name || ''}
                  onChange={(e) => setFormData({ ...formData, account_group_name: e.target.value })}
                  placeholder="e.g. Retail Customer"
                  list="bullion-groups-list"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
                />
                <datalist id="bullion-groups-list">
                  {filterOptions.groups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* A/c City */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">A/c City</label>
                <input
                  type="text"
                  name="account_city"
                  value={formData.account_city || ''}
                  onChange={(e) => setFormData({ ...formData, account_city: e.target.value })}
                  placeholder="e.g. Rajkot"
                  list="bullion-cities-list"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
                />
                <datalist id="bullion-cities-list">
                  {filterOptions.cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* User */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">User</label>
                <input
                  type="text"
                  name="user_name"
                  value={formData.user_name || 'Admin'}
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  placeholder="Admin"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
                />
              </div>

              {/* S.Man */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Salesman (S.Man)</label>
                <input
                  type="text"
                  name="salesman_name"
                  value={formData.salesman_name || ''}
                  onChange={(e) => setFormData({ ...formData, salesman_name: e.target.value })}
                  placeholder="e.g. Amit"
                  list="bullion-salesmen-list"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
                />
                <datalist id="bullion-salesmen-list">
                  {filterOptions.salesmen.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Agent */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Agent</label>
                <input
                  type="text"
                  name="agent_name"
                  value={formData.agent_name || ''}
                  onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                  placeholder="e.g. Ketan"
                  list="bullion-agents-list"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
                />
                <datalist id="bullion-agents-list">
                  {filterOptions.agents.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Section 2: Credit & Debit Bullion Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Credit (Cr) Details */}
            <div className={`bg-white dark:bg-[#0e121a] rounded-2xl border p-6 space-y-4 shadow-xs transition ${isCr ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-white/[0.08]'}`}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>Credit Details (Cr)</span>
                </h3>
                {isCr && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">Active Side</span>}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fine (Cr) [grams]
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    name="fine_weight"
                    value={formData.fine_weight ?? 0}
                    onChange={(e) => handleCrFineChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    P.Rate (Cr) [₹ per gm / unit]
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="silver_rate"
                    value={formData.silver_rate ?? 0}
                    onChange={(e) => handleCrRateChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (Cr) [₹]
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount ?? 0}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Debit (Dr) Details */}
            <div className={`bg-white dark:bg-[#0e121a] rounded-2xl border p-6 space-y-4 shadow-xs transition ${!isCr ? 'border-rose-500/40 ring-1 ring-rose-500/20' : 'border-slate-200 dark:border-white/[0.08]'}`}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>Debit Details (Dr)</span>
                </h3>
                {!isCr && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">Active Side</span>}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fine (Dr) [grams]
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    name="fine_weight_dr"
                    value={formData.fine_weight_dr ?? 0}
                    onChange={(e) => handleDrFineChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    S.Rate (Dr) [₹ per gm / unit]
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="silver_rate_dr"
                    value={formData.silver_rate_dr ?? 0}
                    onChange={(e) => handleDrRateChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (Dr) [₹]
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount_dr"
                    value={formData.amount_dr ?? 0}
                    onChange={(e) => setFormData({ ...formData, amount_dr: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono font-bold text-right text-rose-600 dark:text-rose-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Accounting Flags & Remarks */}
          <div className="bg-white dark:bg-[#0e121a] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-slate-100 dark:border-white/[0.06] pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>3. Accounting Flags & Remarks</span>
            </h2>

            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-semibold select-none">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="bhav"
                  checked={Boolean(formData.bhav)}
                  onChange={(e) => setFormData({ ...formData, bhav: e.target.checked ? 1 : 0 })}
                  className="accent-amber-500 cursor-pointer w-4 h-4"
                />
                <span>Bhav</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="wo_sale"
                  checked={Boolean(formData.wo_sale)}
                  onChange={(e) => setFormData({ ...formData, wo_sale: e.target.checked ? 1 : 0 })}
                  className="accent-amber-500 cursor-pointer w-4 h-4"
                />
                <span>W/O Sale</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="including_labour"
                  checked={Boolean(formData.including_labour)}
                  onChange={(e) => setFormData({ ...formData, including_labour: e.target.checked ? 1 : 0 })}
                  className="accent-amber-500 cursor-pointer w-4 h-4"
                />
                <span>Incl. Labour</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="exclude_rate_book"
                  checked={Boolean(formData.exclude_rate_book)}
                  onChange={(e) => setFormData({ ...formData, exclude_rate_book: e.target.checked ? 1 : 0 })}
                  className="accent-amber-500 cursor-pointer w-4 h-4"
                />
                <span>Excl. Rate Book</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Narration
              </label>
              <textarea
                name="remarks"
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                placeholder="Optional notes or Bullion transaction details..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SilverBullionAddPage;
