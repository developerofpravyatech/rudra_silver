import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Scale,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { fetchDailyBalanceView, updateDailyBalance, fetchDailyBalanceAccountsLookup } from '../../services/api';
import { AccountLookupItem } from '../../types';
import { showSuccessAlert, showErrorAlert, showValidationAlert } from '../../utils/alert';

interface DailyBalanceEditPageProps {
  recordId: number;
  onBackToList: () => void;
}

export const DailyBalanceEditPage: React.FC<DailyBalanceEditPageProps> = ({ recordId, onBackToList }) => {
  const [accountsLookup, setAccountsLookup] = useState<AccountLookupItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const [formData, setFormData] = useState({
    party_id: '',
    account_name: '',
    city: '',
    mobile: '',
    phone: '',
    balance_date: '',
    payment_date: '',
    gold_fine: '',
    silver_fine: '',
    amount: '',
    diamond_weight: '',
    stone_weight: '',
    gold_gross_weight: '',
    silver_gross_weight: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      fetchDailyBalanceView(recordId),
      fetchDailyBalanceAccountsLookup(),
    ])
      .then(([item, accounts]) => {
        if (!isMounted) return;
        setAccountsLookup(accounts);
        if (item.party_id) {
          setSelectedAccountId(String(item.party_id));
        }
        setFormData({
          party_id: item.party_id !== null && item.party_id !== undefined ? String(item.party_id) : '',
          account_name: item.account_name || '',
          city: item.city || '',
          mobile: item.mobile || '',
          phone: item.phone || '',
          balance_date: item.balance_date || '',
          payment_date: item.payment_date || '',
          gold_fine: item.gold_fine !== null && item.gold_fine !== undefined ? String(item.gold_fine) : '',
          silver_fine: item.silver_fine !== null && item.silver_fine !== undefined ? String(item.silver_fine) : '',
          amount: item.amount !== null && item.amount !== undefined ? String(item.amount) : '',
          diamond_weight: item.diamond_weight !== null && item.diamond_weight !== undefined ? String(item.diamond_weight) : '',
          stone_weight: item.stone_weight !== null && item.stone_weight !== undefined ? String(item.stone_weight) : '',
          gold_gross_weight: item.gold_gross_weight !== null && item.gold_gross_weight !== undefined ? String(item.gold_gross_weight) : '',
          silver_gross_weight: item.silver_gross_weight !== null && item.silver_gross_weight !== undefined ? String(item.silver_gross_weight) : '',
        });
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setApiError(err.message || `Failed to load daily balance record #${recordId}.`);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [recordId]);

  const handleSelectAccount = (accId: string) => {
    setSelectedAccountId(accId);
    if (!accId) {
      setFormData((prev) => ({ ...prev, party_id: '' }));
      return;
    }
    const acc = accountsLookup.find((a) => String(a.id) === accId);
    if (acc) {
      setFormData((prev) => ({
        ...prev,
        party_id: String(acc.id),
        account_name: acc.name,
        city: acc.city || prev.city,
        mobile: acc.mobile || prev.mobile,
        phone: acc.phone || prev.phone,
      }));
      if (errors.account_name) {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.account_name;
          return copy;
        });
      }
    }
  };

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
    if (!formData.account_name.trim()) {
      errs.account_name = 'Account Name is required.';
    }

    if (formData.mobile.trim()) {
      const cleanMob = formData.mobile.trim().replace(/\D/g, '');
      if (cleanMob.length !== 10) {
        errs.mobile = 'Mobile number must be exactly 10 digits.';
      }
    }

    const numericWeights = [
      'gold_fine',
      'silver_fine',
      'diamond_weight',
      'stone_weight',
      'gold_gross_weight',
      'silver_gross_weight',
    ];
    numericWeights.forEach((f) => {
      const val = (formData as any)[f];
      if (val !== '' && val !== null && val !== undefined) {
        const strVal = String(val).trim();
        if (isNaN(Number(strVal))) {
          errs[f] = 'Must be a valid number.';
        } else if (strVal.includes('.')) {
          const dec = strVal.split('.')[1];
          if (dec && dec.length > 3) {
            errs[f] = 'Max 3 decimal places allowed.';
          }
        }
      }
    });

    if (formData.amount !== '' && formData.amount !== null && formData.amount !== undefined) {
      const strVal = String(formData.amount).trim();
      if (isNaN(Number(strVal))) {
        errs.amount = 'Must be a valid number.';
      } else if (strVal.includes('.')) {
        const dec = strVal.split('.')[1];
        if (dec && dec.length > 2) {
          errs.amount = 'Max 2 decimal places allowed.';
        }
      }
    }

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
        party_id: formData.party_id ? Number(formData.party_id) : undefined,
        account_name: formData.account_name.trim(),
        city: formData.city.trim() || undefined,
        mobile: formData.mobile.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        balance_date: formData.balance_date || undefined,
        payment_date: formData.payment_date || undefined,
        gold_fine: formData.gold_fine !== '' ? Number(formData.gold_fine) : 0,
        silver_fine: formData.silver_fine !== '' ? Number(formData.silver_fine) : 0,
        amount: formData.amount !== '' ? Number(formData.amount) : 0,
        diamond_weight: formData.diamond_weight !== '' ? Number(formData.diamond_weight) : 0,
        stone_weight: formData.stone_weight !== '' ? Number(formData.stone_weight) : 0,
        gold_gross_weight: formData.gold_gross_weight !== '' ? Number(formData.gold_gross_weight) : 0,
        silver_gross_weight: formData.silver_gross_weight !== '' ? Number(formData.silver_gross_weight) : 0,
      };

      const res = await updateDailyBalance(recordId, payload);
      await showSuccessAlert(res.message || 'Daily balance record updated successfully.', 'Success!');
      onBackToList();
    } catch (err: any) {
      const msg = err.message || 'Failed to update daily balance record.';
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
        <p className="text-xs font-semibold">Loading daily balance record #{recordId}...</p>
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
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Edit Daily Balance</h1>
              <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5 font-medium">
                <span className="hover:text-blue-600 cursor-pointer" onClick={onBackToList}>
                  Daily Balance List
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
            {/* Section 1: Account / Party Details */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                <span>Account & Customer Selection</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Select Existing Account / Party */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Link Existing Party / Customer (Optional)</span>
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => handleSelectAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Manual Entry / No Linked Account --</option>
                    {accountsLookup.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} {a.company_name ? `(${a.company_name})` : ''} - {a.city || 'No City'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    A/c Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.account_name}
                    onChange={(e) => handleChange('account_name', e.target.value)}
                    placeholder="e.g. ASHAPURA JEWELLERS"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 uppercase font-semibold"
                  />
                  {errors.account_name && <p className="text-[11px] text-red-500 mt-0.5">{errors.account_name}</p>}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="e.g. RAJKOT"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="e.g. 0281-223344"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Balance Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Balance Date (Bal.Date)</label>
                  <input
                    type="date"
                    value={formData.balance_date}
                    onChange={(e) => handleChange('balance_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date (Pay Date)</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => handleChange('payment_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Financial & Fine Balances (Allows Negatives) */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                <span>Financial & Fine Balances (Negative Values Supported)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Gold Fine */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gold Fine</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.gold_fine}
                    onChange={(e) => handleChange('gold_fine', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right font-mono"
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
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-blue-50/20 text-xs focus:ring-2 focus:ring-blue-500 text-right font-mono font-semibold"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/20 text-xs focus:ring-2 focus:ring-blue-500 text-right font-mono font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Diamond, Stone & Gross Weights */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                <span>Diamond, Stone & Gross Weights</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Diamond Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Diamond Wt. (Dia.Wt.)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.diamond_weight}
                    onChange={(e) => handleChange('diamond_weight', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right font-mono"
                  />
                </div>

                {/* Stone Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stone Wt. (Stn.Wt.)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.stone_weight}
                    onChange={(e) => handleChange('stone_weight', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right font-mono"
                  />
                </div>

                {/* Gold Gross Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gold Gr.Wt. [G]</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.gold_gross_weight}
                    onChange={(e) => handleChange('gold_gross_weight', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right font-mono"
                  />
                </div>

                {/* Silver Gross Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Silver Gr.Wt. [S]</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.silver_gross_weight}
                    onChange={(e) => handleChange('silver_gross_weight', e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 text-right font-mono"
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
                    <span>Update Daily Balance</span>
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
export default DailyBalanceEditPage;
