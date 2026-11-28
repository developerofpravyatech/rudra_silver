<?php
namespace Controllers;

use Helpers\Response;
use Helpers\Validator;
use Models\SaleRegister;
use Exception;

class SaleRegisterController {
    public static function list(): void {
        try {
            $filters = [
                'search'            => $_GET['search'] ?? null,
                'from_date'         => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'           => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'party_name'        => $_GET['party_name'] ?? null,
                'account_group'     => $_GET['account_group'] ?? null,
                'item_group'        => $_GET['item_group'] ?? null,
                'item_code'         => $_GET['item_code'] ?? null,
                'stamp'             => $_GET['stamp'] ?? null,
                'branch_name'       => $_GET['branch_name'] ?? null,
                'item_type'         => $_GET['item_type'] ?? null,
                'category'          => $_GET['category'] ?? null,
                'series'            => $_GET['series'] ?? null,
                'quality'           => $_GET['quality'] ?? null,
                'voucher_type'      => $_GET['voucher_type'] ?? null,
                'register_type'     => $_GET['register_type'] ?? null,
                'is_sold'           => isset($_GET['is_sold']) && $_GET['is_sold'] !== '' ? $_GET['is_sold'] : null,
                'in_stock'          => isset($_GET['in_stock']) && $_GET['in_stock'] !== '' ? $_GET['in_stock'] : null,
                'net_value'         => isset($_GET['net_value']) && $_GET['net_value'] !== '' ? $_GET['net_value'] : null,
                'is_approved'       => isset($_GET['is_approved']) && $_GET['is_approved'] !== '' ? $_GET['is_approved'] : null,
                'is_excluded'       => isset($_GET['is_excluded']) && $_GET['is_excluded'] !== '' ? $_GET['is_excluded'] : null,
                'include_metal'     => isset($_GET['include_metal']) && $_GET['include_metal'] !== '' ? $_GET['include_metal'] : null,
            ];

            $sortBy = $_GET['sort_by'] ?? 'voucher_date';
            $sortOrder = $_GET['sort_order'] ?? 'desc';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));

            $res = SaleRegister::paginate($filters, $sortBy, $sortOrder, $page, $limit);
            Response::json($res);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function view(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid sale record ID is required.', 400);
            }
            $item = SaleRegister::findById($id);
            if (!$item) {
                Response::error("Sale register record #{$id} not found.", 404);
            }
            Response::json($item);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function create(): void {
        try {
            $body = Validator::getJsonBody();

            if (empty($body['party_name']) || trim((string)$body['party_name']) === '') {
                Response::error('Party Name is required.', 400);
            }
            if (empty($body['item_name']) || trim((string)$body['item_name']) === '') {
                Response::error('Item Name is required.', 400);
            }
            if (empty($body['item_type']) || trim((string)$body['item_type']) === '') {
                Response::error('Item Type is required.', 400);
            }

            $created = SaleRegister::create($body);
            if (!$created) {
                Response::error('Failed to create sale register entry.', 500);
                return;
            }

            // Auto-create invoice voucher for the sale
            try {
                $branchId = 1;
                $series = $body['series'] ?? 'GST';
                $voucherType = 'SALE';

                $db = \Config\Database::getConnection();
                $db->beginTransaction();

                // Find next voucher_no using same logic as Voucher model
                $stmt = $db->prepare('
                    SELECT voucher_no FROM vouchers 
                    WHERE branch_id = :branch_id AND series = :series AND voucher_type = :vtype 
                    ORDER BY voucher_no DESC LIMIT 1
                ');
                $stmt->execute(['branch_id' => $branchId, 'series' => $series, 'vtype' => $voucherType]);
                $lastNo = $stmt->fetchColumn();
                $nextVno = $lastNo ? ((int)$lastNo + 1) : 1;

                $voucherDate = $body['voucher_date'] ?? date('Y-m-d');

                // Insert into vouchers table
                $gstAmt = (float)($body['gst_amount'] ?? 0);
                $taxableAmt = max(0, round(($body['amount'] ?? $body['sale_value'] ?? 0) - $gstAmt, 2));

                $vStmt = $db->prepare('
                    INSERT INTO vouchers (
                        voucher_no, series, branch_id, voucher_type, voucher_date,
                        account_id, second_account_id, gross_amount, discount_amount,
                        taxable_amount, cgst_amount, sgst_amount, igst_amount,
                        net_amount, round_off, settled_fine_gold, settled_fine_silver,
                        settled_cash_inr, narration, common_narration, created_at
                    ) VALUES (
                        :voucher_no, :series, :branch_id, :voucher_type, :voucher_date,
                        :account_id, :second_account_id, :gross_amount, :discount_amount,
                        :taxable_amount, :cgst_amount, :sgst_amount, :igst_amount,
                        :net_amount, :round_off, :settled_fine_gold, :settled_fine_silver,
                        :settled_cash_inr, :narration, :common_narration, NOW()
                    )
                ');

                $vStmt->execute([
                    'voucher_no'          => $nextVno,
                    'series'              => $series,
                    'branch_id'           => $branchId,
                    'voucher_type'        => $voucherType,
                    'voucher_date'        => $voucherDate,
                    'account_id'          => $body['account_group'] ?? 1,
                    'second_account_id'   => null,
                    'gross_amount'        => $body['amount'] ?? $body['sale_value'] ?? 0,
                    'discount_amount'     => $body['gst_amount'] ?? 0,
                    'taxable_amount'      => $taxableAmt,
                    'cgst_amount'         => $body['gst_amount'] ?? 0,
                    'sgst_amount'         => 0,
                    'igst_amount'         => 0,
                    'net_amount'          => $body['amount'] ?? $body['sale_value'] ?? 0,
                    'round_off'           => 0,
                    'settled_fine_gold'   => 0,
                    'settled_fine_silver' => 0,
                    'settled_cash_inr'    => 0,
                    'narration'           => 'Sale Invoice - ' . $nextVno,
                    'common_narration'    => 'Sale Invoice - ' . $nextVno,
                ]);

                $voucherId = (int)$db->lastInsertId();

                // Insert invoice items if item details available
                $items = [];
                if (!empty($body['item_name'])) {
                    $items[] = [
                        'item_description' => $body['item_name'] ?? '',
                        'pieces'           => $body['pieces'] ?? 1,
                        'gross_weight'     => $body['gross_weight'] ?? 0,
                        'net_weight'       => $body['net_weight'] ?? 0,
                        'purity_touch'     => 92.5,
                        'wastage_percent'  => 0,
                        'fine_weight'      => 0,
                        'metal_rate_per_gram'=> 0,
                        'metal_amount'     => 0,
                        'labour_rate'      => 0,
                        'labour_amount'    => 0,
                        'stone_amount'     => 0,
                        'total_item_amount'=> 0,
                        'huid_number'      => null,
                    ];
                }

                if (!empty($items)) {
                    $iStmt = $db->prepare('
                        INSERT INTO voucher_items (
                            voucher_id, tag_id, item_id, purity_stamp_id, item_description,
                            pieces, gross_weight, less_weight, net_weight, purity_touch,
                            wastage_percent, fine_weight, metal_rate_per_gram, metal_amount,
                            labour_rate, labour_amount, stone_amount, total_item_amount, huid_number
                        ) VALUES (
                            :voucher_id, :tag_id, :item_id, :purity_stamp_id, :item_description,
                            :pieces, :gross_weight, :less_weight, :net_weight, :purity_touch,
                            :wastage_percent, :fine_weight, :metal_rate_per_gram, :metal_amount,
                            :labour_rate, :labour_amount, :stone_amount, :total_item_amount, :huid_number
                        ');
                    foreach ($items as $itm) {
                        $iStmt->execute([
                            'voucher_id'          => $voucherId,
                            'tag_id'              => null,
                            'item_id'             => 0,
                            'purity_stamp_id'     => 0,
                            'item_description'    => $itm['item_description'],
                            'pieces'              => (int)($itm['pieces'] ?? 1),
                            'gross_weight'        => (float)($itm['gross_weight'] ?? 0),
                            'less_weight'         => (float)($itm['less_weight'] ?? 0),
                            'net_weight'          => (float)($itm['net_weight'] ?? 0),
                            'purity_touch'        => (float)($itm['purity_touch'] ?? 0),
                            'wastage_percent'     => (float)($itm['wastage_percent'] ?? 0),
                            'fine_weight'         => (float)($itm['fine_weight'] ?? 0),
                            'metal_rate_per_gram' => (float)($itm['metal_rate_per_gram'] ?? 0),
                            'metal_amount'        => (float)($itm['metal_amount'] ?? 0),
                            'labour_rate'         => (float)($itm['labour_rate'] ?? 0),
                            'labour_amount'       => (float)($itm['labour_amount'] ?? 0),
                            'stone_amount'        => (float)($itm['stone_amount'] ?? 0),
                            'total_item_amount'   => (float)($itm['total_item_amount'] ?? 0),
                            'huid_number'         => $itm['huid_number'],
                        ]);
                    }
                }

                // Set payment status to UNPAID for new sale
                $db->prepare("UPDATE vouchers SET paid_amount = 0, outstanding_amount = :out, payment_status = 'UNPAID', status = 'POSTED' WHERE id = :vid")
                    ->execute(['out' => ($body['amount'] ?? $body['sale_value'] ?? 0), 'vid' => $voucherId]);

                $db->commit();
            } catch (Exception $e) {
                $db->rollBack();
                error_log('Auto-invoice creation failed: ' . $e->getMessage());
                // Don't fail the sale registration if invoice creation fails
            }
            Response::json([
                'success' => true,
                'message' => 'Sale register entry added successfully.',
                'data'    => $created,
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public static function update(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid sale record ID is required.', 400);
            }

            $body = Validator::getJsonBody();
            if (isset($body['party_name']) && trim((string)$body['party_name']) === '') {
                Response::error('Party Name cannot be empty.', 400);
            }
            if (isset($body['item_name']) && trim((string)$body['item_name']) === '') {
                Response::error('Item Name cannot be empty.', 400);
            }
            if (isset($body['item_type']) && trim((string)$body['item_type']) === '') {
                Response::error('Item Type cannot be empty.', 400);
            }

            $updated = SaleRegister::update($id, $body);
            Response::json([
                'success' => true,
                'message' => 'Sale register entry updated successfully.',
                'data'    => $updated,
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public static function delete(int $id): void {
        try {
            if ($id <= 0) {
                Response::error('Valid sale record ID is required.', 400);
            }

            $deleted = SaleRegister::softDelete($id);
            if (!$deleted) {
                Response::error("Sale register record #{$id} not found or already deleted.", 404);
            }

            Response::json([
                'success' => true,
                'message' => "Sale register record #{$id} deleted successfully.",
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function filterOptions(): void {
        try {
            $options = SaleRegister::filterOptions();
            Response::json($options);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function export(): void {
        try {
            $filters = [
                'search'        => $_GET['search'] ?? null,
                'from_date'     => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'       => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'party_name'    => $_GET['party_name'] ?? null,
                'account_group' => $_GET['account_group'] ?? null,
                'item_group'    => $_GET['item_group'] ?? null,
                'item_code'     => $_GET['item_code'] ?? null,
                'stamp'         => $_GET['stamp'] ?? null,
                'branch_name'   => $_GET['branch_name'] ?? null,
                'item_type'     => $_GET['item_type'] ?? null,
                'category'      => $_GET['category'] ?? null,
                'series'        => $_GET['series'] ?? null,
                'quality'       => $_GET['quality'] ?? null,
                'voucher_type'  => $_GET['voucher_type'] ?? null,
                'register_type' => $_GET['register_type'] ?? null,
            ];
            $rows = SaleRegister::export($filters);
            Response::json($rows);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function summary(): void {
        try {
            $filters = [
                'search'        => $_GET['search'] ?? null,
                'from_date'     => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'       => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'party_name'    => $_GET['party_name'] ?? null,
                'account_group' => $_GET['account_group'] ?? null,
                'item_group'    => $_GET['item_group'] ?? null,
                'item_code'     => $_GET['item_code'] ?? null,
                'stamp'         => $_GET['stamp'] ?? null,
                'branch_name'   => $_GET['branch_name'] ?? null,
                'item_type'     => $_GET['item_type'] ?? null,
                'category'      => $_GET['category'] ?? null,
                'series'        => $_GET['series'] ?? null,
                'quality'       => $_GET['quality'] ?? null,
                'voucher_type'  => $_GET['voucher_type'] ?? null,
                'register_type' => $_GET['register_type'] ?? null,
                'is_sold'       => isset($_GET['is_sold']) && $_GET['is_sold'] !== '' ? $_GET['is_sold'] : null,
                'in_stock'      => isset($_GET['in_stock']) && $_GET['in_stock'] !== '' ? $_GET['in_stock'] : null,
                'net_value'     => isset($_GET['net_value']) && $_GET['net_value'] !== '' ? $_GET['net_value'] : null,
                'is_approved'   => isset($_GET['is_approved']) && $_GET['is_approved'] !== '' ? $_GET['is_approved'] : null,
                'is_excluded'   => isset($_GET['is_excluded']) && $_GET['is_excluded'] !== '' ? $_GET['is_excluded'] : null,
                'include_metal' => isset($_GET['include_metal']) && $_GET['include_metal'] !== '' ? $_GET['include_metal'] : null,
            ];

            $summary = SaleRegister::getSummary($filters);
            Response::json($summary);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
