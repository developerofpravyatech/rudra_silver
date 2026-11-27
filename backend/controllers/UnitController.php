<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\Unit;
use Exception;

class UnitController {
    /**
     * GET /api/v1/units
     * Supports ?search=, ?active_only=1
     */
    public static function list(): void {
        try {
            $search     = isset($_GET['search']) ? trim($_GET['search']) : null;
            $activeOnly = isset($_GET['active_only']) && $_GET['active_only'] === '1';

            if ($activeOnly) {
                $items = Unit::getActive();
            } else {
                $items = Unit::all($search ?: null);
            }

            $counts = Unit::count();
            Response::json([
                'data'   => $items,
                'counts' => $counts,
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/units/active
     */
    public static function getActive(): void {
        try {
            $items = Unit::getActive();
            Response::json($items);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/units
     */
    public static function create(): void {
        try {
            $body    = Validator::getJsonBody();
            $name    = trim($body['name'] ?? '');
            $code    = strtoupper(trim($body['code'] ?? ''));
            $isActive = isset($body['is_active']) ? (int)$body['is_active'] : 1;

            if (empty($name)) {
                Response::error('Unit Name is required.', 400);
                return;
            }
            if (empty($code)) {
                Response::error('Unit Code / Symbol is required.', 400);
                return;
            }

            if (Unit::findByName($name)) {
                Response::error("Unit '{$name}' already exists. Please choose a unique name.", 409);
                return;
            }
            if (Unit::findByCode($code)) {
                Response::error("Unit Code '{$code}' already exists. Please choose a unique code.", 409);
                return;
            }

            $created = Unit::create($name, $code, $isActive);
            Response::json([
                'success' => true,
                'message' => "Unit '{$name}' added successfully.",
                'data'    => $created,
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/v1/units/{id}
     */
    public static function update(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid Unit ID is required.', 400);
                return;
            }
            $existing = Unit::findById($id);
            if (!$existing) {
                Response::error("Unit #{$id} not found.", 404);
                return;
            }

            $body    = Validator::getJsonBody();
            $name    = trim($body['name']    ?? $existing['name']);
            $code    = strtoupper(trim($body['code'] ?? $existing['code']));
            $isActive = isset($body['is_active']) ? (int)$body['is_active'] : (int)$existing['is_active'];

            if (empty($name)) {
                Response::error('Unit Name is required.', 400);
                return;
            }
            if (empty($code)) {
                Response::error('Unit Code / Symbol is required.', 400);
                return;
            }

            if (Unit::findByName($name, $id)) {
                Response::error("Unit '{$name}' already exists. Please choose a unique name.", 409);
                return;
            }
            if (Unit::findByCode($code, $id)) {
                Response::error("Unit Code '{$code}' already exists. Please choose a unique code.", 409);
                return;
            }

            $updated = Unit::update($id, $name, $code, $isActive);
            Response::json([
                'success' => true,
                'message' => "Unit '{$name}' updated successfully.",
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/v1/units/{id}
     */
    public static function delete(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid Unit ID is required.', 400);
                return;
            }
            $existing = Unit::findById($id);
            if (!$existing) {
                Response::error("Unit #{$id} not found.", 404);
                return;
            }

            // Check if used in Metal Stock (by unit name string)
            if (Unit::isUsedInMetalStock($existing['name'])) {
                Response::error("Cannot delete '{$existing['name']}' because it is referenced in Metal Stock records. Consider deactivating it instead.", 400);
                return;
            }
            // Check if used in Stock items (by unit_id FK)
            if (Unit::isUsedInStock($id)) {
                Response::error("Cannot delete '{$existing['name']}' because it is referenced in Stock records. Consider deactivating it instead.", 400);
                return;
            }

            Unit::delete($id);
            Response::json([
                'success' => true,
                'message' => "Unit '{$existing['name']}' deleted successfully.",
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * PATCH /api/v1/units/{id}/toggle
     */
    public static function toggleStatus(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid Unit ID is required.', 400);
                return;
            }
            $existing = Unit::findById($id);
            if (!$existing) {
                Response::error("Unit #{$id} not found.", 404);
                return;
            }

            $updated = Unit::toggleStatus($id);
            $status  = $updated['is_active'] ? 'activated' : 'deactivated';
            Response::json([
                'success' => true,
                'message' => "Unit '{$existing['name']}' has been {$status}.",
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
