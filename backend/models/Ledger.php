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
            ORDER BY l.ledger_name ASC
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

    public static function getBalance(int $ledgerId, ?string $asOnDate = null): array {
        $db = Database::getConnection();
        $where = 'ledger_id = :id';
        $params = ['id' => $ledgerId];
        if ($asOnDate) {
            $where .= ' AND posting_date <= :date';
            $params['date'] = $asOnDate;
        }
        $row = $db->prepare("SELECT SUM(debit) AS total_dr, SUM(credit) AS total_cr FROM ledger_postings WHERE $where");
        $row->execute($params);
        $data = $row->fetch(PDO::FETCH_ASSOC);
        $dr = (float)($data['total_dr'] ?? 0);
        $cr = (float)($data['total_cr'] ?? 0);
        $balance = $dr - $cr;
        return [
            'ledger_id' => $ledgerId,
            'total_debit' => $dr,
            'total_credit' => $cr,
            'balance' => abs($balance),
            'balance_type' => $balance >= 0 ? 'DR' : 'CR',
        ];
    }

    public static function getLedgerBook(int $ledgerId, ?string $from = null, ?string $to = null): array {
        $db = Database::getConnection();
        $where = 'lp.ledger_id = :id';
        $params = ['id' => $ledgerId];
        if ($from) { $where .= ' AND lp.posting_date >= :from'; $params['from'] = $from; }
        if ($to) { $where .= ' AND lp.posting_date <= :to'; $params['to'] = $to; }

        $stmt = $db->prepare("
            SELECT lp.*, v.voucher_type, v.voucher_no, v.series
            FROM ledger_postings lp
            LEFT JOIN vouchers v ON v.id = lp.voucher_id
            WHERE $where
            ORDER BY lp.posting_date ASC, lp.id ASC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate running balance
        $balance = 0;
        $balType = 'DR';
        foreach ($rows as &$row) {
            $balance += (float)$row['debit'] - (float)$row['credit'];
            $row['running_balance'] = abs($balance);
            $row['balance_type'] = $balance >= 0 ? 'DR' : 'CR';
        }

        $ledger = self::getById($ledgerId);
        return [
            'ledger' => $ledger,
            'entries' => $rows,
            'closing_balance' => abs($balance),
            'closing_balance_type' => $balance >= 0 ? 'DR' : 'CR',
        ];
    }

    public static function filterOptions(): array {
        $db = Database::getConnection();
        $groups = $db->query("SELECT id, name FROM account_groups ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
        $cities = $db->query("SELECT DISTINCT city FROM ledgers WHERE city IS NOT NULL AND city != '' ORDER BY city")->fetchAll(PDO::FETCH_COLUMN);
        return ['groups' => $groups, 'cities' => $cities];
    }
}
