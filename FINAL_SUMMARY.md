# Stock List Not Showing - Root Cause and Fix

## Root Cause
`backend/controllers/StockStatusController.php:23-30` - Parameter mapping error in `StockStatus::paginate()` call. The `limit` value was being used as `$itemNameFilter`, adding `item_name LIKE '%10%'` to WHERE clause → empty items array.

## Fix
Pass parameters in correct positions within the model's 17-parameter signature, with `null` for unsent filter parameters.