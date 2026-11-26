<?php
declare(strict_types=1);

spl_autoload_register(function (string $class) {
    $file = __DIR__ . '/../' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

\Config\Config::load(__DIR__ . '/../.env');
$db = \Config\Database::getConnection();

echo "--- RUNNING AUTH DATABASE MIGRATION ---\n";

// 1. Modify mobile column in users to be nullable so email-only accounts work cleanly
try {
    $db->exec("ALTER TABLE users MODIFY COLUMN mobile VARCHAR(20) NULL DEFAULT NULL");
    echo "✓ Modified users.mobile to NULLABLE\n";
} catch (\Throwable $e) {
    echo "! Note on users.mobile: " . $e->getMessage() . "\n";
}

// 2. Ensure email column is unique
try {
    $db->exec("ALTER TABLE users MODIFY COLUMN email VARCHAR(191) NULL DEFAULT NULL");
    // Check if unique index exists
    $indexes = $db->query("SHOW INDEX FROM users WHERE Key_name = 'users_email_unique'")->fetchAll();
    if (empty($indexes)) {
        $db->exec("ALTER TABLE users ADD UNIQUE KEY users_email_unique (email)");
        echo "✓ Added unique index users_email_unique\n";
    }
} catch (\Throwable $e) {
    echo "! Note on users.email: " . $e->getMessage() . "\n";
}

// 3. Create password_reset_tokens table
$sql = "
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

$db->exec($sql);
echo "✓ password_reset_tokens table verified and ready.\n";

echo "--- MIGRATION COMPLETED SUCCESSFULLY ---\n";
