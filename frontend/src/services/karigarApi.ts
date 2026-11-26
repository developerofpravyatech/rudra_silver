
// ============================================================
// KARIGAR MODULE API FUNCTIONS
// ============================================================

import type {
  KarigarRecord,
  KarigarFilterParams,
  PaginatedKarigars,
  KarigarIssueRecord,
  KarigarReceiveRecord,
  KarigarOutstandingRecord,
  KarigarIssueRecReport,
  KarigarLotReport,
} from '../types/karigar';
import { getAuthHeaders } from './api';

// ---- Karigar Master ----

export async function fetchKarigars(params: KarigarFilterParams): Promise<PaginatedKarigars> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Karigar list.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarById(id: number): Promise<KarigarRecord> {
  const res = await fetch(`/api/karigar/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Karigar not found.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarNextCode(): Promise<string> {
  const res = await fetch('/api/karigar/next-code', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to generate code.');
  const json = await res.json();
  return json.data?.code ?? 'KARI-001';
}

export async function fetchKarigarFilterOptions(): Promise<{ cities: string[]; states: string[] }> {
  const res = await fetch('/api/karigar/filter-options', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load filter options.');
  const json = await res.json();
  return json.data;
}

function mapKarigarData(data: Partial<KarigarRecord>): any {
    return {
      name: data.karigar_name,
      account_code: data.karigar_code,
      mobile: data.mobile,
      phone: data.phone,
      email: data.narration,
      address: data.address,
      city: data.city,
      state: data.state,
      balance_inr: data.balance_inr,
      balance_fine_gold: data.balance_fine_gold,
      balance_fine_silver: data.balance_fine_silver,
      default_labour_rate: data.default_labour_rate,
      permissible_loss_percent: data.permissible_loss_percent,
      credit_days: data.credit_days,
      is_active: data.is_active,
    };
  }

export async function createKarigar(data: Partial<KarigarRecord>): Promise<KarigarRecord> {
  const res = await fetch('/api/karigar', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(mapKarigarData(data)),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create Karigar.');
  return json.data;
}

export async function updateKarigar(id: number, data: Partial<KarigarRecord>): Promise<KarigarRecord> {
  const res = await fetch(`/api/karigar/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(mapKarigarData(data)),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update Karigar.');
  return json.data;
}

export async function toggleKarigarStatus(id: number): Promise<KarigarRecord> {
  const res = await fetch(`/api/karigar/${id}/toggle-status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update status.');
  return json.data;
}

export async function deleteKarigar(id: number): Promise<void> {
  const res = await fetch(`/api/karigar/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete Karigar.');
}

// ---- Karigar Issue ----

export async function fetchKarigarIssues(params: Record<string, string | number>): Promise<{ items: KarigarIssueRecord[]; total: number; page: number; limit: number; total_pages: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar-issue?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Karigar Issue list.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarIssueById(id: number): Promise<KarigarIssueRecord> {
  const res = await fetch(`/api/karigar-issue/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Issue not found.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarIssueFilterOptions(): Promise<{ karigars: { id: number; name: string }[]; lots: string[]; statuses: string[] }> {
  const res = await fetch('/api/karigar-issue/filter-options', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load filter options.');
  const json = await res.json();
  return json.data;
}

export async function createKarigarIssue(data: Partial<KarigarIssueRecord>): Promise<KarigarIssueRecord> {
  const res = await fetch('/api/karigar-issue', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create Issue voucher.');
  return json.data;
}

export async function updateKarigarIssue(id: number, data: Partial<KarigarIssueRecord>): Promise<KarigarIssueRecord> {
  const res = await fetch(`/api/karigar-issue/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update Issue voucher.');
  return json.data;
}

export async function deleteKarigarIssue(id: number): Promise<void> {
  const res = await fetch(`/api/karigar-issue/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete Issue voucher.');
}

// ---- Karigar Receive ----

export async function fetchKarigarReceives(params: Record<string, string | number>): Promise<{ items: KarigarReceiveRecord[]; total: number; page: number; limit: number; total_pages: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar-receive?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Karigar Receive list.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarReceiveById(id: number): Promise<KarigarReceiveRecord> {
  const res = await fetch(`/api/karigar-receive/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Receive record not found.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarReceiveFilterOptions(): Promise<{ karigars: { id: number; name: string }[]; lots: string[]; open_issues: { id: number; voucher_no: string; karigar_name: string; lot_no: string }[] }> {
  const res = await fetch('/api/karigar-receive/filter-options', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load filter options.');
  const json = await res.json();
  return json.data;
}

export async function createKarigarReceive(data: Partial<KarigarReceiveRecord>): Promise<KarigarReceiveRecord> {
  const res = await fetch('/api/karigar-receive', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create Receive voucher.');
  return json.data;
}

export async function deleteKarigarReceive(id: number): Promise<void> {
  const res = await fetch(`/api/karigar-receive/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete Receive record.');
}

// ---- Karigar Reports ----

export async function fetchKarigarOutstanding(params?: Record<string, string | number>): Promise<KarigarOutstandingRecord[]> {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar-receive/outstanding?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Outstanding report.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarIssueRecReport(params?: Record<string, string | number>): Promise<KarigarIssueRecReport[]> {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar-receive/issue-rec-report?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Issue/Rec report.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarLotReport(params?: Record<string, string | number>): Promise<KarigarLotReport[]> {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar-receive/lot-report?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Lot Report.');
  const json = await res.json();
  return json.data;
}
