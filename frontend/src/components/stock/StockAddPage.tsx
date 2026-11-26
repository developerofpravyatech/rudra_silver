import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Save,
  X,
  AlertCircle,
  Loader2,
  PackagePlus,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { createStockStatus, fetchStockStatusUnits } from '../../services/api';
import { showSuccessAlert, showErrorAlert, showValidationAlert } from '../../utils/alert';

interface StockAddPageProps {
  onBackToList?: () => void;
}

export const StockAddPage: React.FC<StockAddPageProps> = ({ onBackToList }) => {
  const navigate = useNavigate();

  // Form states matching stock_status table
  const [itemName, setItemName] = useState<string>('');
  const [unit, setUnit] = useState<string>('Gm');
  const [pc, setPc] = useState<string>('');
  const [grossWeight, setGrossWeight] = useState<string>('');
  const [netWeight, setNetWeight] = useState<string>('');
  const [tunch, setTunch] = useState<string>('');
  const [wastage, setWastage] = useState<string>('');
  const [labourWeight, setLabourWeight] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [silverFine, setSilverFine] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [goldFine, setGoldFine] = useState<string>('');

  const [availableUnits, setAvailableUnits] = useState<string[]>(['Gm', 'Pcs']);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStockStatusUnits()
      .then((units) => {
        if (units && units.length > 0) setAvailableUnits(units);
      })
      .catch((err) => console.error('Failed to load units:', err));
  }, []);

  const handleCancel = () => {
    if (onBackToList) {
      onBackToList();
    } else {
      navigate('/stock-list');
    }
  };

  const clearError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const trimmedItemName = itemName.trim();
    if (!trimmedItemName) {
      errs.item_name = 'This field is required.';
    }

    const trimmedUnit = unit.trim();
    if (!trimmedUnit) {
      errs.unit = 'This field is required.';
    }

    const checkField = (val: string, field: string) => {
      const trimmed = val.trim();
      if (!trimmed) {
        errs[field] = 'This field is required.';
        return;
      }
      if (isNaN(Number(trimmed)) || !isFinite(Number(trimmed))) {
        errs[field] = 'Must be a valid number.';
        return;
      }
      const decimalPart = trimmed.split('.')[1];
      if (decimalPart && decimalPart.length > 3) {
        errs[field] = 'Maximum 3 decimal places allowed.';
      }
    };

    checkField(pc, 'pc');
    checkField(grossWeight, 'gross_weight');
    checkField(netWeight, 'net_weight');
    checkField(tunch, 'tunch');
    checkField(wastage, 'wastage');
    checkField(labourWeight, 'labour_weight');
    checkField(rate, 'rate');
    checkField(silverFine, 'silver_fine');
    checkField(total, 'total');
    checkField(goldFine, 'gold_fine');

    setFieldErrors(errs);
    const firstInvalid = Object.keys(errs)[0];
    if (firstInvalid) {
      setTimeout(() => {
        const el = (document.querySelector(`[name="${firstInvalid}"]`) ||
                    document.querySelector('.border-red-400, .border-red-500')) as HTMLElement | null;
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        item_name: itemName.trim(),
        unit: unit.trim() || 'Gm',
        pc: pc.trim() !== '' ? Number(pc) : null,
        gross_weight: grossWeight.trim() !== '' ? Number(grossWeight) : null,
        net_weight: netWeight.trim() !== '' ? Number(netWeight) : null,
        tunch: tunch.trim() !== '' ? Number(tunch) : null,
        wastage: wastage.trim() !== '' ? Number(wastage) : null,
        labour_weight: labourWeight.trim() !== '' ? Number(labourWeight) : null,
        rate: rate.trim() !== '' ? Number(rate) : null,
        silver_fine: silverFine.trim() !== '' ? Number(silverFine) : null,
        total: total.trim() !== '' ? Number(total) : null,
        gold_fine: goldFine.trim() !== '' ? Number(goldFine) : null,
      };

      await createStockStatus(payload);
      const result = await showSuccessAlert('Stock added successfully.', 'Success!');
      if (result.isConfirmed || result.isDismissed) {
        handleCancel();
      }
    } catch (err: any) {
      const rawMsg = err?.message || 'Failed to add stock. Please try again.';
      const safeMsg = rawMsg.includes('SQL') || rawMsg.includes('PDO')
        ? 'Failed to add stock. Please try again.'
        : rawMsg;
      setErrorMsg(safeMsg);
      await showErrorAlert(safeMsg, 'Error!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Header with Breadcrumb */}
        <div className="pb-4 border-b border-slate-200">
          <nav className="text-xs text-slate-500 flex items-center space-x-1.5 mb-1">
            <button
              type="button"
              onClick={handleCancel}
              className="hover:text-blue-600 transition"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-slate-500">Stock Management</span>
            <span>/</span>
            <button
              type="button"
              onClick={handleCancel}
              className="hover:text-blue-600 transition"
            >
              Stock List
            </button>
            <span>/</span>

                <span className="text-slate-900 font-semibold">Add Stock</span>
              </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
                title="Back to Stock List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add Stock</h1>
                <p className="text-xs text-slate-500">
                  Register new jewellery stock item into the official MySQL stock_status database
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Section 1: Item Identification */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center space-x-2">
                <PackagePlus className="w-4 h-4 text-blue-600" />
                <span>1. Item Identification</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="item_name"
                    value={itemName}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      clearError('item_name');
                    }}
                    onBlur={() => {
                      if (!itemName.trim()) {
                        setFieldErrors((prev) => ({ ...prev, item_name: 'This field is required.' }));
                      }
                    }}
                    placeholder="e.g. 7T FANCY PAYAL"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.item_name ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.item_name && (
                    <p className="text-[11px] text-red-500 mt-1">{fieldErrors.item_name}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Unique name identifier for stock item.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="unit"
                    list="units-list"
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      clearError('unit');
                    }}
                    onBlur={() => {
                      if (!unit.trim()) {
                        setFieldErrors((prev) => ({ ...prev, unit: 'This field is required.' }));
                      }
                    }}
                    placeholder="e.g. Gm, Pcs"
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.unit ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  <datalist id="units-list">
                    {availableUnits.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                  {fieldErrors.unit && (
                    <p className="text-[11px] text-red-500 mt-1">{fieldErrors.unit}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Quantities & Weight Specifications */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                2. Weight & Touch Details (Decimal precision & Negative values supported)
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Pc */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pieces (Pc)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={pc}
                    onChange={(e) => {
                      setPc(e.target.value);
                      clearError('pc');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.pc ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.pc && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.pc}</p>}
                </div>

                {/* Gross Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gross Wt (Gr.Wt.)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={grossWeight}
                    onChange={(e) => {
                      setGrossWeight(e.target.value);
                      clearError('gross_weight');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.gross_weight ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.gross_weight && (
                    <p className="text-[11px] text-red-500 mt-1">{fieldErrors.gross_weight}</p>
                  )}
                </div>

                {/* Net Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Net Wt (Net.Wt.)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={netWeight}
                    onChange={(e) => {
                      setNetWeight(e.target.value);
                      clearError('net_weight');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-blue-50/40 font-mono font-bold text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.net_weight ? 'border-red-400 bg-red-50' : 'border-blue-200'
                    }`}
                  />
                  {fieldErrors.net_weight && (
                    <p className="text-[11px] text-red-500 mt-1">{fieldErrors.net_weight}</p>
                  )}
                </div>

                {/* Tunch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tunch %
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={tunch}
                    onChange={(e) => {
                      setTunch(e.target.value);
                      clearError('tunch');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.tunch ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.tunch && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.tunch}</p>}
                </div>

                {/* Wastage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wastage (Wstg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={wastage}
                    onChange={(e) => {
                      setWastage(e.target.value);
                      clearError('wastage');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.wastage ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.wastage && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.wastage}</p>}
                </div>

                {/* Labour Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Labour Wt (Lbr.Wt)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={labourWeight}
                    onChange={(e) => {
                      setLabourWeight(e.target.value);
                      clearError('labour_weight');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.labour_weight ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.labour_weight && (
                    <p className="text-[11px] text-red-500 mt-1">{fieldErrors.labour_weight}</p>
                  )}
                </div>

                {/* Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={rate}
                    onChange={(e) => {
                      setRate(e.target.value);
                      clearError('rate');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.rate ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.rate && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.rate}</p>}
                </div>

                {/* Silver Fine */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Silver Fine (Sil.Fine)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={silverFine}
                    onChange={(e) => {
                      setSilverFine(e.target.value);
                      clearError('silver_fine');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-amber-50/40 font-mono font-bold text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.silver_fine ? 'border-red-400 bg-red-50' : 'border-amber-200'
                    }`}
                  />
                  {fieldErrors.silver_fine && (
                    <p className="text-[11px] text-red-500 mt-1">{fieldErrors.silver_fine}</p>
                  )}
                </div>

                {/* Total */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={total}
                    onChange={(e) => {
                      setTotal(e.target.value);
                      clearError('total');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono font-bold text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.total ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.total && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.total}</p>}
                </div>

                {/* Gold Fine */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gold Fine
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={goldFine}
                    onChange={(e) => {
                      setGoldFine(e.target.value);
                      clearError('gold_fine');
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.gold_fine ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.gold_fine && (
                    <p className="text-[11px] text-red-500 mt-1">{fieldErrors.gold_fine}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition flex items-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Stock...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Stock</span>
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

export default StockAddPage;