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

// ==================== SCHEDULE ROUTES ====================

// GET /api/backups/schedules - List all schedules
router.get('/schedules', isAdmin, async (req, res) => {
    try {
        const schedules = await prisma.backupSchedule.findMany({
            where: { configId: 'default' },
            orderBy: [{ hour: 'asc' }, { minute: 'asc' }]
        });

        // Parse days JSON for each schedule
        const parsed = schedules.map(s => ({
            ...s,
            days: JSON.parse(s.days)
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({ error: 'Falha ao buscar agendamentos' });
    }
});

// POST /api/backups/schedules - Create new schedule
router.post('/schedules', isAdmin, async (req, res) => {
    try {
        const { hour, minute, days, enabled } = req.body;

        // Validation
        if (hour < 0 || hour > 23) {
            return res.status(400).json({ error: 'Hora deve estar entre 0 e 23' });
        }
        if (minute < 0 || minute > 59) {
            return res.status(400).json({ error: 'Minuto deve estar entre 0 e 59' });
        }
        if (!Array.isArray(days) || days.length === 0) {
            return res.status(400).json({ error: 'Selecione pelo menos um dia da semana' });
        }

        const schedule = await prisma.backupSchedule.create({
            data: {
                configId: 'default',
                hour: parseInt(hour),
                minute: parseInt(minute),
                days: JSON.stringify(days),
                enabled: !!enabled
            }
        });

        res.json({ ...schedule, days: JSON.parse(schedule.days) });
    } catch (error) {
        console.error('Create schedule error:', error);
        res.status(500).json({ error: 'Falha ao criar agendamento' });
    }
});

// PUT /api/backups/schedules/:id - Update schedule
router.put('/schedules/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { hour, minute, days, enabled } = req.body;

        const updateData = {};
        if (hour !== undefined) updateData.hour = parseInt(hour);
        if (minute !== undefined) updateData.minute = parseInt(minute);
        if (days !== undefined) updateData.days = JSON.stringify(days);
        if (enabled !== undefined) updateData.enabled = !!enabled;

        const schedule = await prisma.backupSchedule.update({
            where: { id },
            data: updateData
        });

        res.json({ ...schedule, days: JSON.parse(schedule.days) });
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ error: 'Falha ao atualizar agendamento' });
    }
});

// DELETE /api/backups/schedules/:id - Delete schedule
router.delete('/schedules/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.backupSchedule.delete({ where: { id } });
        res.json({ message: 'Agendamento removido com sucesso' });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({ error: 'Falha ao remover agendamento' });
    }
});

module.exports = router;
