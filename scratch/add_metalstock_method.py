p = r"D:\xampp\htdocs\Rudra-silver\backend\models\MetalStock.php"
s = open(p).read()

method = '''
    /**
     * Get distinct item names from metal_stock
     */
    public static function getDistinctItemNames(): array {
        $db = \\Config\\Database::getConnection();
        $stmt = $db->query("SELECT DISTINCT item_name FROM metal_stock WHERE item_name IS NOT NULL AND TRIM(item_name) <> '' ORDER BY item_name ASC");
        $rows = $stmt->fetchAll(\\PDO::FETCH_COLUMN);
        return $rows ?: [];
    }
'''

idx = s.rfind("}")
s = s[:idx] + method + "\n" + s[idx:]
open(p, "w").write(s)
print("done")
