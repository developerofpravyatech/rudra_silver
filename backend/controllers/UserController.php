<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Middleware\AuthMiddleware;
use Models\User;

class UserController {
    public static function listUsers(): void {
        AuthMiddleware::authenticate();

        $search   = $_GET['search'] ?? null;
        $role     = $_GET['role'] ?? null;
        $isActive = isset($_GET['is_active']) ? filter_var($_GET['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null;
        $page     = max(1, (int)($_GET['page'] ?? 1));
        $perPage  = min(100, max(1, (int)($_GET['per_page'] ?? 10)));

        $data = User::paginate($search, $role, $isActive, $page, $perPage);
        Response::json($data);
    }

    public static function getUser(int $id): void {
        AuthMiddleware::authenticate();

        $user = User::findById($id);
        if (!$user) {
            Response::error('User not found', 404);
        }

        Response::json($user);
    }

    public static function createUser(): void {
        AuthMiddleware::authenticate();

        $body = Validator::getJsonBody();
        $name     = trim($body['name'] ?? '');
        $rawMobile= $body['mobile'] ?? '';
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $role     = strtoupper(trim($body['role'] ?? 'STAFF'));

        $cleanMobile = Validator::cleanMobileNumber($rawMobile);
        if (strlen($cleanMobile) < 10) {
            Response::error('Valid 10-digit mobile number required', 400);
        }

        if (empty($name)) {
            Response::error('Full name is required', 400);
        }

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Valid email address is required', 400);
        }

        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters', 400);
        }

        if (User::findByMobile($cleanMobile)) {
            Response::error('Mobile number is already registered', 400);
        }

        if (User::findByEmail($email)) {
            Response::error('Email address is already registered', 400);
        }

        if (!in_array($role, ['ADMIN', 'STAFF'])) {
            $role = 'STAFF';
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $user = User::create($name, $cleanMobile, $hashedPassword, $role, $email);

        Response::json($user, 201);
    }

    public static function updateUser(int $id): void {
        $admin = AuthMiddleware::authenticate();

        $user = User::findById($id);
        if (!$user) {
            Response::error('User not found', 404);
        }

        $body = Validator::getJsonBody();
        $updateData = [];

        if (isset($body['name']) && trim($body['name']) !== '') {
            $updateData['name'] = trim($body['name']);
        }

        if (isset($body['mobile'])) {
            $cleanMobile = Validator::cleanMobileNumber($body['mobile']);
            if (strlen($cleanMobile) >= 10) {
                $existing = User::findByMobile($cleanMobile);
                if ($existing && $existing['id'] !== $id) {
                    Response::error('Mobile number already in use by another user', 400);
                }
                $updateData['mobile'] = $cleanMobile;
            }
        }

        if (isset($body['email'])) {
            $email = trim($body['email']);
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Response::error('Valid email address is required', 400);
            }
            $existing = User::findByEmail($email);
            if ($existing && $existing['id'] !== $id) {
                Response::error('Email address already in use by another user', 400);
            }
            $updateData['email'] = $email;
        }

        if (isset($body['is_active'])) {
            $isActive = (bool)$body['is_active'];
            if ($user['id'] === $admin['id'] && !$isActive) {
                Response::error('Admins cannot deactivate their own account', 400);
            }
            $updateData['is_active'] = $isActive;
        }

        if (isset($body['role'])) {
            $newRole = strtoupper(trim($body['role']));
            if ($user['id'] === $admin['id'] && $newRole !== 'ADMIN') {
                Response::error('Admins cannot change their own administrative role', 400);
            }
            if (!in_array($newRole, ['ADMIN', 'STAFF'])) {
                Response::error('Invalid role specified', 400);
            }
            $updateData['role'] = $newRole;
        }

        $updated = User::update($id, $updateData);
        Response::json($updated);
    }

    public static function deleteUser(int $id): void {
        $admin = AuthMiddleware::authenticate();

        $user = User::findById($id);
        if (!$user) {
            Response::error('User not found', 404);
        }

        if ($user['id'] === $admin['id']) {
            Response::error('You cannot delete your own account', 400);
        }

        $deleted = User::delete($id);
        if (!$deleted) {
            Response::error('Failed to delete user', 500);
        }

        Response::json(['success' => true, 'message' => 'User deleted successfully']);
    }

    public static function toggleStatus(int $id): void {
        $admin = AuthMiddleware::authenticate();

        $user = User::findById($id);
        if (!$user) {
            Response::error('User not found', 404);
        }

        $body = Validator::getJsonBody();
        if (!isset($body['is_active'])) {
            Response::error('is_active field is required', 422);
        }

        $isActive = (bool)$body['is_active'];
        if ($user['id'] === $admin['id'] && !$isActive) {
            Response::error('Admins cannot deactivate their own account', 400);
        }

        $updated = User::update($id, ['is_active' => $isActive]);
        Response::json($updated);
    }
}
