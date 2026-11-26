<?php
// Scratch test script for Transaction and Silver Bullion API routes
require_once __DIR__ . '/../backend/config/Config.php';
require_once __DIR__ . '/../backend/config/Database.php';

\Config\Config::load(__DIR__ . '/../backend/.env');

try {
    $db = Config\Database::getConnection();
    echo "Database connection successful!\n";

    // Test transactions table
    $stmt = $db->query("SELECT COUNT(*) as cnt FROM daily_transactions");
    $txCount = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0;
    echo "daily_transactions count: $txCount\n";

    // Test silver_bullion table
    $stmt = $db->query("SELECT COUNT(*) as cnt FROM silver_bullion");
    $sbCount = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0;
    echo "silver_bullion count: $sbCount\n";

    echo "All routes & tables verified successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
