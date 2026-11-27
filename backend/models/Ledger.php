<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class Ledger {
    public static function getAll(array $filters = []): array {
        $db = Database::getConnection();
        $where = ['l.status != "DELETED"'];
        $params = [];

        if (!empty($filters['search'])) {
            $where[] = '(l.ledger_name LIKE :search OR l.ledger_code LIKE :search OR l.mobile LIKE :search)';
            $params['search'] = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['group_id'])) {
            $where[] = 'l.group_id = :group_id';
            $params['group_id'] = (int)$filters['group_id'];
        }
        if (!empty($filters['status'])) {
            $where[] = 'l.status = :status';
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['city'])) {
            $where[] = 'l.city LIKE :city';
            $params['city'] = '%' . $filters['city'] . '%';
        }

        $allowedSorts = [
            'ledger_name' => 'l.ledger_name',
            'ledger_code' => 'l.ledger_code',
            'city' => 'l.city',
            'mobile' => 'l.mobile',
            'group_name' => 'ag.name',
            'opening_balance' => 'l.opening_balance',
            'status' => 'l.status',
        ];
        $sortBy = $allowedSorts[$filters['sort_by'] ?? 'ledger_name'] ?? 'l.ledger_name';
        $sortDir = strtoupper($filters['sort_dir'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

        $page = max(1, (int)($filters['page'] ?? 1));
        $limit = max(1, min(200, (int)($filters['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $whereStr = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM ledgers l WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $db->prepare("
            SELECT l.*, ag.name AS group_name, ag.nature AS group_nature
            FROM ledgers l
            LEFT JOIN account_groups ag ON ag.id = l.group_id
            WHERE $whereStr
            ORDER BY $sortBy $sortDir, l.id ASC
            LIMIT :limit OFFSET :offset
        ");
        foreach ($params as $k => $v) $stmt->bindValue(':' . $k, $v);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ['data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public static function getById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT l.*, ag.name AS group_name, ag.nature AS group_nature
            FROM ledgers l
            LEFT JOIN account_groups ag ON ag.id = l.group_id
            WHERE l.id = :id
        ");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public static function getByCode(string $code): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM ledgers WHERE ledger_code = :code");
        $stmt->execute(['code' => $code]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public static function nextCode(): string {
        $db = Database::getConnection();
        $last = $db->query("SELECT ledger_code FROM ledgers WHERE ledger_code LIKE 'L-%' ORDER BY id DESC LIMIT 1")->fetchColumn();
        if ($last) {
            $num = (int)substr($last, 2) + 1;
        } else {
            $num = 1;
        }
        return 'L-' . str_pad($num, 4, '0', STR_PAD_LEFT);
    }

    public static function create(array $data): array {
        $db = Database::getConnection();
        // Auto-generate code if not provided
        $code = !empty($data['ledger_code']) ? $data['ledger_code'] : self::nextCode();
        // Check unique code
        $check = $db->prepare("SELECT id FROM ledgers WHERE ledger_code = :code");
        $check->execute(['code' => $code]);
        if ($check->fetch()) throw new Exception('Ledger code already exists');

        $stmt = $db->prepare("
            INSERT INTO ledgers (ledger_code, ledger_name, group_id, opening_balance, opening_balance_type,
                opening_balance_date, address, mobile, city, state, gst_no, pan_no, email,
                contact_person, description, status, account_ref_id, created_at, updated_at)
            VALUES (:ledger_code, :ledger_name, :group_id, :opening_balance, :opening_balance_type,
                :opening_balance_date, :address, :mobile, :city, :state, :gst_no, :pan_no, :email,
                :contact_person, :description, :status, :account_ref_id, NOW(), NOW())
        ");
        $stmt->execute([
            'ledger_code'          => $code,
            'ledger_name'          => $data['ledger_name'],
            'group_id'             => (int)$data['group_id'],
            'opening_balance'      => (float)($data['opening_balance'] ?? 0),
            'opening_balance_type' => $data['opening_balance_type'] ?? 'NIL',
            'opening_balance_date' => $data['opening_balance_date'] ?? null,
            'address'              => $data['address'] ?? null,
            'mobile'               => $data['mobile'] ?? null,
            'city'                 => $data['city'] ?? null,
            'state'                => $data['state'] ?? null,
            'gst_no'               => $data['gst_no'] ?? null,
            'pan_no'               => $data['pan_no'] ?? null,
            'email'                => $data['email'] ?? null,
            'contact_person'       => $data['contact_person'] ?? null,
            'description'          => $data['description'] ?? null,
            'status'               => $data['status'] ?? 'ACTIVE',
            'account_ref_id'       => $data['account_ref_id'] ?? null,
        ]);
        $id = (int)$db->lastInsertId();

        // Post opening balance if any
        if (!empty($data['opening_balance']) && (float)$data['opening_balance'] > 0) {
            $obType = $data['opening_balance_type'] ?? 'NIL';
            if ($obType !== 'NIL') {
                $db->prepare("
                    INSERT INTO ledger_postings (ledger_id, debit, credit, running_balance, balance_type,
                        posting_date, narration, is_opening, created_at)
                    VALUES (:lid, :dr, :cr, :bal, :bt, :pd, 'Opening Balance', 1, NOW())
                ")->execute([
                    'lid' => $id,
                    'dr'  => $obType === 'DR' ? (float)$data['opening_balance'] : 0,
                    'cr'  => $obType === 'CR' ? (float)$data['opening_balance'] : 0,
                    'bal' => (float)$data['opening_balance'],
                    'bt'  => $obType,
                    'pd'  => $data['opening_balance_date'] ?? date('Y-m-d'),
                ]);
            }
        }

        return self::getById($id);
    }

    public static function update(int $id, array $data): array {
        $db = Database::getConnection();
        // Check unique code (exclude self)
        if (!empty($data['ledger_code'])) {
            $check = $db->prepare("SELECT id FROM ledgers WHERE ledger_code = :code AND id != :id");
            $check->execute(['code' => $data['ledger_code'], 'id' => $id]);
            if ($check->fetch()) throw new Exception('Ledger code already exists');
        }

        $stmt = $db->prepare("
            UPDATE ledgers SET
                ledger_name=:ledger_name, group_id=:group_id,
                opening_balance=:opening_balance, opening_balance_type=:opening_balance_type,
                opening_balance_date=:opening_balance_date, address=:address, mobile=:mobile,
                city=:city, state=:state, gst_no=:gst_no, pan_no=:pan_no, email=:email,
                contact_person=:contact_person, description=:description, status=:status,
                updated_at=NOW()
            WHERE id=:id
        ");
        $stmt->execute([
            'ledger_name'          => $data['ledger_name'],
            'group_id'             => (int)$data['group_id'],
            'opening_balance'      => (float)($data['opening_balance'] ?? 0),
            'opening_balance_type' => $data['opening_balance_type'] ?? 'NIL',
            'opening_balance_date' => $data['opening_balance_date'] ?? null,
            'address'              => $data['address'] ?? null,
            'mobile'               => $data['mobile'] ?? null,
            'city'                 => $data['city'] ?? null,
            'state'                => $data['state'] ?? null,
            'gst_no'               => $data['gst_no'] ?? null,
            'pan_no'               => $data['pan_no'] ?? null,
            'email'                => $data['email'] ?? null,
            'contact_person'       => $data['contact_person'] ?? null,
            'description'          => $data['description'] ?? null,
            'status'               => $data['status'] ?? 'ACTIVE',
            'id'                   => $id,
        ]);
        return self::getById($id);
    }

    public static function delete(int $id): bool {
        $db = Database::getConnection();
        $check = $db->prepare("SELECT COUNT(*) FROM ledger_postings WHERE ledger_id = :id");
        $check->execute(['id' => $id]);
        if ((int)$check->fetchColumn() > 0) throw new Exception('Cannot delete: ledger has transactions');

        $check2 = $db->prepare("SELECT account_ref_id FROM ledgers WHERE id = :id");
        $check2->execute(['id' => $id]);
        $row = $check2->fetch(PDO::FETCH_ASSOC);
        if ($row && $row['account_ref_id']) throw new Exception('Cannot delete: linked to a party account');

        $stmt = $db->prepare("DELETE FROM ledgers WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public static function getAllForDropdown(): array {
        $db = Database::getConnection();
        return $db->query("
            SELECT l.id, l.ledger_code, l.ledger_name, l.group_id, ag.name AS group_name, ag.nature
            FROM ledgers l LEFT JOIN account_groups ag ON ag.id = l.group_id
            WHERE l.status = 'ACTIVE'
            ORDER BY l.ledger_name ASC
        ")->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getBalance(int $ledgerId, ?string $asOnDate = null, ?int $excludeVoucherId = null): array {
        $db = Database::getConnection();
        $where = 'ledger_id = :id';
        $params = ['id' => $ledgerId];
        if ($asOnDate) {
            $where .= ' AND posting_date <= :date';
            $params['date'] = $asOnDate;
        }
        if ($excludeVoucherId && $excludeVoucherId > 0) {
            $where .= ' AND (voucher_id IS NULL OR voucher_id != :exclude_vid)';
            $params['exclude_vid'] = $excludeVoucherId;
        }
        $row = $db->prepare("SELECT COALESCE(SUM(debit), 0) AS total_dr, COALESCE(SUM(credit), 0) AS total_cr, SUM(CASE WHEN is_opening = 1 THEN 1 ELSE 0 END) AS has_opening FROM ledger_postings WHERE $where");
        $row->execute($params);
        $data = $row->fetch(PDO::FETCH_ASSOC);
        $dr = (float)($data['total_dr'] ?? 0);
        $cr = (float)($data['total_cr'] ?? 0);
        $hasOpening = (int)($data['has_opening'] ?? 0) > 0;

        // Fetch ledger metadata & linked account metal fine balances
        $lStmt = $db->prepare("
            SELECT l.opening_balance, l.opening_balance_type,
                   COALESCE(a.balance_fine_gold, 0) AS fine_gold,
                   COALESCE(a.balance_fine_silver, 0) AS fine_silver
            FROM ledgers l
            LEFT JOIN accounts a ON a.id = l.account_ref_id
            WHERE l.id = :id
            LIMIT 1
        ");
        $lStmt->execute(['id' => $ledgerId]);
        $ledgerMeta = $lStmt->fetch(PDO::FETCH_ASSOC);

        if (!$hasOpening && $ledgerMeta && (float)$ledgerMeta['opening_balance'] > 0) {
            $ob = (float)$ledgerMeta['opening_balance'];
            if ($ledgerMeta['opening_balance_type'] === 'DR') {
                $dr += $ob;
            } elseif ($ledgerMeta['opening_balance_type'] === 'CR') {
                $cr += $ob;
            }
        }

        $balance = $dr - $cr;
        return [
            'ledger_id' => $ledgerId,
            'total_debit' => round($dr, 2),
            'total_credit' => round($cr, 2),
            'balance' => round(abs($balance), 2),
            'balance_type' => $balance >= 0 ? 'DR' : 'CR',
            'fine_gold' => round((float)($ledgerMeta['fine_gold'] ?? 0), 3),
            'fine_silver' => round((float)($ledgerMeta['fine_silver'] ?? 0), 3),
        ];
    }

    public static function getLedgerBook(int $ledgerId, ?string $from = null, ?string $to = null, array $filters = []): array {
        $db = Database::getConnection();
        $ledger = self::getById($ledgerId);
        if (!$ledger) {
            throw new Exception('Ledger not found');
        }

        // Check if any opening posting exists in ledger_postings
        $hasOpeningStmt = $db->prepare("SELECT COUNT(*) FROM ledger_postings WHERE ledger_id = :id AND is_opening = 1");
        $hasOpeningStmt->execute(['id' => $ledgerId]);
        $hasOpeningPosting = (int)$hasOpeningStmt->fetchColumn() > 0;

        // Calculate brought-forward balance if $from is provided
        $openingEntries = [];
        $bfAmount = 0.0;
        $bfGold = 0.0;
        $bfSilver = 0.0;

        if ($from) {
            $priorStmt = $db->prepare("
                SELECT lp.debit, lp.credit, lp.reference_type,
                       sr.gold_weight AS sr_gold, sr.silver_weight AS sr_silver,
                       pr.gold_weight AS pr_gold, pr.silver_weight AS pr_silver,
                       sret.metal_type AS sret_metal, sret.return_weight AS sret_weight,
                       pret.metal_type AS pret_metal, pret.return_weight AS pret_weight
                FROM ledger_postings lp
                LEFT JOIN sale_register sr ON lp.reference_type = 'SALE_REGISTER' AND sr.id = lp.reference_id
                LEFT JOIN purchase_register pr ON lp.reference_type = 'PURCHASE_REGISTER' AND pr.id = lp.reference_id
                LEFT JOIN sale_returns sret ON lp.reference_type = 'SALE_RETURN' AND sret.id = lp.reference_id
                LEFT JOIN purchase_returns pret ON lp.reference_type = 'PURCHASE_RETURN' AND pret.id = lp.reference_id
                WHERE lp.ledger_id = :id AND lp.posting_date < :from
            ");
            $priorStmt->execute(['id' => $ledgerId, 'from' => $from]);
            foreach ($priorStmt->fetchAll(PDO::FETCH_ASSOC) as $prRow) {
                $dr = (float)$prRow['debit'];
                $cr = (float)$prRow['credit'];
                $bfAmount += ($dr - $cr);
                $g = (float)($prRow['sr_gold'] ?? $prRow['pr_gold'] ?? 0);
                $s = (float)($prRow['sr_silver'] ?? $prRow['pr_silver'] ?? 0);
                if ($prRow['reference_type'] === 'SALE_RETURN') {
                    if (stripos((string)$prRow['sret_metal'], 'gold') !== false) $g += (float)$prRow['sret_weight'];
                    else $s += (float)$prRow['sret_weight'];
                } elseif ($prRow['reference_type'] === 'PURCHASE_RETURN') {
                    if (stripos((string)$prRow['pret_metal'], 'gold') !== false) $g += (float)$prRow['pret_weight'];
                    else $s += (float)$prRow['pret_weight'];
                }
                if ($dr >= $cr) { $bfGold += $g; $bfSilver += $s; }
                else { $bfGold -= $g; $bfSilver -= $s; }
            }
        }

        if (!$hasOpeningPosting && (float)($ledger['opening_balance'] ?? 0) > 0) {
            $ob = (float)$ledger['opening_balance'];
            $obType = $ledger['opening_balance_type'] ?? 'NIL';
            if ($obType === 'DR') $bfAmount += $ob;
            elseif ($obType === 'CR') $bfAmount -= $ob;
        }

        if (abs($bfAmount) > 0.001 || abs($bfGold) > 0.0001 || abs($bfSilver) > 0.0001) {
            $openingEntries[] = [
                'id' => 0,
                'ledger_id' => $ledgerId,
                'voucher_id' => null,
                'reference_type' => 'OPENING',
                'reference_id' => null,
                'voucher_type' => 'OPENING',
                'voucher_no' => 'OB',
                'series' => '',
                'reference_no' => 'Opening',
                'posting_date' => $from ?: ($ledger['opening_balance_date'] ?? date('Y-m-d')),
                'narration' => $from ? 'Opening Balance (Brought Forward)' : 'Opening Balance',
                'is_opening' => 1,
                'debit' => $bfAmount >= 0 ? round($bfAmount, 2) : 0.0,
                'credit' => $bfAmount < 0 ? round(abs($bfAmount), 2) : 0.0,
                'gold_fine_dr' => $bfGold >= 0 ? round($bfGold, 3) : 0.0,
                'gold_fine_cr' => $bfGold < 0 ? round(abs($bfGold), 3) : 0.0,
                'silver_fine_dr' => $bfSilver >= 0 ? round($bfSilver, 3) : 0.0,
                'silver_fine_cr' => $bfSilver < 0 ? round(abs($bfSilver), 3) : 0.0,
                'diamond_weight' => 0.0,
                'stone_weight' => 0.0,
                'is_approved' => 1,
                'is_excluded' => 0,
            ];
        }

        $where = 'lp.ledger_id = :id';
        $params = ['id' => $ledgerId];
        if ($from) { $where .= ' AND lp.posting_date >= :from'; $params['from'] = $from; }
        if ($to) { $where .= ' AND lp.posting_date <= :to'; $params['to'] = $to; }

        $stmt = $db->prepare("
            SELECT lp.*,
                   v.voucher_type AS v_type, v.voucher_no, v.series,
                   sr.voucher_no AS sr_vno, sr.voucher_type AS sr_vtype, sr.item_name AS sr_item, sr.stamp AS sr_stamp, sr.item_type AS sr_item_type, sr.remarks AS sr_remarks, sr.gold_weight AS sr_gold, sr.silver_weight AS sr_silver, sr.diamond_weight AS sr_dia, sr.stone_weight AS sr_stone, sr.is_approved AS sr_approved, sr.is_excluded AS sr_excluded, sr.is_selected AS sr_selected,
                   pr.voucher_no AS pr_vno, pr.voucher_type AS pr_vtype, pr.particular AS pr_item, pr.stamp AS pr_stamp, pr.item_type AS pr_item_type, pr.remarks AS pr_remarks, pr.gold_weight AS pr_gold, pr.silver_weight AS pr_silver, pr.diamond_weight AS pr_dia, pr.stone_weight AS pr_stone, pr.is_approved AS pr_approved, pr.is_excluded AS pr_excluded, pr.is_selected AS pr_selected,
                   sret.return_no AS sret_no, sret.metal_type AS sret_metal, sret.return_weight AS sret_weight,
                   pret.return_no AS pret_no, pret.metal_type AS pret_metal, pret.return_weight AS pret_weight
            FROM ledger_postings lp
            LEFT JOIN vouchers v ON v.id = lp.voucher_id
            LEFT JOIN sale_register sr ON lp.reference_type = 'SALE_REGISTER' AND sr.id = lp.reference_id
            LEFT JOIN purchase_register pr ON lp.reference_type = 'PURCHASE_REGISTER' AND pr.id = lp.reference_id
            LEFT JOIN sale_returns sret ON lp.reference_type = 'SALE_RETURN' AND sret.id = lp.reference_id
            LEFT JOIN purchase_returns pret ON lp.reference_type = 'PURCHASE_RETURN' AND pret.id = lp.reference_id
            WHERE $where
            ORDER BY lp.is_opening DESC, lp.posting_date ASC, lp.id ASC
        ");
        $stmt->execute($params);
        $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $normalized = $openingEntries;
        foreach ($rawRows as $r) {
            $dr = (float)$r['debit'];
            $cr = (float)$r['credit'];
            $refType = $r['reference_type'] ?: ($r['v_type'] ?: ($r['is_opening'] ? 'OPENING' : 'JOURNAL'));
            $vType = $r['is_opening'] ? 'OPENING' : ($r['v_type'] ?: ($r['sr_vtype'] ?: ($r['pr_vtype'] ?: $refType)));
            $refNo = $r['voucher_no']
                ? (($r['series'] ? $r['series'] . '/' : '') . $r['voucher_no'])
                : ($r['sr_vno'] ?: ($r['pr_vno'] ?: ($r['sret_no'] ?: ($r['pret_no'] ?: ($r['is_opening'] ? 'Opening' : '—')))));

            $gold = (float)($r['sr_gold'] ?? $r['pr_gold'] ?? 0);
            $silver = (float)($r['sr_silver'] ?? $r['pr_silver'] ?? 0);
            if ($refType === 'SALE_RETURN') {
                if (stripos((string)$r['sret_metal'], 'gold') !== false) $gold = (float)$r['sret_weight'];
                else $silver = (float)$r['sret_weight'];
            } elseif ($refType === 'PURCHASE_RETURN') {
                if (stripos((string)$r['pret_metal'], 'gold') !== false) $gold = (float)$r['pret_weight'];
                else $silver = (float)$r['pret_weight'];
            }

            $dia = (float)($r['sr_dia'] ?? $r['pr_dia'] ?? 0);
            $stone = (float)($r['sr_stone'] ?? $r['pr_stone'] ?? 0);
            $isApproved = $r['sr_approved'] !== null ? (int)$r['sr_approved'] : ($r['pr_approved'] !== null ? (int)$r['pr_approved'] : 1);
            $isExcluded = $r['sr_excluded'] !== null ? (int)$r['sr_excluded'] : ($r['pr_excluded'] !== null ? (int)$r['pr_excluded'] : 0);
            $isSelected = $r['sr_selected'] !== null ? (int)$r['sr_selected'] : ($r['pr_selected'] !== null ? (int)$r['pr_selected'] : 0);

            $normalized[] = [
                'id' => (int)$r['id'],
                'ledger_id' => (int)$r['ledger_id'],
                'voucher_id' => $r['voucher_id'] ? (int)$r['voucher_id'] : null,
                'reference_type' => $refType,
                'reference_id' => $r['reference_id'] ? (int)$r['reference_id'] : null,
                'voucher_type' => $vType,
                'voucher_no' => $r['voucher_no'],
                'series' => $r['series'],
                'reference_no' => $refNo,
                'posting_date' => $r['posting_date'],
                'narration' => $r['narration'] ?: ($r['is_opening'] ? 'Opening Balance' : ''),
                'is_opening' => (int)$r['is_opening'],
                'debit' => round($dr, 2),
                'credit' => round($cr, 2),
                'gold_fine_dr' => $dr >= $cr ? round($gold, 3) : 0.0,
                'gold_fine_cr' => $cr > $dr ? round($gold, 3) : 0.0,
                'silver_fine_dr' => $dr >= $cr ? round($silver, 3) : 0.0,
                'silver_fine_cr' => $cr > $dr ? round($silver, 3) : 0.0,
                'diamond_weight' => round($dia, 3),
                'stone_weight' => round($stone, 3),
                'is_approved' => $isApproved,
                'is_excluded' => $isExcluded,
                'is_selected' => $isSelected,
                'item_name' => (string)($r['sr_item'] ?? $r['pr_item'] ?? ''),
                'stamp' => (string)($r['sr_stamp'] ?? $r['pr_stamp'] ?? ''),
                'item_type' => (string)($r['sr_item_type'] ?? $r['pr_item_type'] ?? ''),
                'remarks' => (string)($r['sr_remarks'] ?? $r['pr_remarks'] ?? ''),
            ];
        }

        // Apply optional statement filters
        $vTypeFilter = strtoupper(trim((string)($filters['voucher_type'] ?? '')));
        $search = strtolower(trim((string)($filters['search'] ?? '')));
        $exclude = !empty($filters['exclude']) && $filters['exclude'] !== '0' && $filters['exclude'] !== 'false';
        $approval = strtolower(trim((string)($filters['approval'] ?? '')));
        $diaFilter = strtolower(trim((string)($filters['dia_filter'] ?? '')));

        $filtered = array_values(array_filter($normalized, function ($row) use ($vTypeFilter, $search, $exclude, $approval, $diaFilter) {
            if ($vTypeFilter !== '' && $vTypeFilter !== 'ALL') {
                if (strtoupper((string)$row['voucher_type']) !== $vTypeFilter && strtoupper((string)$row['reference_type']) !== $vTypeFilter) {
                    return false;
                }
            }
            if ($exclude && (int)$row['is_excluded'] === 1) {
                return false;
            }
            if ($search !== '') {
                $haystack = strtolower(($row['narration'] ?? '') . ' ' . ($row['reference_no'] ?? '') . ' ' . ($row['voucher_type'] ?? ''));
                $matched = str_contains($haystack, $search);
                if ($exclude ? $matched : !$matched) {
                    return false;
                }
            }
            if ($approval === 'approval' || $approval === 'approved') {
                if ((int)$row['is_approved'] !== 1) return false;
            } elseif ($approval === 'without_approval' || $approval === 'unapproved') {
                if ((int)$row['is_approved'] !== 0) return false;
            } elseif ($approval === 'selected') {
                if ((int)($row['is_selected'] ?? 0) !== 1) return false;
            } elseif ($approval === 'not_selected') {
                if ((int)($row['is_selected'] ?? 0) !== 0) return false;
            } elseif ($approval === 'account_entry') {
                $isAcct = !empty($row['voucher_id']) || in_array(strtoupper((string)$row['reference_type']), ['RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL', 'OPENING'], true);
                if (!$isAcct) return false;
            } elseif ($approval === 'repair') {
                $isRepair = stripos((string)$row['voucher_type'], 'REPAIR') !== false || stripos((string)$row['narration'], 'REPAIR') !== false;
                if (!$isRepair) return false;
            }
            if ($diaFilter === 'diamond' && (float)$row['diamond_weight'] <= 0) return false;
            if ($diaFilter === 'stone' && (float)$row['stone_weight'] <= 0) return false;
            return true;
        }));

        // Optional merge modes
        $mergeMode = strtolower(trim((string)($filters['merge'] ?? '')));
        if ($mergeMode !== '' && $mergeMode !== '0' && $mergeMode !== 'false' && $mergeMode !== 'no') {
            $mergedMap = [];
            foreach ($filtered as $row) {
                $base = $row['posting_date'] . '|' . $row['voucher_type'] . '|' . $row['reference_no'];
                $isStudded = ((float)$row['diamond_weight'] > 0 || (float)$row['stone_weight'] > 0) ? '1' : '0';
                $k = match ($mergeMode) {
                    'item_stamp_studed'   => $base . '|' . $row['item_name'] . '|' . $row['stamp'] . '|' . $isStudded,
                    'item_remarks_studed' => $base . '|' . $row['item_name'] . '|' . $row['remarks'] . '|' . $isStudded,
                    'type_remarks_studed' => $base . '|' . $row['item_type'] . '|' . $row['remarks'] . '|' . $isStudded,
                    'item_stamp'          => $base . '|' . $row['item_name'] . '|' . $row['stamp'],
                    'item_type'           => $base . '|' . $row['item_type'],
                    'item_rate'           => $base . '|' . $row['item_name'] . '|' . ($row['debit'] ?: $row['credit']),
                    default               => $base,
                };
                if (!isset($mergedMap[$k])) {
                    $mergedMap[$k] = $row;
                } else {
                    $mergedMap[$k]['debit'] = round($mergedMap[$k]['debit'] + $row['debit'], 2);
                    $mergedMap[$k]['credit'] = round($mergedMap[$k]['credit'] + $row['credit'], 2);
                    $mergedMap[$k]['gold_fine_dr'] = round($mergedMap[$k]['gold_fine_dr'] + $row['gold_fine_dr'], 3);
                    $mergedMap[$k]['gold_fine_cr'] = round($mergedMap[$k]['gold_fine_cr'] + $row['gold_fine_cr'], 3);
                    $mergedMap[$k]['silver_fine_dr'] = round($mergedMap[$k]['silver_fine_dr'] + $row['silver_fine_dr'], 3);
                    $mergedMap[$k]['silver_fine_cr'] = round($mergedMap[$k]['silver_fine_cr'] + $row['silver_fine_cr'], 3);
                    $mergedMap[$k]['diamond_weight'] = round($mergedMap[$k]['diamond_weight'] + $row['diamond_weight'], 3);
                    $mergedMap[$k]['stone_weight'] = round($mergedMap[$k]['stone_weight'] + $row['stone_weight'], 3);
                }
            }
            $filtered = array_values($mergedMap);
        }

        // Calculate running balances (Amount, Gold, Silver) + summary totals
        $netAmount = 0.0;
        $netGold = 0.0;
        $netSilver = 0.0;
        $totDr = 0.0; $totCr = 0.0;
        $totGoldDr = 0.0; $totGoldCr = 0.0;
        $totSilverDr = 0.0; $totSilverCr = 0.0;
        $runningSum = 0.0;

        foreach ($filtered as &$row) {
            $totDr += $row['debit'];
            $totCr += $row['credit'];
            $totGoldDr += $row['gold_fine_dr'];
            $totGoldCr += $row['gold_fine_cr'];
            $totSilverDr += $row['silver_fine_dr'];
            $totSilverCr += $row['silver_fine_cr'];

            $netAmount += ($row['debit'] - $row['credit']);
            $netGold += ($row['gold_fine_dr'] - $row['gold_fine_cr']);
            $netSilver += ($row['silver_fine_dr'] - $row['silver_fine_cr']);

            $row['running_balance'] = round(abs($netAmount), 2);
            $row['balance_type'] = $netAmount >= 0 ? 'DR' : 'CR';
            $row['running_gold_balance'] = round(abs($netGold), 3);
            $row['gold_balance_type'] = $netGold >= 0 ? 'DR' : 'CR';
            $row['running_silver_balance'] = round(abs($netSilver), 3);
            $row['silver_balance_type'] = $netSilver >= 0 ? 'DR' : 'CR';

            $runningSum += $netAmount;
        }
        unset($row);

        $avgBalance = count($filtered) > 0 ? round($runningSum / count($filtered), 2) : 0.0;

        return [
            'ledger' => $ledger,
            'entries' => $filtered,
            'closing_balance' => round(abs($netAmount), 2),
            'closing_balance_type' => $netAmount >= 0 ? 'DR' : 'CR',
            'closing_gold_balance' => round(abs($netGold), 3),
            'closing_gold_type' => $netGold >= 0 ? 'DR' : 'CR',
            'closing_silver_balance' => round(abs($netSilver), 3),
            'closing_silver_type' => $netSilver >= 0 ? 'DR' : 'CR',
            'summary' => [
                'total_debit' => round($totDr, 2),
                'total_credit' => round($totCr, 2),
                'total_gold_debit' => round($totGoldDr, 3),
                'total_gold_credit' => round($totGoldCr, 3),
                'total_silver_debit' => round($totSilverDr, 3),
                'total_silver_credit' => round($totSilverCr, 3),
                'average_balance' => round(abs($avgBalance), 2),
                'average_balance_type' => $avgBalance >= 0 ? 'DR' : 'CR',
                'entry_count' => count($filtered),
            ],
        ];
    }

    public static function filterOptions(): array {
        $db = Database::getConnection();
        $groups = $db->query("SELECT id, name FROM account_groups ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
        $cities = $db->query("SELECT DISTINCT city FROM ledgers WHERE city IS NOT NULL AND city != '' ORDER BY city")->fetchAll(PDO::FETCH_COLUMN);
        return ['groups' => $groups, 'cities' => $cities];
    }

    public static function getLedgerCsvData(int $ledgerId, ?string $from = null, ?string $to = null): array {
        $db = Database::getConnection();
        $where = 'ledger_id = :id';
        $params = ['id' => $ledgerId];
        if ($from) { $where .= ' AND posting_date >= :from'; $params['from'] = $from; }
        if ($to) { $where .= ' AND posting_date <= :to'; $params['to'] = $to; }

        $stmt = $db->prepare("
            SELECT lp.debit, lp.credit, lp.running_balance, lp.balance_type, lp.posting_date,
                   v.voucher_type, v.voucher_no, v.series,
                   l.ledger_name, l.ledger_code, ag.name AS group_name
            FROM ledger_postings lp
            LEFT JOIN vouchers v ON v.id = lp.voucher_id
            LEFT JOIN ledgers l ON l.id = lp.ledger_id
            LEFT JOIN account_groups ag ON ag.id = l.group_id
            WHERE $where
            ORDER BY lp.posting_date ASC, lp.id ASC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ['rows' => $rows, 'ledger_id' => $ledgerId];
    }
}
