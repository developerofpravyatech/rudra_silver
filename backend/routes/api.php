<?php
namespace Routes;

use Controllers\AuthController;
use Controllers\UserController;
use Controllers\DashboardController;
use Controllers\AccountController;
use Controllers\TagController;
use Controllers\CalculationController;
use Controllers\TransactionController;
use Controllers\VoucherController;
use Controllers\ItemController;
use Controllers\StockController;
use Controllers\StockStatusController;
use Controllers\MetalStockController;
use Controllers\DailyBalanceController;
use Controllers\CategoryController;
use Controllers\CustomerController;
use Controllers\StockTypeController;
use Controllers\DailyTransactionController;
use Controllers\SilverBullionController;
use Controllers\PurchaseRegisterController;
use Controllers\SaleRegisterController;
use Controllers\CustomerProfitReportController;
use Controllers\AgeWiseReportController;
use Controllers\KarigarController;
use Controllers\KarigarIssueController;
use Controllers\KarigarReceiveController;
use Controllers\AccountGroupController;
use Controllers\LedgerController;
use Controllers\AccountingVoucherController;
use Controllers\AccountingReportController;
use Controllers\ReturnController;
use Controllers\UnitController;

function registerRoutes(Router $router): void {
    // -------------------------------------------------------------
    // Authentication Routes (/api/v1/auth and /api/auth)
    // -------------------------------------------------------------
    $router->post('/api/v1/auth/register', [AuthController::class, 'register']);
    $router->post('/api/v1/auth/login', [AuthController::class, 'login']);
    $router->get('/api/v1/auth/me', [AuthController::class, 'me']);
    $router->post('/api/v1/auth/logout', [AuthController::class, 'logout']);

    // Email Password Reset Flow
    $router->post('/api/v1/auth/forgot-password', [AuthController::class, 'forgotPasswordEmail']);
    $router->get('/api/v1/auth/verify-reset-token', [AuthController::class, 'verifyResetToken']);
    $router->post('/api/v1/auth/verify-reset-token', [AuthController::class, 'verifyResetToken']);
    $router->post('/api/v1/auth/reset-password', [AuthController::class, 'resetPasswordWithToken']);

    // Also support /api/auth alias
    $router->post('/api/auth/register', [AuthController::class, 'register']);
    $router->post('/api/auth/login', [AuthController::class, 'login']);
    $router->post('/api/auth/forgot-password', [AuthController::class, 'forgotPasswordEmail']);
    $router->get('/api/auth/verify-reset-token', [AuthController::class, 'verifyResetToken']);
    $router->post('/api/auth/verify-reset-token', [AuthController::class, 'verifyResetToken']);
    $router->post('/api/auth/reset-password', [AuthController::class, 'resetPasswordWithToken']);

    // Forgot Password & OTP Flow (Backward Compatibility)
    $router->post('/api/v1/auth/forgot-password/send-otp', [AuthController::class, 'forgotPasswordSendOtp']);
    $router->post('/api/v1/auth/forgot-password/verify-otp', [AuthController::class, 'forgotPasswordVerifyOtp']);
    $router->post('/api/v1/auth/forgot-password/reset', [AuthController::class, 'forgotPasswordReset']);

    // Admin User Management
    $router->get('/api/v1/auth/users', [UserController::class, 'listUsers']);
    $router->post('/api/v1/auth/users', [UserController::class, 'createUser']);
    $router->put('/api/v1/auth/users/{id}', [UserController::class, 'updateUser']);
    $router->patch('/api/v1/auth/users/{id}/status', [UserController::class, 'toggleStatus']);
    $router->delete('/api/v1/auth/users/{id}', [UserController::class, 'deleteUser']);

    // -------------------------------------------------------------
    // Business & ERP Routes (/api/v1)
    // -------------------------------------------------------------
    $router->get('/api/v1/rates/today', [DashboardController::class, 'getTodayRates']);
    $router->get('/api/v1/daily-summary', [DashboardController::class, 'getDailySummary']);
    $router->get('/api/v1/dashboard/summary', [DashboardController::class, 'getDashboardSummary']);
    $router->get('/api/v1/dashboard/overview', [DashboardController::class, 'getOverview']);
    $router->get('/api/v1/daily-balance', [DashboardController::class, 'getDailyBalance']);
    $router->get('/api/v1/sales/overview', [DashboardController::class, 'getSalesOverview']);
    $router->get('/api/v1/stock-status', [DashboardController::class, 'getStockStatus']);
    $router->get('/api/v1/stock-status/summary', [DashboardController::class, 'getStockStatusSummary']);
    $router->get('/api/v1/accounts', [AccountController::class, 'getAccounts']);
    $router->get('/api/v1/tags/{identifier}', [TagController::class, 'lookupTag']);
    $router->post('/api/v1/calculate/item', [CalculationController::class, 'calculateItem']);

    // Item Master & Item Groups (/api/items and /api/v1/items)
    $router->get('/api/items', [ItemController::class, 'listItems']);
    $router->get('/api/items/list', [ItemController::class, 'listItems']);
    $router->get('/api/items/categories', [ItemController::class, 'categories']);
    $router->get('/api/items/stamps', [ItemController::class, 'stamps']);
    $router->get('/api/items/filter-options', [ItemController::class, 'filterOptions']);
    $router->get('/api/items/check-code', [ItemController::class, 'checkCode']);
    $router->get('/api/items/view', [ItemController::class, 'getItem']);
    $router->get('/api/items/{id}', [ItemController::class, 'getItem']);
    $router->post('/api/items', [ItemController::class, 'createItem']);
    $router->post('/api/items/create', [ItemController::class, 'createItem']);
    $router->put('/api/items/update', [ItemController::class, 'updateItem']);
    $router->put('/api/items/{id}', [ItemController::class, 'updateItem']);
    $router->post('/api/items/update', [ItemController::class, 'updateItem']);
    $router->delete('/api/items/delete', [ItemController::class, 'deleteItem']);
    $router->delete('/api/items/{id}', [ItemController::class, 'deleteItem']);
    $router->post('/api/items/delete', [ItemController::class, 'deleteItem']);

    // Also support RESTful /api/v1/items
    $router->get('/api/v1/items', [ItemController::class, 'listItems']);
    $router->get('/api/v1/items/categories', [ItemController::class, 'categories']);
    $router->get('/api/v1/items/stamps', [ItemController::class, 'stamps']);
    $router->get('/api/v1/items/filter-options', [ItemController::class, 'filterOptions']);
    $router->get('/api/v1/items/check-code', [ItemController::class, 'checkCode']);
    $router->get('/api/v1/items/{id}', [ItemController::class, 'getItem']);
    $router->post('/api/v1/items', [ItemController::class, 'createItem']);
    $router->put('/api/v1/items/{id}', [ItemController::class, 'updateItem']);
    $router->delete('/api/v1/items/{id}', [ItemController::class, 'deleteItem']);

    // -------------------------------------------------------------
    // Category Management Routes (/api/categories and /api/v1/categories)
    // -------------------------------------------------------------
    $router->get('/api/categories/list', [CategoryController::class, 'listCategories']);
    $router->get('/api/categories/view', [CategoryController::class, 'getCategory']);
    $router->post('/api/categories/create', [CategoryController::class, 'createCategory']);
    $router->put('/api/categories/update', [CategoryController::class, 'updateCategory']);
    $router->post('/api/categories/update', [CategoryController::class, 'updateCategory']);
    $router->delete('/api/categories/delete', [CategoryController::class, 'deleteCategory']);
    $router->post('/api/categories/delete', [CategoryController::class, 'deleteCategory']);
    $router->get('/api/categories/check-name', [CategoryController::class, 'checkName']);
    $router->get('/api/categories/metal-types', [CategoryController::class, 'metalTypes']);
    $router->get('/api/categories/export-all', [CategoryController::class, 'exportAll']);

    // Also support RESTful /api/v1/categories
    $router->get('/api/v1/categories', [CategoryController::class, 'listCategories']);
    $router->get('/api/v1/categories/check-name', [CategoryController::class, 'checkName']);
    $router->get('/api/v1/categories/metal-types', [CategoryController::class, 'metalTypes']);
    $router->get('/api/v1/categories/export-all', [CategoryController::class, 'exportAll']);
    $router->get('/api/v1/categories/{id}', [CategoryController::class, 'getCategory']);
    $router->post('/api/v1/categories', [CategoryController::class, 'createCategory']);
    $router->put('/api/v1/categories/{id}', [CategoryController::class, 'updateCategory']);
    $router->delete('/api/v1/categories/{id}', [CategoryController::class, 'deleteCategory']);

    // -------------------------------------------------------------
    // Stock Management Routes (/api/stock and /api/v1/stock)
    // -------------------------------------------------------------
    $router->get('/api/stock/list', [StockController::class, 'list']);
    $router->get('/api/stock/view', [StockController::class, 'view']);
    $router->post('/api/stock/create', [StockController::class, 'create']);
    $router->put('/api/stock/update', [StockController::class, 'update']);
    $router->delete('/api/stock/delete', [StockController::class, 'delete']);
    $router->get('/api/stock/dropdown-options', [StockController::class, 'dropdownOptions']);

    // Also support /api/v1/stock aliases for seamless frontend compatibility
    $router->get('/api/v1/stock/list', [StockController::class, 'list']);
    $router->get('/api/v1/stock/view', [StockController::class, 'view']);
    $router->post('/api/v1/stock/create', [StockController::class, 'create']);
    $router->put('/api/v1/stock/update', [StockController::class, 'update']);
    $router->delete('/api/v1/stock/delete', [StockController::class, 'delete']);
    $router->get('/api/v1/stock/dropdown-options', [StockController::class, 'dropdownOptions']);

    // -------------------------------------------------------------
    // Stock Status Management Routes (/api/stock-status)
    // -------------------------------------------------------------
    $router->get('/api/stock-status/list', [StockStatusController::class, 'list']);
    $router->get('/api/stock-status/view', [StockStatusController::class, 'view']);
    $router->post('/api/stock-status/create', [StockStatusController::class, 'create']);
    $router->put('/api/stock-status/update', [StockStatusController::class, 'update']);
    $router->delete('/api/stock-status/delete', [StockStatusController::class, 'delete']);
    $router->get('/api/stock-status/units', [StockStatusController::class, 'units']);
    $router->get('/api/stock-status/export-all', [StockStatusController::class, 'exportAll']);

    // Also support /api/v1/stock-status aliases
    $router->get('/api/v1/stock-status/list', [StockStatusController::class, 'list']);
    $router->get('/api/v1/stock-status/view', [StockStatusController::class, 'view']);
    $router->post('/api/v1/stock-status/create', [StockStatusController::class, 'create']);
    $router->put('/api/v1/stock-status/update', [StockStatusController::class, 'update']);
    $router->delete('/api/v1/stock-status/delete', [StockStatusController::class, 'delete']);
    $router->get('/api/v1/stock-status/units', [StockStatusController::class, 'units']);
    $router->get('/api/v1/stock-status/export-all', [StockStatusController::class, 'exportAll']);

    // -------------------------------------------------------------
    // Metal Stock Management Routes (/api/metal-stock)
    // -------------------------------------------------------------
    $router->get('/api/metal-stock/list', [MetalStockController::class, 'list']);
    $router->get('/api/metal-stock/view', [MetalStockController::class, 'view']);
    $router->post('/api/metal-stock/create', [MetalStockController::class, 'create']);
    $router->put('/api/metal-stock/update', [MetalStockController::class, 'update']);
    $router->delete('/api/metal-stock/delete', [MetalStockController::class, 'delete']);
    $router->get('/api/metal-stock/filter-options', [MetalStockController::class, 'filterOptions']);
    $router->get('/api/metal-stock/stock-types', [MetalStockController::class, 'stockTypes']);
    $router->get('/api/metal-stock/metal-types', [MetalStockController::class, 'metalTypes']);
    $router->get('/api/stock-types', [StockTypeController::class, 'index']);
    $router->get('/api/settings/stock-types', [StockTypeController::class, 'index']);
    $router->post('/api/settings/stock-types', [StockTypeController::class, 'create']);
    $router->put('/api/settings/stock-types/{id}', [StockTypeController::class, 'update']);
    $router->delete('/api/settings/stock-types/{id}', [StockTypeController::class, 'delete']);
    $router->get('/api/metal-stock/export-all', [MetalStockController::class, 'exportAll']);

    // Also support /api/v1/metal-stock aliases
    $router->get('/api/v1/metal-stock/list', [MetalStockController::class, 'list']);
    $router->get('/api/v1/metal-stock/view', [MetalStockController::class, 'view']);
    $router->post('/api/v1/metal-stock/create', [MetalStockController::class, 'create']);
    $router->put('/api/v1/metal-stock/update', [MetalStockController::class, 'update']);
    $router->delete('/api/v1/metal-stock/delete', [MetalStockController::class, 'delete']);
    $router->get('/api/v1/metal-stock/filter-options', [MetalStockController::class, 'filterOptions']);
    $router->get('/api/v1/metal-stock/stock-types', [StockTypeController::class, 'index']);
    $router->get('/api/v1/metal-stock/metal-types', [MetalStockController::class, 'metalTypes']);
    $router->get('/api/v1/stock-types', [StockTypeController::class, 'index']);
    $router->get('/api/v1/settings/stock-types', [StockTypeController::class, 'index']);
    $router->post('/api/v1/settings/stock-types', [StockTypeController::class, 'create']);
    $router->put('/api/v1/settings/stock-types/{id}', [StockTypeController::class, 'update']);
    $router->delete('/api/v1/settings/stock-types/{id}', [StockTypeController::class, 'delete']);
    $router->get('/api/v1/metal-stock/export-all', [MetalStockController::class, 'exportAll']);

    // -------------------------------------------------------------
    // Daily Balance Management Routes (/api/daily-balance)
    // -------------------------------------------------------------
    $router->get('/api/daily-balance/list', [DailyBalanceController::class, 'list']);
    $router->get('/api/daily-balance/view', [DailyBalanceController::class, 'view']);
    $router->post('/api/daily-balance/create', [DailyBalanceController::class, 'create']);
    $router->put('/api/daily-balance/update', [DailyBalanceController::class, 'update']);
    $router->delete('/api/daily-balance/delete', [DailyBalanceController::class, 'delete']);
    $router->get('/api/daily-balance/filter-options', [DailyBalanceController::class, 'filterOptions']);
    $router->get('/api/daily-balance/accounts-lookup', [DailyBalanceController::class, 'accountsLookup']);
    $router->get('/api/daily-balance/export-all', [DailyBalanceController::class, 'exportAll']);

    // Also support /api/v1/daily-balance aliases
    $router->get('/api/v1/daily-balance', [DailyBalanceController::class, 'list']);
    $router->get('/api/v1/daily-balance/list', [DailyBalanceController::class, 'list']);
    $router->get('/api/v1/daily-balance/view', [DailyBalanceController::class, 'view']);
    $router->post('/api/v1/daily-balance/create', [DailyBalanceController::class, 'create']);
    $router->put('/api/v1/daily-balance/update', [DailyBalanceController::class, 'update']);
    $router->delete('/api/v1/daily-balance/delete', [DailyBalanceController::class, 'delete']);
    $router->get('/api/v1/daily-balance/filter-options', [DailyBalanceController::class, 'filterOptions']);
    $router->get('/api/v1/daily-balance/accounts-lookup', [DailyBalanceController::class, 'accountsLookup']);
    $router->get('/api/v1/daily-balance/export-all', [DailyBalanceController::class, 'exportAll']);

    $router->get('/api/v1/invoices', [VoucherController::class, 'listVouchers']);
    $router->get('/api/v1/invoices/{id}', [VoucherController::class, 'getVoucher']);
    $router->post('/api/v1/vouchers', [VoucherController::class, 'createVoucher']);
    $router->put('/api/v1/vouchers/{id}', [VoucherController::class, 'updateVoucher']);
    $router->delete('/api/v1/vouchers/{id}', [VoucherController::class, 'deleteVoucher']);
    $router->get('/api/voucher/previous', [VoucherController::class, 'fetchPreviousVoucher']);
    $router->get('/api/voucher/next', [VoucherController::class, 'fetchNextVoucher']);
    $router->get('/api/v1/vouchers/search', [VoucherController::class, 'searchVouchers']);

    // -------------------------------------------------------------
    // Daily Transactions Management Routes (/api/v1/daily-transactions)
    // -------------------------------------------------------------
    $router->get('/api/v1/daily-transactions', [DailyTransactionController::class, 'list']);
    $router->get('/api/v1/daily-transactions/summary', [DailyTransactionController::class, 'summary']);
    $router->get('/api/v1/daily-transactions/export', [DailyTransactionController::class, 'export']);
    $router->get('/api/v1/daily-transactions/filter-options', [DailyTransactionController::class, 'filterOptions']);
    $router->get('/api/v1/daily-transactions/{id}', [DailyTransactionController::class, 'view']);
    $router->post('/api/v1/daily-transactions', [DailyTransactionController::class, 'create']);
    $router->put('/api/v1/daily-transactions/{id}', [DailyTransactionController::class, 'update']);
    $router->delete('/api/v1/daily-transactions/{id}', [DailyTransactionController::class, 'delete']);

    // Also support /api/daily-transactions and /api/transactions aliases
    $router->get('/api/daily-transactions', [DailyTransactionController::class, 'list']);
    $router->get('/api/daily-transactions/summary', [DailyTransactionController::class, 'summary']);
    $router->get('/api/daily-transactions/export', [DailyTransactionController::class, 'export']);
    $router->get('/api/daily-transactions/filter-options', [DailyTransactionController::class, 'filterOptions']);
    $router->get('/api/daily-transactions/{id}', [DailyTransactionController::class, 'view']);
    $router->post('/api/daily-transactions', [DailyTransactionController::class, 'create']);
    $router->put('/api/daily-transactions/{id}', [DailyTransactionController::class, 'update']);
    $router->delete('/api/daily-transactions/{id}', [DailyTransactionController::class, 'delete']);

    $router->get('/api/transactions', [DailyTransactionController::class, 'list']);
    $router->get('/api/v1/transactions', [DailyTransactionController::class, 'list']);
    $router->get('/api/v1/transactions/summary', [DailyTransactionController::class, 'summary']);
    $router->get('/api/v1/transactions/{id}', [DailyTransactionController::class, 'view']);

    // -------------------------------------------------------------
    // Customer Management Routes (/api/customers and /api/v1/customers)
    // -------------------------------------------------------------
    $router->get('/api/customers', [CustomerController::class, 'listCustomers']);
    $router->get('/api/customers/list', [CustomerController::class, 'listCustomers']);
    $router->get('/api/customers/view', [CustomerController::class, 'getCustomer']);
    $router->get('/api/customers/{id}', [CustomerController::class, 'getCustomer']);
    $router->post('/api/customers', [CustomerController::class, 'createCustomer']);
    $router->post('/api/customers/create', [CustomerController::class, 'createCustomer']);
    $router->put('/api/customers/update', [CustomerController::class, 'updateCustomer']);
    $router->put('/api/customers/{id}', [CustomerController::class, 'updateCustomer']);
    $router->post('/api/customers/update', [CustomerController::class, 'updateCustomer']);
    $router->delete('/api/customers/delete', [CustomerController::class, 'deleteCustomer']);
    $router->delete('/api/customers/{id}', [CustomerController::class, 'deleteCustomer']);
    $router->post('/api/customers/delete', [CustomerController::class, 'deleteCustomer']);

    // Also support RESTful /api/v1/customers
    $router->get('/api/v1/customers', [CustomerController::class, 'listCustomers']);
    $router->get('/api/v1/customers/{id}', [CustomerController::class, 'getCustomer']);
    $router->post('/api/v1/customers', [CustomerController::class, 'createCustomer']);
    $router->put('/api/v1/customers/{id}', [CustomerController::class, 'updateCustomer']);
    $router->delete('/api/v1/customers/{id}', [CustomerController::class, 'deleteCustomer']);

    // -------------------------------------------------------------
    // Silver Bullion Routes (/api/silver-bullion & /api/v1/silver-bullion)
    // -------------------------------------------------------------
    $router->get('/api/v1/silver-bullion', [SilverBullionController::class, 'list']);
    $router->get('/api/v1/silver-bullion/filter-options', [SilverBullionController::class, 'filterOptions']);
    $router->get('/api/v1/silver-bullion/export', [SilverBullionController::class, 'export']);
    $router->get('/api/v1/silver-bullion/{id}', [SilverBullionController::class, 'view']);
    $router->post('/api/v1/silver-bullion', [SilverBullionController::class, 'create']);
    $router->put('/api/v1/silver-bullion/{id}', [SilverBullionController::class, 'update']);
    $router->delete('/api/v1/silver-bullion/{id}', [SilverBullionController::class, 'delete']);

    $router->get('/api/silver-bullion', [SilverBullionController::class, 'list']);
    $router->get('/api/silver-bullion/filter-options', [SilverBullionController::class, 'filterOptions']);
    $router->get('/api/silver-bullion/export', [SilverBullionController::class, 'export']);
    $router->get('/api/silver-bullion/{id}', [SilverBullionController::class, 'view']);
    $router->post('/api/silver-bullion', [SilverBullionController::class, 'create']);
    $router->put('/api/silver-bullion/{id}', [SilverBullionController::class, 'update']);
    $router->delete('/api/silver-bullion/{id}', [SilverBullionController::class, 'delete']);

    // -------------------------------------------------------------
    // Purchase Register Routes (/api/purchase-register & /api/v1/purchase-register)
    // -------------------------------------------------------------
    $router->get('/api/v1/purchase-register', [PurchaseRegisterController::class, 'list']);
    $router->get('/api/v1/purchase-register/filter-options', [PurchaseRegisterController::class, 'filterOptions']);
    $router->get('/api/v1/purchase-register/summary', [PurchaseRegisterController::class, 'summary']);
    $router->get('/api/v1/purchase-register/export', [PurchaseRegisterController::class, 'export']);
    $router->get('/api/v1/purchase-register/{id}', [PurchaseRegisterController::class, 'view']);
    $router->post('/api/v1/purchase-register', [PurchaseRegisterController::class, 'create']);
    $router->put('/api/v1/purchase-register/{id}', [PurchaseRegisterController::class, 'update']);
    $router->delete('/api/v1/purchase-register/{id}', [PurchaseRegisterController::class, 'delete']);

    $router->get('/api/purchase-register', [PurchaseRegisterController::class, 'list']);
    $router->get('/api/purchase-register/filter-options', [PurchaseRegisterController::class, 'filterOptions']);
    $router->get('/api/purchase-register/summary', [PurchaseRegisterController::class, 'summary']);
    $router->get('/api/purchase-register/export', [PurchaseRegisterController::class, 'export']);
    $router->get('/api/purchase-register/{id}', [PurchaseRegisterController::class, 'view']);
    $router->post('/api/purchase-register', [PurchaseRegisterController::class, 'create']);
    $router->put('/api/purchase-register/{id}', [PurchaseRegisterController::class, 'update']);
    $router->delete('/api/purchase-register/{id}', [PurchaseRegisterController::class, 'delete']);

    // -------------------------------------------------------------
    // Sale Register Routes (/api/sale-register & /api/v1/sale-register)
    // -------------------------------------------------------------
    $router->get('/api/v1/sale-register', [SaleRegisterController::class, 'list']);
    $router->get('/api/v1/sale-register/filter-options', [SaleRegisterController::class, 'filterOptions']);
    $router->get('/api/v1/sale-register/summary', [SaleRegisterController::class, 'summary']);
    $router->get('/api/v1/sale-register/export', [SaleRegisterController::class, 'export']);
    $router->get('/api/v1/sale-register/{id}', [SaleRegisterController::class, 'view']);
    $router->post('/api/v1/sale-register', [SaleRegisterController::class, 'create']);
    $router->put('/api/v1/sale-register/{id}', [SaleRegisterController::class, 'update']);
    $router->delete('/api/v1/sale-register/{id}', [SaleRegisterController::class, 'delete']);

    $router->get('/api/sale-register', [SaleRegisterController::class, 'list']);
    $router->get('/api/sale-register/filter-options', [SaleRegisterController::class, 'filterOptions']);
    $router->get('/api/sale-register/summary', [SaleRegisterController::class, 'summary']);
    $router->get('/api/sale-register/export', [SaleRegisterController::class, 'export']);
    $router->get('/api/sale-register/{id}', [SaleRegisterController::class, 'view']);
    $router->post('/api/sale-register', [SaleRegisterController::class, 'create']);
    $router->put('/api/sale-register/{id}', [SaleRegisterController::class, 'update']);
    $router->delete('/api/sale-register/{id}', [SaleRegisterController::class, 'delete']);

    // -------------------------------------------------------------
    // Customer Wise Profit Report Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/customer-profit-report', [CustomerProfitReportController::class, 'list']);
    $router->get('/api/v1/customer-profit-report/summary', [CustomerProfitReportController::class, 'summary']);
    $router->get('/api/v1/customer-profit-report/filter-options', [CustomerProfitReportController::class, 'filterOptions']);
    $router->get('/api/v1/customer-profit-report/export', [CustomerProfitReportController::class, 'export']);

    $router->get('/api/customer-profit-report', [CustomerProfitReportController::class, 'list']);
    $router->get('/api/customer-profit-report/summary', [CustomerProfitReportController::class, 'summary']);
    $router->get('/api/customer-profit-report/filter-options', [CustomerProfitReportController::class, 'filterOptions']);
    $router->get('/api/customer-profit-report/export', [CustomerProfitReportController::class, 'export']);

    // -------------------------------------------------------------
    // Age Wise List / Ageing Analysis Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/age-wise/groups', [AgeWiseReportController::class, 'groups']);
    $router->get('/api/v1/age-wise/filter-options', [AgeWiseReportController::class, 'filterOptions']);
    $router->get('/api/v1/age-wise/report', [AgeWiseReportController::class, 'report']);
    $router->get('/api/v1/age-wise/summary', [AgeWiseReportController::class, 'report']);
    $router->get('/api/v1/age-wise/ledger', [AgeWiseReportController::class, 'ledger']);
    $router->get('/api/v1/age-wise/export', [AgeWiseReportController::class, 'export']);

    $router->get('/api/age-wise/groups', [AgeWiseReportController::class, 'groups']);
    $router->get('/api/age-wise/filter-options', [AgeWiseReportController::class, 'filterOptions']);
    $router->get('/api/age-wise/report', [AgeWiseReportController::class, 'report']);
    $router->get('/api/age-wise/summary', [AgeWiseReportController::class, 'report']);
    $router->get('/api/age-wise/ledger', [AgeWiseReportController::class, 'ledger']);
    $router->get('/api/age-wise/export', [AgeWiseReportController::class, 'export']);

    // -------------------------------------------------------------
    // Karigar Master Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/karigar/filter-options', [KarigarController::class, 'filterOptions']);
    $router->get('/api/v1/karigar/next-code',      [KarigarController::class, 'nextCode']);
    $router->get('/api/v1/karigar/export',         [KarigarController::class, 'export']);
    $router->get('/api/v1/karigar/{id}',           [KarigarController::class, 'view']);
    $router->get('/api/v1/karigar',                [KarigarController::class, 'list']);
    $router->post('/api/v1/karigar',               [KarigarController::class, 'create']);
    $router->put('/api/v1/karigar/{id}',           [KarigarController::class, 'update']);
    $router->patch('/api/v1/karigar/{id}/toggle-status', [KarigarController::class, 'toggleStatus']);
    $router->delete('/api/v1/karigar/{id}',        [KarigarController::class, 'delete']);

    $router->get('/api/karigar/filter-options', [KarigarController::class, 'filterOptions']);
    $router->get('/api/karigar/next-code',      [KarigarController::class, 'nextCode']);
    $router->get('/api/karigar/export',         [KarigarController::class, 'export']);
    $router->get('/api/karigar/{id}',           [KarigarController::class, 'view']);
    $router->get('/api/karigar',                [KarigarController::class, 'list']);
    $router->post('/api/karigar',               [KarigarController::class, 'create']);
    $router->put('/api/karigar/{id}',           [KarigarController::class, 'update']);
    $router->patch('/api/karigar/{id}/toggle-status', [KarigarController::class, 'toggleStatus']);
    $router->delete('/api/karigar/{id}',        [KarigarController::class, 'delete']);

    // -------------------------------------------------------------
    // Karigar Issue Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/karigar-issue/filter-options', [KarigarIssueController::class, 'filterOptions']);
    $router->get('/api/v1/karigar-issue/{id}',           [KarigarIssueController::class, 'view']);
    $router->get('/api/v1/karigar-issue',                [KarigarIssueController::class, 'list']);
    $router->post('/api/v1/karigar-issue',               [KarigarIssueController::class, 'create']);
    $router->put('/api/v1/karigar-issue/{id}',           [KarigarIssueController::class, 'update']);
    $router->delete('/api/v1/karigar-issue/{id}',        [KarigarIssueController::class, 'delete']);

    $router->get('/api/karigar-issue/filter-options', [KarigarIssueController::class, 'filterOptions']);
    $router->get('/api/karigar-issue/{id}',           [KarigarIssueController::class, 'view']);
    $router->get('/api/karigar-issue',                [KarigarIssueController::class, 'list']);
    $router->post('/api/karigar-issue',               [KarigarIssueController::class, 'create']);
    $router->put('/api/karigar-issue/{id}',           [KarigarIssueController::class, 'update']);
    $router->delete('/api/karigar-issue/{id}',        [KarigarIssueController::class, 'delete']);

    // -------------------------------------------------------------
    // Karigar Receive Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/karigar-receive/filter-options',     [KarigarReceiveController::class, 'filterOptions']);
    $router->get('/api/v1/karigar-receive/outstanding',        [KarigarReceiveController::class, 'outstanding']);
    $router->get('/api/v1/karigar-receive/issue-rec-report',   [KarigarReceiveController::class, 'issueReceiveReport']);
    $router->get('/api/v1/karigar-receive/lot-report',         [KarigarReceiveController::class, 'lotReport']);
    $router->get('/api/v1/karigar-receive/dia-stn-balance',    [KarigarReceiveController::class, 'diaStnBalance']);
    $router->get('/api/v1/karigar-receive/dia-stn-group-bal',  [KarigarReceiveController::class, 'diaStnGroupBalance']);
    $router->get('/api/v1/karigar-receive/dia-stn-issue-rec',  [KarigarReceiveController::class, 'diaStnIssueReceive']);
    $router->get('/api/v1/karigar-receive/{id}',               [KarigarReceiveController::class, 'view']);
    $router->get('/api/v1/karigar-receive',                    [KarigarReceiveController::class, 'list']);
    $router->post('/api/v1/karigar-receive',                   [KarigarReceiveController::class, 'create']);
    $router->delete('/api/v1/karigar-receive/{id}',            [KarigarReceiveController::class, 'delete']);

    $router->get('/api/karigar-receive/filter-options',     [KarigarReceiveController::class, 'filterOptions']);
    $router->get('/api/karigar-receive/outstanding',        [KarigarReceiveController::class, 'outstanding']);
    $router->get('/api/karigar-receive/issue-rec-report',   [KarigarReceiveController::class, 'issueReceiveReport']);
    $router->get('/api/karigar-receive/lot-report',         [KarigarReceiveController::class, 'lotReport']);
    $router->get('/api/karigar-receive/dia-stn-balance',    [KarigarReceiveController::class, 'diaStnBalance']);
    $router->get('/api/karigar-receive/dia-stn-group-bal',  [KarigarReceiveController::class, 'diaStnGroupBalance']);
    $router->get('/api/karigar-receive/dia-stn-issue-rec',  [KarigarReceiveController::class, 'diaStnIssueReceive']);
    $router->get('/api/karigar-receive/{id}',               [KarigarReceiveController::class, 'view']);
    $router->get('/api/karigar-receive',                    [KarigarReceiveController::class, 'list']);
    $router->post('/api/karigar-receive',                   [KarigarReceiveController::class, 'create']);
    $router->delete('/api/karigar-receive/{id}',            [KarigarReceiveController::class, 'delete']);

    // -------------------------------------------------------------
    // Account Groups Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/account-groups/dropdown',      [AccountGroupController::class, 'dropdown']);
    $router->get('/api/v1/account-groups/{id}',          [AccountGroupController::class, 'getById']);
    $router->get('/api/v1/account-groups',               [AccountGroupController::class, 'list']);
    $router->post('/api/v1/account-groups',              [AccountGroupController::class, 'create']);
    $router->put('/api/v1/account-groups/{id}',          [AccountGroupController::class, 'update']);
    $router->patch('/api/v1/account-groups/{id}/toggle', [AccountGroupController::class, 'toggleStatus']);
    $router->delete('/api/v1/account-groups/{id}',       [AccountGroupController::class, 'delete']);

    $router->get('/api/account-groups/dropdown',      [AccountGroupController::class, 'dropdown']);
    $router->get('/api/account-groups/{id}',          [AccountGroupController::class, 'getById']);
    $router->get('/api/account-groups',               [AccountGroupController::class, 'list']);
    $router->post('/api/account-groups',              [AccountGroupController::class, 'create']);
    $router->put('/api/account-groups/{id}',          [AccountGroupController::class, 'update']);
    $router->patch('/api/account-groups/{id}/toggle', [AccountGroupController::class, 'toggleStatus']);
    $router->delete('/api/account-groups/{id}',       [AccountGroupController::class, 'delete']);

    // -------------------------------------------------------------
    // Ledger Master Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/ledger/next-code',      [LedgerController::class, 'nextCode']);
    $router->get('/api/v1/ledger/dropdown',       [LedgerController::class, 'dropdown']);
    $router->get('/api/v1/ledger/filter-options', [LedgerController::class, 'filterOptions']);
    $router->get('/api/v1/ledger/balance',        [LedgerController::class, 'balance']);
    $router->get('/api/v1/ledger/book',           [LedgerController::class, 'book']);
    $router->get('/api/v1/ledger/{id}',           [LedgerController::class, 'getById']);
    $router->get('/api/v1/ledger',                [LedgerController::class, 'list']);
    $router->post('/api/v1/ledger',               [LedgerController::class, 'create']);
    $router->put('/api/v1/ledger/{id}',           [LedgerController::class, 'update']);
    $router->delete('/api/v1/ledger/{id}',        [LedgerController::class, 'delete']);

    $router->get('/api/ledger/next-code',      [LedgerController::class, 'nextCode']);
    $router->get('/api/ledger/dropdown',       [LedgerController::class, 'dropdown']);
    $router->get('/api/ledger/filter-options', [LedgerController::class, 'filterOptions']);
    $router->get('/api/ledger/balance',        [LedgerController::class, 'balance']);
    $router->get('/api/ledger/book',           [LedgerController::class, 'book']);
    $router->get('/api/ledger/{id}',           [LedgerController::class, 'getById']);
    $router->get('/api/ledger',                [LedgerController::class, 'list']);
    $router->post('/api/ledger',               [LedgerController::class, 'create']);
    $router->put('/api/ledger/{id}',           [LedgerController::class, 'update']);
    $router->delete('/api/ledger/{id}',        [LedgerController::class, 'delete']);

    // -------------------------------------------------------------
    // Accounting Vouchers Routes (Receipt/Payment/Contra/Journal)
    // -------------------------------------------------------------
    $router->get('/api/v1/accounting-vouchers/open-invoices', [AccountingVoucherController::class, 'openInvoices']);
    $router->get('/api/v1/accounting-vouchers/next-no',       [AccountingVoucherController::class, 'nextVoucherNo']);
    $router->get('/api/v1/accounting-vouchers/adjacent',      [AccountingVoucherController::class, 'adjacent']);
    $router->get('/api/v1/accounting-vouchers/branches',      [AccountingVoucherController::class, 'branches']);
    $router->get('/api/v1/accounting-vouchers/{id}',     [AccountingVoucherController::class, 'getById']);
    $router->get('/api/v1/accounting-vouchers',          [AccountingVoucherController::class, 'list']);
    $router->post('/api/v1/accounting-vouchers',         [AccountingVoucherController::class, 'create']);
    $router->put('/api/v1/accounting-vouchers/{id}',     [AccountingVoucherController::class, 'update']);
    $router->delete('/api/v1/accounting-vouchers/{id}',  [AccountingVoucherController::class, 'delete']);

    $router->get('/api/accounting-vouchers/open-invoices', [AccountingVoucherController::class, 'openInvoices']);
    $router->get('/api/accounting-vouchers/next-no',       [AccountingVoucherController::class, 'nextVoucherNo']);
    $router->get('/api/accounting-vouchers/adjacent',      [AccountingVoucherController::class, 'adjacent']);
    $router->get('/api/accounting-vouchers/branches',      [AccountingVoucherController::class, 'branches']);
    $router->get('/api/accounting-vouchers/{id}',     [AccountingVoucherController::class, 'getById']);
    $router->get('/api/accounting-vouchers',          [AccountingVoucherController::class, 'list']);
    $router->post('/api/accounting-vouchers',         [AccountingVoucherController::class, 'create']);
    $router->put('/api/accounting-vouchers/{id}',     [AccountingVoucherController::class, 'update']);
    $router->delete('/api/accounting-vouchers/{id}',  [AccountingVoucherController::class, 'delete']);

    // -------------------------------------------------------------
    // Accounting Reports Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/reports/trial-balance',          [AccountingReportController::class, 'trialBalance']);
    $router->get('/api/v1/reports/day-book',               [AccountingReportController::class, 'dayBook']);
    $router->get('/api/v1/reports/cash-book',              [AccountingReportController::class, 'cashBook']);
    $router->get('/api/v1/reports/bank-book',              [AccountingReportController::class, 'bankBook']);
    $router->get('/api/v1/reports/outstanding-receivable', [AccountingReportController::class, 'outstandingReceivable']);
    $router->get('/api/v1/reports/outstanding-payable',    [AccountingReportController::class, 'outstandingPayable']);
    $router->get('/api/v1/reports/profit-loss',            [AccountingReportController::class, 'profitLoss']);
    $router->get('/api/v1/reports/balance-sheet',          [AccountingReportController::class, 'balanceSheet']);
    $router->get('/api/v1/reports/invoice-status',         [AccountingReportController::class, 'invoiceStatusReport']);

    $router->get('/api/reports/trial-balance',          [AccountingReportController::class, 'trialBalance']);
    $router->get('/api/reports/day-book',               [AccountingReportController::class, 'dayBook']);
    $router->get('/api/reports/cash-book',              [AccountingReportController::class, 'cashBook']);
    $router->get('/api/reports/bank-book',              [AccountingReportController::class, 'bankBook']);
    $router->get('/api/reports/outstanding-receivable', [AccountingReportController::class, 'outstandingReceivable']);
    $router->get('/api/reports/outstanding-payable',    [AccountingReportController::class, 'outstandingPayable']);
    $router->get('/api/reports/profit-loss',            [AccountingReportController::class, 'profitLoss']);
    $router->get('/api/reports/balance-sheet',          [AccountingReportController::class, 'balanceSheet']);
    $router->get('/api/reports/invoice-status',         [AccountingReportController::class, 'invoiceStatusReport']);

    // -------------------------------------------------------------
    // Sales Return & Purchase Return Routes
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // Unit Master Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/units/active',      [UnitController::class, 'getActive']);
    $router->get('/api/v1/units',             [UnitController::class, 'list']);
    $router->post('/api/v1/units',            [UnitController::class, 'create']);
    $router->put('/api/v1/units/{id}',        [UnitController::class, 'update']);
    $router->delete('/api/v1/units/{id}',     [UnitController::class, 'delete']);
    $router->patch('/api/v1/units/{id}/toggle', [UnitController::class, 'toggleStatus']);

    $router->get('/api/units/active',         [UnitController::class, 'getActive']);
    $router->get('/api/units',                [UnitController::class, 'list']);
    $router->post('/api/units',               [UnitController::class, 'create']);
    $router->put('/api/units/{id}',           [UnitController::class, 'update']);
    $router->delete('/api/units/{id}',        [UnitController::class, 'delete']);
    $router->patch('/api/units/{id}/toggle',  [UnitController::class, 'toggleStatus']);

    // -------------------------------------------------------------
    // Sales Return & Purchase Return Routes
    // -------------------------------------------------------------
    $router->get('/api/v1/sale-returns',         [ReturnController::class, 'listSaleReturns']);
    $router->post('/api/v1/sale-returns',        [ReturnController::class, 'createSaleReturn']);
    $router->delete('/api/v1/sale-returns/{id}', [ReturnController::class, 'deleteSaleReturn']);
    $router->get('/api/sale-returns',            [ReturnController::class, 'listSaleReturns']);
    $router->post('/api/sale-returns',           [ReturnController::class, 'createSaleReturn']);
    $router->delete('/api/sale-returns/{id}',    [ReturnController::class, 'deleteSaleReturn']);

    $router->get('/api/v1/purchase-returns',         [ReturnController::class, 'listPurchaseReturns']);
    $router->post('/api/v1/purchase-returns',        [ReturnController::class, 'createPurchaseReturn']);
    $router->delete('/api/v1/purchase-returns/{id}', [ReturnController::class, 'deletePurchaseReturn']);
    $router->get('/api/purchase-returns',            [ReturnController::class, 'listPurchaseReturns']);
    $router->post('/api/purchase-returns',           [ReturnController::class, 'createPurchaseReturn']);
    $router->delete('/api/purchase-returns/{id}',    [ReturnController::class, 'deletePurchaseReturn']);
}
