<?php
namespace Controllers;

use Helpers\Response;
use Config\Database;
use PDO;

class TransactionController {
    public static function listTransactions(): void {
        $db = Database::getConnection();
        try {
            $fromDate = $_GET['from_date'] ?? null;
            $toDate = $_GET['to_date'] ?? null;
            $party = $_GET['party_name'] ?? $_GET['search'] ?? null;
            $type = $_GET['transaction_type'] ?? null;
            $series = $_GET['series'] ?? null;
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));
            $offset = ($page - 1) * $limit;

            $where = [];
            $params = [];
            if ($fromDate) { $where[] = 'transaction_date >= :fd'; $params['fd'] = $fromDate; }
            if ($toDate) { $where[] = 'transaction_date <= :td'; $params['td'] = $toDate; }
            if ($party) { $where[] = 'party_name LIKE :party'; $params['party'] = '%' . $party . '%'; }
            if ($type) { $where[] = 'transaction_type = :type'; $params['type'] = $type; }
            if ($series) { $where[] = 'series = :series'; $params['series'] = $series; }

            $whereSql = !empty($where) ? ' WHERE ' . implode(' AND ', $where) : '';

            $countStmt = $db->prepare("SELECT COUNT(*) FROM v_daily_book {$whereSql}");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetchColumn();

            $dataStmt = $db->prepare("SELECT * FROM v_daily_book {$whereSql} ORDER BY transaction_date DESC, id DESC LIMIT :lim OFFSET :off");
            foreach ($params as $k => $v) {
                $dataStmt->bindValue(':' . $k, $v);
            }
            $dataStmt->bindValue(':lim', $limit, PDO::PARAM_INT);
            $dataStmt->bindValue(':off', $offset, PDO::PARAM_INT);
            $dataStmt->execute();
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

            Response::json(['items' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit]);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function getTransaction(int $id): void {
        $db = \Config\Database::getConnection();
        try {
            $stmt = $db->prepare('SELECT * FROM v_daily_book WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                Response::error('Transaction not found', 404);
            }
            Response::json($row);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function getTransactionSummary(): void {
        $db = \Config\Database::getConnection();
        try {
            $fromDate = $_GET['from_date'] ?? null;
            $toDate = $_GET['to_date'] ?? null;
            $party = $_GET['party_name'] ?? null;
            $type = $_GET['transaction_type'] ?? null;

            $where = [];
            $params = [];
            if ($fromDate) { $where[] = 'transaction_date >= :fd'; $params['fd'] = $fromDate; }
            if ($toDate) { $where[] = 'transaction_date <= :td'; $params['td'] = $toDate; }
            if ($party) { $where[] = 'party_name LIKE :party'; $params['party'] = '%' . $party . '%'; }
            if ($type) { $where[] = 'transaction_type = :type'; $params['type'] = $type; }
            $whereSql = !empty($where) ? ' WHERE ' . implode(' AND ', $where) : '';

            $stmt = $db->prepare("SELECT COUNT(*) AS total_vouchers, COALESCE(SUM(pcs),0) AS total_pcs, COALESCE(SUM(gross_weight),0) AS total_gross, COALESCE(SUM(net_weight),0) AS total_net, COALESCE(SUM(diamond_weight),0) AS total_diamond, COALESCE(SUM(stone_weight),0) AS total_stone, COALESCE(SUM(gold_fine),0) AS total_gold_fine, COALESCE(SUM(silver_fine),0) AS total_silver_fine, COALESCE(SUM(total),0) AS total_amount FROM v_daily_book {$whereSql}");
            $stmt->execute($params);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            Response::json($row);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
