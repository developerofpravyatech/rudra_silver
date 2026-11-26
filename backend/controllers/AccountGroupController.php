<?php
namespace Controllers;

use Models\AccountGroup;

class AccountGroupController {
    public static function list(): void {
        $filters = $_GET;
        $result = AccountGroup::getAll($filters);
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $result['data'], 'total' => $result['total'], 'page' => $result['page'], 'limit' => $result['limit']]);
    }

    public static function view(int $id = 0): void {
        if (!$id) $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        $group = AccountGroup::getById($id);
        if (!$group) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Not found']); return; }
        echo json_encode(['success' => true, 'data' => $group]);
    }

    public static function getById(int $id = 0): void { self::view($id); }

    public static function create(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $errors = [];
        if (trim((string)($data['name'] ?? '')) === '') $errors['name'] = 'Group Name is required.';
        if (trim((string)($data['nature'] ?? '')) === '') $errors['nature'] = 'Account Nature is required.';
        if (!empty($errors)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => reset($errors), 'errors' => $errors]);
            return;
        }
        $data['name'] = trim((string)$data['name']);
        try {
            $group = AccountGroup::create($data);
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Account group created', 'data' => $group]);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function update(int $id = 0): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!$id) $id = (int)($_GET['id'] ?? $_POST['id'] ?? $data['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        $errors = [];
        if (trim((string)($data['name'] ?? '')) === '') $errors['name'] = 'Group Name is required.';
        if (isset($data['nature']) && trim((string)$data['nature']) === '') $errors['nature'] = 'Account Nature is required.';
        if (!empty($errors)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => reset($errors), 'errors' => $errors]);
            return;
        }
        $data['name'] = trim((string)$data['name']);
        try {
            $group = AccountGroup::update($id, $data);
            echo json_encode(['success' => true, 'message' => 'Account group updated', 'data' => $group]);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function delete(int $id = 0): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!$id) $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        try {
            AccountGroup::delete($id);
            echo json_encode(['success' => true, 'message' => 'Account group deleted']);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function toggleStatus(int $id = 0): void {
        if (!$id) $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        $group = AccountGroup::toggleStatus($id);
        echo json_encode(['success' => true, 'message' => 'Status updated', 'data' => $group]);
    }

    public static function dropdown(): void {
        $groups = AccountGroup::getAllForDropdown();
        echo json_encode(['success' => true, 'data' => $groups]);
    }
}
