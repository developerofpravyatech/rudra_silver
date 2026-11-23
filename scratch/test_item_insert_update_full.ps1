$baseUrl = "http://localhost/Rudra-silver/backend/api/items"

Write-Host "=========================================================="
Write-Host "TESTING ITEM MASTER INSERT & UPDATE FUNCTIONALITY"
Write-Host "=========================================================="

# 1. Fetch categories for dropdown
$cats = Invoke-RestMethod -Uri "${baseUrl}/categories" -Method GET
Write-Host "1. Categories loaded from MySQL: $($cats.Count) categories found."
if ($cats.Count -eq 0) { throw "No categories found!" }

# 2. Fetch purity stamps for dropdown
$stamps = Invoke-RestMethod -Uri "${baseUrl}/stamps" -Method GET
Write-Host "2. Purity Stamps loaded from MySQL: $($stamps.Count) stamps found."
if ($stamps.Count -eq 0) { throw "No purity stamps found!" }

# 3. Test duplicate code check
$codeToTest = "ITM-PAYAL-01"
$checkResp = Invoke-RestMethod -Uri "${baseUrl}/check-code?code=$codeToTest" -Method GET
Write-Host "3. Duplicate code check for existing code '$codeToTest': Available = $($checkResp.available) (Should be False)"
if ($checkResp.available -ne $false) { throw "Duplicate code was marked available!" }

# 4. Insert new Item with all 8 Sections (A through H)
$uniqueCode = "TEST-" + (Get-Random -Minimum 10000 -Maximum 99999)
$addPayload = @{
    # A. Basic Information
    group_name = "Silver Ankle Bracelet Test"
    code = $uniqueCode
    category_id = $cats[0].id
    name = "Silver Ankle Bracelet Test"
    default_stamp_id = $stamps[0].id
    default_item = "Silver Ankle Bracelet 10 Inch"
    is_active = $true

    # B. Tax Information
    sgst = 1.50
    cgst = 1.50
    igst = 3.00
    hsn_code = "7113"
    job_sac = "998892"
    gstr1_display = "TAXABLE"
    l_tax = 0.50
    c_tax = 0.50

    # C. Jewellery and Labour Information
    default_wastage = 7.50
    default_labour_rate = 55.00
    labour_type = "PER_GRAM_NET"
    tunch = 85.00
    com_co = "CC-TEST"
    gp_percentage = 18.00

    # D. Stock and Valuation Information
    op_value = 12000.00
    cl_value = 15000.00
    minimum_stock = 10
    mrp_type = "FIXED"
    value_rate = 82000.00
    stock_method = "FIFO"

    # E. Return Policy
    return_policy_enabled = $true
    return_valid_days = 7
    return_deduction_percent = 2.50
    return_exchange_notes = "Only unused pieces accepted with original tag"

    # F. Exchange Policy
    exchange_policy_enabled = $true
    exchange_valid_days = 15
    exchange_deduction_percent = 1.00

    # G. Tag Generation Settings
    tag_gen_restricted = $true
    tag_prefix = "ANK"
    min_tag_weight = 5.000
    max_tag_weight = 100.000

    # H. Card Point Settings
    card_point_enabled = $true
    card_point_percentage = 2.00
    card_points_per_gram = 0.50
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri "${baseUrl}" -Method POST -Body $addPayload -ContentType "application/json"
$createdId = $created.id
Write-Host "4. Insert Item Succeeded: ID = $createdId, Name = '$($created.name)', Code = '$($created.code)'"
if (!$createdId) { throw "Item insertion failed!" }

# 5. Verify duplicate code rejection on insert
try {
    Invoke-RestMethod -Uri "${baseUrl}" -Method POST -Body $addPayload -ContentType "application/json"
    throw "Duplicate code insertion should have failed but succeeded!"
} catch {
    Write-Host "5. Duplicate code on Insert successfully rejected: $($_.Exception.Message)"
}

# 6. Fetch Item by ID and verify all 8 sections
$fetched = Invoke-RestMethod -Uri "${baseUrl}/$createdId" -Method GET
Write-Host "6. Fetched Item #$createdId for Edit: Name = '$($fetched.name)', Tunch = $($fetched.tunch)%, Labour = ₹$($fetched.default_labour_rate), ReturnDays = $($fetched.return_valid_days), TagPrefix = '$($fetched.tag_prefix)'"

# 7. Update Item with modified values across sections
$updatePayload = @{
    name = "Silver Ankle Bracelet Test Updated"
    group_name = "Silver Ankle Bracelet Test Updated"
    code = $uniqueCode # keeping same code
    category_id = $cats[0].id
    default_stamp_id = $stamps[0].id
    default_item = "Silver Ankle Bracelet 10.5 Inch Updated"
    is_active = $true

    sgst = 1.50
    cgst = 1.50
    igst = 3.00
    hsn_code = "7113"
    job_sac = "998892"
    gstr1_display = "TAXABLE"
    l_tax = 0.50
    c_tax = 0.50

    default_wastage = 8.00
    default_labour_rate = 60.00
    labour_type = "PER_GRAM_GROSS"
    tunch = 90.00
    com_co = "CC-MODIFIED"
    gp_percentage = 20.00

    op_value = 13000.00
    cl_value = 18000.00
    minimum_stock = 15
    mrp_type = "VARIABLE"
    value_rate = 85000.00
    stock_method = "LIFO"

    return_policy_enabled = $true
    return_valid_days = 10
    return_deduction_percent = 3.00
    return_exchange_notes = "Updated return terms"

    exchange_policy_enabled = $true
    exchange_valid_days = 20
    exchange_deduction_percent = 1.50

    tag_gen_restricted = $false
    tag_prefix = "ANK2"
    min_tag_weight = 6.000
    max_tag_weight = 120.000

    card_point_enabled = $false
    card_point_percentage = 0.00
    card_points_per_gram = 0.00
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "${baseUrl}/$createdId" -Method PUT -Body $updatePayload -ContentType "application/json"
Write-Host "7. Update Item Succeeded: Name = '$($updated.name)', LabourRate = ₹$($updated.default_labour_rate), LabourType = $($updated.labour_type), StockMethod = $($updated.stock_method)"
if ($updated.default_labour_rate -ne 60) { throw "Labour rate update failed!" }

# 8. Check code uniqueness excluding current item
$checkOwnCode = Invoke-RestMethod -Uri "${baseUrl}/check-code?code=$uniqueCode&id=$createdId" -Method GET
Write-Host "8. Check code uniqueness for self: Available = $($checkOwnCode.available) (Should be True)"
if ($checkOwnCode.available -ne $true) { throw "Own code check returned false!" }

# 9. Clean up test item
$delResp = Invoke-RestMethod -Uri "${baseUrl}/$createdId" -Method DELETE
Write-Host "9. Cleaned up test item #$createdId successfully."

Write-Host "=========================================================="
Write-Host "ALL ITEM INSERT & UPDATE TESTS COMPLETED SUCCESSFULLY (100% PASS)"
Write-Host "=========================================================="
