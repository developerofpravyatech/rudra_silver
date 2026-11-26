import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Save,
  X,
  AlertCircle,
  Loader2,
  Edit,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { fetchStockStatusView, updateStockStatus, fetchStockStatusUnits } from '../../services/api';
import { StockStatusRecord } from '../../types';
import { showSuccessAlert, showErrorAlert } from '../../utils/alert';

interface StockEditPageProps {
  onBackToList?: () => void;
  recordId?: number;
}

export const StockEditPage: React.FC<StockEditPageProps> = ({ onBackToList, recordId }) => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const id = recordId || (params.id ? parseInt(params.id, 10) : 0);

  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    fetchStockStatusUnits()
      .then((units) => {
        if (units && units.length > 0) setAvailableUnits(units);
      })
      .catch((err) => console.error('Failed to load units:', err));
  }, []);

  useEffect(() => {
    if (!id || id <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setErrorMsg(null);

    fetchStockStatusView(id)
      .then((record: StockStatusRecord) => {
        setItemName(record.item_name || '');
        setUnit(record.unit || 'Gm');
        setPc(record.pc !== null && record.pc !== undefined ? String(record.pc) : '');
        setGrossWeight(record.gross_weight !== null && record.gross_weight !== undefined ? String(record.gross_weight) : '');
        setNetWeight(record.net_weight !== null && record.net_weight !== undefined ? String(record.net_weight) : '');
        setTunch(record.tunch !== null && record.tunch !== undefined ? String(record.tunch) : '');
        setWastage(record.wastage !== null && record.wastage !== undefined ? String(record.wastage) : '');
        setLabourWeight(record.labour_weight !== null && record.labour_weight !== undefined ? String(record.labour_weight) : '');
        setRate(record.rate !== null && record.rate !== undefined ? String(record.rate) : '');
        setSilverFine(record.silver_fine !== null && record.silver_fine !== undefined ? String(record.silver_fine) : '');
        setTotal(record.total !== null && record.total !== undefined ? String(record.total) : '');
        setGoldFine(record.gold_fine !== null && record.gold_fine !== undefined ? String(record.gold_fine) : '');
      })
      .catch((err: any) => {
        const msg = err.message || 'Failed to load stock record.';
        setErrorMsg(msg);
        setNotFound(true);
        showErrorAlert(msg, 'Error!');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

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

  const validate = (): string | null => {
    const errs: Record<string, string> = {};

    if (!itemName.trim()) {
      errs.item_name = 'This field is required.';
    }

    if (!unit.trim()) {
      errs.unit = 'This field is required.';
    }

    if (!pc.trim()) {
      errs.pc = 'This field is required.';
    }

    if (!grossWeight.trim()) {
      errs.gross_weight = 'This field is required.';
    }

    if (!netWeight.trim()) {
      errs.net_weight = 'This field is required.';
    }

    if (!tunch.trim()) {
      errs.tunch = 'This field is required.';
    }

    if (!wastage.trim()) {
      errs.wastage = 'This field is required.';
    }

    if (!labourWeight.trim()) {
      errs.labour_weight = 'This field is required.';
    }

    if (!rate.trim()) {
      errs.rate = 'This field is required.';
    }

    if (!silverFine.trim()) {
      errs.silver_fine = 'This field is required.';
    }

    if (!total.trim()) {
      errs.total = 'This field is required.';
    }

    if (!goldFine.trim()) {
      errs.gold_fine = 'This field is required.';
    }

    setFieldErrors(errs);
    const firstInvalid = Object.keys(errs)[0] || null;
    if (firstInvalid) {
      setTimeout(() => {
        const el = document.querySelector(`[name="${firstInvalid}"]`) as HTMLElement | null;
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
    return firstInvalid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (validate()) {
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

      await updateStockStatus(id, payload);
      const result = await showSuccessAlert('Stock updated successfully.', 'Success!');
      if (result.isConfirmed || result.isDismissed) {
        handleCancel();
      }
    } catch (err: any) {
      const rawMsg = err?.message || 'Failed to update stock. Please try again.';
      const safeMsg = rawMsg.includes('SQL') || rawMsg.includes('PDO')
        ? 'Failed to update stock. Please try again.'
        : rawMsg;
      setErrorMsg(safeMsg);
      await showErrorAlert(safeMsg, 'Error!');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Loading stock record #{id}...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Stock Record Not Found</h2>
          <p className="text-xs text-slate-500">
            The stock record with ID #{id} could not be located in the stock_status database. It may have been deleted or moved.
          </p>
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            Back to Stock List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <nav className="text-xs text-slate-500 flex items-center space-x-1.5 mb-1">
            <button type="button" onClick={handleCancel} className="hover:text-blue-600 transition">Dashboard</button>
            <span>/</span>
            <span className="text-slate-500">Stock Management</span>
            <span>/</span>
            <button type="button" onClick={handleCancel} className="hover:text-blue-600 transition">Stock List</button>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Edit Stock</span>
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
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Stock Record</h1>
                <p className="text-xs text-slate-500">
                  Modifying stock item #{id} ({itemName}) in official MySQL stock_status database
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center space-x-2">
                <Edit className="w-4 h-4 text-blue-600" />
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
                    onChange={(e) => { setItemName(e.target.value); clearError('item_name'); }}
                    onBlur={() => { if (!itemName.trim()) setFieldErrors((prev) => ({ ...prev, item_name: 'This field is required.' })); }}
                    placeholder="e.g. 7T FANCY PAYAL"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.item_name ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                  {fieldErrors.item_name && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.item_name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="unit"
                    list="units-list-edit"
                    value={unit}
                    onChange={(e) => { setUnit(e.target.value); clearError('unit'); }}
                    onBlur={() => { if (!unit.trim()) setFieldErrors((prev) => ({ ...prev, unit: 'This field is required.' })); }}
                    placeholder="e.g. Gm, Pcs"
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.unit ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                  <datalist id="units-list-edit">
                    {availableUnits.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                  {fieldErrors.unit && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.unit}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                2. Weight & Touch Details
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pieces (Pc) <span className="text-red-500">*</span></label>
                  <input type="number" name="pc" step="0.001" value={pc} onChange={(e) => { setPc(e.target.value); clearError('pc'); }} onBlur={() => { if (!pc.trim()) setFieldErrors((prev) => ({ ...prev, pc: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.pc ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.pc && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.pc}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Wt (Gr.Wt.) <span className="text-red-500">*</span></label>
                  <input type="number" name="gross_weight" step="0.001" value={grossWeight} onChange={(e) => { setGrossWeight(e.target.value); clearError('gross_weight'); }} onBlur={() => { if (!grossWeight.trim()) setFieldErrors((prev) => ({ ...prev, gross_weight: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.gross_weight ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.gross_weight && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.gross_weight}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Net Wt (Net.Wt.) <span className="text-red-500">*</span></label>
                  <input type="number" name="net_weight" step="0.001" value={netWeight} onChange={(e) => { setNetWeight(e.target.value); clearError('net_weight'); }} onBlur={() => { if (!netWeight.trim()) setFieldErrors((prev) => ({ ...prev, net_weight: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border bg-blue-50/40 font-mono font-bold text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.net_weight ? 'border-red-400 bg-red-50' : 'border-blue-200'}`} />
                  {fieldErrors.net_weight && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.net_weight}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tunch % <span className="text-red-500">*</span></label>
                  <input type="number" name="tunch" step="0.001" value={tunch} onChange={(e) => { setTunch(e.target.value); clearError('tunch'); }} onBlur={() => { if (!tunch.trim()) setFieldErrors((prev) => ({ ...prev, tunch: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.tunch ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.tunch && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.tunch}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wastage (Wstg) <span className="text-red-500">*</span></label>
                  <input type="number" name="wastage" step="0.001" value={wastage} onChange={(e) => { setWastage(e.target.value); clearError('wastage'); }} onBlur={() => { if (!wastage.trim()) setFieldErrors((prev) => ({ ...prev, wastage: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.wastage ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.wastage && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.wastage}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Labour Wt (Lbr.Wt) <span className="text-red-500">*</span></label>
                  <input type="number" name="labour_weight" step="0.001" value={labourWeight} onChange={(e) => { setLabourWeight(e.target.value); clearError('labour_weight'); }} onBlur={() => { if (!labourWeight.trim()) setFieldErrors((prev) => ({ ...prev, labour_weight: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.labour_weight ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.labour_weight && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.labour_weight}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate (₹) <span className="text-red-500">*</span></label>
                  <input type="number" name="rate" step="0.001" value={rate} onChange={(e) => { setRate(e.target.value); clearError('rate'); }} onBlur={() => { if (!rate.trim()) setFieldErrors((prev) => ({ ...prev, rate: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.rate ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.rate && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.rate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">Silver Fine (Sil.Fine) <span className="text-red-500">*</span></label>
                  <input type="number" name="silver_fine" step="0.001" value={silverFine} onChange={(e) => { setSilverFine(e.target.value); clearError('silver_fine'); }} onBlur={() => { if (!silverFine.trim()) setFieldErrors((prev) => ({ ...prev, silver_fine: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border bg-amber-50/40 font-mono font-bold text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.silver_fine ? 'border-red-400 bg-red-50' : 'border-amber-200'}`} />
                  {fieldErrors.silver_fine && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.silver_fine}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Total Amount <span className="text-red-500">*</span></label>
                  <input type="number" name="total" step="0.001" value={total} onChange={(e) => { setTotal(e.target.value); clearError('total'); }} onBlur={() => { if (!total.trim()) setFieldErrors((prev) => ({ ...prev, total: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono font-bold text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.total ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.total && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.total}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gold Fine <span className="text-red-500">*</span></label>
                  <input type="number" name="gold_fine" step="0.001" value={goldFine} onChange={(e) => { setGoldFine(e.target.value); clearError('gold_fine'); }} onBlur={() => { if (!goldFine.trim()) setFieldErrors((prev) => ({ ...prev, gold_fine: 'This field is required.' })); }} placeholder="0.000" className={`w-full px-3 py-2 text-sm rounded-lg border font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${fieldErrors.gold_fine ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                  {fieldErrors.gold_fine && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.gold_fine}</p>}
                </div>
              </div>
            </div>

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
                    <span>Updating Stock...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Stock</span>
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

export default StockEditPage;
