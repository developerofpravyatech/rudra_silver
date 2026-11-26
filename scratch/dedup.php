<?php
$lines = file(__DIR__ . '/../backend/models/KarigarReceive.php');
$out = array_merge(
    array_slice($lines, 0, 264),
    array_slice($lines, 413, 57),
    array_slice($lines, 619)
);
file_put_contents(__DIR__ . '/../backend/models/KarigarReceive.php', implode('', $out));
echo "Lines now: " . count($out) . "\n";
