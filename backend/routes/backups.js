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
            // Create default config if not exists
            config = await prisma.backupConfig.create({
                data: {
                    id: 'default',
                    endpoint: '',
                    accessKey: '',
                    secretKey: '',
                    bucket: '',
                    enabled: false
                }
            });
        }

        // Don't send secret key to frontend (or send a placeholder)
        const safeConfig = { ...config };
        if (safeConfig.secretKey) safeConfig.secretKey = '********';

        res.json(safeConfig);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar configuração de backup' });
    }
});

// PUT /api/backups/config - Update configuration
router.put('/config', isAdmin, async (req, res) => {
    try {
        const { endpoint, accessKey, secretKey, bucket, region, cronSchedule, keepDays, enabled } = req.body;

        const updateData = {
            endpoint,
            accessKey,
            bucket,
            region,
            cronSchedule,
            keepDays: parseInt(keepDays),
            enabled
        };

        // Only update secretKey if it's not the placeholder
        if (secretKey && secretKey !== '********') {
            updateData.secretKey = secretKey;
        }

        const config = await prisma.backupConfig.upsert({
            where: { id: 'default' },
            create: { id: 'default', ...updateData, secretKey: secretKey || '' },
            update: updateData
        });

        res.json({ message: 'Configuração atualizada com sucesso', config });
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

        // Convert BigInt to string for JSON
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
        res.status(500).json({ error: 'Falha ao realizar backup manual', details: error.message });
    }
});

module.exports = router;
