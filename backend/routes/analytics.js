const express = require('express');
const prisma = require('../db');
const router = express.Router();

// GET /api/analytics/financial-summary - Main KPIs
router.get('/financial-summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) dateFilter.date.gte = new Date(startDate);
            if (endDate) dateFilter.date.lte = new Date(endDate);
        }

        // Get all sales (VENDA) in the period
        const orders = await prisma.order.findMany({
            where: {
                ...dateFilter,
                status: 'VENDA'
            },
            include: {
                locutorObj: true
            }
        });

        // Calculate KPIs
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.vendaValor), 0);

        // Dynamic cache calculation (similar to OrderList logic)
        // We need to handle fixed-fee locutores correctly
        const locutorMonthCounts = {};
        orders.forEach(order => {
            if (order.locutorId && order.locutorObj?.valorFixoMensal > 0 && Number(order.cacheValor) === 0) {
                const month = new Date(order.date).toISOString().substring(0, 7);
                const key = `${order.locutorId}_${month}`;
                locutorMonthCounts[key] = (locutorMonthCounts[key] || 0) + 1;
            }
        });

        let totalCosts = 0;
        orders.forEach(order => {
            let dynamicCache = Number(order.cacheValor);
            if (order.locutorId && order.locutorObj?.valorFixoMensal > 0) {
                if (Number(order.cacheValor) === 0) {
                    const month = new Date(order.date).toISOString().substring(0, 7);
                    const key = `${order.locutorId}_${month}`;
                    const count = locutorMonthCounts[key] || 1;
                    dynamicCache = Number(order.locutorObj.valorFixoMensal) / count;
                }
            }
            totalCosts += dynamicCache;
        });

        const pendingReceivables = orders
            .filter(o => !o.faturado)
            .reduce((sum, order) => sum + Number(order.vendaValor), 0);

        const netProfit = totalRevenue - totalCosts;
        const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

        res.json({
            totalRevenue,
            totalCosts,
            netProfit,
            pendingReceivables,
            averageTicket,
            orderCount: orders.length
        });
    } catch (error) {
        console.error('Error in financial-summary:', error);
        res.status(500).json({ error: 'Failed to fetch financial summary' });
    }
});

// GET /api/analytics/sales-trends - For line charts
router.get('/sales-trends', async (req, res) => {
    try {
        const { months = 6 } = req.query;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - parseInt(months) + 1, 1);

        const orders = await prisma.order.findMany({
            where: {
                status: 'VENDA',
                date: { gte: startDate }
            },
            orderBy: { date: 'asc' }
        });

        // Group by month
        const trends = {};
        orders.forEach(order => {
            const monthLabel = new Date(order.date).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            if (!trends[monthLabel]) {
                trends[monthLabel] = { month: monthLabel, revenue: 0, orders: 0 };
            }
            trends[monthLabel].revenue += Number(order.vendaValor);
            trends[monthLabel].orders += 1;
        });

        res.json(Object.values(trends));
    } catch (error) {
        console.error('Error in sales-trends:', error);
        res.status(500).json({ error: 'Failed to fetch sales trends' });
    }
});

// GET /api/analytics/top-clients
router.get('/top-clients', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const clients = await prisma.client.findMany({
            include: {
                orders: {
                    where: { status: 'VENDA' }
                }
            }
        });

        const clientStats = clients.map(client => {
            return {
                id: client.id,
                name: client.name,
                totalRevenue: client.orders.reduce((sum, o) => sum + Number(o.vendaValor), 0),
                orderCount: client.orders.length
            };
        })
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, parseInt(limit));

        res.json(clientStats);
    } catch (error) {
        console.error('Error in top-clients:', error);
        res.status(500).json({ error: 'Failed to fetch top clients' });
    }
});

// GET /api/analytics/performance-metrics
router.get('/performance-metrics', async (req, res) => {
    try {
        const types = await prisma.order.groupBy({
            by: ['tipo'],
            _count: true,
            where: { status: 'VENDA' }
        });

        const distribution = await prisma.order.groupBy({
            by: ['status'],
            _count: true
        });

        res.json({
            byType: types,
            byStatus: distribution
        });
    } catch (error) {
        console.error('Error in performance-metrics:', error);
        res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
});

module.exports = router;
