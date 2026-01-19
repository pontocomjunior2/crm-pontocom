const prisma = require('./db');

async function testFilter() {
    console.log("System Time:", new Date().toString());
    console.log("System ISO:", new Date().toISOString());

    const startDate = '2026-01-01';
    const endDate = '2026-01-19';

    // Same logic as dashboard.js
    const end = new Date(`${endDate}T23:59:59.999`);

    console.log("End Date constructed (Local):", end.toString());
    console.log("End Date constructed (ISO):", end.toISOString());

    const dateFilter = {
        date: {
            gte: new Date(startDate),
            lte: end
        }
    };

    console.log("Filter used:", JSON.stringify(dateFilter, null, 2));

    const orders = await prisma.order.findMany({
        where: {
            status: 'VENDA',
            ...dateFilter
        },
        select: { id: true, date: true, vendaValor: true, title: true }
    });

    let total = 0;
    orders.forEach(o => {
        total += Number(o.vendaValor);
        console.log(`[${o.date.toISOString()}] R$ ${o.vendaValor} - ${o.title}`);
    });
    console.log("Total:", total);
}

testFilter()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
