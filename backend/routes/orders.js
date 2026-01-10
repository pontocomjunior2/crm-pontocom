const express = require('express');
const prisma = require('../db');

const router = express.Router();

// GET /api/orders - List all orders with filters
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            clientId = '',
            status = '',
            tipo = '',
            dateFrom = '',
            dateTo = '',
            search = '',
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};

        // Client filter
        if (clientId) {
            where.clientId = clientId;
        }

        // Type filter
        if (tipo) {
            where.tipo = tipo;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(dateFrom);
            if (dateTo) where.date.lte = new Date(dateTo);
        }

        // Search filter
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { locutor: { contains: search, mode: 'insensitive' } },
                { comentarios: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Status filters
        if (status) {
            if (status === 'faturado') {
                where.faturado = true;
            } else if (status === 'entregue') {
                where.entregue = true;
            } else if (status === 'pendente') {
                where.faturado = false;
                where.entregue = true;
            } else {
                // Physical status (PEDIDO, VENDA)
                where.status = status;
            }
        }

        // Define sorting
        let orderBy = {};
        if (sortBy === 'client') {
            orderBy = { client: { name: sortOrder } };
        } else if (sortBy === 'date') {
            orderBy = { date: sortOrder };
        } else if (sortBy === 'sequentialId') {
            orderBy = { sequentialId: sortOrder };
        } else if (sortBy === 'numeroVenda') {
            orderBy = { numeroVenda: sortOrder };
        } else if (sortBy === 'vendaValor') {
            orderBy = { vendaValor: sortOrder };
        } else {
            orderBy[sortBy] = sortOrder;
        }

        const [ordersRaw, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy,
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            razaoSocial: true,
                            cnpj_cpf: true
                        }
                    },
                    locutorObj: true
                }
            }),
            prisma.order.count({ where })
        ]);

        // Dynamic cache calculation for monthly fixed-fee locutores
        const locutorMonthCounts = {}; // { locutorId_month: count }

        // First pass: Count orders per month for each fixed-fee locutor
        ordersRaw.forEach(order => {
            if (order.locutorId && order.locutorObj?.valorFixoMensal > 0) {
                const month = new Date(order.date).toISOString().substring(0, 7); // YYYY-MM
                const key = `${order.locutorId}_${month}`;
                locutorMonthCounts[key] = (locutorMonthCounts[key] || 0) + 1;
            }
        });

        // Second pass: Calculate dynamic cache valor
        const orders = ordersRaw.map(order => {
            let dynamicCacheValor = Number(order.cacheValor);

            if (order.locutorId && order.locutorObj?.valorFixoMensal > 0) {
                const month = new Date(order.date).toISOString().substring(0, 7);
                const key = `${order.locutorId}_${month}`;
                const count = locutorMonthCounts[key] || 1;
                dynamicCacheValor = Number(order.locutorObj.valorFixoMensal) / count;
            }

            return {
                ...order,
                dynamicCacheValor: parseFloat(dynamicCacheValor.toFixed(2))
            };
        });

        res.json({
            orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
    }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                client: true
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order', message: error.message });
    }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
    try {
        const {
            clientId,
            title,
            fileName,
            locutor,
            locutorId,
            tipo,
            urgency = 'NORMAL',
            cacheValor,
            vendaValor,
            comentarios,
            status = 'PEDIDO',
            numeroVenda,
            faturado = false,
            entregue = false,
            dispensaNF = false,
            emiteBoleto = false,
            dataFaturar,
            vencimento,
            pago = false,
            statusEnvio = 'PENDENTE'
        } = req.body;

        // Validate required fields
        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (!tipo || !['OFF', 'PRODUZIDO'].includes(tipo)) {
            return res.status(400).json({ error: 'Type must be OFF or PRODUZIDO' });
        }

        // Verify client exists
        const client = await prisma.client.findUnique({
            where: { id: clientId }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const order = await prisma.order.create({
            data: {
                clientId,
                title,
                fileName,
                locutor: locutor || '',
                locutorId: locutorId || null,
                tipo,
                urgency,
                cacheValor: parseFloat(cacheValor) || 0,
                vendaValor: parseFloat(vendaValor) || 0,
                comentarios,
                status,
                numeroVenda: numeroVenda || null,
                faturado,
                entregue,
                dispensaNF,
                emiteBoleto,
                dataFaturar: dataFaturar ? new Date(dataFaturar) : null,
                vencimento: vencimento ? new Date(vencimento) : null,
                pago,
                statusEnvio
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        razaoSocial: true,
                        cnpj_cpf: true
                    }
                }
            }
        });

        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order', message: error.message });
    }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            clientId,
            title,
            fileName,
            locutor,
            locutorId,
            tipo,
            urgency,
            cacheValor,
            vendaValor,
            comentarios,
            status,
            numeroVenda,
            faturado,
            entregue,
            dispensaNF,
            emiteBoleto,
            dataFaturar,
            vencimento,
            pago,
            statusEnvio
        } = req.body;

        // Check if order exists
        const existing = await prisma.order.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // If client is being changed, verify new client exists
        if (clientId && clientId !== existing.clientId) {
            const client = await prisma.client.findUnique({
                where: { id: clientId }
            });
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                clientId,
                title,
                fileName,
                locutor,
                locutorId,
                tipo,
                urgency,
                cacheValor: cacheValor !== undefined ? parseFloat(cacheValor) : undefined,
                vendaValor: vendaValor !== undefined ? parseFloat(vendaValor) : undefined,
                comentarios,
                status,
                numeroVenda,
                faturado,
                entregue,
                dispensaNF,
                emiteBoleto,
                dataFaturar: dataFaturar ? new Date(dataFaturar) : undefined,
                vencimento: vencimento ? new Date(vencimento) : undefined,
                pago,
                statusEnvio
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        razaoSocial: true,
                        cnpj_cpf: true
                    }
                }
            }
        });

        res.json(order);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order', message: error.message });
    }
});

// PATCH /api/orders/:id/convert - Convert PEDIDO to VENDA
router.patch('/:id/convert', async (req, res) => {
    try {
        const { id } = req.params;

        const currentOrder = await prisma.order.findUnique({ where: { id } });

        let nextVendaId = undefined;

        // If not already a sale or doesn't have a number, generate one
        if (currentOrder && !currentOrder.numeroVenda) {
            const lastSale = await prisma.order.findFirst({
                where: { numeroVenda: { not: null } },
                orderBy: { numeroVenda: 'desc' }
            });

            const lastId = lastSale?.numeroVenda || 42531; // Start at 42531 so first is 42532
            nextVendaId = lastId + 1;
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                status: 'VENDA',
                entregue: true,
                numeroVenda: nextVendaId // Will be undefined if not generating new
            },
            include: { client: true }
        });

        res.json(order);
    } catch (error) {
        console.error('Error converting order:', error);
        res.status(500).json({ error: 'Failed to convert order', message: error.message });
    }
});

// PATCH /api/orders/:id/revert - Revert VENDA to PEDIDO
router.patch('/:id/revert', async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.update({
            where: { id },
            data: {
                status: 'PEDIDO',
                entregue: false
            },
            include: { client: true }
        });

        res.json(order);
    } catch (error) {
        console.error('Error reverting order:', error);
        res.status(500).json({ error: 'Failed to revert order', message: error.message });
    }
});

// POST /api/orders/:id/clone - Duplicate an existing order
router.post('/:id/clone', async (req, res) => {
    try {
        const { id } = req.params;

        const original = await prisma.order.findUnique({
            where: { id }
        });

        if (!original) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Prepare clone data by removing unique/resetting fields
        const {
            id: _,
            sequentialId: __,
            numeroVenda: ___,
            date: ____,
            updatedAt: _____,
            createdAt: ______,
            ...cloneData
        } = original;

        // Reset lifecycle flags for the new entry
        // Clones ALWAYS start as 'PEDIDO', regardless of original status
        cloneData.status = 'PEDIDO';
        cloneData.faturado = false;
        cloneData.entregue = false;
        cloneData.pago = false;
        cloneData.dataFaturar = null;
        cloneData.vencimento = null;
        cloneData.statusEnvio = 'PENDENTE';
        cloneData.numeroVenda = null;

        const clonedOrder = await prisma.order.create({
            data: cloneData,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        razaoSocial: true,
                        cnpj_cpf: true
                    }
                }
            }
        });

        res.status(201).json(clonedOrder);
    } catch (error) {
        console.error('Error cloning order:', error);
        res.status(500).json({ error: 'Failed to clone order', message: error.message });
    }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await prisma.order.delete({ where: { id } });

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order', message: error.message });
    }
});

module.exports = router;
