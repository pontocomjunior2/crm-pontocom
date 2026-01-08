const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        const orderCount = await prisma.order.count();
        const clientCount = await prisma.client.count();
        const locutorCount = await prisma.locutor.count();

        console.log(`--- Statistics ---`);
        console.log(`Orders: ${orderCount}`);
        console.log(`Clients: ${clientCount}`);
        console.log(`Locutores: ${locutorCount}`);

        // Check status distribution
        const pedidosCount = await prisma.order.count({
            where: { status: 'PEDIDO' }
        });
        const vendasCount = await prisma.order.count({
            where: { status: 'VENDA' }
        });
        console.log(`Total PEDIDO: ${pedidosCount}`);
        console.log(`Total VENDA: ${vendasCount}`);

        // Sample a few orders with client names
        const sampleOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { client: { select: { name: true } } }
        });

        console.log(`\n--- Sample Recent Orders ---`);
        sampleOrders.forEach(o => {
            console.log(`[${o.status}] ${o.title} | Client: ${o.client?.name || 'N/A'} | Value: ${o.vendaValor}`);
        });

        // Check top clients by sales count
        const topClients = await prisma.client.findMany({
            take: 5,
            orderBy: { salesCount: 'desc' },
            select: { name: true, salesCount: true, totalVendas: true }
        });

        console.log(`\n--- Top Clients by Sales Count ---`);
        topClients.forEach(c => {
            console.log(`${c.name}: ${c.salesCount} sales | Total: ${c.totalVendas}`);
        });

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
