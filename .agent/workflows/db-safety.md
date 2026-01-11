---
description: database-safety-protocol
---

# CRITICAL DATABASE SAFETY PROTOCOL

## ABSOLUTE RULES - NEVER VIOLATE

1. **NEVER accept a database reset prompt** - If Prisma suggests "We need to reset the database", **IMMEDIATELY ABORT** and inform the user.

2. **Always use manual SQL migrations** for schema changes:
   - Create SQL scripts in `backend/manual-migrations/` directory
   - Use `CREATE TABLE IF NOT EXISTS` to safely add tables
   - Use `ALTER TABLE` with conditional checks (`DO $$ BEGIN IF NOT EXISTS...`) for column additions
   - Test migration on empty database first, then apply to production

3. **Before ANY schema change:**
   - Check if data exists in the database
   - Create a manual SQL migration script
   - Present the script to the user for review
   - Get explicit user confirmation before running ANY migration commands

4. **Prisma migration commands are FORBIDDEN unless:**
   - User provides explicit written confirmation with the exact command
   - The database is confirmed to be empty OR
   - A verified backup exists

5. **If Prisma suggests a reset:**
   - Stop immediately
   - Document what schema change triggered the reset suggestion
   - Create a manual SQL migration script instead
   - NEVER proceed with the reset

## Manual Migration Process

1. Update `schema.prisma` with desired changes
2. Create SQL script in `backend/manual-migrations/YYYYMMDD_description.sql`
3. Use IF NOT EXISTS checks for all CREATE statements
4. Use conditional ALTER statements for column additions
5. Test script on local empty database
6. Present script to user for approval
7. Run approved script manually via SQL client or Prisma db execute
8. Run `npx prisma generate` to update Prisma Client (SAFE - only updates code)

## Example Manual Migration Structure

```sql
-- Safe migration example
CREATE TABLE IF NOT EXISTS "NewTable" (...);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ExistingTable' 
                   AND column_name = 'newColumn') THEN
        ALTER TABLE "ExistingTable" ADD COLUMN "newColumn" TEXT;
    END IF;
END $$;
```
