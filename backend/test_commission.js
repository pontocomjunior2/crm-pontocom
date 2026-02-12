const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- TESTANDO CÁLCULO DE COMISSÃO ---\n');

    // Buscar configuração
    const config = await prisma.financialConfig.findUnique({
        where: { id: 'default' }
    });

    const commissionRate = config?.commissionRate ? Number(config.commissionRate) : 0.04;
    console.log(`Taxa de Comissão: ${commissionRate * 100}%\n`);

    // Buscar pedidos (últimos 30 dias como exemplo)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
        where: {
            date: { gte: thirtyDaysAgo },
            status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] }
        },
        include: {
            locutorObj: true
        }
    });

    console.log(`Total de pedidos (últimos 30 dias): ${orders.length}\n`);

    // Calcular lucro comissionável
    let commissionableProfit = 0;
    let totalRevenue = 0;
    let totalCosts = 0;

    const locutorMonthCounts = {};
    orders.forEach(order => {
        if (order.locutorId && order.locutorObj?.valorFixoMensal > 0 && Number(order.cacheValor) === 0) {
            const month = new Date(order.date).toISOString().substring(0, 7);
            const key = `${order.locutorId}_${month}`;
            locutorMonthCounts[key] = (locutorMonthCounts[key] || 0) + 1;
        }
    });

    orders.forEach(order => {
        const revenue = Number(order.vendaValor);
        let cost = Number(order.cacheValor);

        if (order.locutorId && order.locutorObj?.valorFixoMensal > 0 && Number(order.cacheValor) === 0) {
            const month = new Date(order.date).toISOString().substring(0, 7);
            const key = `${order.locutorId}_${month}`;
            const count = locutorMonthCounts[key] || 1;
            cost = Number(order.locutorObj.valorFixoMensal) / count;
        }

        if (['VENDA', 'FATURADO'].includes(order.status)) {
            totalRevenue += revenue;
        }
        totalCosts += cost;

        const isRecurring = order.serviceType === 'SERVIÇO RECORRENTE';
        const hasCommissionFlag = order.hasCommission === true;

        // NOVA LÓGICA: Incluir TODOS (pacotes + avulsos + recorrentes com flag)
        const shouldCommission = !isRecurring || hasCommissionFlag;

        if (shouldCommission) {
            commissionableProfit += (revenue - cost);
        }
    });

    const commission = commissionableProfit > 0 ? commissionableProfit * commissionRate : 0;

    console.log('RESULTADOS:');
    console.log(`  Receita Total: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`  Custos Totais: R$ ${totalCosts.toFixed(2)}`);
    console.log(`  Lucro Comissionável: R$ ${commissionableProfit.toFixed(2)}`);
    console.log(`  Comissão (${commissionRate * 100}%): R$ ${commission.toFixed(2)}`);

    if (commission === 0) {
        console.log('\n⚠️  COMISSÃO = 0');
        console.log('Possíveis causas:');
        console.log('  - Lucro comissionável é zero ou negativo');
        console.log('  - Todos os pedidos são de pacotes/recorrentes sem flag hasCommission');
        console.log('  - Não há pedidos no período');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
