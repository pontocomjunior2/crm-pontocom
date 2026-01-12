const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const prisma = require('../db');

/**
 * Service to handle database backups and Google Drive integration
 */
class BackupService {
    constructor() {
        this.drive = null;
        this.config = null;
    }

    /**
     * Load configuration from database and initialize Google Drive client
     */
    async loadConfig() {
        const config = await prisma.backupConfig.findUnique({
            where: { id: 'default' }
        });

        if (config && config.serviceAccountKey && config.serviceAccountKey.trim() !== '') {
            this.config = config;
            try {
                // Ensure the string is not empty or just whitespace before parsing
                const credentials = JSON.parse(config.serviceAccountKey);
                const auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/drive.file'],
                });
                this.drive = google.drive({ version: 'v3', auth });
            } catch (err) {
                console.error('Failed to parse Google Service Account Key:', err.message);
                this.drive = null;
            }
        } else {
            this.drive = null;
        }
        return config;
    }

    /**
     * Execute pg_dump and return file path
     */
    async createDump() {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-${timestamp}.dump`;
            const filePath = path.join(__dirname, '../backups', filename);

            if (!fs.existsSync(path.join(__dirname, '../backups'))) {
                fs.mkdirSync(path.join(__dirname, '../backups'), { recursive: true });
            }

            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) return reject(new Error('DATABASE_URL not found in environment'));

            try {
                // Remove 'postgresql://' or 'postgres://' for URL parser if needed, 
                // but new URL() handles it if it's well-formed.
                const url = new URL(dbUrl.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
                const user = url.username;
                const password = url.password;
                const host = url.hostname;
                const port = url.port || '5432';
                const database = url.pathname.split('/')[1];

                if (!user || !password || !host || !database) {
                    throw new Error('Missing database connection components');
                }

                const env = { ...process.env, PGPASSWORD: password };
                const cmd = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F c -f "${filePath}"`;

                exec(cmd, { env }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('pg_dump error:', stderr);
                        return reject(new Error(`pg_dump failed: ${stderr || error.message}`));
                    }
                    resolve({ filePath, filename });
                });
            } catch (urlErr) {
                console.error('DATABASE_URL parsing failed:', urlErr.message);
                return reject(new Error('Invalid DATABASE_URL format. Please check your .env file.'));
            }
        });
    }

    /**
     * Upload file to Google Drive
     */
    async uploadToDrive(filePath, filename) {
        if (!this.drive || !this.config) {
            throw new Error('Google Drive client not initialized or configuration missing');
        }

        const fileMetadata = {
            name: filename,
            parents: this.config.folderId ? [this.config.folderId] : []
        };
        const media = {
            mimeType: 'application/octet-stream',
            body: fs.createReadStream(filePath)
        };

        try {
            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, size',
                supportsAllDrives: true
            });
            return response.data;
        } catch (error) {
            console.error('Google Drive upload error:', error);
            throw error;
        }
    }

    /**
     * Clean up local and remote backups (rotation)
     */
    async rotateBackups() {
        if (!this.drive || !this.config) return;

        const keepDays = this.config.keepDays || 7;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - keepDays);

        // List and delete remote backups
        try {
            const query = `name contains 'backup-' and name contains '.dump' ${this.config.folderId ? `and '${this.config.folderId}' in parents` : ''}`;
            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id, name, createdTime)',
                orderBy: 'createdTime desc',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            if (response.data.files) {
                for (const file of response.data.files) {
                    const createdTime = new Date(file.createdTime);
                    if (createdTime < expirationDate) {
                        console.log(`Deleting expired Drive backup: ${file.name}`);
                        await this.drive.files.delete({ fileId: file.id });
                    }
                }
            }
        } catch (error) {
            console.error('Rotation error (Google Drive):', error);
        }

        // Clean local folder
        const localDir = path.join(__dirname, '../backups');
        if (fs.existsSync(localDir)) {
            const files = fs.readdirSync(localDir);
            files.forEach(file => {
                const filePath = path.join(localDir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtime < expirationDate) {
                    console.log(`Deleting expired local backup: ${file}`);
                    fs.unlinkSync(filePath);
                }
            });
        }
    }

    /**
     * Run full backup process
     */
    async runBackup() {
        console.log('--- Starting Database Backup Process (Google Drive) ---');
        let filename = '';
        let filePath = '';

        try {
            await this.loadConfig();

            if (!this.config || !this.config.enabled) {
                console.log('Backup is disabled or not configured correctly.');
                return;
            }

            const dumpInfo = await this.createDump();
            filename = dumpInfo.filename;
            filePath = dumpInfo.filePath;

            console.log(`Dump created: ${filename}`);

            const driveFile = await this.uploadToDrive(filePath, filename);
            const size = parseInt(driveFile.size);
            console.log(`Uploaded to Google Drive. File ID: ${driveFile.id}`);

            await prisma.backupLog.create({
                data: {
                    filename,
                    size: BigInt(size),
                    status: 'SUCCESS'
                }
            });

            await this.rotateBackups();
            console.log('Backup process completed successfully.');

            return { success: true, filename, driveId: driveFile.id };
        } catch (error) {
            console.error('Backup process FAILED:', error);

            await prisma.backupLog.create({
                data: {
                    filename: filename || 'error-dump.sql',
                    status: 'FAILED',
                    error: error.message
                }
            });

            throw error;
        }
    }
}

module.exports = new BackupService();
