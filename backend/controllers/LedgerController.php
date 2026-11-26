<?php
namespace Controllers;

use Models\Ledger;

class LedgerController {
    public static function list(): void {
        $result = Ledger::getAll($_GET);
        echo json_encode(['success' => true, 'data' => $result['data'], 'total' => $result['total'], 'page' => $result['page'], 'limit' => $result['limit']]);
    }

    public static function view(int $id = 0): void {
        if (!$id) $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        $ledger = Ledger::getById($id);
        if (!$ledger) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Not found']); return; }
        echo json_encode(['success' => true, 'data' => $ledger]);
    }

    public static function getById(int $id = 0): void { self::view($id); }

    public static function create(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $errors = [];
        if (trim((string)($data['ledger_name'] ?? '')) === '') $errors['ledger_name'] = 'Ledger Name is required.';
        if (empty($data['group_id']) || (int)$data['group_id'] <= 0) $errors['group_id'] = 'Account Group is required.';
        if (!empty($data['mobile']) && !preg_match('/^\d{10}$/', trim((string)$data['mobile']))) $errors['mobile'] = 'Mobile number must be 10 digits.';
        if (!empty($data['email']) && !filter_var(trim((string)$data['email']), FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email address.';
        if (isset($data['opening_balance']) && (float)$data['opening_balance'] < 0) $errors['opening_balance'] = 'Opening balance must be >= 0.';
        if (!empty($errors)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => reset($errors), 'errors' => $errors]);
            return;
        }
        $data['ledger_name'] = trim((string)$data['ledger_name']);
        try {
            $ledger = Ledger::create($data);
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Ledger created', 'data' => $ledger]);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function update(int $id = 0): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!$id) $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        $errors = [];
        if (trim((string)($data['ledger_name'] ?? '')) === '') $errors['ledger_name'] = 'Ledger Name is required.';
        if (empty($data['group_id']) || (int)$data['group_id'] <= 0) $errors['group_id'] = 'Account Group is required.';
        if (!empty($data['mobile']) && !preg_match('/^\d{10}$/', trim((string)$data['mobile']))) $errors['mobile'] = 'Mobile number must be 10 digits.';
        if (!empty($data['email']) && !filter_var(trim((string)$data['email']), FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email address.';
        if (!empty($errors)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => reset($errors), 'errors' => $errors]);
            return;
        }
        $data['ledger_name'] = trim((string)$data['ledger_name']);
        try {
            $ledger = Ledger::update($id, $data);
            echo json_encode(['success' => true, 'message' => 'Ledger updated', 'data' => $ledger]);
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
            Ledger::delete($id);
            echo json_encode(['success' => true, 'message' => 'Ledger deleted']);
        } catch (\Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function nextCode(): void {
        echo json_encode(['success' => true, 'code' => Ledger::nextCode()]);
    }

    public static function dropdown(): void {
        echo json_encode(['success' => true, 'data' => Ledger::getAllForDropdown()]);
    }

    public static function filterOptions(): void {
        echo json_encode(['success' => true, 'data' => Ledger::filterOptions()]);
    }

    public static function balance(int $id = 0): void {
        if (!$id) $id = (int)($_GET['id'] ?? 0);
        $date = $_GET['as_on'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        echo json_encode(['success' => true, 'data' => Ledger::getBalance($id, $date)]);
    }

    public static function book(int $id = 0): void {
        if (!$id) $id = (int)($_GET['id'] ?? 0);
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID required']); return; }
        echo json_encode(['success' => true, 'data' => Ledger::getLedgerBook($id, $from, $to)]);
    }
}
