<?php
$url = 'http://localhost/Rudra-silver/backend/api/silver-bullion?from_date=2026-11-01&to_date=2026-11-24';
$ctx = stream_context_create(['http' => ['ignore_errors' => true]]);
$resp = file_get_contents($url, false, $ctx);
echo "Response for $url:\n";
echo substr($resp, 0, 500) . "\n";
