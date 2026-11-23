<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\Item;
use Exception;

class ItemController {
    /**
     * GET /api/v1/items or /api/items/list
     */
    public static function listItems(): void {
        try {
            $filters = [
                'search'       => $_GET['search'] ?? null,
                'name'         => $_GET['name'] ?? null,
                'code'         => $_GET['code'] ?? null,
                'group_name'   => $_GET['group_name'] ?? null,
                'category_id'  => $_GET['category_id'] ?? null,
                'is_active'    => $_GET['is_active'] ?? null,
                'stock_method' => $_GET['stock_method'] ?? null,
                'labour_type'  => $_GET['labour_type'] ?? null,
                'sort_by'      => $_GET['sort_by'] ?? 'id',
                'sort_order'   => $_GET['sort_order'] ?? 'asc',
            ];

            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));

            $result = Item::paginate($filters, $page, $limit);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/items/{id} or /api/items/view?id=X
     */
    public static function getItem(?int $id = null): void {
        try {
            $itemId = $id ?: (int)($_GET['id'] ?? 0);
            if ($itemId <= 0) {
                Response::error('A valid Item ID is required.', 400);
            }

            $item = Item::findById($itemId);
            if (!$item) {
                Response::error("Item with ID {$itemId} not found.", 404);
            }

            Response::json($item);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/items or /api/items/create
     */
    public static function createItem(): void {
        try {
            $body = Validator::getJsonBody();

            if (empty($body['name']) || trim($body['name']) === '') {
                Response::error('Item Name is required.', 422, ['errors' => ['name' => 'Item Name is required.']]);
            }

            if (empty($body['code']) || trim($body['code']) === '') {
                Response::error('Item Code is required.', 422, ['errors' => ['code' => 'Item Code is required.']]);
            }

            $item = Item::create($body);
            Response::json($item, 201);
        } catch (Exception $e) {
            $code = str_contains($e->getMessage(), 'already exists') ? 409 : 422;
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * PUT /api/v1/items/{id} or POST /api/items/update
     */
    public static function updateItem(?int $id = null): void {
        try {
            $body = Validator::getJsonBody();
            $itemId = $id ?: (int)($body['id'] ?? $_GET['id'] ?? 0);

            if ($itemId <= 0) {
                Response::error('A valid Item ID is required for update.', 400);
            }

            $existing = Item::findById($itemId);
            if (!$existing) {
                Response::error("Item with ID {$itemId} not found.", 404);
            }

            $updated = Item::update($itemId, $body);
            Response::json($updated);
        } catch (Exception $e) {
            $code = str_contains($e->getMessage(), 'already exists') ? 409 : 422;
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /api/v1/items/{id} or DELETE /api/items/delete
     */
    public static function deleteItem(?int $id = null): void {
        try {
            $itemId = $id ?: (int)($_GET['id'] ?? 0);
            if ($itemId <= 0) {
                $body = Validator::getJsonBody();
                $itemId = (int)($body['id'] ?? 0);
            }

            if ($itemId <= 0) {
                Response::error('A valid Item ID is required for deletion.', 400);
            }

            $existing = Item::findById($itemId);
            if (!$existing) {
                Response::error("Item with ID {$itemId} not found.", 404);
            }

            // Check if item is referenced before deleting
            $ref = Item::isReferenced($itemId);
            if ($ref['referenced']) {
                Response::error("Cannot delete item '{$existing['name']}' (ID: {$itemId}): {$ref['message']}. Deactivate the item instead.", 409);
            }

            Item::delete($itemId);
            Response::json([
                'success' => true,
                'message' => "Item '{$existing['name']}' (Code: {$existing['code']}) deleted successfully."
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/items/categories or /api/v1/items/categories
     */
    public static function categories(): void {
        try {
            $categories = Item::getCategories();
            Response::json($categories);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/items/stamps or /api/v1/items/stamps
     */
    public static function stamps(): void {
        try {
            $stamps = Item::getPurityStamps();
            Response::json($stamps);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/items/filter-options or /api/v1/items/filter-options
     */
    public static function filterOptions(): void {
        try {
            $options = Item::getFilterOptions();
            Response::json($options);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/items/check-code?code=X&exclude_id=Y
     */
    public static function checkCode(): void {
        try {
            $code = trim($_GET['code'] ?? '');
            if ($code === '') {
                Response::error('Code parameter is required.', 400);
            }

            $excludeId = null;
            if (!empty($_GET['exclude_id']) && (int)$_GET['exclude_id'] > 0) {
                $excludeId = (int)$_GET['exclude_id'];
            } elseif (!empty($_GET['id']) && (int)$_GET['id'] > 0) {
                $excludeId = (int)$_GET['id'];
            }
            $existing = Item::findByCode($code, $excludeId);

            if ($existing) {
                Response::json([
                    'available' => false,
                    'message'   => "Item Code '{$code}' is already used by item: '{$existing['name']}'."
                ]);
            } else {
                Response::json([
                    'available' => true,
                    'message'   => "Item Code '{$code}' is available."
                ]);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
