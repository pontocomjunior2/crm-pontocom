const express = require('express');
const prisma = require('../db');

const router = express.Router();

// GET /api/client-packages - Listar todos os pacotes ativos globalmente
router.get('/', async (req, res) => {
    try {
        const packages = await prisma.clientPackage.findMany({
            where: { active: true },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        razaoSocial: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(packages);
    } catch (error) {
        console.error('Erro ao buscar todos os pacotes ativos:', error);
        res.status(500).json({ error: 'Erro no Backend: Falha ao buscar lista global de pacotes' });
    }
});

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
            endDate,
            clientCode
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
                active: true,
                clientCode: clientCode || null
            }
        });

        // Automação Financeira: Criar registro de Venda para a mensalidade fixa
        let billingOrderId = null;
        if (parseFloat(fixedFee) > 0) {
            try {
                // Auto-generate numeroVenda
                const lastSale = await prisma.order.findFirst({
                    where: { numeroVenda: { not: null } },
                    orderBy: { numeroVenda: 'desc' }
                });
                const lastId = lastSale?.numeroVenda || 42531;
                const nextNumeroVenda = lastId + 1;

                const billingOrder = await prisma.order.create({
                    data: {
                        clientId,
                        title: name,
                        locutor: 'Sistema',
                        tipo: 'PRODUZIDO',
                        serviceType: 'PLANO MENSAL',
                        vendaValor: parseFloat(fixedFee),
                        cacheValor: 0,
                        status: 'VENDA',
                        faturado: false,
                        date: new Date(startDate),
                        numeroVenda: nextNumeroVenda,
                        comentarios: `Lançamento automático referente ao pacote: ${name}`
                    }
                });
                billingOrderId = billingOrder.id;
            } catch (billingError) {
                console.error('Erro ao gerar faturamento automático do pacote:', billingError);
            }
        }

        // Vincular a venda ao pacote
        if (billingOrderId) {
            await prisma.clientPackage.update({
                where: { id: newPackage.id },
                data: { billingOrderId }
            });
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
        const { forceUpdate, ...updateData } = req.body;

        // Buscar o pacote atual com a venda vinculada
        const currentPackage = await prisma.clientPackage.findUnique({
            where: { id },
            include: { billingOrder: true }
        });

        if (!currentPackage) {
            return res.status(404).json({ error: 'Pacote não encontrado' });
        }

        // Verificar se a venda já foi faturada
        if (currentPackage.billingOrder?.faturado && !forceUpdate) {
            return res.status(409).json({
                error: 'BILLING_ALREADY_INVOICED',
                message: 'A venda deste pacote já foi faturada. Deseja continuar com a alteração?',
                requiresConfirmation: true
            });
        }

        // Processar dados de atualização
        if (updateData.fixedFee) updateData.fixedFee = parseFloat(updateData.fixedFee);
        if (updateData.extraAudioFee) updateData.extraAudioFee = parseFloat(updateData.extraAudioFee);
        if (updateData.audioLimit !== undefined) updateData.audioLimit = parseInt(updateData.audioLimit);
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
        if (updateData.clientCode !== undefined) updateData.clientCode = updateData.clientCode || null;

        // Atualizar o pacote
        const updated = await prisma.clientPackage.update({
            where: { id },
            data: updateData
        });

        // Sincronizar com a venda automática se existir
        if (currentPackage.billingOrderId) {
            const orderUpdateData = {};
            if (updateData.name) orderUpdateData.title = updateData.name;
            if (updateData.fixedFee) orderUpdateData.vendaValor = updateData.fixedFee;
            if (updateData.startDate) orderUpdateData.date = updateData.startDate;

            // Se forceUpdate = true e estava faturado, reverter para não faturado
            if (forceUpdate && currentPackage.billingOrder?.faturado) {
                orderUpdateData.faturado = false;
                orderUpdateData.wasReopened = true; // Marcar como reaberto
            }

            if (Object.keys(orderUpdateData).length > 0) {
                await prisma.order.update({
                    where: { id: currentPackage.billingOrderId },
                    data: orderUpdateData
                });
            }
        }

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
        const { forceDelete } = req.query;

        // Buscar o pacote com a venda vinculada
        const packageToDelete = await prisma.clientPackage.findUnique({
            where: { id },
            include: { billingOrder: true }
        });

        if (!packageToDelete) {
            return res.status(404).json({ error: 'Pacote não encontrado' });
        }

        // Verificar se a venda já foi faturada
        if (packageToDelete.billingOrder?.faturado && forceDelete !== 'true') {
            return res.status(409).json({
                error: 'BILLING_ALREADY_INVOICED',
                message: 'A venda deste pacote já foi faturada. Deseja continuar com a exclusão?',
                requiresConfirmation: true
            });
        }

        // Excluir a venda automática se existir
        if (packageToDelete.billingOrderId) {
            await prisma.order.delete({
                where: { id: packageToDelete.billingOrderId }
            });
        }

        // Excluir o pacote
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
