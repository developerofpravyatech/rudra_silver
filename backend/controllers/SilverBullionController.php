<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\SilverBullion;
use Exception;

class SilverBullionController {
    public static function list(): void {
        try {
            $filters = [
                'search'             => $_GET['search'] ?? null,
                'from_date'          => $_GET['from_date'] ?? null,
                'to_date'            => $_GET['to_date'] ?? null,
                'account_group_name' => $_GET['account_group_name'] ?? ($_GET['group_name'] ?? null),
                'party_name'         => $_GET['party_name'] ?? null,
                'account_city'       => $_GET['account_city'] ?? ($_GET['city'] ?? null),
                'user_name'          => $_GET['user_name'] ?? null,
                'salesman_name'      => $_GET['salesman_name'] ?? null,
                'agent_name'         => $_GET['agent_name'] ?? null,
                'bhav'               => isset($_GET['bhav']) && $_GET['bhav'] !== '' ? $_GET['bhav'] : null,
                'wo_sale'            => isset($_GET['wo_sale']) && $_GET['wo_sale'] !== '' ? $_GET['wo_sale'] : null,
                'including_labour'   => isset($_GET['including_labour']) && $_GET['including_labour'] !== '' ? $_GET['including_labour'] : null,
                'exclude_rate_book'  => isset($_GET['exclude_rate_book']) && $_GET['exclude_rate_book'] !== '' ? $_GET['exclude_rate_book'] : null,
            ];

            $sortBy = $_GET['sort_by'] ?? 'transaction_date';
            $sortOrder = $_GET['sort_order'] ?? 'desc';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(200, max(1, (int)($_GET['limit'] ?? 20)));

            $res = SilverBullion::paginate($filters, $sortBy, $sortOrder, $page, $limit);
            Response::json($res);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function view(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid Silver Bullion record ID is required.', 400);
            }
            $item = SilverBullion::findById($id);
            if (!$item) {
                Response::error("Silver Bullion record #{$id} not found.", 404);
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

            if (empty($body['transaction_date'])) {
                Response::error('Transaction Date is required.', 400);
            }

            if (empty($body['transaction_type'])) {
                Response::error('Transaction Type (Credit / Debit) is required.', 400);
            }

            $created = SilverBullion::create($body);
            Response::json([
                'success' => true,
                'message' => 'Silver Bullion entry recorded successfully.',
                'data'    => $created,
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public static function update(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid Silver Bullion record ID is required.', 400);
            }

            $body = Validator::getJsonBody();
            if (isset($body['party_name']) && trim((string)$body['party_name']) === '') {
                Response::error('Party Name cannot be empty.', 400);
            }

            $updated = SilverBullion::update($id, $body);
            Response::json([
                'success' => true,
                'message' => 'Silver Bullion entry updated successfully.',
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public static function delete(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid Silver Bullion record ID is required.', 400);
            }

            $deleted = SilverBullion::delete($id);
            if (!$deleted) {
                Response::error("Silver Bullion record #{$id} could not be found or has already been deleted.", 404);
            }

            Response::json([
                'success' => true,
                'message' => "Silver Bullion record #{$id} deleted successfully.",
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function filterOptions(): void {
        try {
            $options = SilverBullion::filterOptions();
            Response::json($options);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function export(): void {
        try {
            $filters = [
                'search'             => $_GET['search'] ?? null,
                'from_date'          => $_GET['from_date'] ?? null,
                'to_date'            => $_GET['to_date'] ?? null,
                'account_group_name' => $_GET['account_group_name'] ?? null,
                'party_name'         => $_GET['party_name'] ?? null,
                'account_city'       => $_GET['account_city'] ?? null,
                'user_name'          => $_GET['user_name'] ?? null,
                'salesman_name'      => $_GET['salesman_name'] ?? null,
                'agent_name'         => $_GET['agent_name'] ?? null,
            ];

            $res = SilverBullion::paginate($filters, 'transaction_date', 'asc', 1, 5000);
            Response::json($res['items'] ?? []);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
