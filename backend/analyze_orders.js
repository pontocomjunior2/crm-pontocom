const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- ANÁLISE DETALHADA DE PEDIDOS ---\n');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
        where: {
            date: { gte: thirtyDaysAgo },
            status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] }
        },
        include: {
            locutorObj: true
        },
        take: 50
    });

    console.log(`Analisando ${orders.length} pedidos...\n`);

    let avulsos = 0;
    let pacotes = 0;
    let recorrentes = 0;
    let recorrentesComComissao = 0;

    orders.forEach(order => {
        const isPackage = order.packageId !== null || order.packageBilling !== null;
        const isRecurring = order.serviceType === 'SERVIÇO RECORRENTE';
        const hasCommission = order.hasCommission === true;

        if (isPackage) {
            pacotes++;
            console.log(`[PACOTE] ID: ${order.id.substring(0, 8)} | PackageId: ${order.packageId ? 'SIM' : 'NÃO'} | PackageBilling: ${order.packageBilling ? 'SIM' : 'NÃO'}`);
        } else if (isRecurring) {
            if (hasCommission) {
                recorrentesComComissao++;
                console.log(`[RECORRENTE COM COMISSÃO] ID: ${order.id.substring(0, 8)} | ServiceType: ${order.serviceType}`);
            } else {
                recorrentes++;
                console.log(`[RECORRENTE SEM COMISSÃO] ID: ${order.id.substring(0, 8)} | ServiceType: ${order.serviceType}`);
            }
        } else {
            avulsos++;
            console.log(`[AVULSO] ID: ${order.id.substring(0, 8)} | Venda: R$ ${order.vendaValor} | Cache: R$ ${order.cacheValor}`);
        }
    });

    console.log('\n--- RESUMO ---');
    console.log(`Avulsos (comissionáveis): ${avulsos}`);
    console.log(`Pacotes (não comissionáveis): ${pacotes}`);
    console.log(`Recorrentes sem comissão: ${recorrentes}`);
    console.log(`Recorrentes com comissão: ${recorrentesComComissao}`);
    console.log(`\nTotal comissionável: ${avulsos + recorrentesComComissao}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
