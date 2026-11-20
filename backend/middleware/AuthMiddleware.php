<?php
namespace Middleware;

use Config\Config;
use Config\Database;
use Helpers\JWT;
use Helpers\Response;
use PDO;

class AuthMiddleware {
    public static function getBearerToken(): ?string {
        $headers = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(
                array_map('ucwords', array_keys($requestHeaders)),
                array_values($requestHeaders)
            );
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }

        if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }

        return null;
    }

    public static function authenticate(): array {
        $token = self::getBearerToken();
        if (!$token) {
            Response::error('Could not validate credentials', 401);
        }

        $secret = Config::get('JWT_SECRET', 'rudra_silver_super_secure_jwt_secret_key_2026_luxury_hallmark');
        $payload = JWT::decode($token, $secret);

        if (!$payload || !isset($payload['sub'])) {
            Response::error('Could not validate credentials', 401);
        }

        $userId = (int)$payload['sub'];
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, mobile, role, is_active, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !(bool)$user['is_active']) {
            Response::error('Could not validate credentials', 401);
        }

        // Standardize types
        $user['id'] = (int)$user['id'];
        $user['is_active'] = (bool)$user['is_active'];

        return $user;
    }

    public static function requireAdmin(): array {
        $user = self::authenticate();
        if ($user['role'] !== 'ADMIN') {
            Response::error('Admin privileges required', 403);
        }
        return $user;
    }
}
