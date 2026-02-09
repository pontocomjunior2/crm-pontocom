const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPerformance() {
    console.log('--- Teste de Performance: Locutores ---');

    // Teste 1: Rota Original (Simulando include pesado)
    const start1 = Date.now();
    const fullList = await prisma.locutor.findMany({
        include: {
            orders: {
                select: { id: true, title: true, date: true, status: true },
                orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
            },
            suppliers: {
                include: {
                    packages: {
                        orderBy: { purchaseDate: 'desc' },
                        take: 1
                    }
                }
            }
        }
    });
    const end1 = Date.now();
    console.log(`Rota Original: ${fullList.length} locutores em ${end1 - start1}ms`);
    if (fullList.length > 0 && fullList[0].orders) {
        console.log(`Exemplo: Primeiro locutor tinha ${fullList[0].orders.length} pedidos no cache.`);
    }

    // Teste 2: Rota Otimizada (Selection)
    const start2 = Date.now();
    const selectionList = await prisma.locutor.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            realName: true,
            status: true,
            priceOff: true,
            priceProduzido: true,
            valorFixoMensal: true,
            suppliers: {
                include: {
                    packages: {
                        orderBy: { purchaseDate: 'desc' },
                        take: 1
                    }
                }
            }
        }
    });
    const end2 = Date.now();
    console.log(`Rota Otimizada (Selection): ${selectionList.length} locutores em ${end2 - start2}ms`);

    // Teste 3: Rota com limite de 10
    const start3 = Date.now();
    const limitedList = await prisma.locutor.findMany({
        include: {
            orders: {
                select: { id: true, title: true, date: true, status: true },
                orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
                take: 10
            }
        }
    });
    const end3 = Date.now();
    console.log(`Rota com Limite (take: 10): ${limitedList.length} locutores em ${end3 - start3}ms`);

    await prisma.$disconnect();
}

testPerformance().catch(console.error);
