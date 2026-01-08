const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/clients - List all clients with pagination and search
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { razaoSocial: { contains: search, mode: 'insensitive' } },
                { cnpj_cpf: { contains: search.replace(/\D/g, '') } },
                { emailPrincipal: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Status filter
        if (status) {
            where.status = status;
        }

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { orders: true }
                    }
                }
            }),
            prisma.client.count({ where })
        ]);

        res.json({
            clients,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients', message: error.message });
    }
});

// GET /api/clients/:id - Get single client
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                orders: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(client);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client', message: error.message });
    }
});

// POST /api/clients - Create new client
router.post('/', async (req, res) => {
    try {
        const {
            name,
            razaoSocial,
            cnpj_cpf,
            dataCriacao,
            status = 'ativado',
            inscricaoEstadual,
            emailPrincipal,
            telefonePrincipal,
            cep,
            estado,
            cidade,
            endereco,
            numero,
            bairro,
            complemento,
            nomeContato,
            emailContato,
            dataAniversario,
            observacoes
        } = req.body;

        // Validate required fields
        if (!cnpj_cpf) {
            return res.status(400).json({ error: 'CNPJ/CPF is required' });
        }

        if (!name && !razaoSocial) {
            return res.status(400).json({ error: 'Name or Razão Social is required' });
        }

        // Check for duplicate CNPJ/CPF
        const cleanCNPJ = cnpj_cpf.replace(/\D/g, '');
        const existing = await prisma.client.findUnique({
            where: { cnpj_cpf: cleanCNPJ }
        });

        if (existing) {
            return res.status(409).json({ error: 'Client with this CNPJ/CPF already exists' });
        }

        const client = await prisma.client.create({
            data: {
                name: name || razaoSocial,
                razaoSocial,
                cnpj_cpf: cleanCNPJ,
                dataCriacao,
                status,
                inscricaoEstadual,
                emailPrincipal,
                telefonePrincipal,
                cep,
                estado,
                cidade,
                endereco,
                numero,
                bairro,
                complemento,
                nomeContato,
                emailContato,
                dataAniversario,
                observacoes
            }
        });

        res.status(201).json(client);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client', message: error.message });
    }
});

// PUT /api/clients/:id - Update client
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            razaoSocial,
            cnpj_cpf,
            dataCriacao,
            status,
            inscricaoEstadual,
            emailPrincipal,
            telefonePrincipal,
            cep,
            estado,
            cidade,
            endereco,
            numero,
            bairro,
            complemento,
            nomeContato,
            emailContato,
            dataAniversario,
            observacoes
        } = req.body;

        // Check if client exists
        const existing = await prisma.client.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // If CNPJ is being changed, check for duplicates
        if (cnpj_cpf && cnpj_cpf !== existing.cnpj_cpf) {
            const cleanCNPJ = cnpj_cpf.replace(/\D/g, '');
            const duplicate = await prisma.client.findUnique({
                where: { cnpj_cpf: cleanCNPJ }
            });
            if (duplicate && duplicate.id !== id) {
                return res.status(409).json({ error: 'Client with this CNPJ/CPF already exists' });
            }
        }

        const client = await prisma.client.update({
            where: { id },
            data: {
                name,
                razaoSocial,
                cnpj_cpf: cnpj_cpf ? cnpj_cpf.replace(/\D/g, '') : undefined,
                dataCriacao,
                status,
                inscricaoEstadual,
                emailPrincipal,
                telefonePrincipal,
                cep,
                estado,
                cidade,
                endereco,
                numero,
                bairro,
                complemento,
                nomeContato,
                emailContato,
                dataAniversario,
                observacoes
            }
        });

        res.json(client);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client', message: error.message });
    }
});

// DELETE /api/clients/:id - Delete client (soft delete by setting status to 'inativo')
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const client = await prisma.client.findUnique({ where: { id } });
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Soft delete by setting status to 'inativo'
        await prisma.client.update({
            where: { id },
            data: { status: 'inativo' }
        });

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client', message: error.message });
    }
});

module.exports = router;
