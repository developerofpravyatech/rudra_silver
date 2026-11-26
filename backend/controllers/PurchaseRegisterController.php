<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\PurchaseRegister;
use Exception;

class PurchaseRegisterController {
    public static function list(): void {
        try {
            $filters = [
                'search'                => $_GET['search'] ?? null,
                'from_date'             => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'               => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'party_name'            => $_GET['party_name'] ?? null,
                'account_group'         => $_GET['account_group'] ?? null,
                'item_group'            => $_GET['item_group'] ?? null,
                'item_code'             => $_GET['item_code'] ?? null,
                'stamp'                 => $_GET['stamp'] ?? null,
                'branch_name'           => $_GET['branch_name'] ?? null,
                'login_name'            => $_GET['login_name'] ?? null,
                'register_type'         => $_GET['register_type'] ?? null,
                'voucher_type'          => $_GET['voucher_type'] ?? ($_GET['type'] ?? null),
                'quality'               => $_GET['quality'] ?? null,
                'item_type'             => $_GET['item_type'] ?? null,
                'category'              => $_GET['category'] ?? null,
                'series'                => $_GET['series'] ?? null,
                'is_selected'           => isset($_GET['is_selected']) && $_GET['is_selected'] !== '' ? $_GET['is_selected'] : null,
                'is_approved'           => isset($_GET['is_approved']) && $_GET['is_approved'] !== '' ? $_GET['is_approved'] : null,
                'is_excluded'           => isset($_GET['is_excluded']) && $_GET['is_excluded'] !== '' ? $_GET['is_excluded'] : null,
                'is_cancelled'          => isset($_GET['is_cancelled']) && $_GET['is_cancelled'] !== '' ? $_GET['is_cancelled'] : null,
                'include_metal'         => isset($_GET['include_metal']) && $_GET['include_metal'] !== '' ? $_GET['include_metal'] : null,
                'in_stock'              => isset($_GET['in_stock']) && $_GET['in_stock'] !== '' ? $_GET['in_stock'] : null,
                'net_value'             => isset($_GET['net_value']) && $_GET['net_value'] !== '' ? $_GET['net_value'] : null,
            ];

            $sortBy = $_GET['sort_by'] ?? 'voucher_date';
            $sortOrder = $_GET['sort_order'] ?? 'desc';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));

            $res = PurchaseRegister::paginate($filters, $sortBy, $sortOrder, $page, $limit);
            Response::json($res);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function view(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid purchase record ID is required.', 400);
            }
            $item = PurchaseRegister::findById($id);
            if (!$item) {
                Response::error("Purchase register record #{$id} not found.", 404);
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
            if (empty($body['particular']) || trim((string)$body['particular']) === '') {
                Response::error('Particular is required.', 400);
            }

            $created = PurchaseRegister::create($body);
            Response::json([
                'success' => true,
                'message' => 'Purchase register entry added successfully.',
                'data'    => $created,
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public static function update(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid purchase record ID is required.', 400);
            }

            $body = Validator::getJsonBody();
            if (isset($body['party_name']) && trim((string)$body['party_name']) === '') {
                Response::error('Party Name cannot be empty.', 400);
            }
            if (isset($body['particular']) && trim((string)$body['particular']) === '') {
                Response::error('Particular cannot be empty.', 400);
            }

            $updated = PurchaseRegister::update($id, $body);
            Response::json([
                'success' => true,
                'message' => 'Purchase register entry updated successfully.',
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public static function delete(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid purchase record ID is required.', 400);
            }

            $deleted = PurchaseRegister::softDelete($id);
            if (!$deleted) {
                Response::error("Purchase register record #{$id} not found or already deleted.", 404);
            }

            Response::json([
                'success' => true,
                'message' => "Purchase register record #{$id} deleted successfully.",
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function filterOptions(): void {
        try {
            $options = PurchaseRegister::filterOptions();
            Response::json($options);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function export(): void {
        try {
            $filters = [
                'search'                => $_GET['search'] ?? null,
                'from_date'             => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'               => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'party_name'            => $_GET['party_name'] ?? null,
                'account_group'         => $_GET['account_group'] ?? null,
                'item_group'            => $_GET['item_group'] ?? null,
                'item_code'             => $_GET['item_code'] ?? null,
                'stamp'                 => $_GET['stamp'] ?? null,
                'branch_name'           => $_GET['branch_name'] ?? null,
                'login_name'            => $_GET['login_name'] ?? null,
                'register_type'         => $_GET['register_type'] ?? null,
                'voucher_type'          => $_GET['voucher_type'] ?? null,
            ];
            $rows = PurchaseRegister::export($filters);
            Response::json($rows);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function summary(): void {
        try {
            $filters = [
                'search'        => $_GET['search'] ?? null,
                'from_date'     => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'       => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'party_name'    => $_GET['party_name'] ?? null,
                'account_group' => $_GET['account_group'] ?? null,
                'item_group'    => $_GET['item_group'] ?? null,
                'item_code'     => $_GET['item_code'] ?? null,
                'stamp'         => $_GET['stamp'] ?? null,
                'branch_name'   => $_GET['branch_name'] ?? null,
                'login_name'    => $_GET['login_name'] ?? null,
                'register_type' => $_GET['register_type'] ?? null,
                'voucher_type'  => $_GET['voucher_type'] ?? ($_GET['type'] ?? null),
                'quality'       => $_GET['quality'] ?? null,
                'item_type'     => $_GET['item_type'] ?? null,
                'category'      => $_GET['category'] ?? null,
                'series'        => $_GET['series'] ?? null,
                'is_selected'   => isset($_GET['is_selected']) && $_GET['is_selected'] !== '' ? $_GET['is_selected'] : null,
                'is_approved'   => isset($_GET['is_approved']) && $_GET['is_approved'] !== '' ? $_GET['is_approved'] : null,
                'is_excluded'   => isset($_GET['is_excluded']) && $_GET['is_excluded'] !== '' ? $_GET['is_excluded'] : null,
                'is_cancelled'  => isset($_GET['is_cancelled']) && $_GET['is_cancelled'] !== '' ? $_GET['is_cancelled'] : null,
                'include_metal' => isset($_GET['include_metal']) && $_GET['include_metal'] !== '' ? $_GET['include_metal'] : null,
                'in_stock'      => isset($_GET['in_stock']) && $_GET['in_stock'] !== '' ? $_GET['in_stock'] : null,
                'net_value'     => isset($_GET['net_value']) && $_GET['net_value'] !== '' ? $_GET['net_value'] : null,
            ];

            $summary = PurchaseRegister::getSummary($filters);
            Response::json($summary);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
