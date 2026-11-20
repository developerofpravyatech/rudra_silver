<?php
namespace Helpers;

class Validator {
    public static function cleanMobileNumber(string $mobile): string {
        $digits = preg_replace('/\D/', '', $mobile);
        if (strlen($digits) > 10 && str_starts_with($digits, '91')) {
            $digits = substr($digits, 2);
        }
        return strlen($digits) >= 10 ? substr($digits, -10) : $digits;
    }

    public static function sanitize(mixed $val): mixed {
        if (is_string($val)) {
            return htmlspecialchars(trim($val), ENT_QUOTES, 'UTF-8');
        }
        return $val;
    }

    public static function getJsonBody(): array {
        $raw = file_get_contents('php://input');
        if (empty($raw)) return [];
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
