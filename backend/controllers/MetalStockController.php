<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\MetalStock;
use Models\StockType;
use Exception;

class MetalStockController {
    /**
     * GET /api/metal-stock/list
     * Server-side search, group/item/stock_type/date/approval filters, pagination & grand totals
     */
    public static function list(): void {
        try {
            $filters = [
                'search'      => $_GET['search'] ?? null,
                'group_name'  => $_GET['group_name'] ?? null,
                'item_name'   => $_GET['item_name'] ?? null,
                'stock_type'  => $_GET['stock_type'] ?? null,
                'unit'        => $_GET['unit'] ?? null,
                'from_date'   => $_GET['from_date'] ?? null,
                'to_date'     => $_GET['to_date'] ?? null,
                'stock_date'  => $_GET['stock_date'] ?? null,
                'is_approved' => $_GET['is_approved'] ?? null,
                'entry_wise'  => $_GET['entry_wise'] ?? null,
                'entry_no'    => $_GET['entry_no'] ?? null,
            ];

            $sortBy = $_GET['sort_by'] ?? 'id';
            $sortOrder = $_GET['sort_order'] ?? 'asc';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));

            $result = MetalStock::paginate(
                $filters,
                $sortBy,
                $sortOrder,
                $page,
                $limit
            );

            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/metal-stock/view?id=
     * Fetch single record by ID
     */
    public static function view(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid record ID is required.', 400);
            }

            $item = MetalStock::findById($id);
            if (!$item) {
                Response::error("Metal stock record #{$id} not found.", 404);
            }

            Response::json($item);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Validate metal stock data for create / update
     */
    private static function validateData(array $body, bool $isUpdate = false): void {
        $errors = [];

        if (!$isUpdate || array_key_exists('item_name', $body)) {
            if (empty($body['item_name']) || trim((string)$body['item_name']) === '') {
                $errors['item_name'] = 'Item Name is required.';
            }
        }

        if (!$isUpdate || array_key_exists('stock_date', $body)) {
            if (empty($body['stock_date']) || trim((string)$body['stock_date']) === '') {
                $errors['stock_date'] = 'Stock Date is required.';
            } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', trim((string)$body['stock_date']))) {
                $errors['stock_date'] = 'Stock Date must be in YYYY-MM-DD format.';
            }
        }

        if (!empty($body['stock_type'])) {
            $allowedStockTypes = StockType::names();
            $matched = false;
            foreach ($allowedStockTypes as $st) {
                if (strcasecmp($st, trim((string)$body['stock_type'])) === 0) {
                    $matched = true;
                    break;
                }
            }
            if (!$matched) {
                $errors['stock_type'] = 'Invalid Stock Type. Allowed: ' . implode(', ', $allowedStockTypes);
            }
        }

        $numericFields = ['pc', 'gross_weight', 'net_weight', 'tunch', 'wastage', 'labour_weight', 'rate', 'silver_fine', 'total', 'gold_fine'];
        foreach ($numericFields as $field) {
            if (array_key_exists($field, $body) && $body[$field] !== null && $body[$field] !== '') {
                $val = trim((string)$body[$field]);
                if (!is_numeric($val)) {
                    $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' must be a valid number.';
                    continue;
                }
                if (str_contains($val, '.')) {
                    $decimalPart = substr($val, strpos($val, '.') + 1);
                    if (strlen($decimalPart) > 3) {
                        $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' cannot exceed 3 decimal places.';
                    }
                }
            }
        }

        if (!empty($errors)) {
            Response::error(reset($errors), 422, ['errors' => $errors]);
        }
    }

    /**
     * POST /api/metal-stock/create
     * Insert new metal stock record
     */
    public static function create(): void {
        try {
            $body = Validator::getJsonBody();
            self::validateData($body, false);

            $created = MetalStock::create($body);
            Response::json([
                'success' => true,
                'message' => "Metal stock item '{$created['item_name']}' created successfully.",
                'data'    => $created,
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/metal-stock/update?id=
     * Update existing metal stock record
     */
    public static function update(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid record ID is required.', 400);
            }

            $body = Validator::getJsonBody();
            self::validateData($body, true);

            $updated = MetalStock::update($id, $body);
            Response::json([
                'success' => true,
                'message' => "Metal stock item #{$id} updated successfully.",
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            $code = str_contains($e->getMessage(), 'not found') || str_contains($e->getMessage(), 'does not exist') ? 404 : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /api/metal-stock/delete?id=
     * Delete record by ID
     */
    public static function delete(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid record ID is required.', 400);
            }

            $existing = MetalStock::findById($id);
            if (!$existing) {
                Response::error("Metal stock record #{$id} not found.", 404);
            }

            $deleted = MetalStock::delete($id);
            if ($deleted) {
                Response::json([
                    'success' => true,
                    'message' => "Metal stock record '{$existing['item_name']}' (#{$id}) deleted successfully.",
                ]);
            } else {
                Response::error("Could not delete record #{$id}.", 500);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/metal-stock/filter-options
     * Returns distinct group names, item names, units, and stock types
     */
    public static function filterOptions(): void {
        try {
            $options = MetalStock::getFilterOptions();
            Response::json($options);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/metal-stock/stock-types
     * Returns dynamically configured stock types from settings / database
     */
    public static function stockTypes(): void {
        try {
            $includeInactive = !isset($_GET['active_only']) || $_GET['active_only'] !== '1';
            $types = StockType::all($includeInactive);
            Response::json($types);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/metal-stock/metal-types
     * Returns dynamically configured metal types from stock_types table / settings
     */
    public static function metalTypes(): void {
        try {
            $types = StockType::all();
            $typeNames = array_column($types, 'name');
            Response::json($typeNames);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/metal-stock/export-all
     * Fetch all matching records for CSV/Excel/PDF exports
     */
    public static function exportAll(): void {
        try {
            $filters = [
                'search'      => $_GET['search'] ?? null,
                'group_name'  => $_GET['group_name'] ?? null,
                'item_name'   => $_GET['item_name'] ?? null,
                'stock_type'  => $_GET['stock_type'] ?? null,
                'unit'        => $_GET['unit'] ?? null,
                'from_date'   => $_GET['from_date'] ?? null,
                'to_date'     => $_GET['to_date'] ?? null,
                'stock_date'  => $_GET['stock_date'] ?? null,
                'is_approved' => $_GET['is_approved'] ?? null,
                'entry_wise'  => $_GET['entry_wise'] ?? null,
                'entry_no'    => $_GET['entry_no'] ?? null,
            ];

            $sortBy = $_GET['sort_by'] ?? 'id';
            $sortOrder = $_GET['sort_order'] ?? 'asc';

            $records = MetalStock::getAllMatching($filters, $sortBy, $sortOrder);
            Response::json($records);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
