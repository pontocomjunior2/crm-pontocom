# Manual Database Migrations

This directory contains manual SQL migration scripts for safe schema changes without data loss.

## Why Manual Migrations?

Prisma's automated `migrate dev` can suggest database resets when it detects breaking changes. This **WILL DELETE ALL DATA**. To prevent this, we use manual SQL migrations.

## How to Create a Manual Migration

1. **Update `schema.prisma`** with your desired changes
2. **Create SQL file** in this directory: `YYYYMMDD_description.sql`
3. **Write safe SQL** using these patterns:

```sql
-- Safe table creation
CREATE TABLE IF NOT EXISTS "TableName" (...);

-- Safe column addition
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TableName' AND column_name = 'columnName'
    ) THEN
        ALTER TABLE "TableName" ADD COLUMN "columnName" TYPE;
    END IF;
END $$;

-- Safe index creation
CREATE INDEX IF NOT EXISTS "index_name" ON "TableName"("columnName");
```

4. **Test locally** on an empty database first
5. **Get user approval** before running on production
6. **Apply migration**:

```bash
# Method 1: Using psql
psql $DATABASE_URL -f manual-migrations/YYYYMMDD_description.sql

# Method 2: Using Prisma
cat manual-migrations/YYYYMMDD_description.sql | npx prisma db execute --stdin
```

7. **Update Prisma Client**:
```bash
npx prisma generate
```

## Available Migrations

- `add_supplier_tables.sql` - Adds Supplier and CreditPackage tables for credit-based cost tracking

## NEVER DO

- ❌ Run `npx prisma migrate dev` without checking for reset warnings
- ❌ Accept a database reset prompt
- ❌ Use `prisma db push` on production
- ❌ Run migrations without user approval
- ❌ Skip backup before schema changes

## Always DO

- ✅ Create manual SQL scripts with IF NOT EXISTS checks
- ✅ Test migrations on empty database first
- ✅ Get explicit user confirmation
- ✅ Backup database before applying
- ✅ Use conditional ALTER statements
- ✅ Review the `/db-safety` workflow before ANY schema change
