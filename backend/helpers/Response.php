<?php
namespace Helpers;

class Response {
    public static function json(mixed $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $statusCode = 400, mixed $extra = null): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        $payload = [
            'detail'  => $message,
            'message' => $message,
            'success' => false
        ];
        if ($extra !== null) {
            if (is_array($extra)) {
                $payload = array_merge($payload, $extra);
            } else {
                $payload['errors'] = $extra;
            }
        }
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(string $message = 'Success', array $extra = []): void {
        self::json(array_merge([
            'success' => true,
            'message' => $message
        ], $extra));
    }
}
