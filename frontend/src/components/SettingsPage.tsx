import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ArrowLeft, Save, Building2, Layers, Plus, Edit2, Trash2, X, Loader2, CheckCircle2, Package } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  fetchStockTypesListApi,
  createStockTypeApi,
  updateStockTypeApi,
  deleteStockTypeApi,
  StockTypeRecord,
  fetchUnitsAll,
  createUnitApi,
  updateUnitApi,
  deleteUnitApi,
  UnitRecord,
} from '../services/api';

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

  // Stock Types state
  const [stockTypes, setStockTypes] = useState<StockTypeRecord[]>([]);
  const [loadingStockTypes, setLoadingStockTypes] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStockType, setEditingStockType] = useState<StockTypeRecord | null>(null);
  const [stockTypeName, setStockTypeName] = useState('');
  const [stockTypeStatus, setStockTypeStatus] = useState<number>(1);
  const [nameError, setNameError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // ---- Unit Management state ----
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [unitCounts, setUnitCounts] = useState({ total: 0, active: 0, inactive: 0 });
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [unitSearch, setUnitSearch] = useState('');

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitRecord | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitStatus, setUnitStatus] = useState<number>(1);
  const [unitNameError, setUnitNameError] = useState<string | null>(null);
  const [unitCodeError, setUnitCodeError] = useState<string | null>(null);
  const [unitModalSubmitting, setUnitModalSubmitting] = useState(false);

  const loadStockTypes = async () => {
    try {
      setLoadingStockTypes(true);
      const data = await fetchStockTypesListApi(true);
      setStockTypes(data);
    } catch (err: any) {
      console.error('Failed to load stock types:', err);
    } finally {
      setLoadingStockTypes(false);
    }
  };

  useEffect(() => {
    loadStockTypes();
  }, []);

  // ---- Unit load / CRUD functions ----
  const loadUnits = async (search?: string) => {
    try {
      setLoadingUnits(true);
      const result = await fetchUnitsAll(search);
      setUnits(result.data);
      setUnitCounts(result.counts);
    } catch (err: any) {
      console.error('Failed to load units:', err);
    } finally {
      setLoadingUnits(false);
    }
  };

  useEffect(() => { loadUnits(); }, []);

  const openAddUnitModal = () => {
    setEditingUnit(null);
    setUnitName('');
    setUnitCode('');
    setUnitStatus(1);
    setUnitNameError(null);
    setUnitCodeError(null);
    setIsUnitModalOpen(true);
  };

  const openEditUnitModal = (unit: UnitRecord) => {
    setEditingUnit(unit);
    setUnitName(unit.name);
    setUnitCode(unit.code);
    setUnitStatus(unit.is_active ? 1 : 0);
    setUnitNameError(null);
    setUnitCodeError(null);
    setIsUnitModalOpen(true);
  };

  const handleUnitModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimName = unitName.trim();
    const trimCode = unitCode.trim().toUpperCase();
    let hasError = false;
    if (!trimName) { setUnitNameError('Unit Name is required.'); hasError = true; }
    if (!trimCode) { setUnitCodeError('Unit Code / Symbol is required.'); hasError = true; }
    if (hasError) return;

    const dupName = units.find(u => u.name.toLowerCase() === trimName.toLowerCase() && (!editingUnit || u.id !== editingUnit.id));
    if (dupName) { setUnitNameError(`Unit '${trimName}' already exists.`); return; }
    const dupCode = units.find(u => u.code.toLowerCase() === trimCode.toLowerCase() && (!editingUnit || u.id !== editingUnit.id));
    if (dupCode) { setUnitCodeError(`Unit Code '${trimCode}' already exists.`); return; }

    setUnitModalSubmitting(true);
    setUnitNameError(null);
    setUnitCodeError(null);
    try {
      if (editingUnit) {
        await updateUnitApi(editingUnit.id, { name: trimName, code: trimCode, is_active: unitStatus });
        Swal.fire({ icon: 'success', title: 'Updated!', text: `Unit '${trimName}' updated successfully.`, timer: 1800, showConfirmButton: false });
      } else {
        await createUnitApi({ name: trimName, code: trimCode, is_active: unitStatus });
        Swal.fire({ icon: 'success', title: 'Added!', text: `Unit '${trimName}' added successfully.`, timer: 1800, showConfirmButton: false });
      }
      setIsUnitModalOpen(false);
      loadUnits(unitSearch || undefined);
    } catch (err: any) {
      const msg: string = err.message || 'Operation failed.';
      if (msg.toLowerCase().includes('code')) setUnitCodeError(msg);
      else setUnitNameError(msg);
    } finally {
      setUnitModalSubmitting(false);
    }
  };

  const handleUnitDelete = async (unit: UnitRecord) => {
    const result = await Swal.fire({
      title: 'Delete Unit?',
      text: `Are you sure you want to delete '${unit.name}' (${unit.code})? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await deleteUnitApi(unit.id);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `Unit '${unit.name}' has been deleted.`,
          timer: 1800,
          showConfirmButton: false,
        });
        loadUnits(unitSearch || undefined);
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Cannot Delete',
          text: err.message || 'Failed to delete unit. It may be used in Stock or Metal Stock records.',
        });
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const openAddModal = () => {
    setEditingStockType(null);
    setStockTypeName('');
    setStockTypeStatus(1);
    setNameError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: StockTypeRecord) => {
    setEditingStockType(item);
    setStockTypeName(item.name);
    setStockTypeStatus(item.is_active ? 1 : 0);
    setNameError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = stockTypeName.trim();
    if (!trimmed) {
      setNameError('Stock Type Name is required.');
      return;
    }

    // Check duplicate locally
    const duplicate = stockTypes.find(
      (st) => st.name.toLowerCase() === trimmed.toLowerCase() && (!editingStockType || st.id !== editingStockType.id)
    );
    if (duplicate) {
      setNameError(`Stock Type '${trimmed}' already exists.`);
      return;
    }

    setModalSubmitting(true);
    setNameError(null);
    try {
      if (editingStockType) {
        await updateStockTypeApi(editingStockType.id, {
          name: trimmed,
          is_active: stockTypeStatus,
        });
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: `Stock Type '${trimmed}' updated successfully.`,
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        await createStockTypeApi({
          name: trimmed,
          is_active: stockTypeStatus,
        });
        Swal.fire({
          icon: 'success',
          title: 'Added!',
          text: `Stock Type '${trimmed}' added successfully.`,
          timer: 1800,
          showConfirmButton: false,
        });
      }
      setIsModalOpen(false);
      loadStockTypes();
    } catch (err: any) {
      setNameError(err.message || 'Operation failed. Please try again.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async (item: StockTypeRecord) => {
    const result = await Swal.fire({
      title: 'Delete Stock Type?',
      text: `Are you sure you want to delete '${item.name}'? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await deleteStockTypeApi(item.id);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `Stock Type '${item.name}' has been deleted.`,
          timer: 1800,
          showConfirmButton: false,
        });
        loadStockTypes();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Cannot Delete',
          text: err.message || 'Failed to delete stock type. It may be used in Metal Stock records.',
        });
      }
    }
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
                Firm Details, GSTIN Credentials, Stock Types &amp; POS Preferences
              </p>
            </div>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5 cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {isSaved && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings successfully saved and updated across all POS terminals!</span>
          </div>
        )}

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Firm Details */}
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
              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:brightness-105 transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>

            {/* Column 2: POS Preferences & Stock Type Management */}
            <div className="space-y-6">
              {/* POS Billing Preferences */}
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
              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:brightness-105 transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
              {/* REPLACED SECTION: Stock Type Management */}
              <div className="bg-slate-50 dark:bg-[#141822] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
                    <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h4>Stock Type Management</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                        Manage jewellery stock types used in Metal Stock records.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stock Type</span>
                  </button>
                </div>

                {/* Stock Types Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0b0e14]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#181d28] text-slate-600 dark:text-slate-300 font-medium">
                        <th className="py-2.5 px-3">Stock Type</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {loadingStockTypes ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                            Loading stock types...
                          </td>
                        </tr>
                      ) : stockTypes.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400">
                            No stock types found. Click "+ Add Stock Type" to create one.
                          </td>
                        </tr>
                      ) : (
                        stockTypes.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {st.name}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.is_active
                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                                  }`}
                              >
                                {st.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => openEditModal(st)}
                                className="p-1 rounded-md text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                                title="Edit Stock Type"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(st)}
                                className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                                title="Delete Stock Type"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Management — matching Stock Type Management design */}
          <div className="bg-slate-50 dark:bg-[#141822] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
                <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <div>
                  <h4>Unit Management</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Manage measurement units used in Metal Stock &amp; Stock records.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openAddUnitModal}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            {/* Units Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0b0e14]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#181d28] text-slate-600 dark:text-slate-300 font-medium">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Unit Name</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {loadingUnits ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                        Loading units...
                      </td>
                    </tr>
                  ) : units.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No units found. Click "+ Add Unit" to create one.
                      </td>
                    </tr>
                  ) : (
                    units.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                        <td className="py-2.5 px-3 font-mono font-semibold text-amber-700 dark:text-amber-400">
                          {u.code}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {u.name}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.is_active
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                              }`}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditUnitModal(u)}
                            className="p-1 rounded-md text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                            title="Edit Unit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnitDelete(u)}
                            className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                            title="Delete Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </form>
      </div>

      {/* Add / Edit Stock Type Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151e] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>{editingStockType ? 'Edit Stock Type' : 'Add Stock Type'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4 text-xs" noValidate>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Stock Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={stockTypeName}
                  onChange={(e) => {
                    setStockTypeName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="e.g. Finished, Raw, Scrap"
                  autoFocus
                  className={`w-full p-2.5 bg-slate-50 dark:bg-[#181d28] border rounded-xl text-slate-900 dark:text-white transition focus:outline-none ${nameError
                    ? 'border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-300 dark:border-white/[0.1] focus:border-amber-500'
                    }`}
                />
                {nameError && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                    • {nameError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Status
                </label>
                <select
                  value={stockTypeStatus}
                  onChange={(e) => setStockTypeStatus(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-[#181d28] border border-slate-300 dark:border-white/[0.1] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>Active (Available in Metal Stock dropdown)</option>
                  <option value={0}>Inactive (Hidden from new entries)</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Unit Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151e] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <span>{editingUnit ? 'Edit Unit' : 'Add Unit'}</span>
              </h3>
              <button type="button" onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUnitModalSubmit} className="p-5 space-y-4 text-xs" noValidate>
              {/* Unit Code */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Unit Code / Symbol <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={unitCode}
                  onChange={(e) => { setUnitCode(e.target.value.toUpperCase()); if (unitCodeError) setUnitCodeError(null); }}
                  placeholder="e.g. GMS, PCS, KG, CT"
                  maxLength={20}
                  autoFocus
                  className={`w-full p-2.5 bg-slate-50 dark:bg-[#181d28] border rounded-xl text-slate-900 dark:text-white font-mono uppercase transition focus:outline-none ${unitCodeError
                    ? 'border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-300 dark:border-white/[0.1] focus:border-amber-500'
                    }`}
                />
                {unitCodeError && <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">• {unitCodeError}</p>}
              </div>

              {/* Unit Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Unit Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => { setUnitName(e.target.value); if (unitNameError) setUnitNameError(null); }}
                  placeholder="e.g. Grams, Pieces, Kilograms, Carats"
                  maxLength={50}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-[#181d28] border rounded-xl text-slate-900 dark:text-white transition focus:outline-none ${unitNameError
                    ? 'border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-300 dark:border-white/[0.1] focus:border-amber-500'
                    }`}
                />
                {unitNameError && <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">• {unitNameError}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status</label>
                <select
                  value={unitStatus}
                  onChange={(e) => setUnitStatus(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-[#181d28] border border-slate-300 dark:border-white/[0.1] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>Active (Available in unit dropdowns)</option>
                  <option value={0}>Inactive (Hidden from new entries)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  disabled={unitModalSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unitModalSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  {unitModalSubmitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
