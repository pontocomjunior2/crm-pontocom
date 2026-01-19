const express = require('express');
const prisma = require('../db');
const { clientSelectionCache } = require('../utils/cache');

const router = express.Router();

// GET /api/clients/selection - Optimized route for dropdowns
router.get('/selection', async (req, res) => {
    try {
        const cached = clientSelectionCache.get('all_active');
        if (cached) {
            return res.json(cached);
        }

        const clients = await prisma.client.findMany({
            where: { status: 'ativado' },
            select: {
                id: true,
                name: true,
                razaoSocial: true
            },
            orderBy: { name: 'asc' }
        });

        clientSelectionCache.set('all_active', clients);
        res.json(clients);
    } catch (error) {
        console.error('Error fetching client selection:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/clients - List all clients with pagination and search
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            name = '',
            cidade = '',
            cnpj_cpf = '',
            packageStatus = '', // 'active', 'inactive'
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const now = new Date();

        const where = {};

        // Specific granular filters
        const andFilters = [];

        if (name) {
            andFilters.push({ name: { contains: name, mode: 'insensitive' } });
        }
        if (cidade) {
            andFilters.push({ cidade: { contains: cidade, mode: 'insensitive' } });
        }
        if (cnpj_cpf) {
            const hasLetters = /[a-zA-Z]/.test(cnpj_cpf);
            if (hasLetters) {
                andFilters.push({ cnpj_cpf: { contains: cnpj_cpf, mode: 'insensitive' } });
            } else {
                andFilters.push({ cnpj_cpf: { contains: cnpj_cpf.replace(/\D/g, '') } });
            }
        }

        // Global search filter (fallback/combined)
        if (search) {
            const searchHasLetters = /[a-zA-Z]/.test(search);
            const searchCNPJ = searchHasLetters ? search : search.replace(/\D/g, '');

            const searchOR = [
                { name: { contains: search, mode: 'insensitive' } },
                { razaoSocial: { contains: search, mode: 'insensitive' } },
                { cnpj_cpf: { contains: searchCNPJ, mode: 'insensitive' } },
                { emailPrincipal: { contains: search, mode: 'insensitive' } },
            ];
            andFilters.push({ OR: searchOR });
        }

        if (andFilters.length > 0) {
            where.AND = andFilters;
        }

        if (status) {
            where.status = status;
        }

        // Package status filter
        if (packageStatus === 'active') {
            where.packages = {
                some: {
                    active: true,
                    startDate: { lte: now },
                    endDate: { gte: now }
                }
            };
        } else if (packageStatus === 'inactive') {
            where.NOT = {
                packages: {
                    some: {
                        active: true,
                        startDate: { lte: now },
                        endDate: { gte: now }
                    }
                }
            };
        }

        // Define sorting
        const orderBy = {};
        if (sortBy === 'name') {
            orderBy.name = sortOrder;
        } else if (sortBy === 'createdAt') {
            orderBy.createdAt = sortOrder;
        } else if (sortBy === 'totalVendas') {
            orderBy.totalVendas = sortOrder;
        } else {
            orderBy[sortBy] = sortOrder;
        }

        const [rawClients, total] = await Promise.all([
            prisma.client.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy,
                include: {
                    packages: {
                        where: {
                            active: true,
                            startDate: { lte: now },
                            endDate: { gte: now }
                        },
                        take: 1
                    },
                    orders: {
                        where: {
                            status: 'VENDA'
                        },
                        select: {
                            vendaValor: true,
                            date: true
                        },
                        orderBy: {
                            date: 'desc'
                        }
                    },
                    _count: {
                        select: { orders: { where: { status: 'VENDA' } } }
                    }
                }
            }),
            prisma.client.count({ where })
        ]);

        const clients = rawClients.map(client => {
            // Calculate total sales
            const totalVendas = client.orders.reduce((sum, order) => {
                return sum + parseFloat(order.vendaValor || 0);
            }, 0);

            // Get last sale date
            let dataUltimaVenda = null;
            if (client.orders.length > 0) {
                const lastDate = new Date(client.orders[0].date);
                dataUltimaVenda = lastDate.toLocaleDateString('pt-BR');
            }

            return {
                ...client,
                totalVendas,
                dataUltimaVenda: dataUltimaVenda || client.dataUltimaVenda, // Fallback to stored if computed is null (though computed is more accurate)
                salesCount: client._count.orders,
                orders: undefined // Remove orders from response to keep it light
            };
        });

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
            observacoes,
            isInternational
        } = req.body;

        // Validate required fields
        if (!cnpj_cpf) {
            return res.status(400).json({ error: 'CNPJ/CPF is required' });
        }

        if (!name && !razaoSocial) {
            return res.status(400).json({ error: 'Name or Razão Social is required' });
        }

        // Check for duplicate CNPJ/CPF
        // If international, allow raw value (maybe trim). If clean BR, use digits only
        let cleanCNPJ = cnpj_cpf;
        if (!isInternational) {
            cleanCNPJ = cnpj_cpf.replace(/\D/g, '');
        } else {
            cleanCNPJ = cnpj_cpf.trim();
        }

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

        clientSelectionCache.clear();
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
            observacoes,
            isInternational
        } = req.body;

        // Check if client exists
        const existing = await prisma.client.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // If CNPJ is being changed, check for duplicates
        let cleanCNPJ = undefined;
        if (cnpj_cpf) {
            if (!isInternational) {
                cleanCNPJ = cnpj_cpf.replace(/\D/g, '');
            } else {
                cleanCNPJ = cnpj_cpf.trim();
            }

            if (cleanCNPJ !== existing.cnpj_cpf) {
                const duplicate = await prisma.client.findUnique({
                    where: { cnpj_cpf: cleanCNPJ }
                });
                if (duplicate && duplicate.id !== id) {
                    return res.status(409).json({ error: 'Client with this CNPJ/CPF already exists' });
                }
            }
        }

        const client = await prisma.client.update({
            where: { id },
            data: {
                name,
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

        clientSelectionCache.clear();
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

        clientSelectionCache.clear();
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client', message: error.message });
    }
});

module.exports = router;
