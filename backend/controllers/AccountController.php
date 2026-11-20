<?php
namespace Controllers;

use Helpers\Response;
use Models\Account;

class AccountController {
    public static function getAccounts(): void {
        $query = $_GET['query'] ?? null;
        $accountType = $_GET['account_type'] ?? null;
        $limit = min(200, max(1, (int)($_GET['limit'] ?? 100)));

        $accounts = Account::search($query, $accountType, $limit);
        Response::json($accounts);
    }
}
