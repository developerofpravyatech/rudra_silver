<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\StockStatus;
use Exception;

class StockStatusController {
    /**
     * GET /api/stock-status/list
     * Server-side search, filtering by unit, pagination, and dynamic totals
     */
    public static function list(): void {
        try {
            $search = $_GET['search'] ?? null;
            $unit = $_GET['unit'] ?? null;
            $typeWiseGroup = $_GET['type_wise_group'] ?? null;
            $statusFilter = $_GET['status_filter'] ?? null;
            $itemType = $_GET['item_type'] ?? null;
            $itemNameFilter = $_GET['item_name_filter'] ?? null;
            $itemDropdown = $_GET['item_dropdown'] ?? null;
            $dateFrom = $_GET['date_from'] ?? null;
            $dateTo = $_GET['date_to'] ?? null;
            $approvalFlag = $_GET['approval_flag'] ?? null;
            $entryWiseFlag = $_GET['entry_wise_flag'] ?? null;
            $kachiList = $_GET['kachi_list'] ?? null;
            $itemWiseFilter = $_GET['item_wise_filter'] ?? null;
            $allRecords = $_GET['all_records'] ?? null;
            $sortBy = $_GET['sort_by'] ?? 'id';
            $sortOrder = $_GET['sort_order'] ?? 'asc';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = isset($_GET['all_records']) && $_GET['all_records'] === '1'
                ? 5000
                : min(100, max(1, (int)($_GET['limit'] ?? 10)));

            $result = StockStatus::paginate(
                $search, $unit, $typeWiseGroup, $statusFilter, $itemType, $itemNameFilter,
                $itemDropdown, $dateFrom, $dateTo, $approvalFlag, $entryWiseFlag,
                $kachiList, $itemWiseFilter, $allRecords, $sortBy, $sortOrder, $page, $limit
            );
            $result['filter_capabilities'] = StockStatus::getFilterCapabilities();
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/stock-status/view?id=
     * Fetch one record using id
     */
    public static function view(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid record ID is required.', 400);
            }

            $item = StockStatus::findById($id);
            if (!$item) {
                Response::error("Stock record #{$id} not found.", 404);
            }

            Response::json($item);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * POST /api/stock-status/create
     * Validate input and insert new stock record using PDO prepared statements
     */
    public static function create(): void {
        try {
            $body = Validator::getJsonBody();

            // Validate item name
            if (empty($body['item_name']) || trim($body['item_name']) === '') {
                Response::error('Item Name is required.', 422);
            }

            // Validate numeric fields: valid numbers, max 3 decimal places (allow negative, zero, decimal)
            $numericFields = ['pc', 'gross_weight', 'net_weight', 'tunch', 'wastage', 'labour_weight', 'rate', 'silver_fine', 'total', 'gold_fine'];
            foreach ($numericFields as $field) {
                if (array_key_exists($field, $body) && $body[$field] !== null && $body[$field] !== '') {
                    $val = trim($body[$field]);
                    if (!is_numeric($val)) {
                        Response::error("$field must be a valid number.", 422);
                    }
                    // Validate decimal precision (max 3 decimal places)
                    if (strpos($val, '.') !== false) {
                        $decimalPart = substr($val, strpos($val, '.') + 1);
                        if (strlen($decimalPart) > 3) {
                            Response::error("$field must have maximum 3 decimal places.", 422);
                        }
                    }
                }
            }

            // Validate unit if provided
            if (array_key_exists('unit', $body) && $body['unit'] !== '') {
                $unit = trim($body['unit']);
                $validUnits = StockStatus::getDistinctUnits();
                $unitExists = false;
                foreach ($validUnits as $u) {
                    if (strcasecmp($u, $unit) === 0) {
                        $unitExists = true;
                        break;
                    }
                }
                if (!$unitExists) {
                    Response::error('Invalid unit. Must be one of: ' . implode(', ', $validUnits), 422);
                }
            }

            $created = StockStatus::create($body);
            Response::json([
                'success' => true,
                'message' => "Stock item '{$created['item_name']}' created successfully.",
                'data'    => $created,
            ], 201);
        } catch (Exception $e) {
            $code = str_contains($e->getMessage(), 'already exists') ? 409 : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * PUT /api/stock-status/update?id=
     * Update the selected record using id. Never inserts a new record during update.
     */
    public static function update(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid record ID is required.', 400);
            }

            $body = Validator::getJsonBody();

            // Validate item name if provided
            if (isset($body['item_name']) && trim($body['item_name']) === '') {
                Response::error('Item Name cannot be empty.', 422);
            }

            // Validate numeric fields: valid numbers, max 3 decimal places (allow negative, zero, decimal)
            if (isset($body['pc']) || isset($body['gross_weight']) || isset($body['net_weight']) || isset($body['tunch']) || isset($body['wastage']) || isset($body['labour_weight']) || isset($body['rate']) || isset($body['silver_fine']) || isset($body['total']) || isset($body['gold_fine'])) {
                $numericFields = ['pc', 'gross_weight', 'net_weight', 'tunch', 'wastage', 'labour_weight', 'rate', 'silver_fine', 'total', 'gold_fine'];
                foreach ($numericFields as $field) {
                    if (array_key_exists($field, $body) && $body[$field] !== null && $body[$field] !== '') {
                        $val = trim($body[$field]);
                        if (!is_numeric($val)) {
                            Response::error("$field must be a valid number.", 422);
                        }
                        // Validate decimal precision (max 3 decimal places)
                        if (strpos($val, '.') !== false) {
                            $decimalPart = substr($val, strpos($val, '.') + 1);
                            if (strlen($decimalPart) > 3) {
                                Response::error("$field must have maximum 3 decimal places.", 422);
                            }
                        }
                    }
                }
            }

            // Validate unit if provided
            if (array_key_exists('unit', $body) && $body['unit'] !== '') {
                $unit = trim($body['unit']);
                $validUnits = StockStatus::getDistinctUnits();
                $unitExists = false;
                foreach ($validUnits as $u) {
                    if (strcasecmp($u, $unit) === 0) {
                        $unitExists = true;
                        break;
                    }
                }
                if (!$unitExists) {
                    Response::error('Invalid unit. Must be one of: ' . implode(', ', $validUnits), 422);
                }
            }

            $updated = StockStatus::update($id, $body);
            Response::json([
                'success' => true,
                'message' => "Stock item '{$updated['item_name']}' updated successfully.",
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            $code = str_contains($e->getMessage(), 'already exists') ? 409 : (str_contains($e->getMessage(), 'not found') ? 404 : 400);
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /api/stock-status/delete?id=
     * Delete the selected record using id
     */
    public static function delete(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid record ID is required.', 400);
            }

            $existing = StockStatus::findById($id);
            if (!$existing) {
                Response::error("Stock record #{$id} not found.", 404);
            }

            StockStatus::delete($id);

            Response::json([
                'success' => true,
                'message' => "Stock item '{$existing['item_name']}' (#{$id}) deleted successfully.",
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/stock-status/units
     * Returns distinct units available in database
     */
    public static function units(): void {
        try {
            $units = StockStatus::getDistinctUnits();
            Response::json($units);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/stock-status/export-all
     * Fetch all matching records without pagination for client-side export
     */
    public static function exportAll(): void {
        try {
            $items = StockStatus::getAllMatching(
                $_GET['search'] ?? null,
                $_GET['unit'] ?? null,
                $_GET['type_wise_group'] ?? null,
                $_GET['status_filter'] ?? null,
                $_GET['item_type'] ?? null,
                $_GET['item_name_filter'] ?? null,
                $_GET['item_dropdown'] ?? null,
                $_GET['date_from'] ?? null,
                $_GET['date_to'] ?? null,
                $_GET['approval_flag'] ?? null,
                $_GET['entry_wise_flag'] ?? null,
                $_GET['kachi_list'] ?? null,
                $_GET['item_wise_filter'] ?? null,
                $_GET['all_records'] ?? null
            );
            Response::json($items);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
