import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarClock,
  Printer,
  FileText,
  FileSpreadsheet,
  Filter,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from 'lucide-react';
import {
  AccountGroupItem,
  AgeWiseFilterOptions,
  AgeWiseFilterParams,
  AgeWisePartyRow,
  AgeWiseTotals,
  AgeWiseBucketLabels,
} from '../../types';
import {
  fetchAgeWiseFilterOptions,
  fetchAgeWiseReport,
  fetchAgeWiseExport,
} from '../../services/api';
import { showErrorAlert } from '../../utils/alert';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';

export interface AgeWiseReportState {
  asOnDate: string;
  city: string;
  location: string;
  refBy: string;
  interval: number;
  balanceType: 'gold' | 'silver';
  search: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AgeWiseReportPageProps {
  selectedGroups: AccountGroupItem[];
  state: AgeWiseReportState;
  onChangeState: (next: AgeWiseReportState) => void;
  onChangeGroups: () => void;
  onOpenLedger: (partyKey: string) => void;
}

const emptyBuckets = { current: 0, bucket_1: 0, bucket_2: 0, bucket_3: 0, old: 0, total: 0 };

export const AgeWiseReportPage: React.FC<AgeWiseReportPageProps> = ({
  selectedGroups,
  state,
  onChangeState,
  onChangeGroups,
  onOpenLedger,
}) => {
  // Draft inputs synced with state
  useEffect(() => {
    document.title = 'Age-wise-list | Rudra Silver';
  }, []);
  const [draftAsOn, setDraftAsOn] = useState<string>(state.asOnDate);
  const [draftCity, setDraftCity] = useState<string>(state.city);
  const [draftLocation, setDraftLocation] = useState<string>(state.location);
  const [draftRefBy, setDraftRefBy] = useState<string>(state.refBy);
  const [draftInterval, setDraftInterval] = useState<string>(String(state.interval));
  const [draftBalanceType, setDraftBalanceType] = useState<'gold' | 'silver'>(state.balanceType);
  const [draftSearch, setDraftSearch] = useState<string>(state.search);
  const [validationError, setValidationError] = useState<string>('');

  // Server data
  const [filterOptions, setFilterOptions] = useState<AgeWiseFilterOptions>({
    cities: [],
    locations: [],
    ref_by_list: [],
    groups: [],
  });
  const [items, setItems] = useState<AgeWisePartyRow[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [bucketLabels, setBucketLabels] = useState<AgeWiseBucketLabels>({
    current: 'Current Balance',
    bucket_1: `${state.interval} Days`,
    bucket_2: `${state.interval}–${state.interval * 2} Days`,
    bucket_3: `${state.interval * 2}–${state.interval * 3} Days`,
    old: `Old Balance (>${state.interval * 3}d)`,
  });
  const [totals, setTotals] = useState<AgeWiseTotals>({
    cash: { ...emptyBuckets },
    gold: { ...emptyBuckets },
    silver: { ...emptyBuckets },
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    fetchAgeWiseFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Failed to load Age Wise filter options:', err));
  }, []);

  const buildParams = useCallback(
    (includePagination: boolean = true): AgeWiseFilterParams => {
      const params: AgeWiseFilterParams = {
        as_on_date: state.asOnDate,
        group_ids: selectedGroups.map((g) => g.id),
        city: state.city !== 'all' ? state.city : undefined,
        location: state.location !== 'all' ? state.location : undefined,
        ref_by: state.refBy !== 'all' ? state.refBy : undefined,
        interval: state.interval,
        balance_type: state.balanceType,
        search: state.search.trim() || undefined,
        sort_by: state.sortBy,
        sort_order: state.sortOrder,
      };
      if (includePagination) {
        params.page = state.page;
        params.limit = state.limit;
      }
      return params;
    },
    [state, selectedGroups]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAgeWiseReport(buildParams(true));
      setItems(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
      if (res.bucket_labels) setBucketLabels(res.bucket_labels);
      if (res.totals) setTotals(res.totals);
    } catch (err: any) {
      console.error('Failed to load Age Wise report:', err);
      showErrorAlert(err.message || 'Failed to load Age Wise Report.');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError('');

    if (!draftAsOn) {
      setValidationError('Please select a valid As On Date.');
      return;
    }
    const parsedInterval = parseInt(draftInterval, 10);
    if (isNaN(parsedInterval) || parsedInterval <= 0) {
      setValidationError('Interval must be a positive number of days.');
      return;
    }

    onChangeState({
      ...state,
      asOnDate: draftAsOn,
      city: draftCity,
      location: draftLocation,
      refBy: draftRefBy,
      interval: parsedInterval,
      balanceType: draftBalanceType,
      search: draftSearch,
      page: 1,
    });
  };

  const handleResetFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setValidationError('');
    setDraftAsOn(today);
    setDraftCity('all');
    setDraftLocation('all');
    setDraftRefBy('all');
    setDraftInterval('15');
    setDraftBalanceType('gold');
    setDraftSearch('');
    onChangeState({
      ...state,
      asOnDate: today,
      city: 'all',
      location: 'all',
      refBy: 'all',
      interval: 15,
      balanceType: 'gold',
      search: '',
      page: 1,
      sortBy: 'account_name',
      sortOrder: 'asc',
    });
  };

  const handleSort = (col: string) => {
    const nextOrder = state.sortBy === col && state.sortOrder === 'asc' ? 'desc' : 'asc';
    onChangeState({ ...state, sortBy: col, sortOrder: nextOrder, page: 1 });
  };

  const renderSortIcon = (col: string) => {
    if (state.sortBy !== col) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 inline-block ml-1" />;
    }
    return state.sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline-block ml-1" />
    );
  };

  const fmtCurr = (num?: number) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtWt = (num?: number) =>
    (num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });

  const metalLabel = state.balanceType === 'silver' ? 'Silver Balance (g)' : 'Gold Balance (g)';

  // Print & Export Helpers
  const buildPdfOptions = async (): Promise<ReportPdfOptions> => {
    const exp = await fetchAgeWiseExport(buildParams(false));
    const bType = exp.balance_type || state.balanceType;
    const labels = exp.bucket_labels || bucketLabels;
    const metalTitle = bType === 'silver' ? 'Silver' : 'Gold';

    return {
      title: `Age Wise List (${metalTitle} & Cash Ageing Analysis)`,
      filename: `Age_Wise_Report_${state.asOnDate}.pdf`,
      orientation: 'landscape',
      filters: [
        { label: 'As On', value: state.asOnDate },
        { label: 'Groups', value: selectedGroups.map((g) => g.name).join(', ') || 'All' },
        { label: 'City', value: state.city !== 'all' ? state.city : '' },
        { label: 'Location', value: state.location !== 'all' ? state.location : '' },
        { label: 'Ref By', value: state.refBy !== 'all' ? state.refBy : '' },
        { label: 'Interval', value: `${state.interval} Days` },
        { label: 'Balance Type', value: bType === 'silver' ? 'Silver/Amount' : 'Gold/Amount' },
      ],
      columns: [
        { header: 'Particulars', dataKey: 'account_name', align: 'left' },
        { header: 'City', dataKey: 'city', align: 'left' },
        { header: `Cash ${labels.current}`, dataKey: 'c_cur', align: 'right' },
        { header: `Cash ${labels.bucket_1}`, dataKey: 'c_b1', align: 'right' },
        { header: `Cash ${labels.bucket_2}`, dataKey: 'c_b2', align: 'right' },
        { header: `Cash ${labels.bucket_3}`, dataKey: 'c_b3', align: 'right' },
        { header: 'Cash Old', dataKey: 'c_old', align: 'right' },
        { header: `${metalTitle} ${labels.current}`, dataKey: 'm_cur', align: 'right' },
        { header: `${metalTitle} ${labels.bucket_1}`, dataKey: 'm_b1', align: 'right' },
        { header: `${metalTitle} ${labels.bucket_2}`, dataKey: 'm_b2', align: 'right' },
        { header: `${metalTitle} ${labels.bucket_3}`, dataKey: 'm_b3', align: 'right' },
        { header: `${metalTitle} Old`, dataKey: 'm_old', align: 'right' },
      ],
      data: exp.items.map((r) => ({
        account_name: r.account_name,
        city: r.city,
        c_cur: fmtCurr(r.cash.current),
        c_b1: fmtCurr(r.cash.bucket_1),
        c_b2: fmtCurr(r.cash.bucket_2),
        c_b3: fmtCurr(r.cash.bucket_3),
        c_old: fmtCurr(r.cash.old),
        m_cur: fmtWt(r[bType].current),
        m_b1: fmtWt(r[bType].bucket_1),
        m_b2: fmtWt(r[bType].bucket_2),
        m_b3: fmtWt(r[bType].bucket_3),
        m_old: fmtWt(r[bType].old),
      })),
      totals: {
        account_name: 'Grand Total',
        city: `${exp.total} Accounts`,
        c_cur: fmtCurr(exp.totals.cash.current),
        c_b1: fmtCurr(exp.totals.cash.bucket_1),
        c_b2: fmtCurr(exp.totals.cash.bucket_2),
        c_b3: fmtCurr(exp.totals.cash.bucket_3),
        c_old: fmtCurr(exp.totals.cash.old),
        m_cur: fmtWt(exp.totals[bType].current),
        m_b1: fmtWt(exp.totals[bType].bucket_1),
        m_b2: fmtWt(exp.totals[bType].bucket_2),
        m_b3: fmtWt(exp.totals[bType].bucket_3),
        m_old: fmtWt(exp.totals[bType].old),
      },
    };
  };

  const handlePrint = async () => {
    try {
      setExporting(true);
      await printReport(await buildPdfOptions());
    } catch (err: any) {
      showErrorAlert(err.message || 'Print failed.');
    } finally {
      setExporting(false);
    }
  };

  const handlePdf = async () => {
    try {
      setExporting(true);
      await downloadReportPdf(await buildPdfOptions());
    } catch (err: any) {
      showErrorAlert(err.message || 'PDF export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleCsvExport = async () => {
    try {
      setExporting(true);
      const exp = await fetchAgeWiseExport(buildParams(false));
      const bType = exp.balance_type || state.balanceType;
      const labels = exp.bucket_labels || bucketLabels;
      const metalTitle = bType === 'silver' ? 'Silver' : 'Gold';

      const headers = [
        'Account Name',
        'City',
        'Group',
        `Cash ${labels.current}`,
        `Cash ${labels.bucket_1}`,
        `Cash ${labels.bucket_2}`,
        `Cash ${labels.bucket_3}`,
        `Cash ${labels.old}`,
        'Cash Total',
        `${metalTitle} ${labels.current}`,
        `${metalTitle} ${labels.bucket_1}`,
        `${metalTitle} ${labels.bucket_2}`,
        `${metalTitle} ${labels.bucket_3}`,
        `${metalTitle} ${labels.old}`,
        `${metalTitle} Total`,
      ];

      const rows = exp.items.map((r) =>
        [
          `"${(r.account_name || '').replace(/"/g, '""')}"`,
          `"${(r.city || '').replace(/"/g, '""')}"`,
          `"${(r.group_name || '').replace(/"/g, '""')}"`,
          r.cash.current,
          r.cash.bucket_1,
          r.cash.bucket_2,
          r.cash.bucket_3,
          r.cash.old,
          r.cash.total,
          r[bType].current,
          r[bType].bucket_1,
          r[bType].bucket_2,
          r[bType].bucket_3,
          r[bType].old,
          r[bType].total,
        ].join(',')
      );

      const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Age_Wise_Report_${state.asOnDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showErrorAlert(err.message || 'CSV export failed.');
    } finally {
      setExporting(false);
    }
  };

  // Page numbers array
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, state.page - 3),
    Math.min(totalPages, state.page + 2)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 space-y-4">
      <div className="max-w-[1920px] mx-auto space-y-4">
        {/* TOP HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Age Wise List (Ageing Analysis)
              </h1>
              <p className="text-xs text-slate-500">
                FIFO Outstanding Ageing as on <strong className="text-slate-700">{state.asOnDate}</strong> · Interval: <strong className="text-slate-700">{state.interval} Days</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onChangeGroups}
              className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Groups ({selectedGroups.length})</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handlePdf}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleCsvExport}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* SELECTED GROUPS CHIPS */}
        {selectedGroups.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
              Selected Groups:
            </span>
            {selectedGroups.map((g) => (
              <span
                key={g.id}
                className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}

        {/* FILTER PANEL */}
        <form
          onSubmit={handleApplyFilter}
          className="bg-slate-100/80 rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                As On Date
              </label>
              <input
                type="date"
                value={draftAsOn}
                onChange={(e) => setDraftAsOn(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                City
              </label>
              <select
                value={draftCity}
                onChange={(e) => setDraftCity(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs focus:border-blue-600 outline-hidden"
              >
                <option value="all">All Cities</option>
                {filterOptions.cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Location
              </label>
              <select
                value={draftLocation}
                onChange={(e) => setDraftLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs focus:border-blue-600 outline-hidden"
              >
                <option value="all">All Locations</option>
                {filterOptions.locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Ref By
              </label>
              <select
                value={draftRefBy}
                onChange={(e) => setDraftRefBy(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs focus:border-blue-600 outline-hidden"
              >
                <option value="all">All References</option>
                {filterOptions.ref_by_list.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Interval (Days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={draftInterval}
                onChange={(e) => setDraftInterval(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Balance Type
              </label>
              <select
                value={draftBalanceType}
                onChange={(e) => setDraftBalanceType(e.target.value as 'gold' | 'silver')}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:border-blue-600 outline-hidden"
              >
                <option value="gold">Gold / Amount</option>
                <option value="silver">Silver / Amount</option>
              </select>
            </div>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Search + Apply / Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                placeholder="Search by Account Name or City..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs focus:border-blue-600 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply Filter</span>
              </button>
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>
        </form>

        {/* AGEING REPORT TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <strong className="text-slate-900">{items.length}</strong> of{' '}
              <strong className="text-slate-900">{totalRecords}</strong> accounts (click an Account Name to open Ledger)
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-medium">Rows per page:</label>
              <select
                value={state.limit}
                onChange={(e) =>
                  onChangeState({ ...state, limit: Number(e.target.value), page: 1 })
                }
                className="px-2 py-1 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-600"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Computing FIFO ageing balances...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No matching accounts or balances found for the selected filters.
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-20 shadow-2xs">
                  {/* Grouped Top Header Row */}
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    <th
                      colSpan={2}
                      className="px-3 py-2 border-r border-slate-300 text-center bg-slate-100"
                    >
                      Particulars
                    </th>
                    <th
                      colSpan={5}
                      className="px-3 py-2 border-r border-slate-300 text-center bg-blue-50 text-blue-900"
                    >
                      Cash Balance (₹)
                    </th>
                    <th
                      colSpan={5}
                      className={`px-3 py-2 text-center ${state.balanceType === 'silver'
                        ? 'bg-slate-200/80 text-slate-900'
                        : 'bg-amber-50 text-amber-900'
                        }`}
                    >
                      {metalLabel}
                    </th>
                  </tr>
                  {/* Sub-Headers Row */}
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <th
                      onClick={() => handleSort('account_name')}
                      className="px-3 py-2.5 cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    >
                      Account Name {renderSortIcon('account_name')}
                    </th>
                    <th
                      onClick={() => handleSort('city')}
                      className="px-3 py-2.5 border-r border-slate-200 cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    >
                      City {renderSortIcon('city')}
                    </th>

                    {/* Cash Sub-headers */}
                    <th
                      onClick={() => handleSort('cash_current')}
                      className="px-3 py-2.5 text-right cursor-pointer hover:bg-blue-50/60 whitespace-nowrap"
                    >
                      {bucketLabels.current} {renderSortIcon('cash_current')}
                    </th>
                    <th
                      onClick={() => handleSort('cash_bucket_1')}
                      className="px-3 py-2.5 text-right cursor-pointer hover:bg-blue-50/60 whitespace-nowrap"
                    >
                      {bucketLabels.bucket_1} {renderSortIcon('cash_bucket_1')}
                    </th>
                    <th
                      onClick={() => handleSort('cash_bucket_2')}
                      className="px-3 py-2.5 text-right cursor-pointer hover:bg-blue-50/60 whitespace-nowrap"
                    >
                      {bucketLabels.bucket_2} {renderSortIcon('cash_bucket_2')}
                    </th>
                    <th
                      onClick={() => handleSort('cash_bucket_3')}
                      className="px-3 py-2.5 text-right cursor-pointer hover:bg-blue-50/60 whitespace-nowrap"
                    >
                      {bucketLabels.bucket_3} {renderSortIcon('cash_bucket_3')}
                    </th>
                    <th
                      onClick={() => handleSort('cash_old')}
                      className="px-3 py-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-blue-50/60 whitespace-nowrap"
                    >
                      Old Balance {renderSortIcon('cash_old')}
                    </th>

                    {/* Metal Sub-headers */}
                    <th
                      onClick={() => handleSort('metal_current')}
                      className="px-3 py-2.5 text-right cursor-pointer hover:bg-amber-50/60 whitespace-nowrap"
                    >
                      {bucketLabels.current} {renderSortIcon('metal_current')}
                    </th>
                    <th
                      onClick={() => handleSort('metal_bucket_1')}
                      className="px-3 py-2.5 text-right cursor-pointer hover:bg-amber-50/60 whitespace-nowrap"
                    >
                      {bucketLabels.bucket_1} {renderSortIcon('metal_bucket_1')}
                    </th>
                    <th
                      onClick={() => handleSort('metal_bucket_2')}
                      className="px-3 py-2.5 text-right cursor-pointer hover:bg-amber-50/60 whitespace-nowrap"
                    >
                      {bucketLabels.bucket_2} {renderSortIcon('metal_bucket_2')}
                    </th>
                    <th
                      onClick={() => handleSort('metal_bucket_3')}
                      className="px-3 py-2.5 text-right cursor-pointer hover:bg-amber-50/60 whitespace-nowrap"
                    >
                      {bucketLabels.bucket_3} {renderSortIcon('metal_bucket_3')}
                    </th>
                    <th
                      onClick={() => handleSort('metal_old')}
                      className="px-3 py-2.5 text-right cursor-pointer hover:bg-amber-50/60 whitespace-nowrap"
                    >
                      Old Balance {renderSortIcon('metal_old')}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => {
                    const metal = row[state.balanceType];
                    return (
                      <tr key={row.party_key} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onOpenLedger(row.party_key)}
                            className="font-semibold text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                            title="Open detailed party ledger"
                          >
                            {row.account_name}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 border-r border-slate-100 whitespace-nowrap">
                          {row.city}
                        </td>

                        {/* Cash Columns */}
                        <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                          {fmtCurr(row.cash.current)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                          {fmtCurr(row.cash.bucket_1)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                          {fmtCurr(row.cash.bucket_2)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                          {fmtCurr(row.cash.bucket_3)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold border-r border-slate-100 whitespace-nowrap">
                          {fmtCurr(row.cash.old)}
                        </td>

                        {/* Metal Columns */}
                        <td className="px-3 py-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                          {fmtWt(metal.current)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                          {fmtWt(metal.bucket_1)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                          {fmtWt(metal.bucket_2)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                          {fmtWt(metal.bucket_3)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {fmtWt(metal.old)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                Page <strong className="text-slate-900">{state.page}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong> ({totalRecords} total records)
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChangeState({ ...state, page: Math.max(1, state.page - 1) })}
                  disabled={state.page <= 1 || loading}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChangeState({ ...state, page: p })}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${p === state.page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onChangeState({ ...state, page: Math.min(totalPages, state.page + 1) })
                  }
                  disabled={state.page >= totalPages || loading}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM REPORT TOTALS PANEL (ALL MATCHING RECORDS: CASH, GOLD, SILVER) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Column-Wise Totals (Across All {totalRecords} Matching Accounts)
            </h3>
            <span className="text-[11px] text-slate-500">
              Dynamic Interval: {state.interval} Days
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                  <th className="px-3 py-2 text-left">Balance Category</th>
                  <th className="px-3 py-2 text-right">{bucketLabels.current}</th>
                  <th className="px-3 py-2 text-right">{bucketLabels.bucket_1}</th>
                  <th className="px-3 py-2 text-right">{bucketLabels.bucket_2}</th>
                  <th className="px-3 py-2 text-right">{bucketLabels.bucket_3}</th>
                  <th className="px-3 py-2 text-right">Old Balance</th>
                  <th className="px-3 py-2 text-right">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr className="bg-blue-50/30">
                  <td className="px-3 py-2 font-sans font-bold text-blue-900">Cash Balance (₹)</td>
                  <td className="px-3 py-2 text-right">₹{fmtCurr(totals.cash.current)}</td>
                  <td className="px-3 py-2 text-right">₹{fmtCurr(totals.cash.bucket_1)}</td>
                  <td className="px-3 py-2 text-right">₹{fmtCurr(totals.cash.bucket_2)}</td>
                  <td className="px-3 py-2 text-right">₹{fmtCurr(totals.cash.bucket_3)}</td>
                  <td className="px-3 py-2 text-right">₹{fmtCurr(totals.cash.old)}</td>
                  <td className="px-3 py-2 text-right font-bold text-blue-700">
                    ₹{fmtCurr(totals.cash.total)}
                  </td>
                </tr>
                <tr className="bg-amber-50/30">
                  <td className="px-3 py-2 font-sans font-bold text-amber-900">Gold Balance (g)</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.gold.current)}</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.gold.bucket_1)}</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.gold.bucket_2)}</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.gold.bucket_3)}</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.gold.old)}</td>
                  <td className="px-3 py-2 text-right font-bold text-amber-800">
                    {fmtWt(totals.gold.total)} g
                  </td>
                </tr>
                <tr className="bg-slate-50/60">
                  <td className="px-3 py-2 font-sans font-bold text-slate-800">Silver Balance (g)</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.silver.current)}</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.silver.bucket_1)}</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.silver.bucket_2)}</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.silver.bucket_3)}</td>
                  <td className="px-3 py-2 text-right">{fmtWt(totals.silver.old)}</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">
                    {fmtWt(totals.silver.total)} g
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
