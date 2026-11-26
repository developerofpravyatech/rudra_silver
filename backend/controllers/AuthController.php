<?php
namespace Controllers;

use Config\Config;
use Helpers\JWT;
use Helpers\Response;
use Helpers\Validator;
use Middleware\AuthMiddleware;
use Models\PasswordResetOTP;
use Models\PasswordResetToken;
use Models\User;
use Services\EmailService;
use Services\SmsService;

class AuthController {
    /**
     * User Registration (Email-based or Mobile-based)
     */
    public static function register(): void {
        $body = Validator::getJsonBody();
        $name            = trim($body['name'] ?? '');
        $email           = trim($body['email'] ?? '');
        $password        = $body['password'] ?? '';
        $confirmPassword = $body['confirm_password'] ?? $body['confirmPassword'] ?? null;
        $rawMobile       = $body['mobile'] ?? '';

        // Name validation
        if (empty($name) || mb_strlen($name) < 2) {
            Response::error('Full name is required (at least 2 characters)', 400);
        }

        // Email validation
        if (empty($email)) {
            Response::error('Email address is required', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Please enter a valid email address', 400);
        }

        // Check duplicate email
        $existingEmail = User::findByEmail($email);
        if ($existingEmail) {
            Response::error('This email address is already registered', 409);
        }

        // Password validation
        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters long', 400);
        }
        if ($confirmPassword !== null && $password !== $confirmPassword) {
            Response::error('Passwords do not match', 400);
        }

        // Optional mobile validation
        $cleanMobile = null;
        if (!empty($rawMobile)) {
            $cleanMobile = Validator::cleanMobileNumber($rawMobile);
            if (strlen($cleanMobile) < 10) {
                Response::error('Please enter a valid 10-digit mobile number', 400);
            }
            $existingMobile = User::findByMobile($cleanMobile);
            if ($existingMobile) {
                Response::error('This mobile number is already registered', 409);
            }
        }

        // Role assignment: Default to STAFF. Only first user becomes ADMIN.
        $totalUsers = User::countAll();
        $role = ($totalUsers === 0) ? 'ADMIN' : 'STAFF';

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $user = User::create($name, $cleanMobile, $hashedPassword, $role, $email);

        Response::json([
            'success' => true,
            'message' => 'Account created successfully',
            'user'    => $user
        ], 201);
    }

    /**
     * User Login (Email or Mobile + Password)
     */
    public static function login(): void {
        $body = Validator::getJsonBody();
        $credential = trim($body['email'] ?? $body['mobile'] ?? '');
        $password   = $body['password'] ?? '';

        if (empty($credential)) {
            Response::error('Email address or mobile number is required', 400);
        }
        if (empty($password)) {
            Response::error('Password is required', 400);
        }

        $user = null;
        if (strpos($credential, '@') !== false) {
            if (!filter_var($credential, FILTER_VALIDATE_EMAIL)) {
                Response::error('Please enter a valid email address', 400);
            }
            $user = User::findByEmail($credential);
        } else {
            $cleanMobile = Validator::cleanMobileNumber($credential);
            if (!empty($cleanMobile)) {
                $user = User::findByMobile($cleanMobile);
            }
            if (!$user) {
                $user = User::findByEmail($credential);
            }
        }

        if (!$user || !password_verify($password, $user['hashed_password'])) {
            Response::error('Invalid email/mobile number or password', 401);
        }

        if (!(bool)$user['is_active']) {
            Response::error('Your account has been deactivated. Please contact store management.', 403);
        }

        $secret = Config::get('JWT_SECRET', 'rudra_silver_super_secure_jwt_secret_key_2026_luxury_hallmark');
        $expiryMinutes = (int)Config::get('JWT_EXPIRY_MINUTES', 1440);

        $payload = [
            'sub'    => (string)$user['id'],
            'role'   => $user['role'],
            'email'  => $user['email'] ?? '',
            'name'   => $user['name'] ?? '',
            'mobile' => $user['mobile'] ?? ''
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

    /**
     * Forgot Password - Email Link Request
     */
    public static function forgotPasswordEmail(): void {
        $body  = Validator::getJsonBody();
        $email = trim($body['email'] ?? '');

        if (empty($email)) {
            Response::error('Email address is required', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Please enter a valid email address', 400);
        }

        $user = User::findByEmail($email);
        $devResetUrl = null;

        if ($user && (bool)$user['is_active']) {
            $rawToken = PasswordResetToken::createToken((int)$user['id'], 60);

            $frontendUrl = rtrim(Config::get('FRONTEND_URL', 'http://localhost:5173'), '/');
            $resetUrl = "{$frontendUrl}/?token={$rawToken}";

            EmailService::sendPasswordResetEmail($user['email'], $user['name'], $resetUrl);

            // In local/development environment, expose link for frictionless QA testing
            $appEnv = strtolower(trim(Config::get('APP_ENV', 'development')));
            if ($appEnv !== 'production') {
                $devResetUrl = $resetUrl;
            }
        }

        // Generic safe response to prevent email harvesting
        $response = [
            'success' => true,
            'message' => 'If an account exists with this email, a password reset link has been dispatched.',
        ];
        if ($devResetUrl !== null) {
            $response['dev_reset_url'] = $devResetUrl;
        }

        Response::json($response);
    }

    /**
     * Verify Password Reset Token
     */
    public static function verifyResetToken(): void {
        $token = $_GET['token'] ?? '';
        if (empty($token)) {
            $body = Validator::getJsonBody();
            $token = $body['token'] ?? '';
        }

        $token = trim($token);
        if (empty($token)) {
            Response::error('Reset token is required', 400);
        }

        $record = PasswordResetToken::findValidToken($token);
        if (!$record) {
            Response::json([
                'valid'   => false,
                'message' => 'This password reset link is invalid, has expired, or has already been used.'
            ], 400);
            return;
        }

        Response::json([
            'valid'   => true,
            'message' => 'Token is valid.',
            'email'   => $record['email'],
            'name'    => $record['name']
        ]);
    }

    /**
     * Reset Password using Token
     */
    public static function resetPasswordWithToken(): void {
        $body = Validator::getJsonBody();
        $token           = trim($body['token'] ?? '');
        $password        = $body['password'] ?? $body['new_password'] ?? '';
        $confirmPassword = $body['confirm_password'] ?? $body['confirmPassword'] ?? null;

        if (empty($token)) {
            Response::error('Reset token is required', 400);
        }

        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters long', 400);
        }

        if ($confirmPassword !== null && $password !== $confirmPassword) {
            Response::error('Passwords do not match', 400);
        }

        $record = PasswordResetToken::findValidToken($token);
        if (!$record) {
            Response::error('This password reset link is invalid, has expired, or has already been used.', 400);
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        User::updatePassword((int)$record['user_id'], $hashedPassword);
        PasswordResetToken::markUsed((int)$record['id']);

        Response::json([
            'success' => true,
            'message' => 'Your password has been successfully reset. You may now sign in with your new password.'
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

    // -------------------------------------------------------------
    // Backward-Compatible SMS / Mobile OTP Reset Flow
    // -------------------------------------------------------------
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
        User::updatePassword((int)$user['id'], $newHashed);
        PasswordResetOTP::markUsed((int)$record['id']);

        Response::json([
            'success' => true,
            'message' => 'Password successfully reset. You can now log in with your new password.'
        ]);
    }
}
