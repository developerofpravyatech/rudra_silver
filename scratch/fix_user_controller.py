p = r"D:\xampp\htdocs\Rudra-silver\backend\controllers\UserController.php"
s = open(p).read()

# createUser: add email extraction after mobile
old_create = """        $name     = trim($body['name'] ?? '');
        $rawMobile= $body['mobile'] ?? '';
        $password = $body['password'] ?? '';
        $role     = strtoupper(trim($body['role'] ?? 'STAFF'));

        $cleanMobile = Validator::cleanMobileNumber($rawMobile);
        if (strlen($cleanMobile) < 10) {
            Response::error('Valid 10-digit mobile number required', 400);
        }

        if (empty($name)) {
            Response::error('Full name is required', 400);
        }

        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters', 400);
        }

        if (User::findByMobile($cleanMobile)) {
            Response::error('Mobile number is already registered', 400);
        }"""
new_create = """        $name     = trim($body['name'] ?? '');
        $rawMobile= $body['mobile'] ?? '';
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $role     = strtoupper(trim($body['role'] ?? 'STAFF'));

        $cleanMobile = Validator::cleanMobileNumber($rawMobile);
        if (strlen($cleanMobile) < 10) {
            Response::error('Valid 10-digit mobile number required', 400);
        }

        if (empty($name)) {
            Response::error('Full name is required', 400);
        }

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Valid email address is required', 400);
        }

        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters', 400);
        }

        if (User::findByMobile($cleanMobile)) {
            Response::error('Mobile number is already registered', 400);
        }

        if (User::findByEmail($email)) {
            Response::error('Email address is already registered', 400);
        }"""
assert old_create in s
s = s.replace(old_create, new_create, 1)

# createUser call User::create add email param
s = s.replace(
    "        $user = User::create($name, $cleanMobile, $hashedPassword, $role);",
    "        $user = User::create($name, $cleanMobile, $hashedPassword, $role, $email);",
    1
)

# updateUser: add email handling after mobile block
old_update = """        if (isset($body['mobile'])) {
            $cleanMobile = Validator::cleanMobileNumber($body['mobile']);
            if (strlen($cleanMobile) >= 10) {
                $existing = User::findByMobile($cleanMobile);
                if ($existing && $existing['id'] !== $id) {
                    Response::error('Mobile number already in use by another user', 400);
                }
                $updateData['mobile'] = $cleanMobile;
            }
        }"""
new_update = """        if (isset($body['mobile'])) {
            $cleanMobile = Validator::cleanMobileNumber($body['mobile']);
            if (strlen($cleanMobile) >= 10) {
                $existing = User::findByMobile($cleanMobile);
                if ($existing && $existing['id'] !== $id) {
                    Response::error('Mobile number already in use by another user', 400);
                }
                $updateData['mobile'] = $cleanMobile;
            }
        }

        if (isset($body['email'])) {
            $email = trim($body['email']);
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Response::error('Valid email address is required', 400);
            }
            $existing = User::findByEmail($email);
            if ($existing && $existing['id'] !== $id) {
                Response::error('Email address already in use by another user', 400);
            }
            $updateData['email'] = $email;
        }"""
assert old_update in s
s = s.replace(old_update, new_update, 1)

open(p, "w").write(s)
print("done")
PY