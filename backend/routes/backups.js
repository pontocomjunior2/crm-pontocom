const express = require('express');
const router = express.Router();
const prisma = require('../db');
const backupService = require('../services/backupService');

// Middleware to check if user is ADMIN
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    }
    next();
};

// GET /api/backups/config - Get current configuration
router.get('/config', isAdmin, async (req, res) => {
    try {
        let config = await prisma.backupConfig.findUnique({
            where: { id: 'default' }
        });

        if (!config) {
            config = await prisma.backupConfig.create({
                data: {
                    id: 'default',
                    enabled: false
                }
            });
        }

        // Mask the keys in the response
        const safeConfig = { ...config };
        if (safeConfig.serviceAccountKey && safeConfig.serviceAccountKey.trim() !== '') {
            try {
                const parsed = JSON.parse(safeConfig.serviceAccountKey);
                safeConfig.serviceAccountKey = JSON.stringify({
                    project_id: parsed.project_id,
                    client_email: parsed.client_email,
                    private_key: '******** (PROTEGIDA PELO SISTEMA)'
                }, null, 2);
            } catch (e) {
                // If it's not valid JSON but exists, show as masked anyway to avoid leakage if it's a raw string
                safeConfig.serviceAccountKey = '******** (VALOR EXISTENTE)';
            }
        }

        res.json(safeConfig);
    } catch (error) {
        console.error('GET config error:', error);
        res.status(500).json({ error: 'Falha ao buscar configuração de backup' });
    }
});

// PUT /api/backups/config - Update configuration
router.put('/config', isAdmin, async (req, res) => {
    try {
        const { folderId, serviceAccountKey, cronSchedule, keepDays, enabled } = req.body;

        // Prepare update data with basic fields
        const updateData = {
            folderId: folderId || null,
            cronSchedule: cronSchedule || '0 3 * * *',
            keepDays: parseInt(keepDays) || 7,
            enabled: !!enabled,
            updatedAt: new Date()
        };

        // Only update key if it's NOT masked and NOT empty
        const isNewKey = serviceAccountKey && !serviceAccountKey.includes('********') && serviceAccountKey.trim() !== '';
        if (isNewKey) {
            updateData.serviceAccountKey = serviceAccountKey;
        }

        console.log('Upserting BackupConfig with FolderId:', updateData.folderId);

        const config = await prisma.backupConfig.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                ...updateData,
                // If creating and no key provided, default to null or empty
                serviceAccountKey: isNewKey ? serviceAccountKey : null
            },
            update: updateData
        });

        res.json({ message: 'Configuração atualizada com sucesso', config: { ...config, serviceAccountKey: '********' } });
    } catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ error: 'Falha ao atualizar configuração' });
    }
});

// GET /api/backups/logs - List backup history
router.get('/logs', isAdmin, async (req, res) => {
    try {
        const logs = await prisma.backupLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const serializedLogs = logs.map(log => ({
            ...log,
            size: log.size ? log.size.toString() : null
        }));

        res.json(serializedLogs);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar logs de backup' });
    }
});

// POST /api/backups/trigger - Manual backup trigger
router.post('/trigger', isAdmin, async (req, res) => {
    try {
        const result = await backupService.runBackup();
        res.json({ message: 'Backup iniciado com sucesso', result });
    } catch (error) {
        console.error('Trigger backup error:', error);
        res.status(500).json({ error: 'Falha ao realizar backup manual', details: error.message });
    }
});

module.exports = router;
