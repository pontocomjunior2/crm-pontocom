const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    const suppliers = await prisma.supplier.findMany({
        where: {
            OR: [
                { name: { contains: 'OFFs Brasil', mode: 'insensitive' } },
                { name: { contains: 'Locução brasil', mode: 'insensitive' } }
            ]
        }
    });

    const report = {};

    for (const s of suppliers) {
        const orders = await prisma.order.findMany({
            where: { supplierId: s.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { locutorObj: true }
        });

        report[s.name] = orders.map(o => ({
            id: o.id,
            title: o.title,
            date: o.date,
            cacheValor: o.cacheValor,
            creditsConsumedSupplier: o.creditsConsumedSupplier,
            costPerCreditSnapshot: o.costPerCreditSnapshot,
            locutor: o.locutor,
            status: o.status,
            createdAt: o.createdAt
        }));
    }

    fs.writeFileSync('orders_report.json', JSON.stringify(report, null, 2));
    console.log('Report written to orders_report.json');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

