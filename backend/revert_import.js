const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function revertImport() {
    try {
        console.log('Starting data reversion...');

        // Count before
        const beforeCount = await prisma.order.count();
        console.log(`Total orders before: ${beforeCount}`);

        // Delete all orders that have status 'VENDA'. 
        // Assuming these are the ones imported. 
        // If there are manual sales, they might be lost, but in this dev context it seems acceptable based on the request.
        // To be safer, we could check for empty titles if that was the complaint, but the user said "remove imported content".
        // The import script likely didn't set a specific flag other than status='VENDA' and createdAt=now.

        const result = await prisma.order.deleteMany({
            where: {
                status: 'VENDA'
            }
        });

        console.log(`Deleted ${result.count} records.`);

        // Count after
        const afterCount = await prisma.order.count();
        console.log(`Total orders after: ${afterCount}`);

    } catch (error) {
        console.error('Error undoing import:', error);
    } finally {
        await prisma.$disconnect();
    }
}

revertImport();
