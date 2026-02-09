const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Listar notificações pendentes
router.get('/', async (req, res) => {
    try {
        const { targetRole } = req.query;
        const userRole = req.headers['x-user-role'];

        let where = { read: false };

        if (userRole === 'ADMIN') {
            // Admin vê tudo de todas as roles se não filtrar
            if (targetRole) {
                where.targetRole = targetRole;
            }
        } else if (userRole) {
            // Usuário comum vê apenas o que é da role dele
            where.targetRole = userRole;
        } else {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const notifications = await prisma.notification.findMany({
            where,
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
        const userRole = req.headers['x-user-role'];

        let where = { read: false };

        if (userRole === 'ADMIN') {
            if (targetRole) where.targetRole = targetRole;
        } else if (userRole) {
            where.targetRole = userRole;
        } else {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const count = await prisma.notification.count({
            where
        });

        res.json({ count });
    } catch (error) {
        console.error('Erro ao buscar resumo:', error);
        res.status(500).json({ error: 'Errointerno' });
    }
});

module.exports = router;
