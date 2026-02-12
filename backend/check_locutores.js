const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const locutores = await prisma.locutor.findMany({
        include: {
            suppliers: true
        }
    });

    console.log('LOCUTORES INFO:');
    locutores.forEach(l => {
        console.log(`- ${l.name} (ID: ${l.id}) | Fornecedores: ${l.suppliers.map(s => s.name).join(', ') || 'NENHUM'}`);
    });

    const orders = await prisma.order.findMany({
        where: { cacheValor: { gt: 0 } },
        include: { locutorObj: { include: { suppliers: true } } },
        take: 5
    });

    console.log('\nRECENT ORDERS CACHE:');
    orders.forEach(o => {
        console.log(`Order: ${o.id} | Locutor: ${o.locutorObj?.name} | Has Suppliers: ${o.locutorObj?.suppliers.length > 0}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
