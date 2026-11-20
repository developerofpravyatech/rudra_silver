<?php
namespace Controllers;

use Config\Config;
use Helpers\JWT;
use Helpers\Response;
use Helpers\Validator;
use Middleware\AuthMiddleware;
use Models\PasswordResetOTP;
use Models\User;
use Services\SmsService;

class AuthController {
    public static function register(): void {
        $body = Validator::getJsonBody();
        $rawMobile = $body['mobile'] ?? '';
        $name      = trim($body['name'] ?? '');
        $password  = $body['password'] ?? '';
        $email     = trim($body['email'] ?? '');

        $cleanMobile = Validator::cleanMobileNumber($rawMobile);
        if (strlen($cleanMobile) < 10) {
            Response::error('Please enter a valid 10-digit mobile number', 400);
        }

        if (empty($name)) {
            Response::error('Full name is required', 400);
        }

        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters', 400);
        }

        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Please enter a valid email address', 400);
        }

        $existing = User::findByMobile($cleanMobile);
        if ($existing) {
            Response::error('This mobile number is already registered', 400);
        }

        if ($email !== '') {
            $existingEmail = User::findByEmail($email);
            if ($existingEmail) {
                Response::error('This email is already registered', 400);
            }
        }

        $totalUsers = User::countAll();
        $role = ($totalUsers === 0) ? 'ADMIN' : 'STAFF';

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $user = User::create($name, $cleanMobile, $hashedPassword, $role, $email ?: null);

        Response::json($user, 201);
    }

    public static function login(): void {
        $body = Validator::getJsonBody();
        $rawMobile = $body['mobile'] ?? $body['email'] ?? '';
        $password  = $body['password'] ?? '';

        $cleanMobile = Validator::cleanMobileNumber($rawMobile);
        if (empty($cleanMobile)) {
            Response::error('Mobile number is required', 400);
        }

        $user = User::findByMobile($cleanMobile);
        if (!$user || !password_verify($password, $user['hashed_password'])) {
            Response::error('Invalid mobile number or password', 401);
        }

        if (!(bool)$user['is_active']) {
            Response::error('Your account has been deactivated. Please contact store management.', 403);
        }

        $secret = Config::get('JWT_SECRET', 'rudra_silver_super_secure_jwt_secret_key_2026_luxury_hallmark');
        $expiryMinutes = (int)Config::get('JWT_EXPIRY_MINUTES', 1440);

        $payload = [
            'sub'    => (string)$user['id'],
            'role'   => $user['role'],
            'mobile' => $user['mobile']
        ];

        $token = JWT::encode($payload, $secret, $expiryMinutes);

        // Sanitize returned user object
        unset($user['hashed_password']);
        $user['id'] = (int)$user['id'];
        $user['is_active'] = (bool)$user['is_active'];

        Response::json([
            'access_token' => $token,
            'user'         => $user
        ]);
    }

    public static function me(): void {
        $currentUser = AuthMiddleware::authenticate();
        unset($currentUser['hashed_password']);
        Response::json($currentUser);
    }

    public static function logout(): void {
        Response::json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    public static function forgotPasswordSendOtp(): void {
        $body = Validator::getJsonBody();
        $rawMobile = $body['mobile'] ?? '';
        $cleanMobile = Validator::cleanMobileNumber($rawMobile);

        if (strlen($cleanMobile) < 10) {
            Response::error('Please enter a valid 10-digit mobile number', 400);
        }

        $cooldownSec = (int)Config::get('OTP_RESEND_COOLDOWN_SECONDS', 60);
        $recent = PasswordResetOTP::findRecent($cleanMobile);
        if ($recent) {
            $createdTime = strtotime($recent['created_at']);
            $diff = time() - $createdTime;
            if ($diff < $cooldownSec) {
                $remaining = $cooldownSec - $diff;
                Response::error("Please wait {$remaining} seconds before requesting a new OTP.", 429);
            }
        }

        $user = User::findByMobile($cleanMobile);
        $devOtp = null;

        if ($user && (bool)$user['is_active']) {
            $otpCode = (string)random_int(100000, 999999);
            $otpHash = password_hash($otpCode, PASSWORD_BCRYPT);
            $expireMinutes = (int)Config::get('OTP_EXPIRE_MINUTES', 5);

            PasswordResetOTP::create($cleanMobile, $otpHash, $expireMinutes);
            SmsService::sendOtp($cleanMobile, $otpCode);

            $provider = strtoupper(trim(Config::get('SMS_PROVIDER', 'DEVELOPMENT')));
            if ($provider === 'DEVELOPMENT') {
                $devOtp = $otpCode;
            }
        }

        $resp = [
            'message'          => 'If this mobile number is registered, an OTP has been sent via SMS.',
            'cooldown_seconds' => $cooldownSec,
        ];
        if ($devOtp !== null) {
            $resp['dev_otp'] = $devOtp;
        }

        Response::json($resp);
    }

    public static function forgotPasswordVerifyOtp(): void {
        $body = Validator::getJsonBody();
        $rawMobile = $body['mobile'] ?? '';
        $otp = trim($body['otp'] ?? '');
        $cleanMobile = Validator::cleanMobileNumber($rawMobile);

        $record = PasswordResetOTP::findLatestActive($cleanMobile);
        if (!$record) {
            Response::error('The verification OTP has expired or is invalid. Please request a new OTP.', 400);
        }

        $maxAttempts = (int)Config::get('OTP_MAX_ATTEMPTS', 5);
        if ((int)$record['attempts'] >= $maxAttempts) {
            PasswordResetOTP::markUsed((int)$record['id']);
            Response::error('Maximum verification attempts exceeded. Please request a new OTP.', 400);
        }

        if (!password_verify($otp, $record['otp_hash'])) {
            PasswordResetOTP::incrementAttempts((int)$record['id']);
            $remaining = max(0, $maxAttempts - ((int)$record['attempts'] + 1));
            Response::error("Invalid OTP entered. {$remaining} attempt(s) remaining.", 400);
        }

        Response::json([
            'valid'   => true,
            'message' => 'OTP verified successfully.'
        ]);
    }

    public static function forgotPasswordReset(): void {
        $body = Validator::getJsonBody();
        $rawMobile   = $body['mobile'] ?? '';
        $otp         = trim($body['otp'] ?? '');
        $newPassword = $body['new_password'] ?? '';
        $cleanMobile = Validator::cleanMobileNumber($rawMobile);

        if (strlen($newPassword) < 6) {
            Response::error('New password must be at least 6 characters', 400);
        }

        $record = PasswordResetOTP::findLatestActive($cleanMobile);
        if (!$record) {
            Response::error('Verification session expired or invalid. Please request a new OTP.', 400);
        }

        if (!password_verify($otp, $record['otp_hash'])) {
            PasswordResetOTP::incrementAttempts((int)$record['id']);
            Response::error('Invalid OTP code entered.', 400);
        }

        $user = User::findByMobile($cleanMobile);
        if (!$user) {
            Response::error('Account not found.', 404);
        }

        $newHashed = password_hash($newPassword, PASSWORD_BCRYPT);
        User::update((int)$user['id'], ['hashed_password' => $newHashed]);
        PasswordResetOTP::markUsed((int)$record['id']);

        Response::json([
            'success' => true,
            'message' => 'Password successfully reset. You can now log in with your new password.'
        ]);
    }
}
