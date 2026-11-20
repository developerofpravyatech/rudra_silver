<?php
namespace Config;

class Config {
    private static array $env = [];
    private static bool $loaded = false;

    public static function load(string $path = __DIR__ . '/../.env'): void {
        if (self::$loaded) return;

        if (file_exists($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, '#')) continue;

                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $val = trim($parts[1]);
                    // Strip optional quotes
                    if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                        (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                        $val = substr($val, 1, -1);
                    }
                    self::$env[$key] = $val;
                    if (!isset($_ENV[$key])) {
                        $_ENV[$key] = $val;
                    }
                }
            }
        }
        self::$loaded = true;
    }

    public static function get(string $key, mixed $default = null): mixed {
        if (!self::$loaded) {
            self::load();
        }
        return self::$env[$key] ?? $_ENV[$key] ?? getenv($key) ?: $default;
    }
}
