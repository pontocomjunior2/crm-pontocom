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
            // Normalize to GMT-3
            const start = new Date(`${startDate}T00:00:00-03:00`);
            const end = new Date(`${endDate}T23:59:59.999-03:00`);

            dateFilter = {
                date: {
                    gte: start,
                    lte: end
                }
            };
        } else if (startDate) {
            dateFilter = {
                date: { gte: new Date(`${startDate}T00:00:00-03:00`) }
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

// Get details for a specific metric
router.get('/details', async (req, res) => {
    try {
        const { metric, startDate, endDate } = req.query;

        // Build date filter
        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(`${startDate}T00:00:00-03:00`);
            const end = new Date(`${endDate}T23:59:59.999-03:00`);
            dateFilter = {
                date: {
                    gte: start,
                    lte: end
                }
            };
        } else if (startDate) {
            dateFilter = {
                date: { gte: new Date(`${startDate}T00:00:00-03:00`) }
            };
        }

        let data = [];

        switch (metric) {
            case 'totalRevenue':
            case 'orderRevenue':
                // For orderRevenue, we filter for orders WITHOUT packageId and packageBilling
                const orderRevWhere = {
                    ...dateFilter,
                    status: 'VENDA'
                };
                if (metric === 'orderRevenue') {
                    orderRevWhere.packageId = null;
                    orderRevWhere.packageBilling = null;
                }
                data = await prisma.order.findMany({
                    where: orderRevWhere,
                    include: { client: { select: { name: true } } },
                    orderBy: { date: 'desc' }
                });
                break;

            case 'packageRevenue':
                data = await prisma.order.findMany({
                    where: {
                        ...dateFilter,
                        status: 'VENDA',
                        OR: [
                            { packageId: { not: null } },
                            { packageBilling: { isNot: null } }
                        ]
                    },
                    include: { client: { select: { name: true } } },
                    orderBy: { date: 'desc' }
                });
                break;

            case 'activeClients':
                data = await prisma.client.findMany({
                    where: { status: 'ativado' },
                    orderBy: { name: 'asc' }
                });
                // Map to a consistent format for the modal
                data = data.map(c => ({
                    id: c.id,
                    title: c.name,
                    client: c.company || 'Pessoa Física',
                    value: c.email || c.phone,
                    date: c.createdAt
                }));
                break;

            case 'totalCache':
            case 'orderCache':
            case 'packageCache':
                const cacheWhere = {
                    ...dateFilter,
                    status: 'VENDA'
                };

                if (metric === 'orderCache') {
                    cacheWhere.packageId = null;
                    cacheWhere.packageBilling = null;
                } else if (metric === 'packageCache') {
                    cacheWhere.OR = [
                        { packageId: { not: null } },
                        { packageBilling: { isNot: null } }
                    ];
                }

                data = await prisma.order.findMany({
                    where: cacheWhere,
                    include: { client: { select: { name: true } } },
                    orderBy: { date: 'desc' }
                });

                // For Cache metrics, we want to show the cache value
                data = data.map(o => ({
                    ...o,
                    displayValue: o.cacheValor
                }));

                // If it's totalCache or packageCache, include fixed fees
                if (metric === 'totalCache' || metric === 'packageCache') {
                    const locutoresWithFixed = await prisma.locutor.findMany({
                        where: {
                            valorFixoMensal: { gt: 0 },
                            orders: {
                                some: {
                                    ...dateFilter,
                                    status: 'VENDA'
                                }
                            }
                        }
                    });

                    const fixedFeesData = locutoresWithFixed.map(l => ({
                        id: `FIXED-${l.id}`,
                        title: `Fixo Mensal: ${l.name}`,
                        client: 'Custo Fixo',
                        displayValue: l.valorFixoMensal,
                        date: new Date(), // Just for list positioning
                        status: 'FIXO'
                    }));

                    data = [...data, ...fixedFeesData];
                }
                break;

            case 'activeOrders':
                data = await prisma.order.findMany({
                    where: {
                        entregue: false,
                        ...dateFilter
                    },
                    include: { client: { select: { name: true } } },
                    orderBy: { date: 'desc' }
                });
                break;

            default:
                return res.status(400).json({ error: 'Métrica inválida' });
        }

        // Standardize returning data
        const formattedData = data.map(item => ({
            id: item.id.toString(),
            title: item.title || item.name || 'Sem título',
            client: item.client?.name || item.client || 'N/A',
            value: item.displayValue || item.vendaValor || item.value || 0,
            date: item.date || item.createdAt,
            status: item.status || (item.entregue ? 'ENTREGUE' : 'PRODUÇÃO'),
            type: item.tipo || 'N/A'
        }));

        res.json(formattedData);
    } catch (error) {
        console.error('Dashboard details error:', error);
        res.status(500).json({ error: 'Erro ao carregar detalhes do dashboard' });
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
