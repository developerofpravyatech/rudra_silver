import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, TrendingDown, Printer, FileDown } from 'lucide-react';
import { printReport, downloadReportPdf, ReportPdfOptions } from '../../utils/reportPdf';
import {
  fetchKarigarOutstanding,
  fetchKarigarIssueRecReport,
  fetchKarigarLotReport,
  fetchKarigarDiaStnBalance,
  fetchKarigarDiaStnGroupBalance,
  fetchKarigarDiaStnIssueRec,
  fetchKarigarIssueFilterOptions,
} from '../../services/api';
import type {
  KarigarOutstandingRecord,
  KarigarIssueRecReport,
  KarigarLotReport,
  KarigarDiaStnBalance,
  KarigarDiaStnGroupBalance,
  KarigarDiaStnIssueRec,
} from '../../types';

export type KarigarReportType =
  | 'outstanding'
  | 'issue-rec'
  | 'lot'
  | 'dia-stn-balance'
  | 'dia-stn-group'
  | 'dia-stn-issue-rec';

interface Props {
  initialReport?: KarigarReportType;
}

const REPORT_TABS: { id: KarigarReportType; label: string }[] = [
  { id: 'outstanding',       label: 'Outstanding' },
  { id: 'issue-rec',         label: 'Issue / Receive' },
  { id: 'lot',               label: 'Lot Report' },
  { id: 'dia-stn-balance',   label: 'Dia/Stn Balance' },
  { id: 'dia-stn-group',     label: 'Dia/Stn Group Bal' },
  { id: 'dia-stn-issue-rec', label: 'Dia/Stn Issue/Rec' },
];

export const KarigarReportsPage: React.FC<Props> = ({ initialReport = 'outstanding' }) => {
  const [reportType, setReportType] = useState<KarigarReportType>(initialReport);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [karigars, setKarigars] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({ karigar_id: '', from_date: '', to_date: '', lot_no: '' });

  useEffect(() => {
    setReportType(initialReport);
  }, [initialReport]);

  useEffect(() => {
    fetchKarigarIssueFilterOptions().then(d => setKarigars(d.karigars)).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const params: Record<string, string> = {};
      if (filters.karigar_id) params.karigar_id = filters.karigar_id;
      if (filters.from_date)  params.from_date  = filters.from_date;
      if (filters.to_date)    params.to_date    = filters.to_date;
      if (filters.lot_no)     params.lot_no     = filters.lot_no;

      if (reportType === 'outstanding')            setData(await fetchKarigarOutstanding(params));
      else if (reportType === 'issue-rec')         setData(await fetchKarigarIssueRecReport(params));
      else if (reportType === 'lot')               setData(await fetchKarigarLotReport(params));
      else if (reportType === 'dia-stn-balance')   setData(await fetchKarigarDiaStnBalance(params));
      else if (reportType === 'dia-stn-group')     setData(await fetchKarigarDiaStnGroupBalance(params));
      else if (reportType === 'dia-stn-issue-rec') setData(await fetchKarigarDiaStnIssueRec(params));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [reportType]);

  const buildPdfOptions = (): ReportPdfOptions => {
    const selectedKarigar = karigars.find(k => String(k.id) === filters.karigar_id)?.name || 'All Karigars';
    const metaFilters = [
      { label: 'Karigar', value: selectedKarigar },
      ...(filters.from_date ? [{ label: 'From Date', value: filters.from_date }] : []),
      ...(filters.to_date ? [{ label: 'To Date', value: filters.to_date }] : []),
      ...(filters.lot_no ? [{ label: 'Lot No', value: filters.lot_no }] : []),
    ];
    const dateSuffix = new Date().toISOString().slice(0, 10);

    if (reportType === 'outstanding') {
      const rows = (data as KarigarOutstandingRecord[]).map(r => ({
        code: r.account_code,
        name: r.karigar_name,
        city: r.city || '—',
        ig: Number(r.total_issued_gold).toFixed(3),
        is: Number(r.total_issued_silver).toFixed(3),
        rg: Number(r.total_received_gold).toFixed(3),
        rs: Number(r.total_received_silver).toFixed(3),
        og: Number(r.outstanding_gold).toFixed(3),
        os: Number(r.outstanding_silver).toFixed(3),
        lots: r.open_lots,
      }));
      const sum = (k: keyof KarigarOutstandingRecord) => (data as KarigarOutstandingRecord[]).reduce((s, r) => s + Number(r[k] || 0), 0).toFixed(3);
      return {
        title: 'Karigar Outstanding Report',
        filename: `Karigar_Outstanding_${dateSuffix}.pdf`,
        orientation: 'landscape',
        filters: metaFilters,
        columns: [
          { header: 'Code', dataKey: 'code' },
          { header: 'Karigar', dataKey: 'name' },
          { header: 'City', dataKey: 'city' },
          { header: 'Issued Gold(g)', dataKey: 'ig', align: 'right' },
          { header: 'Issued Silver(g)', dataKey: 'is', align: 'right' },
          { header: 'Recd Gold(g)', dataKey: 'rg', align: 'right' },
          { header: 'Recd Silver(g)', dataKey: 'rs', align: 'right' },
          { header: 'Out Gold(g)', dataKey: 'og', align: 'right' },
          { header: 'Out Silver(g)', dataKey: 'os', align: 'right' },
          { header: 'Open Lots', dataKey: 'lots', align: 'center' },
        ],
        data: rows,
        totals: { code: 'TOTAL', name: `${rows.length} Karigar(s)`, ig: sum('total_issued_gold'), is: sum('total_issued_silver'), rg: sum('total_received_gold'), rs: sum('total_received_silver'), og: sum('outstanding_gold'), os: sum('outstanding_silver'), lots: (data as KarigarOutstandingRecord[]).reduce((s, r) => s + Number(r.open_lots || 0), 0) },
      };
    }

    if (reportType === 'issue-rec') {
      const rows = (data as KarigarIssueRecReport[]).map(r => ({
        vno: r.issue_voucher,
        dt: r.issue_date,
        name: r.karigar_name,
        lot: r.lot_no || '—',
        st: r.issue_status,
        is: Number(r.issued_silver).toFixed(3),
        rs: Number(r.received_silver).toFixed(3),
        bs: Number(r.balance_silver).toFixed(3),
        rv: r.receive_vouchers || '—',
      }));
      const sum = (k: keyof KarigarIssueRecReport) => (data as KarigarIssueRecReport[]).reduce((s, r) => s + Number(r[k] || 0), 0).toFixed(3);
      return {
        title: 'Karigar Issue / Receive Report',
        filename: `Karigar_Issue_Receive_${dateSuffix}.pdf`,
        orientation: 'landscape',
        filters: metaFilters,
        columns: [
          { header: 'Issue Voucher', dataKey: 'vno' },
          { header: 'Date', dataKey: 'dt' },
          { header: 'Karigar', dataKey: 'name' },
          { header: 'Lot No', dataKey: 'lot' },
          { header: 'Status', dataKey: 'st', align: 'center' },
          { header: 'Issued Silver(g)', dataKey: 'is', align: 'right' },
          { header: 'Received Silver(g)', dataKey: 'rs', align: 'right' },
          { header: 'Balance Silver(g)', dataKey: 'bs', align: 'right' },
          { header: 'Receive Vouchers', dataKey: 'rv' },
        ],
        data: rows,
        totals: { vno: 'TOTAL', name: `${rows.length} Issue(s)`, is: sum('issued_silver'), rs: sum('received_silver'), bs: sum('balance_silver') },
      };
    }

    if (reportType === 'lot') {
      const rows = (data as KarigarLotReport[]).map(r => ({
        lot: r.lot_no,
        name: r.karigar_name,
        fi: r.first_issue_date,
        li: r.last_issue_date,
        cnt: r.issue_count,
        is: Number(r.total_issued_silver).toFixed(3),
        rs: Number(r.total_received_silver).toFixed(3),
        bs: Number(r.balance_silver).toFixed(3),
      }));
      const sum = (k: keyof KarigarLotReport) => (data as KarigarLotReport[]).reduce((s, r) => s + Number(r[k] || 0), 0).toFixed(3);
      return {
        title: 'Karigar Lot Report',
        filename: `Karigar_Lot_Report_${dateSuffix}.pdf`,
        orientation: 'landscape',
        filters: metaFilters,
        columns: [
          { header: 'Lot No', dataKey: 'lot' },
          { header: 'Karigar', dataKey: 'name' },
          { header: 'First Issue', dataKey: 'fi' },
          { header: 'Last Issue', dataKey: 'li' },
          { header: 'Issues', dataKey: 'cnt', align: 'center' },
          { header: 'Issued Silver(g)', dataKey: 'is', align: 'right' },
          { header: 'Received Silver(g)', dataKey: 'rs', align: 'right' },
          { header: 'Balance Silver(g)', dataKey: 'bs', align: 'right' },
        ],
        data: rows,
        totals: { lot: 'TOTAL', name: `${rows.length} Lot(s)`, is: sum('total_issued_silver'), rs: sum('total_received_silver'), bs: sum('balance_silver') },
      };
    }

    if (reportType === 'dia-stn-balance') {
      const rows = (data as KarigarDiaStnBalance[]).map(r => ({
        code: r.account_code,
        name: r.karigar_name,
        city: r.city || '—',
        di: Number(r.diamond_issued).toFixed(3),
        dr: Number(r.diamond_received).toFixed(3),
        db: Number(r.diamond_balance).toFixed(3),
        si: Number(r.stone_issued).toFixed(3),
        sr: Number(r.stone_received).toFixed(3),
        sb: Number(r.stone_balance).toFixed(3),
      }));
      const sum = (k: keyof KarigarDiaStnBalance) => (data as KarigarDiaStnBalance[]).reduce((s, r) => s + Number(r[k] || 0), 0).toFixed(3);
      return {
        title: 'Karigar Diamond & Stone Balance',
        filename: `Karigar_Dia_Stn_Balance_${dateSuffix}.pdf`,
        orientation: 'landscape',
        filters: metaFilters,
        columns: [
          { header: 'Code', dataKey: 'code' },
          { header: 'Karigar', dataKey: 'name' },
          { header: 'City', dataKey: 'city' },
          { header: 'Dia Issued', dataKey: 'di', align: 'right' },
          { header: 'Dia Recd', dataKey: 'dr', align: 'right' },
          { header: 'Dia Bal', dataKey: 'db', align: 'right' },
          { header: 'Stone Issued', dataKey: 'si', align: 'right' },
          { header: 'Stone Recd', dataKey: 'sr', align: 'right' },
          { header: 'Stone Bal', dataKey: 'sb', align: 'right' },
        ],
        data: rows,
        totals: { code: 'TOTAL', di: sum('diamond_issued'), dr: sum('diamond_received'), db: sum('diamond_balance'), si: sum('stone_issued'), sr: sum('stone_received'), sb: sum('stone_balance') },
      };
    }

    if (reportType === 'dia-stn-group') {
      const rows = (data as KarigarDiaStnGroupBalance[]).map(r => ({
        name: r.karigar_name,
        grp: r.group_name,
        cat: r.item_category,
        iq: r.issued_qty,
        rq: r.received_qty,
        pq: r.pending_qty,
        di: Number(r.issued_diamond).toFixed(3),
        si: Number(r.issued_stone).toFixed(3),
        wb: Number(r.weight_balance).toFixed(3),
      }));
      return {
        title: 'Karigar Dia/Stn Group Balance',
        filename: `Karigar_Dia_Stn_Group_${dateSuffix}.pdf`,
        orientation: 'landscape',
        filters: metaFilters,
        columns: [
          { header: 'Karigar', dataKey: 'name' },
          { header: 'Group / Item Type', dataKey: 'grp' },
          { header: 'Category', dataKey: 'cat' },
          { header: 'Issued Qty', dataKey: 'iq', align: 'right' },
          { header: 'Recd Qty', dataKey: 'rq', align: 'right' },
          { header: 'Pending Qty', dataKey: 'pq', align: 'right' },
          { header: 'Dia Issued', dataKey: 'di', align: 'right' },
          { header: 'Stn Issued', dataKey: 'si', align: 'right' },
          { header: 'Wt Balance', dataKey: 'wb', align: 'right' },
        ],
        data: rows,
      };
    }

    const rows = (data as KarigarDiaStnIssueRec[]).map(r => ({
      dt: r.tx_date,
      vno: r.voucher_no,
      tp: r.tx_type,
      name: r.karigar_name,
      lot: r.lot_no || '—',
      item: r.item_name,
      grp: r.item_type || '—',
      iq: r.issue_qty,
      rq: r.receive_qty,
      dw: Number(r.diamond_weight).toFixed(3),
      sw: Number(r.stone_weight).toFixed(3),
    }));
    return {
      title: 'Karigar Dia/Stn Issue & Receive',
      filename: `Karigar_Dia_Stn_IssueRec_${dateSuffix}.pdf`,
      orientation: 'landscape',
      filters: metaFilters,
      columns: [
        { header: 'Date', dataKey: 'dt' },
        { header: 'Voucher No', dataKey: 'vno' },
        { header: 'Type', dataKey: 'tp', align: 'center' },
        { header: 'Karigar', dataKey: 'name' },
        { header: 'Lot No', dataKey: 'lot' },
        { header: 'Item', dataKey: 'item' },
        { header: 'Group', dataKey: 'grp' },
        { header: 'Issue Qty', dataKey: 'iq', align: 'right' },
        { header: 'Recd Qty', dataKey: 'rq', align: 'right' },
        { header: 'Dia Wt', dataKey: 'dw', align: 'right' },
        { header: 'Stone Wt', dataKey: 'sw', align: 'right' },
      ],
      data: rows,
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f6f9]">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Karigar Reports</h1>
            <p className="text-xs text-slate-500">{data.length} record(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => printReport(buildPdfOptions())} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={() => downloadReportPdf(buildPdfOptions())} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
            <FileDown className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-slate-100 px-6 pt-3 overflow-x-auto">
        <div className="flex gap-1 whitespace-nowrap">
          {REPORT_TABS.map(tab => (
            <button key={tab.id} onClick={() => setReportType(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${reportType === tab.id
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border-b border-slate-100 px-6 py-3 flex flex-wrap gap-3 items-center">
        <select value={filters.karigar_id} onChange={e => setFilters(f => ({ ...f, karigar_id: e.target.value }))}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Karigars</option>
          {karigars.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        {reportType !== 'outstanding' && reportType !== 'dia-stn-balance' && (
          <>
            <input type="date" value={filters.from_date} onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2" />
            <input type="date" value={filters.to_date} onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2" />
          </>
        )}
        {reportType === 'lot' && (
          <input type="text" placeholder="Lot No" value={filters.lot_no} onChange={e => setFilters(f => ({ ...f, lot_no: e.target.value }))}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 w-32" />
        )}
        <button onClick={load} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Apply</button>
        <button onClick={() => { setFilters({ karigar_id: '', from_date: '', to_date: '', lot_no: '' }); }}
          className="text-xs text-slate-500 hover:underline">Reset</button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            {reportType === 'outstanding'       && <OutstandingTable data={data as KarigarOutstandingRecord[]} />}
            {reportType === 'issue-rec'         && <IssueRecTable    data={data as KarigarIssueRecReport[]} />}
            {reportType === 'lot'               && <LotTable         data={data as KarigarLotReport[]} />}
            {reportType === 'dia-stn-balance'   && <DiaStnBalTable   data={data as KarigarDiaStnBalance[]} />}
            {reportType === 'dia-stn-group'     && <DiaStnGrpTable   data={data as KarigarDiaStnGroupBalance[]} />}
            {reportType === 'dia-stn-issue-rec' && <DiaStnTxTable    data={data as KarigarDiaStnIssueRec[]} />}
          </div>
        )}
      </div>
    </div>
  );
};

const OutstandingTable: React.FC<{ data: KarigarOutstandingRecord[] }> = ({ data }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        {['Code','Karigar','City','Issued Gold(g)','Issued Silver(g)','Received Gold(g)','Received Silver(g)','Outstanding Gold','Outstanding Silver','Open Lots'].map(h => (
          <th key={h} className="px-3 py-3 text-left font-semibold text-slate-600">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.length === 0 ? (
        <tr><td colSpan={10} className="text-center py-12 text-slate-400">No outstanding records found.</td></tr>
      ) : data.map(r => (
        <tr key={r.karigar_id} className="hover:bg-slate-50">
          <td className="px-3 py-2.5 font-mono text-blue-700">{r.account_code}</td>
          <td className="px-3 py-2.5 font-semibold text-slate-800">{r.karigar_name}</td>
          <td className="px-3 py-2.5 text-slate-600">{r.city || '—'}</td>
          <td className="px-3 py-2.5 text-right">{Number(r.total_issued_gold).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right">{Number(r.total_issued_silver).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right text-green-700">{Number(r.total_received_gold).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right text-green-700">{Number(r.total_received_silver).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right font-semibold text-orange-600">{Number(r.outstanding_gold).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right font-semibold text-orange-600">{Number(r.outstanding_silver).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-center">{r.open_lots}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const IssueRecTable: React.FC<{ data: KarigarIssueRecReport[] }> = ({ data }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        {['Issue Voucher','Date','Karigar','Lot No','Status','Issued Silver(g)','Received Silver(g)','Balance Silver(g)','Receive Vouchers'].map(h => (
          <th key={h} className="px-3 py-3 text-left font-semibold text-slate-600">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.length === 0 ? (
        <tr><td colSpan={9} className="text-center py-12 text-slate-400">No issue/receive records found.</td></tr>
      ) : data.map(r => (
        <tr key={r.issue_id} className="hover:bg-slate-50">
          <td className="px-3 py-2.5 font-mono text-blue-700">{r.issue_voucher}</td>
          <td className="px-3 py-2.5 text-slate-600">{r.issue_date}</td>
          <td className="px-3 py-2.5 font-semibold text-slate-800">{r.karigar_name}</td>
          <td className="px-3 py-2.5 text-slate-600">{r.lot_no || '—'}</td>
          <td className="px-3 py-2.5">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.issue_status === 'OPEN' ? 'bg-blue-100 text-blue-700' : r.issue_status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {r.issue_status}
            </span>
          </td>
          <td className="px-3 py-2.5 text-right">{Number(r.issued_silver).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right text-green-700">{Number(r.received_silver).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right font-semibold text-orange-600">{Number(r.balance_silver).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-slate-500 text-[11px]">{r.receive_vouchers || '—'}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const LotTable: React.FC<{ data: KarigarLotReport[] }> = ({ data }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        {['Lot No','Karigar','First Issue','Last Issue','Issues','Issued Silver(g)','Received Silver(g)','Balance Silver(g)'].map(h => (
          <th key={h} className="px-3 py-3 text-left font-semibold text-slate-600">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.length === 0 ? (
        <tr><td colSpan={8} className="text-center py-12 text-slate-400">No lot records found.</td></tr>
      ) : data.map((r, i) => (
        <tr key={i} className="hover:bg-slate-50">
          <td className="px-3 py-2.5 font-mono font-semibold text-blue-700">{r.lot_no}</td>
          <td className="px-3 py-2.5 font-semibold text-slate-800">{r.karigar_name}</td>
          <td className="px-3 py-2.5 text-slate-600">{r.first_issue_date}</td>
          <td className="px-3 py-2.5 text-slate-600">{r.last_issue_date}</td>
          <td className="px-3 py-2.5 text-center">{r.issue_count}</td>
          <td className="px-3 py-2.5 text-right">{Number(r.total_issued_silver).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right text-green-700">{Number(r.total_received_silver).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right font-semibold text-orange-600">{Number(r.balance_silver).toFixed(3)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const DiaStnBalTable: React.FC<{ data: KarigarDiaStnBalance[] }> = ({ data }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        {['Code','Karigar','City','Dia Issued','Dia Received','Dia Balance','Stone Issued','Stone Received','Stone Balance'].map(h => (
          <th key={h} className="px-3 py-3 text-left font-semibold text-slate-600">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.length === 0 ? (
        <tr><td colSpan={9} className="text-center py-12 text-slate-400">No diamond/stone balance records found.</td></tr>
      ) : data.map(r => (
        <tr key={r.karigar_id} className="hover:bg-slate-50">
          <td className="px-3 py-2.5 font-mono text-blue-700">{r.account_code}</td>
          <td className="px-3 py-2.5 font-semibold text-slate-800">{r.karigar_name}</td>
          <td className="px-3 py-2.5 text-slate-600">{r.city || '—'}</td>
          <td className="px-3 py-2.5 text-right">{Number(r.diamond_issued).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right text-green-700">{Number(r.diamond_received).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right font-semibold text-orange-600">{Number(r.diamond_balance).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right">{Number(r.stone_issued).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right text-green-700">{Number(r.stone_received).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right font-semibold text-orange-600">{Number(r.stone_balance).toFixed(3)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const DiaStnGrpTable: React.FC<{ data: KarigarDiaStnGroupBalance[] }> = ({ data }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        {['Karigar','Group / Item Type','Category','Issued Qty','Received Qty','Pending Qty','Dia Issued','Stn Issued','Weight Balance'].map(h => (
          <th key={h} className="px-3 py-3 text-left font-semibold text-slate-600">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.length === 0 ? (
        <tr><td colSpan={9} className="text-center py-12 text-slate-400">No diamond/stone group records found.</td></tr>
      ) : data.map((r, i) => (
        <tr key={i} className="hover:bg-slate-50">
          <td className="px-3 py-2.5 font-semibold text-slate-800">{r.karigar_name}</td>
          <td className="px-3 py-2.5 text-slate-700">{r.group_name}</td>
          <td className="px-3 py-2.5 text-slate-600">{r.item_category}</td>
          <td className="px-3 py-2.5 text-right">{r.issued_qty}</td>
          <td className="px-3 py-2.5 text-right text-green-700">{r.received_qty}</td>
          <td className="px-3 py-2.5 text-right font-semibold text-orange-600">{r.pending_qty}</td>
          <td className="px-3 py-2.5 text-right">{Number(r.issued_diamond).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right">{Number(r.issued_stone).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right font-semibold text-blue-700">{Number(r.weight_balance).toFixed(3)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const DiaStnTxTable: React.FC<{ data: KarigarDiaStnIssueRec[] }> = ({ data }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        {['Date','Voucher No','Type','Karigar','Lot No','Item','Group','Issue Qty','Receive Qty','Diamond Wt','Stone Wt'].map(h => (
          <th key={h} className="px-3 py-3 text-left font-semibold text-slate-600">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.length === 0 ? (
        <tr><td colSpan={11} className="text-center py-12 text-slate-400">No diamond/stone transactions found.</td></tr>
      ) : data.map((r, i) => (
        <tr key={i} className="hover:bg-slate-50">
          <td className="px-3 py-2.5 text-slate-600">{r.tx_date}</td>
          <td className="px-3 py-2.5 font-mono text-blue-700">{r.voucher_no}</td>
          <td className="px-3 py-2.5">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.tx_type === 'ISSUE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
              {r.tx_type}
            </span>
          </td>
          <td className="px-3 py-2.5 font-semibold text-slate-800">{r.karigar_name}</td>
          <td className="px-3 py-2.5 text-slate-600">{r.lot_no || '—'}</td>
          <td className="px-3 py-2.5 text-slate-700">{r.item_name}</td>
          <td className="px-3 py-2.5 text-slate-500">{r.item_type || '—'}</td>
          <td className="px-3 py-2.5 text-right">{r.issue_qty}</td>
          <td className="px-3 py-2.5 text-right">{r.receive_qty}</td>
          <td className="px-3 py-2.5 text-right">{Number(r.diamond_weight).toFixed(3)}</td>
          <td className="px-3 py-2.5 text-right">{Number(r.stone_weight).toFixed(3)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);
