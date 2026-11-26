<?php
namespace Controllers;

use Helpers\Response;
use Models\CustomerProfitReport;
use Exception;

class CustomerProfitReportController {

    public static function list(): void {
        try {
            $filters = [
                'search'     => $_GET['search'] ?? null,
                'from_date'  => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'    => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'city'       => $_GET['city'] ?? null,
                'group'      => $_GET['group'] ?? null,
                'salesman'   => $_GET['salesman'] ?? ($_GET['sale_man'] ?? null),
                'site'       => $_GET['site'] ?? ($_GET['branch_name'] ?? null),
            ];

            $reportType = strtolower(trim($_GET['report_type'] ?? 'detailed'));
            if ($reportType !== 'voucher_wise') {
                $reportType = 'detailed';
            }

            $sortBy = $_GET['sort_by'] ?? ($reportType === 'voucher_wise' ? 'voucher_date' : 'account_name');
            $sortOrder = strtolower($_GET['sort_order'] ?? ($reportType === 'voucher_wise' ? 'desc' : 'asc'));
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));

            $res = CustomerProfitReport::paginate($filters, $sortBy, $sortOrder, $page, $limit, $reportType);
            Response::json($res);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function summary(): void {
        try {
            $filters = [
                'search'     => $_GET['search'] ?? null,
                'from_date'  => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'    => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'city'       => $_GET['city'] ?? null,
                'group'      => $_GET['group'] ?? null,
                'salesman'   => $_GET['salesman'] ?? ($_GET['sale_man'] ?? null),
                'site'       => $_GET['site'] ?? ($_GET['branch_name'] ?? null),
            ];

            $reportType = strtolower(trim($_GET['report_type'] ?? 'detailed'));
            $summary = CustomerProfitReport::getSummary($filters, $reportType);
            Response::json($summary);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function filterOptions(): void {
        try {
            $options = CustomerProfitReport::filterOptions();
            Response::json($options);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function export(): void {
        try {
            $filters = [
                'search'     => $_GET['search'] ?? null,
                'from_date'  => $_GET['from_date'] ?? ($_GET['date_from'] ?? null),
                'to_date'    => $_GET['to_date'] ?? ($_GET['date_to'] ?? null),
                'city'       => $_GET['city'] ?? null,
                'group'      => $_GET['group'] ?? null,
                'salesman'   => $_GET['salesman'] ?? ($_GET['sale_man'] ?? null),
                'site'       => $_GET['site'] ?? ($_GET['branch_name'] ?? null),
            ];

            $reportType = strtolower(trim($_GET['report_type'] ?? 'detailed'));
            $rows = CustomerProfitReport::export($filters, $reportType);
            Response::json($rows);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
