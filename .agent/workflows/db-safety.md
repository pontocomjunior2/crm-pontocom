---
description: database-safety-protocol
---

1. Before modifying `schema.prisma`, check if existing data is present.
2. If schema changes (indexes, unique constraints, destructive changes) are needed:
   - **Abort** automated migration if it suggests a database reset.
   - Inform the USER about the risk of data loss.
   - Suggest a manual migration script or a backup before proceeding.
3. NEVER run `npx prisma migrate dev` or `npx prisma db push` without checking for the "Database reset" warning.
4. If a reset is necessary, the USER MUST provide explicit confirmation.
