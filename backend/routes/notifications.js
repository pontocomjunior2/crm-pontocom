const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Listar notificações pendentes
router.get('/', async (req, res) => {
    try {
        const { targetRole } = req.query;
        const userId = req.user.userId;

        // Buscar usuário e seu tier para saber o que ele pode ver
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { tier: true }
        });

        if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

        let allowedRoles = [];
        if (user.role === 'ADMIN') {
            allowedRoles = ['ADMIN', 'ATENDIMENTO', 'FINANCEIRO'];
        } else if (user.tier?.name) {
            const tierName = user.tier.name.toLowerCase();
            if (tierName === 'financeiro') {
                allowedRoles.push('FINANCEIRO');
            } else if (tierName === 'atendimento') {
                allowedRoles.push('ATENDIMENTO');
            }
            // Adicionar outros mapeamentos aqui se novos tiers forem criados
        }

        let where = {
            read: false,
            targetRole: { in: allowedRoles }
        };

        // Se o frontend pediu uma role específica e ela está nas permitidas
        if (targetRole && allowedRoles.includes(targetRole)) {
            where.targetRole = targetRole;
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

// Criar nova notificação (Manual/Interna)
router.post('/', async (req, res) => {
    try {
        const { targetRole, title, message, link, type } = req.body;

        if (!targetRole || !title || !message) {
            return res.status(400).json({ error: 'Campos obrigatórios: targetRole, title, message' });
        }

        const notification = await prisma.notification.create({
            data: {
                targetRole,
                title,
                message,
                link: link || null,
                type: type || 'MANUAL',
                read: false
            }
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        res.status(500).json({ error: 'Erro ao criar notificação' });
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
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { tier: true }
        });

        if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

        let allowedRoles = [];
        if (user.role === 'ADMIN') {
            allowedRoles = ['ADMIN', 'ATENDIMENTO', 'FINANCEIRO'];
        } else if (user.tier?.name) {
            const tierName = user.tier.name.toLowerCase();
            if (tierName === 'financeiro') {
                allowedRoles.push('FINANCEIRO');
            } else if (tierName === 'atendimento') {
                allowedRoles.push('ATENDIMENTO');
            }
        }

        let where = {
            read: false,
            targetRole: { in: allowedRoles }
        };

        if (targetRole && allowedRoles.includes(targetRole)) {
            where.targetRole = targetRole;
        }

        const count = await prisma.notification.count({
            where
        });

        res.json({ count });
    } catch (error) {
        console.error('Erro ao buscar resumo:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

module.exports = router;
