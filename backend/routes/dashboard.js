const express = require('express');
const prisma = require('../db');
const router = express.Router();

// Get dashboard data
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        let dateFilter = {};
        if (startDate && endDate) {
            // Append time to ensure it picks up the end of the day in LOCAL time (or consistent string parsing)
            // Using ISO format with T without Z usually parses as local time or explicit components
            const end = new Date(`${endDate}T23:59:59.999`);

            console.log('Dashboard Filter:', {
                startDateArgs: startDate,
                endDateArgs: endDate,
                constructedEnd: end,
                endISO: end.toISOString()
            });

            dateFilter = {
                date: {
                    gte: new Date(startDate),
                    lte: end
                }
            };
        } else if (startDate) {
            dateFilter = {
                date: { gte: new Date(startDate) }
            };
        }

        // 1. Core Metrics
        const totalOrdersCount = await prisma.order.count({
            where: dateFilter
        });

        // Active orders: usually meant as "Current Queue". 
        // If a date filter is applied, it implies "Active orders created within this period" 
        // OR we can keep it as "Global Active" if that makes more sense. 
        // For a Sales Dashboard, let's keep it consistent with the filter for now.
        const activeOrdersCount = await prisma.order.count({
            where: {
                entregue: false,
                ...dateFilter
            }
        });

        const totalClientsCount = await prisma.client.count({
            where: { status: 'ativado' }
        });

        const revenueSums = await prisma.order.aggregate({
            _sum: {
                vendaValor: true,
                cacheValor: true
            },
            where: {
                ...dateFilter,
                status: 'VENDA'
            }
        });

        // Calculate Package Revenue & Cache
        // 1. Orders that are package fees (billingOrder)
        // 2. Orders that are consumptions with extra cost (packageId is not null)
        const packageMetricsSum = await prisma.order.aggregate({
            _sum: {
                vendaValor: true,
                cacheValor: true
            },
            where: {
                ...dateFilter,
                status: 'VENDA',
                OR: [
                    { packageId: { not: null } },
                    { packageBilling: { isNot: null } }
                ]
            }
        });

        const packageRevenue = Number(packageMetricsSum._sum.vendaValor || 0);
        const totalRevenue = Number(revenueSums._sum.vendaValor || 0);
        const orderRevenue = totalRevenue - packageRevenue;

        // 1.1 Calculate total fixed fees for locutores who have orders IN THIS PERIOD
        const locutoresWithOrders = await prisma.locutor.findMany({
            where: {
                valorFixoMensal: { gt: 0 },
                orders: {
                    some: {
                        ...dateFilter,
                        status: 'VENDA'
                    }
                }
            },
            select: { valorFixoMensal: true }
        });

        const totalFixedFees = locutoresWithOrders.reduce((sum, loc) => sum + Number(loc.valorFixoMensal), 0);

        // Cache Calculations
        const totalVariableCache = Number(revenueSums._sum.cacheValor || 0);
        const packageVariableCache = Number(packageMetricsSum._sum.cacheValor || 0);

        const packageCache = packageVariableCache + totalFixedFees;
        const orderCache = totalVariableCache - packageVariableCache;
        const adjustedTotalCache = totalVariableCache + totalFixedFees;

        // 2. Recent Orders (Last 5 within filter or global if no filter?)
        // Usually "Recent" implies global recent, but if filtering by "Last Year", we might want top 5 of that year?
        // Let's apply filter to be consistent.
        const recentOrders = await prisma.order.findMany({
            where: dateFilter,
            take: 5,
            orderBy: { date: 'desc' },
            include: {
                client: {
                    select: { name: true }
                }
            }
        });

        // 3. Pending Invoices (Delivered but not billed)
        // This is a "ToDo" list. Time filter might hide old debts if strict.
        // Usually, debts are debts regardless of when the order happened.
        // However, if I select "Last Month", do I want to see debts FROM last month? Yes.
        const pendingInvoices = await prisma.order.findMany({
            where: {
                entregue: true,
                faturado: false,
                ...dateFilter
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
                totalRevenue,
                packageRevenue,
                orderRevenue,
                activeOrders: activeOrdersCount,
                totalCache: adjustedTotalCache,
                packageCache,
                orderCache,
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
