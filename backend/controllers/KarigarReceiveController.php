<?php
namespace Controllers;

use Models\KarigarReceive;

class KarigarReceiveController {

    public static function list(): void {
        try {
            self::json(['success' => true, 'data' => KarigarReceive::list($_GET)]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function view(int $id): void {
        try {
            $record = KarigarReceive::getById($id);
            if (!$record) { self::json(['success' => false, 'message' => 'Receive record not found'], 404); return; }
            self::json(['success' => true, 'data' => $record]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function create(): void {
        try {
            $result = KarigarReceive::create(self::body());
            self::json(['success' => true, 'data' => $result, 'message' => 'Receive voucher created successfully'], 201);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public static function delete(int $id): void {
        try {
            KarigarReceive::delete($id);
            self::json(['success' => true, 'message' => 'Receive record deleted']);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public static function filterOptions(): void {
        try {
            self::json(['success' => true, 'data' => KarigarReceive::filterOptions()]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function outstanding(): void {
        try {
            self::json(['success' => true, 'data' => KarigarReceive::outstanding($_GET)]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function issueReceiveReport(): void {
        try {
            self::json(['success' => true, 'data' => KarigarReceive::issueReceiveReport($_GET)]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function lotReport(): void {
        try {
            self::json(['success' => true, 'data' => KarigarReceive::lotReport($_GET)]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function diaStnBalance(): void {
        try {
            self::json(['success' => true, 'data' => KarigarReceive::diaStnBalance($_GET)]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function diaStnGroupBalance(): void {
        try {
            self::json(['success' => true, 'data' => KarigarReceive::diaStnGroupBalance($_GET)]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function diaStnIssueReceive(): void {
        try {
            self::json(['success' => true, 'data' => KarigarReceive::diaStnIssueReceive($_GET)]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    private static function json(array $data, int $code = 200): void {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data);
    }

    private static function body(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
