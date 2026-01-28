const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../db');

const router = express.Router();

// Configure multer for OS/PP file uploads
// Helper to sanitize filename
const sanitizeFilename = (filename) => {
    return filename
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace non-ascii with _
        .replace(/\s+/g, "_"); // Replace spaces with _
};

// Configure multer for OS/PP file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/os';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // If customName is provided in req.body, use it (sanitized)
        const nameToUse = req.body.customName || file.originalname;
        const sanitized = sanitizeFilename(nameToUse);

        // Ensure extension is correct
        const ext = path.extname(sanitized) === path.extname(file.originalname)
            ? ""
            : path.extname(file.originalname);

        cb(null, sanitized + ext);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Somente arquivos PDF ou Imagens são permitidos'), false);
        }
    }
});

// GET /api/orders/check-file/:filename - Check if file exists
router.get('/check-file/:filename', (req, res) => {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(__dirname, '../uploads/os', filename);

    if (fs.existsSync(filePath)) {
        return res.json({ exists: true, message: 'Arquivo já existe' });
    }
    res.json({ exists: false });
});

// GET /api/orders - List all orders with filters
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            clientId = '',
            clientName = '',
            numeroVenda = '',
            title = '',
            status = '',
            faturado = '',
            tipo = '',
            dateFrom = '',
            dateTo = '',
            search = '',
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};

        // Client filter
        if (clientId) {
            where.clientId = clientId;
        }

        // Type filter
        if (tipo) {
            where.tipo = tipo;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(dateFrom);
            if (dateTo) where.date.lte = new Date(dateTo);
        }

        // Specific filters
        if (clientName) {
            where.client = {
                name: { contains: clientName, mode: 'insensitive' }
            };
        }

        if (numeroVenda) {
            const numVenda = parseInt(numeroVenda);
            if (!isNaN(numVenda)) {
                where.numeroVenda = numVenda;
            }
        }

        if (title) {
            where.title = { contains: title, mode: 'insensitive' };
        }

        // Search filter (global)
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { locutor: { contains: search, mode: 'insensitive' } },
                { comentarios: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } }
            ];

            // If search is a number, also search by numeroVenda or sequentialId
            const searchNum = parseInt(search);
            if (!isNaN(searchNum)) {
                where.OR.push({ numeroVenda: searchNum });
                where.OR.push({ sequentialId: searchNum });
            }
        }

        // Faturado filter (explicit)
        if (faturado === 'true') {
            where.faturado = true;
        } else if (faturado === 'false') {
            where.faturado = false;
        }

        // Status filters
        if (status) {
            if (status === 'faturado') {
                where.faturado = true;
            } else if (status === 'entregue') {
                where.entregue = true;
            } else if (status === 'pendente') {
                where.faturado = false;
                where.entregue = true;
            } else {
                // Physical status (PEDIDO, VENDA)
                where.status = status;

                // Se estivermos listando VENDAS (Faturamento), ocultar os pedidos de pacote com valor 0
                // para não poluir a visão financeira, já que a mensalidade já foi lançada.
                if (status === 'VENDA') {
                    where.OR = [
                        { vendaValor: { gt: 0 } }, // Mostrar tudo que tem valor
                        { packageId: null }        // Ou que não seja vinculado a pacote
                    ];
                }
            }
        }

        // Define sorting
        if (sortBy === 'client') {
            orderBy = { client: { name: sortOrder } };
        } else if (sortBy === 'date') {
            orderBy = [
                { date: sortOrder },
                { numeroVenda: sortOrder }
            ];
        } else if (sortBy === 'sequentialId') {
            orderBy = { sequentialId: sortOrder };
        } else if (sortBy === 'numeroVenda') {
            orderBy = [
                { numeroVenda: sortOrder },
                { date: sortOrder }
            ];
        } else if (sortBy === 'vendaValor') {
            orderBy = [
                { vendaValor: sortOrder },
                { date: sortOrder }
            ];
        } else {
            orderBy[sortBy] = sortOrder;
        }

        const [ordersRaw, total, activeCount, salesCount, billedCount] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy,
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            razaoSocial: true,
                            cnpj_cpf: true
                        }
                    },
                    locutorObj: true,
                    supplier: true
                }
            }),
            prisma.order.count({ where }),
            prisma.order.count({ where: { ...where, status: 'PEDIDO' } }),
            prisma.order.count({ where: { ...where, status: 'VENDA' } }),
            prisma.order.count({ where: { ...where, faturado: true } })
        ]);

        // Dynamic cache calculation for monthly fixed-fee locutores
        const locutorMonthCounts = {}; // { locutorId_month: count }

        // First pass: Count orders per month for each fixed-fee locutor (only those WITHOUT manual cache)
        ordersRaw.forEach(order => {
            if (order.locutorId && order.locutorObj?.valorFixoMensal > 0 && Number(order.cacheValor) === 0) {
                const month = new Date(order.date).toISOString().substring(0, 7); // YYYY-MM
                const key = `${order.locutorId}_${month}`;
                locutorMonthCounts[key] = (locutorMonthCounts[key] || 0) + 1;
            }
        });

        // Second pass: Calculate dynamic cache valor
        const orders = ordersRaw.map(order => {
            let dynamicCacheValor = Number(order.cacheValor);

            if (order.locutorId && order.locutorObj?.valorFixoMensal > 0) {
                // If there's a manual cache value, use it directly (don't divide fixed fee)
                if (Number(order.cacheValor) > 0) {
                    dynamicCacheValor = Number(order.cacheValor);
                } else {
                    const month = new Date(order.date).toISOString().substring(0, 7);
                    const key = `${order.locutorId}_${month}`;
                    const count = locutorMonthCounts[key] || 1;
                    dynamicCacheValor = Number(order.locutorObj.valorFixoMensal) / count;
                }
            }

            return {
                ...order,
                dynamicCacheValor: parseFloat(dynamicCacheValor.toFixed(2))
            };
        });

        res.json({
            orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            },
            stats: {
                total,
                active: activeCount,
                sales: salesCount,
                billed: billedCount
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
    }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                client: true
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order', message: error.message });
    }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
    try {
        const {
            clientId,
            title,
            fileName,
            locutor,
            locutorId,
            tipo,
            urgency = 'NORMAL',
            cacheValor,
            vendaValor,
            comentarios,
            status = 'PEDIDO',
            numeroVenda,
            faturado = false,
            entregue = false,
            dispensaNF = false,
            emiteBoleto = false,
            dataFaturar,
            vencimento,
            pago = false,
            statusEnvio = 'PENDENTE',
            pendenciaFinanceiro = false,
            pendenciaMotivo = null,
            numeroOS = null,
            arquivoOS = null,
            serviceType = null,
            supplierId = null,
            creditsConsumed,
            costPerCreditSnapshot = null,
            cachePago = false,
            packageId = null,
            isBonus = false
        } = req.body;

        // Calculate Cache if Supplier Linked
        let finalCacheValor = cacheValor ? parseFloat(cacheValor) : 0;
        let creditsToConsume = (creditsConsumed !== undefined && creditsConsumed !== null) ? parseInt(creditsConsumed) : 0;
        let costPerCreditVal = null;

        if (locutorId && supplierId) {
            const locutor = await prisma.locutor.findUnique({
                where: { id: locutorId },
                include: {
                    suppliers: {
                        where: { id: supplierId },
                        include: {
                            packages: {
                                orderBy: { purchaseDate: 'desc' },
                                take: 1
                            }
                        }
                    }
                }
            });

            const selectedSupplier = locutor?.suppliers.find(s => s.id === supplierId);

            if (selectedSupplier && selectedSupplier.packages.length > 0) {
                const latestPackage = selectedSupplier.packages[0];
                costPerCreditVal = latestPackage.costPerCredit;

                // If cache is 0 (auto-calc) and we have credits to consume
                if (finalCacheValor === 0 && creditsToConsume > 0) {
                    finalCacheValor = parseFloat(costPerCreditVal) * creditsToConsume;
                }
            }
        }

        // --- Lógica de Pacote Mensal ---
        let finalVendaValor = vendaValor !== undefined ? parseFloat(vendaValor) : 0;

        // Se for bonificação, força valor 0 e ignora pacote
        if (isBonus) {
            packageId = null;
            finalVendaValor = 0;
        }
        // Se o usuário informou um valor maior que 0, trata como pedido avulso (ignora pacote)
        else if (finalVendaValor > 0 && packageId) {
            packageId = null; // Remove vínculo com pacote
        }
        else if (packageId) {
            const pkg = await prisma.clientPackage.findUnique({
                where: { id: packageId }
            });

            if (pkg && pkg.active) {
                const now = new Date();
                // Verificar se está dentro da validade
                if (now >= pkg.startDate && now <= pkg.endDate) {
                    const usage = pkg.usedAudios + creditsToConsume;

                    // Se for sob demanda e exceder o limite, cobra taxa extra
                    if (pkg.type === 'FIXO_SOB_DEMANDA' && usage > pkg.audioLimit) {
                        finalVendaValor = parseFloat(pkg.extraAudioFee);
                    } else if (pkg.type === 'FIXO_ILIMITADO') {
                        finalVendaValor = 0;
                    } else if (usage <= pkg.audioLimit) {
                        // Dentro da cota de qualquer plano com limite
                        finalVendaValor = 0;
                    }

                    // Incrementar uso no pacote
                    await prisma.clientPackage.update({
                        where: { id: packageId },
                        data: { usedAudios: usage }
                    });
                }
            }
        }

        // Validate required fields
        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (status === 'PEDIDO' && (!tipo || !['OFF', 'PRODUZIDO'].includes(tipo))) {
            return res.status(400).json({ error: 'Type must be OFF or PRODUZIDO for orders' });
        }

        // Verify client exists
        const client = await prisma.client.findUnique({
            where: { id: clientId }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        let finalNumeroVenda = numeroVenda ? parseInt(numeroVenda) : null;

        // If a manual number is provided, check for uniqueness
        if (finalNumeroVenda) {
            const existingNum = await prisma.order.findUnique({
                where: { numeroVenda: finalNumeroVenda }
            });
            if (existingNum) {
                return res.status(400).json({
                    error: 'Manual number already exists',
                    message: `O número de pedido ${finalNumeroVenda} já está em uso.`
                });
            }
        }

        // Auto-generate numeroVenda for direct sales if not provided
        if (status === 'VENDA' && !finalNumeroVenda) {
            const lastSale = await prisma.order.findFirst({
                where: { numeroVenda: { not: null } },
                orderBy: { numeroVenda: 'desc' }
            });

            const lastId = lastSale?.numeroVenda || 42531;
            finalNumeroVenda = lastId + 1;
        }

        const order = await prisma.order.create({
            data: {
                clientId,
                title,
                fileName,
                locutor: locutor || '',
                locutorId: locutorId || null,
                tipo,
                urgency,
                cacheValor: parseFloat(finalCacheValor),
                vendaValor: parseFloat(finalVendaValor),
                comentarios,
                status,
                numeroVenda: finalNumeroVenda || null,
                faturado,
                entregue,
                dispensaNF,
                emiteBoleto,
                dataFaturar: dataFaturar ? new Date(dataFaturar) : null,
                vencimento: vencimento ? new Date(vencimento) : null,
                pago,
                statusEnvio,
                pendenciaFinanceiro,
                pendenciaMotivo,
                numeroOS: numeroOS || null,
                arquivoOS: arquivoOS || null,
                serviceType: serviceType || null,
                supplierId: supplierId || null,
                creditsConsumed: creditsToConsume,
                costPerCreditSnapshot: costPerCreditVal,
                cachePago: cachePago || false,
                packageId: packageId || null,
                isBonus: isBonus
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        razaoSocial: true,
                        cnpj_cpf: true
                    }
                }
            }
        });

        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order', message: error.message });
    }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            clientId,
            title,
            fileName,
            locutor,
            locutorId,
            tipo,
            urgency,
            cacheValor,
            vendaValor,
            comentarios,
            status,
            numeroVenda,
            faturado,
            entregue,
            dispensaNF,
            emiteBoleto,
            dataFaturar,
            vencimento,
            pago,
            statusEnvio,
            pendenciaFinanceiro,
            pendenciaMotivo,
            numeroOS,
            arquivoOS,
            supplierId,
            cachePago,
            creditsConsumed,
            costPerCreditSnapshot,
            isBonus
        } = req.body;

        // Check if order exists
        const existing = await prisma.order.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // If client is being changed, verify new client exists
        if (clientId && clientId !== existing.clientId) {
            const client = await prisma.client.findUnique({
                where: { id: clientId }
            });
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
        }

        // If numeroVenda is being changed or set, check for uniqueness
        if (numeroVenda !== undefined && numeroVenda !== null && numeroVenda !== existing.numeroVenda) {
            const cleanNumber = parseInt(numeroVenda);
            if (!isNaN(cleanNumber)) {
                const existingNum = await prisma.order.findUnique({
                    where: { numeroVenda: cleanNumber }
                });

                if (existingNum && existingNum.id !== id) {
                    return res.status(400).json({
                        error: 'Manual number already exists',
                        message: `O número de pedido ${cleanNumber} já está em uso.`
                    });
                }
            }
        }

        // Lógica de Estorno se virar Avulso
        const newVendaValor = vendaValor !== undefined ? parseFloat(vendaValor) : undefined;

        console.log('DEBUG UPDATE ORDER:', {
            id,
            newVendaValor,
            bodyPackageId: req.body.packageId,
            existingPackageId: existing.packageId,
            existingValor: existing.vendaValor
        });

        const newIsBonus = isBonus !== undefined ? isBonus : existing.isBonus;

        // Se virou bonificação agora ou se já era e está sendo atualizado
        if (newIsBonus) {
            // Se estava consumindo pacote antes (vendaValor era 0 e tinha packageId), estorna
            if (existing.packageId && Number(existing.vendaValor) === 0 && !existing.isBonus) {
                const pkg = await prisma.clientPackage.findUnique({
                    where: { id: existing.packageId }
                });
                if (pkg) {
                    await prisma.clientPackage.update({
                        where: { id: pkg.id },
                        data: { usedAudios: { decrement: 1 } }
                    });
                }
            }
            // Força valores de bonificação
            req.body.packageId = null;
            req.body.vendaValor = 0;
        }
        // Se NÃO é bonificação, mas virou Avulso ou Pacote
        else if (existing.packageId && newVendaValor > 0) {
            // Só executa o estorno se o valor anterior era 0 (era consumo de pacote)
            if (Number(existing.vendaValor) === 0) {
                const pkg = await prisma.clientPackage.findUnique({
                    where: { id: existing.packageId }
                });
                if (pkg) {
                    await prisma.clientPackage.update({
                        where: { id: pkg.id },
                        data: { usedAudios: { decrement: 1 } }
                    });
                }
            }
            // Forçar desvinculação do pacote na atualização
            req.body.packageId = null;
        } else if (newVendaValor === 0 && !newIsBonus) {
            // Lógica inversa: Se virar Pacote (valor 0) e NÃO for bônus
            // Verifica se estava consumindo antes (ou se era bônus)
            const wasConsuming = existing.packageId && Number(existing.vendaValor) === 0;
            const wasBonus = existing.isBonus;

            if (!wasConsuming || wasBonus) {
                let pkgToDebitId = req.body.packageId;

                // Se não veio ID do pacote, buscar ativo no banco
                if (!pkgToDebitId) {
                    const now = new Date();
                    const activePkg = await prisma.clientPackage.findFirst({
                        where: {
                            clientId: clientId || existing.clientId,
                            active: true,
                            startDate: { lte: now },
                            endDate: { gte: now }
                        }
                    });
                    if (activePkg) pkgToDebitId = activePkg.id;
                }

                if (pkgToDebitId) {
                    try {
                        await prisma.clientPackage.update({
                            where: { id: pkgToDebitId },
                            data: { usedAudios: { increment: 1 } }
                        });
                        // Garantir que o vínculo seja salvo no pedido
                        req.body.packageId = pkgToDebitId;
                    } catch (e) {
                        console.error('Falha ao debitar pacote na edição:', e);
                        // Se falhou (ex: erro de banco), garantimos que não fica vinculado incorretamente
                        req.body.packageId = null;
                    }
                }
            }
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                clientId,
                title,
                fileName,
                locutor,
                locutorId: locutorId || null,
                tipo,
                urgency,
                cacheValor: cacheValor !== undefined ? parseFloat(cacheValor) : undefined,
                vendaValor: vendaValor !== undefined ? parseFloat(vendaValor) : undefined,
                comentarios,
                status,
                numeroVenda: numeroVenda !== undefined ? (numeroVenda ? parseInt(numeroVenda) : null) : undefined,
                faturado,
                entregue,
                dispensaNF,
                emiteBoleto,
                dataFaturar: dataFaturar ? new Date(dataFaturar) : undefined,
                vencimento: vencimento ? new Date(vencimento) : undefined,
                pago,
                statusEnvio,
                pendenciaFinanceiro,
                pendenciaMotivo,
                numeroOS,
                arquivoOS,
                supplierId: supplierId || null, // Convert empty string to null
                packageId: req.body.packageId, // Allow explicit packageId update
                cachePago: cachePago !== undefined ? cachePago : undefined,
                creditsConsumed: creditsConsumed !== undefined ? parseInt(creditsConsumed) : undefined,
                costPerCreditSnapshot: costPerCreditSnapshot !== undefined ? parseFloat(costPerCreditSnapshot) : undefined,
                isBonus: isBonus !== undefined ? isBonus : undefined
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        razaoSocial: true,
                        cnpj_cpf: true
                    }
                }
            }
        });

        res.json(order);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order', message: error.message });
    }
});

// PATCH /api/orders/:id/convert - Convert PEDIDO to VENDA
router.patch('/:id/convert', async (req, res) => {
    try {
        const { id } = req.params;

        const currentOrder = await prisma.order.findUnique({ where: { id } });

        let nextVendaId = undefined;

        // If not already a sale or doesn't have a number, generate one
        if (currentOrder && !currentOrder.numeroVenda) {
            const lastSale = await prisma.order.findFirst({
                where: { numeroVenda: { not: null } },
                orderBy: { numeroVenda: 'desc' }
            });

            const lastId = lastSale?.numeroVenda || 42531; // Start at 42531 so first is 42532
            nextVendaId = lastId + 1;
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                status: 'VENDA',
                entregue: true,
                numeroVenda: nextVendaId // Will be undefined if not generating new
            },
            include: { client: true }
        });

        // Lógica de Débito de Pacote se for consumo (vendaValor 0)
        if (order.packageId && Number(order.vendaValor) === 0) {
            try {
                await prisma.clientPackage.update({
                    where: { id: order.packageId },
                    data: { usedAudios: { increment: 1 } }
                });
            } catch (pkgError) {
                console.error('Erro ao debitar crédito do pacote na conversão:', pkgError);
                // Não travamos a conversão, mas logamos o erro específico
            }
        }

        res.json(order);
    } catch (error) {
        console.error('Error converting order:', error);
        res.status(500).json({ error: 'Failed to convert order', message: error.message });
    }
});

// PATCH /api/orders/:id/revert - Revert VENDA to PEDIDO
router.patch('/:id/revert', async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.update({
            where: { id },
            data: {
                status: 'PEDIDO',
                entregue: false
            },
            include: { client: true }
        });

        // Lógica de Estorno de Pacote se era consumo (vendaValor 0)
        if (order.packageId && Number(order.vendaValor) === 0) {
            try {
                await prisma.clientPackage.update({
                    where: { id: order.packageId },
                    data: { usedAudios: { decrement: 1 } }
                });
            } catch (pkgError) {
                console.error('Erro ao estornar crédito do pacote na reversão:', pkgError);
            }
        }

        res.json(order);
    } catch (error) {
        console.error('Error reverting order:', error);
        res.status(500).json({ error: 'Failed to revert order', message: error.message });
    }
});

// POST /api/orders/:id/clone - Duplicate an existing order
router.post('/:id/clone', async (req, res) => {
    try {
        const { id } = req.params;

        const original = await prisma.order.findUnique({
            where: { id }
        });

        if (!original) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Prepare clone data by removing unique/resetting fields
        const {
            id: _,
            sequentialId: __,
            numeroVenda: ___,
            date: ____,
            updatedAt: _____,
            createdAt: ______,
            ...cloneData
        } = original;

        // Reset lifecycle flags for the new entry
        // Clones ALWAYS start as 'PEDIDO', regardless of original status
        cloneData.status = 'PEDIDO';
        cloneData.faturado = false;
        cloneData.entregue = false;
        cloneData.pago = false;
        cloneData.dataFaturar = null;
        cloneData.vencimento = null;
        cloneData.statusEnvio = 'PENDENTE';
        cloneData.numeroVenda = null;

        const clonedOrder = await prisma.order.create({
            data: cloneData,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        razaoSocial: true,
                        cnpj_cpf: true
                    }
                }
            }
        });

        res.status(201).json(clonedOrder);
    } catch (error) {
        console.error('Error cloning order:', error);
        res.status(500).json({ error: 'Failed to clone order', message: error.message });
    }
});

// POST /api/orders/bulk-delete - delete multiple orders
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs array is required' });
        }

        const ordersToDelete = await prisma.order.findMany({
            where: { id: { in: ids } },
            select: { id: true, packageId: true }
        });

        // Estorno de créditos de pacote
        for (const order of ordersToDelete) {
            if (order.packageId) {
                const pkg = await prisma.clientPackage.findUnique({
                    where: { id: order.packageId }
                });
                if (pkg) {
                    await prisma.clientPackage.update({
                        where: { id: pkg.id },
                        data: { usedAudios: { decrement: 1 } }
                    });
                }
            }
        }

        await prisma.order.deleteMany({
            where: { id: { in: ids } }
        });

        res.json({ success: true, message: `${ids.length} orders deleted` });
    } catch (error) {
        console.error('Error bulk deleting orders:', error);
        res.status(500).json({ error: 'Failed to delete orders' });
    }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Estorno de crédito se vinculado a pacote
        if (order.packageId) {
            const pkg = await prisma.clientPackage.findUnique({
                where: { id: order.packageId }
            });
            if (pkg) {
                // Decrement use, ensuring it doesn't go below 0 handled by logic or db check
                // Using decrement is safer for concurrency
                await prisma.clientPackage.update({
                    where: { id: pkg.id },
                    data: { usedAudios: { decrement: 1 } }
                });
            }
        }

        await prisma.order.delete({ where: { id } });

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order', message: error.message });
    }
});

// POST /api/orders/:id/upload-os - Upload OS/PP file
router.post('/:id/upload-os', upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const arquivoOS = `/uploads/os/${req.file.filename}`;

        const order = await prisma.order.update({
            where: { id },
            data: {
                arquivoOS,
                pendenciaFinanceiro: false // Clear pendency when file is uploaded
            }
        });

        res.json({ message: 'Arquivo enviado com sucesso', arquivoOS, order });
    } catch (error) {
        console.error('Error uploading OS file:', error);
        res.status(500).json({ error: 'Falha ao enviar arquivo' });
    }
});

// DELETE /api/orders/:id/remove-os - Remove OS/PP file association and delete file
router.delete('/:id/remove-os', async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            select: { arquivoOS: true }
        });

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        if (order.arquivoOS) {
            const filePath = path.join(__dirname, '..', order.arquivoOS);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await prisma.order.update({
            where: { id },
            data: {
                arquivoOS: null,
                numeroOS: ''
            }
        });

        res.json({ message: 'Arquivo removido com sucesso' });
    } catch (error) {
        console.error('Error removing OS file:', error);
        res.status(500).json({ error: 'Falha ao remover arquivo' });
    }
});

module.exports = router;
