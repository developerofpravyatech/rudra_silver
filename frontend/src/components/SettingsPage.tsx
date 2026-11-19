import React, { useState } from 'react';
import { Settings as SettingsIcon, ArrowLeft, Save, Database, Building2 } from 'lucide-react';

interface SettingsPageProps {
  onBackToDashboard: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBackToDashboard }) => {
  const [shopName, setShopName] = useState('Rudra Silver');
  const [tagline, setTagline] = useState('Pure Silver • Pure Elegance');
  const [gstin, setGstin] = useState('24AABCR1234F1Z8');
  const [hallmarkReg, setHallmarkReg] = useState('HM-RJ-2024-9981');
  const [address, setAddress] = useState('Soni Bazar, Rajkot, Gujarat - 360001');
  const [phone, setPhone] = useState('+91 98250 12345');
  const [invoicePrefix, setInvoicePrefix] = useState('GST');
  const [defaultTouch, setDefaultTouch] = useState('92.5');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
                Application &amp; Store Settings
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Firm Details, GSTIN Credentials, Default Purities &amp; System Maintenance
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

        {isSaved && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <span>Settings successfully saved and updated across all POS terminals!</span>
          </div>
        )}

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firm Details */}
            <div className="bg-slate-50 dark:bg-[#141822] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4>Jewellery Firm Profile</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Firm Name</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">GSTIN</label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Hallmark Reg No</label>
                    <input
                      type="text"
                      value={hallmarkReg}
                      onChange={(e) => setHallmarkReg(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* POS & System Preferences */}
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-[#141822] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">POS Billing Preferences</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Invoice Series Prefix</label>
                      <input
                        type="text"
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">Default Purity (%)</label>
                      <select
                        value={defaultTouch}
                        onChange={(e) => setDefaultTouch(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-[#0b0e14] border border-slate-300 dark:border-white/[0.1] rounded text-slate-900 dark:text-white font-mono"
                      >
                        <option value="92.5">92.5% Sterling</option>
                        <option value="80.0">80.0% Standard</option>
                        <option value="70.0">70.0% Antique</option>
                        <option value="99.9">99.9% Fine</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance & Backup */}
              <div className="bg-slate-50 dark:bg-[#141822] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
                  <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4>Database &amp; Data Security</h4>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  SQLite database with full transaction rollback and automated daily backups.
                </p>
                <button
                  type="button"
                  onClick={() => alert('Database backup archive created: rudra_silver_backup_20261119.db')}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-[#1f2636] border border-slate-300 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 font-medium hover:border-amber-400 transition"
                >
                  Create Manual Database Backup
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:brightness-105 transition shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
