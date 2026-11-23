<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\Category;
use Exception;

class CategoryController {
    /**
     * GET /api/categories/list or /api/v1/categories
     */
    public static function listCategories(): void {
        try {
            $filters = [
                'search'     => $_GET['search'] ?? null,
                'name'       => $_GET['name'] ?? null,
                'hsn_code'   => $_GET['hsn_code'] ?? null,
                'metal_type' => $_GET['metal_type'] ?? null,
                'sort_by'    => $_GET['sort_by'] ?? 'id',
                'sort_order' => $_GET['sort_order'] ?? 'asc',
            ];

            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));

            $result = Category::paginate($filters, $page, $limit);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/categories/view?id=X or /api/v1/categories/{id}
     */
    public static function getCategory(?int $id = null): void {
        try {
            $catId = $id ?: (int)($_GET['id'] ?? 0);
            if ($catId <= 0) {
                Response::error('A valid Category ID is required.', 400);
            }

            $cat = Category::findById($catId);
            if (!$cat) {
                Response::error("Category with ID {$catId} not found.", 404);
            }

            Response::json($cat);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Validate Category input data
     */
    private static function validateData(array $body, bool $isUpdate = false, ?int $catId = null): void {
        $errors = [];

        if (!$isUpdate || array_key_exists('name', $body)) {
            $name = trim((string)($body['name'] ?? ''));
            if ($name === '') {
                $errors['name'] = 'Category Name is required.';
            } elseif (mb_strlen($name) > 80) {
                $errors['name'] = 'Category Name must not exceed 80 characters.';
            } else {
                $dup = Category::findByName($name, $catId);
                if ($dup) {
                    $errors['name'] = "Category Name '{$name}' is already used.";
                }
            }
        }

        if (!$isUpdate || array_key_exists('metal_type', $body)) {
            $mt = strtoupper(trim((string)($body['metal_type'] ?? '')));
            if ($mt === '') {
                $errors['metal_type'] = 'Metal Type is required.';
            } elseif (!in_array($mt, Category::METAL_TYPES, true)) {
                $errors['metal_type'] = 'Invalid Metal Type. Allowed: ' . implode(', ', Category::METAL_TYPES);
            }
        }

        if (!empty($body['hsn_code'])) {
            $hsn = trim((string)$body['hsn_code']);
            if (strlen($hsn) > 20) {
                $errors['hsn_code'] = 'HSN Code must not exceed 20 characters.';
            }
        }

        if (!empty($errors)) {
            Response::error(reset($errors), 422, ['errors' => $errors]);
        }
    }

    /**
     * POST /api/categories/create or /api/v1/categories
     */
    public static function createCategory(): void {
        try {
            $body = Validator::getJsonBody();
            self::validateData($body, false, null);

            $cat = Category::create($body);
            Response::json($cat, 201);
        } catch (Exception $e) {
            $code = str_contains($e->getMessage(), 'already used') || str_contains($e->getMessage(), 'Duplicate') ? 409 : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * PUT /api/v1/categories/{id} or POST /api/categories/update
     */
    public static function updateCategory(?int $id = null): void {
        try {
            $body = Validator::getJsonBody();
            $catId = $id ?: (int)($body['id'] ?? $_GET['id'] ?? 0);

            if ($catId <= 0) {
                Response::error('A valid Category ID is required for update.', 400);
            }

            $existing = Category::findById($catId);
            if (!$existing) {
                Response::error("Category with ID {$catId} not found.", 404);
            }

            self::validateData($body, true, $catId);

            $updated = Category::update($catId, $body);
            Response::json($updated);
        } catch (Exception $e) {
            $code = str_contains($e->getMessage(), 'already used') || str_contains($e->getMessage(), 'Duplicate') ? 409 : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /api/v1/categories/{id} or DELETE/POST /api/categories/delete
     */
    public static function deleteCategory(?int $id = null): void {
        try {
            $catId = $id ?: (int)($_GET['id'] ?? 0);
            if ($catId <= 0) {
                $body = Validator::getJsonBody();
                $catId = (int)($body['id'] ?? 0);
            }

            if ($catId <= 0) {
                Response::error('A valid Category ID is required for deletion.', 400);
            }

            $existing = Category::findById($catId);
            if (!$existing) {
                Response::error("Category with ID {$catId} not found.", 404);
            }

            // Referential integrity check
            $ref = Category::isReferenced($catId);
            if ($ref['referenced']) {
                Response::error("Cannot delete category '{$existing['name']}' (ID: {$catId}): It is currently referenced by {$ref['item_count']} item(s) in the item master. Please reassign or delete the associated items first.", 409);
            }

            Category::delete($catId);
            Response::json([
                'success' => true,
                'message' => "Category '{$existing['name']}' (ID: {$catId}) deleted successfully."
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/categories/check-name?name=X&exclude_id=Y
     */
    public static function checkName(): void {
        try {
            $name = trim($_GET['name'] ?? '');
            if ($name === '') {
                Response::error('Name parameter is required.', 400);
            }

            $excludeId = isset($_GET['exclude_id']) && (int)$_GET['exclude_id'] > 0 ? (int)$_GET['exclude_id'] : null;
            $existing = Category::findByName($name, $excludeId);

            if ($existing) {
                Response::json([
                    'available' => false,
                    'message'   => "Category Name '{$name}' is already used."
                ]);
            } else {
                Response::json([
                    'available' => true,
                    'message'   => "Category Name '{$name}' is available."
                ]);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/categories/metal-types
     */
    public static function metalTypes(): void {
        Response::json(Category::METAL_TYPES);
    }

    /**
     * GET /api/categories/export-all
     */
    public static function exportAll(): void {
        try {
            $filters = [
                'search'     => $_GET['search'] ?? null,
                'name'       => $_GET['name'] ?? null,
                'hsn_code'   => $_GET['hsn_code'] ?? null,
                'metal_type' => $_GET['metal_type'] ?? null,
                'sort_by'    => $_GET['sort_by'] ?? 'id',
                'sort_order' => $_GET['sort_order'] ?? 'asc',
            ];

            $result = Category::paginate($filters, 1, 1000);
            Response::json($result['items']);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
