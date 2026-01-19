const prisma = require('./db');

async function checkRecentOrders() {
    console.log("Checking recent orders...");
    const orders = await prisma.order.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        select: {
            id: true,
            title: true,
            date: true,
            vendaValor: true,
            client: { select: { name: true } }
        }
    });

    console.log("Recent Orders:");
    orders.forEach(o => {
        console.log(`[${o.date.toISOString()}] ${o.client.name} - ${o.title}: R$ ${o.vendaValor}`);
    });
}

checkRecentOrders()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
