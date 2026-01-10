const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('Seeding data...');

        // Create an Admin user (optional but good for testing)
        // Note: Password is 'admin123'
        const adminEmail = 'admin@pontocom.com.br';
        const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (!existingUser) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: 'Admin',
                    role: 'ADMIN'
                }
            });
            console.log('Admin user created.');
        }

        // Create some test clients
        const client1 = await prisma.client.create({
            data: {
                name: 'Cliente Teste 1',
                razaoSocial: 'Empresa Teste LTDA',
                cnpj_cpf: '12345678000199',
                status: 'ativado'
            }
        });

        const client2 = await prisma.client.create({
            data: {
                name: 'Cliente Teste 2',
                razaoSocial: 'Comercio Exemplo ME',
                cnpj_cpf: '98765432000111',
                status: 'ativado'
            }
        });

        console.log(`Created clients: ${client1.name}, ${client2.name}`);

        // Create a test order
        await prisma.order.create({
            data: {
                title: 'Spot Comercial Teste',
                clientId: client1.id,
                locutor: 'Locutor Exemplo',
                tipo: 'OFF',
                cacheValor: 50.00,
                vendaValor: 150.00,
                status: 'PEDIDO'
            }
        });

        console.log('Seed completed successfully!');
    } catch (error) {
        console.error('Error seeding:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
