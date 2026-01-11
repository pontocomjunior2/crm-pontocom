const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'junior@pontocomaudio.net';
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error('❌ ADMIN_PASSWORD não está definido no arquivo .env');
            console.error('   Adicione: ADMIN_PASSWORD=SuaSenhaSegura');
            process.exit(1);
        }

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            console.log('ℹ️  Admin já existe. Atualizando senha...');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await prisma.user.update({
                where: { email: adminEmail },
                data: { password: hashedPassword }
            });

            console.log('✅ Senha do admin atualizada com sucesso!');
            console.log('📧 Email:', adminEmail);
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'Admin',
                role: 'ADMIN'
            }
        });

        console.log('✅ Usuário admin criado com sucesso!');
        console.log('📧 Email:', adminEmail);
    } catch (error) {
        console.error('❌ Erro ao criar/atualizar admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
