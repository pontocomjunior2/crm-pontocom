const prisma = require('../db');

async function fixPackageCredits() {
    console.log('🔧 Iniciando correção de créditos de pacotes...\n');

    try {
        const packages = await prisma.clientPackage.findMany({
            include: {
                orders: {
                    where: {
                        status: { not: 'CANCELADO' }
                    },
                    select: {
                        id: true,
                        creditsConsumed: true,
                        fileName: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        let fixed = 0;
        let checked = 0;

        for (const pkg of packages) {
            const realUsage = pkg.orders.reduce((sum, order) => {
                return sum + (order.creditsConsumed || 0);
            }, 0);

            if (pkg.usedAudios !== realUsage) {
                console.log(`📦 Pacote: ${pkg.name} (ID: ${pkg.id})`);
                console.log(`   Cliente: ${pkg.client?.name || 'N/A'}`);
                console.log(`   Antes: ${pkg.usedAudios} créditos`);
                console.log(`   Depois: ${realUsage} créditos`);
                console.log(`   Diferença: ${realUsage - pkg.usedAudios}`);
                console.log(`   Total de pedidos: ${pkg.orders.length}\n`);

                await prisma.clientPackage.update({
                    where: { id: pkg.id },
                    data: { usedAudios: realUsage }
                });

                fixed++;
            }
            checked++;
        }

        console.log(`\n✅ Correção concluída!`);
        console.log(`   Pacotes verificados: ${checked}`);
        console.log(`   Pacotes corrigidos: ${fixed}`);
        console.log(`   Pacotes OK: ${checked - fixed}`);

    } catch (error) {
        console.error('❌ Erro durante a correção:', error);
        throw error;
    }
}

fixPackageCredits()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
