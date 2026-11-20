<?php
/**
 * Rudra Silver Jewellery ERP — Core PHP 8.2+ REST API Backend
 * Modern, Clean Architecture with PDO, MySQL 8+, JWT, and RESTful routing.
 */

declare(strict_types=1);

// Set default timezone for consistency across application
date_default_timezone_set('Asia/Kolkata');

// Error reporting configuration
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Register PSR-4 Style Autoloader for Backend Namespaces
spl_autoload_register(function (string $class) {
    $baseDir = __DIR__ . '/';
    $file = $baseDir . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Load Environment Configuration
\Config\Config::load(__DIR__ . '/.env');

// Handle Cross-Origin Resource Sharing (CORS)
\Middleware\CorsMiddleware::handle();

// Initialize Router & Register Routes
$router = new \Routes\Router();
require_once __DIR__ . '/routes/api.php';
\Routes\registerRoutes($router);

// Dispatch incoming HTTP Request
$router->dispatch();
