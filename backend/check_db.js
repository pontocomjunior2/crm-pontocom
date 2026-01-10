const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const clients = await prisma.client.count();
    const orders = await prisma.order.count();
    console.log(`Clients: ${clients}`);
    console.log(`Orders: ${orders}`);
    process.exit(0);
}

check();
