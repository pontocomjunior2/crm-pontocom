# Database Backup Strategy

## CRITICAL: Prevent Data Loss

This document outlines the backup strategy to prevent catastrophic data loss incidents.

## Automated Backup Setup (RECOMMENDED)

### Option 1: PostgreSQL pg_dump Scheduled Backups

Create a daily backup script:

```bash
# backup-db.sh
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pontocom_backup_$TIMESTAMP.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "pontocom_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Schedule with cron:
```
0 2 * * * /path/to/backup-db.sh
```

### Option 2: Database Provider Automated Backups

If using managed PostgreSQL (e.g., Supabase, Railway, Neon):
- Enable automated daily backups in provider dashboard
- Configure retention period (minimum 7 days recommended)
- Test restoration process monthly

## Manual Backup Before Schema Changes

**MANDATORY before any database schema modifications:**

```bash
# Quick manual backup
cd backend
npx prisma db execute --stdin < /dev/null > ../backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

Or using pg_dump directly:
```bash
pg_dump $DATABASE_URL > backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

## Restoration Process

### From SQL dump:
```bash
# Restore from backup
psql $DATABASE_URL < backups/pontocom_backup_TIMESTAMP.sql
```

### After restoration:
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart application
npm run dev:all
```

## Testing Backups

**Monthly verification (1st of each month):**
1. Download latest backup
2. Restore to a test database
3. Verify data integrity
4. Document results

## Emergency Contacts

- Database Provider Support: [Add contact info]
- Backup Storage Location: [Add location]
- Last Verified Backup: [Add date]

## Lessons Learned

### Incident: 2026-01-11 - Prisma Migration Reset
- **Cause:** Accepted Prisma migration reset prompt without verification
- **Result:** Complete data loss - all clients, orders, locutors deleted
- **Prevention:** 
  - Never accept database reset prompts
  - Always use manual SQL migrations
  - Require explicit user confirmation for ANY schema changes
  - Follow `/db-safety` workflow strictly
