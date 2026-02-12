const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- START DIAGNOSTIC ---');

    const locutores = await prisma.locutor.findMany({
        include: {
            suppliers: true
        }
    });

    console.log('\n--- LOCUTORES AND THEIR SUPPLIERS ---');
    locutores.forEach(l => {
        console.log(`Locutor: ${l.name} | ID: ${l.id} | Suppliers: ${l.suppliers.map(s => s.name).join(', ') || 'NONE'}`);
    });

    const recentOrders = await prisma.order.findMany({
        where: {
            cacheValor: { gt: 0 },
            status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] }
        },
        include: {
            locutorObj: {
                include: {
                    suppliers: true
                }
            }
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
    });

    console.log('\n--- RECENT CACHE ORDERS (Top 20) ---');
    recentOrders.forEach(o => {
        const hasSupplier = o.locutorObj?.suppliers?.length > 0;
        console.log(`Order: ${o.id} | Locutor Name: ${o.locutor} | Found Locutor: ${o.locutorObj?.name || 'NOT FOUND'} | Has Supplier: ${hasSupplier} | Cache Valor: ${o.cacheValor}`);
    });

    console.log('\n--- END DIAGNOSTIC ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
