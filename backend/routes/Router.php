<?php
namespace Routes;

use Helpers\Response;

class Router {
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void {
        $this->routes[] = [
            'method'  => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler
        ];
    }

    public function get(string $pattern, callable $handler): void {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void {
        $this->add('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void {
        $this->add('PUT', $pattern, $handler);
    }

    public function patch(string $pattern, callable $handler): void {
        $this->add('PATCH', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void {
        $this->add('DELETE', $pattern, $handler);
    }

    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Normalize URI: strip base directory prefix if hosted under a subdirectory in Apache
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        $baseDir = dirname($scriptName);
        if ($baseDir !== '/' && $baseDir !== '\\' && str_starts_with($uri, $baseDir)) {
            $uri = substr($uri, strlen($baseDir));
        }

        $uri = '/' . trim($uri, '/');
        // Ensure empty root is '/'
        if ($uri === '//') $uri = '/';

        // Root health check endpoint
        if (($uri === '/' || $uri === '/api' || $uri === '/api/v1') && $method === 'GET') {
            Response::json([
                'status'   => 'online',
                'service'  => 'Rudra Silver Jewellery ERP (Core PHP 8.2+ REST API)',
                'database' => 'MySQL 8+ (rudra_silver)',
                'docs_url' => '/api/v1/docs'
            ]);
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            // Convert route pattern with {param} into regex
            $patternRegex = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $route['pattern']);
            $patternRegex = '#^' . $patternRegex . '$#';

            if (preg_match($patternRegex, $uri, $matches)) {
                $params = [];
                foreach ($matches as $key => $val) {
                    if (is_string($key)) {
                        $params[$key] = is_numeric($val) ? (int)$val : $val;
                    }
                }
                call_user_func_array($route['handler'], array_values($params));
                return;
            }
        }

        Response::error("Endpoint '{$method} {$uri}' not found", 404);
    }
}
