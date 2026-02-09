const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Listar notificações pendentes
router.get('/', async (req, res) => {
    try {
        const { targetRole } = req.query;

        if (!targetRole) {
            return res.status(400).json({ error: 'Role alvo é obrigatória' });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                targetRole: targetRole,
                read: false
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(notifications);
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

// Marcar como lida
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id },
            data: { read: true }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar notificação:', error);
        res.status(500).json({ error: 'Erro ao atualizar notificação' });
    }
});

// Rota de resumo (contagem)
router.get('/summary', async (req, res) => {
    try {
        const { targetRole } = req.query;

        if (!targetRole) {
            return res.status(400).json({ error: 'Role alvo é obrigatória' });
        }

        const count = await prisma.notification.count({
            where: {
                targetRole: targetRole,
                read: false
            }
        });

        res.json({ count });
    } catch (error) {
        console.error('Erro ao buscar resumo:', error);
        res.status(500).json({ error: 'Errointerno' });
    }
});

module.exports = router;
