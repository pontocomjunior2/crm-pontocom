const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    const suppliers = await prisma.supplier.findMany({
        where: {
            OR: [
                { name: { contains: 'OFFs Brasil', mode: 'insensitive' } },
                { name: { contains: 'Locução brasil', mode: 'insensitive' } }
            ]
        },
        include: {
            packages: {
                orderBy: { purchaseDate: 'desc' }
            },
            locutores: {
                select: { id: true, name: true }
            }
        }
    });

    const output = suppliers.map(s => ({
        name: s.name,
        id: s.id,
        locutores: s.locutores.map(l => l.name),
        packages: s.packages.map(p => ({
            name: p.name,
            price: p.price,
            credits: p.credits,
            costPerCredit: p.costPerCredit,
            purchaseDate: p.purchaseDate
        }))
    }));

    fs.writeFileSync('diagnostic_output.json', JSON.stringify(output, null, 2));
    console.log('Diagnostic output written to diagnostic_output.json');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
