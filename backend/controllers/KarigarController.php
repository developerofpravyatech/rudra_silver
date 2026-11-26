<?php
namespace Controllers;

use Models\Karigar;

class KarigarController {

    public static function list(): void {
        try {
            $result = Karigar::list($_GET);
            self::json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function view(int $id): void {
        try {
            $record = Karigar::getById($id);
            if (!$record) { self::json(['success' => false, 'message' => 'Karigar not found'], 404); return; }
            self::json(['success' => true, 'data' => $record]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function create(): void {
        try {
            $result = Karigar::create(self::body());
            self::json(['success' => true, 'data' => $result, 'message' => 'Karigar created successfully'], 201);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public static function update(int $id): void {
        try {
            $result = Karigar::update($id, self::body());
            self::json(['success' => true, 'data' => $result, 'message' => 'Karigar updated successfully']);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public static function delete(int $id): void {
        try {
            Karigar::delete($id);
            self::json(['success' => true, 'message' => 'Karigar deleted successfully']);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public static function toggleStatus(int $id): void {
        try {
            $result = Karigar::toggleStatus($id);
            self::json(['success' => true, 'data' => $result, 'message' => 'Status updated']);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public static function filterOptions(): void {
        try {
            self::json(['success' => true, 'data' => Karigar::filterOptions()]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function nextCode(): void {
        try {
            self::json(['success' => true, 'data' => ['code' => Karigar::nextCode()]]);
        } catch (\Exception $e) {
            self::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public static function export(): void {
        try {
            $filters = $_GET;
            $rows    = Karigar::export($filters);

            if (($filters['format'] ?? 'json') === 'csv') {
                header('Content-Type: text/csv');
                header('Content-Disposition: attachment; filename="karigars.csv"');
                $out = fopen('php://output', 'w');
                fputcsv($out, ['Code', 'Name', 'Mobile', 'City', 'State', 'Balance INR', 'Gold Fine', 'Silver Fine', 'Labour Rate', 'Active']);
                foreach ($rows as $r) {
                    fputcsv($out, [
                        $r['account_code'], $r['name'], $r['mobile'], $r['city'], $r['state'],
                        $r['balance_inr'], $r['balance_fine_gold'], $r['balance_fine_silver'],
                        $r['default_labour_rate'], $r['is_active'] ? 'Yes' : 'No',
                    ]);
                }
                fclose($out);
                return;
            }

            self::json(['success' => true, 'data' => $rows, 'total' => count($rows)]);
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
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? [];
    }
}
