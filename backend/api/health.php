<?php
/**
 * RUDRA SILVER ERP - System & Database Health Check API
 * Verifies Core PHP 8.2+ runtime, PDO MySQL database connectivity, and REST status.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Kolkata');

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';

try {
    \Config\Config::load(__DIR__ . '/../.env');
    $pdo = \Config\Database::getConnection();

    $stmt = $pdo->query('SELECT DATABASE() AS current_db, VERSION() AS mysql_version');
    $dbInfo = $stmt->fetch(\PDO::FETCH_ASSOC);

    $tablesStmt = $pdo->query('SHOW TABLES');
    $tables = $tablesStmt->fetchAll(\PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'app_name' => 'RUDRA SILVER',
        'status' => 'online',
        'message' => 'PHP backend and MySQL PDO connection are fully operational.',
        'environment' => [
            'php_version' => PHP_VERSION,
            'pdo_driver'  => $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME),
            'mysql_version' => $dbInfo['mysql_version'] ?? 'unknown',
            'database'    => $dbInfo['current_db'] ?? 'rudra_silver',
            'total_tables' => count($tables),
            'server_time' => date('Y-m-d H:i:s T')
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'app_name' => 'RUDRA SILVER',
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'error_details' => [
            'file' => basename($e->getFile()),
            'line' => $e->getLine()
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}
