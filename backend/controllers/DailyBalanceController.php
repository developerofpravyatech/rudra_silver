<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\DailyBalance;
use Exception;

class DailyBalanceController {
    /**
     * GET /api/daily-balance/list
     * Server-side search, filters, pagination, and SQL SUM() grand totals
     */
    public static function list(): void {
        try {
            $filters = [
                'search'            => $_GET['search'] ?? null,
                'account_name'      => $_GET['account_name'] ?? null,
                'city'              => $_GET['city'] ?? null,
                'state'             => $_GET['state'] ?? null,
                'location'          => $_GET['location'] ?? null,
                'group_id'          => $_GET['group_id'] ?? null,
                'group_name'        => $_GET['group_name'] ?? null,
                'ref_by'            => $_GET['ref_by'] ?? null,
                'occupation'        => $_GET['occupation'] ?? null,
                'type'              => $_GET['type'] ?? null,
                'date'              => $_GET['date'] ?? null,
                'opening_date'      => $_GET['opening_date'] ?? null,
                'from_date'         => $_GET['from_date'] ?? null,
                'to_date'           => $_GET['to_date'] ?? null,
                'balance_filter'    => $_GET['balance_filter'] ?? 'all',
                'with_balance'      => !empty($_GET['with_balance']),
                'zero_balance'      => !empty($_GET['zero_balance']),
                'dia_stn_balance'   => !empty($_GET['dia_stn_balance']),
                'hisab_final'       => !empty($_GET['hisab_final']),
                'hisab_pending'     => !empty($_GET['hisab_pending']),
                'without_transact'  => !empty($_GET['without_transact']),
                'high_priority'     => !empty($_GET['high_priority']),
                'with_last_sp_date' => !empty($_GET['with_last_sp_date']),
                'min_amount'        => $_GET['min_amount'] ?? null,
                'max_amount'        => $_GET['max_amount'] ?? null,
                'outstanding_only'  => !empty($_GET['outstanding_only']),
                'agent_hp_only'     => !empty($_GET['agent_hp_only']),
            ];

            $sortBy = $_GET['sort_by'] ?? 'id';
            $sortOrder = $_GET['sort_order'] ?? 'asc';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));

            $result = DailyBalance::paginate(
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
     * GET /api/daily-balance/view?id=
     */
    public static function view(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid record ID is required.', 400);
            }

            $item = DailyBalance::findById($id);
            if (!$item) {
                Response::error("Daily balance record #{$id} not found.", 404);
            }

            Response::json($item);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Validate daily balance input data
     */
    private static function validateData(array $body, bool $isUpdate = false): void {
        $errors = [];

        if (!$isUpdate || array_key_exists('account_name', $body)) {
            if (empty($body['account_name']) || trim((string)$body['account_name']) === '') {
                $errors['account_name'] = 'Account Name is required.';
            }
        }

        if (!empty($body['balance_date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', trim((string)$body['balance_date']))) {
            $errors['balance_date'] = 'Balance Date must be in YYYY-MM-DD format.';
        }

        if (!empty($body['payment_date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', trim((string)$body['payment_date']))) {
            $errors['payment_date'] = 'Payment Date must be in YYYY-MM-DD format.';
        }

        if (!empty($body['mobile'])) {
            $cleanMobile = preg_replace('/\D/', '', (string)$body['mobile']);
            if (strlen($cleanMobile) !== 10) {
                $errors['mobile'] = 'Mobile number must be exactly 10 digits.';
            }
        }

        $numericFields = [
            'gold_fine'           => 3,
            'silver_fine'         => 3,
            'amount'              => 2,
            'diamond_weight'      => 3,
            'stone_weight'        => 3,
            'gold_gross_weight'   => 3,
            'silver_gross_weight' => 3,
        ];

        foreach (array_keys($numericFields) as $field) {
            if (array_key_exists($field, $body) && $body[$field] !== null && $body[$field] !== '') {
                $val = trim((string)$body[$field]);
                if (!is_numeric($val)) {
                    $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' must be a valid number.';
                }
            }
        }

        if (!empty($errors)) {
            Response::error(reset($errors), 422, ['errors' => $errors]);
        }
    }

    /**
     * POST /api/daily-balance/create
     */
    public static function create(): void {
        try {
            $body = Validator::getJsonBody();
            self::validateData($body, false);

            $created = DailyBalance::create($body);
            Response::json([
                'success' => true,
                'message' => "Daily balance record for '{$created['account_name']}' created successfully.",
                'data'    => $created,
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/daily-balance/update?id=
     */
    public static function update(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid record ID is required.', 400);
            }

            $body = Validator::getJsonBody();
            self::validateData($body, true);

            $updated = DailyBalance::update($id, $body);
            Response::json([
                'success' => true,
                'message' => "Daily balance record #{$id} updated successfully.",
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            $code = str_contains($e->getMessage(), 'not found') || str_contains($e->getMessage(), 'does not exist') ? 404 : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /api/daily-balance/delete?id=
     */
    public static function delete(): void {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                Response::error('Valid record ID is required.', 400);
            }

            $existing = DailyBalance::findById($id);
            if (!$existing) {
                Response::error("Daily balance record #{$id} not found.", 404);
            }

            $deleted = DailyBalance::delete($id);
            if ($deleted) {
                Response::json([
                    'success' => true,
                    'message' => "Daily balance record for '{$existing['account_name']}' (#{$id}) deleted successfully.",
                ]);
            } else {
                Response::error("Could not delete daily balance record #{$id}.", 500);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/daily-balance/filter-options
     */
    public static function filterOptions(): void {
        try {
            $state = $_GET['state'] ?? null;
            $options = DailyBalance::getFilterOptions($state);
            Response::json($options);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/daily-balance/accounts-lookup
     */
    public static function accountsLookup(): void {
        try {
            $accounts = DailyBalance::getAccountsLookup();
            Response::json($accounts);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/daily-balance/export-all
     */
    public static function exportAll(): void {
        try {
            $filters = [
                'search'            => $_GET['search'] ?? null,
                'account_name'      => $_GET['account_name'] ?? null,
                'city'              => $_GET['city'] ?? null,
                'state'             => $_GET['state'] ?? null,
                'location'          => $_GET['location'] ?? null,
                'group_id'          => $_GET['group_id'] ?? null,
                'group_name'        => $_GET['group_name'] ?? null,
                'ref_by'            => $_GET['ref_by'] ?? null,
                'occupation'        => $_GET['occupation'] ?? null,
                'type'              => $_GET['type'] ?? null,
                'date'              => $_GET['date'] ?? null,
                'opening_date'      => $_GET['opening_date'] ?? null,
                'from_date'         => $_GET['from_date'] ?? null,
                'to_date'           => $_GET['to_date'] ?? null,
                'balance_filter'    => $_GET['balance_filter'] ?? 'all',
                'with_balance'      => !empty($_GET['with_balance']),
                'zero_balance'      => !empty($_GET['zero_balance']),
                'dia_stn_balance'   => !empty($_GET['dia_stn_balance']),
                'hisab_final'       => !empty($_GET['hisab_final']),
                'hisab_pending'     => !empty($_GET['hisab_pending']),
                'without_transact'  => !empty($_GET['without_transact']),
                'high_priority'     => !empty($_GET['high_priority']),
                'with_last_sp_date' => !empty($_GET['with_last_sp_date']),
                'min_amount'        => $_GET['min_amount'] ?? null,
                'max_amount'        => $_GET['max_amount'] ?? null,
                'outstanding_only'  => !empty($_GET['outstanding_only']),
                'agent_hp_only'     => !empty($_GET['agent_hp_only']),
            ];

            $sortBy = $_GET['sort_by'] ?? 'id';
            $sortOrder = $_GET['sort_order'] ?? 'asc';

            $records = DailyBalance::getAllMatching($filters, $sortBy, $sortOrder);
            Response::json($records);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
