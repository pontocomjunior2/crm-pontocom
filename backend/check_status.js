const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCounts() {
    try {
        const clients = await prisma.client.count();
        const orders = await prisma.order.count();
        const locutores = await prisma.locutor.count();
        const suppliers = await prisma.supplier.count();
        const users = await prisma.user.count();

        console.log('Counts:');
        console.log('- Clients:', clients);
        console.log('- Orders:', orders);
        console.log('- Locutores:', locutores);
        console.log('- Suppliers:', suppliers);
        console.log('- Users:', users);
    } catch (error) {
        console.error('Error checking counts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
