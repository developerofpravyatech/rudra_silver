# Rudra Silver – Jewellery ERP

> **Premium Black & Gold luxury jewellery management system** for Rudra Silver.  
> Built with **React + Vite** (frontend) and **Core PHP 8.2 + MySQL** (backend), served via **XAMPP Apache**.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6, TypeScript, Tailwind CSS |
| Backend | Core PHP 8.2 REST API (no framework) |
| Database | MySQL 8 (`rudra_silver`) |
| Server | Apache via XAMPP |
| Auth | JWT (HS256), bcrypt password hashing |
| SMS | MSG91 / Twilio / DEV fallback |

---

## Project Structure

```
Rudra-silver/
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/         # UI pages & components
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── services/api.ts     # All API calls
│   │   ├── types/index.ts      # TypeScript interfaces
│   │   └── App.tsx             # App router & layout
│   ├── vite.config.ts          # Proxy: /api → PHP backend
│   └── package.json
│
├── backend/                    # Core PHP REST API
│   ├── index.php               # Entry point, routing, CORS
│   ├── .htaccess               # Apache mod_rewrite rules
│   ├── .env                    # Environment variables (DB, JWT, SMS)
│   ├── .env.example            # Template for .env
│   ├── config/
│   │   ├── Config.php          # .env parser
│   │   └── Database.php        # PDO singleton (utf8mb4)
│   ├── controllers/
│   │   ├── AuthController.php      # Login, Register, OTP, Reset
│   │   ├── UserController.php      # User CRUD (Admin only)
│   │   ├── DashboardController.php # Rates, Daily Summary
│   │   ├── AccountController.php   # Customer/Supplier search
│   │   ├── TagController.php       # Barcode/RFID lookup
│   │   ├── CalculationController.php # Item calculation
│   │   └── VoucherController.php   # Billing vouchers
│   ├── models/
│   │   ├── User.php
│   │   ├── PasswordResetOTP.php
│   │   ├── Account.php
│   │   ├── DailyBoardRate.php
│   │   ├── InventoryTag.php
│   │   └── Voucher.php
│   ├── middleware/
│   │   ├── AuthMiddleware.php   # JWT validation, role check
│   │   └── CorsMiddleware.php   # CORS headers
│   ├── helpers/
│   │   ├── JWT.php             # Pure-PHP HS256 JWT
│   │   ├── Response.php        # JSON response helpers
│   │   └── Validator.php       # Input sanitization
│   ├── routes/
│   │   ├── Router.php          # Route dispatcher
│   │   └── api.php             # Route definitions
│   └── services/
│       ├── SmsService.php          # MSG91 / Twilio / DEV OTP
│       └── CalculationService.php  # Jewellery weight/labour calc
│
└── backend_python_backup/      # Legacy FastAPI backup (do not delete)
```

---

## Quick Setup (XAMPP)

### Prerequisites
- [XAMPP](https://www.apachefriends.org/) with **Apache** and **MySQL** running
- **PHP 8.2+** (bundled with XAMPP)
- **Node.js 20+** and **npm**
- Project cloned to `C:\xampp\htdocs\Rudra-silver\` (or `D:\xampp\...`)

### 1. Database Setup

```sql
-- In phpMyAdmin or MySQL CLI:
CREATE DATABASE IF NOT EXISTS rudra_silver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then import the schema + seed data:

```bash
mysql -u root rudra_silver < backend/db/rudra_silver.sql
```

> **Default Admin**: Mobile `9825012345` · Password `AdminPassword123`

### 2. Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_NAME=rudra_silver
DB_USER=root
DB_PASS=
JWT_SECRET=your_very_secret_key_change_this
JWT_EXPIRY_HOURS=8
SMS_PROVIDER=DEVELOPMENT
# MSG91_AUTH_KEY=your_msg91_key
# TWILIO_SID=your_sid
# TWILIO_TOKEN=your_token
# TWILIO_FROM=+1XXXXXXXXXX
```

### 3. Apache Configuration

Ensure `AllowOverride All` is set for the `htdocs` directory in `httpd.conf`, and `mod_rewrite` is enabled. The `.htaccess` in `backend/` handles clean URL routing.

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173/** (or next available port).

> The Vite dev proxy forwards all `/api/*` requests to `http://localhost/Rudra-silver/backend`.

---

## API Endpoints

### Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new account (STAFF role) |
| POST | `/api/v1/auth/login` | Login with mobile + password |
| POST | `/api/v1/auth/logout` | Invalidate session |
| GET  | `/api/v1/auth/me` | Get current authenticated user |
| POST | `/api/v1/auth/forgot-password/send-otp` | Send OTP to mobile |
| POST | `/api/v1/auth/forgot-password/verify-otp` | Verify OTP |
| POST | `/api/v1/auth/forgot-password/reset` | Reset password |

### User Management (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/users` | List users (search, filter, paginate) |
| POST | `/api/v1/auth/users` | Create new user |
| GET | `/api/v1/auth/users/{id}` | Get user by ID |
| PUT | `/api/v1/auth/users/{id}` | Update user details |
| PATCH | `/api/v1/auth/users/{id}/status` | Activate / Deactivate user |

### Business APIs (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/rates/today` | Today's silver & gold rates |
| GET | `/api/v1/daily-summary` | Daily voucher summary |
| GET | `/api/v1/accounts` | Search accounts/customers |
| GET | `/api/v1/tags/{tag_number}` | Lookup inventory tag by barcode |
| POST | `/api/v1/calculate/item` | Calculate jewellery item price |
| POST | `/api/v1/vouchers` | Create billing voucher |

---

## Authentication Flow

```
Mobile Number + Password
        │
        ▼
  POST /api/v1/auth/login
        │
        ▼
  PHP verifies password_hash() (bcrypt)
        │
        ▼
  Returns JWT access_token + user object
        │
        ▼
  Token stored in localStorage (rudra_auth_token)
        │
        ▼
  All protected API calls: Authorization: Bearer <token>
```

### Roles
| Role | Access |
|------|--------|
| `ADMIN` | All features + User Management + Rate Setup |
| `STAFF` | Billing, Inventory, Reports (no User Management) |

---

## Forgot Password (OTP Flow)

1. User enters mobile number → `POST /auth/forgot-password/send-otp`
2. OTP generated (6-digit, 10-minute expiry, single-use)
3. **DEV mode**: OTP returned in response body (`dev_otp` field) and logged to Apache error log
4. **Production**: OTP sent via MSG91 or Twilio SMS
5. User enters OTP → `POST /auth/forgot-password/verify-otp`
6. User sets new password → `POST /auth/forgot-password/reset`

### SMS Configuration (Production)
Set in `backend/.env`:
```env
SMS_PROVIDER=MSG91
MSG91_AUTH_KEY=your_key_here
MSG91_TEMPLATE_ID=your_template_id
```
Or use Twilio:
```env
SMS_PROVIDER=TWILIO
TWILIO_SID=ACxxxxxxxx
TWILIO_TOKEN=your_token
TWILIO_FROM=+1XXXXXXXXXX
```

---

## Security

- ✅ Passwords hashed with PHP `password_hash()` (bcrypt, `PASSWORD_DEFAULT`)
- ✅ JWT tokens signed with HS256, 8-hour expiry
- ✅ PDO prepared statements — no SQL injection
- ✅ Input sanitization on all API endpoints
- ✅ Role-based access control (ADMIN vs STAFF)
- ✅ Staff cannot access User Management APIs (403 Forbidden)
- ✅ Users cannot self-assign ADMIN role on registration
- ✅ OTPs are single-use, time-limited (10 min), attempt-limited
- ✅ CORS configured for React dev server origin

---

## Development Notes

### Running Tests

A Python test script is available:
```bash
python C:\Users\PravyaTech Pvt Ltd\.gemini\antigravity\brain\f2a27d0a-4bc2-4509-8cea-1206308a8542\scratch\test_php_migration.py
```

All 12 tests should pass ✅.

### Timezone
- PHP: `Asia/Kolkata` (set in `backend/index.php`)
- MySQL: `+05:30` (set via `SET time_zone` on each PDO connection)

### DEV OTP
In development (`SMS_PROVIDER=DEVELOPMENT`), the OTP is:
- Returned in the API response as `dev_otp`
- Logged to Apache error log: `tail -f /xampp/apache/logs/error.log`

---

## Application Modules

| Module | Description |
|--------|-------------|
| **Login** | Mobile + password authentication |
| **Register** | New account (STAFF role only) |
| **Forgot Password** | OTP-based password reset |
| **Dashboard** | Silver rate display, daily summary, voucher counts |
| **Billing** | POS-style voucher creation (Sale, Purchase, Receipt, Payment) |
| **Inventory** | Tag/barcode-based stock management |
| **Accounts / Customers** | Ledger management, account balances |
| **Invoice History** | Past voucher list and details |
| **Reports** | Daily entry and business reports |
| **User Management** | Admin-only: list, create, edit, activate/deactivate users |
| **Settings** | App configuration, printer settings, scale connection |

---

## Legacy Python Backend

The original FastAPI + PostgreSQL backend is preserved at:
```
backend_python_backup/
```

> Do **not** delete until the PHP backend is confirmed production-ready.  
> The `rudra_jewellery_erp` PostgreSQL database also remains untouched.

---

## License

© 2026 Rudra Silver. All rights reserved.
