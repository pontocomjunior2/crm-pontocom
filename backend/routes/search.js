const express = require('express');
const prisma = require('../db');
const router = express.Router();

// GET /api/search/global?q=...
router.get('/global', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ clients: [], orders: [] });
        }

        const query = q.toString();

        // Perform parallel searches
        const [clients, orders] = await Promise.all([
            // Search Clients
            prisma.client.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { cnpj_cpf: { contains: query, mode: 'insensitive' } },
                        { razaoSocial: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    cnpj_cpf: true
                }
            }),
            // Search Orders
            prisma.order.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { locutor: { contains: query, mode: 'insensitive' } },
                        { numeroVenda: isNaN(parseInt(query)) ? undefined : parseInt(query) }
                    ].filter(Boolean)
                },
                take: 5,
                orderBy: { date: 'desc' },
                select: {
                    id: true,
                    title: true,
                    numeroVenda: true,
                    date: true,
                    status: true
                }
            })
        ]);

        res.json({
            clients,
            orders
        });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;
