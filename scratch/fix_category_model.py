p = r"D:\xampp\htdocs\Rudra-silver\backend\models\Category.php"
s = open(p).read()

# create: metal type validation
old_create = """        // 1. Metal Type validation
        $metalType = strtoupper(trim($data['metal_type'] ?? ''));
        if ($metalType === '') {
            throw new Exception('Metal Type is required.');
        }
        if (!in_array($metalType, self::METAL_TYPES, true)) {
            throw new Exception("Invalid Metal Type '{$metalType}'. Allowed values: " . implode(', ', self::METAL_TYPES));
        }"""
new_create = """        // 1. Metal Type validation
        $metalType = trim($data['metal_type'] ?? '');
        if ($metalType === '') {
            throw new Exception('Metal Type is required.');
        }"""
assert old_create in s
s = s.replace(old_create, new_create, 1)

# update: metal type update
old_update = """        // 1. Metal Type update
        if (isset($data['metal_type'])) {
            $metalType = strtoupper(trim($data['metal_type']));
            if ($metalType === '') {
                throw new Exception('Metal Type cannot be empty.');
            }
            if (!in_array($metalType, self::METAL_TYPES, true)) {
                throw new Exception("Invalid Metal Type '{$metalType}'. Allowed values: " . implode(', ', self::METAL_TYPES));
            }
            $updates[] = 'metal_type = :metal_type';
            $params['metal_type'] = $metalType;
        }"""
new_update = """        // 1. Metal Type update
        if (isset($data['metal_type'])) {
            $metalType = trim($data['metal_type']);
            if ($metalType === '') {
                throw new Exception('Metal Type cannot be empty.');
            }
            $updates[] = 'metal_type = :metal_type';
            $params['metal_type'] = $metalType;
        }"""
assert old_update in s
s = s.replace(old_update, new_update, 1)

open(p, "w").write(s)
print("done")
PY