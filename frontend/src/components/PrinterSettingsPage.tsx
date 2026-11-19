import React, { useState } from 'react';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface PrinterSettingsPageProps {
  onBackToDashboard: () => void;
}

export const PrinterSettingsPage: React.FC<PrinterSettingsPageProps> = ({ onBackToDashboard }) => {
  const [receiptPaper, setReceiptPaper] = useState('80mm');
  const [labelPrinter, setLabelPrinter] = useState('TSC_TTP_244');
  const [copies, setCopies] = useState(1);
  const [includeGST, setIncludeGST] = useState(true);
  const [includeTerms, setIncludeTerms] = useState(true);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const handleTestPrint = (type: string) => {
    setPrintStatus(`Sending ${type} to system spooler...`);
    setTimeout(() => setPrintStatus(null), 2500);
  };

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
                POS Receipt &amp; Barcode Tag Printer Setup
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Thermal Invoice Printers, Jewellery Butterfly Tags &amp; Label Printers
              </p>
            </div>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {printStatus && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{printStatus}</span>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Section 1: Tax Invoice Printer */}
          <div className="bg-slate-50 dark:bg-[#141822] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Receipt &amp; Tax Invoice Printer</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Paper Layout / Size</label>
                <select
                  value={receiptPaper}
                  onChange={(e) => setReceiptPaper(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white"
                >
                  <option value="80mm">Thermal 80mm (3-inch POS)</option>
                  <option value="58mm">Thermal 58mm (2-inch Mini POS)</option>
                  <option value="A5">A5 Half Sheet Laser / DeskJet</option>
                  <option value="A4">A4 Full Sheet GST Tax Invoice</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Default Copies</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={copies}
                  onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                  className="w-24 p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGST}
                    onChange={(e) => setIncludeGST(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Print GSTIN &amp; Tax HSN Summary Table</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTerms}
                    onChange={(e) => setIncludeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Print Terms, Return Policy &amp; Jurisdiction</span>
                </label>
              </div>

              <button
                onClick={() => handleTestPrint('Thermal Receipt Test Page')}
                className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:brightness-105 transition shadow-sm mt-3"
              >
                Test Print Receipt
              </button>
            </div>
          </div>

          {/* Section 2: Barcode & RFID Tag Printer */}
          <div className="bg-slate-50 dark:bg-[#141822] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Jewellery Barcode Tag Printer</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Tag Printer Model</label>
                <select
                  value={labelPrinter}
                  onChange={(e) => setLabelPrinter(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white"
                >
                  <option value="TSC_TTP_244">TSC TTP-244 Pro (Standard)</option>
                  <option value="TSC_TE244">TSC TE-244 / TE-200</option>
                  <option value="Zebra_ZD220">Zebra ZD220 / GK420t</option>
                  <option value="Citizen_CLP">Citizen CL-S621</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Tag Media Type</label>
                <select
                  className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white"
                >
                  <option>Butterfly Jewellery Tag (Polyester 84x12mm)</option>
                  <option>Dumbbell Loop Tag (Durable Silver Vinyl)</option>
                  <option>Rat-Tail Jewellery Label</option>
                </select>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p>Prints Barcode, HUID, Tag No, Gross Wt, Net Wt, Purity % and Rudra Silver branding directly onto tags.</p>
              </div>

              <button
                onClick={() => handleTestPrint('Butterfly Jewellery Tag Test')}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-lg hover:brightness-105 transition shadow-sm mt-3"
              >
                Test Print Jewellery Tag
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
