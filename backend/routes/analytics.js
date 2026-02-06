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
            if (startDate) {
                // startDate is YYYY-MM-DD, we want 00:00:00 at GMT-3
                const sDate = new Date(`${startDate}T00:00:00-03:00`);
                if (!isNaN(sDate.getTime())) dateFilter.date.gte = sDate;
            }
            if (endDate) {
                // endDate is YYYY-MM-DD, we want 23:59:59.999 at GMT-3
                const eDate = new Date(`${endDate}T23:59:59.999-03:00`);
                if (!isNaN(eDate.getTime())) dateFilter.date.lte = eDate;
            }
            // Remove date filter if both were invalid
            if (Object.keys(dateFilter.date).length === 0) delete dateFilter.date;
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

        let commissionableProfit = 0;
        orders.forEach(order => {
            const revenue = Number(order.vendaValor);
            let cost = Number(order.cacheValor);

            if (order.locutorId && order.locutorObj?.valorFixoMensal > 0 && Number(order.cacheValor) === 0) {
                const month = new Date(order.date).toISOString().substring(0, 7);
                const key = `${order.locutorId}_${month}`;
                const count = locutorMonthCounts[key] || 1;
                cost = Number(order.locutorObj.valorFixoMensal) / count;
            }

            const isRecurring = order.packageId !== null || order.packageBilling !== null || order.serviceType === 'SERVIÇO RECORRENTE';

            // Commission only on "Avulsos" OR "Recurring with hasCommission flag"
            if (!isRecurring || order.hasCommission) {
                commissionableProfit += (revenue - cost);
            }
        });

        const netProfit = totalRevenue - totalCosts;
        const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
        const commission = commissionableProfit > 0 ? commissionableProfit * 0.04 : 0;

        res.json({
            totalRevenue,
            totalCosts,
            netProfit,
            pendingReceivables,
            averageTicket,
            commission,
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
        const { months = 6, startDate, endDate } = req.query;

        // Use GMT-3 for current date calculation
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const defaultStart = new Date(now.getFullYear(), now.getMonth() - parseInt(months) + 1, 1);
        // Format defaultStart as YYYY-MM-DD for consistency
        const defaultStartStr = defaultStart.toISOString().split('T')[0];

        const dateFilter = {
            date: { gte: new Date(`${defaultStartStr}T00:00:00-03:00`) }
        };

        if (startDate) {
            const sDate = new Date(`${startDate}T00:00:00-03:00`);
            if (!isNaN(sDate.getTime())) dateFilter.date.gte = sDate;
        }
        if (endDate) {
            const eDate = new Date(`${endDate}T23:59:59.999-03:00`);
            if (!isNaN(eDate.getTime())) dateFilter.date.lte = eDate;
        }

        const orders = await prisma.order.findMany({
            where: {
                status: 'VENDA',
                ...dateFilter
            },
            orderBy: { date: 'asc' }
        });

        // Group by month using GMT-3 for the labels
        const trends = {};
        orders.forEach(order => {
            // Ensure we use the date as-is or adjusted to GMT-3 for grouping
            const date = new Date(order.date);
            const monthLabel = date.toLocaleString('pt-BR', {
                month: 'short',
                year: '2-digit',
                timeZone: 'America/Sao_Paulo'
            });

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
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) {
                const sDate = new Date(`${startDate}T00:00:00-03:00`);
                if (!isNaN(sDate.getTime())) dateFilter.date.gte = sDate;
            }
            if (endDate) {
                const eDate = new Date(`${endDate}T23:59:59.999-03:00`);
                if (!isNaN(eDate.getTime())) dateFilter.date.lte = eDate;
            }
        }

        const types = await prisma.order.groupBy({
            by: ['tipo'],
            _count: true,
            where: {
                status: 'VENDA',
                ...dateFilter
            }
        });

        const distribution = await prisma.order.groupBy({
            by: ['status'],
            _count: true,
            where: {
                ...dateFilter
            }
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

// GET /api/analytics/cache-report - Locutores needing payment
router.get('/cache-report', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) {
                const sDate = new Date(`${startDate}T00:00:00-03:00`);
                if (!isNaN(sDate.getTime())) dateFilter.date.gte = sDate;
            }
            if (endDate) {
                const eDate = new Date(`${endDate}T23:59:59.999-03:00`);
                if (!isNaN(eDate.getTime())) dateFilter.date.lte = eDate;
            }
            // Remove date filter if both were invalid
            if (Object.keys(dateFilter.date).length === 0) delete dateFilter.date;
        }

        // Get orders with caches, excluding supplier-linked locutores
        const orders = await prisma.order.findMany({
            where: {
                ...dateFilter,
                status: 'VENDA', // Only sales generate cache payments
                cacheValor: { gt: 0 },
                locutorId: { not: null },
                locutorObj: {
                    suppliers: {
                        none: {} // Not pre-paid (no suppliers linked)
                    }
                }
            },
            include: {
                locutorObj: true
            }
        });

        // Group by locutor
        const cacheGroups = orders.reduce((acc, order) => {
            const locId = order.locutorId;
            if (!acc[locId]) {
                acc[locId] = {
                    locutorId: locId,
                    name: order.locutorObj.name,
                    pixKey: order.locutorObj.chavePix,
                    pixType: order.locutorObj.tipoChavePix,
                    bank: order.locutorObj.banco,
                    pendingValue: 0,
                    paidValue: 0,
                    orderCount: 0,
                    orders: []
                };
            }

            if (order.cachePago) {
                acc[locId].paidValue += parseFloat(order.cacheValor);
            } else {
                acc[locId].pendingValue += parseFloat(order.cacheValor);
            }

            acc[locId].orderCount += 1;
            acc[locId].orders.push({
                id: order.id,
                title: order.title,
                date: order.date,
                value: order.cacheValor,
                numeroVenda: order.numeroVenda,
                paid: order.cachePago
            });
            return acc;
        }, {});

        res.json(Object.values(cacheGroups));
    } catch (error) {
        console.error('Error fetching cache report:', error);
        res.status(500).json({ error: 'Failed to fetch cache report' });
    }
});

module.exports = router;
