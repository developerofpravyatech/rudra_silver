<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

/**
 * KarigarIssue Model
 * Handles issue of metal/items to Karigars
 */
class KarigarIssue {

    private static array $sortable = [
        'id'          => 'ki.id',
        'voucher_no'  => 'ki.voucher_no',
        'issue_date'  => 'ki.issue_date',
        'karigar_name'=> 'ki.karigar_name',
        'lot_no'      => 'ki.lot_no',
        'total_silver_fine' => 'ki.total_silver_fine',
        'total_gold_fine'   => 'ki.total_gold_fine',
        'total_amount'      => 'ki.total_amount',
        'status'            => 'ki.status',
    ];

    // ----------------------------------------------------------------
    // List with filters
    // ----------------------------------------------------------------
    public static function list(array $filters): array {
        $pdo = Database::getConnection();

        [$where, $params] = self::buildWhere($filters);
        $whereStr = implode(' AND ', $where);

        $sort   = self::$sortable[$filters['sort_by'] ?? 'issue_date'] ?? 'ki.issue_date';
        $order  = strtoupper($filters['sort_order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
        $limit  = max(1, (int)($filters['limit'] ?? 25));
        $page   = max(1, (int)($filters['page']  ?? 1));
        $offset = ($page - 1) * $limit;

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM karigar_issues ki WHERE $whereStr");
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT ki.*,
            (SELECT COUNT(*) FROM karigar_receives kr WHERE kr.issue_id=ki.id AND kr.deleted_at IS NULL) AS receive_count
            FROM karigar_issues ki
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
    // Get single issue with items
    // ----------------------------------------------------------------
    public static function getById(int $id): ?array {
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("SELECT ki.* FROM karigar_issues ki WHERE ki.id = :id AND ki.deleted_at IS NULL");
        $stmt->execute([':id' => $id]);
        $header = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$header) return null;

        $stmt = $pdo->prepare("SELECT * FROM karigar_issue_items WHERE issue_id = :id ORDER BY id ASC");
        $stmt->execute([':id' => $id]);
        $header['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $header;
    }

    // ----------------------------------------------------------------
    // Create Issue (header + items in DB transaction)
    // ----------------------------------------------------------------
    public static function create(array $data): array {
        $pdo = Database::getConnection();

        if (empty($data['issue_date'])) throw new Exception('Issue date is required.');
        if (empty($data['karigar_id'])) throw new Exception('Karigar is required.');
        if (empty($data['items']) || !is_array($data['items'])) throw new Exception('At least one item is required.');

        $pdo->beginTransaction();
        try {
            // Auto voucher_no if not provided
            $voucherNo = trim($data['voucher_no'] ?? '');
            if (!$voucherNo) {
                $voucherNo = self::nextVoucherNo();
            } else {
                // Check uniqueness
                $ex = $pdo->prepare("SELECT id FROM karigar_issues WHERE voucher_no=:v");
                $ex->execute([':v' => $voucherNo]);
                if ($ex->fetch()) throw new Exception("Voucher No '$voucherNo' already exists.");
            }

            // Totals from items
            $totGold = $totSilver = $totDiamond = $totStone = $totAmount = 0;
            $cleanItems = [];
            foreach ($data['items'] as $it) {
                $netWt  = (float)($it['net_weight'] ?? 0);
                $purity = (float)($it['purity'] ?? 0);
                $fineWt = round($netWt * $purity / 100, 3);
                $labAmt = round((float)($it['labour_rate'] ?? 0) * (float)($it['quantity'] ?? 1), 2);

                $metalType = strtoupper($it['metal_type'] ?? 'SILVER');
                if ($metalType === 'GOLD')   $totGold    += $fineWt;
                else                          $totSilver  += $fineWt;
                $totDiamond += (float)($it['diamond_weight'] ?? 0);
                $totStone   += (float)($it['stone_weight']   ?? 0);
                $totAmount  += $labAmt;

                $cleanItems[] = [
                    'item_name'      => trim($it['item_name'] ?? ''),
                    'item_type'      => trim($it['item_type'] ?? ''),
                    'metal_type'     => $metalType,
                    'purity'         => $purity,
                    'gross_weight'   => (float)($it['gross_weight'] ?? 0),
                    'net_weight'     => $netWt,
                    'diamond_weight' => (float)($it['diamond_weight'] ?? 0),
                    'stone_weight'   => (float)($it['stone_weight']   ?? 0),
                    'quantity'       => (int)($it['quantity'] ?? 1),
                    'fine_weight'    => $fineWt,
                    'labour_rate'    => (float)($it['labour_rate'] ?? 0),
                    'labour_amount'  => $labAmt,
                    'remarks'        => trim($it['remarks'] ?? ''),
                ];
            }

            // Insert header
            $stmt = $pdo->prepare("INSERT INTO karigar_issues
                (voucher_no, issue_date, karigar_id, karigar_name, lot_no, narration, remarks,
                 total_gold_fine, total_silver_fine, total_diamond_wt, total_stone_wt, total_amount, status)
                VALUES (:vn, :dt, :kid, :kname, :lot, :narr, :rem,
                        :tg, :ts, :td, :tstne, :tamt, 'OPEN')");
            $stmt->execute([
                ':vn'    => $voucherNo,
                ':dt'    => $data['issue_date'],
                ':kid'   => (int)$data['karigar_id'],
                ':kname' => trim($data['karigar_name'] ?? ''),
                ':lot'   => trim($data['lot_no'] ?? ''),
                ':narr'  => trim($data['narration'] ?? ''),
                ':rem'   => trim($data['remarks'] ?? ''),
                ':tg'    => round($totGold, 3),
                ':ts'    => round($totSilver, 3),
                ':td'    => round($totDiamond, 3),
                ':tstne' => round($totStone, 3),
                ':tamt'  => round($totAmount, 2),
            ]);
            $issueId = (int)$pdo->lastInsertId();

            // Insert items
            $itemStmt = $pdo->prepare("INSERT INTO karigar_issue_items
                (issue_id, item_name, item_type, metal_type, purity, gross_weight, net_weight,
                 diamond_weight, stone_weight, quantity, fine_weight, labour_rate, labour_amount, remarks)
                VALUES (:iid, :iname, :itype, :mt, :pur, :gw, :nw, :dw, :sw, :qty, :fw, :lr, :la, :rem)");

            foreach ($cleanItems as $ci) {
                $itemStmt->execute([
                    ':iid'  => $issueId,
                    ':iname'=> $ci['item_name'],
                    ':itype'=> $ci['item_type'],
                    ':mt'   => $ci['metal_type'],
                    ':pur'  => $ci['purity'],
                    ':gw'   => $ci['gross_weight'],
                    ':nw'   => $ci['net_weight'],
                    ':dw'   => $ci['diamond_weight'],
                    ':sw'   => $ci['stone_weight'],
                    ':qty'  => $ci['quantity'],
                    ':fw'   => $ci['fine_weight'],
                    ':lr'   => $ci['labour_rate'],
                    ':la'   => $ci['labour_amount'],
                    ':rem'  => $ci['remarks'],
                ]);
            }

            $pdo->commit();
            return self::getById($issueId);
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    // ----------------------------------------------------------------
    // Update Issue
    // ----------------------------------------------------------------
    public static function update(int $id, array $data): array {
        $pdo = Database::getConnection();

        $existing = self::getById($id);
        if (!$existing) throw new Exception('Issue not found.');
        if ($existing['status'] === 'CLOSED') throw new Exception('Cannot edit a closed issue.');

        $pdo->beginTransaction();
        try {
            // Delete old items
            $pdo->prepare("DELETE FROM karigar_issue_items WHERE issue_id = :id")->execute([':id' => $id]);

            // Recalculate totals
            $totGold = $totSilver = $totDiamond = $totStone = $totAmount = 0;
            $cleanItems = [];
            foreach (($data['items'] ?? []) as $it) {
                $netWt  = (float)($it['net_weight'] ?? 0);
                $purity = (float)($it['purity'] ?? 0);
                $fineWt = round($netWt * $purity / 100, 3);
                $labAmt = round((float)($it['labour_rate'] ?? 0) * (int)($it['quantity'] ?? 1), 2);
                $metalType = strtoupper($it['metal_type'] ?? 'SILVER');
                if ($metalType === 'GOLD') $totGold += $fineWt; else $totSilver += $fineWt;
                $totDiamond += (float)($it['diamond_weight'] ?? 0);
                $totStone   += (float)($it['stone_weight']   ?? 0);
                $totAmount  += $labAmt;
                $cleanItems[] = array_merge($it, ['fine_weight' => $fineWt, 'labour_amount' => $labAmt, 'metal_type' => $metalType]);
            }

            $pdo->prepare("UPDATE karigar_issues SET
                issue_date=:dt, karigar_id=:kid, karigar_name=:kname, lot_no=:lot,
                narration=:narr, remarks=:rem,
                total_gold_fine=:tg, total_silver_fine=:ts, total_diamond_wt=:td,
                total_stone_wt=:tstne, total_amount=:tamt
                WHERE id=:id")->execute([
                ':dt'    => $data['issue_date'] ?? $existing['issue_date'],
                ':kid'   => (int)($data['karigar_id'] ?? $existing['karigar_id']),
                ':kname' => trim($data['karigar_name'] ?? $existing['karigar_name']),
                ':lot'   => trim($data['lot_no'] ?? $existing['lot_no'] ?? ''),
                ':narr'  => trim($data['narration'] ?? $existing['narration'] ?? ''),
                ':rem'   => trim($data['remarks'] ?? $existing['remarks'] ?? ''),
                ':tg'    => round($totGold, 3),
                ':ts'    => round($totSilver, 3),
                ':td'    => round($totDiamond, 3),
                ':tstne' => round($totStone, 3),
                ':tamt'  => round($totAmount, 2),
                ':id'    => $id,
            ]);

            $itemStmt = $pdo->prepare("INSERT INTO karigar_issue_items
                (issue_id,item_name,item_type,metal_type,purity,gross_weight,net_weight,
                 diamond_weight,stone_weight,quantity,fine_weight,labour_rate,labour_amount,remarks)
                VALUES (:iid,:iname,:itype,:mt,:pur,:gw,:nw,:dw,:sw,:qty,:fw,:lr,:la,:rem)");
            foreach ($cleanItems as $ci) {
                $itemStmt->execute([
                    ':iid'  => $id, ':iname' => trim($ci['item_name'] ?? ''),
                    ':itype'=> trim($ci['item_type'] ?? ''), ':mt' => $ci['metal_type'],
                    ':pur'  => (float)($ci['purity'] ?? 0), ':gw' => (float)($ci['gross_weight'] ?? 0),
                    ':nw'   => (float)($ci['net_weight'] ?? 0), ':dw' => (float)($ci['diamond_weight'] ?? 0),
                    ':sw'   => (float)($ci['stone_weight'] ?? 0), ':qty' => (int)($ci['quantity'] ?? 1),
                    ':fw'   => $ci['fine_weight'], ':lr' => (float)($ci['labour_rate'] ?? 0),
                    ':la'   => $ci['labour_amount'], ':rem' => trim($ci['remarks'] ?? ''),
                ]);
            }

            $pdo->commit();
            return self::getById($id);
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    // ----------------------------------------------------------------
    // Soft-delete Issue
    // ----------------------------------------------------------------
    public static function delete(int $id): bool {
        $pdo = Database::getConnection();

        $existing = self::getById($id);
        if (!$existing) throw new Exception('Issue not found.');

        $recs = (int)$pdo->query("SELECT COUNT(*) FROM karigar_receives WHERE issue_id=$id AND deleted_at IS NULL")->fetchColumn();
        if ($recs > 0) throw new Exception("Cannot delete: $recs receive(s) linked to this issue.");

        $pdo->prepare("UPDATE karigar_issues SET deleted_at=NOW() WHERE id=:id")->execute([':id' => $id]);
        return true;
    }

    // ----------------------------------------------------------------
    // Filter options
    // ----------------------------------------------------------------
    public static function filterOptions(): array {
        $pdo = Database::getConnection();

        $karigars = $pdo->query("SELECT a.id, a.name FROM accounts a WHERE a.account_type='KARIGAR' AND a.is_active=1 ORDER BY a.name")->fetchAll(PDO::FETCH_ASSOC);
        $lots     = $pdo->query("SELECT DISTINCT lot_no FROM karigar_issues WHERE lot_no IS NOT NULL AND lot_no!='' AND deleted_at IS NULL ORDER BY lot_no")->fetchAll(PDO::FETCH_COLUMN);
        $statuses = ['OPEN', 'PARTIAL', 'CLOSED'];

        return ['karigars' => $karigars, 'lots' => $lots, 'statuses' => $statuses];
    }

    // ----------------------------------------------------------------
    // Auto generate next voucher number
    // ----------------------------------------------------------------
    private static function nextVoucherNo(): string {
        $pdo = Database::getConnection();
        $year = date('Y');
        $max  = $pdo->query("SELECT MAX(CAST(SUBSTRING_INDEX(voucher_no,'-',-1) AS UNSIGNED)) FROM karigar_issues WHERE voucher_no LIKE 'KI-$year-%'")->fetchColumn();
        $next = ($max ? (int)$max : 0) + 1;
        return "KI-$year-" . str_pad($next, 3, '0', STR_PAD_LEFT);
    }

    // ----------------------------------------------------------------
    // Private WHERE builder
    // ----------------------------------------------------------------
    private static function buildWhere(array $filters): array {
        $where  = ['ki.deleted_at IS NULL'];
        $params = [];

        if (!empty($filters['search'])) {
            $s = '%' . trim($filters['search']) . '%';
            $where[] = "(ki.voucher_no LIKE :s1 OR ki.karigar_name LIKE :s2 OR ki.lot_no LIKE :s3)";
            $params[':s1'] = $s; $params[':s2'] = $s; $params[':s3'] = $s;
        }

        if (!empty($filters['karigar_id'])) {
            $where[] = 'ki.karigar_id = :kid';
            $params[':kid'] = (int)$filters['karigar_id'];
        }

        if (!empty($filters['lot_no'])) {
            $where[] = 'ki.lot_no = :lot';
            $params[':lot'] = $filters['lot_no'];
        }

        if (!empty($filters['status'])) {
            $where[] = 'ki.status = :status';
            $params[':status'] = strtoupper($filters['status']);
        }

        if (!empty($filters['from_date'])) {
            $where[] = 'ki.issue_date >= :from_date';
            $params[':from_date'] = $filters['from_date'];
        }

        if (!empty($filters['to_date'])) {
            $where[] = 'ki.issue_date <= :to_date';
            $params[':to_date'] = $filters['to_date'];
        }

        return [$where, $params];
    }
}
