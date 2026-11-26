<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\StockType;
use Exception;

class StockTypeController {
    /**
     * GET /api/settings/stock-types
     * Supports ?include_inactive=1 or ?active_only=1
     */
    public static function index(): void {
        try {
            $includeInactive = !isset($_GET['active_only']) || $_GET['active_only'] !== '1';
            $items = StockType::all($includeInactive);
            Response::json($items);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * POST /api/settings/stock-types
     */
    public static function create(): void {
        try {
            $body = Validator::getJsonBody();
            $name = trim($body['name'] ?? '');
            $isActive = isset($body['is_active']) ? (int)$body['is_active'] : 1;

            if (empty($name)) {
                Response::error('Stock Type Name is required.', 400);
            }

            if (StockType::findByName($name)) {
                Response::error("Stock Type '{$name}' already exists. Please choose a unique name.", 409);
            }

            $created = StockType::create($name, $isActive);
            Response::json([
                'success' => true,
                'message' => 'Stock Type added successfully.',
                'data'    => $created
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/settings/stock-types/{id}
     */
    public static function update(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid Stock Type ID is required.', 400);
            }

            $existing = StockType::findById($id);
            if (!$existing) {
                Response::error("Stock Type #{$id} not found.", 404);
            }

            $body = Validator::getJsonBody();
            $name = trim($body['name'] ?? $existing['name']);
            $isActive = isset($body['is_active']) ? (int)$body['is_active'] : (int)$existing['is_active'];

            if (empty($name)) {
                Response::error('Stock Type Name is required.', 400);
            }

            if (StockType::findByName($name, $id)) {
                Response::error("Stock Type '{$name}' already exists. Please choose a unique name.", 409);
            }

            $updated = StockType::update($id, $name, $isActive);
            Response::json([
                'success' => true,
                'message' => 'Stock Type updated successfully.',
                'data'    => $updated
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/settings/stock-types/{id}
     */
    public static function delete(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid Stock Type ID is required.', 400);
            }

            $existing = StockType::findById($id);
            if (!$existing) {
                Response::error("Stock Type #{$id} not found.", 404);
            }

            // Check if used in Metal Stock
            if (StockType::isUsedInMetalStock($existing['name'])) {
                Response::error("Cannot delete '{$existing['name']}' because it is actively referenced in Metal Stock records. Consider deactivating it instead.", 400);
            }

            StockType::delete($id);
            Response::json([
                'success' => true,
                'message' => "Stock Type '{$existing['name']}' deleted successfully."
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
