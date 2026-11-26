import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, TrendingDown, Printer } from 'lucide-react';
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
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Printer className="w-3.5 h-3.5" /> Print
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
