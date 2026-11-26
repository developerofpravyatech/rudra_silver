import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Loader2,
  Layers,
  FileText,
  Scale,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import {
  DailyTransactionRecord,
  DailyTransactionFilterOptions,
} from '../../types';
import {
  fetchDailyTransactionById,
  updateDailyTransaction,
  fetchDailyTransactionFilterOptions,
} from '../../services/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alert';

interface TransactionEditPageProps {
  onBackToList?: () => void;
  recordId?: number;
}

export const TransactionEditPage: React.FC<TransactionEditPageProps> = ({ onBackToList, recordId }) => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const id = recordId || (params.id ? parseInt(params.id, 10) : 0);

  const handleCancel = () => {
    if (onBackToList) {
      onBackToList();
    } else {
      navigate('/transactions');
    }
  };

  // Filter options from database
  const [filterOptions, setFilterOptions] = useState<DailyTransactionFilterOptions>({
    groups: [],
    logins: [],
    stamps: [],
    voucher_types: [],
    series: [],
    sites: [],
    types: [],
    parties: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<DailyTransactionRecord>>({
    transaction_date: '',
    transaction_type: 'Sale',
    party_name: '',
    ref_no: '',
    narration: '',
    login_name: 'Admin',
    stamp: '92.5',
    voucher_type: 'Regular',
    series: 'GST',
    site: 'Main Store',
    group_name: 'Sundry Debtors',
    pc: 1,
    gross_weight: 0,
    net_weight: 0,
    dia_weight: 0,
    stone_weight: 0,
    gold_fine: 0,
    silver_fine: 0,
    total_amount: 0,
    is_undelivered: 0,
    student_details: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDailyTransactionFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Failed to load transaction options:', err));
  }, []);

  // Fetch record on mount
  useEffect(() => {
    if (!id || id <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchDailyTransactionById(id)
      .then((rec) => {
        if (!rec) {
          setNotFound(true);
        } else {
          setFormData({
            ...rec,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load transaction:', err);
        setNotFound(true);
        setApiError(err.message || 'Failed to load transaction data.');
      })
      .finally(() => setLoading(false));
  }, [id]);

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
    if (!formData.party_name || !formData.party_name.trim()) {
      errors.party_name = 'This field is required.';
    }
    if (!formData.transaction_date) {
      errors.transaction_date = 'This field is required.';
    }
    if (!formData.transaction_type) {
      errors.transaction_type = 'This field is required.';
    }
    if (!formData.gross_weight) {
      errors.gross_weight = 'This field is required.';
    }
    if (!formData.net_weight) {
      errors.net_weight = 'This field is required.';
    }
    if (!formData.pc) {
      errors.pc = 'This field is required.';
    }
    if (!formData.silver_fine) {
      errors.silver_fine = 'This field is required.';
    }
    if (!formData.gold_fine) {
      errors.gold_fine = 'This field is required.';
    }
    if (!formData.total_amount) {
      errors.total_amount = 'This field is required.';
    }

    setFormErrors(errors);
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
      await updateDailyTransaction(id, formData);
      await showSuccessAlert(`Transaction #${id} updated successfully.`, 'Success!');
      handleCancel();
    } catch (err: any) {
      const msg = err.message || 'Failed to update transaction. Please try again.';
      setApiError(msg);
      showErrorAlert(msg, 'Error!');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] flex items-center justify-center p-8 select-none">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Loading transaction #{id} data...
          </p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] flex items-center justify-center p-8 select-none">
        <div className="max-w-md w-full bg-white dark:bg-[#0e121a] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transaction Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transaction record #{id} could not be located in the database. It may have been deleted or archived.
          </p>
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Header with Breadcrumb */}
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
              Transactions
            </button>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">Edit Transaction #{id}</span>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Back to Transactions List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-amber-500" />
                  Edit Daily Transaction #{id}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Updating voucher record for <strong className="text-slate-700 dark:text-slate-200">{formData.party_name}</strong> in MySQL daily_transactions.
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
                <span>Update Transaction</span>
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

        {/* Main Form Card */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Section 1: Voucher & Party Details */}
          <div className="bg-white dark:bg-[#0e121a] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-slate-100 dark:border-white/[0.06] pb-2 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>1. Voucher & Party Identification</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Transaction Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
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
                </div>
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
                  value={formData.transaction_type || 'Sale'}
                  onChange={(e) => {
                    setFormData({ ...formData, transaction_type: e.target.value });
                    clearError('transaction_type');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                >
                  {['Sale', 'Purchase', 'Receipt', 'Payment', 'Issue', 'Receive', 'Journal', 'Contra'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {formErrors.transaction_type && (
                  <p className="text-[11px] text-red-500 mt-1">{formErrors.transaction_type}</p>
                )}
              </div>

              {/* Ref No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference No.
                </label>
                <input
                  type="text"
                  name="ref_no"
                  value={formData.ref_no || ''}
                  onChange={(e) => setFormData({ ...formData, ref_no: e.target.value })}
                  placeholder="e.g. GST-1024"
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
                  placeholder="e.g. ASHAPURA ORNAMENTS"
                  list="parties-list-edit"
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold uppercase tracking-wide focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${
                    formErrors.party_name
                      ? 'border-red-500 bg-red-50/20 text-red-900 dark:text-red-300'
                      : 'border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922]'
                  }`}
                />
                <datalist id="parties-list-edit">
                  {filterOptions.parties.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                {formErrors.party_name && (
                  <p className="text-[11px] text-red-500 mt-1">{formErrors.party_name}</p>
                )}
              </div>

              {/* Voucher Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Type
                </label>
                <select
                  name="voucher_type"
                  value={formData.voucher_type || 'Regular'}
                  onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                >
                  {['Regular', 'Tax Invoice', 'Estimate', 'Delivery Challan', 'Cash Memo'].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Series */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Series</label>
                <select
                  value={formData.series || 'GST'}
                  onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
                >
                  {['GST', 'BILL', 'RET', 'CHL'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Site */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Site</label>
                <input
                  type="text"
                  value={formData.site || 'Main Store'}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                  placeholder="Main Store"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
                />
              </div>

              {/* Group Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Group</label>
                <input
                  type="text"
                  value={formData.group_name || 'Sundry Debtors'}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  placeholder="Sundry Debtors"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
                />
              </div>

              {/* Stamp / Purity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stamp / Purity</label>
                <input
                  type="text"
                  value={formData.stamp || '92.5'}
                  onChange={(e) => setFormData({ ...formData, stamp: e.target.value })}
                  placeholder="92.5"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Weight Specifications & Fine Metal */}
          <div className="bg-white dark:bg-[#0e121a] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-slate-100 dark:border-white/[0.06] pb-2 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>2. Pieces, Weights & Fine Metal Calculations (Negative adjustments allowed)</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Pieces (Pc)</label>
                <input
                  type="number"
                  name="pc"
                  value={formData.pc ?? 1}
                  onChange={(e) => setFormData({ ...formData, pc: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gross Weight (gm)</label>
                <input
                  type="number"
                  step="0.001"
                  name="gross_weight"
                  value={formData.gross_weight ?? 0}
                  onChange={(e) => setFormData({ ...formData, gross_weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Net Weight (gm)</label>
                <input
                  type="number"
                  step="0.001"
                  name="net_weight"
                  value={formData.net_weight ?? 0}
                  onChange={(e) => setFormData({ ...formData, net_weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Silver Fine (gm)</label>
                <input
                  type="number"
                  step="0.001"
                  name="silver_fine"
                  value={formData.silver_fine ?? 0}
                  onChange={(e) => setFormData({ ...formData, silver_fine: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gold Fine (gm)</label>
                <input
                  type="number"
                  step="0.001"
                  name="gold_fine"
                  value={formData.gold_fine ?? 0}
                  onChange={(e) => setFormData({ ...formData, gold_fine: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Diamond Wt. (cts)</label>
                <input
                  type="number"
                  step="0.001"
                  name="dia_weight"
                  value={formData.dia_weight ?? 0}
                  onChange={(e) => setFormData({ ...formData, dia_weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stone Wt. (cts)</label>
                <input
                  type="number"
                  step="0.001"
                  name="stone_weight"
                  value={formData.stone_weight ?? 0}
                  onChange={(e) => setFormData({ ...formData, stone_weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono text-right focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="total_amount"
                  value={formData.total_amount ?? 0}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Narration & Status */}
          <div className="bg-white dark:bg-[#0e121a] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-slate-100 dark:border-white/[0.06] pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>3. Narration & Additional Notes</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Narration / Notes</label>
              <textarea
                name="narration"
                value={formData.narration || ''}
                onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                rows={2}
                placeholder="Optional notes or remarks regarding this transaction..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
                <input
                  type="checkbox"
                  name="is_undelivered"
                  checked={Boolean(formData.is_undelivered)}
                  onChange={(e) => setFormData({ ...formData, is_undelivered: e.target.checked ? 1 : 0 })}
                  className="accent-amber-500 cursor-pointer"
                />
                <span>Mark as Undelivered Item</span>
              </label>
            </div>

            {Boolean(formData.is_undelivered) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student / Apprentice Details
                </label>
                <input
                  type="text"
                  name="student_details"
                  value={formData.student_details || ''}
                  onChange={(e) => setFormData({ ...formData, student_details: e.target.value })}
                  placeholder="Batch, Hallmarking student info..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#151922] focus:outline-hidden"
                />
              </div>
            )}
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
              <span>Update Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TransactionUpdate = TransactionEditPage;
export default TransactionEditPage;
