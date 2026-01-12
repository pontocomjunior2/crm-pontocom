const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const config = await prisma.backupConfig.findUnique({
            where: { id: 'default' }
        });
        console.log('--- BACKUP CONFIG IN DB ---');
        console.log(JSON.stringify(config, (key, value) => {
            if (key === 'serviceAccountKey' && value) return value.substring(0, 20) + '...';
            return value;
        }, 2));

        const logs = await prisma.backupLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
        console.log('\n--- LAST 5 LOGS ---');
        console.log(logs.map(l => ({
            id: l.id,
            status: l.status,
            error: l.error,
            filename: l.filename
        })));

    } catch (e) {
        console.error('DEBUG ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
