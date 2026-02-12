const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const allOrders = await prisma.order.findMany({
        where: { cacheValor: { gt: 0 } },
        select: {
            id: true,
            status: true,
            cacheValor: true,
            cachePago: true,
            locutorId: true,
            locutorObj: {
                select: {
                    name: true,
                    suppliers: {
                        select: { id: true }
                    }
                }
            }
        },
        take: 20
    });

    console.log(JSON.stringify(allOrders, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
