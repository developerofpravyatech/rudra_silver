<?php
namespace Models;

use Config\Database;
use PDO;
use Exception;

class Customer {
    public const GENDERS = ['Male', 'Female', 'Other'];

    /**
     * Normalize input array to canonical database keys
     */
    public static function normalizeData(array $input): array {
        return [
            'Name'        => trim($input['Name'] ?? $input['name'] ?? ''),
            'Address1'    => trim($input['Address1'] ?? $input['address1'] ?? $input['address_1'] ?? ''),
            'Address2'    => trim($input['Address2'] ?? $input['address2'] ?? $input['address_2'] ?? ''),
            'Address3'    => trim($input['Address3'] ?? $input['address3'] ?? $input['address_3'] ?? ''),
            'FirmName'    => trim($input['FirmName'] ?? $input['firm_name'] ?? $input['firmName'] ?? ''),
            'Location'    => trim($input['Location'] ?? $input['location'] ?? ''),
            'Occupation'  => trim($input['Occupation'] ?? $input['occupation'] ?? ''),
            'City'        => trim($input['City'] ?? $input['city'] ?? ''),
            'Pin'         => trim($input['Pin'] ?? $input['pin'] ?? $input['pincode'] ?? $input['pin_code'] ?? ''),
            'Country'     => trim($input['Country'] ?? $input['country'] ?? 'India') ?: 'India',
            'Phone'       => trim($input['Phone'] ?? $input['phone'] ?? ''),
            'Mobile'      => trim($input['Mobile'] ?? $input['mobile'] ?? ''),
            'Email'       => trim($input['Email'] ?? $input['email'] ?? ''),
            'DOB'         => !empty($input['DOB'] ?? $input['dob'] ?? null) ? trim($input['DOB'] ?? $input['dob']) : null,
            'Anniversary' => !empty($input['Anniversary'] ?? $input['anniversary'] ?? null) ? trim($input['Anniversary'] ?? $input['anniversary']) : null,
            'Spouse'      => trim($input['Spouse'] ?? $input['spouse'] ?? $input['spouse_name'] ?? $input['spouseName'] ?? ''),
            'SpouseDOB'   => !empty($input['SpouseDOB'] ?? $input['spouse_dob'] ?? $input['spouseDOB'] ?? null) ? trim($input['SpouseDOB'] ?? $input['spouse_dob'] ?? $input['spouseDOB']) : null,
            'Gender'      => trim($input['Gender'] ?? $input['gender'] ?? 'Male') ?: 'Male',
            'Married'     => isset($input['Married']) ? ($input['Married'] ? 1 : 0) : (isset($input['married']) ? ($input['married'] ? 1 : 0) : 0),
            'JewKnow'     => trim($input['JewKnow'] ?? $input['jew_know'] ?? $input['jewelry_knowledge'] ?? $input['jewelryKnowledge'] ?? ''),
            'Education'   => trim($input['Education'] ?? $input['education'] ?? ''),
            'Potential'   => isset($input['Potential']) ? (float)$input['Potential'] : (isset($input['potential']) ? (float)$input['potential'] : 0.0),
            'PANNo'       => strtoupper(trim($input['PANNo'] ?? $input['pan_no'] ?? $input['pan_number'] ?? $input['panNumber'] ?? '')),
            'Aadhaar'     => trim($input['Aadhaar'] ?? $input['aadhaar'] ?? $input['aadhaar_number'] ?? $input['aadhaarNumber'] ?? ''),
            'GSTNo'       => strtoupper(trim($input['GSTNo'] ?? $input['gst_no'] ?? $input['gst_number'] ?? $input['gstNumber'] ?? '')),
            'RefBy'       => trim($input['RefBy'] ?? $input['ref_by'] ?? $input['referred_by'] ?? $input['referredBy'] ?? ''),
            'Remarks'     => trim($input['Remarks'] ?? $input['remarks'] ?? ''),
            'RingSize'    => trim($input['RingSize'] ?? $input['ring_size'] ?? $input['ringSize'] ?? ''),
            'BangleSize'  => trim($input['BangleSize'] ?? $input['bangle_size'] ?? $input['bangleSize'] ?? ''),
            'LeaveBlank'  => isset($input['LeaveBlank']) ? (int)$input['LeaveBlank'] : (isset($input['leave_blank']) ? (int)$input['leave_blank'] : 0),
        ];
    }

    /**
     * Validate Customer input data
     */
    public static function validate(array $data, bool $isUpdate = false, ?int $id = null): array {
        $errors = [];

        // 1. Name is required
        if (empty($data['Name'])) {
            $errors['Name'] = 'Customer Name is required.';
        } elseif (mb_strlen($data['Name']) > 100) {
            $errors['Name'] = 'Customer Name must not exceed 100 characters.';
        }

        // 2. Mobile validation: exactly 10 digits if provided
        if (!empty($data['Mobile'])) {
            // Strip any spaces or hyphens for validation check
            $cleanMobile = preg_replace('/\s+|-/', '', $data['Mobile']);
            if (!preg_match('/^[0-9]{10}$/', $cleanMobile)) {
                $errors['Mobile'] = 'Mobile number must be exactly 10 digits.';
            }
        }

        // 3. Email validation if provided
        if (!empty($data['Email'])) {
            if (!filter_var($data['Email'], FILTER_VALIDATE_EMAIL) || mb_strlen($data['Email']) > 150) {
                $errors['Email'] = 'Please enter a valid email address.';
            }
        }

        // 4. PIN Code validation: exactly 6 digits if provided
        if (!empty($data['Pin'])) {
            if (!preg_match('/^[0-9]{6}$/', $data['Pin'])) {
                $errors['Pin'] = 'PIN Code must be exactly 6 digits.';
            }
        }

        // 5. PAN Number validation: standard 10-char format ABCDE1234F if provided
        if (!empty($data['PANNo'])) {
            if (!preg_match('/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/', $data['PANNo'])) {
                $errors['PANNo'] = 'PAN Number must be in standard format (e.g. ABCDE1234F).';
            }
        }

        // 6. Aadhaar Number validation: exactly 12 digits if provided
        if (!empty($data['Aadhaar'])) {
            $cleanAadhaar = preg_replace('/\s+|-/', '', $data['Aadhaar']);
            if (!preg_match('/^[0-9]{12}$/', $cleanAadhaar)) {
                $errors['Aadhaar'] = 'Aadhaar Number must be exactly 12 digits.';
            }
        }

        // 7. GST Number validation: 15 alphanumeric characters if provided
        if (!empty($data['GSTNo'])) {
            if (!preg_match('/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/', $data['GSTNo'])) {
                $errors['GSTNo'] = 'GST Number must be a valid 15-character GSTIN.';
            }
        }

        // 8. Potential validation: valid numeric if provided (allows negative, zero, decimal)
        if (isset($data['Potential']) && $data['Potential'] !== '' && !is_numeric($data['Potential'])) {
            $errors['Potential'] = 'Potential must be a valid number.';
        }

        // 9. Date of Birth cannot be in the future
        $today = date('Y-m-d');
        if (!empty($data['DOB'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['DOB'])) {
                $errors['DOB'] = 'Date of Birth must be in YYYY-MM-DD format.';
            } elseif ($data['DOB'] > $today) {
                $errors['DOB'] = 'Date of Birth cannot be in the future.';
            }
        }

        // 10. Spouse Date of Birth cannot be in the future
        if (!empty($data['SpouseDOB'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['SpouseDOB'])) {
                $errors['SpouseDOB'] = 'Spouse Date of Birth must be in YYYY-MM-DD format.';
            } elseif ($data['SpouseDOB'] > $today) {
                $errors['SpouseDOB'] = 'Spouse Date of Birth cannot be in the future.';
            }
        }

        // 11. Anniversary date format
        if (!empty($data['Anniversary'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['Anniversary'])) {
                $errors['Anniversary'] = 'Anniversary must be in YYYY-MM-DD format.';
            }
        }

        // 12. Gender enum validation
        if (!empty($data['Gender']) && !in_array($data['Gender'], self::GENDERS, true)) {
            $errors['Gender'] = 'Gender must be Male, Female, or Other.';
        }

        return $errors;
    }

    /**
     * Paginate customers with search, city/location filter, and sorting
     */
    public static function paginate(array $filters = [], int $page = 1, int $limit = 10): array {
        $db = Database::getConnection();
        $where = ['1=1'];
        $params = [];

// Search across Name, Location, City, Mobile, and FirmName
         if (!empty($filters['search'])) {
             $s = '%' . trim($filters['search']) . '%';
             $where[] = '(
                 c.Name LIKE :s_name 
                 OR c.Location LIKE :s_location 
                 OR c.City LIKE :s_city 
                 OR c.Mobile LIKE :s_mobile
                 OR c.FirmName LIKE :s_firm
             )';
             $params['s_name'] = $s;
             $params['s_location'] = $s;
             $params['s_city'] = $s;
             $params['s_mobile'] = $s;
             $params['s_firm'] = $s;
         }

        if (!empty($filters['name'])) {
            $where[] = 'c.Name LIKE :f_name';
            $params['f_name'] = '%' . trim($filters['name']) . '%';
        }

        if (!empty($filters['city'])) {
            $where[] = 'c.City LIKE :f_city';
            $params['f_city'] = '%' . trim($filters['city']) . '%';
        }

        if (!empty($filters['location'])) {
            $where[] = 'c.Location LIKE :f_loc';
            $params['f_loc'] = '%' . trim($filters['location']) . '%';
        }

        if (!empty($filters['mobile'])) {
            $where[] = 'c.Mobile LIKE :f_mob';
            $params['f_mob'] = '%' . trim($filters['mobile']) . '%';
        }

        $whereSql = implode(' AND ', $where);

        // Count total matching
        $countSql = "SELECT COUNT(*) FROM customer c WHERE {$whereSql}";
        $countStmt = $db->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        // Allowed sort columns
        $sortable = [
            'CustomerID' => 'c.CustomerID',
            'id'         => 'c.CustomerID',
            'Name'       => 'c.Name',
            'name'       => 'c.Name',
            'FirmName'   => 'c.FirmName',
            'Mobile'     => 'c.Mobile',
            'Email'      => 'c.Email',
            'Location'   => 'c.Location',
            'City'       => 'c.City',
            'Country'    => 'c.Country',
            'CreatedAt'  => 'c.CreatedAt',
        ];

        $sortBy = $filters['sort_by'] ?? 'CustomerID';
        $orderCol = $sortable[$sortBy] ?? 'c.CustomerID';
        $sortOrder = strtoupper($filters['sort_order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

        $totalPages = $limit > 0 ? (int)ceil($total / $limit) : 1;
        $offset = max(0, ($page - 1) * $limit);

        $sql = "SELECT c.* FROM customer c 
                WHERE {$whereSql} 
                ORDER BY {$orderCol} {$sortOrder} 
                LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'data'        => $rows,
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => $totalPages,
        ];
    }

    /**
     * Find customer by ID
     */
    public static function findById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM customer WHERE CustomerID = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Create customer
     */
    public static function create(array $input): array {
        $normalized = self::normalizeData($input);
        $errors = self::validate($normalized, false);
        if (!empty($errors)) {
            throw new Exception(json_encode($errors));
        }

        $db = Database::getConnection();
        $sql = "INSERT INTO customer (
            Name, Address1, Address2, Address3, FirmName, Location,
            Occupation, City, Pin, Country, Phone, Mobile, Email,
            DOB, Anniversary, Spouse, SpouseDOB, Gender, Married,
            JewKnow, Education, Potential, PANNo, Aadhaar, GSTNo,
            RefBy, Remarks, RingSize, BangleSize, LeaveBlank, CreatedAt, UpdatedAt
        ) VALUES (
            :Name, :Address1, :Address2, :Address3, :FirmName, :Location,
            :Occupation, :City, :Pin, :Country, :Phone, :Mobile, :Email,
            :DOB, :Anniversary, :Spouse, :SpouseDOB, :Gender, :Married,
            :JewKnow, :Education, :Potential, :PANNo, :Aadhaar, :GSTNo,
            :RefBy, :Remarks, :RingSize, :BangleSize, :LeaveBlank, NOW(), NOW()
        )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':Name'        => $normalized['Name'],
            ':Address1'    => $normalized['Address1'] ?: null,
            ':Address2'    => $normalized['Address2'] ?: null,
            ':Address3'    => $normalized['Address3'] ?: null,
            ':FirmName'    => $normalized['FirmName'] ?: null,
            ':Location'    => $normalized['Location'] ?: null,
            ':Occupation'  => $normalized['Occupation'] ?: null,
            ':City'        => $normalized['City'] ?: null,
            ':Pin'         => $normalized['Pin'] ?: null,
            ':Country'     => $normalized['Country'] ?: 'India',
            ':Phone'       => $normalized['Phone'] ?: null,
            ':Mobile'      => $normalized['Mobile'] ?: null,
            ':Email'       => $normalized['Email'] ?: null,
            ':DOB'         => $normalized['DOB'] ?: null,
            ':Anniversary' => $normalized['Anniversary'] ?: null,
            ':Spouse'      => $normalized['Spouse'] ?: null,
            ':SpouseDOB'   => $normalized['SpouseDOB'] ?: null,
            ':Gender'      => $normalized['Gender'] ?: 'Male',
            ':Married'     => (int)$normalized['Married'],
            ':JewKnow'     => $normalized['JewKnow'] ?: null,
            ':Education'   => $normalized['Education'] ?: null,
            ':Potential'   => (float)$normalized['Potential'],
            ':PANNo'       => $normalized['PANNo'] ?: null,
            ':Aadhaar'     => $normalized['Aadhaar'] ?: null,
            ':GSTNo'       => $normalized['GSTNo'] ?: null,
            ':RefBy'       => $normalized['RefBy'] ?: null,
            ':Remarks'     => $normalized['Remarks'] ?: null,
            ':RingSize'    => $normalized['RingSize'] ?: null,
            ':BangleSize'  => $normalized['BangleSize'] ?: null,
            ':LeaveBlank'  => (int)$normalized['LeaveBlank'],
        ]);

        $newId = (int)$db->lastInsertId();
        try { \Services\PartyLedgerSync::resolveOrCreatePartyLedger($normalized['Name'], 'Sundry Debtors (Customers)'); } catch (\Throwable $e) {}
        return self::findById($newId);
    }

    /**
     * Update customer
     */
    public static function update(int $id, array $input): array {
        $existing = self::findById($id);
        if (!$existing) {
            throw new Exception("Customer with ID {$id} not found.");
        }

        $merged = array_merge($existing, $input);
        $normalized = self::normalizeData($merged);
        $errors = self::validate($normalized, true, $id);
        if (!empty($errors)) {
            throw new Exception(json_encode($errors));
        }

        $db = Database::getConnection();
        $sql = "UPDATE customer SET
            Name        = :Name,
            Address1    = :Address1,
            Address2    = :Address2,
            Address3    = :Address3,
            FirmName    = :FirmName,
            Location    = :Location,
            Occupation  = :Occupation,
            City        = :City,
            Pin         = :Pin,
            Country     = :Country,
            Phone       = :Phone,
            Mobile      = :Mobile,
            Email       = :Email,
            DOB         = :DOB,
            Anniversary = :Anniversary,
            Spouse      = :Spouse,
            SpouseDOB   = :SpouseDOB,
            Gender      = :Gender,
            Married     = :Married,
            JewKnow     = :JewKnow,
            Education   = :Education,
            Potential   = :Potential,
            PANNo       = :PANNo,
            Aadhaar     = :Aadhaar,
            GSTNo       = :GSTNo,
            RefBy       = :RefBy,
            Remarks     = :Remarks,
            RingSize    = :RingSize,
            BangleSize  = :BangleSize,
            LeaveBlank  = :LeaveBlank,
            UpdatedAt   = NOW()
        WHERE CustomerID = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id'          => $id,
            ':Name'        => $normalized['Name'],
            ':Address1'    => $normalized['Address1'] ?: null,
            ':Address2'    => $normalized['Address2'] ?: null,
            ':Address3'    => $normalized['Address3'] ?: null,
            ':FirmName'    => $normalized['FirmName'] ?: null,
            ':Location'    => $normalized['Location'] ?: null,
            ':Occupation'  => $normalized['Occupation'] ?: null,
            ':City'        => $normalized['City'] ?: null,
            ':Pin'         => $normalized['Pin'] ?: null,
            ':Country'     => $normalized['Country'] ?: 'India',
            ':Phone'       => $normalized['Phone'] ?: null,
            ':Mobile'      => $normalized['Mobile'] ?: null,
            ':Email'       => $normalized['Email'] ?: null,
            ':DOB'         => $normalized['DOB'] ?: null,
            ':Anniversary' => $normalized['Anniversary'] ?: null,
            ':Spouse'      => $normalized['Spouse'] ?: null,
            ':SpouseDOB'   => $normalized['SpouseDOB'] ?: null,
            ':Gender'      => $normalized['Gender'] ?: 'Male',
            ':Married'     => (int)$normalized['Married'],
            ':JewKnow'     => $normalized['JewKnow'] ?: null,
            ':Education'   => $normalized['Education'] ?: null,
            ':Potential'   => (float)$normalized['Potential'],
            ':PANNo'       => $normalized['PANNo'] ?: null,
            ':Aadhaar'     => $normalized['Aadhaar'] ?: null,
            ':GSTNo'       => $normalized['GSTNo'] ?: null,
            ':RefBy'       => $normalized['RefBy'] ?: null,
            ':Remarks'     => $normalized['Remarks'] ?: null,
            ':RingSize'    => $normalized['RingSize'] ?: null,
            ':BangleSize'  => $normalized['BangleSize'] ?: null,
            ':LeaveBlank'  => (int)$normalized['LeaveBlank'],
        ]);

        return self::findById($id);
    }

    /**
     * Delete customer
     */
    public static function delete(int $id): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM customer WHERE CustomerID = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
