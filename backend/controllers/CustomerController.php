<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\Customer;
use Exception;

class CustomerController {
    /**
     * GET /api/customers or /api/customers/list or /api/v1/customers
     */
    public static function listCustomers(): void {
        try {
            $filters = [
                'search'     => $_GET['search'] ?? null,
                'name'       => $_GET['name'] ?? null,
                'city'       => $_GET['city'] ?? null,
                'location'   => $_GET['location'] ?? null,
                'mobile'     => $_GET['mobile'] ?? null,
                'sort_by'    => $_GET['sort_by'] ?? 'CustomerID',
                'sort_order' => $_GET['sort_order'] ?? 'desc',
            ];

            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));

            $result = Customer::paginate($filters, $page, $limit);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/customers/view?id=X or /api/customers/{id}
     */
    public static function getCustomer(?int $id = null): void {
        try {
            $customerId = $id ?: (int)($_GET['id'] ?? 0);
            if ($customerId <= 0) {
                Response::error('A valid Customer ID is required.', 400);
            }

            $customer = Customer::findById($customerId);
            if (!$customer) {
                Response::error("Customer with ID {$customerId} not found.", 404);
            }

            Response::json($customer);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * POST /api/customers or /api/customers/create
     */
    public static function createCustomer(): void {
        try {
            $body = Validator::getJsonBody();

            if (empty($body['Name']) && empty($body['name'])) {
                Response::error('Customer Name is required.', 422, ['errors' => ['Name' => 'Customer Name is required.']]);
            }

            $newCustomer = Customer::create($body);
            Response::json($newCustomer, 201);
        } catch (Exception $e) {
            $msg = $e->getMessage();
            $decoded = json_decode($msg, true);
            if (is_array($decoded)) {
                Response::error(reset($decoded), 422, ['errors' => $decoded]);
            }
            Response::error($msg, 400);
        }
    }

    /**
     * PUT /api/customers/{id} or POST /api/customers/update
     */
    public static function updateCustomer(?int $id = null): void {
        try {
            $body = Validator::getJsonBody();
            $customerId = $id ?: (int)($body['CustomerID'] ?? $body['id'] ?? $_GET['id'] ?? 0);

            if ($customerId <= 0) {
                Response::error('A valid Customer ID is required for update.', 400);
            }

            $existing = Customer::findById($customerId);
            if (!$existing) {
                Response::error("Customer with ID {$customerId} not found.", 404);
            }

            $updated = Customer::update($customerId, $body);
            Response::json($updated);
        } catch (Exception $e) {
            $msg = $e->getMessage();
            $decoded = json_decode($msg, true);
            if (is_array($decoded)) {
                Response::error(reset($decoded), 422, ['errors' => $decoded]);
            }
            Response::error($msg, 400);
        }
    }

    /**
     * DELETE /api/customers/{id} or POST /api/customers/delete
     */
    public static function deleteCustomer(?int $id = null): void {
        try {
            $body = Validator::getJsonBody();
            $customerId = $id ?: (int)($body['CustomerID'] ?? $body['id'] ?? $_GET['id'] ?? 0);

            if ($customerId <= 0) {
                Response::error('A valid Customer ID is required for deletion.', 400);
            }

            $existing = Customer::findById($customerId);
            if (!$existing) {
                Response::error("Customer with ID {$customerId} not found.", 404);
            }

            $success = Customer::delete($customerId);
            if ($success) {
                Response::json(['success' => true, 'message' => "Customer #{$customerId} deleted successfully."]);
            } else {
                Response::error("Failed to delete customer #{$customerId}.", 500);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
