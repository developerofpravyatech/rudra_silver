p = r"D:\xampp\htdocs\Rudra-silver\backend\controllers\KarigarController.php"
s = open(p, encoding='utf-8').read()

# add nextCode method before filterOptions
needle = "    public static function filterOptions(): void {"
addition = '''    public static function nextCode(): void {
        try {
            $db = \\Config\\Database::getConnection();
            $stmt = $db->query("SELECT MAX(CAST(SUBSTRING(karigar_code, 2) AS UNSIGNED)) AS max_code FROM karigars WHERE karigar_code REGEXP '^K[0-9]+$'");
            $max = (int)$stmt->fetchColumn();
            $next = 'K' . str_pad($max + 1, 3, '0', STR_PAD_LEFT);
            Response::json(['next_code' => $next]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function export(): void {
        try {
            $result = Karigar::paginate(['search' => $_GET['search'] ?? null], 1, 10000);
            Response::json($result['items']);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function toggleStatus(?int $id = null): void {
        try {
            $kid = $id ?: (int)($_GET['id'] ?? 0);
            $body = Validator::getJsonBody();
            $kid = $kid ?: (int)($body['id'] ?? 0);
            if ($kid <= 0) Response::error('A valid Karigar ID is required.', 400);
            $existing = Karigar::findById($kid);
            if (!$existing) Response::error("Karigar #{$kid} not found.", 404);
            $newStatus = $existing['status'] === 'Active' ? 'Inactive' : 'Active';
            $updated = Karigar::update($kid, ['status' => $newStatus]);
            Response::json($updated);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

'''
s = s.replace(needle, addition + needle, 1)
open(p, "w", encoding='utf-8').write(s)
print("done")
PY