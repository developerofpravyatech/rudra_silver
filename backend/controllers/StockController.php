<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\StockItem;
use Middleware\AuthMiddleware;
use Exception;

class StockController {
    /**
     * GET /api/stock/list or /api/v1/stock/list
     */
    public static function list(): void {
        try {
            $search = $_GET['search'] ?? null;
            $metalType = $_GET['metal_type'] ?? null;
            $itemGroupId = isset($_GET['item_group_id']) && $_GET['item_group_id'] !== '' ? (int)$_GET['item_group_id'] : null;
            $purityId = isset($_GET['purity_id']) && $_GET['purity_id'] !== '' ? (int)$_GET['purity_id'] : null;
            $status = $_GET['status'] ?? null;
            $dateFrom = $_GET['date_from'] ?? null;
            $dateTo = $_GET['date_to'] ?? null;
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));

            $result = StockItem::paginate(
                $search,
                $metalType,
                $itemGroupId,
                $purityId,
                $status,
                $dateFrom,
                $dateTo,
                $page,
                $limit
            );

            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/stock/view?id=
     */
    public static function view(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid stock item ID is required.', 400);
            }

            $item = StockItem::findById($id);
            if (!$item) {
                Response::error("Stock item #{$id} not found.", 404);
            }

            Response::json($item);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * POST /api/stock/create
     */
    public static function create(): void {
        try {
            $body = Validator::getJsonBody();

            // 1. Validate required fields
            if (empty($body['item_name']) || trim($body['item_name']) === '') {
                Response::error('Item Name is required.', 422);
            }

            if (!isset($body['gross_weight']) || !is_numeric($body['gross_weight']) || (float)$body['gross_weight'] < 0) {
                Response::error('Gross Weight must be a valid non-negative number.', 422);
            }

            $gross = (float)$body['gross_weight'];
            $stone = isset($body['stone_weight']) ? (float)$body['stone_weight'] : 0.0;
            $other = isset($body['other_weight']) ? (float)$body['other_weight'] : 0.0;

            if ($stone < 0 || $other < 0) {
                Response::error('Stone weight and other weights cannot be negative.', 422);
            }

            if (($stone + $other) > $gross) {
                Response::error('Stone and other weights cannot exceed Gross Weight.', 422);
            }

            $net = $gross - ($stone + $other);
            if (isset($body['fine_weight']) && (float)$body['fine_weight'] > $net) {
                Response::error('Fine Weight cannot exceed Net Weight.', 422);
            }

            if (isset($body['quantity']) && (int)$body['quantity'] < 0) {
                Response::error('Quantity cannot be negative.', 422);
            }

            // 2. Validate uniqueness of stock code if manually entered
            if (!empty($body['stock_code'])) {
                $existing = StockItem::findByCode($body['stock_code']);
                if ($existing) {
                    Response::error("Stock code '{$body['stock_code']}' is already in use.", 409);
                }
            }

            $created = StockItem::create($body);
            Response::json([
                'success' => true,
                'message' => 'Stock item added successfully.',
                'data'    => $created,
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/stock/update?id=
     */
    public static function update(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid stock item ID is required.', 400);
            }

            $existing = StockItem::findById($id);
            if (!$existing) {
                Response::error("Stock item #{$id} not found.", 404);
            }

            $body = Validator::getJsonBody();

            if (isset($body['item_name']) && trim($body['item_name']) === '') {
                Response::error('Item Name cannot be empty.', 422);
            }

            if (isset($body['gross_weight']) && (!is_numeric($body['gross_weight']) || (float)$body['gross_weight'] < 0)) {
                Response::error('Gross Weight must be a valid non-negative number.', 422);
            }

            if (!empty($body['stock_code'])) {
                $conflict = StockItem::findByCode($body['stock_code'], $id);
                if ($conflict) {
                    Response::error("Stock code '{$body['stock_code']}' is already in use by another item.", 409);
                }
            }

            $updated = StockItem::update($id, $body);
            Response::json([
                'success' => true,
                'message' => 'Stock item updated successfully.',
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/stock/delete?id=
     */
    public static function delete(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid stock item ID is required.', 400);
            }

            $existing = StockItem::findById($id);
            if (!$existing) {
                Response::error("Stock item #{$id} not found.", 404);
            }

            StockItem::delete($id);

            Response::json([
                'success' => true,
                'message' => "Stock item #{$id} ({$existing['stock_code']}) deleted successfully.",
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/stock/dropdown-options
     */
    public static function dropdownOptions(): void {
        try {
            $options = StockItem::getDropdownOptions();
            Response::json($options);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
