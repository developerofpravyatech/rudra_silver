<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\DailyTransaction;
use Exception;

class DailyTransactionController {
    public static function list(): void {
        try {
            $filters = [
                'search'           => $_GET['search'] ?? null,
                'from_date'        => $_GET['from_date'] ?? null,
                'to_date'          => $_GET['to_date'] ?? null,
                'group_name'       => $_GET['group_name'] ?? null,
                'login_name'       => $_GET['login_name'] ?? null,
                'stamp'            => $_GET['stamp'] ?? null,
                'voucher_type'     => $_GET['voucher_type'] ?? null,
                'party_name'       => $_GET['party_name'] ?? null,
                'series'           => $_GET['series'] ?? null,
                'site'             => $_GET['site'] ?? null,
                'transaction_type' => $_GET['transaction_type'] ?? null,
                'is_undelivered'   => !empty($_GET['is_undelivered']),
                'stud_details'     => !empty($_GET['stud_details']),
                'exclude'          => !empty($_GET['exclude']),
            ];

            $sortBy = $_GET['sort_by'] ?? 'transaction_date';
            $sortOrder = $_GET['sort_order'] ?? 'desc';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));

            $res = DailyTransaction::paginate($filters, $sortBy, $sortOrder, $page, $limit);
            Response::json($res);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function view(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid transaction ID is required.', 400);
            }
            $item = DailyTransaction::findById($id);
            if (!$item) {
                Response::error("Daily transaction #{$id} not found.", 404);
            }
            Response::json($item);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function create(): void {
        try {
            $body = Validator::getJsonBody();

            if (empty($body['party_name']) || trim((string)$body['party_name']) === '') {
                Response::error('Party Name is required.', 400);
            }

            if (empty($body['transaction_type'])) {
                Response::error('Transaction Type is required.', 400);
            }

            $created = DailyTransaction::create($body);
            Response::json([
                'success' => true,
                'message' => 'Daily transaction added successfully.',
                'data'    => $created
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function update(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid transaction ID is required.', 400);
            }

            $body = Validator::getJsonBody();
            if (isset($body['party_name']) && trim((string)$body['party_name']) === '') {
                Response::error('Party Name cannot be empty.', 400);
            }

            $updated = DailyTransaction::update($id, $body);
            Response::json([
                'success' => true,
                'message' => 'Daily transaction updated successfully.',
                'data'    => $updated
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function delete(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid transaction ID is required.', 400);
            }

            $existing = DailyTransaction::findById($id);
            if (!$existing) {
                Response::error("Transaction #{$id} not found.", 404);
            }

            DailyTransaction::delete($id);
            Response::json([
                'success' => true,
                'message' => "Transaction #{$id} deleted successfully."
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function filterOptions(): void {
        try {
            $opts = DailyTransaction::getFilterOptions();
            Response::json($opts);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function summary(): void {
        try {
            $filters = [
                'search'           => $_GET['search'] ?? null,
                'from_date'        => $_GET['from_date'] ?? null,
                'to_date'          => $_GET['to_date'] ?? null,
                'group_name'       => $_GET['group_name'] ?? null,
                'login_name'       => $_GET['login_name'] ?? null,
                'stamp'            => $_GET['stamp'] ?? null,
                'voucher_type'     => $_GET['voucher_type'] ?? null,
                'party_name'       => $_GET['party_name'] ?? null,
                'series'           => $_GET['series'] ?? null,
                'site'             => $_GET['site'] ?? null,
                'transaction_type' => $_GET['transaction_type'] ?? null,
                'is_undelivered'   => !empty($_GET['is_undelivered']),
                'stud_details'     => !empty($_GET['stud_details']),
                'exclude'          => !empty($_GET['exclude']),
            ];

            $res = DailyTransaction::paginate($filters, 'transaction_date', 'desc', 1, 1);
            Response::json([
                'total_records' => $res['total'],
                'totals'        => $res['totals']
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function export(): void {
        try {
            $filters = [
                'search'           => $_GET['search'] ?? null,
                'from_date'        => $_GET['from_date'] ?? null,
                'to_date'          => $_GET['to_date'] ?? null,
                'group_name'       => $_GET['group_name'] ?? null,
                'login_name'       => $_GET['login_name'] ?? null,
                'stamp'            => $_GET['stamp'] ?? null,
                'voucher_type'     => $_GET['voucher_type'] ?? null,
                'party_name'       => $_GET['party_name'] ?? null,
                'series'           => $_GET['series'] ?? null,
                'site'             => $_GET['site'] ?? null,
                'transaction_type' => $_GET['transaction_type'] ?? null,
                'is_undelivered'   => !empty($_GET['is_undelivered']),
                'stud_details'     => !empty($_GET['stud_details']),
                'exclude'          => !empty($_GET['exclude']),
            ];

            $rows = DailyTransaction::getAllMatching($filters);
            Response::json($rows);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
