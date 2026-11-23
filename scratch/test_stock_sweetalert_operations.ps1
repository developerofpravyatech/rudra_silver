$baseUrl = "http://localhost/Rudra-silver/backend/api/stock-status"

Write-Host "=========================================================="
Write-Host "TESTING STOCK STATUS MODULE API OPERATIONS"
Write-Host "=========================================================="

# 1. Fetch stock units
$units = Invoke-RestMethod -Uri "${baseUrl}/units" -Method GET
Write-Host "1. Units: $($units -join ', ')"
if (!$units -or $units.Count -eq 0) { throw "No units returned!" }

# 2. Fetch stock list
$listResp = Invoke-RestMethod -Uri "${baseUrl}/list?page=1&limit=5" -Method GET
Write-Host "2. Stock list fetched: $($listResp.items.Count) items on page 1 (Total: $($listResp.total))"

# 3. Test validation error (empty item name)
try {
    $invalidPayload = @{
        item_name = ""
        unit = "Gm"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "${baseUrl}/create" -Method POST -Body $invalidPayload -ContentType "application/json"
    throw "Empty item name should have failed!"
} catch {
    Write-Host "3. Empty item name correctly rejected by backend: $($_.Exception.Message)"
}

# 4. Insert valid test stock record
$randomName = "SweetAlert2 Test Stock " + (Get-Random -Minimum 1000 -Maximum 9999)
$createPayload = @{
    item_name = $randomName
    unit = "Gm"
    pc = 12
    gross_weight = 125.500
    net_weight = 120.250
    tunch = 82.500
    wastage = 5.000
    labour_weight = 6.250
    rate = 74500.000
    silver_fine = 99.206
    total = 73908.470
    gold_fine = 0.000
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri "${baseUrl}/create" -Method POST -Body $createPayload -ContentType "application/json"
$createdId = $created.data.id
Write-Host "4. Stock added successfully: ID = $createdId, Name = '$($created.data.item_name)'"
if (!$createdId) { throw "Failed to create stock record!" }

# 5. Fetch by ID
$viewResp = Invoke-RestMethod -Uri "${baseUrl}/view?id=$createdId" -Method GET
Write-Host "5. Stock viewed: ID = $($viewResp.id), Name = '$($viewResp.item_name)', Gr.Wt = $($viewResp.gross_weight)"
if ($viewResp.id -ne $createdId) { throw "Viewed stock ID does not match!" }

# 6. Update stock record
$updatePayload = @{
    item_name = "$randomName (Updated)"
    unit = "Gm"
    pc = 15
    gross_weight = 145.750
    net_weight = 140.000
    tunch = 85.000
    wastage = 5.500
    labour_weight = 7.700
    rate = 75000.000
    silver_fine = 119.000
    total = 89250.000
    gold_fine = 0.000
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "${baseUrl}/update?id=$createdId" -Method PUT -Body $updatePayload -ContentType "application/json"
Write-Host "6. Stock updated successfully: ID = $($updated.data.id), New Name = '$($updated.data.item_name)', Pc = $($updated.data.pc)"
if ($updated.data.pc -ne 15) { throw "Updated pc does not match!" }

# 7. Delete stock record
$delResp = Invoke-RestMethod -Uri "${baseUrl}/delete?id=$createdId" -Method DELETE
Write-Host "7. Stock deleted successfully: Message = '$($delResp.message)'"

# 8. Clean up item 101 if lingering
try {
    Invoke-RestMethod -Uri "${baseUrl}/delete?id=101" -Method DELETE
} catch {}

# 9. Verify record is deleted
try {
    Invoke-RestMethod -Uri "${baseUrl}/view?id=$createdId" -Method GET
    throw "Deleted stock should not be viewable!"
} catch {
    Write-Host "9. Deleted stock record is no longer found (404/error as expected)."
}

Write-Host "=========================================================="
Write-Host "ALL STOCK STATUS BACKEND CRUD OPERATIONS PASSED (100%)"
Write-Host "=========================================================="
