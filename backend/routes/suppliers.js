const express = require('express');
const router = express.Router();
const prisma = require('../db');


// List Suppliers with Credit Balance
router.get('/', async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: {
                packages: {
                    orderBy: { purchaseDate: 'desc' },
                    take: 5
                },
                locutores: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Calculate balances dynamically
        // Optimized: Fetch aggregated sums for all packages and orders in single queries
        const [packagesAgg, ordersAgg] = await Promise.all([
            prisma.creditPackage.groupBy({
                by: ['supplierId'],
                _sum: { credits: true }
            }),
            prisma.order.groupBy({
                by: ['supplierId'],
                _sum: { creditsConsumedSupplier: true },
                where: { supplierId: { not: null } }
            })
        ]);

        // Map aggregations for quick lookup
        const purchasedMap = {};
        packagesAgg.forEach(p => { purchasedMap[p.supplierId] = p._sum.credits || 0; });

        const consumedMap = {};
        ordersAgg.forEach(o => { consumedMap[o.supplierId] = o._sum.creditsConsumedSupplier || 0; });

        const enrichedSuppliers = suppliers.map(s => {
            const purchased = purchasedMap[s.id] || 0;
            const consumed = consumedMap[s.id] || 0;

            return {
                ...s,
                stats: {
                    totalPurchased: purchased,
                    totalConsumed: consumed,
                    balance: purchased - consumed
                }
            };
        });

        res.json(enrichedSuppliers);
    } catch (error) {
        console.error('Error listing suppliers:', error);
        res.status(500).json({ error: 'Failed to list suppliers' });
    }
});

// Create Supplier
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const supplier = await prisma.supplier.create({
            data: { name }
        });
        res.json(supplier);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

// Add Credit Package to Supplier
router.post('/:id/packages', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, credits, purchaseDate } = req.body;

        if (!price || !credits) return res.status(400).json({ error: 'Price and Credits are required' });

        const priceNum = parseFloat(price);
        const creditsNum = parseInt(credits);
        const costPerCredit = priceNum / creditsNum;

        const pkg = await prisma.creditPackage.create({
            data: {
                supplierId: id,
                name: name || `Pacote ${new Date().toLocaleDateString()}`,
                price: priceNum,
                credits: creditsNum,
                costPerCredit: costPerCredit,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date()
            }
        });

        res.json(pkg);
    } catch (error) {
        console.error('Error adding package:', error);
        res.status(500).json({ error: 'Failed to add package' });
    }
});

module.exports = router;
