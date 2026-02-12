const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const names = ['Duda', 'Liddy', 'Renato', 'Jonas'];

    console.log('--- CHECKING SPECIFIC LOCUTORES ---\n');

    for (const name of names) {
        const locutor = await prisma.locutor.findFirst({
            where: {
                OR: [
                    { name: { contains: name, mode: 'insensitive' } },
                    { realName: { contains: name, mode: 'insensitive' } }
                ]
            },
            include: {
                suppliers: true
            }
        });

        if (locutor) {
            console.log(`Locutor: ${locutor.name} (Real: ${locutor.realName})`);
            console.log(`  ID: ${locutor.id}`);
            console.log(`  Suppliers: ${locutor.suppliers.map(s => s.name).join(', ') || 'NONE'}`);
            console.log(`  Has Suppliers: ${locutor.suppliers.length > 0}`);
            console.log('');
        } else {
            console.log(`Locutor "${name}" NOT FOUND in database`);
            console.log('');
        }
    }

    // Check recent orders for these names
    console.log('\n--- CHECKING ORDERS FOR THESE NAMES ---\n');

    const orders = await prisma.order.findMany({
        where: {
            locutor: { in: names },
            cacheValor: { gt: 0 }
        },
        include: {
            locutorObj: {
                include: {
                    suppliers: true
                }
            }
        },
        take: 20
    });

    orders.forEach(o => {
        console.log(`Order ID: ${o.id}`);
        console.log(`  Locutor String: ${o.locutor}`);
        console.log(`  LocutorId: ${o.locutorId || 'NULL'}`);
        console.log(`  LocutorObj: ${o.locutorObj ? o.locutorObj.name : 'NULL'}`);
        console.log(`  LocutorObj Has Suppliers: ${o.locutorObj ? o.locutorObj.suppliers.length > 0 : 'N/A'}`);
        console.log('');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
