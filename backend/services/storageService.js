const { google } = require('googleapis');
const fs = require('fs');
const prisma = require('../db');

/**
 * Service to handle file uploads to Google Drive for OS and PP documents
 * Reuses credentials from BackupConfig
 */
class StorageService {
    constructor() {
        this.drive = null;
        this.config = null;
    }

    /**
     * Load configuration from BackupConfig table
     */
    async loadConfig() {
        const config = await prisma.backupConfig.findUnique({
            where: { id: 'default' }
        });

        if (config && config.serviceAccountKey && config.serviceAccountKey.trim() !== '') {
            this.config = config;
            try {
                const credentials = JSON.parse(config.serviceAccountKey);
                const auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/drive.file'],
                });
                this.drive = google.drive({ version: 'v3', auth });
            } catch (err) {
                console.error('[StorageService] Failed to parse Google Service Account Key:', err.message);
                this.drive = null;
            }
        } else {
            this.drive = null;
        }
        return config;
    }

    /**
     * Get or create a specific subfolder within the main backup folder
     * @param {string} folderName 
     * @returns {Promise<string>} Folder ID
     */
    async getOrCreateFolder(folderName) {
        if (!this.drive || !this.config) return null;

        const parentId = this.config.folderId;
        const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentId ? ` and '${parentId}' in parents` : ''}`;

        try {
            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id)',
                spaces: 'drive',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            if (response.data.files && response.data.files.length > 0) {
                return response.data.files[0].id;
            }

            // Create if not exists
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentId ? [parentId] : []
            };

            const folder = await this.drive.files.create({
                resource: fileMetadata,
                fields: 'id',
                supportsAllDrives: true
            });

            return folder.data.id;
        } catch (error) {
            console.error(`[StorageService] Error getting/creating folder ${folderName}:`, error.message);
            return parentId; // Fallback to main folder
        }
    }

    /**
     * Upload a file to Google Drive and return its public URL
     * @param {string} filePath Local path to the file
     * @param {string} filename Name of the file on Drive
     * @returns {Promise<{id: string, webViewLink: string}>}
     */
    async uploadFile(filePath, filename) {
        await this.loadConfig();

        if (!this.drive || !this.config) {
            throw new Error('Google Drive integration not configured in Backup Settings');
        }

        // Use specific CRM Files folder
        const targetFolderId = await this.getOrCreateFolder('Arquivos-CRM');

        const fileMetadata = {
            name: filename,
            parents: targetFolderId ? [targetFolderId] : []
        };

        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(filePath)
        };

        try {
            // Upload file
            const file = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, webViewLink',
                supportsAllDrives: true
            });

            const fileId = file.data.id;

            // Make file readable by anyone with the link (optional but recommended for easy viewing)
            try {
                await this.drive.permissions.create({
                    fileId: fileId,
                    resource: {
                        role: 'reader',
                        type: 'anyone',
                    },
                    supportsAllDrives: true
                });

                // Get the updated link after permission change
                const updatedFile = await this.drive.files.get({
                    fileId: fileId,
                    fields: 'webViewLink',
                    supportsAllDrives: true
                });

                return {
                    id: fileId,
                    webViewLink: updatedFile.data.webViewLink
                };
            } catch (permError) {
                console.warn('[StorageService] Could not set public permission, link might require login:', permError.message);
                return {
                    id: fileId,
                    webViewLink: file.data.webViewLink
                };
            }
        } catch (error) {
            console.error('[StorageService] Upload error:', error);
            throw error;
        }
    }

    /**
     * Delete a file from Google Drive
     * @param {string} fileId
     */
    async deleteFile(fileId) {
        await this.loadConfig();
        if (!this.drive) return;

        try {
            await this.drive.files.delete({
                fileId: fileId,
                supportsAllDrives: true
            });
        } catch (error) {
            console.error('[StorageService] Delete error:', error.message);
        }
    }
}

module.exports = new StorageService();
