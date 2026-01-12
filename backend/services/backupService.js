const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const prisma = require('../db');

/**
 * Service to handle database backups and MinIO integration
 */
class BackupService {
    constructor() {
        this.client = null;
        this.config = null;
    }

    /**
     * Load configuration from database
     */
    async loadConfig() {
        const config = await prisma.backupConfig.findUnique({
            where: { id: 'default' }
        });
        if (config) {
            this.config = config;
            this.client = new S3Client({
                endpoint: config.endpoint,
                region: config.region,
                credentials: {
                    accessKeyId: config.accessKey,
                    secretAccessKey: config.secretKey,
                },
                forcePathStyle: true, // Required for MinIO
            });
        }
        return config;
    }

    /**
     * Execute pg_dump and return file path
     */
    async createDump() {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-${timestamp}.sql`;
            const filePath = path.join(__dirname, '../backups', filename);

            if (!fs.existsSync(path.join(__dirname, '../backups'))) {
                fs.mkdirSync(path.join(__dirname, '../backups'), { recursive: true });
            }

            // Extract connection info from DATABASE_URL
            const dbUrl = process.env.DATABASE_URL;
            // Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
            const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
            const match = dbUrl.match(regex);

            if (!match) {
                return reject(new Error('Invalid DATABASE_URL format'));
            }

            const [_, user, password, host, port, database] = match;

            // Set PGPASSWORD env var for the command
            const env = { ...process.env, PGPASSWORD: password };
            const cmd = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F p -f "${filePath}"`;

            exec(cmd, { env }, (error, stdout, stderr) => {
                if (error) {
                    console.error('pg_dump error:', stderr);
                    return reject(error);
                }
                resolve({ filePath, filename });
            });
        });
    }

    /**
     * Upload file to MinIO
     */
    async uploadToMinio(filePath, filename) {
        if (!this.client || !this.config) {
            throw new Error('Backup configuration not loaded or missing');
        }

        const fileStream = fs.createReadStream(filePath);
        const stats = fs.statSync(filePath);

        const uploadParams = {
            Bucket: this.config.bucket,
            Key: `backups/${filename}`,
            Body: fileStream,
            ContentLength: stats.size,
        };

        try {
            await this.client.send(new PutObjectCommand(uploadParams));
            return stats.size;
        } catch (error) {
            console.error('MinIO upload error:', error);
            throw error;
        }
    }

    /**
     * Clean up local and remote backups (rotation)
     */
    async rotateBackups() {
        if (!this.client || !this.config) return;

        const keepDays = this.config.keepDays || 7;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - keepDays);

        // List remote backups
        try {
            const listParams = {
                Bucket: this.config.bucket,
                Prefix: 'backups/',
            };
            const data = await this.client.send(new ListObjectsV2Command(listParams));

            if (data.Contents) {
                for (const item of data.Contents) {
                    if (item.LastModified < expirationDate) {
                        console.log(`Deleting expired remote backup: ${item.Key}`);
                        await this.client.send(new DeleteObjectCommand({
                            Bucket: this.config.bucket,
                            Key: item.Key
                        }));
                    }
                }
            }
        } catch (error) {
            console.error('Rotation error (MinIO):', error);
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
        console.log('--- Starting Database Backup Process ---');
        let filename = '';
        let filePath = '';

        try {
            await this.loadConfig();

            if (!this.config || !this.config.enabled) {
                console.log('Backup is disabled or not configured.');
                return;
            }

            const dumpInfo = await this.createDump();
            filename = dumpInfo.filename;
            filePath = dumpInfo.filePath;

            console.log(`Dump created: ${filename}`);

            const size = await this.uploadToMinio(filePath, filename);
            console.log(`Uploaded to MinIO. Size: ${size} bytes`);

            await prisma.backupLog.create({
                data: {
                    filename,
                    size: BigInt(size),
                    status: 'SUCCESS'
                }
            });

            await this.rotateBackups();
            console.log('Backup process completed successfully.');

            return { success: true, filename };
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
