// Test script to verify backup scheduler is working
const prisma = require('./db');

async function testScheduler() {
    console.log('=== Testing Backup Scheduler ===\n');

    // Check BackupConfig
    const config = await prisma.backupConfig.findUnique({
        where: { id: 'default' },
        include: { schedules: true }
    });

    console.log('Backup Config:');
    console.log('  Enabled:', config?.enabled || false);
    console.log('  Folder ID:', config?.folderId || 'Not set');
    console.log('  Keep Days:', config?.keepDays || 7);
    console.log('');

    // Check Schedules
    console.log('Active Schedules:');
    if (config?.schedules && config.schedules.length > 0) {
        config.schedules.forEach((schedule, index) => {
            const days = JSON.parse(schedule.days);
            const daysNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const daysStr = days.map(d => daysNames[d]).join(', ');
            console.log(`  ${index + 1}. ${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')} [${daysStr}] - ${schedule.enabled ? 'ATIVO' : 'INATIVO'}`);
        });
    } else {
        console.log('  No schedules found');
    }

    await prisma.$disconnect();
}

testScheduler().catch(console.error);
