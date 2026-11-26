<?php
require __DIR__ . '/../backend/config/Config.php';
require __DIR__ . '/../backend/config/Database.php';
spl_autoload_register(function ($class) {
    $f = __DIR__ . '/../backend/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($f)) require_once $f;
});
$r = new \Routes\Router();
$r->get('/test', [\Controllers\KarigarController::class, 'nextCode']);
echo "OK\n";