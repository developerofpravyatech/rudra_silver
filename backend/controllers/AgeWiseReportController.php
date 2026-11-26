<?php
namespace Controllers;

use Helpers\Response;
use Models\AgeWiseReport;

class AgeWiseReportController {

    /**
     * GET /api/age-wise/groups
     */
    public static function groups(): void {
        $search = $_GET['search'] ?? null;
        $groups = AgeWiseReport::getAccountGroups($search);
        Response::json(['items' => $groups]);
    }

    /**
     * GET /api/age-wise/filter-options
     */
    public static function filterOptions(): void {
        $opts = AgeWiseReport::getFilterOptions();
        Response::json($opts);
    }

    /**
     * GET /api/age-wise/report (and /api/age-wise/summary)
     */
    public static function report(): void {
        $interval = isset($_GET['interval']) ? (int)$_GET['interval'] : 15;
        if ($interval <= 0) {
            Response::error('Interval must be a positive number of days.', 400);
        }

        $asOn = $_GET['as_on_date'] ?? null;
        if ($asOn && !strtotime($asOn) && !preg_match('/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/', $asOn)) {
            Response::error('Invalid As On Date format.', 400);
        }

        $filters = [
            'as_on_date'   => $asOn,
            'group_ids'    => $_GET['group_ids'] ?? null,
            'city'         => $_GET['city'] ?? null,
            'location'     => $_GET['location'] ?? null,
            'ref_by'       => $_GET['ref_by'] ?? null,
            'interval'     => $interval,
            'balance_type' => $_GET['balance_type'] ?? 'gold',
            'search'       => $_GET['search'] ?? null,
            'sort_by'      => $_GET['sort_by'] ?? 'account_name',
            'sort_order'   => $_GET['sort_order'] ?? 'asc',
            'page'         => (int)($_GET['page'] ?? 1),
            'limit'        => (int)($_GET['limit'] ?? 25),
        ];

        $data = AgeWiseReport::getReport($filters);
        Response::json($data);
    }

    /**
     * GET /api/age-wise/ledger
     */
    public static function ledger(): void {
        $partyKey = $_GET['party_key'] ?? $_GET['account_name'] ?? '';
        if (trim($partyKey) === '') {
            Response::error('Account name / party_key is required.', 400);
        }
        $asOn = $_GET['as_on_date'] ?? null;
        $data = AgeWiseReport::getPartyLedger($partyKey, $asOn);
        Response::json($data);
    }

    /**
     * GET /api/age-wise/export
     */
    public static function export(): void {
        $interval = isset($_GET['interval']) ? (int)$_GET['interval'] : 15;
        if ($interval <= 0) {
            $interval = 15;
        }
        $filters = [
            'as_on_date'   => $_GET['as_on_date'] ?? null,
            'group_ids'    => $_GET['group_ids'] ?? null,
            'city'         => $_GET['city'] ?? null,
            'location'     => $_GET['location'] ?? null,
            'ref_by'       => $_GET['ref_by'] ?? null,
            'interval'     => $interval,
            'balance_type' => $_GET['balance_type'] ?? 'gold',
            'search'       => $_GET['search'] ?? null,
            'sort_by'      => $_GET['sort_by'] ?? 'account_name',
            'sort_order'   => $_GET['sort_order'] ?? 'asc',
        ];
        $data = AgeWiseReport::exportReport($filters);
        Response::json($data);
    }
}
