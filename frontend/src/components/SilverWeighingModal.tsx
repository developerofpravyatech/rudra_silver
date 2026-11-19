import React, { useState } from 'react';
import { Scale, ArrowRight, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';
import { DailyRates } from '../types';

interface SilverWeighingModalProps {
  liveWeight: number;
  isScaleConnected: boolean;
  onConnectScale: () => void;
  rates: DailyRates | null;
  onSendToBilling: (weight: number, description: string, touch: number) => void;
  onClose: () => void;
  isInline?: boolean;
}

export const SilverWeighingModal: React.FC<SilverWeighingModalProps> = ({
  liveWeight,
  isScaleConnected,
  onConnectScale,
  rates,
  onSendToBilling,
  onClose,
  isInline = true,
}) => {
  const [manualWeight, setManualWeight] = useState<number>(liveWeight > 0 ? liveWeight : 124.500);
  const [selectedPurity, setSelectedPurity] = useState<number>(92.5);
  const [itemName, setItemName] = useState<string>('Silver Fancy Payal');
  const [lessWeight, setLessWeight] = useState<number>(0.0);

  const displayWeight = isScaleConnected ? liveWeight : manualWeight;
  const netWeight = Math.max(0, displayWeight - lessWeight);
  const silverRatePerGram = rates?.silver_925_rate
    ? rates.silver_925_rate / 1000
    : 150.0;

  // Valuation
  const fineSilverWeight = (netWeight * selectedPurity) / 100;
  const estimatedMetalValue = Math.round(fineSilverWeight * silverRatePerGram);

  const content = (
    <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 w-full">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
              Precision Silver Weighing Station
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Connected via RS-232 / USB COM Web Serial API
            </p>
          </div>
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

      {/* Content */}
      <div className="p-6 space-y-5 text-xs overflow-y-auto">
        {/* Digital Scale LED Display */}
        <div className="luxury-card-gold rounded-2xl p-6 text-center relative overflow-hidden flex flex-col items-center justify-center">
          <div className="flex items-center justify-between w-full text-slate-600 dark:text-slate-400 text-[11px] mb-2 px-2">
            <span className="flex items-center gap-1.5 font-mono font-medium">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isScaleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isScaleConnected ? 'COM PORT CONNECTED • STABLE' : 'SIMULATION MODE (MANUAL)'}
            </span>
            <button
              onClick={onConnectScale}
              className="text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              {isScaleConnected ? 'Reconnect Scale' : 'Connect Real Scale'}
            </button>
          </div>

          {/* Glowing Big Digital Numbers */}
          <div className="py-2">
            <span className="font-mono text-6xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-[0_0_25px_rgba(212,175,55,0.45)]">
              {displayWeight.toFixed(3)}
            </span>
            <span className="text-2xl font-mono text-amber-600 dark:text-amber-400 ml-2 font-bold">g</span>
          </div>

          <div className="flex items-center space-x-3 mt-3">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Reading Stabilized
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 font-mono text-[10px]">
              Tare: 0.000g
            </span>
          </div>
        </div>

        {/* Interactive Weight & Parameter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Manual Adjustment & Purity */}
          <div className="bg-slate-50 dark:bg-[#141822] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-3">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Ornament Parameters</span>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Item Description</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            {!isScaleConnected && (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                  Manual Gross Weight (g)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={manualWeight}
                  onChange={(e) => setManualWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-right font-mono text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Less Weight (g)</label>
                <input
                  type="number"
                  step="0.001"
                  value={lessWeight}
                  onChange={(e) => setLessWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-right font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Net Weight (g)</label>
                <div className="w-full px-3 py-1.5 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded-lg text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {netWeight.toFixed(3)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Purity Hallmark Stamp</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '92.5%', value: 92.5 },
                  { label: '80.0%', value: 80.0 },
                  { label: '70.0%', value: 70.0 },
                  { label: '99.9%', value: 99.9 },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setSelectedPurity(p.value)}
                    className={`py-1.5 rounded-lg font-mono text-[11px] font-bold border transition ${
                      selectedPurity === p.value
                        ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-500/20 dark:border-amber-400 dark:text-amber-300'
                        : 'bg-white dark:bg-[#0b0e14] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Valuation Breakdown */}
          <div className="bg-slate-50 dark:bg-[#141822] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between space-y-3">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Live Valuation Summary</span>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Gross Weight:</span>
                <span>{displayWeight.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Less (Stones/Wax):</span>
                <span>-{lessWeight.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold border-t border-slate-200 dark:border-white/[0.06] pt-1">
                <span>Net Weight:</span>
                <span>{netWeight.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-amber-700 dark:text-amber-300 font-bold">
                <span>Fine Silver ({selectedPurity}%):</span>
                <span>{fineSilverWeight.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Current Bhav Rate:</span>
                <span>₹{silverRatePerGram}/g</span>
              </div>
              <div className="border-t border-slate-200 dark:border-white/[0.1] pt-2 flex justify-between text-base font-bold text-amber-700 dark:text-amber-400">
                <span>Est. Metal Value:</span>
                <span>₹{estimatedMetalValue.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  onSendToBilling(displayWeight, itemName, selectedPurity);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center space-x-2"
              >
                <span>Transfer to New Invoice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl overflow-hidden flex flex-col">
        {content}
      </div>
    </div>
  );
};
