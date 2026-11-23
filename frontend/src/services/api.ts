import { Account, InventoryTag, DailyRates, DailySummary, AuthUser, PaginatedUsers, ItemRecord, PaginatedItems, CategoryOption, CategoryRecord, PaginatedCategories, CategoryFilterParams, PurityStampOption, ItemFilterOptions, ItemFilterParams, StockItem, PaginatedStockItems, StockFilterParams, StockDropdownOptions, StockStatusRecord, PaginatedStockStatus, StockStatusFilterParams, MetalStockRecord, PaginatedMetalStock, MetalStockFilterParams, MetalStockFilterOptions, DailyBalanceRecord, PaginatedDailyBalance, DailyBalanceFilterParams, DailyBalanceFilterOptions, AccountLookupItem, CustomerRecord, PaginatedCustomers, CustomerFilterParams } from '../types';

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

export async function fetchItemCategoriesApi(): Promise<CategoryOption[]> {
  const res = await fetch(`${API_BASE}/items/categories`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to fetch categories.');
  }
  return res.json();
}

export async function fetchItemPurityStampsApi(): Promise<PurityStampOption[]> {
  const res = await fetch(`${API_BASE}/items/stamps`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to fetch purity stamps.');
  }
  return res.json();
}

export async function fetchItemFilterOptionsApi(): Promise<ItemFilterOptions> {
  const res = await fetch(`${API_BASE}/items/filter-options`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to fetch item filter options.');
  }
  return res.json();
}

export async function checkItemCodeDuplicateApi(code: string, excludeId?: number): Promise<{ available: boolean; message: string }> {
  const qs = new URLSearchParams({ code });
  if (excludeId) qs.set('exclude_id', String(excludeId));

  const res = await fetch(`${API_BASE}/items/check-code?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to check code availability.');
  }
  return res.json();
}

export async function fetchAllItemsForExportApi(params: ItemFilterParams = {}): Promise<ItemRecord[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.name) qs.set('name', params.name);
  if (params.code) qs.set('code', params.code);
  if (params.hsn_code) qs.set('hsn_code', params.hsn_code);
  if (params.group_name && params.group_name !== 'all') qs.set('group_name', params.group_name);
  if (params.category_id && params.category_id !== 'all') qs.set('category_id', String(params.category_id));
  if (params.is_active !== undefined && params.is_active !== 'all') qs.set('is_active', String(params.is_active));
  if (params.stock_method && params.stock_method !== 'all') qs.set('stock_method', params.stock_method);
  if (params.labour_type && params.labour_type !== 'all') qs.set('labour_type', params.labour_type);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  qs.set('page', '1');
  qs.set('limit', '1000');

  const res = await fetch(`${API_BASE}/items?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to fetch items for export.');
  }
  const data = await res.json();
  return data.items || [];
}

// -------------------------------------------------------------
// CATEGORY MODULE APIS
// -------------------------------------------------------------

export async function fetchCategoriesListApi(params: CategoryFilterParams = {}): Promise<PaginatedCategories> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.name) qs.set('name', params.name);
  if (params.hsn_code) qs.set('hsn_code', params.hsn_code);
  if (params.metal_type && params.metal_type !== 'all') qs.set('metal_type', params.metal_type);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/categories?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to fetch categories.');
  }
  return res.json();
}

export async function fetchCategoryByIdApi(id: number): Promise<CategoryRecord> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `Failed to fetch category #${id}.`);
  }
  return res.json();
}

export async function createCategoryApi(data: {
  metal_type: string;
  name: string;
  hsn_code?: string;
}): Promise<CategoryRecord> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to create category.');
  }
  return res.json();
}

export async function updateCategoryApi(
  id: number,
  data: { metal_type?: string; name?: string; hsn_code?: string }
): Promise<CategoryRecord> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to update category.');
  }
  return res.json();
}

export async function deleteCategoryApi(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to delete category.');
  }
  return res.json();
}

export async function checkCategoryNameDuplicateApi(
  name: string,
  excludeId?: number
): Promise<{ available: boolean; message: string }> {
  const qs = new URLSearchParams({ name });
  if (excludeId) qs.set('exclude_id', String(excludeId));

  const res = await fetch(`${API_BASE}/categories/check-name?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to check category name availability.');
  }
  return res.json();
}

export async function fetchCategoryMetalTypesApi(): Promise<string[]> {
  const res = await fetch(`/api/metal-stock/metal-types`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return ['GOLD', 'SILVER', 'PLATINUM', 'DIAMOND'];
  }
  return res.json();
}

export async function fetchMetalStockMetalTypesApi(): Promise<string[]> {
  return fetchCategoryMetalTypesApi();
}

export async function fetchStockTypesApi(): Promise<Array<{ id: number; name: string; code?: string; is_active?: number }>> {
  const res = await fetch(`/api/metal-stock/stock-types`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return [
      { id: 1, name: 'Finished' },
      { id: 2, name: 'Raw' },
      { id: 3, name: 'Unfinish' },
      { id: 4, name: 'Dust' },
      { id: 5, name: 'Quality' },
    ];
  }
  return res.json();
}

export async function fetchAllCategoriesForExportApi(
  params: CategoryFilterParams = {}
): Promise<CategoryRecord[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.name) qs.set('name', params.name);
  if (params.hsn_code) qs.set('hsn_code', params.hsn_code);
  if (params.metal_type && params.metal_type !== 'all') qs.set('metal_type', params.metal_type);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);

  const res = await fetch(`${API_BASE}/categories/export-all?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to fetch categories for export.');
  }
  return res.json();
}

// -------------------------------------------------------------
// STOCK MANAGEMENT MODULE APIS
// -------------------------------------------------------------

export async function fetchStockList(params: StockFilterParams = {}): Promise<PaginatedStockItems> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.metal_type && params.metal_type !== 'all') qs.set('metal_type', params.metal_type);
  if (params.item_group_id && params.item_group_id !== 'all') qs.set('item_group_id', String(params.item_group_id));
  if (params.purity_id && params.purity_id !== 'all') qs.set('purity_id', String(params.purity_id));
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.date_from) qs.set('date_from', params.date_from);
  if (params.date_to) qs.set('date_to', params.date_to);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/stock/list?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to load stock list.');
  }
  return res.json();
}

export async function fetchStockItem(id: number): Promise<StockItem> {
  const res = await fetch(`${API_BASE}/stock/view?id=${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to load stock item #${id}.`);
  }
  return res.json();
}

export async function createStockItem(data: Partial<StockItem>): Promise<{ success: boolean; message: string; data: StockItem }> {
  const res = await fetch(`${API_BASE}/stock/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to create stock item.');
  }
  return res.json();
}

export async function updateStockItem(id: number, data: Partial<StockItem>): Promise<{ success: boolean; message: string; data: StockItem }> {
  const res = await fetch(`${API_BASE}/stock/update?id=${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to update stock item #${id}.`);
  }
  return res.json();
}

export async function deleteStockItem(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/stock/delete?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to delete stock item #${id}.`);
  }
  return res.json();
}

export async function fetchStockDropdownOptions(): Promise<StockDropdownOptions> {
  const res = await fetch(`${API_BASE}/stock/dropdown-options`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to load stock dropdown options.');
  }
  return res.json();
}

// -------------------------------------------------------------
// STOCK_STATUS MODULE APIS (Direct MySQL stock_status table)
// -------------------------------------------------------------

export async function fetchStockStatusList(params: StockStatusFilterParams = {}): Promise<PaginatedStockStatus> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.unit && params.unit !== 'all') qs.set('unit', params.unit);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`/api/stock-status/list?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to load stock records.');
  }
  return res.json();
}

export async function fetchStockStatusView(id: number): Promise<StockStatusRecord> {
  const res = await fetch(`/api/stock-status/view?id=${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Stock record #${id} not found.`);
  }
  return res.json();
}

export async function createStockStatus(data: Partial<StockStatusRecord>): Promise<{ success: boolean; message: string; data: StockStatusRecord }> {
  const res = await fetch(`/api/stock-status/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to create stock item.');
  }
  return res.json();
}

export async function updateStockStatus(id: number, data: Partial<StockStatusRecord>): Promise<{ success: boolean; message: string; data: StockStatusRecord }> {
  const res = await fetch(`/api/stock-status/update?id=${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to update stock item #${id}.`);
  }
  return res.json();
}

export async function deleteStockStatus(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/stock-status/delete?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to delete stock item #${id}.`);
  }
  return res.json();
}

export async function fetchStockStatusUnits(): Promise<string[]> {
  const res = await fetch(`/api/stock-status/units`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return ['Gm', 'Pcs'];
  return res.json();
}

export async function fetchStockStatusAll(params: { search?: string; unit?: string } = {}): Promise<StockStatusRecord[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.unit && params.unit !== 'all') qs.set('unit', params.unit);

  const res = await fetch(`/api/stock-status/export-all?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to fetch all matching stock records for export.');
  }
  return res.json();
}

// -------------------------------------------------------------
// METAL STOCK MODULE APIS (Direct MySQL metal_stock table)
// -------------------------------------------------------------

export async function fetchMetalStockList(params: MetalStockFilterParams = {}): Promise<PaginatedMetalStock> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.group_name && params.group_name !== 'all') qs.set('group_name', params.group_name);
  if (params.item_name && params.item_name !== 'all') qs.set('item_name', params.item_name);
  if (params.stock_type && params.stock_type !== 'all') qs.set('stock_type', params.stock_type);
  if (params.unit && params.unit !== 'all') qs.set('unit', params.unit);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.stock_date) qs.set('stock_date', params.stock_date);
  if (params.is_approved !== undefined && params.is_approved !== 'all') qs.set('is_approved', String(params.is_approved));
  if (params.entry_wise) qs.set('entry_wise', '1');
  if (params.entry_no) qs.set('entry_no', params.entry_no);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`/api/metal-stock/list?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to load metal stock records.');
  }
  return res.json();
}

export async function fetchMetalStockView(id: number): Promise<MetalStockRecord> {
  const res = await fetch(`/api/metal-stock/view?id=${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Metal stock record #${id} not found.`);
  }
  return res.json();
}

export async function createMetalStock(data: Partial<MetalStockRecord>): Promise<{ success: boolean; message: string; data: MetalStockRecord }> {
  const res = await fetch(`/api/metal-stock/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to create metal stock record.');
  }
  return res.json();
}

export async function updateMetalStock(id: number, data: Partial<MetalStockRecord>): Promise<{ success: boolean; message: string; data: MetalStockRecord }> {
  const res = await fetch(`/api/metal-stock/update?id=${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to update metal stock record #${id}.`);
  }
  return res.json();
}

export async function deleteMetalStock(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/metal-stock/delete?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to delete metal stock record #${id}.`);
  }
  return res.json();
}

export async function fetchMetalStockFilterOptions(): Promise<MetalStockFilterOptions> {
  const res = await fetch(`/api/metal-stock/filter-options`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return {
      groups: [],
      items: [],
      units: ['Gm'],
      stock_types: ['Finished', 'Raw', 'Unfinish', 'Dust', 'Quality'],
    };
  }
  return res.json();
}

export async function fetchMetalStockAll(params: MetalStockFilterParams = {}): Promise<MetalStockRecord[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.group_name && params.group_name !== 'all') qs.set('group_name', params.group_name);
  if (params.item_name && params.item_name !== 'all') qs.set('item_name', params.item_name);
  if (params.stock_type && params.stock_type !== 'all') qs.set('stock_type', params.stock_type);
  if (params.unit && params.unit !== 'all') qs.set('unit', params.unit);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.stock_date) qs.set('stock_date', params.stock_date);
  if (params.is_approved !== undefined && params.is_approved !== 'all') qs.set('is_approved', String(params.is_approved));
  if (params.entry_wise) qs.set('entry_wise', '1');
  if (params.entry_no) qs.set('entry_no', params.entry_no);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);

  const res = await fetch(`/api/metal-stock/export-all?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to fetch all matching metal stock records for export.');
  }
  return res.json();
}

// -------------------------------------------------------------
// DAILY BALANCE MODULE APIS (Direct MySQL daily_balance table)
// -------------------------------------------------------------

export async function fetchDailyBalanceList(params: DailyBalanceFilterParams = {}): Promise<PaginatedDailyBalance> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.account_name) qs.set('account_name', params.account_name);
  if (params.city && params.city !== 'all') qs.set('city', params.city);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.state && params.state !== 'all') qs.set('state', params.state);
  if (params.group_id && params.group_id !== 'all') qs.set('group_id', String(params.group_id));
  if (params.group_name && params.group_name !== 'all') qs.set('group_name', params.group_name);
  if (params.balance_filter && params.balance_filter !== 'all') qs.set('balance_filter', params.balance_filter);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`/api/daily-balance/list?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to load daily balance records.');
  }
  return res.json();
}

export async function fetchDailyBalanceView(id: number): Promise<DailyBalanceRecord> {
  const res = await fetch(`/api/daily-balance/view?id=${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Daily balance record #${id} not found.`);
  }
  return res.json();
}

export async function createDailyBalance(data: Partial<DailyBalanceRecord>): Promise<{ success: boolean; message: string; data: DailyBalanceRecord }> {
  const res = await fetch(`/api/daily-balance/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to create daily balance record.');
  }
  return res.json();
}

export async function updateDailyBalance(id: number, data: Partial<DailyBalanceRecord>): Promise<{ success: boolean; message: string; data: DailyBalanceRecord }> {
  const res = await fetch(`/api/daily-balance/update?id=${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to update daily balance record #${id}.`);
  }
  return res.json();
}

export async function deleteDailyBalance(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/daily-balance/delete?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to delete daily balance record #${id}.`);
  }
  return res.json();
}

export async function fetchDailyBalanceFilterOptions(): Promise<DailyBalanceFilterOptions> {
  const res = await fetch(`/api/daily-balance/filter-options`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return { cities: [], states: [], groups: [] };
  }
  return res.json();
}

export async function fetchDailyBalanceAccountsLookup(): Promise<AccountLookupItem[]> {
  const res = await fetch(`/api/daily-balance/accounts-lookup`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function fetchDailyBalanceAll(params: DailyBalanceFilterParams = {}): Promise<DailyBalanceRecord[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.account_name) qs.set('account_name', params.account_name);
  if (params.city && params.city !== 'all') qs.set('city', params.city);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.state && params.state !== 'all') qs.set('state', params.state);
  if (params.group_id && params.group_id !== 'all') qs.set('group_id', String(params.group_id));
  if (params.group_name && params.group_name !== 'all') qs.set('group_name', params.group_name);
  if (params.balance_filter && params.balance_filter !== 'all') qs.set('balance_filter', params.balance_filter);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);

  const res = await fetch(`/api/daily-balance/export-all?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to fetch all matching daily balance records for export.');
  }
  return res.json();
}

// -------------------------------------------------------------
// CUSTOMER MANAGEMENT MODULE APIS
// -------------------------------------------------------------

export async function fetchCustomersApi(params: CustomerFilterParams = {}): Promise<PaginatedCustomers> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.name) qs.set('name', params.name);
  if (params.city) qs.set('city', params.city);
  if (params.location) qs.set('location', params.location);
  if (params.mobile) qs.set('mobile', params.mobile);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`/api/customers?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Failed to load customers.');
  }
  return res.json();
}

export async function fetchCustomerByIdApi(id: number): Promise<CustomerRecord> {
  const res = await fetch(`/api/customers/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to load customer #${id}.`);
  }
  return res.json();
}

export async function createCustomerApi(data: Partial<CustomerRecord>): Promise<CustomerRecord> {
  const res = await fetch(`/api/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.validation_errors) {
      const messages = Object.values(err.validation_errors).join(', ');
      throw new Error(messages || 'Validation failed');
    }
    throw new Error(err.message || err.detail || err.error || 'Failed to create customer.');
  }
  return res.json();
}

export async function updateCustomerApi(id: number, data: Partial<CustomerRecord>): Promise<CustomerRecord> {
  const res = await fetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.validation_errors) {
      const messages = Object.values(err.validation_errors).join(', ');
      throw new Error(messages || 'Validation failed');
    }
    throw new Error(err.message || err.detail || err.error || `Failed to update customer #${id}.`);
  }
  return res.json();
}

export async function deleteCustomerApi(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/customers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Failed to delete customer #${id}.`);
  }
  return res.json();
}
