import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Save, Loader2, RefreshCw } from 'lucide-react';
import { StockItem, StockDropdownOptions } from '../../types';
import { createStockItem, updateStockItem } from '../../services/api';

interface StockFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedItem: StockItem, isEdit: boolean) => void;
  initialItem?: StockItem | null;
  dropdownOptions: StockDropdownOptions | null;
  onRefreshNextCode?: () => void;
}

export const StockFormModal: React.FC<StockFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialItem,
  dropdownOptions,
}) => {
  const isEdit = Boolean(initialItem && initialItem.id);

  // Form states
  const [stockCode, setStockCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemGroupId, setItemGroupId] = useState<number | string>('');
  const [metalType, setMetalType] = useState('Silver');
  const [purityId, setPurityId] = useState<number | string>('');
  const [grossWeight, setGrossWeight] = useState<string>('0.000');
  const [stoneWeight, setStoneWeight] = useState<string>('0.000');
  const [otherWeight, setOtherWeight] = useState<string>('0.000');
  const [netWeight, setNetWeight] = useState<string>('0.000');
  const [fineWeight, setFineWeight] = useState<string>('0.000');
  const [quantity, setQuantity] = useState<string>('1');
  const [availableStock, setAvailableStock] = useState<string>('1');
  const [minStockLevel, setMinStockLevel] = useState<string>('0');
  const [unitId, setUnitId] = useState<number | string>(1);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<string>('Available');

  // UI / submission states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    setErrors({});
    setApiError(null);

    if (initialItem) {
      setStockCode(initialItem.stock_code || '');
      setItemName(initialItem.item_name || '');
      setItemGroupId(initialItem.item_group_id || '');
      setMetalType(initialItem.metal_type || 'Silver');
      setPurityId(initialItem.purity_id || '');
      setGrossWeight(Number(initialItem.gross_weight || 0).toFixed(3));
      setStoneWeight(Number(initialItem.stone_weight || 0).toFixed(3));
      setOtherWeight(Number(initialItem.other_weight || 0).toFixed(3));
      setNetWeight(Number(initialItem.net_weight || 0).toFixed(3));
      setFineWeight(Number(initialItem.fine_weight || 0).toFixed(3));
      setQuantity(String(initialItem.quantity ?? 1));
      setAvailableStock(String(initialItem.available_stock ?? 1));
      setMinStockLevel(String(initialItem.minimum_stock_level ?? 0));
      setUnitId(initialItem.unit_id || 1);
      setPurchaseDate(initialItem.purchase_date ? initialItem.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setRemarks(initialItem.remarks || '');
      setStatus(initialItem.status || 'Available');
    } else {
      // Create mode
      setStockCode(dropdownOptions?.next_code || `STK-${new Date().getFullYear()}-0001`);
      setItemName('');
      setItemGroupId(dropdownOptions?.item_groups?.[0]?.id || '');
      setMetalType('Silver');
      setPurityId(dropdownOptions?.purities?.[0]?.id || '');
      setGrossWeight('0.000');
      setStoneWeight('0.000');
      setOtherWeight('0.000');
      setNetWeight('0.000');
      setFineWeight('0.000');
      setQuantity('1');
      setAvailableStock('1');
      setMinStockLevel('0');
      setUnitId(dropdownOptions?.units?.[0]?.id || 1);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
      setStatus('Available');
    }
  }, [isOpen, initialItem, dropdownOptions]);

  // Dynamic automatic calculation of Net Weight & Fine Weight
  useEffect(() => {
    const gross = parseFloat(grossWeight) || 0;
    const stone = parseFloat(stoneWeight) || 0;
    const other = parseFloat(otherWeight) || 0;

    const calculatedNet = Math.max(0, gross - (stone + other));
    setNetWeight(calculatedNet.toFixed(3));

    // Look up selected purity touch percentage
    let touch = 100;
    if (purityId && dropdownOptions?.purities) {
      const selectedPurity = dropdownOptions.purities.find((p) => p.id === Number(purityId));
      if (selectedPurity && selectedPurity.touch_purity) {
        touch = selectedPurity.touch_purity;
      }
    }

    const calculatedFine = (calculatedNet * touch) / 100;
    setFineWeight(calculatedFine.toFixed(3));
  }, [grossWeight, stoneWeight, otherWeight, purityId, dropdownOptions]);

  // Automatic status recommendation based on available stock and minimum level
  useEffect(() => {
    const avail = parseInt(availableStock, 10) || 0;
    const min = parseInt(minStockLevel, 10) || 0;

    if (avail <= 0) {
      setStatus('Out of Stock');
    } else if (min > 0 && avail <= min) {
      setStatus('Low Stock');
    } else {
      setStatus('Available');
    }
  }, [availableStock, minStockLevel]);

  // Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!stockCode.trim()) {
      errs.stock_code = 'Stock Code is required.';
    }

    if (!itemName.trim()) {
      errs.item_name = 'Item Name is required.';
    }

    const gross = parseFloat(grossWeight);
    if (isNaN(gross) || gross <= 0) {
      errs.gross_weight = 'Gross Weight must be a positive number greater than 0.';
    }

    const stone = parseFloat(stoneWeight);
    if (isNaN(stone) || stone < 0) {
      errs.stone_weight = 'Stone Weight cannot be negative.';
    }

    const other = parseFloat(otherWeight);
    if (isNaN(other) || other < 0) {
      errs.other_weight = 'Other Weight cannot be negative.';
    }

    if ((stone + other) > gross) {
      errs.gross_weight = 'Stone + Other Weight cannot exceed Gross Weight.';
    }

    const net = parseFloat(netWeight);
    const fine = parseFloat(fineWeight);
    if (fine > net) {
      errs.fine_weight = 'Fine Weight cannot exceed Net Weight.';
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      errs.quantity = 'Quantity must be a valid non-negative number.';
    }

    const avail = parseInt(availableStock, 10);
    if (isNaN(avail) || avail < 0) {
      errs.available_stock = 'Available Stock must be a valid non-negative number.';
    }

    const min = parseInt(minStockLevel, 10);
    if (isNaN(min) || min < 0) {
      errs.minimum_stock_level = 'Minimum Stock Level cannot be negative.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: Partial<StockItem> = {
        stock_code: stockCode.trim(),
        item_name: itemName.trim(),
        item_group_id: itemGroupId ? Number(itemGroupId) : null,
        metal_type: metalType,
        purity_id: purityId ? Number(purityId) : null,
        gross_weight: parseFloat(grossWeight),
        stone_weight: parseFloat(stoneWeight) || 0,
        other_weight: parseFloat(otherWeight) || 0,
        net_weight: parseFloat(netWeight),
        fine_weight: parseFloat(fineWeight),
        quantity: parseInt(quantity, 10) || 0,
        available_stock: parseInt(availableStock, 10) || 0,
        minimum_stock_level: parseInt(minStockLevel, 10) || 0,
        unit_id: unitId ? Number(unitId) : 1,
        purchase_date: purchaseDate || null,
        remarks: remarks.trim() || null,
        status: status,
      };

      if (isEdit && initialItem) {
        const res = await updateStockItem(initialItem.id, payload);
        onSuccess(res.data, true);
      } else {
        const res = await createStockItem(payload);
        onSuccess(res.data, false);
      }
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to save stock record. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Edit Stock Record' : 'Add New Jewellery Stock'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? `Updating stock code ${initialItem?.stock_code}`
                  : 'Enter technical specifications, weights and master associations'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {apiError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Section 1: Item Identification & Classifications */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              1. Basic Information & Masters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stock Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={stockCode}
                    onChange={(e) => setStockCode(e.target.value.toUpperCase())}
                    placeholder="e.g. STK-2026-0001"
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-slate-50 font-mono font-bold text-blue-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      errors.stock_code ? 'border-red-400' : 'border-slate-300'
                    }`}
                  />
                  {!isEdit && dropdownOptions?.next_code && (
                    <button
                      type="button"
                      title="Reset to generated code"
                      onClick={() => setStockCode(dropdownOptions.next_code)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-blue-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {errors.stock_code && <p className="text-[11px] text-red-500 mt-1">{errors.stock_code}</p>}
              </div>

              {/* Item Name */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. 925 Antique Bridal Silver Payal Pair"
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.item_name ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {errors.item_name && <p className="text-[11px] text-red-500 mt-1">{errors.item_name}</p>}
              </div>

              {/* Metal Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metal Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={metalType}
                  onChange={(e) => setMetalType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Item Group */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Group (Catalogue Master)
                </label>
                <select
                  value={itemGroupId}
                  onChange={(e) => setItemGroupId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Item Group --</option>
                  {dropdownOptions?.item_groups?.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.name} {grp.hsn_code ? `(HSN: ${grp.hsn_code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purity */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purity Hallmark
                </label>
                <select
                  value={purityId}
                  onChange={(e) => setPurityId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Purity --</option>
                  {dropdownOptions?.purities?.map((pur) => (
                    <option key={pur.id} value={pur.id}>
                      {pur.name} ({pur.touch_purity}% touch)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Weight Precision Details (Jewellery Calculations) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Weight Specifications (High-Precision Grams)
              </h3>
              <span className="text-[11px] text-blue-600 font-medium">
                Auto-calculated Net & Fine Weight
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Gross Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gross Wt (g) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.gross_weight ? 'border-red-400 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {errors.gross_weight && <p className="text-[11px] text-red-500 mt-1">{errors.gross_weight}</p>}
              </div>

              {/* Stone Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stone Wt (g)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={stoneWeight}
                  onChange={(e) => setStoneWeight(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Other Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Other / Thread Wt (g)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={otherWeight}
                  onChange={(e) => setOtherWeight(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Net Weight (Readonly / Calculated) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Net Wt (g) <span className="text-xs text-blue-600 font-normal">(Gross - Less)</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  readOnly
                  value={netWeight}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 bg-blue-50 font-mono font-bold text-blue-900 cursor-not-allowed"
                />
              </div>

              {/* Fine Weight (Readonly / Calculated) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fine Wt (g) <span className="text-xs text-amber-600 font-normal">(Net × Purity)</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  readOnly
                  value={fineWeight}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-amber-200 bg-amber-50 font-mono font-bold text-amber-900 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Quantity, Units & Status Controls */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              3. Inventory Stocking & Dates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Qty</label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Available Stock */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Available Stock</label>
                <input
                  type="number"
                  min="0"
                  value={availableStock}
                  onChange={(e) => setAvailableStock(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Minimum Stock Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Alert Level</label>
                <input
                  type="number"
                  min="0"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {dropdownOptions?.units?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} ({u.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Available">Available</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarks / Hallmark & Batch Details
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. HUID Hallmark laser verified, karigar batch #12, anti-tarnish rhodium dip"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Update Stock' : 'Save Stock Record'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockFormModal;
