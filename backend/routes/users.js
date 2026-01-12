const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcryptjs');

// Middleware to check if user is ADMIN
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    }
    next();
};

// GET /api/users - List all users (Admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tierId: true,
                tier: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// POST /api/users - Create new user (Admin only)
router.post('/', isAdmin, async (req, res) => {
    const { email, password, name, role } = req.body;

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'E-mail já cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'USER',
                tierId: req.body.tierId || null
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tier: true
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// PUT /api/users/:id - Update user (Admin only or self)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { email, password, name, role } = req.body;

    // Only Admin can change roles or change other people's data
    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    try {
        const data = { email, name };

        // Only Admin can change role
        if (req.user.role === 'ADMIN') {
            if (role) data.role = role;
            if (req.body.tierId !== undefined) data.tierId = req.body.tierId;
        }

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tier: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;

    if (req.user.userId === id) {
        return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
    }

    try {
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
});

module.exports = router;
