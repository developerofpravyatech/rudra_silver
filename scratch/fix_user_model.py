p = r"D:\xampp\htdocs\Rudra-silver\backend\models\User.php"
s = open(p).read()

# update(): add email handling after mobile block
old_mobile = """        if (isset($data['mobile'])) {
            $fields[] = 'mobile = :mobile';
            $params['mobile'] = $data['mobile'];
        }"""
new_mobile = """        if (isset($data['mobile'])) {
            $fields[] = 'mobile = :mobile';
            $params['mobile'] = $data['mobile'];
        }
        if (isset($data['email'])) {
            $fields[] = 'email = :email';
            $params['email'] = $data['email'] ? strtolower(trim($data['email'])) : null;
        }"""
assert old_mobile in s
s = s.replace(old_mobile, new_mobile, 1)

# paginate SELECT include email
s = s.replace(
    "        $dataSql = \"SELECT id, name, mobile, role, is_active, created_at FROM users {$whereSql} ORDER BY id DESC LIMIT :limit OFFSET :offset\";",
    "        $dataSql = \"SELECT id, name, mobile, email, role, is_active, created_at FROM users {$whereSql} ORDER BY id DESC LIMIT :limit OFFSET :offset\";",
    1
)

# paginate search include email
old_search = """        if ($search !== null && trim($search) !== '') {
            $where[] = '(name LIKE :search1 OR mobile LIKE :search2)';
            $params['search1'] = '%' . trim($search) . '%';
            $params['search2'] = '%' . trim($search) . '%';
        }"""
new_search = """        if ($search !== null && trim($search) !== '') {
            $where[] = '(name LIKE :search1 OR mobile LIKE :search2 OR email LIKE :search3)';
            $params['search1'] = '%' . trim($search) . '%';
            $params['search2'] = '%' . trim($search) . '%';
            $params['search3'] = '%' . trim($search) . '%';
        }"""
assert old_search in s
s = s.replace(old_search, new_search, 1)

open(p, "w").write(s)
print("done")
PY