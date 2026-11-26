<?php
require __DIR__ . '/../backend/config/Config.php';
require __DIR__ . '/../backend/config/Database.php';
require __DIR__ . '/../backend/helpers/Validator.php';
require __DIR__ . '/../backend/models/User.php';
require __DIR__ . '/../backend/helpers/JWT.php';
require __DIR__ . '/../backend/helpers/Response.php';

try {
    $body = ['email' => 'admin@rudrasilver.com', 'password' => 'admin123'];
    $credential = trim($body['email']);
    $password = $body['password'];
    $user = \Models\User::findByEmail($credential);
    var_dump($user ? $user['id'] : null);
    if ($user) {
        var_dump(password_verify($password, $user['hashed_password']));
    }
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}