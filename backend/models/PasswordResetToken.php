<?php
namespace Models;

use Config\Database;
use PDO;

class PasswordResetToken {
    /**
     * Create a cryptographically secure reset token and store its SHA-256 hash.
     * Returns the raw unhashed 64-char hex token to be sent in the reset URL.
     */
    public static function createToken(int $userId, int $expireMinutes = 60): string {
        $db = Database::getConnection();

        // Invalidate any existing unused tokens for this user
        $stmt = $db->prepare('UPDATE password_reset_tokens SET is_used = 1 WHERE user_id = :uid AND is_used = 0');
        $stmt->execute([':uid' => $userId]);

        // Generate 32 bytes of secure random bytes -> 64-character hex string
        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);

        $expiresAt = date('Y-m-d H:i:s', time() + ($expireMinutes * 60));

        $stmt = $db->prepare('
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, is_used, created_at)
            VALUES (:user_id, :token_hash, :expires_at, 0, NOW())
        ');
        $stmt->execute([
            ':user_id'    => $userId,
            ':token_hash' => $tokenHash,
            ':expires_at' => $expiresAt
        ]);

        return $rawToken;
    }

    /**
     * Find a valid, unexpired, unused token by its raw token string.
     */
    public static function findValidToken(string $rawToken): ?array {
        if (empty($rawToken)) {
            return null;
        }

        $tokenHash = hash('sha256', $rawToken);
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT prt.*, u.name, u.email, u.mobile, u.is_active
            FROM password_reset_tokens prt
            JOIN users u ON u.id = prt.user_id
            WHERE prt.token_hash = :hash
              AND prt.is_used = 0
              AND prt.expires_at > NOW()
            LIMIT 1
        ');
        $stmt->execute([':hash' => $tokenHash]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        return $res ?: null;
    }

    /**
     * Mark a token as used.
     */
    public static function markUsed(int $tokenId): void {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE password_reset_tokens SET is_used = 1 WHERE id = :id');
        $stmt->execute([':id' => $tokenId]);
    }
}
