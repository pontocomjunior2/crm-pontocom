const express = require('express');
const router = express.Router();
const prisma = require('../db');


// List Suppliers
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

        // Enrich with calculated stats (total credits bought vs consumed) - simplified for now
        // Advanced logic would require summing up all orders linked to locutores from this supplier

        res.json(suppliers);
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
