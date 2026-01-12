const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    try {
        const locutores = await prisma.locutor.findMany({
            where: {
                NOT: { supplierId: null }
            },
            select: {
                id: true,
                supplierId: true
            }
        });

        console.log(`Found ${locutores.length} locutores with legacy supplierId`);

        for (const locutor of locutores) {
            // Check if already linked in the join table
            const existing = await prisma.$queryRaw`
                SELECT * FROM "_LocutorSuppliers" 
                WHERE "A" = ${locutor.id} AND "B" = ${locutor.supplierId}
            `;

            if (existing.length === 0) {
                console.log(`Linking locutor ${locutor.id} to supplier ${locutor.supplierId}`);
                await prisma.$executeRaw`
                    INSERT INTO "_LocutorSuppliers" ("A", "B")
                    VALUES (${locutor.id}, ${locutor.supplierId})
                `;
            } else {
                console.log(`Locutor ${locutor.id} already linked to supplier ${locutor.supplierId}`);
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
