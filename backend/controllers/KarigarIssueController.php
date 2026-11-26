<?php
namespace Controllers;

use Models\KarigarIssue;

class KarigarIssueController {

    public static function list(): void {
        try {
            $result = KarigarIssue::list($_GET);
            self::json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function view(int $id): void {
        try {
            $record = KarigarIssue::getById($id);
            if (!$record) { self::json(['success' => false, 'message' => 'Issue not found'], 404); return; }
            self::json(['success' => true, 'data' => $record]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function create(): void {
        try {
            $result = KarigarIssue::create(self::body());
            self::json(['success' => true, 'data' => $result, 'message' => 'Issue voucher created successfully'], 201);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public static function update(int $id): void {
        try {
            $result = KarigarIssue::update($id, self::body());
            self::json(['success' => true, 'data' => $result, 'message' => 'Issue voucher updated successfully']);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public static function delete(int $id): void {
        try {
            KarigarIssue::delete($id);
            self::json(['success' => true, 'message' => 'Issue voucher deleted successfully']);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public static function filterOptions(): void {
        try {
            self::json(['success' => true, 'data' => KarigarIssue::filterOptions()]);
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
