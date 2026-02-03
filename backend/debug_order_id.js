const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const id = '82076bf3-e4cf-493c-9b4d-6cd84a4323cc';
    console.log(`Checking order: ${id}`);

    const order = await prisma.order.findUnique({
        where: { id },
        include: { package: true }
    });

    if (order) {
        console.log('Order found:');
        console.log(JSON.stringify(order, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2));
    } else {
        console.log('Order NOT found in database.');

        // Check if it's a ClientPackage ID instead
        const pkg = await prisma.clientPackage.findUnique({ where: { id } });
        if (pkg) {
            console.log('ID belongs to a ClientPackage, not an Order!');
        } else {
            console.log('ID not found in ClientPackage either.');
        }
    }
}

check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
