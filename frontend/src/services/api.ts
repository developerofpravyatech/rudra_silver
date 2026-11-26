import { Account, InventoryTag, DailyRates, DailySummary, AuthUser, PaginatedUsers, CreateVoucherPayload, ItemRecord, PaginatedItems, CategoryOption, CategoryRecord, PaginatedCategories, CategoryFilterParams, PurityStampOption, ItemFilterOptions, ItemFilterParams, StockItem, PaginatedStockItems, StockFilterParams, StockDropdownOptions, StockStatusRecord, PaginatedStockStatus, StockStatusFilterParams, MetalStockRecord, PaginatedMetalStock, MetalStockFilterParams, MetalStockFilterOptions, DailyBalanceRecord, PaginatedDailyBalance, DailyBalanceFilterParams, DailyBalanceFilterOptions, AccountLookupItem, CustomerRecord, PaginatedCustomers, CustomerFilterParams, DailyTransactionRecord, DailyTransactionTotals, PaginatedDailyTransactions, DailyTransactionFilterParams, DailyTransactionFilterOptions, SilverBullionRecord, PaginatedSilverBullion, SilverBullionFilterParams, SilverBullionFilterOptions, PurchaseRegisterRecord, PaginatedPurchaseRegister, PurchaseRegisterFilterParams, PurchaseRegisterFilterOptions, PurchaseRegisterSummary, SaleRegisterRecord, PaginatedSaleRegister, SaleRegisterFilterParams, SaleRegisterFilterOptions, SaleRegisterSummary, CustomerProfitFilterParams, CustomerProfitFilterOptions, PaginatedCustomerProfit, CustomerProfitSummary, CustomerProfitDetailedRecord, CustomerProfitVoucherRecord, AccountGroupItem, AgeWiseFilterOptions, AgeWiseFilterParams, PaginatedAgeWiseReport, AgeWiseLedgerResponse, KarigarRecord, KarigarFilterParams, PaginatedKarigars, KarigarIssueRecord, KarigarReceiveRecord, KarigarOutstandingRecord, KarigarIssueRecReport, KarigarLotReport, KarigarDiaStnBalance, KarigarDiaStnGroupBalance, KarigarDiaStnIssueRec } from '../types';

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

export async function submitVoucher(payload: CreateVoucherPayload) {
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

export async function fetchVoucherList(params: {
  voucher_type?: string;
  from_date?: string;
  to_date?: string;
  voucher_no?: number;
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ items: any[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params.voucher_type) qs.set('voucher_type', params.voucher_type);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.voucher_no !== undefined) qs.set('voucher_no', String(params.voucher_no));
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  const res = await fetch(`${API_BASE}/vouchers?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load vouchers');
  return await res.json();
}

export async function fetchVoucherDetail(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/vouchers/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load voucher');
  return await res.json();
}

export async function fetchPreviousVoucher(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/vouchers/previous?id=${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load previous voucher');
  return await res.json();
}

export async function fetchNextVoucher(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/vouchers/next?id=${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load next voucher');
  return await res.json();
}

export async function searchVouchers(query: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/vouchers/search?query=${encodeURIComponent(query)}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to search vouchers');
  return await res.json();
}

// ─── Mobile Auth API ────────────────────────────────────────────────────────

export const getAuthHeaders = (): Record<string, string> => {
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
  email: string;
  password: string;
  confirm_password?: string;
  mobile?: string;
}): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || err.message || 'Registration failed. Email might already be in use.');
  }
  return res.json();
}

export async function forgotPasswordEmailApi(email: string): Promise<{ success: boolean; message: string; dev_reset_url?: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || err.message || 'Failed to dispatch reset email.');
  }
  return res.json();
}

export async function verifyResetTokenApi(token: string): Promise<{ valid: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || err.message || 'Invalid or expired reset token.');
  }
  return res.json();
}

export async function resetPasswordWithTokenApi(token: string, new_password: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || err.message || 'Failed to reset password.');
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
  email: string;
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
  data: Partial<{ name: string; mobile: string; email: string; role: string; is_active: boolean }>
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

export interface StockTypeRecord {
  id: number;
  name: string;
  is_active: number;
  created_at?: string;
}

export async function fetchStockTypesApi(): Promise<Array<{ id: number; name: string; code?: string; is_active?: number }>> {
  const res = await fetch(`/api/metal-stock/stock-types?active_only=1`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return [
      { id: 1, name: 'Finished', is_active: 1 },
      { id: 2, name: 'Raw', is_active: 1 },
      { id: 3, name: 'Unfinish', is_active: 1 },
      { id: 4, name: 'Dust', is_active: 1 },
      { id: 5, name: 'Quality', is_active: 1 },
    ];
  }
  return res.json();
}

export async function fetchStockTypesListApi(includeInactive: boolean = true): Promise<StockTypeRecord[]> {
  const url = includeInactive ? '/api/settings/stock-types' : '/api/settings/stock-types?active_only=1';
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to fetch stock types');
  }
  return res.json();
}

export async function createStockTypeApi(data: { name: string; is_active: number }): Promise<StockTypeRecord> {
  const res = await fetch('/api/settings/stock-types', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || json.message || 'Failed to create stock type');
  }
  return json.data || json;
}

export async function updateStockTypeApi(id: number, data: { name: string; is_active: number }): Promise<StockTypeRecord> {
  const res = await fetch(`/api/settings/stock-types/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || json.message || 'Failed to update stock type');
  }
  return json.data || json;
}

export async function deleteStockTypeApi(id: number): Promise<void> {
  const res = await fetch(`/api/settings/stock-types/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || json.message || 'Failed to delete stock type');
  }
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
  if (params.city && params.city !== 'all' && params.city !== 'ALL' && params.city !== 'ALL CITY') qs.set('city', params.city);
  if (params.state && params.state !== 'all' && params.state !== 'ALL' && params.state !== 'ALL STATE') qs.set('state', params.state);
  if (params.location && params.location !== 'all' && params.location !== 'ALL') qs.set('location', params.location);
  if (params.group_id && params.group_id !== 'all' && params.group_id !== 'ALL') qs.set('group_id', String(params.group_id));
  if (params.group_name && params.group_name !== 'all' && params.group_name !== 'ALL') qs.set('group_name', params.group_name);
  if (params.ref_by && params.ref_by !== 'all' && params.ref_by !== 'ALL') qs.set('ref_by', params.ref_by);
  if (params.occupation && params.occupation !== 'all' && params.occupation !== 'ALL') qs.set('occupation', params.occupation);
  if (params.type && params.type !== 'all' && params.type !== 'ALL') qs.set('type', params.type);
  if (params.date) qs.set('date', params.date);
  if (params.opening_date) qs.set('opening_date', params.opening_date);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.balance_filter && params.balance_filter !== 'all') qs.set('balance_filter', params.balance_filter);
  if (params.with_balance) qs.set('with_balance', '1');
  if (params.zero_balance) qs.set('zero_balance', '1');
  if (params.dia_stn_balance) qs.set('dia_stn_balance', '1');
  if (params.opening) qs.set('opening', '1');
  if (params.hisab_final) qs.set('hisab_final', '1');
  if (params.hisab_pending) qs.set('hisab_pending', '1');
  if (params.without_transact) qs.set('without_transact', '1');
  if (params.high_priority) qs.set('high_priority', '1');
  if (params.with_last_sp_date) qs.set('with_last_sp_date', '1');
  if (params.outstanding_only) qs.set('outstanding_only', '1');
  if (params.agent_hp_only) qs.set('agent_hp_only', '1');
  if (params.min_amount !== undefined && params.min_amount !== null) qs.set('min_amount', String(params.min_amount));
  if (params.max_amount !== undefined && params.max_amount !== null) qs.set('max_amount', String(params.max_amount));
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

export async function fetchDailyBalanceFilterOptions(state?: string): Promise<DailyBalanceFilterOptions> {
  const url = state && state !== 'all' && state !== 'ALL' && state !== 'ALL STATE'
    ? `/api/daily-balance/filter-options?state=${encodeURIComponent(state)}`
    : `/api/daily-balance/filter-options`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return { cities: [], states: [], groups: [], locations: [], ref_bys: [], occupations: [], types: [] };
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
  if (params.city && params.city !== 'all' && params.city !== 'ALL') qs.set('city', params.city);
  if (params.state && params.state !== 'all' && params.state !== 'ALL') qs.set('state', params.state);
  if (params.location && params.location !== 'all' && params.location !== 'ALL') qs.set('location', params.location);
  if (params.group_id && params.group_id !== 'all' && params.group_id !== 'ALL') qs.set('group_id', String(params.group_id));
  if (params.group_name && params.group_name !== 'all' && params.group_name !== 'ALL') qs.set('group_name', params.group_name);
  if (params.ref_by && params.ref_by !== 'all' && params.ref_by !== 'ALL') qs.set('ref_by', params.ref_by);
  if (params.occupation && params.occupation !== 'all' && params.occupation !== 'ALL') qs.set('occupation', params.occupation);
  if (params.type && params.type !== 'all' && params.type !== 'ALL') qs.set('type', params.type);
  if (params.date) qs.set('date', params.date);
  if (params.opening_date) qs.set('opening_date', params.opening_date);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.balance_filter && params.balance_filter !== 'all') qs.set('balance_filter', params.balance_filter);
  if (params.with_balance) qs.set('with_balance', '1');
  if (params.zero_balance) qs.set('zero_balance', '1');
  if (params.dia_stn_balance) qs.set('dia_stn_balance', '1');
  if (params.opening) qs.set('opening', '1');
  if (params.hisab_final) qs.set('hisab_final', '1');
  if (params.hisab_pending) qs.set('hisab_pending', '1');
  if (params.without_transact) qs.set('without_transact', '1');
  if (params.high_priority) qs.set('high_priority', '1');
  if (params.with_last_sp_date) qs.set('with_last_sp_date', '1');
  if (params.outstanding_only) qs.set('outstanding_only', '1');
  if (params.agent_hp_only) qs.set('agent_hp_only', '1');
  if (params.min_amount !== undefined && params.min_amount !== null) qs.set('min_amount', String(params.min_amount));
  if (params.max_amount !== undefined && params.max_amount !== null) qs.set('max_amount', String(params.max_amount));
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
      const error: any = new Error(messages || 'Validation failed');
      error.validation_errors = err.validation_errors;
      throw error;
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
      const error: any = new Error(messages || 'Validation failed');
      error.validation_errors = err.validation_errors;
      throw error;
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


// -------------------------------------------------------------
// DAILY TRANSACTIONS API
// -------------------------------------------------------------

export async function fetchDailyTransactions(params: DailyTransactionFilterParams = {}): Promise<PaginatedDailyTransactions> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.group_name && params.group_name !== 'all') qs.set('group_name', params.group_name);
  if (params.login_name && params.login_name !== 'all') qs.set('login_name', params.login_name);
  if (params.stamp && params.stamp !== 'all') qs.set('stamp', params.stamp);
  if (params.voucher_type && params.voucher_type !== 'all') qs.set('voucher_type', params.voucher_type);
  if (params.party_name && params.party_name !== 'all') qs.set('party_name', params.party_name);
  if (params.series && params.series !== 'all') qs.set('series', params.series);
  if (params.site && params.site !== 'all') qs.set('site', params.site);
  if (params.transaction_type && params.transaction_type !== 'all') qs.set('transaction_type', params.transaction_type);
  if (params.is_undelivered) qs.set('is_undelivered', '1');
  if (params.stud_details) qs.set('stud_details', '1');
  if (params.exclude) qs.set('exclude', '1');
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`/api/daily-transactions?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to load daily transactions.');
  }
  return res.json();
}

export async function fetchDailyTransactionById(id: number): Promise<DailyTransactionRecord> {
  const res = await fetch(`/api/daily-transactions/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Daily transaction #${id} not found.`);
  }
  return res.json();
}

export async function createDailyTransaction(data: Partial<DailyTransactionRecord>): Promise<{ success: boolean; message: string; data: DailyTransactionRecord }> {
  const res = await fetch(`/api/daily-transactions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create daily transaction.');
  }
  return res.json();
}

export async function updateDailyTransaction(id: number, data: Partial<DailyTransactionRecord>): Promise<{ success: boolean; message: string; data: DailyTransactionRecord }> {
  const res = await fetch(`/api/daily-transactions/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update daily transaction #${id}.`);
  }
  return res.json();
}

export async function deleteDailyTransaction(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/daily-transactions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete daily transaction #${id}.`);
  }
  return res.json();
}

export async function fetchDailyTransactionFilterOptions(): Promise<DailyTransactionFilterOptions> {
  const res = await fetch(`/api/daily-transactions/filter-options`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return { groups: [], logins: [], stamps: [], voucher_types: [], series: [], sites: [], types: [], parties: [] };
  }
  return res.json();
}

export async function fetchDailyTransactionsExport(params: DailyTransactionFilterParams = {}): Promise<DailyTransactionRecord[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.group_name && params.group_name !== 'all') qs.set('group_name', params.group_name);
  if (params.transaction_type && params.transaction_type !== 'all') qs.set('transaction_type', params.transaction_type);
  if (params.party_name && params.party_name !== 'all') qs.set('party_name', params.party_name);
  if (params.login_name && params.login_name !== 'all') qs.set('login_name', params.login_name);
  if (params.stamp && params.stamp !== 'all') qs.set('stamp', params.stamp);
  if (params.voucher_type && params.voucher_type !== 'all') qs.set('voucher_type', params.voucher_type);
  if (params.series && params.series !== 'all') qs.set('series', params.series);
  if (params.site && params.site !== 'all') qs.set('site', params.site);
  if (params.is_undelivered) qs.set('is_undelivered', '1');
  if (params.stud_details) qs.set('stud_details', '1');
  if (params.exclude) qs.set('exclude', '1');
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);

  const res = await fetch(`/api/daily-transactions/export?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to export daily transactions.');
  }
  return res.json();
}

// -------------------------------------------------------------
// Silver Bullion API Endpoints
// -------------------------------------------------------------

export async function fetchSilverBullionList(params: SilverBullionFilterParams = {}): Promise<PaginatedSilverBullion> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);

  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);

  if (params.account_group_name && params.account_group_name !== 'all' && params.account_group_name !== 'ALL') {
    qs.set('account_group_name', params.account_group_name);
  }
  if (params.party_name && params.party_name !== 'all' && params.party_name !== 'ALL') {
    qs.set('party_name', params.party_name);
  }
  if (params.account_city && params.account_city !== 'all' && params.account_city !== 'ALL') {
    qs.set('account_city', params.account_city);
  }
  if (params.user_name && params.user_name !== 'all' && params.user_name !== 'ALL') {
    qs.set('user_name', params.user_name);
  }
  if (params.salesman_name && params.salesman_name !== 'all' && params.salesman_name !== 'ALL') {
    qs.set('salesman_name', params.salesman_name);
  }
  if (params.agent_name && params.agent_name !== 'all' && params.agent_name !== 'ALL') {
    qs.set('agent_name', params.agent_name);
  }

  if (params.bhav !== undefined && params.bhav !== null) {
    qs.set('bhav', params.bhav ? '1' : '0');
  }
  if (params.wo_sale !== undefined && params.wo_sale !== null) {
    qs.set('wo_sale', params.wo_sale ? '1' : '0');
  }
  if (params.including_labour !== undefined && params.including_labour !== null) {
    qs.set('including_labour', params.including_labour ? '1' : '0');
  }
  if (params.exclude_rate_book !== undefined && params.exclude_rate_book !== null) {
    qs.set('exclude_rate_book', params.exclude_rate_book ? '1' : '0');
  }

  const res = await fetch(`/api/silver-bullion?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Silver Bullion data.' }));
    throw new Error(err.message || 'Failed to load Silver Bullion data.');
  }
  return res.json();
}

export async function fetchSilverBullionById(id: number): Promise<SilverBullionRecord> {
  const res = await fetch(`/api/silver-bullion/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Silver Bullion record.' }));
    throw new Error(err.message || 'Failed to load Silver Bullion record.');
  }
  return res.json();
}

export async function createSilverBullion(data: Partial<SilverBullionRecord>): Promise<{ success: boolean; message: string; data: SilverBullionRecord }> {
  const res = await fetch(`/api/silver-bullion`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to create Silver Bullion record.' }));
    throw new Error(err.message || 'Failed to create Silver Bullion record.');
  }
  return res.json();
}

export async function updateSilverBullion(id: number, data: Partial<SilverBullionRecord>): Promise<{ success: boolean; message: string; data: SilverBullionRecord }> {
  const res = await fetch(`/api/silver-bullion/${id}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to update Silver Bullion record.' }));
    throw new Error(err.message || 'Failed to update Silver Bullion record.');
  }
  return res.json();
}

export async function deleteSilverBullion(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/silver-bullion/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to delete Silver Bullion record.' }));
    throw new Error(err.message || 'Failed to delete Silver Bullion record.');
  }
  return res.json();
}

export async function fetchSilverBullionFilterOptions(): Promise<SilverBullionFilterOptions> {
  const res = await fetch(`/api/silver-bullion/filter-options`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return { groups: [], parties: [], cities: [], users: [], salesmen: [], agents: [] };
  }
  return res.json();
}

export async function fetchSilverBullionExport(params: SilverBullionFilterParams = {}): Promise<SilverBullionRecord[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.account_group_name && params.account_group_name !== 'all') qs.set('account_group_name', params.account_group_name);
  if (params.party_name && params.party_name !== 'all') qs.set('party_name', params.party_name);
  if (params.account_city && params.account_city !== 'all') qs.set('account_city', params.account_city);

  const res = await fetch(`/api/silver-bullion/export?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to export Silver Bullion transactions.');
  }
  return res.json();
}

// -------------------------------------------------------------
// Purchase Register API Endpoints
// -------------------------------------------------------------

export async function fetchPurchaseRegisterList(params: PurchaseRegisterFilterParams = {}): Promise<PaginatedPurchaseRegister> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);

  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);

  if (params.party_name && params.party_name !== 'all') qs.set('party_name', params.party_name);
  if (params.account_group && params.account_group !== 'all') qs.set('account_group', params.account_group);
  if (params.item_group && params.item_group !== 'all') qs.set('item_group', params.item_group);
  if (params.item_code && params.item_code !== 'all') qs.set('item_code', params.item_code);
  if (params.stamp && params.stamp !== 'all') qs.set('stamp', params.stamp);
  if (params.branch_name && params.branch_name !== 'all') qs.set('branch_name', params.branch_name);
  if (params.login_name && params.login_name !== 'all') qs.set('login_name', params.login_name);
  if (params.register_type && params.register_type !== 'all' && params.register_type !== 'ALL') qs.set('register_type', params.register_type);
  if (params.voucher_type && params.voucher_type !== 'all') qs.set('voucher_type', params.voucher_type);
  if (params.quality && params.quality !== 'all') qs.set('quality', params.quality);
  if (params.item_type && params.item_type !== 'all') qs.set('item_type', params.item_type);
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.series && params.series !== 'all') qs.set('series', params.series);

  if (params.is_selected !== undefined && params.is_selected !== false && params.is_selected !== 0) qs.set('is_selected', '1');
  if (params.is_approved !== undefined && params.is_approved !== false && params.is_approved !== 0) qs.set('is_approved', '1');
  if (params.is_excluded !== undefined && params.is_excluded !== false && params.is_excluded !== 0) qs.set('is_excluded', '1');
  if (params.is_cancelled !== undefined && params.is_cancelled !== false && params.is_cancelled !== 0) qs.set('is_cancelled', '1');
  if (params.include_metal !== undefined && params.include_metal !== false && params.include_metal !== 0) qs.set('include_metal', '1');
  if (params.in_stock !== undefined && params.in_stock !== false && params.in_stock !== 0) qs.set('in_stock', '1');
  if (params.net_value !== undefined && params.net_value !== false && params.net_value !== 0) qs.set('net_value', '1');

  const res = await fetch(`/api/purchase-register?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Purchase Register.' }));
    throw new Error(err.message || 'Failed to load Purchase Register.');
  }
  return res.json();
}

export async function fetchPurchaseRegisterById(id: number): Promise<PurchaseRegisterRecord> {
  const res = await fetch(`/api/purchase-register/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Purchase Register record.' }));
    throw new Error(err.message || 'Failed to load Purchase Register record.');
  }
  return res.json();
}

export async function createPurchaseRegister(data: Partial<PurchaseRegisterRecord>): Promise<{ success: boolean; message: string; data: PurchaseRegisterRecord }> {
  const res = await fetch(`/api/purchase-register`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to create Purchase Register entry.' }));
    throw new Error(err.message || 'Failed to create Purchase Register entry.');
  }
  return res.json();
}

export async function updatePurchaseRegister(id: number, data: Partial<PurchaseRegisterRecord>): Promise<{ success: boolean; message: string; data: PurchaseRegisterRecord }> {
  const res = await fetch(`/api/purchase-register/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to update Purchase Register entry.' }));
    throw new Error(err.message || 'Failed to update Purchase Register entry.');
  }
  return res.json();
}

export async function deletePurchaseRegister(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/purchase-register/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to delete Purchase Register entry.' }));
    throw new Error(err.message || 'Failed to delete Purchase Register entry.');
  }
  return res.json();
}

export async function fetchPurchaseRegisterFilterOptions(): Promise<PurchaseRegisterFilterOptions> {
  const res = await fetch(`/api/purchase-register/filter-options`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return {
      parties: [], account_groups: [], item_groups: [], item_codes: [], stamps: [],
      branches: [], logins: [], qualities: [], item_types: [], categories: [], series: [], voucher_types: []
    };
  }
  return res.json();
}

export async function fetchPurchaseRegisterExport(params: PurchaseRegisterFilterParams = {}): Promise<PurchaseRegisterRecord[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.party_name && params.party_name !== 'all') qs.set('party_name', params.party_name);
  if (params.account_group && params.account_group !== 'all') qs.set('account_group', params.account_group);
  if (params.item_group && params.item_group !== 'all') qs.set('item_group', params.item_group);
  if (params.branch_name && params.branch_name !== 'all') qs.set('branch_name', params.branch_name);
  if (params.register_type && params.register_type !== 'all' && params.register_type !== 'ALL') qs.set('register_type', params.register_type);

  const res = await fetch(`/api/purchase-register/export?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to export Purchase Register.');
  }
  return res.json();
}

export async function fetchPurchaseRegisterSummary(params: PurchaseRegisterFilterParams = {}): Promise<PurchaseRegisterSummary> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.party_name && params.party_name !== 'all') qs.set('party_name', params.party_name);
  if (params.account_group && params.account_group !== 'all') qs.set('account_group', params.account_group);
  if (params.item_group && params.item_group !== 'all') qs.set('item_group', params.item_group);
  if (params.item_code && params.item_code !== 'all') qs.set('item_code', params.item_code);
  if (params.stamp && params.stamp !== 'all') qs.set('stamp', params.stamp);
  if (params.branch_name && params.branch_name !== 'all') qs.set('branch_name', params.branch_name);
  if (params.login_name && params.login_name !== 'all') qs.set('login_name', params.login_name);
  if (params.register_type && params.register_type !== 'all' && params.register_type !== 'ALL') qs.set('register_type', params.register_type);
  if (params.voucher_type && params.voucher_type !== 'all') qs.set('voucher_type', params.voucher_type);
  if (params.quality && params.quality !== 'all') qs.set('quality', params.quality);
  if (params.item_type && params.item_type !== 'all') qs.set('item_type', params.item_type);
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.series && params.series !== 'all') qs.set('series', params.series);
  if (params.is_selected !== undefined && params.is_selected !== null) qs.set('is_selected', String(Number(params.is_selected)));
  if (params.is_approved !== undefined && params.is_approved !== null) qs.set('is_approved', String(Number(params.is_approved)));
  if (params.is_excluded !== undefined && params.is_excluded !== null) qs.set('is_excluded', String(Number(params.is_excluded)));
  if (params.is_cancelled !== undefined && params.is_cancelled !== null) qs.set('is_cancelled', String(Number(params.is_cancelled)));
  if (params.include_metal !== undefined && params.include_metal !== null) qs.set('include_metal', String(Number(params.include_metal)));
  if (params.in_stock !== undefined && params.in_stock !== null) qs.set('in_stock', String(Number(params.in_stock)));
  if (params.net_value !== undefined && params.net_value !== null) qs.set('net_value', String(Number(params.net_value)));

  const res = await fetch(`/api/purchase-register/summary?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Purchase Register summary.' }));
    throw new Error(err.message || 'Failed to load Purchase Register summary.');
  }
  return res.json();
}

// -------------------------------------------------------------
// Sale Register API Endpoints
// -------------------------------------------------------------

export async function fetchSaleRegisterList(params: SaleRegisterFilterParams = {}): Promise<PaginatedSaleRegister> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);

  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);

  if (params.party_name && params.party_name !== 'all') qs.set('party_name', params.party_name);
  if (params.account_group && params.account_group !== 'all') qs.set('account_group', params.account_group);
  if (params.item_group && params.item_group !== 'all') qs.set('item_group', params.item_group);
  if (params.item_code && params.item_code !== 'all') qs.set('item_code', params.item_code);
  if (params.stamp && params.stamp !== 'all') qs.set('stamp', params.stamp);
  if (params.branch_name && params.branch_name !== 'all') qs.set('branch_name', params.branch_name);
  if (params.item_type && params.item_type !== 'all') qs.set('item_type', params.item_type);
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.series && params.series !== 'all') qs.set('series', params.series);
  if (params.quality && params.quality !== 'all') qs.set('quality', params.quality);
  if (params.voucher_type && params.voucher_type !== 'all') qs.set('voucher_type', params.voucher_type);
  if (params.register_type && params.register_type !== 'all' && params.register_type !== 'ALL') qs.set('register_type', params.register_type);

  if (params.is_sold !== undefined && params.is_sold !== false && params.is_sold !== 0) qs.set('is_sold', '1');
  if (params.in_stock !== undefined && params.in_stock !== false && params.in_stock !== 0) qs.set('in_stock', '1');
  if (params.net_value !== undefined && params.net_value !== false && params.net_value !== 0) qs.set('net_value', '1');
  if (params.is_approved !== undefined && params.is_approved !== false && params.is_approved !== 0) qs.set('is_approved', '1');
  if (params.is_excluded !== undefined && params.is_excluded !== false && params.is_excluded !== 0) qs.set('is_excluded', '1');
  if (params.include_metal !== undefined && params.include_metal !== false && params.include_metal !== 0) qs.set('include_metal', '1');

  const res = await fetch(`/api/sale-register?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Sale Register.' }));
    throw new Error(err.message || 'Failed to load Sale Register.');
  }
  return res.json();
}

export async function fetchSaleRegisterById(id: number): Promise<SaleRegisterRecord> {
  const res = await fetch(`/api/sale-register/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Sale Register record.' }));
    throw new Error(err.message || 'Failed to load Sale Register record.');
  }
  return res.json();
}

export async function createSaleRegister(data: Partial<SaleRegisterRecord>): Promise<{ success: boolean; message: string; data: SaleRegisterRecord }> {
  const res = await fetch(`/api/sale-register`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to create Sale Register entry.' }));
    throw new Error(err.message || 'Failed to create Sale Register entry.');
  }
  return res.json();
}

export async function updateSaleRegister(id: number, data: Partial<SaleRegisterRecord>): Promise<{ success: boolean; message: string; data: SaleRegisterRecord }> {
  const res = await fetch(`/api/sale-register/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to update Sale Register entry.' }));
    throw new Error(err.message || 'Failed to update Sale Register entry.');
  }
  return res.json();
}

export async function deleteSaleRegister(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/sale-register/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to delete Sale Register entry.' }));
    throw new Error(err.message || 'Failed to delete Sale Register entry.');
  }
  return res.json();
}

export async function fetchSaleRegisterFilterOptions(): Promise<SaleRegisterFilterOptions> {
  const res = await fetch(`/api/sale-register/filter-options`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return {
      parties: [], account_groups: [], item_groups: [], item_codes: [], stamps: [],
      branches: [], item_types: [], categories: [], series: [], qualities: [], voucher_types: []
    };
  }
  return res.json();
}

export async function fetchSaleRegisterExport(params: SaleRegisterFilterParams = {}): Promise<SaleRegisterRecord[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.party_name && params.party_name !== 'all') qs.set('party_name', params.party_name);
  if (params.account_group && params.account_group !== 'all') qs.set('account_group', params.account_group);
  if (params.item_group && params.item_group !== 'all') qs.set('item_group', params.item_group);
  if (params.branch_name && params.branch_name !== 'all') qs.set('branch_name', params.branch_name);
  if (params.register_type && params.register_type !== 'all' && params.register_type !== 'ALL') qs.set('register_type', params.register_type);

  const res = await fetch(`/api/sale-register/export?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to export Sale Register.');
  }
  return res.json();
}

export async function fetchSaleRegisterSummary(params: SaleRegisterFilterParams = {}): Promise<SaleRegisterSummary> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.party_name && params.party_name !== 'all') qs.set('party_name', params.party_name);
  if (params.account_group && params.account_group !== 'all') qs.set('account_group', params.account_group);
  if (params.item_group && params.item_group !== 'all') qs.set('item_group', params.item_group);
  if (params.item_code && params.item_code !== 'all') qs.set('item_code', params.item_code);
  if (params.stamp && params.stamp !== 'all') qs.set('stamp', params.stamp);
  if (params.branch_name && params.branch_name !== 'all') qs.set('branch_name', params.branch_name);
  if (params.item_type && params.item_type !== 'all') qs.set('item_type', params.item_type);
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.series && params.series !== 'all') qs.set('series', params.series);
  if (params.quality && params.quality !== 'all') qs.set('quality', params.quality);
  if (params.voucher_type && params.voucher_type !== 'all') qs.set('voucher_type', params.voucher_type);
  if (params.register_type && params.register_type !== 'all' && params.register_type !== 'ALL') qs.set('register_type', params.register_type);
  if (params.is_sold !== undefined && params.is_sold !== null) qs.set('is_sold', String(Number(params.is_sold)));
  if (params.in_stock !== undefined && params.in_stock !== null) qs.set('in_stock', String(Number(params.in_stock)));
  if (params.net_value !== undefined && params.net_value !== null) qs.set('net_value', String(Number(params.net_value)));
  if (params.is_approved !== undefined && params.is_approved !== null) qs.set('is_approved', String(Number(params.is_approved)));
  if (params.is_excluded !== undefined && params.is_excluded !== null) qs.set('is_excluded', String(Number(params.is_excluded)));
  if (params.include_metal !== undefined && params.include_metal !== null) qs.set('include_metal', String(Number(params.include_metal)));

  const res = await fetch(`/api/sale-register/summary?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Sale Register summary.' }));
    throw new Error(err.message || 'Failed to load Sale Register summary.');
  }
  return res.json();
}

// -------------------------------------------------------------
// Customer Wise Profit Report API Endpoints
// -------------------------------------------------------------

function buildCustomerProfitQuery(params: CustomerProfitFilterParams = {}): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);
  if (params.city && params.city !== 'all' && params.city !== 'ALL') qs.set('city', params.city);
  if (params.group && params.group !== 'all' && params.group !== 'ALL') qs.set('group', params.group);
  if (params.salesman && params.salesman !== 'all' && params.salesman !== 'ALL') qs.set('salesman', params.salesman);
  if (params.site && params.site !== 'all' && params.site !== 'ALL') qs.set('site', params.site);
  if (params.report_type) qs.set('report_type', params.report_type);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  return qs.toString();
}

export async function fetchCustomerProfitReport(
  params: CustomerProfitFilterParams = {}
): Promise<PaginatedCustomerProfit> {
  const query = buildCustomerProfitQuery(params);
  const res = await fetch(`/api/customer-profit-report${query ? `?${query}` : ''}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Customer Profit Report.' }));
    throw new Error(err.message || 'Failed to load Customer Profit Report.');
  }
  return res.json();
}

export async function fetchCustomerProfitSummary(
  params: CustomerProfitFilterParams = {}
): Promise<CustomerProfitSummary> {
  const query = buildCustomerProfitQuery({ ...params, page: undefined, limit: undefined });
  const res = await fetch(`/api/customer-profit-report/summary${query ? `?${query}` : ''}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Customer Profit Summary.' }));
    throw new Error(err.message || 'Failed to load Customer Profit Summary.');
  }
  return res.json();
}

export async function fetchCustomerProfitFilterOptions(): Promise<CustomerProfitFilterOptions> {
  const res = await fetch('/api/customer-profit-report/filter-options', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return { cities: [], groups: [], salesmen: [], sites: [] };
  }
  return res.json();
}

export async function fetchCustomerProfitExport(
  params: CustomerProfitFilterParams = {}
): Promise<(CustomerProfitDetailedRecord | CustomerProfitVoucherRecord)[]> {
  const query = buildCustomerProfitQuery({ ...params, page: undefined, limit: undefined });
  const res = await fetch(`/api/customer-profit-report/export${query ? `?${query}` : ''}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to export Customer Profit Report.' }));
    throw new Error(err.message || 'Failed to export Customer Profit Report.');
  }
  return res.json();
}

// -------------------------------------------------------------
// Age Wise List / Ageing Analysis API Endpoints
// -------------------------------------------------------------

function buildAgeWiseQuery(params: AgeWiseFilterParams = {}): string {
  const qs = new URLSearchParams();
  if (params.as_on_date) qs.set('as_on_date', params.as_on_date);
  if (params.group_ids && params.group_ids.length > 0) qs.set('group_ids', params.group_ids.join(','));
  if (params.city && params.city !== 'all' && params.city !== 'ALL') qs.set('city', params.city);
  if (params.location && params.location !== 'all' && params.location !== 'ALL') qs.set('location', params.location);
  if (params.ref_by && params.ref_by !== 'all' && params.ref_by !== 'ALL') qs.set('ref_by', params.ref_by);
  if (params.interval && params.interval > 0) qs.set('interval', String(params.interval));
  if (params.balance_type) qs.set('balance_type', params.balance_type);
  if (params.search) qs.set('search', params.search);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  return qs.toString();
}

export async function fetchAgeWiseGroups(search: string = ''): Promise<AccountGroupItem[]> {
  const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const res = await fetch(`/api/age-wise/groups${qs}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Account Groups.' }));
    throw new Error(err.message || 'Failed to load Account Groups.');
  }
  const data = await res.json();
  return data.items || [];
}

export async function fetchAgeWiseFilterOptions(): Promise<AgeWiseFilterOptions> {
  const res = await fetch('/api/age-wise/filter-options', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return { cities: [], locations: [], ref_by_list: [], groups: [] };
  }
  return res.json();
}

export async function fetchAgeWiseReport(
  params: AgeWiseFilterParams = {}
): Promise<PaginatedAgeWiseReport> {
  const query = buildAgeWiseQuery(params);
  const res = await fetch(`/api/age-wise/report${query ? `?${query}` : ''}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Age Wise Report.' }));
    throw new Error(err.message || 'Failed to load Age Wise Report.');
  }
  return res.json();
}

export async function fetchAgeWiseExport(
  params: AgeWiseFilterParams = {}
): Promise<PaginatedAgeWiseReport> {
  const query = buildAgeWiseQuery({ ...params, page: undefined, limit: undefined });
  const res = await fetch(`/api/age-wise/export${query ? `?${query}` : ''}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to export Age Wise Report.' }));
    throw new Error(err.message || 'Failed to export Age Wise Report.');
  }
  return res.json();
}

export async function fetchAgeWiseLedger(
  partyKey: string,
  asOnDate?: string
): Promise<AgeWiseLedgerResponse> {
  const qs = new URLSearchParams();
  qs.set('party_key', partyKey);
  if (asOnDate) qs.set('as_on_date', asOnDate);
  const res = await fetch(`/api/age-wise/ledger?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load Party Ledger.' }));
    throw new Error(err.message || 'Failed to load Party Ledger.');
  }
  return res.json();
}




// ============================================================
// KARIGAR MODULE API FUNCTIONS
// ============================================================

export async function fetchKarigars(params: KarigarFilterParams): Promise<PaginatedKarigars> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Karigar list.');
  const json = await res.json();
  return json.data ?? json;
}

export async function fetchKarigarById(id: number): Promise<KarigarRecord> {
  const res = await fetch(`/api/karigar/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Karigar not found.');
  const json = await res.json();
  return json.data ?? json;
}

export async function fetchKarigarNextCode(): Promise<string> {
  const res = await fetch('/api/karigar/next-code', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to generate code.');
  const json = await res.json();
  return json.data?.code ?? 'KARI-001';
}

export async function fetchKarigarFilterOptions(): Promise<{ cities: string[]; karigar_types: string[]; metal_types: string[] }> {
  const res = await fetch('/api/karigar/filter-options', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load filter options.');
  const json = await res.json();
  return json.data ?? json;
}

export async function createKarigar(data: Partial<KarigarRecord>): Promise<KarigarRecord> {
  const res = await fetch('/api/karigar', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to create Karigar.');
  return json.data ?? json;
}

export async function updateKarigar(id: number, data: Partial<KarigarRecord>): Promise<KarigarRecord> {
  const res = await fetch(`/api/karigar/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to update Karigar.');
  return json.data ?? json;
}

export async function toggleKarigarStatus(id: number): Promise<KarigarRecord> {
  const res = await fetch(`/api/karigar/${id}/toggle-status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to update status.');
  return json.data ?? json;
}

export async function deleteKarigar(id: number): Promise<void> {
  const res = await fetch(`/api/karigar/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete Karigar.');
}

// Karigar Issue

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

// Karigar Receive

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

// Karigar Reports

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

export async function fetchKarigarDiaStnBalance(params?: Record<string, string | number>): Promise<KarigarDiaStnBalance[]> {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar-receive/dia-stn-balance?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Dia/Stn Balance report.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarDiaStnGroupBalance(params?: Record<string, string | number>): Promise<KarigarDiaStnGroupBalance[]> {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar-receive/dia-stn-group-bal?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Dia/Stn Group Balance report.');
  const json = await res.json();
  return json.data;
}

export async function fetchKarigarDiaStnIssueRec(params?: Record<string, string | number>): Promise<KarigarDiaStnIssueRec[]> {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/karigar-receive/dia-stn-issue-rec?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load Dia/Stn Issue/Receive report.');
  const json = await res.json();
  return json.data;
}

// ============================================================================
// ACCOUNTING SYSTEM APIS
// ============================================================================

import type {
  AccountGroup,
  Ledger,
  AccountingVoucher,
  TrialBalanceResponse,
  OutstandingRow,
  ProfitLossResponse,
  BalanceSheetResponse,
  LedgerPosting,
} from '../types/accounting';

// -------------------------------------------------------------
// Account Groups
// -------------------------------------------------------------
export async function fetchAccountGroups(params?: Record<string, string | number>): Promise<{ data: AccountGroup[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/account-groups?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load account groups.');
  return res.json();
}

export async function fetchAccountGroupById(id: number): Promise<AccountGroup> {
  const res = await fetch(`/api/account-groups/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load account group.');
  const json = await res.json();
  return json.data;
}

export async function fetchAccountGroupsDropdown(): Promise<AccountGroup[]> {
  const res = await fetch('/api/account-groups/dropdown', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load account groups.');
  const json = await res.json();
  return json.data;
}

export async function createAccountGroup(data: Partial<AccountGroup>): Promise<AccountGroup> {
  const res = await fetch('/api/account-groups', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create account group.');
  return json.data;
}

export async function updateAccountGroup(id: number, data: Partial<AccountGroup>): Promise<AccountGroup> {
  const res = await fetch(`/api/account-groups/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update account group.');
  return json.data;
}

export async function deleteAccountGroup(id: number): Promise<void> {
  const res = await fetch(`/api/account-groups/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete account group.');
}

export async function toggleAccountGroupStatus(id: number): Promise<AccountGroup> {
  const res = await fetch(`/api/account-groups/${id}/toggle`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to toggle status.');
  return json.data;
}

// -------------------------------------------------------------
// Ledgers
// -------------------------------------------------------------
export async function fetchLedgers(params?: Record<string, string | number>): Promise<{ data: Ledger[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/ledger?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load ledgers.');
  return res.json();
}

export async function fetchLedgerById(id: number): Promise<Ledger> {
  const res = await fetch(`/api/ledger/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load ledger.');
  const json = await res.json();
  return json.data;
}

export async function fetchLedgerNextCode(): Promise<string> {
  const res = await fetch('/api/ledger/next-code', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to get next ledger code.');
  const json = await res.json();
  return json.code;
}

export async function fetchLedgerDropdown(): Promise<Array<{ id: number; ledger_code: string; ledger_name: string; group_name: string; nature: string }>> {
  const res = await fetch('/api/ledger/dropdown', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load ledger dropdown.');
  const json = await res.json();
  return json.data;
}

export async function fetchLedgerFilterOptions(): Promise<{ groups: Array<{ id: number; name: string }>; cities: string[] }> {
  const res = await fetch('/api/ledger/filter-options', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load filter options.');
  const json = await res.json();
  return json.data;
}

export async function createLedger(data: Partial<Ledger>): Promise<Ledger> {
  const res = await fetch('/api/ledger', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create ledger.');
  return json.data;
}

export async function updateLedger(id: number, data: Partial<Ledger>): Promise<Ledger> {
  const res = await fetch(`/api/ledger/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update ledger.');
  return json.data;
}

export async function deleteLedger(id: number): Promise<void> {
  const res = await fetch(`/api/ledger/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete ledger.');
}

export async function fetchLedgerBook(id: number, from?: string, to?: string): Promise<{ ledger: Ledger; entries: LedgerPosting[]; closing_balance: number; closing_balance_type: 'DR' | 'CR' }> {
  const qs = new URLSearchParams({ id: String(id) });
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const res = await fetch(`/api/ledger/book?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load ledger book.');
  const json = await res.json();
  return json.data;
}

// -------------------------------------------------------------
// Accounting Vouchers (Receipt / Payment / Contra / Journal)
// -------------------------------------------------------------
export async function fetchAccountingVouchers(params?: Record<string, string | number>): Promise<{ data: AccountingVoucher[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
  const res = await fetch(`/api/accounting-vouchers?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load vouchers.');
  return res.json();
}

export async function fetchAccountingVoucherById(id: number): Promise<AccountingVoucher> {
  const res = await fetch(`/api/accounting-vouchers/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load voucher.');
  const json = await res.json();
  return json.data;
}

export async function fetchNextVoucherNo(type: string): Promise<number> {
  const res = await fetch(`/api/accounting-vouchers/next-no?voucher_type=${encodeURIComponent(type)}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to get next voucher number.');
  const json = await res.json();
  return json.next_no;
}

export async function createAccountingVoucher(data: Partial<AccountingVoucher> & { amount?: number }): Promise<AccountingVoucher> {
  const res = await fetch('/api/accounting-vouchers', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create voucher.');
  return json;
}

export async function updateAccountingVoucher(id: number, data: Partial<AccountingVoucher> & { amount?: number }): Promise<void> {
  const res = await fetch(`/api/accounting-vouchers/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update voucher.');
}

export async function deleteAccountingVoucher(id: number): Promise<void> {
  const res = await fetch(`/api/accounting-vouchers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to cancel voucher.');
}

// -------------------------------------------------------------
// Accounting Reports
// -------------------------------------------------------------
export async function fetchTrialBalance(asOn?: string): Promise<TrialBalanceResponse> {
  const qs = asOn ? `?as_on=${encodeURIComponent(asOn)}` : '';
  const res = await fetch(`/api/reports/trial-balance${qs}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load trial balance.');
  const json = await res.json();
  return json.data;
}

export async function fetchDayBook(date?: string): Promise<LedgerPosting[]> {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`/api/reports/day-book${qs}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load day book.');
  const json = await res.json();
  return json.data;
}

export async function fetchCashBook(from?: string, to?: string): Promise<LedgerPosting[]> {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const res = await fetch(`/api/reports/cash-book?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load cash book.');
  const json = await res.json();
  return json.data;
}

export async function fetchBankBook(from?: string, to?: string): Promise<LedgerPosting[]> {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const res = await fetch(`/api/reports/bank-book?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load bank book.');
  const json = await res.json();
  return json.data;
}

export async function fetchOutstandingReceivable(asOn?: string): Promise<OutstandingRow[]> {
  const qs = asOn ? `?as_on=${encodeURIComponent(asOn)}` : '';
  const res = await fetch(`/api/reports/outstanding-receivable${qs}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load outstanding receivables.');
  const json = await res.json();
  return json.data;
}

export async function fetchOutstandingPayable(asOn?: string): Promise<OutstandingRow[]> {
  const qs = asOn ? `?as_on=${encodeURIComponent(asOn)}` : '';
  const res = await fetch(`/api/reports/outstanding-payable${qs}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load outstanding payables.');
  const json = await res.json();
  return json.data;
}

export async function fetchProfitLoss(from?: string, to?: string): Promise<ProfitLossResponse> {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const res = await fetch(`/api/reports/profit-loss?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load profit & loss report.');
  const json = await res.json();
  return json.data;
}

export async function fetchBalanceSheet(asOn?: string): Promise<BalanceSheetResponse> {
  const qs = asOn ? `?as_on=${encodeURIComponent(asOn)}` : '';
  const res = await fetch(`/api/reports/balance-sheet${qs}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load balance sheet.');
  const json = await res.json();
  return json.data;
}

// Helper used by AccountingVoucherForm
export async function fetchAccountsForVoucher(): Promise<Array<{ id: number; name: string; account_type: string }>> {
  const res = await fetch('/api/v1/accounts', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load accounts.');
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
}

export async function exportLedgerCsv(id: number, from?: string, to?: string): Promise<void> {
  const res = await fetch(`/api/ledger/export-csv?id=${id}${from ? `&from=${encodeURIComponent(from)}` : ''}${to ? `&to=${encodeURIComponent(to)}` : ''}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Failed to export ledger CSV.');
  }
  // Return the blob for download
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ledger-${id}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// Sales Return & Purchase Return
// -------------------------------------------------------------
export interface ReturnRecord {
  id: number;
  return_no: string;
  return_date: string;
  sale_register_id?: number | null;
  purchase_register_id?: number | null;
  original_voucher_no?: string | null;
  party_name: string;
  item_name: string;
  metal_type: string;
  return_pieces: number;
  return_weight: number;
  return_amount: number;
  gst_amount: number;
  total_amount: number;
  refund_mode: string;
  narration?: string | null;
  status: 'POSTED' | 'CANCELLED';
}

export async function fetchSaleReturns(params?: Record<string, string>): Promise<ReturnRecord[]> {
  const qs = new URLSearchParams(params || {});
  const res = await fetch(`/api/sale-returns?${qs.toString()}`, { headers: getAuthHeaders() });
  const json = await res.json();
  return json.data || [];
}

export async function createSaleReturn(data: Partial<ReturnRecord>): Promise<any> {
  const res = await fetch('/api/sale-returns', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to record sale return.');
  return json;
}

export async function deleteSaleReturn(id: number): Promise<void> {
  const res = await fetch(`/api/sale-returns/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to cancel sale return.');
}

export async function fetchPurchaseReturns(params?: Record<string, string>): Promise<ReturnRecord[]> {
  const qs = new URLSearchParams(params || {});
  const res = await fetch(`/api/purchase-returns?${qs.toString()}`, { headers: getAuthHeaders() });
  const json = await res.json();
  return json.data || [];
}

export async function createPurchaseReturn(data: Partial<ReturnRecord>): Promise<any> {
  const res = await fetch('/api/purchase-returns', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to record purchase return.');
  return json;
}

export async function deletePurchaseReturn(id: number): Promise<void> {
  const res = await fetch(`/api/purchase-returns/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to cancel purchase return.');
}

// -------------------------------------------------------------
// Invoice Allocations & Payment Status Reports
// -------------------------------------------------------------
import type { OpenInvoiceItem, InvoiceStatusReportRow } from '../types/accounting';

export async function fetchOpenInvoicesForVoucher(voucherType: string, accountId: number): Promise<OpenInvoiceItem[]> {
  if (!accountId) return [];
  const qs = new URLSearchParams({ voucher_type: voucherType, account_id: String(accountId) });
  const res = await fetch(`/api/accounting-vouchers/open-invoices?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchInvoiceStatusReport(type: 'SALE' | 'PURCHASE', params?: Record<string, string>): Promise<InvoiceStatusReportRow[]> {
  const qs = new URLSearchParams({ type, ...(params || {}) });
  const res = await fetch(`/api/reports/invoice-status?${qs.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load invoice status report.');
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}
