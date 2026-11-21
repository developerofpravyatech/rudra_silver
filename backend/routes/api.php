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

    // Item Master & Item Groups (/api/v1/items)
    $router->get('/api/v1/items', [ItemController::class, 'listItems']);
    $router->get('/api/v1/items/{id}', [ItemController::class, 'getItem']);
    $router->post('/api/v1/items', [ItemController::class, 'createItem']);
    $router->put('/api/v1/items/{id}', [ItemController::class, 'updateItem']);
    $router->delete('/api/v1/items/{id}', [ItemController::class, 'deleteItem']);

    $router->get('/api/v1/invoices', [VoucherController::class, 'listVouchers']);
    $router->get('/api/v1/invoices/{id}', [VoucherController::class, 'getVoucher']);
    $router->post('/api/v1/vouchers', [VoucherController::class, 'createVoucher']);
    $router->get('/api/v1/transactions', [TransactionController::class, 'listTransactions']);
    $router->get('/api/v1/transactions/summary', [TransactionController::class, 'getTransactionSummary']);
    $router->get('/api/v1/transactions/{id}', [TransactionController::class, 'getTransaction']);
}
