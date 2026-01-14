const express = require('express');
const prisma = require('../db');

const router = express.Router();

// GET /api/client-packages/:clientId - Listar pacotes de um cliente
router.get('/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const packages = await prisma.clientPackage.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(packages);
    } catch (error) {
        console.error('Erro ao buscar pacotes do cliente:', error);
        res.status(500).json({ error: 'Falha ao buscar pacotes' });
    }
});

// GET /api/client-packages/active/:clientId - Buscar pacote ativo atual
router.get('/active/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const now = new Date();
        const activePackage = await prisma.clientPackage.findFirst({
            where: {
                clientId,
                active: true,
                startDate: { lte: now },
                endDate: { gte: now }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(activePackage);
    } catch (error) {
        console.error('Erro ao buscar pacote ativo:', error);
        res.status(500).json({ error: 'Falha ao buscar pacote ativo' });
    }
});

// POST /api/client-packages - Criar novo pacote
router.post('/', async (req, res) => {
    try {
        const {
            clientId,
            name,
            type,
            fixedFee,
            audioLimit,
            extraAudioFee,
            startDate,
            endDate
        } = req.body;

        // Desativar pacotes anteriores do mesmo cliente (opcional, dependendo da regra de ter apenas um ativo)
        await prisma.clientPackage.updateMany({
            where: { clientId, active: true },
            data: { active: false }
        });

        const newPackage = await prisma.clientPackage.create({
            data: {
                clientId,
                name,
                type,
                fixedFee: parseFloat(fixedFee),
                audioLimit: parseInt(audioLimit) || 0,
                usedAudios: 0,
                extraAudioFee: parseFloat(extraAudioFee) || 0,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                active: true
            }
        });

        // Automação Financeira: Criar registro de Venda para a mensalidade fixa
        if (parseFloat(fixedFee) > 0) {
            try {
                // Auto-generate numeroVenda
                const lastSale = await prisma.order.findFirst({
                    where: { numeroVenda: { not: null } },
                    orderBy: { numeroVenda: 'desc' }
                });
                const lastId = lastSale?.numeroVenda || 42531;
                const nextNumeroVenda = lastId + 1;

                await prisma.order.create({
                    data: {
                        clientId,
                        title: name,
                        serviceType: 'PLANO MENSAL',
                        vendaValor: parseFloat(fixedFee),
                        cacheValor: 0,
                        status: 'VENDA',
                        faturado: false,
                        date: new Date(startDate), // Data de início do pacote
                        numeroVenda: nextNumeroVenda,
                        comentarios: `Lançamento automático referente ao pacote: ${name}`
                    }
                });
            } catch (billingError) {
                console.error('Erro ao gerar faturamento automático do pacote:', billingError);
            }
        }

        res.status(201).json(newPackage);
    } catch (error) {
        console.error('Erro ao criar pacote:', error);
        res.status(500).json({ error: 'Falha ao criar pacote', message: error.message });
    }
});

// PUT /api/client-packages/:id - Atualizar pacote
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.fixedFee) updateData.fixedFee = parseFloat(updateData.fixedFee);
        if (updateData.extraAudioFee) updateData.extraAudioFee = parseFloat(updateData.extraAudioFee);
        if (updateData.audioLimit !== undefined) updateData.audioLimit = parseInt(updateData.audioLimit);
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

        const updated = await prisma.clientPackage.update({
            where: { id },
            data: updateData
        });

        res.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar pacote:', error);
        res.status(500).json({ error: 'Falha ao atualizar pacote' });
    }
});

// DELETE /api/client-packages/:id - Excluir pacote
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.clientPackage.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir pacote:', error);
        res.status(500).json({ error: 'Falha ao excluir pacote' });
    }
});

module.exports = router;
