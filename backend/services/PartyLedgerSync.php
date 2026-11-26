<?php
namespace Services;

use Config\Database;
use PDO;

/**
 * PartyLedgerSync - Keeps accounts (Customer, Supplier, Karigar, Cash, Bank)
 * and legacy `customer` records synchronized with `ledgers` without duplication.
 */
class PartyLedgerSync {

    /**
     * Ensure a ledger exists for an `accounts` row. Returns ledger_id.
     */
    public static function syncAccount(int $accountId): ?int {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM accounts WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $accountId]);
        $acc = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$acc) return null;

        // Check if ledger already linked
        $check = $db->prepare("SELECT id FROM ledgers WHERE account_ref_id = :aid LIMIT 1");
        $check->execute(['aid' => $accountId]);
        $existingId = $check->fetchColumn();

        $ob = abs((float)($acc['balance_inr'] ?? 0));
        $obType = 'NIL';
        if ($ob > 0) {
            $obType = in_array($acc['account_type'], ['SUPPLIER']) ? 'CR' : 'DR';
        }
        $groupId = (int)($acc['group_id'] ?? 1);
        $status = !empty($acc['is_active']) ? 'ACTIVE' : 'INACTIVE';

        if ($existingId) {
            $db->prepare("
                UPDATE ledgers SET
                    ledger_name = :name, group_id = :gid, mobile = :mob,
                    city = :city, state = :state, gst_no = :gst, pan_no = :pan,
                    email = :email, address = :addr, status = :st, updated_at = NOW()
                WHERE id = :lid
            ")->execute([
                'name'  => $acc['name'],
                'gid'   => $groupId,
                'mob'   => $acc['mobile'] ?? null,
                'city'  => $acc['city'] ?? null,
                'state' => $acc['state'] ?? null,
                'gst'   => $acc['gstin'] ?? null,
                'pan'   => $acc['pan_no'] ?? null,
                'email' => $acc['email'] ?? null,
                'addr'  => $acc['address'] ?? null,
                'st'    => $status,
                'lid'   => (int)$existingId,
            ]);
            return (int)$existingId;
        }

        $code = 'L-' . str_pad((string)$accountId, 4, '0', STR_PAD_LEFT);
        // Ensure code is unique
        $cStmt = $db->prepare("SELECT id FROM ledgers WHERE ledger_code = :c LIMIT 1");
        $cStmt->execute(['c' => $code]);
        if ($cStmt->fetchColumn()) {
            $code = 'L-A' . $accountId . '-' . rand(10, 99);
        }

        $ins = $db->prepare("
            INSERT INTO ledgers (ledger_code, ledger_name, group_id, opening_balance, opening_balance_type,
                opening_balance_date, address, mobile, city, state, gst_no, pan_no, email, status, account_ref_id, created_at, updated_at)
            VALUES (:code, :name, :gid, :ob, :obt, CURDATE(), :addr, :mob, :city, :state, :gst, :pan, :email, :st, :aid, NOW(), NOW())
        ");
        $ins->execute([
            'code'  => $code,
            'name'  => $acc['name'],
            'gid'   => $groupId,
            'ob'    => $ob,
            'obt'   => $obType,
            'addr'  => $acc['address'] ?? null,
            'mob'   => $acc['mobile'] ?? null,
            'city'  => $acc['city'] ?? null,
            'state' => $acc['state'] ?? null,
            'gst'   => $acc['gstin'] ?? null,
            'pan'   => $acc['pan_no'] ?? null,
            'email' => $acc['email'] ?? null,
            'st'    => $status,
            'aid'   => $accountId,
        ]);
        $ledgerId = (int)$db->lastInsertId();

        if ($ob > 0 && $obType !== 'NIL') {
            self::ensureOpeningPosting($ledgerId, $ob, $obType, date('Y-m-d'));
        }
        return $ledgerId;
    }

    /**
     * Resolve or auto-create a ledger by party name (used by SaleRegister / PurchaseRegister).
     */
    public static function resolveOrCreatePartyLedger(string $partyName, string $defaultGroupName = 'Sundry Debtors (Customers)'): int {
        $db = Database::getConnection();
        $name = trim($partyName);
        if ($name === '') $name = 'Cash Customer';

        // 1. Exact match in ledgers
        $stmt = $db->prepare("SELECT id FROM ledgers WHERE ledger_name = :name AND status != 'DELETED' LIMIT 1");
        $stmt->execute(['name' => $name]);
        $id = $stmt->fetchColumn();
        if ($id) return (int)$id;

        // 2. Match in accounts and sync
        $aStmt = $db->prepare("SELECT id FROM accounts WHERE name = :name LIMIT 1");
        $aStmt->execute(['name' => $name]);
        $accId = $aStmt->fetchColumn();
        if ($accId) {
            $synced = self::syncAccount((int)$accId);
            if ($synced) return $synced;
        }

        // 3. Find group id
        $gStmt = $db->prepare("SELECT id FROM account_groups WHERE name = :gname LIMIT 1");
        $gStmt->execute(['gname' => $defaultGroupName]);
        $groupId = (int)($gStmt->fetchColumn() ?: 1);

        $code = \Models\Ledger::nextCode();
        $ins = $db->prepare("
            INSERT INTO ledgers (ledger_code, ledger_name, group_id, opening_balance, opening_balance_type, status, created_at, updated_at)
            VALUES (:code, :name, :gid, 0, 'NIL', 'ACTIVE', NOW(), NOW())
        ");
        $ins->execute(['code' => $code, 'name' => $name, 'gid' => $groupId]);
        return (int)$db->lastInsertId();
    }

    /**
     * Resolve or create a system ledger (e.g. Sales Account, Purchase Account, Cash in Hand).
     */
    public static function getSystemLedger(string $ledgerName, string $groupName, string $nature = 'INCOME'): int {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM ledgers WHERE ledger_name = :name AND status != 'DELETED' LIMIT 1");
        $stmt->execute(['name' => $ledgerName]);
        $id = $stmt->fetchColumn();
        if ($id) return (int)$id;

        $gStmt = $db->prepare("SELECT id FROM account_groups WHERE name = :gname LIMIT 1");
        $gStmt->execute(['gname' => $groupName]);
        $groupId = $gStmt->fetchColumn();
        if (!$groupId) {
            $db->prepare("INSERT INTO account_groups (name, nature, is_active, created_at) VALUES (:n, :nat, 1, NOW())")
               ->execute(['n' => $groupName, 'nat' => $nature]);
            $groupId = (int)$db->lastInsertId();
        }

        $code = \Models\Ledger::nextCode();
        $db->prepare("
            INSERT INTO ledgers (ledger_code, ledger_name, group_id, opening_balance, opening_balance_type, status, created_at, updated_at)
            VALUES (:code, :name, :gid, 0, 'NIL', 'ACTIVE', NOW(), NOW())
        ")->execute(['code' => $code, 'name' => $ledgerName, 'gid' => (int)$groupId]);
        return (int)$db->lastInsertId();
    }

    public static function ensureOpeningPosting(int $ledgerId, float $amount, string $type, string $date): void {
        if ($amount <= 0 || $type === 'NIL') return;
        $db = Database::getConnection();
        $chk = $db->prepare("SELECT id FROM ledger_postings WHERE ledger_id = :lid AND is_opening = 1 LIMIT 1");
        $chk->execute(['lid' => $ledgerId]);
        if ($chk->fetchColumn()) return;

        $db->prepare("
            INSERT INTO ledger_postings (ledger_id, debit, credit, running_balance, balance_type, posting_date, narration, is_opening, created_at)
            VALUES (:lid, :dr, :cr, :bal, :bt, :pd, 'Opening Balance', 1, NOW())
        ")->execute([
            'lid' => $ledgerId,
            'dr'  => $type === 'DR' ? $amount : 0,
            'cr'  => $type === 'CR' ? $amount : 0,
            'bal' => $amount,
            'bt'  => $type,
            'pd'  => $date,
        ]);
    }
}
