# 🚨 DATABASE SAFETY RULES 🚨

This document contains critical rules for all AI models and developers interacting with this project. **FAILURE TO FOLLOW THESE RULES MAY RESULT IN IRREVERSIBLE DATA LOSS.**

## 1. NO DESTRUCTIVE MIGRATIONS WITHOUT APPROVAL
- **NEVER** run commands that drop, recreate, or clear the database without explicit, written confirmation from the user.
- Commands like `npx prisma migrate dev`, `npx prisma db push --force-reset`, or any operation that requests "dropping the database" must be stopped immediately.
- If a schema change (like adding an index or a unique constraint) requires a database reset, you **MUST** inform the user and suggest a safe migration strategy (like `npx prisma migrate dev --create-only` and manual SQL adjustment).

## 2. ALWAYS CHECK FOR DATA DESTRUCTION
- Before running any Prisma migration, check the generated SQL or the command output for warnings like `Data will be lost`, `Table was dropped`, or `Database reset`.
- If such a warning appears, **ABORT** and report it to the user.

## 3. BACKUP BEFORE SCHEMA CHANGES
- Strongly recommend a database backup (e.g., exporting `prisma.db` file) before any structural changes to the schema.

## 4. AI MODEL INSTRUCTION
- Any AI assistant (like Antigravity, Cursor, etc.) reading this file **MUST** prioritize data safety over speed or convenience.
- Never automate a "yes" to a "Do you want to reset the database?" prompt.

---
*Created on 2026-01-10 to prevent recurrence of accidental database drops during index creation.*
