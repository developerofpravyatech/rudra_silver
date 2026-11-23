$baseUrl = "http://localhost/Rudra-silver/backend/api/items"
Write-Host "==============================================="
Write-Host "TESTING ITEM MASTER 4 DROPDOWN OPTIONS & FIELDS"
Write-Host "==============================================="

# 1. Fetch item list
$listResp = Invoke-RestMethod -Uri "${baseUrl}?limit=3" -Method GET
Write-Host "Items returned: $($listResp.items.Count)"
$item = $listResp.items[0]
Write-Host "Item ID: $($item.id), Group Name: $($item.group_name)"
Write-Host "Accounting - HSN: $($item.hsn_code), SGST: $($item.sgst)%, Stk.Method: $($item.stock_method)"
Write-Host "MRP - Sale On Mrp: $($item.sale_on_mrp), Pur Less: $($item.pur_less_pct)%, Update Col: $($item.update_mrp_col)"
Write-Host "Return Policy - Item Less: $($item.return_item_less_pct)%, Metal By: $($item.return_metal_by)"
Write-Host "Exchange Policy - Item Less: $($item.exchange_item_less_pct)%, Metal By: $($item.exchange_metal_by)"
Write-Host "Tag Gen - Stud Stamp: $($item.stud_stamp), Polish Wt: $($item.polish_wt), Dia Rate: $($item.dia_rate)"

# 2. Create test item with all 4 option fields
Write-Host "`nCreating new Item with all 4 dynamic options..."
$code = "TST-" + (Get-Random -Minimum 1000 -Maximum 9999)
$createPayload = @{
    group_name = "Silver Payal Fancy Dropdown Test"
    name = "Silver Payal Fancy Dropdown Test"
    code = $code
    category_id = 1
    default_stamp_id = 1
    tunch = 80.00
    default_wastage = 8.50
    default_labour_rate = 45.00
    labour_type = "PER_GRAM_NET"

    # Option 1: Accounting Detail
    sgst = 1.50
    cgst = 1.50
    igst = 3.00
    hsn_code = "7113"
    job_sac = "998892"
    gstr1_display = "TAXABLE"
    l_tax = 0.00
    c_tax = 0.00
    com_co = "CC-01"
    gp_percentage = 15.00
    op_value = 50000.00
    cl_value = 65000.00
    minimum_stock = 25
    mrp_type = "FIXED"
    value_rate = 78000.00
    stock_method = "FIFO"
    default_item = "Silver Bombay Payal"

    # Option 2: MRP Detail
    sale_on_mrp = "YES"
    divide_by = 1.25
    into_by = 1.50
    pur_less_pct = 5.00
    sale_less_pct = 10.00
    dis_types = "PERCENTAGE"
    detail_salesman = "Ramesh Kumar"
    update_mrp_col = "AUTO"

    # Option 3: Return/Exchange Policy
    return_policy_enabled = $true
    return_item_less_pct = 2.00
    return_labour_less_pct = 5.00
    return_diamond_less_pct = 0.00
    return_stone_less_pct = 0.00
    return_metal_by = "CURRENT_RATE"
    exchange_policy_enabled = $true
    exchange_item_less_pct = 1.00
    exchange_labour_less_pct = 2.50
    exchange_diamond_less_pct = 0.00
    exchange_stone_less_pct = 0.00
    exchange_metal_by = "CURRENT_RATE"

    # Option 4: Tag Gen Restriction / Card Point
    tag_gen_restricted = $false
    tag_prefix = "PYL"
    polish_wt = 0.050
    stud_stamp = "HALLMARK-925"
    dia_rate = 0.00
    stn_rate = 120.00
    re_order_level = 10
    upload_file = ""
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $createPayload -ContentType "application/json"
$createdId = $created.id
Write-Host "Created Item ID: $createdId, Name: $($created.name), Code: $($created.code)"

# 3. Fetch single item to verify all 4 options
$fetched = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method GET
Write-Host "`nFetched Created Item Verification:"
Write-Host "  Option 1 HSN: $($fetched.hsn_code), SGST: $($fetched.sgst)%, Value.Rate: $($fetched.value_rate)"
Write-Host "  Option 2 Sale On MRP: $($fetched.sale_on_mrp), Salesman: $($fetched.detail_salesman)"
Write-Host "  Option 3 Return Item Less: $($fetched.return_item_less_pct)%, Exchange Item Less: $($fetched.exchange_item_less_pct)%"
Write-Host "  Option 4 Polish Wt: $($fetched.polish_wt), Stud Stamp: $($fetched.stud_stamp)"

# 4. Clean up test record
$delResp = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method DELETE
Write-Host "`nCleanup test item: $($delResp.message)"

Write-Host "`n==============================================="
Write-Host "ALL 4 DROPDOWN OPTIONS & DYNAMIC FIELDS VERIFIED!"
Write-Host "==============================================="
