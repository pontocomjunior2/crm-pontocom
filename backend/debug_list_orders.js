const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('Listing some orders with packageId:');
    const orders = await prisma.order.findMany({
        where: { packageId: { not: null } },
        take: 5,
        include: { package: true }
    });

    orders.forEach(o => {
        console.log(`- ID: ${o.id} | Title: ${o.title} | Package: ${o.package?.name}`);
    });

    console.log('\nTotal orders with packageId:', await prisma.order.count({ where: { packageId: { not: null } } }));
}

check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
