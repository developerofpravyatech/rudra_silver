<?php
namespace Models;

use Config\Database;
use PDO;
use DateTime;

class AgeWiseReport {

    private static function normalizeDate(?string $d): ?string {
        if (!$d) return null;
        $d = trim($d);
        if ($d === '' || $d === '0000-00-00') return null;
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) return $d;
        if (preg_match('/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/', $d, $m)) {
            return sprintf('%04d-%02d-%02d', (int)$m[3], (int)$m[2], (int)$m[1]);
        }
        $ts = strtotime($d);
        return $ts ? date('Y-m-d', $ts) : null;
    }

    /**
     * Screen 1: Fetch Account Groups from account_groups master with optional search.
     */
    public static function getAccountGroups(?string $search = null): array {
        $db = Database::getConnection();
        $sql = "
            SELECT
                ag.id,
                ag.parent_id,
                ag.name,
                ag.nature,
                COUNT(a.id) AS account_count
            FROM account_groups ag
            LEFT JOIN accounts a ON a.group_id = ag.id AND a.is_active = 1
            WHERE 1=1
        ";
        $params = [];
        if ($search !== null && trim($search) !== '') {
            $sql .= " AND (ag.name LIKE :s1 OR ag.nature LIKE :s2)";
            $like = '%' . trim($search) . '%';
            $params['s1'] = $like;
            $params['s2'] = $like;
        }
        $sql .= " GROUP BY ag.id, ag.parent_id, ag.name, ag.nature ORDER BY ag.id ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['id'] = (int)$r['id'];
            $r['parent_id'] = $r['parent_id'] !== null ? (int)$r['parent_id'] : null;
            $r['account_count'] = (int)$r['account_count'];
        }
        return $rows;
    }

    /**
     * Fetch filter dropdown options: Cities, Locations, Reference Persons, and Account Groups.
     */
    public static function getFilterOptions(): array {
        $db = Database::getConnection();

        // Cities from accounts, customer, daily_balance, branches
        $cityRows = $db->query("
            SELECT DISTINCT city_val FROM (
                SELECT TRIM(city) AS city_val FROM accounts WHERE city IS NOT NULL AND TRIM(city) != ''
                UNION
                SELECT TRIM(City) AS city_val FROM customer WHERE City IS NOT NULL AND TRIM(City) != ''
                UNION
                SELECT TRIM(city) AS city_val FROM daily_balance WHERE city IS NOT NULL AND TRIM(city) != ''
                UNION
                SELECT TRIM(city) AS city_val FROM branches WHERE city IS NOT NULL AND TRIM(city) != ''
            ) c ORDER BY city_val ASC
        ")->fetchAll(PDO::FETCH_COLUMN);

        // Locations from customer.Location, daily_transactions.site, branches.name
        $locRows = $db->query("
            SELECT DISTINCT loc_val FROM (
                SELECT TRIM(Location) AS loc_val FROM customer WHERE Location IS NOT NULL AND TRIM(Location) != ''
                UNION
                SELECT TRIM(site) AS loc_val FROM daily_transactions WHERE site IS NOT NULL AND TRIM(site) != ''
                UNION
                SELECT TRIM(name) AS loc_val FROM branches WHERE name IS NOT NULL AND TRIM(name) != ''
            ) l ORDER BY loc_val ASC
        ")->fetchAll(PDO::FETCH_COLUMN);

        // Reference Persons from customer.RefBy
        $refRows = $db->query("
            SELECT DISTINCT TRIM(RefBy) AS ref_val
            FROM customer
            WHERE RefBy IS NOT NULL AND TRIM(RefBy) != ''
            ORDER BY ref_val ASC
        ")->fetchAll(PDO::FETCH_COLUMN);

        $groups = self::getAccountGroups(null);

        return [
            'cities' => array_values($cityRows),
            'locations' => array_values($locRows),
            'ref_by_list' => array_values($refRows),
            'groups' => $groups,
        ];
    }

    /**
     * Map text group names (from daily_transactions / sale_register / purchase_register)
     * to account_groups IDs so group filtering works seamlessly across unified tables.
     */
    private static function matchGroupIdByName(?string $textGroup, array $groupNameToId): ?int {
        if (!$textGroup) return null;
        $g = strtolower(trim($textGroup));
        if ($g === '') return null;

        if (isset($groupNameToId[$g])) {
            return $groupNameToId[$g];
        }
        if (str_contains($g, 'debtor') || str_contains($g, 'customer')) {
            return $groupNameToId['sundry debtors (customers)'] ?? 1;
        }
        if (str_contains($g, 'creditor') || str_contains($g, 'supplier') || str_contains($g, 'bullion')) {
            return $groupNameToId['sundry creditors (suppliers)'] ?? 2;
        }
        if (str_contains($g, 'karigar')) {
            return $groupNameToId['karigar (artisans & workshop)'] ?? 3;
        }
        if (str_contains($g, 'cash')) {
            return $groupNameToId['cash in hand'] ?? 4;
        }
        if (str_contains($g, 'bank')) {
            return $groupNameToId['bank accounts'] ?? 5;
        }
        if (str_contains($g, 'girvi')) {
            return $groupNameToId['girvi loan borrowers'] ?? 6;
        }
        return null;
    }

    /**
     * FIFO Ageing Engine:
     * Applies opposite-sign entries (receipts/payments/returns) against the oldest open lots first.
     * Remaining open lots are bucketed by age = (asOnDate - lotDate) in days.
     */
    private static function computeFifoBuckets(array $entries, string $asOnDate, int $interval): array {
        // $entries: [['date' => 'Y-m-d', 'amount' => float], ...]
        // Sort chronologically
        usort($entries, fn($a, $b) => strcmp($a['date'], $b['date']));

        // Maintain queue of open lots: each lot has same sign
        $openLots = []; // [['date' => string, 'amount' => float]]

        foreach ($entries as $entry) {
            $amt = round((float)$entry['amount'], 4);
            if (abs($amt) < 0.0001) continue;

            if (empty($openLots)) {
                $openLots[] = ['date' => $entry['date'], 'amount' => $amt];
                continue;
            }

            $lotSign = $openLots[0]['amount'] >= 0 ? 1 : -1;
            $entrySign = $amt >= 0 ? 1 : -1;

            if ($lotSign === $entrySign) {
                $openLots[] = ['date' => $entry['date'], 'amount' => $amt];
            } else {
                // Settle oldest open lots first (FIFO)
                $remaining = abs($amt);
                while ($remaining > 0.0001 && !empty($openLots)) {
                    $lotAbs = abs($openLots[0]['amount']);
                    if ($lotAbs <= $remaining + 0.0001) {
                        $remaining -= $lotAbs;
                        array_shift($openLots);
                    } else {
                        $openLots[0]['amount'] = $lotSign * ($lotAbs - $remaining);
                        $remaining = 0.0;
                    }
                }
                if ($remaining > 0.0001) {
                    $openLots[] = ['date' => $entry['date'], 'amount' => $entrySign * $remaining];
                }
            }
        }

        $buckets = [
            'current'  => 0.0,
            'bucket_1' => 0.0, // 1 .. N
            'bucket_2' => 0.0, // N+1 .. 2N
            'bucket_3' => 0.0, // 2N+1 .. 3N
            'old'      => 0.0, // > 3N
            'total'    => 0.0,
        ];

        $asOnDt = new DateTime($asOnDate);
        $b1End = $interval;
        $b2End = $interval * 2;
        $b3End = $interval * 3;

        foreach ($openLots as $lot) {
            $lotDt = new DateTime($lot['date']);
            $diff = $lotDt->diff($asOnDt);
            $ageDays = $diff->invert ? 0 : (int)$diff->days;
            $val = (float)$lot['amount'];

            if ($ageDays <= 0) {
                $buckets['current'] += $val;
            } elseif ($ageDays <= $b1End) {
                $buckets['bucket_1'] += $val;
            } elseif ($ageDays <= $b2End) {
                $buckets['bucket_2'] += $val;
            } elseif ($ageDays <= $b3End) {
                $buckets['bucket_3'] += $val;
            } else {
                $buckets['old'] += $val;
            }
            $buckets['total'] += $val;
        }

        foreach ($buckets as $k => $v) {
            $buckets[$k] = round($v, 3);
        }

        return $buckets;
    }

    /**
     * Build unified party ledger events and metadata across:
     * accounts, customer, vouchers, daily_transactions, sale_register, purchase_register
     */
    private static function buildUnifiedPartyData(string $asOnDate): array {
        $db = Database::getConnection();

        // 1. Account Groups
        $groups = self::getAccountGroups(null);
        $groupById = [];
        $groupNameToId = [];
        foreach ($groups as $g) {
            $groupById[$g['id']] = $g['name'];
            $groupNameToId[strtolower(trim($g['name']))] = $g['id'];
        }

        // 2. Customer master lookup (for City, Location, RefBy)
        $customerMap = [];
        $custRows = $db->query("SELECT Name, City, Location, RefBy FROM customer")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($custRows as $c) {
            $key = strtolower(trim($c['Name']));
            if ($key !== '' && !isset($customerMap[$key])) {
                $customerMap[$key] = [
                    'city' => trim($c['City'] ?? ''),
                    'location' => trim($c['Location'] ?? ''),
                    'ref_by' => trim($c['RefBy'] ?? ''),
                ];
            }
        }

        // 3. Accounts master lookup
        $accountsById = [];
        $accountsByName = [];
        $parties = []; // keyed by normalized lowercase party name

        $ensureParty = function(string $name, ?int $accountId = null, ?int $groupId = null, string $city = '', string $location = '', string $refBy = '') use (&$parties, $groupById, $customerMap) {
            $cleanName = trim($name);
            $key = strtolower($cleanName);
            if ($key === '') return null;

            if (!isset($parties[$key])) {
                $cust = $customerMap[$key] ?? null;
                $resolvedCity = $city !== '' ? $city : ($cust['city'] ?? '');
                $resolvedLoc = $location !== '' ? $location : ($cust['location'] ?? '');
                $resolvedRef = $refBy !== '' ? $refBy : ($cust['ref_by'] ?? '');

                $parties[$key] = [
                    'party_key' => $cleanName,
                    'account_id' => $accountId,
                    'account_name' => $cleanName,
                    'group_id' => $groupId,
                    'group_name' => $groupId ? ($groupById[$groupId] ?? '') : '',
                    'city' => $resolvedCity,
                    'location' => $resolvedLoc,
                    'ref_by' => $resolvedRef,
                    'ledger' => [], // detailed ledger entries
                    'cash_entries' => [],
                    'gold_entries' => [],
                    'silver_entries' => [],
                ];
            } else {
                if ($accountId && !$parties[$key]['account_id']) {
                    $parties[$key]['account_id'] = $accountId;
                }
                if ($groupId && !$parties[$key]['group_id']) {
                    $parties[$key]['group_id'] = $groupId;
                    $parties[$key]['group_name'] = $groupById[$groupId] ?? '';
                }
                if ($city !== '' && $parties[$key]['city'] === '') {
                    $parties[$key]['city'] = $city;
                }
                if ($location !== '' && $parties[$key]['location'] === '') {
                    $parties[$key]['location'] = $location;
                }
                if ($refBy !== '' && $parties[$key]['ref_by'] === '') {
                    $parties[$key]['ref_by'] = $refBy;
                }
            }
            return $key;
        };

        $accRows = $db->query("
            SELECT id, group_id, name, city, balance_inr, balance_fine_gold, balance_fine_silver, DATE(created_at) AS created_date
            FROM accounts
            WHERE is_active = 1
        ")->fetchAll(PDO::FETCH_ASSOC);

        foreach ($accRows as $a) {
            $aid = (int)$a['id'];
            $gid = (int)$a['group_id'];
            $accountsById[$aid] = $a;
            $accountsByName[strtolower(trim($a['name']))] = $a;
            $ensureParty($a['name'], $aid, $gid, trim($a['city'] ?? ''));
        }

        // Track which accounts have rows in vouchers so we don't double-count opening vs voucher balance
        $accountsWithVouchers = [];

        // 4. Vouchers (linked by account_id)
        $vStmt = $db->prepare("
            SELECT v.id, v.voucher_no, v.series, v.voucher_type, v.voucher_date, v.account_id,
                   v.net_amount, v.settled_fine_gold, v.settled_fine_silver, v.settled_cash_inr, v.narration,
                   b.name AS branch_name, b.city AS branch_city
            FROM vouchers v
            LEFT JOIN branches b ON b.id = v.branch_id
            WHERE v.voucher_date <= :as_on
            ORDER BY v.voucher_date ASC, v.id ASC
        ");
        $vStmt->execute(['as_on' => $asOnDate]);
        $vRows = $vStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($vRows as $v) {
            $aid = (int)$v['account_id'];
            if (!isset($accountsById[$aid])) continue;
            $accountsWithVouchers[$aid] = true;
            $acc = $accountsById[$aid];
            $key = $ensureParty($acc['name'], $aid, (int)$acc['group_id'], trim($acc['city'] ?? ''), trim($v['branch_name'] ?? ''));
            if (!$key) continue;

            $vType = strtoupper(trim($v['voucher_type']));
            $netAmt = (float)$v['net_amount'];
            $settledCash = (float)$v['settled_cash_inr'];
            $settledGold = (float)$v['settled_fine_gold'];
            $settledSilver = (float)$v['settled_fine_silver'];

            $vNo = ($v['series'] ? $v['series'] . '-' : '') . $v['voucher_no'];
            $particulars = $v['narration'] ?: ($vType . ' Voucher');

            // Debit / Credit convention: Positive = Receivable (Dr), Negative = Payable (Cr)
            $isCreditNature = in_array($vType, ['PURCHASE', 'SALE_RETURN', 'RECEIPT', 'METAL_RECEIPT', 'ORDER_ADVANCE']);
            $debit = $isCreditNature ? 0.0 : $netAmt;
            $credit = $isCreditNature ? $netAmt : 0.0;
            $cashDelta = $debit - $credit;

            if (abs($cashDelta) > 0.0001) {
                $parties[$key]['cash_entries'][] = ['date' => $v['voucher_date'], 'amount' => $cashDelta];
            }

            $parties[$key]['ledger'][] = [
                'date' => $v['voucher_date'],
                'voucher_no' => $vNo,
                'voucher_type' => $vType,
                'particulars' => $particulars,
                'debit' => round($debit, 2),
                'credit' => round($credit, 2),
                'gold_delta' => 0.0,
                'silver_delta' => 0.0,
                'source' => 'vouchers',
            ];

            // Inline settlement on voucher
            if (abs($settledCash) > 0.0001 || abs($settledGold) > 0.0001 || abs($settledSilver) > 0.0001) {
                $settleSign = $isCreditNature ? 1 : -1;
                $sCash = $settleSign * $settledCash;
                $sGold = $settleSign * $settledGold;
                $sSilver = $settleSign * $settledSilver;

                if (abs($sCash) > 0.0001) {
                    $parties[$key]['cash_entries'][] = ['date' => $v['voucher_date'], 'amount' => $sCash];
                }
                if (abs($sGold) > 0.0001) {
                    $parties[$key]['gold_entries'][] = ['date' => $v['voucher_date'], 'amount' => $sGold];
                }
                if (abs($sSilver) > 0.0001) {
                    $parties[$key]['silver_entries'][] = ['date' => $v['voucher_date'], 'amount' => $sSilver];
                }

                $parties[$key]['ledger'][] = [
                    'date' => $v['voucher_date'],
                    'voucher_no' => $vNo . ' (Settle)',
                    'voucher_type' => 'SETTLEMENT',
                    'particulars' => 'Settlement against ' . $vNo,
                    'debit' => $sCash > 0 ? round($sCash, 2) : 0.0,
                    'credit' => $sCash < 0 ? round(abs($sCash), 2) : 0.0,
                    'gold_delta' => round($sGold, 3),
                    'silver_delta' => round($sSilver, 3),
                    'source' => 'vouchers_settlement',
                ];
            }
        }

        // Include Accounts Master balances for accounts that do not have voucher rows
        foreach ($accRows as $a) {
            $aid = (int)$a['id'];
            if (isset($accountsWithVouchers[$aid])) continue;
            $balInr = (float)$a['balance_inr'];
            $balGold = (float)$a['balance_fine_gold'];
            $balSilver = (float)$a['balance_fine_silver'];
            if (abs($balInr) < 0.0001 && abs($balGold) < 0.0001 && abs($balSilver) < 0.0001) continue;

            $opDate = $a['created_date'] && $a['created_date'] <= $asOnDate ? $a['created_date'] : $asOnDate;
            $key = $ensureParty($a['name'], $aid, (int)$a['group_id'], trim($a['city'] ?? ''));
            if (!$key) continue;

            if (abs($balInr) > 0.0001) {
                $parties[$key]['cash_entries'][] = ['date' => $opDate, 'amount' => $balInr];
            }
            if (abs($balGold) > 0.0001) {
                $parties[$key]['gold_entries'][] = ['date' => $opDate, 'amount' => $balGold];
            }
            if (abs($balSilver) > 0.0001) {
                $parties[$key]['silver_entries'][] = ['date' => $opDate, 'amount' => $balSilver];
            }
            $parties[$key]['ledger'][] = [
                'date' => $opDate,
                'voucher_no' => 'OPENING',
                'voucher_type' => 'OPENING',
                'particulars' => 'Opening / Master Balance',
                'debit' => $balInr > 0 ? round($balInr, 2) : 0.0,
                'credit' => $balInr < 0 ? round(abs($balInr), 2) : 0.0,
                'gold_delta' => round($balGold, 3),
                'silver_delta' => round($balSilver, 3),
                'source' => 'accounts',
            ];
        }

        // 5. Daily Transactions
        $dtStmt = $db->prepare("
            SELECT id, transaction_date, transaction_type, party_name, ref_no, narration,
                   group_name, site, gold_fine, silver_fine, total_amount
            FROM daily_transactions
            WHERE transaction_date <= :as_on
            ORDER BY transaction_date ASC, id ASC
        ");
        $dtStmt->execute(['as_on' => $asOnDate]);
        $dtRows = $dtStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($dtRows as $dt) {
            $gid = self::matchGroupIdByName($dt['group_name'] ?? '', $groupNameToId);
            $key = $ensureParty($dt['party_name'] ?? '', null, $gid, '', trim($dt['site'] ?? ''));
            if (!$key) continue;

            $tType = strtolower(trim($dt['transaction_type'] ?? ''));
            $amt = (float)$dt['total_amount'];
            $gold = (float)$dt['gold_fine'];
            $silver = (float)$dt['silver_fine'];

            // Sign convention for metal in daily_transactions:
            // Payment/Purchase/Receive reduce receivable (negative), Sale/Receipt/Issue/Journal/Contra as stored
            $isOutflowOrCredit = in_array($tType, ['payment', 'purchase', 'receive', 'sale return']);
            $metalSign = $isOutflowOrCredit ? -1 : 1;

            // Note: in daily_transactions, Payment/Purchase already have negative total_amount
            $cashDelta = $amt;
            $goldDelta = $metalSign * abs($gold);
            $silverDelta = $metalSign * abs($silver);

            if (abs($cashDelta) > 0.0001) {
                $parties[$key]['cash_entries'][] = ['date' => $dt['transaction_date'], 'amount' => $cashDelta];
            }
            if (abs($goldDelta) > 0.0001) {
                $parties[$key]['gold_entries'][] = ['date' => $dt['transaction_date'], 'amount' => $goldDelta];
            }
            if (abs($silverDelta) > 0.0001) {
                $parties[$key]['silver_entries'][] = ['date' => $dt['transaction_date'], 'amount' => $silverDelta];
            }

            $parties[$key]['ledger'][] = [
                'date' => $dt['transaction_date'],
                'voucher_no' => $dt['ref_no'] ?: ('DT-' . $dt['id']),
                'voucher_type' => strtoupper($dt['transaction_type'] ?? 'TXN'),
                'particulars' => $dt['narration'] ?: ($dt['transaction_type'] . ' (' . ($dt['site'] ?: 'Main') . ')'),
                'debit' => $cashDelta > 0 ? round($cashDelta, 2) : 0.0,
                'credit' => $cashDelta < 0 ? round(abs($cashDelta), 2) : 0.0,
                'gold_delta' => round($goldDelta, 3),
                'silver_delta' => round($silverDelta, 3),
                'source' => 'daily_transactions',
            ];
        }

        // 6. Sale Register (exclude deleted / inactive)
        $srStmt = $db->prepare("
            SELECT id, voucher_no, voucher_date, voucher_type, party_name, account_group,
                   branch_name, particular, gold_weight, silver_weight, amount, sale_value, sale_return_value
            FROM sale_register
            WHERE deleted_at IS NULL AND is_active = 1 AND voucher_date <= :as_on
            ORDER BY voucher_date ASC, id ASC
        ");
        $srStmt->execute(['as_on' => $asOnDate]);
        $srRows = $srStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($srRows as $sr) {
            $gid = self::matchGroupIdByName($sr['account_group'] ?? 'Sundry Debtors', $groupNameToId);
            $key = $ensureParty($sr['party_name'] ?? '', null, $gid, '', trim($sr['branch_name'] ?? ''));
            if (!$key) continue;

            $netAmt = (float)$sr['amount'];
            if (abs($netAmt) < 0.0001) {
                $netAmt = (float)$sr['sale_value'] - (float)$sr['sale_return_value'];
            }
            $gold = (float)$sr['gold_weight'];
            $silver = (float)$sr['silver_weight'];

            if (abs($netAmt) > 0.0001) {
                $parties[$key]['cash_entries'][] = ['date' => $sr['voucher_date'], 'amount' => $netAmt];
            }
            if (abs($gold) > 0.0001) {
                $parties[$key]['gold_entries'][] = ['date' => $sr['voucher_date'], 'amount' => $gold];
            }
            if (abs($silver) > 0.0001) {
                $parties[$key]['silver_entries'][] = ['date' => $sr['voucher_date'], 'amount' => $silver];
            }

            $parties[$key]['ledger'][] = [
                'date' => $sr['voucher_date'],
                'voucher_no' => $sr['voucher_no'],
                'voucher_type' => strtoupper($sr['voucher_type'] ?: 'SALE'),
                'particulars' => $sr['particular'] ?: 'Sale Register Entry',
                'debit' => $netAmt > 0 ? round($netAmt, 2) : 0.0,
                'credit' => $netAmt < 0 ? round(abs($netAmt), 2) : 0.0,
                'gold_delta' => round($gold, 3),
                'silver_delta' => round($silver, 3),
                'source' => 'sale_register',
            ];
        }

        // 7. Purchase Register (exclude deleted / cancelled / inactive)
        $prStmt = $db->prepare("
            SELECT id, voucher_no, voucher_date, voucher_type, party_name, account_group,
                   branch_name, particular, gold_weight, silver_weight, amount, purchase_value, purchase_return_value
            FROM purchase_register
            WHERE deleted_at IS NULL AND is_cancelled = 0 AND is_active = 1 AND voucher_date <= :as_on
            ORDER BY voucher_date ASC, id ASC
        ");
        $prStmt->execute(['as_on' => $asOnDate]);
        $prRows = $prStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($prRows as $pr) {
            $gid = self::matchGroupIdByName($pr['account_group'] ?? 'Sundry Creditors', $groupNameToId);
            $key = $ensureParty($pr['party_name'] ?? '', null, $gid, '', trim($pr['branch_name'] ?? ''));
            if (!$key) continue;

            $netAmt = (float)$pr['amount'];
            if (abs($netAmt) < 0.0001) {
                $netAmt = (float)$pr['purchase_value'] - (float)$pr['purchase_return_value'];
            }
            $cashDelta = -$netAmt;
            $goldDelta = -(float)$pr['gold_weight'];
            $silverDelta = -(float)$pr['silver_weight'];

            if (abs($cashDelta) > 0.0001) {
                $parties[$key]['cash_entries'][] = ['date' => $pr['voucher_date'], 'amount' => $cashDelta];
            }
            if (abs($goldDelta) > 0.0001) {
                $parties[$key]['gold_entries'][] = ['date' => $pr['voucher_date'], 'amount' => $goldDelta];
            }
            if (abs($silverDelta) > 0.0001) {
                $parties[$key]['silver_entries'][] = ['date' => $pr['voucher_date'], 'amount' => $silverDelta];
            }

            $parties[$key]['ledger'][] = [
                'date' => $pr['voucher_date'],
                'voucher_no' => $pr['voucher_no'],
                'voucher_type' => strtoupper($pr['voucher_type'] ?: 'PURCHASE'),
                'particulars' => $pr['particular'] ?: 'Purchase Register Entry',
                'debit' => $cashDelta > 0 ? round($cashDelta, 2) : 0.0,
                'credit' => $cashDelta < 0 ? round(abs($cashDelta), 2) : 0.0,
                'gold_delta' => round($goldDelta, 3),
                'silver_delta' => round($silverDelta, 3),
                'source' => 'purchase_register',
            ];
        }

        return $parties;
    }

    /**
     * Filter parties and compute FIFO ageing buckets + totals across ALL matching records.
     */
    public static function getReport(array $filters): array {
        $asOnDate = self::normalizeDate($filters['as_on_date'] ?? null) ?? date('Y-m-d');
        $interval = max(1, (int)($filters['interval'] ?? 15));
        $balanceType = strtolower(trim($filters['balance_type'] ?? 'gold'));
        if (!in_array($balanceType, ['gold', 'silver'])) {
            $balanceType = 'gold';
        }

        // Parse group_ids (comma-separated or array)
        $groupIds = [];
        if (!empty($filters['group_ids'])) {
            $raw = is_array($filters['group_ids'])
                ? $filters['group_ids']
                : explode(',', (string)$filters['group_ids']);
            foreach ($raw as $id) {
                $intId = (int)trim((string)$id);
                if ($intId > 0) $groupIds[] = $intId;
            }
        }

        $cityFilter = isset($filters['city']) && $filters['city'] !== 'all' && $filters['city'] !== 'ALL'
            ? strtolower(trim($filters['city'])) : '';
        $locFilter = isset($filters['location']) && $filters['location'] !== 'all' && $filters['location'] !== 'ALL'
            ? strtolower(trim($filters['location'])) : '';
        $refFilter = isset($filters['ref_by']) && $filters['ref_by'] !== 'all' && $filters['ref_by'] !== 'ALL'
            ? strtolower(trim($filters['ref_by'])) : '';
        $search = isset($filters['search']) ? strtolower(trim($filters['search'])) : '';

        $parties = self::buildUnifiedPartyData($asOnDate);

        $rows = [];
        $totals = [
            'cash' => ['current' => 0.0, 'bucket_1' => 0.0, 'bucket_2' => 0.0, 'bucket_3' => 0.0, 'old' => 0.0, 'total' => 0.0],
            'gold' => ['current' => 0.0, 'bucket_1' => 0.0, 'bucket_2' => 0.0, 'bucket_3' => 0.0, 'old' => 0.0, 'total' => 0.0],
            'silver' => ['current' => 0.0, 'bucket_1' => 0.0, 'bucket_2' => 0.0, 'bucket_3' => 0.0, 'old' => 0.0, 'total' => 0.0],
        ];

        foreach ($parties as $p) {
            // Skip parties with zero transactions and zero balances
            if (empty($p['cash_entries']) && empty($p['gold_entries']) && empty($p['silver_entries'])) {
                continue;
            }

            // Group filter
            if (!empty($groupIds)) {
                if (!$p['group_id'] || !in_array((int)$p['group_id'], $groupIds, true)) {
                    continue;
                }
            }

            // City filter
            if ($cityFilter !== '' && strtolower($p['city']) !== $cityFilter) {
                continue;
            }

            // Location filter
            if ($locFilter !== '' && strtolower($p['location']) !== $locFilter) {
                continue;
            }

            // Ref By filter
            if ($refFilter !== '' && strtolower($p['ref_by']) !== $refFilter) {
                continue;
            }

            // Search by Account Name or City
            if ($search !== '') {
                $matchName = str_contains(strtolower($p['account_name']), $search);
                $matchCity = str_contains(strtolower($p['city']), $search);
                if (!$matchName && !$matchCity) {
                    continue;
                }
            }

            $cashBuckets = self::computeFifoBuckets($p['cash_entries'], $asOnDate, $interval);
            $goldBuckets = self::computeFifoBuckets($p['gold_entries'], $asOnDate, $interval);
            $silverBuckets = self::computeFifoBuckets($p['silver_entries'], $asOnDate, $interval);

            // Accumulate totals across ALL matching records
            foreach (['current', 'bucket_1', 'bucket_2', 'bucket_3', 'old', 'total'] as $bk) {
                $totals['cash'][$bk] += $cashBuckets[$bk];
                $totals['gold'][$bk] += $goldBuckets[$bk];
                $totals['silver'][$bk] += $silverBuckets[$bk];
            }

            $rows[] = [
                'party_key' => $p['party_key'],
                'account_id' => $p['account_id'],
                'account_name' => $p['account_name'],
                'city' => $p['city'] ?: '-',
                'location' => $p['location'] ?: '-',
                'ref_by' => $p['ref_by'] ?: '-',
                'group_id' => $p['group_id'],
                'group_name' => $p['group_name'] ?: '-',
                'cash' => $cashBuckets,
                'gold' => $goldBuckets,
                'silver' => $silverBuckets,
            ];
        }

        // Round totals
        foreach (['cash', 'gold', 'silver'] as $sec) {
            foreach ($totals[$sec] as $bk => $val) {
                $totals[$sec][$bk] = round($val, $sec === 'cash' ? 2 : 3);
            }
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'account_name';
        $sortOrder = strtolower($filters['sort_order'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        usort($rows, function($a, $b) use ($sortBy, $sortOrder, $balanceType) {
            $valA = $a['account_name'];
            $valB = $b['account_name'];

            if ($sortBy === 'city') {
                $valA = $a['city'];
                $valB = $b['city'];
            } elseif (str_starts_with($sortBy, 'cash_')) {
                $k = substr($sortBy, 5);
                $valA = $a['cash'][$k] ?? 0;
                $valB = $b['cash'][$k] ?? 0;
            } elseif (str_starts_with($sortBy, 'metal_')) {
                $k = substr($sortBy, 6);
                $valA = $a[$balanceType][$k] ?? 0;
                $valB = $b[$balanceType][$k] ?? 0;
            }

            if (is_numeric($valA) && is_numeric($valB)) {
                $cmp = $valA <=> $valB;
            } else {
                $cmp = strcasecmp((string)$valA, (string)$valB);
            }
            return $sortOrder === 'desc' ? -$cmp : $cmp;
        });

        $total = count($rows);
        $page = max(1, (int)($filters['page'] ?? 1));
        $limit = max(1, min(100, (int)($filters['limit'] ?? 25)));
        $totalPages = max(1, (int)ceil($total / $limit));
        $offset = ($page - 1) * $limit;
        $pagedItems = array_slice($rows, $offset, $limit);

        return [
            'items' => $pagedItems,
            'all_items_count' => $total,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => $totalPages,
            'as_on_date' => $asOnDate,
            'interval' => $interval,
            'balance_type' => $balanceType,
            'bucket_labels' => [
                'current' => 'Current Balance',
                'bucket_1' => $interval . ' Days',
                'bucket_2' => $interval . '–' . ($interval * 2) . ' Days',
                'bucket_3' => ($interval * 2) . '–' . ($interval * 3) . ' Days',
                'old' => 'Old Balance (>' . ($interval * 3) . 'd)',
            ],
            'totals' => $totals,
        ];
    }

    /**
     * Export all matching rows without pagination.
     */
    public static function exportReport(array $filters): array {
        $filters['page'] = 1;
        $filters['limit'] = 100000;
        // Override limit cap by temporarily calling getReport logic or slicing
        $asOnDate = self::normalizeDate($filters['as_on_date'] ?? null) ?? date('Y-m-d');
        $interval = max(1, (int)($filters['interval'] ?? 15));
        $res = self::getReport(array_merge($filters, ['page' => 1, 'limit' => 100]));
        if ($res['total'] <= 100) {
            return $res;
        }
        // If > 100 rows, collect all pages
        $all = $res['items'];
        for ($p = 2; $p <= $res['total_pages']; $p++) {
            $next = self::getReport(array_merge($filters, ['page' => $p, 'limit' => 100]));
            $all = array_merge($all, $next['items']);
        }
        $res['items'] = $all;
        return $res;
    }

    /**
     * Screen 3: Detailed Party Ledger for a clicked Account Name up to As On Date.
     */
    public static function getPartyLedger(string $partyKey, ?string $asOnDate = null): array {
        $asOn = self::normalizeDate($asOnDate) ?? date('Y-m-d');
        $parties = self::buildUnifiedPartyData($asOn);
        $lookup = strtolower(trim($partyKey));

        if (!isset($parties[$lookup])) {
            return [
                'found' => false,
                'account_name' => $partyKey,
                'city' => '-',
                'group_name' => '-',
                'as_on_date' => $asOn,
                'entries' => [],
                'closing' => [
                    'debit' => 0.0,
                    'credit' => 0.0,
                    'outstanding_amount' => 0.0,
                    'gold_balance' => 0.0,
                    'silver_balance' => 0.0,
                ],
            ];
        }

        $p = $parties[$lookup];
        $entries = $p['ledger'];
        usort($entries, fn($a, $b) => strcmp($a['date'], $b['date']));

        $runningCash = 0.0;
        $runningGold = 0.0;
        $runningSilver = 0.0;
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        $formatted = [];
        foreach ($entries as $e) {
            $debit = (float)$e['debit'];
            $credit = (float)$e['credit'];
            $totalDebit += $debit;
            $totalCredit += $credit;
            $runningCash += ($debit - $credit);
            $runningGold += (float)$e['gold_delta'];
            $runningSilver += (float)$e['silver_delta'];

            $formatted[] = [
                'transaction_date' => $e['date'],
                'voucher_no' => $e['voucher_no'],
                'voucher_type' => $e['voucher_type'],
                'particulars' => $e['particulars'],
                'debit' => round($debit, 2),
                'credit' => round($credit, 2),
                'gold_balance' => round($runningGold, 3),
                'silver_balance' => round($runningSilver, 3),
                'outstanding_amount' => round($runningCash, 2),
            ];
        }

        return [
            'found' => true,
            'account_name' => $p['account_name'],
            'city' => $p['city'] ?: '-',
            'location' => $p['location'] ?: '-',
            'ref_by' => $p['ref_by'] ?: '-',
            'group_name' => $p['group_name'] ?: '-',
            'as_on_date' => $asOn,
            'entries' => $formatted,
            'closing' => [
                'debit' => round($totalDebit, 2),
                'credit' => round($totalCredit, 2),
                'outstanding_amount' => round($runningCash, 2),
                'gold_balance' => round($runningGold, 3),
                'silver_balance' => round($runningSilver, 3),
            ],
        ];
    }
}
