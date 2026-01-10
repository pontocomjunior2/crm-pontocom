const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Get all locutores
router.get('/', async (req, res) => {
    try {
        const { search, status, sortBy = 'name', sortOrder = 'asc' } = req.query;
        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { realName: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (status) {
            where.status = status;
        }

        const locutores = await prisma.locutor.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });
        res.json(locutores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single locutor
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const locutor = await prisma.locutor.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });
        if (!locutor) return res.status(404).json({ error: 'Locutor não encontrado' });
        res.json(locutor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create locutor
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const locutor = await prisma.locutor.create({
            data: {
                name: data.name,
                realName: data.realName,
                phone: data.phone,
                email: data.email,
                status: data.status || 'DISPONIVEL',
                reelsUrl: data.reelsUrl,
                priceOff: parseFloat(data.priceOff) || 0,
                priceProduzido: parseFloat(data.priceProduzido) || 0,
                valorFixoMensal: data.valorFixoMensal ? parseFloat(data.valorFixoMensal) : null,
                chavePix: data.chavePix,
                tipoChavePix: data.tipoChavePix,
                banco: data.banco,
                description: data.description
            }
        });
        res.status(201).json(locutor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update locutor
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const locutor = await prisma.locutor.update({
            where: { id },
            data: {
                name: data.name,
                realName: data.realName,
                phone: data.phone,
                email: data.email,
                status: data.status,
                reelsUrl: data.reelsUrl,
                priceOff: data.priceOff !== undefined ? parseFloat(data.priceOff) : undefined,
                priceProduzido: data.priceProduzido !== undefined ? parseFloat(data.priceProduzido) : undefined,
                valorFixoMensal: data.valorFixoMensal !== undefined ? (data.valorFixoMensal ? parseFloat(data.valorFixoMensal) : null) : undefined,
                chavePix: data.chavePix,
                tipoChavePix: data.tipoChavePix,
                banco: data.banco,
                description: data.description
            }
        });
        res.json(locutor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete locutor
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.locutor.delete({ where: { id } });
        res.json({ message: 'Locutor excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
