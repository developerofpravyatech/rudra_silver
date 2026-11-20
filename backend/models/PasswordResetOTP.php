<?php
namespace Models;

use Config\Database;
use PDO;

class PasswordResetOTP {
    public static function create(string $mobile, string $otpHash, int $expireMinutes = 5): int {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO password_reset_otps (mobile, otp_hash, expires_at, attempts, is_used, created_at)
            VALUES (:mobile, :otp_hash, DATE_ADD(NOW(), INTERVAL :expire_minutes MINUTE), 0, 0, NOW())
        ');
        $stmt->execute([
            'mobile'         => $mobile,
            'otp_hash'       => $otpHash,
            'expire_minutes' => $expireMinutes,
        ]);
        return (int)$db->lastInsertId();
    }

    public static function findLatestActive(string $mobile): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT * FROM password_reset_otps
            WHERE mobile = :mobile AND is_used = 0 AND expires_at >= NOW()
            ORDER BY id DESC LIMIT 1
        ');
        $stmt->execute(['mobile' => $mobile]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public static function findRecent(string $mobile): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT * FROM password_reset_otps
            WHERE mobile = :mobile
            ORDER BY id DESC LIMIT 1
        ');
        $stmt->execute(['mobile' => $mobile]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public static function incrementAttempts(int $id): void {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public static function markUsed(int $id): void {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE password_reset_otps SET is_used = 1 WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
