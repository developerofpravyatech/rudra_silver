import React, { useState, useEffect } from 'react';
import { Account, BillingItem, DailyRates } from '../types';
import { fetchTagByBarcode, searchAccounts, calculateItem, submitVoucher } from '../services/api';
import { Plus, Trash2, Search, CheckCircle, Scale, X, Sparkles, ArrowLeft } from 'lucide-react';

interface PosBillingModalProps {
  voucherType: string;
  rates: DailyRates | null;
  liveWeight: number;
  initialItem?: Partial<BillingItem> | null;
  onClose: () => void;
  isInline?: boolean;
}

export const PosBillingModal: React.FC<PosBillingModalProps> = ({
  voucherType,
  rates,
  liveWeight,
  initialItem,
  onClose,
  isInline = true,
}) => {
  const [partySearch, setPartySearch] = useState('');
  const [selectedParty, setSelectedParty] = useState<Account | null>(null);
  const [partyList, setPartyList] = useState<Account[]>([]);
  const [isPartySearchOpen, setIsPartySearchOpen] = useState(false);

  const [items, setItems] = useState<BillingItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<
    'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OLD_METAL_EXCHANGE'
  >('CASH');
  const [settledCash, setSettledCash] = useState<number>(0);
  const [settledFineSilver, setSettledFineSilver] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      const defaultRate = rates?.silver_925_rate
        ? rates.silver_925_rate / 1000
        : 150.0;
      const gross = initialItem.grossWeight || (liveWeight > 0 ? liveWeight : 100.0);
      const touch = initialItem.purityTouch || 92.5;
      const wastage = initialItem.wastagePercent || 0.0;
      const fine = (gross * (touch + wastage)) / 100;
      const labourRate = initialItem.labourRate || 6.0;
      const metalAmt = fine * defaultRate;
      const labourAmt = gross * labourRate;

      setItems([
        {
          id: Math.random().toString(),
          tagNumber: initialItem.tagNumber || 'CUSTOM-01',
          description: initialItem.description || 'Silver Jewellery',
          itemId: 1,
          purityStampId: 1,
          pieces: initialItem.pieces || 1,
          grossWeight: gross,
          lessWeight: initialItem.lessWeight || 0.0,
          netWeight: gross - (initialItem.lessWeight || 0.0),
          purityTouch: touch,
          wastagePercent: wastage,
          fineWeight: fine,
          metalRatePerGram: defaultRate,
          metalAmount: metalAmt,
          labourRate: labourRate,
          labourType: 'PER_GRAM_NET',
          labourAmount: labourAmt,
          stoneAmount: 0.0,
          totalItemAmount: metalAmt + labourAmt,
        },
      ]);
    }
  }, [initialItem]);

  useEffect(() => {
    if (partySearch.length >= 2) {
      searchAccounts(partySearch).then((res) => {
        setPartyList(res);
        setIsPartySearchOpen(true);
      });
    } else {
      setPartyList([]);
      setIsPartySearchOpen(false);
    }
  }, [partySearch]);

  const handleTagScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    try {
      const tag = await fetchTagByBarcode(scanInput.trim());
      if (tag) {
        const defaultRate = rates?.silver_925_rate
          ? rates.silver_925_rate / 1000
          : 150.0;
        const calc = await calculateItem({
          gross_weight: tag.gross_weight,
          less_weight: tag.less_weight,
          purity_touch: tag.purity_touch,
          wastage_percent: tag.wastage_percent,
          metal_rate_per_gram: defaultRate,
          labour_rate: tag.labour_rate,
          labour_type: 'PER_GRAM_NET',
        });

        const newItem: BillingItem = {
          id: Math.random().toString(),
          tagNumber: tag.tag_number,
          description: tag.item_name || 'Scanned Jewellery',
          itemId: tag.item_id,
          purityStampId: 1,
          pieces: 1,
          grossWeight: tag.gross_weight,
          lessWeight: tag.less_weight,
          netWeight: calc.net_weight,
          purityTouch: tag.purity_touch,
          wastagePercent: tag.wastage_percent,
          fineWeight: calc.fine_weight,
          metalRatePerGram: defaultRate,
          metalAmount: calc.metal_amount,
          labourRate: tag.labour_rate,
          labourType: 'PER_GRAM_NET',
          labourAmount: calc.labour_amount,
          stoneAmount: 0,
          totalItemAmount: calc.total_item_amount,
          huidNumber: tag.huid_number,
        };

        setItems((prev) => [...prev, newItem]);
        setScanInput('');
      } else {
        alert('Tag not found');
      }
    } catch (err) {
      alert('Error fetching tag');
    }
  };

  const addBlankRow = () => {
    const defaultRate = rates?.silver_925_rate
      ? rates.silver_925_rate / 1000
      : 150.0;
    const initialGross = liveWeight > 0 ? liveWeight : 100.0;
    const newItem: BillingItem = {
      id: Math.random().toString(),
      tagNumber: '',
      description: 'Silver Payal',
      itemId: 1,
      purityStampId: 1,
      pieces: 1,
      grossWeight: initialGross,
      lessWeight: 0.0,
      netWeight: initialGross,
      purityTouch: 80.0,
      wastagePercent: 5.0,
      fineWeight: initialGross * 0.85,
      metalRatePerGram: defaultRate,
      metalAmount: initialGross * 0.85 * defaultRate,
      labourRate: 5.0,
      labourType: 'PER_GRAM_NET',
      labourAmount: initialGross * 5.0,
      stoneAmount: 0.0,
      totalItemAmount: initialGross * 0.85 * defaultRate + initialGross * 5.0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItemField = async (
    index: number,
    field: keyof BillingItem,
    val: any
  ) => {
    const updated = [...items];
    const itm = { ...updated[index], [field]: val };

    const net = Math.max(0, itm.grossWeight - itm.lessWeight);
    itm.netWeight = net;

    try {
      const calc = await calculateItem({
        gross_weight: itm.grossWeight,
        less_weight: itm.lessWeight,
        purity_touch: itm.purityTouch,
        wastage_percent: itm.wastagePercent,
        metal_rate_per_gram: itm.metalRatePerGram,
        labour_rate: itm.labourRate,
        labour_type: itm.labourType,
        stone_amount: itm.stoneAmount,
      });

      itm.fineWeight = calc.fine_weight;
      itm.metalAmount = calc.metal_amount;
      itm.labourAmount = calc.labour_amount;
      itm.totalItemAmount = calc.total_item_amount;

      updated[index] = itm;
      setItems(updated);
    } catch (e) {
      setItems(updated);
    }
  };

  const removeRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const grossTotal = items.reduce((acc, itm) => acc + itm.totalItemAmount, 0);
  const totalFineSilver = items.reduce((acc, itm) => acc + itm.fineWeight, 0);
  const taxable = Math.max(0, grossTotal - discount);
  const gst = Math.round(taxable * 0.03 * 100) / 100;
  const netTotal = Math.round(taxable + gst);

  const handleCheckout = async () => {
    if (!selectedParty) {
      alert('Please select a customer or party first');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        branch_id: 1,
        account_id: selectedParty.id,
        voucher_type: voucherType,
        voucher_date: new Date().toISOString().split('T')[0],
        series: 'GST',
        gross_amount: grossTotal,
        discount_amount: discount,
        taxable_amount: taxable,
        cgst_amount: gst / 2,
        sgst_amount: gst / 2,
        net_amount: netTotal,
        round_off: netTotal - (taxable + gst),
        remarks: 'Direct Sale from POS Terminal',
        items: items.map((itm) => ({
          item_id: itm.itemId,
          purity_stamp_id: itm.purityStampId,
          description: itm.description,
          tag_number: itm.tagNumber,
          pieces: itm.pieces,
          gross_weight: itm.grossWeight,
          less_weight: itm.lessWeight,
          net_weight: itm.netWeight,
          purity_touch: itm.purityTouch,
          wastage_percent: itm.wastagePercent,
          fine_weight: itm.fineWeight,
          metal_rate: itm.metalRatePerGram,
          metal_amount: itm.metalAmount,
          labour_rate: itm.labourRate,
          labour_type: itm.labourType,
          labour_amount: itm.labourAmount,
          stone_amount: itm.stoneAmount,
          total_amount: itm.totalItemAmount,
        })),
        settlements: [],
      };

      const res = await submitVoucher(payload);
      setSuccessMessage(
        `Invoice #${res.voucher_no} (${res.series}) generated successfully!`
      );
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`Error creating invoice: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 w-full">
      {/* Title Bar */}
      <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="font-display font-bold tracking-wider text-sm text-slate-900 dark:text-white">
            {voucherType} Entry &bull; Rudra Silver POS Billing
          </span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4 flex-1 text-xs overflow-y-auto">
        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Top Search Controls */}
        <div className="bg-slate-50 dark:bg-[#141822] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Party Select */}
          <div className="relative">
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
              Select Customer / Party (F4)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer name or mobile..."
                value={
                  selectedParty
                    ? `${selectedParty.name} (${selectedParty.mobile})`
                    : partySearch
                }
                onChange={(e) => {
                  setSelectedParty(null);
                  setPartySearch(e.target.value);
                }}
                className="w-full px-3 py-2 pl-9 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {isPartySearchOpen && partyList.length > 0 && (
              <div className="absolute z-20 left-0 right-0 bg-white dark:bg-[#161a24] border border-slate-200 dark:border-white/[0.12] mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.05]">
                {partyList.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedParty(p);
                      setIsPartySearchOpen(false);
                    }}
                    className="p-2.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer flex justify-between items-center transition"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.name} ({p.mobile})
                    </span>
                    <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">
                      ₹{p.balance_inr.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tag Scan */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
              Scan RFID / Barcode Tag
            </label>
            <form onSubmit={handleTagScan}>
              <input
                type="text"
                placeholder="Enter tag number and press Enter..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </form>
          </div>

          {/* Scale Grab & Add Button */}
          <div className="flex items-end space-x-2">
            <button
              onClick={addBlankRow}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2 rounded-lg font-bold hover:brightness-105 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
            {liveWeight > 0 && (
              <button
                onClick={() => {
                  if (items.length > 0) {
                    updateItemField(items.length - 1, 'grossWeight', liveWeight);
                  } else {
                    addBlankRow();
                  }
                }}
                className="flex items-center gap-1.5 bg-amber-50 dark:bg-[#1f2636] border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 px-3.5 py-2 rounded-lg font-mono font-bold hover:border-amber-500 transition"
              >
                <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Grab ({liveWeight.toFixed(2)}g)</span>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#141822] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-white/[0.08]">
                <th className="p-3 w-8">#</th>
                <th className="p-3 w-28">Tag No</th>
                <th className="p-3">Description</th>
                <th className="p-3 w-24 text-right">Gross Wt</th>
                <th className="p-3 w-20 text-right">Less Wt</th>
                <th className="p-3 w-24 text-right">Net Wt</th>
                <th className="p-3 w-20 text-right">Touch %</th>
                <th className="p-3 w-20 text-right">Wstg %</th>
                <th className="p-3 w-24 text-right">Fine Wt</th>
                <th className="p-3 w-24 text-right">Rate/g</th>
                <th className="p-3 w-28 text-right">Metal Amt</th>
                <th className="p-3 w-20 text-right">Lbr/g</th>
                <th className="p-3 w-24 text-right">Labour</th>
                <th className="p-3 w-28 text-right">Total (₹)</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-mono">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-slate-500 font-sans">
                    No items added yet. Click "+ Add Item" or scan a barcode tag.
                  </td>
                </tr>
              ) : (
                items.map((itm, idx) => (
                  <tr key={itm.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                    <td className="p-3 text-slate-500">{idx + 1}</td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={itm.tagNumber}
                        onChange={(e) =>
                          updateItemField(idx, 'tagNumber', e.target.value)
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-white text-xs"
                        placeholder="TAG"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={itm.description}
                        onChange={(e) =>
                          updateItemField(idx, 'description', e.target.value)
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-white text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.001"
                        value={itm.grossWeight}
                        onChange={(e) =>
                          updateItemField(
                            idx,
                            'grossWeight',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/[0.08] rounded text-right text-slate-900 dark:text-white text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.001"
                        value={itm.lessWeight}
                        onChange={(e) =>
                          updateItemField(
                            idx,
                            'lessWeight',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/[0.08] rounded text-right text-slate-900 dark:text-white text-xs"
                      />
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      {itm.netWeight.toFixed(3)}
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={itm.purityTouch}
                        onChange={(e) =>
                          updateItemField(
                            idx,
                            'purityTouch',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/[0.08] rounded text-right text-slate-900 dark:text-white text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={itm.wastagePercent}
                        onChange={(e) =>
                          updateItemField(
                            idx,
                            'wastagePercent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/[0.08] rounded text-right text-slate-900 dark:text-white text-xs"
                      />
                    </td>
                    <td className="p-3 text-right text-amber-700 dark:text-amber-400 font-bold">
                      {itm.fineWeight.toFixed(3)}
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={itm.metalRatePerGram}
                        onChange={(e) =>
                          updateItemField(
                            idx,
                            'metalRatePerGram',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/[0.08] rounded text-right text-slate-900 dark:text-white text-xs"
                      />
                    </td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                      {itm.metalAmount.toFixed(2)}
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.1"
                        value={itm.labourRate}
                        onChange={(e) =>
                          updateItemField(
                            idx,
                            'labourRate',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/[0.08] rounded text-right text-slate-900 dark:text-white text-xs"
                      />
                    </td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                      {itm.labourAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-700 dark:text-amber-300">
                      ₹{itm.totalItemAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Settlement & Totals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 dark:bg-[#141822] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">Invoice Payment Status</h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                UNPAID (CREDIT)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Separate Billing &amp; Payment Workflow: Saving this invoice debits the customer ledger with the full amount (Paid = ₹0, Outstanding = ₹{netTotal.toFixed(2)}). Record customer payments separately via <strong>Vouchers → Receipt (F2)</strong>.
            </p>
          </div>

          <div className="luxury-card-gold p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Gross Item Total:</span>
                <span>₹{grossTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-700 dark:text-amber-300 font-bold">
                <span>Total Fine Silver:</span>
                <span>{totalFineSilver.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST (3%):</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-white/[0.1] pt-2 flex justify-between text-lg font-bold text-amber-700 dark:text-amber-300">
                <span>Net Amount:</span>
                <span>₹{netTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || items.length === 0}
              className="mt-4 w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Confirm & Save Invoice (F9)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full overflow-y-auto">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {content}
      </div>
    </div>
  );
};
