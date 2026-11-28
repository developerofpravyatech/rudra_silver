# Rudra Silver ERP Update

## Database backup

Before any deployment, take a MySQL backup:

```powershell
mysqldump --single-transaction --routines --triggers -u USER -p DATABASE > rudra-silver-backup.sql
```

## Migration

Run the ERP posting safety migration in the live database:

```sql
SOURCE D:/xampp/htdocs/Rudra-silver/migrations/erp_posting_safety.sql;
```

The migration creates `stock_movements`; it does not modify or delete existing business data.

## Backend

The PHP API entry point is `backend/index.php`. The existing `.env` file must contain the database host, port, database, user, and password.

## Frontend

```powershell
cd frontend
npm install
npm run build
```

## Implemented posting behavior

- Sale and purchase entries use database transactions.
- Sale/purchase edit and cancel reverse accounting postings.
- Stock movements are recorded in `stock_movements`.
- Sale/purchase records create or update linked daily transactions.
- Invoice numbers are generated and duplicate invoice numbers are rejected.
- Partial and full paid amounts are retained in invoice status fields.

## Verification

Run PHP syntax checks:

```powershell
php -l backend/models/SaleRegister.php
php -l backend/models/PurchaseRegister.php
php -l backend/services/InventoryPostingService.php
```

Build the frontend with `npm run build`.
