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

        // Active Clients: Status 'ativado' AND at least one order in the last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const totalClientsCount = await prisma.client.count({
            where: {
                status: 'ativado',
                orders: {
                    some: {
                        date: { gte: ninetyDaysAgo }
                    }
                }
            }
        });

        // 1. Calculate main KPIs
        const revenueSums = await prisma.order.aggregate({
            _sum: {
                vendaValor: true,
                cacheValor: true
            },
            where: {
                ...dateFilter,
                status: { in: ['VENDA', 'FATURADO'] }
            }
        });


        // Cache involves everything that is already "done" or "sold"
        const cacheSums = await prisma.order.aggregate({
            _sum: {
                cacheValor: true
            },
            where: {
                ...dateFilter,
                status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] }
            }
        });

        // 1.1 Calculate Recurring Metrics
        const recurringRevenueSum = await prisma.order.aggregate({
            _sum: { vendaValor: true },
            where: {
                ...dateFilter,
                status: { in: ['VENDA', 'FATURADO'] },
                serviceType: 'SERVIÇO RECORRENTE'
            }
        });

        const recurringCacheSum = await prisma.order.aggregate({
            _sum: { cacheValor: true },
            where: {
                ...dateFilter,
                status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] },
                serviceType: 'SERVIÇO RECORRENTE'
            }
        });


        // 1.2 Calculate Package Metrics
        const packageRevenueSum = await prisma.order.aggregate({
            _sum: { vendaValor: true },
            where: {
                ...dateFilter,
                status: { in: ['VENDA', 'FATURADO'] },
                vendaValor: { gt: 0 },
                OR: [
                    { packageId: { not: null } },
                    { packageBilling: { isNot: null } },
                    { packageName: { not: null } }
                ]
            }
        });

        const packageCacheSum = await prisma.order.aggregate({
            _sum: { cacheValor: true },
            where: {
                ...dateFilter,
                status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] },
                OR: [
                    { packageId: { not: null } },
                    { packageBilling: { isNot: null } },
                    { packageName: { not: null } }
                ]
            }
        });

        // 1.3 Calculate Recurring Cache (variable only)
        const recurringVariableCacheSum = await prisma.order.aggregate({
            _sum: { cacheValor: true },
            where: {
                ...dateFilter,
                status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] },
                serviceType: 'SERVIÇO RECORRENTE',
                // Ensure we don't count it as recurring if it's somehow linked to a package
                packageId: null,
                packageBilling: null,
                packageName: null
            }
        });


        // 1.4 Calculate Order (Avulso) Cache - Catch-all for everything else
        const orderCacheSum = await prisma.order.aggregate({
            _sum: { cacheValor: true },
            where: {
                ...dateFilter,
                status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] },
                // NOT in Package
                NOT: {
                    OR: [
                        { packageId: { not: null } },
                        { packageBilling: { isNot: null } },
                        { packageName: { not: null } }
                    ]
                },
                // NOT in Recurring (Handle NULL correctly)
                OR: [
                    { serviceType: { not: 'SERVIÇO RECORRENTE' } },
                    { serviceType: null }
                ]
            }
        });


        const totalRevenue = Number(revenueSums._sum.vendaValor || 0);
        const recurringRevenue = Number(recurringRevenueSum._sum.vendaValor || 0);
        const packageRevenue = Number(packageRevenueSum._sum.vendaValor || 0);
        const orderRevenue = totalRevenue - recurringRevenue - packageRevenue;

        // 1.1 Calculate total fixed fees for locutores who have orders IN THIS PERIOD
        const locutoresWithOrders = await prisma.locutor.findMany({
            where: {
                valorFixoMensal: { gt: 0 },
                orders: {
                    some: {
                        ...dateFilter,
                        status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] }
                    }
                }
            },
            select: { valorFixoMensal: true }
        });

        const totalFixedFees = locutoresWithOrders.reduce((sum, loc) => sum + Number(loc.valorFixoMensal), 0);

        // Cache Calculations - DEFINITIVO
        const totalVariableCache = Number(cacheSums._sum.cacheValor || 0);
        const recurringVariableCache = Number(recurringVariableCacheSum._sum.cacheValor || 0);
        const packageVariableCache = Number(packageCacheSum._sum.cacheValor || 0);
        const orderVariableCache = Number(orderCacheSum._sum.cacheValor || 0);

        // KPIs de Custos:
        // - packageCache: todos os pedidos vinculados a pacotes (link direto ou por nome)
        // - recurringCache: serviços recorrentes + taxas fixas (custo operacional fixo)
        // - orderCache: pedidos estritamente avulsos
        // - adjustedTotalCache: Soma total absoluta (Pacote + Avulso + Recorrente = Total)
        const packageCache = packageVariableCache;
        const orderCache = orderVariableCache;
        const recurringCache = recurringVariableCache + totalFixedFees;
        const adjustedTotalCache = packageVariableCache + orderVariableCache + recurringCache;



        // 2. Recent Orders (Last 5 within filter or global if no filter?)
        // Usually "Recent" implies global recent, but if filtering by "Last Year", we might want top 5 of that year?
        // Let's apply filter to be consistent.
        const recentOrders = await prisma.order.findMany({
            where: dateFilter,
            take: 5,
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
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
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
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
                recurringRevenue,
                packageRevenue,
                orderRevenue,
                activeOrders: activeOrdersCount,
                totalCache: adjustedTotalCache,
                recurringCache,
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
            case 'recurringRevenue':
            case 'packageRevenue':
                const revenueWhere = {
                    ...dateFilter,
                    status: { in: ['VENDA', 'FATURADO'] }
                };

                if (metric === 'orderRevenue') {
                    revenueWhere.packageId = null;
                    revenueWhere.packageBilling = null;
                    revenueWhere.serviceType = { not: 'SERVIÇO RECORRENTE' };
                } else if (metric === 'recurringRevenue') {
                    revenueWhere.serviceType = 'SERVIÇO RECORRENTE';
                } else if (metric === 'packageRevenue') {
                    revenueWhere.vendaValor = { gt: 0 };
                    revenueWhere.OR = [
                        { packageId: { not: null } },
                        { packageBilling: { isNot: null } }
                    ];
                }

                data = await prisma.order.findMany({
                    where: revenueWhere,
                    include: { client: { select: { name: true } } },
                    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
                });
                break;

            case 'activeClients':
                const activeClientDateLimit = new Date();
                activeClientDateLimit.setDate(activeClientDateLimit.getDate() - 90);

                data = await prisma.client.findMany({
                    where: {
                        status: 'ativado',
                        orders: {
                            some: {
                                date: { gte: activeClientDateLimit }
                            }
                        }
                    },
                    orderBy: { name: 'asc' }
                });
                data = data.map(c => ({
                    id: c.id,
                    title: c.name,
                    client: c.company || 'Pessoa Física',
                    displayValue: c.email || c.phone || 'S/D',
                    date: c.createdAt,
                    status: 'ATIVO',
                    tipo: 'CLIENTE'
                }));
                break;


            case 'packageCache':
                const packageOrders = await prisma.order.findMany({
                    where: {
                        ...dateFilter,
                        status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] },
                        OR: [
                            { packageId: { not: null } },
                            { packageBilling: { isNot: null } },
                            { packageName: { not: null } }
                        ]
                    },
                    include: {
                        client: { select: { name: true } },
                        package: { select: { id: true, name: true } },
                        packageBilling: { select: { id: true, name: true } }
                    }
                });

                const groupedPackages = {};
                packageOrders.forEach(order => {
                    const pkg = order.package || order.packageBilling || (order.packageName ? { id: 'EXTERNAL-' + order.packageName, name: order.packageName } : null);
                    if (!pkg) return;

                    const pkgKey = pkg.id;
                    if (!groupedPackages[pkgKey]) {
                        groupedPackages[pkgKey] = {
                            id: pkgKey,
                            title: `Pacote: ${pkg.name}`,
                            client: order.client.name,
                            value: 0,
                            date: order.date,
                            status: 'PACOTE',
                            type: 'Custo Consolidado'
                        };
                    }
                    groupedPackages[pkgKey].value += Number(order.cacheValor);
                    if (new Date(order.date) > new Date(groupedPackages[pkgKey].date)) {
                        groupedPackages[pkgKey].date = order.date;
                    }
                });
                data = Object.values(groupedPackages);
                const formattedPackageData = data.map(item => ({
                    id: item.id.toString(),
                    title: item.title,
                    client: item.client,
                    value: item.value,
                    date: item.date,
                    status: item.status,
                    type: item.type
                }));
                return res.json(formattedPackageData);

            case 'totalCache':
            case 'orderCache':
            case 'recurringCache':
                const cacheWhere = {
                    ...dateFilter,
                    status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] },
                    cacheValor: { gt: 0 }
                };


                if (metric === 'orderCache') {
                    // NOT in Package
                    cacheWhere.NOT = {
                        OR: [
                            { packageId: { not: null } },
                            { packageBilling: { isNot: null } },
                            { packageName: { not: null } }
                        ]
                    };
                    // NOT in Recurring (Handle NULL correctly)
                    cacheWhere.OR = [
                        { serviceType: { not: 'SERVIÇO RECORRENTE' } },
                        { serviceType: null }
                    ];
                } else if (metric === 'recurringCache') {
                    cacheWhere.serviceType = 'SERVIÇO RECORRENTE';
                    // Optional: also filter out if it's somehow in a package
                    cacheWhere.packageId = null;
                    cacheWhere.packageBilling = null;
                    cacheWhere.packageName = null;
                }

                const dataList = await prisma.order.findMany({
                    where: cacheWhere,
                    include: { client: { select: { name: true } } },
                    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
                });

                data = dataList.map(o => ({
                    ...o,
                    displayValue: Number(o.cacheValor)
                }));


                if (metric === 'totalCache' || metric === 'recurringCache') {
                    const locutoresWithFixed = await prisma.locutor.findMany({
                        where: {
                            valorFixoMensal: { gt: 0 },
                            orders: { some: { ...dateFilter, status: { in: ['VENDA', 'ENTREGUE', 'FATURADO'] } } }
                        }
                    });

                    const fixedFeesData = locutoresWithFixed.map(l => ({
                        id: `FIXED-${l.id}`,
                        title: `Fixo Mensal: ${l.name}`,
                        client: 'Custo Fixo',
                        displayValue: Number(l.valorFixoMensal || 0),
                        date: new Date(),
                        status: 'FIXO',
                        tipo: 'TAXA MENSAL'
                    }));

                    data = [...data, ...fixedFeesData];
                }
                break;

            case 'activeOrders':
                data = await prisma.order.findMany({
                    where: { entregue: false, ...dateFilter },
                    include: { client: { select: { name: true } } },
                    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
                });
                break;

            case 'totalOrders':
                data = await prisma.order.findMany({
                    where: dateFilter,
                    include: { client: { select: { name: true } } },
                    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
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
