<?php
namespace Controllers;

use Models\Ledger;

class LedgerController {
    public function list(): void {
        $result = Ledger::getAll($_GET);
        echo json_encode(['success' => true, 'data' => $result['data'], 'total' => $result['total'], 'page' => $result['page'], 'limit' => $result['limit']]);
    }

    public function view(): void {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        $ledger = Ledger::getById($id);
        if (!$ledger) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Not found']); return; }
        echo json_encode(['success' => true, 'data' => $ledger]);
    }

    public function getById(): void { $this->view(); }

    public function create(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($data['ledger_name'])) { http_response_code(422); echo json_encode(['success' => false, 'message' => 'Ledger name is required']); return; }
        if (empty($data['group_id'])) { http_response_code(422); echo json_encode(['success' => false, 'message' => 'Account group is required']); return; }
        try {
            $ledger = Ledger::create($data);
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Ledger created', 'data' => $ledger]);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function update(): void {
        $id = (int)($_GET['id'] ?? 0);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!$id) $id = (int)($data['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        try {
            $ledger = Ledger::update($id, $data);
            echo json_encode(['success' => true, 'message' => 'Ledger updated', 'data' => $ledger]);
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
            Ledger::delete($id);
            echo json_encode(['success' => true, 'message' => 'Ledger deleted']);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function nextCode(): void {
        echo json_encode(['success' => true, 'code' => Ledger::nextCode()]);
    }

    public function dropdown(): void {
        echo json_encode(['success' => true, 'data' => Ledger::getAllForDropdown()]);
    }

    public function filterOptions(): void {
        echo json_encode(['success' => true, 'data' => Ledger::filterOptions()]);
    }

    public function balance(): void {
        $id = (int)($_GET['id'] ?? 0);
        $date = $_GET['as_on'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        echo json_encode(['success' => true, 'data' => Ledger::getBalance($id, $date)]);
    }

    public function book(): void {
        $id = (int)($_GET['id'] ?? 0);
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        echo json_encode(['success' => true, 'data' => Ledger::getLedgerBook($id, $from, $to)]);
    }
}
