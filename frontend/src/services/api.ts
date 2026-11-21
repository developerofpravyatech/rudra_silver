import { Account, InventoryTag, DailyRates, DailySummary, AuthUser, PaginatedUsers, ItemRecord, PaginatedItems } from '../types';

const API_BASE = '/api/v1';

export async function fetchSalesOverview(range: 'today' | '7days' | '30days'): Promise<{
  range: string;
  points: { label: string; total: number; paid: number; pending: number }[];
  totals: { total: number; paid: number; pending: number; count: number };
}> {
  const res = await fetch(`${API_BASE}/sales/overview?range=${range}`);
  if (!res.ok) throw new Error('Failed to load sales overview');
  return res.json();
}
export async function fetchDashboardSummary(): Promise<{
  today_sales: number;
  today_sales_pct: number;
  total_invoices: number;
  total_invoices_pct: number;
  silver_sold: number;
  silver_sold_pct: number;
  silver_rate: number;
  silver_rate_pct: number;
}> {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to load dashboard summary');
  return res.json();
}
export async function fetchInvoiceDetail(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/invoices/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load invoice');
  return res.json();
}
export async function fetchRecentInvoices(limit = 5): Promise<any[]> {
  const res = await fetch(`${API_BASE}/invoices?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load invoices');
  const data = await res.json();
  return data.items || [];
}
export async function fetchDailyBalance(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/daily-balance`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load daily balance');
  const data = await res.json();
  return data.items || [];
}
export async function fetchTransactions(params: { page?: number; limit?: number; search?: string } = {}): Promise<{ items: any[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  const res = await fetch(`${API_BASE}/transactions?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load transactions');
  return res.json();
}
export async function fetchStockStatus(params: { page?: number; limit?: number; search?: string } = {}): Promise<{ items: any[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  const res = await fetch(`${API_BASE}/stock-status?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load stock status');
  return res.json();
}

export async function fetchStockStatusSummary(): Promise<any> {
  const res = await fetch(`${API_BASE}/stock-status/summary`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load summary');
  return res.json();
}
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

// ─── Mobile Auth API ────────────────────────────────────────────────────────

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('rudra_auth_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
};

export async function loginApi(
  mobile: string,
  password: string
): Promise<{ access_token: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed. Please check your credentials.');
  }
  return res.json();
}

export async function registerApi(data: {
  name: string;
  mobile: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed. Mobile number might already be in use.');
  }
  return res.json();
}

export async function sendOtpApi(mobile: string): Promise<{ message: string; cooldown_seconds: number; dev_otp?: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to dispatch verification OTP.');
  }
  return res.json();
}

export async function verifyOtpApi(mobile: string, otp: string): Promise<{ valid: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, otp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Invalid or expired OTP.');
  }
  return res.json();
}

export async function resetPasswordApi(
  mobile: string,
  otp: string,
  new_password: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, otp, new_password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to reset password.');
  }
  return res.json();
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    // ignore — token is cleared locally regardless
  }
}

export async function deleteUserApi(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete user.');
  }
}
export async function fetchUserList(params: {
  search?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}): Promise<PaginatedUsers> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.role) qs.set('role', params.role);
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active));
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.per_page !== undefined) qs.set('per_page', String(params.per_page));
  const res = await fetch(`${API_BASE}/auth/users?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch users directory.');
  }
  return res.json();
}

export async function createUserApi(data: {
  name: string;
  mobile: string;
  password: string;
  role: string;
}): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create user account.');
  }
  return res.json();
}

export async function updateUserApi(
  id: number,
  data: Partial<{ name: string; mobile: string; role: string; is_active: boolean }>
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update user details.');
  }
  return res.json();
}

export async function toggleUserStatusApi(id: number, is_active: boolean): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/users/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to change user status.');
  }
  return res.json();
}

// ─── Item Master API ──────────────────────────────────────────────────────────

export async function fetchItemsApi(params: {
  search?: string;
  group_name?: string;
  hsn_code?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedItems> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.group_name) qs.set('group_name', params.group_name);
  if (params.hsn_code) qs.set('hsn_code', params.hsn_code);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/items?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to fetch items.');
  }
  return res.json();
}

export async function fetchItemByIdApi(id: number): Promise<ItemRecord> {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `Failed to fetch item #${id}.`);
  }
  return res.json();
}

export async function createItemApi(data: Partial<ItemRecord>): Promise<ItemRecord> {
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to create item.');
  }
  return res.json();
}

export async function updateItemApi(id: number, data: Partial<ItemRecord>): Promise<ItemRecord> {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to update item.');
  }
  return res.json();
}

export async function deleteItemApi(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to delete item.');
  }
  return res.json();
}
