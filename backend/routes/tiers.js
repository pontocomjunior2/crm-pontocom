const express = require('express');
const prisma = require('../db');
const router = express.Router();

// Middleware to check if user is ADMIN
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    }
    next();
};

// GET /api/tiers - List all tiers
router.get('/', isAdmin, async (req, res) => {
    try {
        const tiers = await prisma.tier.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
        res.json(tiers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tiers' });
    }
});

// POST /api/tiers - Create new tier
router.post('/', isAdmin, async (req, res) => {
    try {
        const { name, ...permissions } = req.body;
        const tier = await prisma.tier.create({
            data: {
                name,
                ...permissions
            }
        });
        res.status(201).json(tier);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A tier with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create tier' });
    }
});

// PUT /api/tiers/:id - Update tier
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ...permissions } = req.body;
        const tier = await prisma.tier.update({
            where: { id },
            data: {
                name,
                ...permissions
            }
        });
        res.json(tier);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update tier' });
    }
});

// DELETE /api/tiers/:id - Delete tier
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if users are using this tier
        const userCount = await prisma.user.count({ where: { tierId: id } });
        if (userCount > 0) {
            return res.status(400).json({ error: 'Cannot delete tier while it is assigned to users' });
        }

        await prisma.tier.delete({ where: { id } });
        res.json({ message: 'Tier deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete tier' });
    }
});

module.exports = router;
