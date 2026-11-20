<?php
namespace Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $connection = null;

    public static function getConnection(): PDO {
        if (self::$connection === null) {
            Config::load();
            
            $host = Config::get('DB_HOST', '127.0.0.1');
            $port = Config::get('DB_PORT', '3306');
            $db   = Config::get('DB_DATABASE', 'rudra_silver');
            $user = Config::get('DB_USERNAME', 'root');
            $pass = Config::get('DB_PASSWORD', '');

            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$connection = new PDO($dsn, $user, $pass, $options);
                self::$connection->exec("SET time_zone = '+05:30'");
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'detail' => 'Database connection failed: ' . $e->getMessage()
                ]);
                exit;
            }
        }

        return self::$connection;
    }
}
