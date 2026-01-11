-- Manual Migration: Add Supplier and CreditPackage tables
-- This migration ADDS tables without touching existing data
-- SAFE to run on production database

-- Create Supplier table
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- Create unique index on Supplier name
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_name_key" ON "Supplier"("name");

-- Create CreditPackage table
CREATE TABLE IF NOT EXISTS "CreditPackage" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "credits" INTEGER NOT NULL,
    "costPerCredit" DECIMAL(10,4) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPackage_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "CreditPackage" 
ADD CONSTRAINT "CreditPackage_supplierId_fkey" 
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add supplierId column to Locutor table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Locutor' AND column_name = 'supplierId'
    ) THEN
        ALTER TABLE "Locutor" ADD COLUMN "supplierId" TEXT;
        
        ALTER TABLE "Locutor" 
        ADD CONSTRAINT "Locutor_supplierId_fkey" 
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add credits columns to Order table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'creditsConsumed'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "creditsConsumed" INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'costPerCreditSnapshot'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "costPerCreditSnapshot" DECIMAL(10,2);
    END IF;
END $$;

-- Verify tables were created
SELECT 'Migration completed successfully!' as status;
