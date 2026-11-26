p = r"D:\xampp\htdocs\Rudra-silver\backend\controllers\DailyBalanceController.php"
s = open(p).read()

old = """        foreach ($numericFields as $field => $maxDecimals) {
            if (array_key_exists($field, $body) && $body[$field] !== null && $body[$field] !== '') {
                $val = trim((string)$body[$field]);
                if (!is_numeric($val)) {
                    $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' must be a valid number.';
                    continue;
                }
                $num = (float)$val;
                if (str_contains($val, '.')) {
                    $decimalPart = substr($val, strpos($val, '.') + 1);
                    if (strlen($decimalPart) > $maxDecimals) {
                        $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . " cannot exceed {$maxDecimals} decimal places.";
                    }
                }
            }
        }"""
new = """        foreach (array_keys($numericFields) as $field) {
            if (array_key_exists($field, $body) && $body[$field] !== null && $body[$field] !== '') {
                $val = trim((string)$body[$field]);
                if (!is_numeric($val)) {
                    $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' must be a valid number.';
                }
            }
        }"""
assert old in s
s = s.replace(old, new, 1)
open(p, "w").write(s)
print("done")
PY