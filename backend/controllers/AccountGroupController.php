<?php
namespace Controllers;

use Models\AccountGroup;

class AccountGroupController {
    public function list(): void {
        $filters = $_GET;
        $result = AccountGroup::getAll($filters);
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $result['data'], 'total' => $result['total'], 'page' => $result['page'], 'limit' => $result['limit']]);
    }

    public function view(): void {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        $group = AccountGroup::getById($id);
        if (!$group) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Not found']); return; }
        echo json_encode(['success' => true, 'data' => $group]);
    }

    public function getById(): void { $this->view(); }

    public function create(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($data['name'])) { http_response_code(422); echo json_encode(['success' => false, 'message' => 'Name is required']); return; }
        if (empty($data['nature'])) { http_response_code(422); echo json_encode(['success' => false, 'message' => 'Nature is required']); return; }
        try {
            $group = AccountGroup::create($data);
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Account group created', 'data' => $group]);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function update(): void {
        $id = (int)($_GET['id'] ?? $_POST['id'] ?? 0);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!$id) $id = (int)($data['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        if (empty($data['name'])) { http_response_code(422); echo json_encode(['success' => false, 'message' => 'Name is required']); return; }
        try {
            $group = AccountGroup::update($id, $data);
            echo json_encode(['success' => true, 'message' => 'Account group updated', 'data' => $group]);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function delete(): void {
        $id = (int)($_GET['id'] ?? 0);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!$id) $id = (int)($data['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        try {
            AccountGroup::delete($id);
            echo json_encode(['success' => true, 'message' => 'Account group deleted']);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function toggleStatus(): void {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        $group = AccountGroup::toggleStatus($id);
        echo json_encode(['success' => true, 'message' => 'Status updated', 'data' => $group]);
    }

    public function dropdown(): void {
        $groups = AccountGroup::getAllForDropdown();
        echo json_encode(['success' => true, 'data' => $groups]);
    }
}
