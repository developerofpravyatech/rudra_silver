<?php
require __DIR__ . '/../backend/config/Config.php';
require __DIR__ . '/../backend/config/Database.php';

$db = \Config\Database::getConnection();

$sql = "CREATE TABLE IF NOT EXISTS karigars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  karigar_code VARCHAR(50) NOT NULL UNIQUE,
  karigar_name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NULL,
  alternate_mobile VARCHAR(20) NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  pincode VARCHAR(10) NULL,
  karigar_type VARCHAR(50) NULL,
  metal_type VARCHAR(50) NULL,
  opening_gold_balance DECIMAL(15,3) NOT NULL DEFAULT 0,
  opening_silver_balance DECIMAL(15,3) NOT NULL DEFAULT 0,
  opening_diamond_balance DECIMAL(15,3) NOT NULL DEFAULT 0,
  opening_stone_balance DECIMAL(15,3) NOT NULL DEFAULT 0,
  opening_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  narration TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_karigar_code (karigar_code),
  INDEX idx_karigar_name (karigar_name),
  INDEX idx_city (city),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

$db->exec($sql);
echo "karigars table created.\n";

// Dummy data (only if empty)
$count = (int)$db->query("SELECT COUNT(*) FROM karigars")->fetchColumn();
if ($count === 0) {
    $dummy = [
        ['K001','Ramesh Jewellers','9876543210','9876543211','12 Main Road','Rajkot','Gujarat','360001','Goldsmith','GOLD',10.5,20.25,0,0,5000,'Opening balance','Active'],
        ['K002','Shyam Silver Works','9898989898','','45 Market Street','Ahmedabad','Gujarat','380001','Silversmith','SILVER',0,15.5,0,0,0,'','Active'],
        ['K003','Diamond Craft','9123456789','','88 Ring Road','Surat','Gujarat','395001','Diamond Setter','DIAMOND',0,0,5.25,0,0,'','Active'],
        ['K004','Stone Art Karigar','9988776655','','12 Temple Road','Mumbai','Maharashtra','400001','Stone Setter','STONE',0,0,0,3.10,0,'','Active'],
        ['K005','Gold & Silver House','9000011111','','200 Bazaar','Rajkot','Gujarat','360002','Goldsmith','GOLD',5.0,8.0,0,0,1200,'','Active'],
        ['K006','Royal Jewellery','9111222333','','10 Palace Road','Jaipur','Rajasthan','302001','Goldsmith','GOLD',2.5,0,0,0,0,'','Inactive'],
        ['K007','Silver Chain Maker','9222333444','','7 Chain Lane','Rajkot','Gujarat','360003','Silversmith','SILVER',0,12.75,0,0,0,'','Active'],
        ['K008','Precious Stone Works','9333444555','','33 Stone Street','Surat','Gujarat','395002','Stone Setter','STONE',0,0,0,1.50,0,'','Active'],
        ['K009','Fine Diamond Karigar','9444555666','','55 Diamond Road','Mumbai','Maharashtra','400002','Diamond Setter','DIAMOND',0,0,2.10,0,0,'','Active'],
        ['K010','Mixed Metal Karigar','9555666777','','77 Mix Road','Ahmedabad','Gujarat','380002','Goldsmith','GOLD',3.25,6.5,1.0,0.5,0,'','Active'],
    ];
    $stmt = $db->prepare("INSERT INTO karigars (karigar_code, karigar_name, mobile, alternate_mobile, address, city, state, pincode, karigar_type, metal_type, opening_gold_balance, opening_silver_balance, opening_diamond_balance, opening_stone_balance, opening_amount, narration, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach ($dummy as $d) {
        $stmt->execute($d);
    }
    echo "Inserted 10 dummy karigars.\n";
} else {
    echo "karigars already has data; skipped dummy insert.\n";
}