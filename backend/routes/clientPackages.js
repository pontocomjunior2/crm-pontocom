const express = require('express');
const prisma = require('../db');
const { checkPermission } = require('../utils/permissions');
const PackageService = require('../services/packageService');

const router = express.Router();

// GET /api/client-packages - Listar todos os pacotes ativos globalmente
router.get('/', checkPermission('accessPacotes'), async (req, res) => {
    try {
        const packages = await prisma.clientPackage.findMany({
            where: {},
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

// GET /api/client-packages/all/orders - Listar TODOS os pedidos de pacotes (lista universal)
router.get('/all/orders', checkPermission('accessPacotes'), async (req, res) => {
    try {
        // Buscar todos os pedidos que estão vinculados a pacotes
        const orders = await prisma.order.findMany({
            where: {
                packageId: { not: null },
                status: { not: 'CANCELADO' }
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                package: {
                    select: {
                        id: true,
                        name: true,
                        clientCode: true,
                        usedAudios: true,
                        audioLimit: true,
                        clientId: true
                    }
                }
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
        });

        res.json({
            orders: orders.map(order => ({
                id: order.id,
                sequentialId: order.sequentialId,
                numeroVenda: order.numeroVenda,
                consumptionId: order.consumptionId,
                title: order.title,
                fileName: order.fileName,
                locutor: order.locutor,
                locutorId: order.locutorId,
                supplierId: order.supplierId,
                date: order.date,
                status: order.status,
                entrega: order.entregue,
                creditsConsumed: order.creditsConsumed || 1,
                vendaValor: order.vendaValor,
                cacheValor: order.cacheValor,
                comentarios: order.comentarios,
                client: order.client,
                package: order.package,
                packageId: order.packageId,
                createdAt: order.createdAt
            }))
        });
    } catch (error) {
        console.error('Erro ao buscar todos os pedidos de pacotes:', error);
        res.status(500).json({ error: 'Erro no Backend: Falha ao buscar pedidos de pacotes' });
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
                active: true
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
router.post('/', checkPermission('accessPacotes'), async (req, res) => {
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
                startDate: new Date(startDate + 'T12:00:00'),
                endDate: new Date(endDate + 'T12:00:00'),
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
                        date: new Date(startDate + 'T12:00:00'),
                        dataFaturar: new Date(new Date(endDate).getTime() + 86400000), // endDate + 1 dia
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
router.put('/:id', checkPermission('accessPacotes'), async (req, res) => {
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
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate + 'T12:00:00');
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate + 'T12:00:00');
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

            // Sincronizar dataFaturar quando endDate mudar
            if (updateData.endDate) {
                orderUpdateData.dataFaturar = new Date(updateData.endDate.getTime() + 86400000);
            }

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

        // Sincronizar créditos e faturamento consolidado
        await PackageService.syncPackage(id);

        res.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar pacote:', error);
        res.status(500).json({ error: 'Falha ao atualizar pacote' });
    }
});

// DELETE /api/client-packages/:id - Excluir pacote
router.delete('/:id', checkPermission('accessPacotes'), async (req, res) => {
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

// GET /api/client-packages/:id/orders - Listar pedidos vinculados a um pacote
router.get('/:id/orders', async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar o pacote para validar
        const packageExists = await prisma.clientPackage.findUnique({
            where: { id },
            select: { id: true, name: true, clientId: true }
        });

        if (!packageExists) {
            return res.status(404).json({ error: 'Pacote não encontrado' });
        }

        // Buscar pedidos vinculados ao pacote
        const orders = await prisma.order.findMany({
            where: {
                packageId: id,
                status: { not: 'CANCELADO' } // Excluir cancelados
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
        });

        res.json({
            package: packageExists,
            orders: orders.map(order => ({
                id: order.id,
                sequentialId: order.sequentialId,
                numeroVenda: order.numeroVenda,
                consumptionId: order.consumptionId,
                title: order.title,
                fileName: order.fileName,
                locutor: order.locutor,
                locutorId: order.locutorId,
                supplierId: order.supplierId,
                tipo: order.tipo,
                date: order.date,
                status: order.status,
                entrega: order.entregue,
                creditsConsumed: order.creditsConsumed || 1,
                vendaValor: order.vendaValor,
                cacheValor: order.cacheValor,
                comentarios: order.comentarios,
                comentarios: order.comentarios,
                client: order.client,
                createdAt: order.createdAt
            }))
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos do pacote:', error);
        res.status(500).json({ error: 'Erro no Backend: Falha ao buscar pedidos do pacote' });
    }
});

module.exports = router;
