const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    const order = await prisma.order.findFirst({
        where: { title: 'PULÔ PARK' },
        include: { supplier: true, locutorObj: true }
    });

    if (order) {
        fs.writeFileSync('pulo_park_details.json', JSON.stringify(order, null, 2));
        console.log('Details written to pulo_park_details.json');
    } else {
        console.log('Order "PULÔ PARK" not found');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
