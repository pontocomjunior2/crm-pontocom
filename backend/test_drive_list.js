const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDrive() {
    const config = await prisma.backupConfig.findUnique({
        where: { id: 'default' }
    });

    if (!config || !config.serviceAccountKey) {
        console.error('No backup config found');
        return;
    }

    const credentials = JSON.parse(config.serviceAccountKey);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const keepDays = config.keepDays || 7;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - keepDays);

    console.log('Keep Days:', keepDays);
    console.log('Expiration Date:', expirationDate.toISOString());

    const queries = [
        `name contains 'backup-' and name contains '.dump'`,
        `name contains 'backup' and name contains 'dump'`,
        `name contains 'backup'`
    ];

    for (const q of queries) {
        const fullQuery = `${q} ${config.folderId ? `and '${config.folderId}' in parents` : ''} and trashed = false`;
        console.log(`\nTesting query: ${fullQuery}`);
        try {
            const response = await drive.files.list({
                q: fullQuery,
                fields: 'files(id, name, createdTime)',
                orderBy: 'createdTime desc',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
                pageSize: 10
            });

            console.log(`Found ${response.data.files.length} files:`);
            response.data.files.forEach(f => {
                const created = new Date(f.createdTime);
                const isExpired = created < expirationDate;
                console.log(`- ${f.name} (Created: ${f.createdTime}) [Expired: ${isExpired}]`);
            });
        } catch (err) {
            console.error(`Query failed: ${err.message}`);
        }
    }
}

testDrive().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
