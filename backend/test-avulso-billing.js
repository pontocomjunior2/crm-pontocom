const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PackageService = require('./services/packageService');

async function testAvulsoBilling() {
    console.log('--- TESTE DE FATURAMENTO AVULSO ---');

    // 1. Criar um cliente de teste se não existir
    let client = await prisma.client.findFirst({ where: { name: 'CLIENTE TESTE AVULSO' } });
    if (!client) {
        client = await prisma.client.create({
            data: {
                name: 'CLIENTE TESTE AVULSO',
                cnpj_cpf: '00000000001'
            }
        });
    }

    // 2. Criar um pacote SOB_DEMANDA_AVULSO
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Criar a billingOrder primeiro para simular o comportamento da rota
    const billingOrder = await prisma.order.create({
        data: {
            clientId: client.id,
            title: 'FATURAMENTO AVULSO TESTE',
            status: 'PENDENTE',
            vendaValor: 0,
            cacheValor: 0,
            locutor: 'SISTEMA',
            tipo: 'OFF',
            serviceType: 'MENSALIDADE',
            date: startDate
        }
    });

    const pkg = await prisma.clientPackage.create({
        data: {
            clientId: client.id,
            name: 'PACOTE AVULSO TESTE',
            type: 'SOB_DEMANDA_AVULSO',
            fixedFee: 0,
            audioLimit: 0,
            extraAudioFee: 15.50,
            startDate,
            endDate,
            active: true,
            billingOrderId: billingOrder.id
        }
    });

    console.log(`Pacote criado: ${pkg.id} (Tipo: ${pkg.type}, Extra: ${pkg.extraAudioFee})`);

    // 3. Adicionar pedidos ao pacote
    await prisma.order.createMany({
        data: [
            { clientId: client.id, packageId: pkg.id, title: 'Audio 1', status: 'VENDA', serviceType: 'PACOTE DE AUDIOS', creditsConsumed: 1, vendaValor: 0, cacheValor: 0, locutor: 'SISTEMA', tipo: 'OFF', date: startDate },
            { clientId: client.id, packageId: pkg.id, title: 'Audio 2', status: 'VENDA', serviceType: 'PACOTE DE AUDIOS', creditsConsumed: 2, vendaValor: 0, cacheValor: 0, locutor: 'SISTEMA', tipo: 'OFF', date: startDate }, // 2 créditos
        ]
    });

    console.log('Pedidos criados. Sincronizando pacote...');

    // 4. Sincronizar
    await PackageService.syncPackage(pkg.id);

    // 5. Verificar resultado
    const updatedPkg = await prisma.clientPackage.findUnique({
        where: { id: pkg.id },
        include: { billingOrder: true }
    });

    console.log(`Uso total: ${updatedPkg.usedAudios}`);
    console.log(`Valor do faturamento: R$ ${updatedPkg.billingOrder.vendaValor}`);

    const expectedValue = 3 * 15.50; // 3 áudios * 15.50
    if (Math.abs(updatedPkg.billingOrder.vendaValor - expectedValue) < 0.01) {
        console.log('✅ SUCESSO: O faturamento foi calculado corretamente!');
    } else {
        console.log(`❌ ERRO: Faturamento incorreto. Esperado: ${expectedValue}, Recebido: ${updatedPkg.billingOrder.vendaValor}`);
    }

    // Limpeza
    await prisma.order.deleteMany({ where: { packageId: pkg.id } });
    await prisma.clientPackage.delete({ where: { id: pkg.id } });
    await prisma.order.delete({ where: { id: billingOrder.id } });
}

testAvulsoBilling()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
