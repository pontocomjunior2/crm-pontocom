const express = require('express');
const prisma = require('../db');
const router = express.Router();

// GET /api/service-types - List all service types
router.get('/', async (req, res) => {
    try {
        const types = await prisma.serviceType.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(types);
    } catch (error) {
        console.error('Error fetching service types:', error);
        res.status(500).json({ error: 'Failed to fetch service types' });
    }
});

// POST /api/service-types - Create new service type
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const normalizedName = name.trim().toUpperCase();

        // Check for duplicates (case-insensitive due to toUpperCase)
        const existing = await prisma.serviceType.findUnique({
            where: { name: normalizedName }
        });

        if (existing) {
            return res.status(400).json({
                error: 'Serviço já existe',
                message: `O serviço "${normalizedName}" já está cadastrado.`
            });
        }

        const newType = await prisma.serviceType.create({
            data: { name: normalizedName }
        });

        res.status(201).json(newType);
    } catch (error) {
        console.error('Error creating service type:', error);
        res.status(500).json({ error: 'Failed to create service type' });
    }
});

// Initialize default service types
router.post('/init', async (req, res) => {
    try {
        const defaults = ['PLANO MENSAL', 'PACOTE DE AUDIOS', 'STREAMING'];
        const results = [];

        for (const name of defaults) {
            const existing = await prisma.serviceType.findUnique({
                where: { name }
            });

            if (!existing) {
                const created = await prisma.serviceType.create({
                    data: { name }
                });
                results.push(created);
            }
        }

        res.json({ message: 'Initialization complete', created: results });
    } catch (error) {
        console.error('Error initializing service types:', error);
        res.status(500).json({ error: 'Failed to initialize service types' });
    }
});

module.exports = router;
