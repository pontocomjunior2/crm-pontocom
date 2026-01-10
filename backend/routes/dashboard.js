const express = require('express');
const prisma = require('../db');
const router = express.Router();

// Get dashboard data
router.get('/', async (req, res) => {
    try {
        // 1. Core Metrics
        const totalOrdersCount = await prisma.order.count();
        const activeOrdersCount = await prisma.order.count({
            where: { entregue: false }
        });
        const totalClientsCount = await prisma.client.count({
            where: { status: 'ativado' }
        });

        const revenueSums = await prisma.order.aggregate({
            _sum: {
                vendaValor: true,
                cacheValor: true
            }
        });

        // 2. Recent Orders (Last 5)
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: {
                client: {
                    select: { name: true }
                }
            }
        });

        // 3. Pending Invoices (Delivered but not billed)
        const pendingInvoices = await prisma.order.findMany({
            where: {
                entregue: true,
                faturado: false
            },
            take: 5,
            include: {
                client: {
                    select: { name: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Group pending invoices by client for the widget
        const pendingByClient = {};
        pendingInvoices.forEach(order => {
            const clientName = order.client.name;
            if (!pendingByClient[clientName]) {
                pendingByClient[clientName] = {
                    client: clientName,
                    total: 0,
                    orders: 0,
                    dueDate: 'Em breve',
                    priority: 'medium'
                };
            }
            pendingByClient[clientName].total += Number(order.vendaValor);
            pendingByClient[clientName].orders += 1;
        });

        const pendingSummary = Object.values(pendingByClient);

        res.json({
            metrics: {
                totalRevenue: Number(revenueSums._sum.vendaValor || 0),
                activeOrders: activeOrdersCount,
                totalCache: Number(revenueSums._sum.cacheValor || 0),
                activeClients: totalClientsCount,
                totalOrders: totalOrdersCount
            },
            recentOrders: recentOrders.map(o => ({
                id: o.id.substring(0, 8).toUpperCase(),
                client: o.client.name,
                title: o.title,
                type: o.tipo,
                locutor: o.locutor,
                status: o.faturado ? 'FATURADO' : (o.entregue ? 'ENTREGUE' : 'PRODUÇÃO'),
                time: formatRelativeTime(o.date),
                value: Number(o.vendaValor),
                statusColor: o.faturado ? 'badge-faturado' : (o.entregue ? 'badge-entregue' : 'badge-producao')
            })),
            pendingInvoices: pendingSummary.map(p => ({
                ...p,
                total: `R$ ${p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }))
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Erro ao carregar dados do dashboard' });
    }
});

function formatRelativeTime(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Agora';
    if (diffInMins < 60) return `${diffInMins}min atrás`;
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    return `${diffInDays} dias atrás`;
}

module.exports = router;
