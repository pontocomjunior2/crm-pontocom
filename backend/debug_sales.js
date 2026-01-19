const prisma = require('./db');

async function debugSales() {
    console.log("Debugging Sales for January 2026...");

    // 1. Get ALL sales for Jan 2026 (simple string filtering if possible, or broad range)
    // We'll use a very broad range to catch everything.
    const start = new Date('2026-01-01T00:00:00.000Z');
    const end = new Date('2026-02-01T00:00:00.000Z');

    const orders = await prisma.order.findMany({
        where: {
            status: 'VENDA',
            date: {
                gte: start,
                lt: end
            }
        },
        select: {
            id: true,
            title: true,
            date: true,
            vendaValor: true,
            client: { select: { name: true } }
        },
        orderBy: { date: 'asc' }
    });

    let total = 0;
    console.log("--- Orders Found (UTC Dates) ---");
    orders.forEach(o => {
        const val = parseFloat(o.vendaValor || 0);
        total += val;
        console.log(`[${o.date.toISOString()}] R$ ${val.toFixed(2)} - ${o.client.name} (${o.title})`);
    });

    console.log("--------------------------------");
    console.log(`Total Calculated (Jan 1 - Feb 1 UTC): R$ ${total.toFixed(2)}`);
}

debugSales()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
