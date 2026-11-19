import { Account, InventoryTag, DailyRates, DailySummary } from '../types';

const API_BASE = '/api/v1';

export async function fetchTodayRates(): Promise<DailyRates | null> {
  try {
    const res = await fetch(`${API_BASE}/rates/today`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch rates', e);
    return null;
  }
}

export async function fetchDailySummary(dateStr?: string): Promise<DailySummary> {
  try {
    const url = dateStr ? `${API_BASE}/daily-summary?date=${dateStr}` : `${API_BASE}/daily-summary`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load summary');
    return await res.json();
  } catch (e) {
    return {
      date: new Date().toISOString().split('T')[0],
      opening_cash: 252400,
      closing_cash: 252400,
      voucher_counts: {
        receipt: 0, payment: 0, sale: 0, purchase: 0,
        sale_return: 0, purchase_return: 0, journal: 0, contra: 0,
        issue: 0, receive: 0, order: 0, repair: 0
      }
    };
  }
}

export async function searchAccounts(query: string): Promise<Account[]> {
  try {
    const res = await fetch(`${API_BASE}/accounts?query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('Failed to search accounts', e);
    return [];
  }
}

export async function fetchTagByBarcode(tagNumber: string): Promise<InventoryTag | null> {
  try {
    const res = await fetch(`${API_BASE}/tags/${encodeURIComponent(tagNumber)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch tag', e);
    return null;
  }
}

export async function calculateItem(params: {
  gross_weight: number;
  less_weight: number;
  purity_touch: number;
  wastage_percent: number;
  metal_rate_per_gram: number;
  labour_rate: number;
  labour_type?: string;
  stone_amount?: number;
  pieces?: number;
}) {
  const res = await fetch(`${API_BASE}/calculate/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Calculation error');
  return await res.json();
}

export async function submitVoucher(payload: any) {
  const res = await fetch(`${API_BASE}/vouchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to submit voucher');
  }
  return await res.json();
}
