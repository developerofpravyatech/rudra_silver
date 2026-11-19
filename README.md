# 🥈 Rudra Silver — Jewellery ERP System

> **Pure Silver • Pure Elegance**  
> A next-generation, full-stack Jewellery ERP built for silver retailers — with POS billing, live metal rates, digital weighing scale integration, inventory management, and a stunning luxury UI.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
  - [Backend Setup (FastAPI)](#1-backend-setup-fastapi)
  - [Frontend Setup (React + Vite)](#2-frontend-setup-react--vite)
  - [Database Setup (MySQL)](#3-database-setup-mysql)
- [Running the Application](#-running-the-application)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Pages & Navigation](#-pages--navigation)
- [Theme System](#-theme-system)
- [Weighing Scale Integration](#-weighing-scale-integration)
- [Build & Deployment](#-build--deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Rudra Silver ERP** is a professional jewellery management system designed for silver retail shops. It provides a complete point-of-sale workflow — from weighing raw silver on a digital scale, computing fine metal value with purity touch calculations, generating GST invoices, and maintaining triple-currency party ledgers (Cash ₹ + Fine Gold g + Fine Silver g).

The system features a **luxury dark/light UI** with real-time silver rate boards, inventory tracking across jewellery categories (Payal, Chain, Kada, Ring, Bracelet), and a classical daily entry hub for traditional bookkeeping.

---

## ✨ Features

### 🛒 POS & Billing
- Multi-voucher type support: Sale, Purchase, Sale Return, Purchase Return, Issue, Receive, Order, Repair
- Auto silver rate calculation based on gross weight × purity touch
- Less weight / wastage deduction
- Labour charge per gram
- GST tax computation
- Digital weighing scale live weight feed via RS-232 / USB COM (Web Serial API)
- Print invoice directly from browser

### 📊 Dashboard
- Today's Sales, Total Invoices, Silver Sold (g), Live Silver Rate
- Sales Overview trend chart (Today / 7 Days / 30 Days)
- Jewellery Category quick-launch tiles
- Inventory health donut ring (Stock %)
- Recent Invoices table
- Quick Action shortcuts

### ⚖️ Silver Weighing Station
- Live weight display from digital scale (COM port)
- Manual weight entry (simulation mode)
- Less weight / tare weight entry
- Purity touch selector (999, 92.5, 80, 70, etc.)
- Fine silver weight & estimated metal value calculation
- One-click "Transfer to New Invoice"

### 💹 Daily Bhav / Live Board Rates
- Fine Silver 999 rate per kg
- Silver 925 (Sterling) rate
- Gold 24K and 22K rates
- Real-time rate board update across all POS terminals

### 📦 Inventory Management
- Category-wise stock view (Payal, Chain, Kada, Ring, Bracelet, Other)
- Tag number, gross weight, net weight, fine weight per item
- Purity % and labour rate columns
- Stock status badges (In Stock / Low Stock / Reserved)
- Filter by category and purity
- One-click "Bill This Item" to POS

### 📂 Account Ledger / Party Management
- Search party by name or mobile number
- Triple-currency balance view: Cash ₹, Fine Gold (g), Fine Silver (g)
- Account type tagging (Customer / Supplier / Both)

### 📋 Invoice History
- Full invoice listing with date, customer, amount, voucher type
- Status badges (Paid / Pending / Draft)

### 📈 Reports
- Voucher-wise summary (Sale, Purchase, Receipt, Payment, etc.)
- Opening / Closing Cash balance
- Classical Daily Entry Hub (traditional bookkeeping screen)

### ⚙️ Settings & Administration
- Store name, tagline, GSTIN, Hallmark registration
- Address, phone number, invoice prefix
- Default touch purity setting
- Scale COM port and baud rate configuration
- Printer settings (thermal / A4)
- User management with role-based access

### 🌙 Light / Dark Theme
- One-click Sun/Moon toggle in the header
- Full theme applied to all pages, cards, tables, forms, and dropdowns
- Dark Mode as default; persisted in `localStorage`

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.x | UI framework |
| **TypeScript** | 5.7.x | Type safety |
| **Vite** | 6.x | Dev server & build tool |
| **Tailwind CSS** | 3.4.x | Utility-first styling |
| **lucide-react** | 1.16.x | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.13 | Runtime |
| **FastAPI** | ≥ 0.115 | REST API framework |
| **Uvicorn** | ≥ 0.32 | ASGI server |
| **SQLAlchemy** | ≥ 2.0 | ORM |
| **PyMySQL** | ≥ 1.1 | MySQL driver |
| **Pydantic v2** | ≥ 2.10 | Data validation & settings |
| **PySerial** | ≥ 3.5 | Weighing scale COM port |
| **python-jose** | — | JWT authentication |

### Database
| Technology | Purpose |
|---|---|
| **MySQL** | Primary relational database (via XAMPP / standalone) |

---

## 📁 Project Structure

```
Rudra-silver/
├── backend/                        # FastAPI Python Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints.py    # All REST API routes
│   │   │       └── auth.py         # JWT authentication routes
│   │   ├── core/
│   │   │   └── config.py           # App settings (Pydantic BaseSettings)
│   │   ├── db/
│   │   │   ├── models.py           # SQLAlchemy ORM models
│   │   │   └── session.py          # DB engine & session factory
│   │   ├── schemas/
│   │   │   └── all_schemas.py      # Pydantic request/response schemas
│   │   ├── services/
│   │   │   └── calculation.py      # Metal valuation business logic
│   │   └── main.py                 # FastAPI app entry point
│   ├── .env                        # Environment secrets (not committed)
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # React + Vite Frontend
│   ├── public/
│   │   └── assets/                 # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── MainDashboard.tsx       # Main dashboard page
│   │   │   ├── TopNavbar.tsx           # Header with theme toggle
│   │   │   ├── Sidebar.tsx             # Left navigation sidebar
│   │   │   ├── PosBillingModal.tsx     # POS billing page
│   │   │   ├── SilverWeighingModal.tsx # Weighing station page
│   │   │   ├── SilverRateModal.tsx     # Daily Bhav rate page
│   │   │   ├── AccountLedgerModal.tsx  # Party ledger page
│   │   │   ├── CategoryItemsModal.tsx  # Item master / catalogue
│   │   │   ├── InventoryPage.tsx       # Inventory management page
│   │   │   ├── InvoiceHistoryPage.tsx  # Invoice history page
│   │   │   ├── ReportsPage.tsx         # Reports & daily entry page
│   │   │   ├── ScaleConnectionPage.tsx # Scale hardware config page
│   │   │   ├── PrinterSettingsPage.tsx # Printer settings page
│   │   │   ├── UserManagementPage.tsx  # User admin page
│   │   │   ├── SettingsPage.tsx        # Store settings page
│   │   │   ├── DailyEntryDashboard.tsx # Classical daily entry hub
│   │   │   ├── JewelleryIllustrations.tsx # SVG jewellery icons
│   │   │   └── LuxuryLogo.tsx          # Brand diamond logo SVG
│   │   ├── context/
│   │   │   └── ThemeContext.tsx     # Dark/Light theme provider
│   │   ├── hooks/
│   │   │   └── useWeighingScale.ts  # Web Serial API scale hook
│   │   ├── services/
│   │   │   └── api.ts               # All backend API calls
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript type definitions
│   │   ├── App.tsx                  # Root component & routing logic
│   │   ├── main.tsx                 # React entry point
│   │   └── index.css                # Tailwind + luxury card styles
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **Python** ≥ 3.11 — [Download](https://python.org/)
- **MySQL** ≥ 8.0 — via [XAMPP](https://www.apachefriends.org/) or standalone
- **pip** (comes with Python)
- **npm** (comes with Node.js)

> **Windows users:** XAMPP is recommended for MySQL. Start the MySQL service from the XAMPP Control Panel.

---

## 🚀 Installation & Setup

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd Rudra-silver/backend

# Create a Python virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (macOS / Linux)
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd Rudra-silver/frontend

# Install Node.js dependencies
npm install
```

### 3. Database Setup (MySQL)

1. Start MySQL (via XAMPP Control Panel or your MySQL service)
2. Open phpMyAdmin at `http://localhost/phpmyadmin`
3. Create a new database:

```sql
CREATE DATABASE rudra_jewellery_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. The FastAPI backend will auto-create all tables on first startup via SQLAlchemy `create_all`.

---

## 🔧 Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# Database
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/rudra_jewellery_erp

# Security
SECRET_KEY=your-very-long-random-secret-key-here-change-in-production

# Weighing Scale (optional)
SCALE_COM_PORT=COM3
SCALE_BAUDRATE=9600
```

> **Never commit `.env` to version control.** It contains sensitive credentials.

---

## ▶️ Running the Application

### Start the Backend Server

```bash
cd Rudra-silver/backend

# Activate virtual environment first
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

# Run FastAPI with hot-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **`http://localhost:8000`**  
Swagger API docs: **`http://localhost:8000/docs`**  
ReDoc: **`http://localhost:8000/redoc`**

---

### Start the Frontend Dev Server

```bash
cd Rudra-silver/frontend

npm run dev
```

Frontend will be available at: **`http://localhost:5173`**

> The Vite dev server proxies all `/api/*` requests to `http://localhost:8000` automatically — no CORS issues during development.

---

## 📡 API Reference

The FastAPI backend exposes a versioned REST API under `/api/v1/`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/api/v1/rates/today` | Fetch today's metal rates |
| `POST` | `/api/v1/rates/update` | Update daily metal board rates |
| `GET` | `/api/v1/summary/daily` | Get today's business summary |
| `GET` | `/api/v1/accounts/search` | Search party accounts |
| `GET` | `/api/v1/inventory/tags` | List inventory tags |
| `POST` | `/api/v1/billing/calculate` | Calculate item metal value |
| `POST` | `/api/v1/billing/save` | Save a billing voucher |
| `GET` | `/api/v1/invoices` | List all invoices |
| `POST` | `/api/v1/auth/login` | User login (JWT) |
| `GET` | `/api/v1/scale/weight` | Read live scale weight |

> 📖 Full interactive API docs available at **`http://localhost:8000/docs`** when backend is running.

---

## 🗂️ Pages & Navigation

The app uses a **custom tab-based routing** (no React Router) — the sidebar drives navigation and all pages render inline in the main content area with the Header and Sidebar always visible.

| Sidebar Item | Page Component | Description |
|---|---|---|
| 🏠 Dashboard | `MainDashboard` | KPIs, charts, quick actions |
| 🧾 New Billing | `PosBillingModal` | Full POS billing workflow |
| ⚖️ Silver Weighing | `SilverWeighingModal` | Digital scale + valuation |
| ✨ Item Master | `CategoryItemsModal` | Jewellery product catalogue |
| 📈 Silver Rate | `SilverRateModal` | Daily Bhav / rate board |
| 👥 Customers | `AccountLedgerModal` | Party ledger search |
| 📦 Inventory | `InventoryPage` | Stock by category & tag |
| 🕐 Invoice History | `InvoiceHistoryPage` | Past invoices listing |
| 📊 Reports | `ReportsPage` | Voucher summary + daily entry |
| 📶 Scale Connection | `ScaleConnectionPage` | COM port scale config |
| 🖨️ Printer Settings | `PrinterSettingsPage` | Thermal / A4 printer setup |
| 🛡️ User Management | `UserManagementPage` | Staff roles & permissions |
| ⚙️ Settings | `SettingsPage` | Store details & app config |

---

## 🌙 Theme System

The application supports **Dark Mode** (default) and **Light Mode** via a Sun/Moon toggle button in the top header.

### How It Works

| Component | Details |
|---|---|
| **Context** | `ThemeContext.tsx` — React context providing `theme`, `toggleTheme`, `setTheme` |
| **Storage** | `localStorage` key: `rudra_silver_theme` (`'dark'` or `'light'`) |
| **Default** | Dark Mode — applied if no preference is stored |
| **CSS Strategy** | Tailwind `darkMode: 'class'` — toggles `dark` class on `<html>` element |
| **Card Styles** | `.luxury-card` and `.luxury-card-gold` have light/dark variants in `index.css` |

### Theme Toggle Location
The **Sun ☀️ / Moon 🌙** button is in the top-right of the Header (replaced the old Notification bell).

---

## ⚖️ Weighing Scale Integration

Rudra Silver supports **RS-232 / USB digital weighing scales** via the browser's **Web Serial API**.

### Supported Scales
Any digital scale that outputs weight data over COM/USB serial (9600 baud, 8N1 — standard for most jewellery scales).

### How to Connect
1. Click **"Connect Scale"** button in the top header (or go to **Scale Connection** in the sidebar)
2. The browser will prompt you to select the COM port
3. Grant serial port permission
4. Live weight streams automatically to the **Silver Weighing** page and **POS Billing** page

### Fallback
If no scale is connected, **Manual Weight Entry** mode activates automatically — you can type the weight manually.

> ⚠️ Web Serial API requires **Google Chrome** or **Microsoft Edge** (Chromium-based). Not supported in Firefox or Safari.

---

## 🏗️ Build & Deployment

### Production Build (Frontend)

```bash
cd Rudra-silver/frontend

# Type-check and build optimised bundle
npm run build

# Output: frontend/dist/
# index.html + assets/index-*.js + assets/index-*.css
```

### Preview Production Build Locally

```bash
npm run preview
# Opens at http://localhost:4173
```

### Deploy Frontend to XAMPP

Copy the `frontend/dist/` contents to `C:\xampp\htdocs\rudra-silver\` (or your htdocs subfolder) and configure Apache to serve `index.html` for all routes.

### Deploy Backend with Gunicorn (Linux Production)

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 🖼️ Screenshots

| Page | Description |
|---|---|
| **Dashboard (Dark)** | Navy dark background, gold accent KPI cards, sales trend chart |
| **Dashboard (Light)** | White cards, amber borders, clean professional layout |
| **POS Billing** | Full weighing → purity → labour → GST → invoice workflow |
| **Silver Weighing** | LED-style digital scale display with live weight feed |
| **Daily Bhav Board** | Rate input fields for Fine Silver 999, 925, Gold 24K, 22K |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Code Style Guidelines
- **Frontend:** Follow existing Tailwind utility class patterns. Always add both light and dark variants (`dark:` prefix).
- **Backend:** Follow FastAPI project structure. Add Pydantic schemas for all new endpoints.
- **TypeScript:** No `any` types. All props must be typed.
- **Business Logic:** Do NOT modify `DailyEntryDashboard.tsx` or backend calculation logic without explicit approval.

---

## 📄 License

```
MIT License

Copyright (c) 2026 Rudra Silver

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<div align="center">

**Made with ❤️ for Rudra Silver**

*Pure Silver • Pure Elegance • Pure Code*

</div>
#   r u d r a _ s i l v e r  
 #   r u d r a _ s i l v e r  
 