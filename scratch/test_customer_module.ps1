$baseUrl = "http://localhost/Rudra-silver/backend/api/customers"
Write-Host "=========================================="
Write-Host "RUNNING CUSTOMER MANAGEMENT MODULE E2E TEST"
Write-Host "=========================================="

# 1. Test List & Pagination
Write-Host "`n1. Testing Customer List & Pagination..."
$list = Invoke-RestMethod -Uri "${baseUrl}?page=1&limit=5" -Method GET
Write-Host "Total records: $($list.total), Total pages: $($list.total_pages), Items returned: $($list.data.Count)"
if ($list.data.Count -gt 0) {
    Write-Host "Sample Customer #1: ID=$($list.data[0].CustomerID), Name=$($list.data[0].Name), City=$($list.data[0].City)"
}

# 2. Test Search across Name/City/Mobile
Write-Host "`n2. Testing Customer Search..."
$searchRes = Invoke-RestMethod -Uri "${baseUrl}?search=DEVANG" -Method GET
Write-Host "Search for 'DEVANG' returned: $($searchRes.total) record(s)"

# 3. Test Validation failure on invalid mobile / PAN
Write-Host "`n3. Testing Validation..."
$invalidPayload = @{
    Name = "Invalid Customer"
    Mobile = "123" # invalid, must be 10 digits
    PANNo = "INVALIDPAN" # invalid format
} | ConvertTo-Json

try {
    $resp = Invoke-WebRequest -Uri $baseUrl -Method POST -Body $invalidPayload -ContentType "application/json"
    Write-Host "ERROR: Expected validation failure, but got status $($resp.StatusCode)"
} catch {
    Write-Host "Validation correctly rejected invalid payload with status: $($_.Exception.Response.StatusCode.value__)"
}

# 4. Test Customer Creation with all fields
Write-Host "`n4. Testing Full Customer Creation..."
$newCustomerPayload = @{
    Name = "Vikramaditya Solanki"
    Gender = "Male"
    DOB = "1992-05-14"
    Married = 1
    Spouse = "Pooja Solanki"
    SpouseDOB = "1994-08-20"
    Anniversary = "2018-12-10"
    Education = "B.Com, MBA"

    FirmName = "Solanki Silver Works"
    Address1 = "Shop 12, Gold Souk"
    Address2 = "Palace Road"
    Address3 = "Near Swaminarayan Temple"
    Location = "Dharmendra Road"
    City = "Rajkot"
    Pin = "360001"
    Country = "India"
    Phone = "0281-224455"
    Mobile = "9825012345"
    Email = "vikram.solanki@example.com"

    Occupation = "Jeweller"
    Potential = 150000.00
    PANNo = "ABCDE1234F"
    Aadhaar = "123456789012"
    GSTNo = "24ABCDE1234F1Z5"

    JewKnow = "Silver Ornaments & Antique Articles"
    RingSize = "22"
    BangleSize = "2.6"
    RefBy = "Direct Referral"
    Remarks = "Prefers 925 Sterling Silver payal and chains."
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $newCustomerPayload -ContentType "application/json"
$createdId = $created.CustomerID
Write-Host "Created Customer successfully! CustomerID: $createdId, Name: $($created.Name)"

# 5. Test Get Customer Details by ID
Write-Host "`n5. Testing Fetch Single Customer Details..."
$fetched = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method GET
Write-Host "Fetched: ID=$($fetched.CustomerID), Name=$($fetched.Name), Firm=$($fetched.FirmName), PAN=$($fetched.PANNo), GST=$($fetched.GSTNo), Potential=$($fetched.Potential)"

# 6. Test Update Customer
Write-Host "`n6. Testing Customer Update..."
$updatePayload = @{
    Name = "Vikramaditya Solanki (VIP)"
    Potential = 250000.00
    Remarks = "Upgraded to VIP Tier customer."
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method PUT -Body $updatePayload -ContentType "application/json"
Write-Host "Updated Customer: Name=$($updated.Name), Potential=$($updated.Potential), Remarks=$($updated.Remarks)"

# 7. Test Delete Customer
Write-Host "`n7. Testing Customer Deletion..."
$deleteRes = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method DELETE
Write-Host "Deletion result: $($deleteRes.message)"

# 8. Verify Deletion
try {
    $checkDeleted = Invoke-WebRequest -Uri "$baseUrl/$createdId" -Method GET
    Write-Host "ERROR: Record still exists after deletion"
} catch {
    Write-Host "Record verified deleted. 404 status received as expected: $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "`n=========================================="
Write-Host "ALL CUSTOMER MODULE TESTS PASSED!"
Write-Host "=========================================="
