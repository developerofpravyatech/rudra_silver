<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\SaleRegister;
use Exception;

class SaleRegisterController {
    public static function list(): void {
        try {
            $filters = [
                'search'            => $_GET['search'] ?? null,
                'from_date'         => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'           => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'party_name'        => $_GET['party_name'] ?? null,
                'account_group'     => $_GET['account_group'] ?? null,
                'item_group'        => $_GET['item_group'] ?? null,
                'item_code'         => $_GET['item_code'] ?? null,
                'stamp'             => $_GET['stamp'] ?? null,
                'branch_name'       => $_GET['branch_name'] ?? null,
                'item_type'         => $_GET['item_type'] ?? null,
                'category'          => $_GET['category'] ?? null,
                'series'            => $_GET['series'] ?? null,
                'quality'           => $_GET['quality'] ?? null,
                'voucher_type'      => $_GET['voucher_type'] ?? null,
                'register_type'     => $_GET['register_type'] ?? null,
                'is_sold'           => isset($_GET['is_sold']) && $_GET['is_sold'] !== '' ? $_GET['is_sold'] : null,
                'in_stock'          => isset($_GET['in_stock']) && $_GET['in_stock'] !== '' ? $_GET['in_stock'] : null,
                'net_value'         => isset($_GET['net_value']) && $_GET['net_value'] !== '' ? $_GET['net_value'] : null,
                'is_approved'       => isset($_GET['is_approved']) && $_GET['is_approved'] !== '' ? $_GET['is_approved'] : null,
                'is_excluded'       => isset($_GET['is_excluded']) && $_GET['is_excluded'] !== '' ? $_GET['is_excluded'] : null,
                'include_metal'     => isset($_GET['include_metal']) && $_GET['include_metal'] !== '' ? $_GET['include_metal'] : null,
            ];

            $sortBy = $_GET['sort_by'] ?? 'voucher_date';
            $sortOrder = $_GET['sort_order'] ?? 'desc';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));

            $res = SaleRegister::paginate($filters, $sortBy, $sortOrder, $page, $limit);
            Response::json($res);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function view(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid sale record ID is required.', 400);
            }
            $item = SaleRegister::findById($id);
            if (!$item) {
                Response::error("Sale register record #{$id} not found.", 404);
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
            if (empty($body['item_name']) || trim((string)$body['item_name']) === '') {
                Response::error('Item Name is required.', 400);
            }
            if (empty($body['item_type']) || trim((string)$body['item_type']) === '') {
                Response::error('Item Type is required.', 400);
            }

            $created = SaleRegister::create($body);
            Response::json([
                'success' => true,
                'message' => 'Sale register entry added successfully.',
                'data'    => $created,
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public static function update(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid sale record ID is required.', 400);
            }

            $body = Validator::getJsonBody();
            if (isset($body['party_name']) && trim((string)$body['party_name']) === '') {
                Response::error('Party Name cannot be empty.', 400);
            }
            if (isset($body['item_name']) && trim((string)$body['item_name']) === '') {
                Response::error('Item Name cannot be empty.', 400);
            }
            if (isset($body['item_type']) && trim((string)$body['item_type']) === '') {
                Response::error('Item Type cannot be empty.', 400);
            }

            $updated = SaleRegister::update($id, $body);
            Response::json([
                'success' => true,
                'message' => 'Sale register entry updated successfully.',
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public static function delete(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid sale record ID is required.', 400);
            }

            $deleted = SaleRegister::softDelete($id);
            if (!$deleted) {
                Response::error("Sale register record #{$id} not found or already deleted.", 404);
            }

            Response::json([
                'success' => true,
                'message' => "Sale register record #{$id} deleted successfully.",
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function filterOptions(): void {
        try {
            $options = SaleRegister::filterOptions();
            Response::json($options);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function export(): void {
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
                'item_type'     => $_GET['item_type'] ?? null,
                'category'      => $_GET['category'] ?? null,
                'series'        => $_GET['series'] ?? null,
                'quality'       => $_GET['quality'] ?? null,
                'voucher_type'  => $_GET['voucher_type'] ?? null,
                'register_type' => $_GET['register_type'] ?? null,
            ];
            $rows = SaleRegister::export($filters);
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
                'item_type'     => $_GET['item_type'] ?? null,
                'category'      => $_GET['category'] ?? null,
                'series'        => $_GET['series'] ?? null,
                'quality'       => $_GET['quality'] ?? null,
                'voucher_type'  => $_GET['voucher_type'] ?? null,
                'register_type' => $_GET['register_type'] ?? null,
                'is_sold'       => isset($_GET['is_sold']) && $_GET['is_sold'] !== '' ? $_GET['is_sold'] : null,
                'in_stock'      => isset($_GET['in_stock']) && $_GET['in_stock'] !== '' ? $_GET['in_stock'] : null,
                'net_value'     => isset($_GET['net_value']) && $_GET['net_value'] !== '' ? $_GET['net_value'] : null,
                'is_approved'   => isset($_GET['is_approved']) && $_GET['is_approved'] !== '' ? $_GET['is_approved'] : null,
                'is_excluded'   => isset($_GET['is_excluded']) && $_GET['is_excluded'] !== '' ? $_GET['is_excluded'] : null,
                'include_metal' => isset($_GET['include_metal']) && $_GET['include_metal'] !== '' ? $_GET['include_metal'] : null,
            ];

            $summary = SaleRegister::getSummary($filters);
            Response::json($summary);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
