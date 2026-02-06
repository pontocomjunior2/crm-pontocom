const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/admin/config - Obter configurações financeiras
router.get('/config', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        let config = await prisma.financialConfig.findUnique({
            where: { id: 'default' }
        });

        if (!config) {
            config = await prisma.financialConfig.create({
                data: {
                    id: 'default',
                    taxRate: 0.10,
                    commissionRate: 0.04
                }
            });
        }

        res.json(config);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar configurações financeiras' });
    }
});

// PUT /api/admin/config - Atualizar configurações financeiras
router.put('/config', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { taxRate, commissionRate } = req.body;

        const config = await prisma.financialConfig.upsert({
            where: { id: 'default' },
            update: {
                taxRate: parseFloat(taxRate),
                commissionRate: parseFloat(commissionRate)
            },
            create: {
                id: 'default',
                taxRate: parseFloat(taxRate) || 0.10,
                commissionRate: parseFloat(commissionRate) || 0.04
            }
        });

        res.json(config);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar configurações financeiras' });
    }
});

// GET /api/admin/commission-users - Listar usuários e seu status de elegibilidade
router.get('/commission-users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                isCommissionEligible: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

// PATCH /api/admin/commission-users/:id - Alternar elegibilidade de comissão
router.patch('/commission-users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { isCommissionEligible } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isCommissionEligible },
            select: {
                id: true,
                isCommissionEligible: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// POST /api/admin/recalculate-all - Recalcular impostos e comissões de todos os pedidos
router.post('/recalculate-all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const config = await prisma.financialConfig.findUnique({ where: { id: 'default' } });
        if (!config) return res.status(404).json({ error: 'Configuração não encontrada' });

        const taxRate = parseFloat(config.taxRate);
        const commissionRate = parseFloat(config.commissionRate);

        // Buscar todos os pedidos para recálculo
        const orders = await prisma.order.findMany({
            include: { commissions: true }
        });

        let updatedCount = 0;

        for (const order of orders) {
            const venda = parseFloat(order.vendaValor) || 0;
            const cache = parseFloat(order.cacheValor) || 0;

            // Novos cálculos baseados na config
            const totalComissaoCalculada = (venda - cache) * commissionRate;

            // Se o pedido tiver comissões compartilhadas, recalcular valores individuais
            if (order.commissions.length > 0) {
                for (const comm of order.commissions) {
                    await prisma.orderCommission.update({
                        where: { id: comm.id },
                        data: {
                            value: totalComissaoCalculada * parseFloat(comm.percent)
                        }
                    });
                }
            }

            updatedCount++;
        }

        res.json({ message: `Recálculo concluído. ${updatedCount} pedidos processados.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao recalcular pedidos' });
    }
});

module.exports = router;
