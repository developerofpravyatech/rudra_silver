<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\Item;
use Middleware\AuthMiddleware;
use Exception;

class ItemController {
    /**
     * GET /api/v1/items
     */
    public static function listItems(): void {
        try {
            $search = $_GET['search'] ?? null;
            $groupName = $_GET['group_name'] ?? null;
            $hsnCode = $_GET['hsn_code'] ?? null;
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));

            $result = Item::paginate($search, $groupName, $hsnCode, $page, $limit);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/items/{id}
     */
    public static function getItem(int $id): void {
        try {
            $item = Item::findById($id);
            if (!$item) {
                Response::error("Item with ID {$id} not found.", 404);
            }
            Response::json($item);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/items
     */
    public static function createItem(): void {
        try {
            $body = Validator::getJsonBody();

            if (empty($body['group_name']) || trim($body['group_name']) === '') {
                Response::error('Group Name is required.', 400);
            }

            $item = Item::create($body);
            Response::json($item, 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/v1/items/{id}
     */
    public static function updateItem(int $id): void {
        try {
            $body = Validator::getJsonBody();

            $existing = Item::findById($id);
            if (!$existing) {
                Response::error("Item with ID {$id} not found.", 404);
            }

            $updated = Item::update($id, $body);
            Response::json($updated);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/v1/items/{id}
     */
    public static function deleteItem(int $id): void {
        try {
            $existing = Item::findById($id);
            if (!$existing) {
                Response::error("Item with ID {$id} not found.", 404);
            }

            if (Item::isReferenced($id)) {
                Response::error("Cannot delete item (ID: {$id}): Referenced by existing inventory tags or invoices. You can deactivate it instead.", 409);
            }

            Item::delete($id);
            Response::json([
                'success' => true,
                'message' => "Item '{$existing['group_name']}' (ID: {$id}) deleted successfully."
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
}
