const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- VERIFICANDO CONFIGURAÇÃO FINANCEIRA ---\n');

    const config = await prisma.financialConfig.findUnique({
        where: { id: 'default' }
    });

    if (config) {
        console.log('Configuração encontrada:');
        console.log(`  Tax Rate: ${Number(config.taxRate) * 100}%`);
        console.log(`  Commission Rate: ${Number(config.commissionRate) * 100}%`);
    } else {
        console.log('⚠️  Nenhuma configuração encontrada!');
        console.log('Criando configuração padrão...\n');

        const newConfig = await prisma.financialConfig.create({
            data: {
                id: 'default',
                taxRate: 0.10,
                commissionRate: 0.04
            }
        });

        console.log('Configuração criada:');
        console.log(`  Tax Rate: ${Number(newConfig.taxRate) * 100}%`);
        console.log(`  Commission Rate: ${Number(newConfig.commissionRate) * 100}%`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
