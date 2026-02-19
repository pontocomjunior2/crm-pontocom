const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOffsBrasil() {
    try {
        const supplier = await prisma.supplier.findFirst({
            where: { name: { contains: 'OFF' } } // OFFs Brasil
        });

        if (!supplier) {
            console.log('OFFs Brasil not found.');
            return;
        }

        const orders = await prisma.order.findMany({
            where: { supplierId: supplier.id },
            select: { id: true, cacheValor: true, fileName: true, costPerCreditSnapshot: true }
        });

        const zeroOrders = orders.filter(o => parseFloat(o.cacheValor) <= 0);
        console.log(`OFFs Brasil: Total orders ${orders.length}, Zero cost orders: ${zeroOrders.length}`);

        if (zeroOrders.length > 0) {
            zeroOrders.forEach(o => console.log(`ID: ${o.id}, Name: ${o.fileName}, Snapshot: ${o.costPerCreditSnapshot}`));
        } else {
            console.log('ALL OFFs Brasil orders have positive cost!');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOffsBrasil();
