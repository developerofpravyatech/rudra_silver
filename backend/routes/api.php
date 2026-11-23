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

function registerRoutes(Router $router): void {
    // -------------------------------------------------------------
    // Authentication Routes (/api/v1/auth)
    // -------------------------------------------------------------
    $router->post('/api/v1/auth/register', [AuthController::class, 'register']);
    $router->post('/api/v1/auth/login', [AuthController::class, 'login']);
    $router->get('/api/v1/auth/me', [AuthController::class, 'me']);
    $router->post('/api/v1/auth/logout', [AuthController::class, 'logout']);

    // Forgot Password & OTP Flow
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
    $router->get('/api/stock-types', [MetalStockController::class, 'stockTypes']);
    $router->get('/api/settings/stock-types', [MetalStockController::class, 'stockTypes']);
    $router->get('/api/metal-stock/export-all', [MetalStockController::class, 'exportAll']);

    // Also support /api/v1/metal-stock aliases
    $router->get('/api/v1/metal-stock/list', [MetalStockController::class, 'list']);
    $router->get('/api/v1/metal-stock/view', [MetalStockController::class, 'view']);
    $router->post('/api/v1/metal-stock/create', [MetalStockController::class, 'create']);
    $router->put('/api/v1/metal-stock/update', [MetalStockController::class, 'update']);
    $router->delete('/api/v1/metal-stock/delete', [MetalStockController::class, 'delete']);
    $router->get('/api/v1/metal-stock/filter-options', [MetalStockController::class, 'filterOptions']);
    $router->get('/api/v1/metal-stock/stock-types', [MetalStockController::class, 'stockTypes']);
    $router->get('/api/v1/metal-stock/metal-types', [MetalStockController::class, 'metalTypes']);
    $router->get('/api/v1/stock-types', [MetalStockController::class, 'stockTypes']);
    $router->get('/api/v1/settings/stock-types', [MetalStockController::class, 'stockTypes']);
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
    $router->get('/api/v1/transactions', [TransactionController::class, 'listTransactions']);
    $router->get('/api/v1/transactions/summary', [TransactionController::class, 'getTransactionSummary']);
    $router->get('/api/v1/transactions/{id}', [TransactionController::class, 'getTransaction']);

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
}
