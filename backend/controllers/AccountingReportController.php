<?php
namespace Controllers;

use Services\AccountingEngine;

class AccountingReportController {
    public static function trialBalance(): void {
        $asOn = $_GET['as_on'] ?? null;
        $data = AccountingEngine::trialBalance($asOn);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function dayBook(): void {
        $date = $_GET['date'] ?? date('Y-m-d');
        $data = AccountingEngine::dayBook($date);
        echo json_encode(['success' => true, 'data' => $data, 'date' => $date]);
    }

    public static function cashBook(): void {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $data = AccountingEngine::cashBook($from, $to);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function bankBook(): void {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $data = AccountingEngine::bankBook($from, $to);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function outstandingReceivable(): void {
        $asOn = $_GET['as_on'] ?? null;
        $data = AccountingEngine::outstandingReceivable($asOn);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function outstandingPayable(): void {
        $asOn = $_GET['as_on'] ?? null;
        $data = AccountingEngine::outstandingPayable($asOn);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function profitLoss(): void {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $data = AccountingEngine::profitLoss($from, $to);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function balanceSheet(): void {
        $asOn = $_GET['as_on'] ?? null;
        $data = AccountingEngine::balanceSheet($asOn);
        echo json_encode(['success' => true, 'data' => $data]);
    }

    public static function invoiceStatusReport(): void {
        $type = strtoupper($_GET['type'] ?? 'SALE');
        $data = \Services\VoucherAllocationService::getInvoiceStatusReport($type, $_GET);
        echo json_encode(['success' => true, 'data' => $data]);
    }
}
