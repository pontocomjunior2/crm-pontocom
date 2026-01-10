const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'junior@pontocomaudio.net';
    const adminPassword = 'Conquista@@2';

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (existingAdmin) {
        console.log('Admin user already exists.');
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
        data: {
            email: adminEmail,
            password: hashedPassword,
            name: 'Administrador Pontocom',
            role: 'ADMIN'
        }
    });

    console.log('Admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminPassword} (Please change after first login)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
