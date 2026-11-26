<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

/**
 * KarigarReceive Model
 * Handles receiving of metal/finished items back from Karigars
 */
class KarigarReceive {

    private static array $sortable = [
        'id'           => 'kr.id',
        'voucher_no'   => 'kr.voucher_no',
        'receive_date' => 'kr.receive_date',
        'karigar_name' => 'kr.karigar_name',
        'lot_no'       => 'kr.lot_no',
        'total_silver_fine' => 'kr.total_silver_fine',
        'total_gold_fine'   => 'kr.total_gold_fine',
        'total_amount'      => 'kr.total_amount',
    ];

    // ----------------------------------------------------------------
    // List with filters
    // ----------------------------------------------------------------
    public static function list(array $filters): array {
        $pdo = Database::getConnection();

        [$where, $params] = self::buildWhere($filters);
        $whereStr = implode(' AND ', $where);

        $sort   = self::$sortable[$filters['sort_by'] ?? 'receive_date'] ?? 'kr.receive_date';
        $order  = strtoupper($filters['sort_order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
        $limit  = max(1, (int)($filters['limit'] ?? 25));
        $page   = max(1, (int)($filters['page']  ?? 1));
        $offset = ($page - 1) * $limit;

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM karigar_receives kr WHERE $whereStr");
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT kr.*, ki.voucher_no AS issue_voucher_no
            FROM karigar_receives kr
            LEFT JOIN karigar_issues ki ON ki.id = kr.issue_id
            WHERE $whereStr
            ORDER BY $sort $order
            LIMIT :lim OFFSET :off");
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ['items' => $items, 'total' => $total, 'page' => $page,
                'limit' => $limit, 'total_pages' => (int)ceil($total / $limit)];
    }

    // ----------------------------------------------------------------
    // Get single receive with items
    // ----------------------------------------------------------------
    public static function getById(int $id): ?array {
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("SELECT kr.*, ki.voucher_no AS issue_voucher_no, ki.issue_date
            FROM karigar_receives kr
            LEFT JOIN karigar_issues ki ON ki.id = kr.issue_id
            WHERE kr.id = :id AND kr.deleted_at IS NULL");
        $stmt->execute([':id' => $id]);
        $header = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$header) return null;

        $stmt = $pdo->prepare("SELECT * FROM karigar_receive_items WHERE receive_id = :id ORDER BY id ASC");
        $stmt->execute([':id' => $id]);
        $header['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $header;
    }

    // ----------------------------------------------------------------
    // Create Receive
    // ----------------------------------------------------------------
    public static function create(array $data): array {
        $pdo = Database::getConnection();

        if (empty($data['receive_date'])) throw new Exception('Receive date is required.');
        if (empty($data['issue_id'])) throw new Exception('Issue reference is required.');
        if (empty($data['items']) || !is_array($data['items'])) throw new Exception('At least one item is required.');

        // Validate issue exists
        $issueCheck = $pdo->prepare("SELECT id, karigar_id, karigar_name, lot_no, status FROM karigar_issues WHERE id=:id AND deleted_at IS NULL");
        $issueCheck->execute([':id' => $data['issue_id']]);
        $issue = $issueCheck->fetch(PDO::FETCH_ASSOC);
        if (!$issue) throw new Exception('Issue voucher not found.');
        if ($issue['status'] === 'CLOSED') throw new Exception('This issue is already fully closed.');

        $pdo->beginTransaction();
        try {
            $voucherNo = trim($data['voucher_no'] ?? '');
            if (!$voucherNo) {
                $voucherNo = self::nextVoucherNo();
            } else {
                $ex = $pdo->prepare("SELECT id FROM karigar_receives WHERE voucher_no=:v");
                $ex->execute([':v' => $voucherNo]);
                if ($ex->fetch()) throw new Exception("Voucher No '$voucherNo' already exists.");
            }

            $totGold = $totSilver = $totDiamond = $totStone = $totAmount = 0;
            $cleanItems = [];
            foreach ($data['items'] as $it) {
                $netWt  = (float)($it['net_weight'] ?? 0);
                $purity = (float)($it['purity'] ?? 0);
                $fineWt = round($netWt * $purity / 100, 3);
                $labAmt = round((float)($it['labour_rate'] ?? 0) * (int)($it['quantity'] ?? 1), 2);
                $metalType = strtoupper($it['metal_type'] ?? 'SILVER');
                if ($metalType === 'GOLD') $totGold += $fineWt; else $totSilver += $fineWt;
                $totDiamond += (float)($it['diamond_weight'] ?? 0);
                $totStone   += (float)($it['stone_weight']   ?? 0);
                $totAmount  += $labAmt;
                $cleanItems[] = array_merge($it, [
                    'fine_weight'   => $fineWt,
                    'labour_amount' => $labAmt,
                    'metal_type'    => $metalType,
                ]);
            }

            $stmt = $pdo->prepare("INSERT INTO karigar_receives
                (voucher_no, receive_date, issue_id, karigar_id, karigar_name, lot_no, narration, remarks,
                 total_gold_fine, total_silver_fine, total_diamond_wt, total_stone_wt, total_amount)
                VALUES (:vn, :dt, :iid, :kid, :kname, :lot, :narr, :rem,
                        :tg, :ts, :td, :tstne, :tamt)");
            $stmt->execute([
                ':vn'    => $voucherNo,
                ':dt'    => $data['receive_date'],
                ':iid'   => (int)$data['issue_id'],
                ':kid'   => (int)($data['karigar_id'] ?? $issue['karigar_id']),
                ':kname' => trim($data['karigar_name'] ?? $issue['karigar_name']),
                ':lot'   => trim($data['lot_no'] ?? $issue['lot_no'] ?? ''),
                ':narr'  => trim($data['narration'] ?? ''),
                ':rem'   => trim($data['remarks'] ?? ''),
                ':tg'    => round($totGold, 3),
                ':ts'    => round($totSilver, 3),
                ':td'    => round($totDiamond, 3),
                ':tstne' => round($totStone, 3),
                ':tamt'  => round($totAmount, 2),
            ]);
            $receiveId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare("INSERT INTO karigar_receive_items
                (receive_id, issue_item_id, item_name, item_type, metal_type, purity, gross_weight,
                 net_weight, diamond_weight, stone_weight, quantity, fine_weight,
                 scrap_weight, dust_weight, loss_weight, labour_rate, labour_amount, remarks)
                VALUES (:rid,:iiid,:iname,:itype,:mt,:pur,:gw,:nw,:dw,:sw,:qty,:fw,:scrap,:dust,:loss,:lr,:la,:rem)");
            foreach ($cleanItems as $ci) {
                $itemStmt->execute([
                    ':rid'   => $receiveId,
                    ':iiid'  => !empty($ci['issue_item_id']) ? (int)$ci['issue_item_id'] : null,
                    ':iname' => trim($ci['item_name'] ?? ''),
                    ':itype' => trim($ci['item_type'] ?? ''),
                    ':mt'    => $ci['metal_type'],
                    ':pur'   => (float)($ci['purity'] ?? 0),
                    ':gw'    => (float)($ci['gross_weight'] ?? 0),
                    ':nw'    => (float)($ci['net_weight'] ?? 0),
                    ':dw'    => (float)($ci['diamond_weight'] ?? 0),
                    ':sw'    => (float)($ci['stone_weight']   ?? 0),
                    ':qty'   => (int)($ci['quantity'] ?? 1),
                    ':fw'    => $ci['fine_weight'],
                    ':scrap' => (float)($ci['scrap_weight'] ?? 0),
                    ':dust'  => (float)($ci['dust_weight']  ?? 0),
                    ':loss'  => (float)($ci['loss_weight']  ?? 0),
                    ':lr'    => (float)($ci['labour_rate']  ?? 0),
                    ':la'    => $ci['labour_amount'],
                    ':rem'   => trim($ci['remarks'] ?? ''),
                ]);
            }

            // Update issue status to PARTIAL if not fully done, or leave OPEN
            $pdo->prepare("UPDATE karigar_issues SET status='PARTIAL' WHERE id=:id AND status='OPEN'")->execute([':id' => $data['issue_id']]);

            $pdo->commit();
            return self::getById($receiveId);
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    // ----------------------------------------------------------------
    // Soft-delete Receive
    // ----------------------------------------------------------------
    public static function delete(int $id): bool {
        $pdo = Database::getConnection();
        $existing = self::getById($id);
        if (!$existing) throw new Exception('Receive record not found.');
        $pdo->prepare("UPDATE karigar_receives SET deleted_at=NOW() WHERE id=:id")->execute([':id' => $id]);
        return true;
    }

    // ----------------------------------------------------------------
    // Filter options
    // ----------------------------------------------------------------
    public static function filterOptions(): array {
        $pdo = Database::getConnection();

        $karigars = $pdo->query("SELECT a.id, a.name FROM accounts a WHERE a.account_type='KARIGAR' AND a.is_active=1 ORDER BY a.name")->fetchAll(PDO::FETCH_ASSOC);
        $lots     = $pdo->query("SELECT DISTINCT lot_no FROM karigar_receives WHERE lot_no IS NOT NULL AND lot_no!='' AND deleted_at IS NULL ORDER BY lot_no")->fetchAll(PDO::FETCH_COLUMN);
        $issues   = $pdo->query("SELECT ki.id, ki.voucher_no, ki.karigar_name, ki.lot_no FROM karigar_issues ki WHERE ki.deleted_at IS NULL AND ki.status != 'CLOSED' ORDER BY ki.issue_date DESC LIMIT 100")->fetchAll(PDO::FETCH_ASSOC);

        return ['karigars' => $karigars, 'lots' => $lots, 'open_issues' => $issues];
    }

    // ----------------------------------------------------------------
    // Outstanding (Net balance per karigar: issued - received)
    // ----------------------------------------------------------------
    public static function outstanding(array $filters): array {
        $pdo = Database::getConnection();

        $where  = ["a.account_type = 'KARIGAR'"];
        $params = [];

        if (!empty($filters['karigar_id'])) {
            $where[] = 'a.id = :kid';
            $params[':kid'] = (int)$filters['karigar_id'];
        }
        if (!empty($filters['is_active'])) {
            $where[] = 'a.is_active = :ia';
            $params[':ia'] = (int)$filters['is_active'];
        }
        $whereStr = implode(' AND ', $where);

        $sql = "SELECT a.id AS karigar_id, a.account_code, a.name AS karigar_name, a.city, a.mobile,
            COALESCE(iss.total_issued_gold, 0)   AS total_issued_gold,
            COALESCE(iss.total_issued_silver, 0) AS total_issued_silver,
            COALESCE(rec.total_received_gold, 0)   AS total_received_gold,
            COALESCE(rec.total_received_silver, 0) AS total_received_silver,
            COALESCE(iss.total_issued_gold, 0) - COALESCE(rec.total_received_gold, 0)     AS outstanding_gold,
            COALESCE(iss.total_issued_silver, 0) - COALESCE(rec.total_received_silver, 0) AS outstanding_silver,
            COALESCE(iss.open_lots, 0) AS open_lots
        FROM accounts a
        LEFT JOIN (
            SELECT karigar_id,
                SUM(total_gold_fine)   AS total_issued_gold,
                SUM(total_silver_fine) AS total_issued_silver,
                COUNT(DISTINCT lot_no) AS open_lots
            FROM karigar_issues WHERE deleted_at IS NULL AND status != 'CLOSED'
            GROUP BY karigar_id
        ) iss ON iss.karigar_id = a.id
        LEFT JOIN (
            SELECT karigar_id,
                SUM(total_gold_fine)   AS total_received_gold,
                SUM(total_silver_fine) AS total_received_silver
            FROM karigar_receives WHERE deleted_at IS NULL
            GROUP BY karigar_id
        ) rec ON rec.karigar_id = a.id
        WHERE $whereStr
        HAVING (outstanding_gold != 0 OR outstanding_silver != 0 OR total_issued_gold IS NOT NULL)
        ORDER BY a.name ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ----------------------------------------------------------------
    // Issue/Receive combined report
    // ----------------------------------------------------------------
    public static function issueReceiveReport(array $filters): array {
        $pdo = Database::getConnection();

        $where  = ['ki.deleted_at IS NULL'];
        $params = [];

        if (!empty($filters['karigar_id'])) {
            $where[] = 'ki.karigar_id = :kid';
            $params[':kid'] = (int)$filters['karigar_id'];
        }
        if (!empty($filters['lot_no'])) {
            $where[] = 'ki.lot_no = :lot';
            $params[':lot'] = $filters['lot_no'];
        }
        if (!empty($filters['from_date'])) {
            $where[] = 'ki.issue_date >= :from_date';
            $params[':from_date'] = $filters['from_date'];
        }
        if (!empty($filters['to_date'])) {
            $where[] = 'ki.issue_date <= :to_date';
            $params[':to_date'] = $filters['to_date'];
        }
        $whereStr = implode(' AND ', $where);

        $sql = "SELECT ki.id AS issue_id, ki.voucher_no AS issue_voucher, ki.issue_date,
            ki.karigar_name, ki.lot_no, ki.status AS issue_status,
            ki.total_gold_fine AS issued_gold, ki.total_silver_fine AS issued_silver,
            ki.total_diamond_wt AS issued_diamond, ki.total_stone_wt AS issued_stone,
            COALESCE(rec.received_gold, 0)   AS received_gold,
            COALESCE(rec.received_silver, 0) AS received_silver,
            COALESCE(rec.received_diamond, 0) AS received_diamond,
            COALESCE(rec.received_stone, 0)   AS received_stone,
            ki.total_gold_fine   - COALESCE(rec.received_gold, 0)   AS balance_gold,
            ki.total_silver_fine - COALESCE(rec.received_silver, 0) AS balance_silver,
            rec.receive_vouchers
        FROM karigar_issues ki
        LEFT JOIN (
            SELECT issue_id,
                SUM(total_gold_fine)   AS received_gold,
                SUM(total_silver_fine) AS received_silver,
                SUM(total_diamond_wt)  AS received_diamond,
                SUM(total_stone_wt)    AS received_stone,
                GROUP_CONCAT(voucher_no ORDER BY receive_date SEPARATOR ', ') AS receive_vouchers
            FROM karigar_receives WHERE deleted_at IS NULL
            GROUP BY issue_id
        ) rec ON rec.issue_id = ki.id
        WHERE $whereStr
        ORDER BY ki.issue_date DESC, ki.id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ----------------------------------------------------------------
    // Lot Report
    // ----------------------------------------------------------------
    public static function lotReport(array $filters): array {
        $pdo = Database::getConnection();

        $where  = ['ki.deleted_at IS NULL', "ki.lot_no IS NOT NULL", "ki.lot_no != ''"];
        $params = [];

        if (!empty($filters['karigar_id'])) {
            $where[] = 'ki.karigar_id = :kid';
            $params[':kid'] = (int)$filters['karigar_id'];
        }
        if (!empty($filters['lot_no'])) {
            $where[] = 'ki.lot_no LIKE :lot';
            $params[':lot'] = '%' . $filters['lot_no'] . '%';
        }
        $whereStr = implode(' AND ', $where);

        $sql = "SELECT ki.lot_no, ki.karigar_name, ki.karigar_id,
            MIN(ki.issue_date) AS first_issue_date, MAX(ki.issue_date) AS last_issue_date,
            COUNT(ki.id) AS issue_count,
            SUM(ki.total_gold_fine)   AS total_issued_gold,
            SUM(ki.total_silver_fine) AS total_issued_silver,
            SUM(ki.total_diamond_wt)  AS total_issued_diamond,
            COALESCE(SUM(rec.received_gold), 0)   AS total_received_gold,
            COALESCE(SUM(rec.received_silver), 0) AS total_received_silver,
            SUM(ki.total_gold_fine) - COALESCE(SUM(rec.received_gold),0)     AS balance_gold,
            SUM(ki.total_silver_fine) - COALESCE(SUM(rec.received_silver),0) AS balance_silver
        FROM karigar_issues ki
        LEFT JOIN (
            SELECT issue_id, SUM(total_gold_fine) AS received_gold, SUM(total_silver_fine) AS received_silver
            FROM karigar_receives WHERE deleted_at IS NULL GROUP BY issue_id
        ) rec ON rec.issue_id = ki.id
        WHERE $whereStr
        GROUP BY ki.lot_no, ki.karigar_id, ki.karigar_name
        ORDER BY ki.lot_no ASC, ki.karigar_name ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ----------------------------------------------------------------
    // Diamond / Stone Balance (per Karigar)
    // ----------------------------------------------------------------
    public static function diaStnBalance(array $filters): array {
        $pdo = Database::getConnection();
        $where  = ["a.account_type = 'KARIGAR'"];
        $params = [];

        if (!empty($filters['karigar_id'])) {
            $where[] = 'a.id = :kid';
            $params[':kid'] = (int)$filters['karigar_id'];
        }
        $whereStr = implode(' AND ', $where);

        $sql = "SELECT a.id AS karigar_id, a.account_code, a.name AS karigar_name, a.city,
            COALESCE(iss.issued_diamond, 0)   AS diamond_issued,
            COALESCE(rec.received_diamond, 0) AS diamond_received,
            COALESCE(iss.issued_diamond, 0) - COALESCE(rec.received_diamond, 0) AS diamond_balance,
            COALESCE(iss.issued_stone, 0)     AS stone_issued,
            COALESCE(rec.received_stone, 0)   AS stone_received,
            COALESCE(iss.issued_stone, 0)   - COALESCE(rec.received_stone, 0)   AS stone_balance
        FROM accounts a
        LEFT JOIN (
            SELECT karigar_id, SUM(total_diamond_wt) AS issued_diamond, SUM(total_stone_wt) AS issued_stone
            FROM karigar_issues WHERE deleted_at IS NULL
            GROUP BY karigar_id
        ) iss ON iss.karigar_id = a.id
        LEFT JOIN (
            SELECT karigar_id, SUM(total_diamond_wt) AS received_diamond, SUM(total_stone_wt) AS received_stone
            FROM karigar_receives WHERE deleted_at IS NULL
            GROUP BY karigar_id
        ) rec ON rec.karigar_id = a.id
        WHERE $whereStr
        ORDER BY a.name ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ----------------------------------------------------------------
    // Diamond / Stone Group Balance (grouped by Karigar + item_type)
    // ----------------------------------------------------------------
    public static function diaStnGroupBalance(array $filters): array {
        $pdo = Database::getConnection();
        $where  = ['ki.deleted_at IS NULL', '(kii.diamond_weight > 0 OR kii.stone_weight > 0)'];
        $params = [];

        if (!empty($filters['karigar_id'])) {
            $where[] = 'ki.karigar_id = :kid';
            $params[':kid'] = (int)$filters['karigar_id'];
        }
        if (!empty($filters['from_date'])) {
            $where[] = 'ki.issue_date >= :from_date';
            $params[':from_date'] = $filters['from_date'];
        }
        if (!empty($filters['to_date'])) {
            $where[] = 'ki.issue_date <= :to_date';
            $params[':to_date'] = $filters['to_date'];
        }
        $whereStr = implode(' AND ', $where);

        $sql = "SELECT ki.karigar_id, ki.karigar_name,
            COALESCE(NULLIF(kii.item_type, ''), kii.item_name) AS group_name,
            kii.metal_type AS item_category,
            SUM(kii.quantity) AS issued_qty,
            SUM(kii.diamond_weight) AS issued_diamond,
            SUM(kii.stone_weight) AS issued_stone,
            COALESCE(SUM(rec.received_qty), 0) AS received_qty,
            COALESCE(SUM(rec.received_diamond), 0) AS received_diamond,
            COALESCE(SUM(rec.received_stone), 0) AS received_stone,
            SUM(kii.quantity) - COALESCE(SUM(rec.received_qty), 0) AS pending_qty,
            (SUM(kii.diamond_weight) + SUM(kii.stone_weight)) - (COALESCE(SUM(rec.received_diamond), 0) + COALESCE(SUM(rec.received_stone), 0)) AS weight_balance
        FROM karigar_issue_items kii
        INNER JOIN karigar_issues ki ON ki.id = kii.issue_id
        LEFT JOIN (
            SELECT kri.issue_item_id,
                SUM(kri.quantity) AS received_qty,
                SUM(kri.diamond_weight) AS received_diamond,
                SUM(kri.stone_weight) AS received_stone
            FROM karigar_receive_items kri
            INNER JOIN karigar_receives kr ON kr.id = kri.receive_id AND kr.deleted_at IS NULL
            WHERE kri.issue_item_id IS NOT NULL
            GROUP BY kri.issue_item_id
        ) rec ON rec.issue_item_id = kii.id
        WHERE $whereStr
        GROUP BY ki.karigar_id, ki.karigar_name, COALESCE(NULLIF(kii.item_type, ''), kii.item_name), kii.metal_type
        ORDER BY ki.karigar_name ASC, group_name ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ----------------------------------------------------------------
    // Diamond / Stone Issue & Receive Transaction Report
    // ----------------------------------------------------------------
    public static function diaStnIssueReceive(array $filters): array {
        $pdo = Database::getConnection();
        $params = [];
        $issWhere = ['ki.deleted_at IS NULL', '(kii.diamond_weight > 0 OR kii.stone_weight > 0)'];
        $recWhere = ['kr.deleted_at IS NULL', '(kri.diamond_weight > 0 OR kri.stone_weight > 0)'];

        if (!empty($filters['karigar_id'])) {
            $issWhere[] = 'ki.karigar_id = :kid1';
            $recWhere[] = 'kr.karigar_id = :kid2';
            $params[':kid1'] = (int)$filters['karigar_id'];
            $params[':kid2'] = (int)$filters['karigar_id'];
        }
        if (!empty($filters['from_date'])) {
            $issWhere[] = 'ki.issue_date >= :fd1';
            $recWhere[] = 'kr.receive_date >= :fd2';
            $params[':fd1'] = $filters['from_date'];
            $params[':fd2'] = $filters['from_date'];
        }
        if (!empty($filters['to_date'])) {
            $issWhere[] = 'ki.issue_date <= :td1';
            $recWhere[] = 'kr.receive_date <= :td2';
            $params[':td1'] = $filters['to_date'];
            $params[':td2'] = $filters['to_date'];
        }

        $issW = implode(' AND ', $issWhere);
        $recW = implode(' AND ', $recWhere);

        $sql = "SELECT * FROM (
            SELECT ki.issue_date AS tx_date, ki.voucher_no, 'ISSUE' AS tx_type,
                ki.karigar_name, ki.lot_no, kii.item_name, kii.item_type,
                kii.quantity AS issue_qty, 0 AS receive_qty,
                kii.diamond_weight, kii.stone_weight
            FROM karigar_issue_items kii
            INNER JOIN karigar_issues ki ON ki.id = kii.issue_id
            WHERE $issW
            UNION ALL
            SELECT kr.receive_date AS tx_date, kr.voucher_no, 'RECEIVE' AS tx_type,
                kr.karigar_name, kr.lot_no, kri.item_name, kri.item_type,
                0 AS issue_qty, kri.quantity AS receive_qty,
                kri.diamond_weight, kri.stone_weight
            FROM karigar_receive_items kri
            INNER JOIN karigar_receives kr ON kr.id = kri.receive_id
            WHERE $recW
        ) t
        ORDER BY t.tx_date DESC, t.voucher_no DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ----------------------------------------------------------------
    // Auto generate next receive voucher number
    // ----------------------------------------------------------------
    private static function nextVoucherNo(): string {
        $pdo = Database::getConnection();
        $year = date('Y');
        $max  = $pdo->query("SELECT MAX(CAST(SUBSTRING_INDEX(voucher_no,'-',-1) AS UNSIGNED)) FROM karigar_receives WHERE voucher_no LIKE 'KR-$year-%'")->fetchColumn();
        $next = ($max ? (int)$max : 0) + 1;
        return "KR-$year-" . str_pad($next, 3, '0', STR_PAD_LEFT);
    }

    // ----------------------------------------------------------------
    // Private WHERE builder
    // ----------------------------------------------------------------
    private static function buildWhere(array $filters): array {
        $where  = ['kr.deleted_at IS NULL'];
        $params = [];

        if (!empty($filters['search'])) {
            $s = '%' . trim($filters['search']) . '%';
            $where[] = "(kr.voucher_no LIKE :s1 OR kr.karigar_name LIKE :s2 OR kr.lot_no LIKE :s3)";
            $params[':s1'] = $s; $params[':s2'] = $s; $params[':s3'] = $s;
        }
        if (!empty($filters['karigar_id'])) {
            $where[] = 'kr.karigar_id = :kid';
            $params[':kid'] = (int)$filters['karigar_id'];
        }
        if (!empty($filters['issue_id'])) {
            $where[] = 'kr.issue_id = :iid';
            $params[':iid'] = (int)$filters['issue_id'];
        }
        if (!empty($filters['lot_no'])) {
            $where[] = 'kr.lot_no = :lot';
            $params[':lot'] = $filters['lot_no'];
        }
        if (!empty($filters['from_date'])) {
            $where[] = 'kr.receive_date >= :from_date';
            $params[':from_date'] = $filters['from_date'];
        }
        if (!empty($filters['to_date'])) {
            $where[] = 'kr.receive_date <= :to_date';
            $params[':to_date'] = $filters['to_date'];
        }
        return [$where, $params];
    }
}
