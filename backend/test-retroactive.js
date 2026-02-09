const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PackageService = require('./services/packageService');

async function testRetroactiveBilling() {
    console.log('--- TESTE DE FATURAMENTO RETROATIVO NA EDIÇÃO ---');

    // 1. Criar um cliente de teste
    let client = await prisma.client.findFirst({ where: { name: 'CLIENTE TESTE RETROATIVO' } });
    if (!client) {
        client = await prisma.client.create({
            data: {
                name: 'CLIENTE TESTE RETROATIVO',
                cnpj_cpf: '00000000002'
            }
        });
    }

    // 2. Criar um pacote SEM faturamento (ex: FIXO_ILIMITADO com fixedFee 0)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const pkg = await prisma.clientPackage.create({
        data: {
            clientId: client.id,
            name: 'PACOTE SEM FATURAMENTO',
            type: 'FIXO_ILIMITADO',
            fixedFee: 0,
            audioLimit: 0,
            startDate,
            endDate,
            active: true
        }
    });

    console.log(`Pacote criado sem faturamento: ${pkg.id}`);

    // 3. Adicionar pedidos a este pacote
    await prisma.order.createMany({
        data: [
            { clientId: client.id, packageId: pkg.id, title: 'Audio Retro 1', status: 'VENDA', serviceType: 'PACOTE DE AUDIOS', creditsConsumed: 1, vendaValor: 0, cacheValor: 0, locutor: 'SISTEMA', tipo: 'OFF', date: startDate },
            { clientId: client.id, packageId: pkg.id, title: 'Audio Retro 2', status: 'VENDA', serviceType: 'PACOTE DE AUDIOS', creditsConsumed: 4, vendaValor: 0, cacheValor: 0, locutor: 'SISTEMA', tipo: 'OFF', date: startDate }, // 5 créditos total
        ]
    });

    console.log('Pedidos retroativos criados. Agora simulando EDIÇÃO para SOB_DEMANDA_AVULSO...');

    // 4. Simular a lógica da rota PUT (vou chamar os métodos diretamente para testar o fluxo de dados)
    // Na rota, faríamos: update do pacote -> criação da billingOrder -> syncPackage

    const updateData = {
        type: 'SOB_DEMANDA_AVULSO',
        extraAudioFee: 10.00 // R$ 10 por áudio
    };

    const updated = await prisma.clientPackage.update({
        where: { id: pkg.id },
        data: updateData
    });

    // Lógica de criação de BillingOrder (copiada da rota para teste isolado)
    let updatedBillingOrderId = updated.billingOrderId;
    if (!updatedBillingOrderId) {
        const lastOrder = await prisma.order.findFirst({
            where: { numeroVenda: { not: null } },
            orderBy: { numeroVenda: 'desc' }
        });
        const nextNumeroVenda = (lastOrder?.numeroVenda || 1000) + 1;

        const newBillingResponse = await prisma.order.create({
            data: {
                clientId: updated.clientId,
                title: updated.name,
                vendaValor: updated.fixedFee,
                date: updated.startDate,
                dataFaturar: new Date(updated.endDate.getTime() + 86400000),
                status: 'PENDENTE',
                serviceType: 'MENSALIDADE',
                numeroVenda: nextNumeroVenda,
                locutor: 'SISTEMA',
                tipo: 'OFF',
                cacheValor: 0
            }
        });

        updatedBillingOrderId = newBillingResponse.id;
        await prisma.clientPackage.update({
            where: { id: updated.id },
            data: { billingOrderId: updatedBillingOrderId }
        });
        console.log(`BillingOrder criado na edição: ${updatedBillingOrderId}`);
    }

    // 5. Forçar sincronização retroativa
    await PackageService.syncPackage(pkg.id);

    // 6. Verificar resultado
    const finalPkg = await prisma.clientPackage.findUnique({
        where: { id: pkg.id },
        include: { billingOrder: true }
    });

    console.log(`Uso total detectado: ${finalPkg.usedAudios}`);
    console.log(`Valor do faturamento gerado: R$ ${finalPkg.billingOrder?.vendaValor}`);

    const expectedValue = 5 * 10.00; // 5 áudios * 10.00
    if (finalPkg.billingOrder && Math.abs(finalPkg.billingOrder.vendaValor - expectedValue) < 0.01) {
        console.log('✅ SUCESSO: O faturamento retroativo foi gerado e calculado corretamente!');
    } else {
        console.log(`❌ ERRO: Falha no faturamento retroativo. Esperado: ${expectedValue}, Recebido: ${finalPkg.billingOrder?.vendaValor}`);
    }

    // Limpeza
    await prisma.order.deleteMany({ where: { packageId: pkg.id } });
    await prisma.clientPackage.delete({ where: { id: pkg.id } });
    await prisma.order.delete({ where: { id: updatedBillingOrderId } });
}

testRetroactiveBilling()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
