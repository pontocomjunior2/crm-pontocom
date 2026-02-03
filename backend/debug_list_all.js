const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAll() {
    const orders = await prisma.order.findMany({
        select: { id: true, title: true, packageId: true, numeroVenda: true }
    });
    console.log('--- ALL ORDERS ---');
    orders.forEach(o => {
        console.log(`ID: ${o.id} | Title: ${o.title} | PkgID: ${o.packageId} | NV: ${o.numeroVenda}`);
    });

    const pkgs = await prisma.clientPackage.findMany({
        select: { id: true, name: true, billingOrderId: true }
    });
    console.log('\n--- ALL PACKAGES ---');
    pkgs.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.name} | BillingOID: ${p.billingOrderId}`);
    });
}

listAll()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
