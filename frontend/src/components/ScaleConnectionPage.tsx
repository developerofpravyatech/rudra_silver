import React, { useState } from 'react';
import { Wifi, Scale, RefreshCw, CheckCircle2, ArrowLeft, PlayCircle, Settings } from 'lucide-react';

interface ScaleConnectionPageProps {
  liveWeight: number;
  isScaleConnected: boolean;
  onConnectScale: () => void;
  onBackToDashboard: () => void;
}

export const ScaleConnectionPage: React.FC<ScaleConnectionPageProps> = ({
  liveWeight,
  isScaleConnected,
  onConnectScale,
  onBackToDashboard,
}) => {
  const [port, setPort] = useState('COM1');
  const [baudRate, setBaudRate] = useState('9600');
  const [parity, setParity] = useState('None');
  const [dataBits, setDataBits] = useState('8');
  const [stopBits, setStopBits] = useState('1');
  const [testLog, setTestLog] = useState<string[]>([
    'Serial scale interface initialized',
    'Listening for RS-232 / USB ASCII weight stream',
  ]);

  const handleTestPing = () => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog((prev) => [
      `[${timestamp}] Polling ${port} at ${baudRate} baud: ${isScaleConnected ? `${liveWeight.toFixed(2)}g STABLE` : 'SIMULATION READY'}`,
      ...prev.slice(0, 5),
    ]);
  };

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
                Digital Weighing Scale Hardware Configuration
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Direct RS-232 COM Port &amp; Web Serial API Hardware Driver
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

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Scale Visualizer */}
            <div className="luxury-card-gold rounded-2xl p-6 flex flex-col justify-between items-center text-center">
              <div className="flex items-center justify-between w-full text-xs font-mono">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isScaleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {isScaleConnected ? 'HARDWARE ONLINE' : 'READY TO PAIR'}
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Baud: {baudRate}</span>
              </div>

              <div className="my-6">
                <div className="font-mono text-6xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  {liveWeight.toFixed(3)}
                </div>
                <div className="text-base font-mono text-amber-700 dark:text-amber-400 font-bold mt-1">
                  Grams (Precision 0.001g)
                </div>
              </div>

              <div className="flex space-x-3 w-full">
                <button
                  onClick={onConnectScale}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-105 transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isScaleConnected ? 'Disconnect / Reconnect' : 'Pair Web Serial Device'}</span>
                </button>
                <button
                  onClick={handleTestPing}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#141822] border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 font-medium text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1"
                >
                  <PlayCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Poll</span>
                </button>
              </div>
            </div>

            {/* Serial Parameters Form */}
            <div className="bg-slate-50 dark:bg-[#141822] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Serial COM Settings</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">COM Port</label>
                  <select
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white"
                  >
                    <option value="COM1">COM1 (Standard Serial)</option>
                    <option value="COM2">COM2 (USB-to-RS232)</option>
                    <option value="COM3">COM3 (FTDI Chipset)</option>
                    <option value="COM4">COM4 (Silicon Labs CP210x)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Baud Rate (bps)</label>
                  <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-mono"
                  >
                    <option value="9600">9600 (Recommended)</option>
                    <option value="4800">4800 (Essae-Teraoka)</option>
                    <option value="2400">2400 (Sartorius / Wensar)</option>
                    <option value="19200">19200 (High Speed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Parity</label>
                  <select
                    value={parity}
                    onChange={(e) => setParity(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white"
                  >
                    <option value="None">None</option>
                    <option value="Even">Even</option>
                    <option value="Odd">Odd</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Data / Stop Bits</label>
                  <div className="flex gap-2">
                    <select
                      value={dataBits}
                      onChange={(e) => setDataBits(e.target.value)}
                      className="w-1/2 p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-mono"
                    >
                      <option value="8">8</option>
                      <option value="7">7</option>
                    </select>
                    <select
                      value={stopBits}
                      onChange={(e) => setStopBits(e.target.value)}
                      className="w-1/2 p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-mono"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Protocol info */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p>Compatible with: Essae, Phoenix, Contech, Wensar, Sartorius, Ohaus, Avery scales.</p>
                <p>Web Serial API requires Chromium browser (Google Chrome, Edge, Brave).</p>
              </div>
            </div>
          </div>

          {/* Test log console */}
          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-1 border border-slate-800">
            <div className="text-slate-400 font-bold border-b border-slate-800 pb-1">Scale Hardware Communications Log:</div>
            {testLog.map((line, idx) => (
              <div key={idx}>&gt; {line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
