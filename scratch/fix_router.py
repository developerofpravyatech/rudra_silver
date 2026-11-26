p = r"D:\xampp\htdocs\Rudra-silver\backend\routes\Router.php"
s = open(p, encoding='utf-8').read()
s = s.replace("public function put(string $pattern, callable $handler): void {", "public function put(string $pattern, mixed $handler): void {")
s = s.replace("public function patch(string $pattern, callable $handler): void {", "public function patch(string $pattern, mixed $handler): void {")
s = s.replace("public function delete(string $pattern, callable $handler): void {", "public function delete(string $pattern, mixed $handler): void {")
open(p, "w", encoding='utf-8').write(s)
print("done")
PY