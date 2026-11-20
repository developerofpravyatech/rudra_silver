<?php
namespace Controllers;

use Helpers\Response;
use Models\InventoryTag;

class TagController {
    public static function lookupTag(string $identifier): void {
        $tag = InventoryTag::lookup($identifier);
        if (!$tag) {
            Response::error("Tag '{$identifier}' not found", 404);
        }
        Response::json($tag);
    }
}
