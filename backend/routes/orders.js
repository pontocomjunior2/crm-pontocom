const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../db');
const storageService = require('../services/storageService');
const PackageService = require('../services/packageService');

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
            sortOrder = 'desc',
            serviceType = ''
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            packageId: null
        };
        const andConditions = [];

        // Client filter
        if (clientId) {
            where.clientId = clientId;
        }

        // Type filter
        if (tipo) {
            where.tipo = tipo;
        }

        // Service Type filter
        if (serviceType) {
            where.serviceType = serviceType;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(`${dateFrom}T00:00:00-03:00`);
            if (dateTo) where.date.lte = new Date(`${dateTo}T23:59:59.999-03:00`);
        }

        // Specific filters - now added to AND conditions
        if (clientName) {
            andConditions.push({
                client: {
                    name: { contains: clientName, mode: 'insensitive' }
                }
            });
        }

        if (numeroVenda) {
            const numVenda = parseInt(numeroVenda);
            if (!isNaN(numVenda)) {
                andConditions.push({ numeroVenda: numVenda });
            }
        }

        if (title) {
            andConditions.push({ title: { contains: title, mode: 'insensitive' } });
        }

        // Search filter (global) - now combined with other filters via AND
        if (search) {
            const searchConditions = [
                { title: { contains: search, mode: 'insensitive' } },
                { locutor: { contains: search, mode: 'insensitive' } },
                { comentarios: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } }
            ];

            // If search is a number, also search by numeroVenda or sequentialId
            const searchNum = parseInt(search);
            if (!isNaN(searchNum)) {
                searchConditions.push({ numeroVenda: searchNum });
                searchConditions.push({ sequentialId: searchNum });
            }

            andConditions.push({ OR: searchConditions });
        }

        // Apply AND conditions if any exist
        if (andConditions.length > 0) {
            where.AND = andConditions;
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
            }
        }

        // Define sorting
        if (sortBy === 'client') {
            orderBy = { client: { name: sortOrder } };
        } else if (sortBy === 'date') {
            orderBy = [
                { date: sortOrder },
                { createdAt: sortOrder },
                { numeroVenda: sortOrder }
            ];
        } else if (sortBy === 'sequentialId') {
            orderBy = { sequentialId: sortOrder };
        } else if (sortBy === 'numeroVenda') {
            orderBy = [
                { numeroVenda: sortOrder }
            ];
        } else if (sortBy === 'faturado') {
            orderBy = [
                { faturado: sortOrder },
                { numeroVenda: 'desc' }
            ];
        } else if (sortBy === 'vendaValor') {
            orderBy = [
                { vendaValor: sortOrder },
                { date: sortOrder }
            ];
        } else {
            orderBy = { [sortBy]: sortOrder };
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

// GET /api/orders/:id - Get order details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id },
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
                package: true,
                supplier: true
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
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
            creditsConsumedSupplier = null,
            costPerCreditSnapshot = null,
            cachePago = false,
            isBonus = false
        } = req.body;

        let packageId = req.body.packageId || null;

        // Calculate Cache if Supplier Linked
        let finalCacheValor = cacheValor ? parseFloat(cacheValor) : 0;
        let creditsToConsume = (creditsConsumed !== undefined && creditsConsumed !== null) ? parseInt(creditsConsumed) : 0;
        let creditsToConsumeSupplier = (creditsConsumedSupplier !== undefined && creditsConsumedSupplier !== null) ? parseInt(creditsConsumedSupplier) : creditsToConsume;
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
                                // take: 1 -- We need to inspect more to find a valid commercial package
                            }
                        }
                    }
                }
            });

            const selectedSupplier = locutor?.suppliers.find(s => s.id === supplierId);

            if (selectedSupplier && selectedSupplier.packages.length > 0) {
                // Find first package that is NOT an adjustment (price > 0)
                const latestCommercialPackage = selectedSupplier.packages.find(p => Number(p.price) > 0);

                // Fallback to latest package if no commercial package found (shouldn't happen in normal flow but safe to have)
                const refPackage = latestCommercialPackage || selectedSupplier.packages[0];

                costPerCreditVal = refPackage.costPerCredit;

                // If cache is 0 (auto-calc) and we have credits to consume
                if (finalCacheValor === 0 && creditsToConsumeSupplier > 0) {
                    finalCacheValor = parseFloat(costPerCreditVal) * creditsToConsumeSupplier;
                }
            }
        }

        // --- Lógica de Pacote Mensal ---
        let finalVendaValor = vendaValor !== undefined ? parseFloat(vendaValor) : 0;
        let packageIdSnapshot = packageId; // Store for sync after creation

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
            // Buscar o pacote mais recente e ativo do cliente para garantir isolamento
            const mostRecentPackage = await prisma.clientPackage.findFirst({
                where: {
                    clientId: req.body.clientId,
                    active: true
                },
                orderBy: { createdAt: 'desc' }
            });

            if (!mostRecentPackage) {
                return res.status(400).json({
                    error: 'NO_ACTIVE_PACKAGE',
                    message: 'Erro no Backend: Cliente não possui pacote ativo. Crie um novo pacote ou defina um valor de venda (Pedido Avulso).'
                });
            }

            // Se o packageId fornecido não é o mais recente, usar o mais recente e avisar
            if (mostRecentPackage.id !== packageId) {
                console.warn(`[PACKAGE_ISOLATION] PackageId ${packageId} fornecido, mas usando pacote mais recente ${mostRecentPackage.id} para cliente ${req.body.clientId}`);
                packageId = mostRecentPackage.id;
            }

            const pkg = mostRecentPackage;
            const competenceDate = req.body.date ? new Date(req.body.date + 'T12:00:00') : new Date();
            const creditsToUse = creditsToConsume || 1;

            // 1. Verificar Validade (Regra 2 e 4) - Avisar mas permitir visualização
            if (competenceDate < pkg.startDate || competenceDate > pkg.endDate) {
                const dataFormatada = new Date(pkg.endDate).toLocaleDateString('pt-BR');
                return res.status(400).json({
                    error: 'PACKAGE_EXPIRED',
                    message: `⚠️ Atenção: O pacote "${pkg.name}" expirou em ${dataFormatada}. Para prosseguir, defina um valor de venda (Pedido Avulso) ou crie/atualize o pacote do cliente.`,
                    packageName: pkg.name,
                    packageEndDate: pkg.endDate
                });
            }

            const usageAfter = pkg.usedAudios + creditsToUse;

            // 2. Verificar Limites (Regra 3) - Avisar sobre quota excedida
            if (!['FIXO_ILIMITADO', 'FIXO_SOB_DEMANDA', 'SOB_DEMANDA_AVULSO'].includes(pkg.type)) {
                if (usageAfter > pkg.audioLimit) {
                    return res.status(400).json({
                        error: 'PACKAGE_LIMIT_REACHED',
                        message: `⚠️ Atenção: O limite de créditos do pacote "${pkg.name}" (${pkg.audioLimit}) foi atingido. Consumo atual: ${pkg.usedAudios}. Para prosseguir, defina um valor de venda (Pedido Avulso) ou altere o plano para Sob Demanda.`,
                        packageName: pkg.name,
                        currentUsage: pkg.usedAudios,
                        limit: pkg.audioLimit
                    });
                }
            }

            // O pedido individual de consumo SEMPRE terá valor 0 para faturamento
            finalVendaValor = 0;
            packageIdSnapshot = packageId;

            // --- GERAÇÃO DO CONSUMPTION ID (PC-XXXX) ---
            let consumptionId = null;
            const lastPackageOrder = await prisma.order.findFirst({
                where: {
                    consumptionId: { startsWith: 'PC-' }
                },
                orderBy: {
                    consumptionId: 'desc'
                }
            });

            let nextSeq = 1;
            if (lastPackageOrder && lastPackageOrder.consumptionId) {
                const lastNum = parseInt(lastPackageOrder.consumptionId.replace('PC-', ''));
                if (!isNaN(lastNum)) nextSeq = lastNum + 1;
            }
            consumptionId = `PC-${nextSeq.toString().padStart(4, '0')}`;

            // Adicionar campos extras ao escopo do pedido
            req.consumptionId = consumptionId;
            req.packageName = pkg.name;
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
                dataFaturar: dataFaturar ? new Date(dataFaturar + 'T12:00:00') : null,
                vencimento: vencimento ? new Date(vencimento + 'T12:00:00') : null,
                pago,
                statusEnvio,
                pendenciaFinanceiro,
                pendenciaMotivo,
                numeroOS: numeroOS || null,
                arquivoOS: arquivoOS || null,
                serviceType: serviceType || null,
                supplierId: supplierId || null,
                creditsConsumed: creditsToConsume,
                creditsConsumedSupplier: creditsToConsumeSupplier,
                costPerCreditSnapshot: costPerCreditVal ? parseFloat(costPerCreditVal) : null,
                cachePago: cachePago || false,
                packageId: packageId || null,
                packageName: req.packageName || null,
                consumptionId: req.consumptionId || null,
                isBonus: isBonus,
                // Custom Date Logic: Use provided date or default to now() (handled by Prisma default or backend logic if needed, but Prisma has @default(now()))
                // However, we want to ensure explicit dates are respected.
                // Custom Date Logic: Use T12:00:00 to avoid timezone regression
                ...(req.body.date ? { date: new Date(req.body.date + 'T12:00:00') } : {})
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

        // Sync package credits and billing if applicable
        if (packageIdSnapshot) {
            await PackageService.syncPackage(packageIdSnapshot);
        }

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
            creditsConsumed,
            creditsConsumedSupplier,
            costPerCreditSnapshot,
            isBonus,
            cachePago,

            serviceType,
            commissions // Array of { userId, percent }
        } = req.body;

        // Check if order exists
        const existing = await prisma.order.findUnique({
            where: { id },
            include: { commissions: true }
        });
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

        // --- LOGICA DE SINCRONIZAÇÃO DE CRÉDITOS EM PACOTES ---
        const wasPackageOrder = existing.packageId && Number(existing.vendaValor) === 0 && !existing.isBonus;
        const willBePackageOrder = (newVendaValor === 0 || (newVendaValor === undefined && Number(existing.vendaValor) === 0)) && !newIsBonus;

        const oldCredits = existing.creditsConsumed || 1;
        const newCreditsToConsume = (creditsConsumed !== undefined ? parseInt(creditsConsumed) : existing.creditsConsumed) || 1;
        const newPackageId = req.body.packageId !== undefined ? req.body.packageId : existing.packageId;

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
                creditsConsumedSupplier: creditsConsumedSupplier !== undefined ? parseInt(creditsConsumedSupplier) : undefined,
                costPerCreditSnapshot: costPerCreditSnapshot !== undefined ? parseFloat(costPerCreditSnapshot) : undefined,
                isBonus: isBonus !== undefined ? isBonus : undefined,
                serviceType: serviceType !== undefined ? serviceType : undefined,
                date: req.body.date ? new Date(req.body.date + 'T12:00:00') : undefined
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

        // Sync old and new package if changed
        if (existing.packageId) await PackageService.syncPackage(existing.packageId);
        if (req.body.packageId && req.body.packageId !== existing.packageId) {
            await PackageService.syncPackage(req.body.packageId);
        }

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
                numeroVenda: nextVendaId
            },
            include: { client: true }
        });

        // Sync package credits and billing
        if (order.packageId) {
            await PackageService.syncPackage(order.packageId);
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

        // Sync package credits and billing
        if (order.packageId) {
            await PackageService.syncPackage(order.packageId);
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

        // Sync package credits and billing
        if (clonedOrder.packageId) {
            await PackageService.syncPackage(clonedOrder.packageId);
        }

        res.status(201).json(clonedOrder);
    } catch (error) {
        console.error('Error cloning order:', error);
        res.status(500).json({ error: 'Failed to clone order', message: error.message });
    }
});

// POST /api/orders/batch-create - Create multiple package orders at once
router.post('/batch-create', async (req, res) => {
    try {
        const { packageId, clientId, locutor, locutorId, supplierId, date, items, creditsConsumed = 1, creditsConsumedSupplier = null } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required and cannot be empty' });
        }

        if (!packageId || !clientId || !locutorId) {
            return res.status(400).json({ error: 'packageId, clientId and locutorId are required' });
        }

        // Fetch package to check limits and credits
        const pkg = await prisma.clientPackage.findUnique({
            where: { id: packageId }
        });

        if (!pkg || !pkg.active) {
            return res.status(400).json({ error: 'PACKAGE_INACTIVE', message: 'Pacote não encontrado ou inativo.' });
        }

        const competenceDate = date ? new Date(date) : new Date();
        if (competenceDate < pkg.startDate || competenceDate > pkg.endDate) {
            return res.status(400).json({
                error: 'PACKAGE_EXPIRED',
                message: `O pacote expirou em ${new Date(pkg.endDate).toLocaleDateString('pt-BR')}.`
            });
        }

        const totalCreditsToUse = items.length; // Default 1 per item

        if (!['FIXO_ILIMITADO', 'FIXO_SOB_DEMANDA', 'SOB_DEMANDA_AVULSO'].includes(pkg.type)) {
            if (pkg.usedAudios + totalCreditsToUse > pkg.audioLimit) {
                return res.status(400).json({
                    error: 'PACKAGE_LIMIT_REACHED',
                    message: `O limite do pacote (${pkg.audioLimit}) será excedido.`
                });
            }
        }

        // Calculate unit cache if supplier linked
        let unitCacheValor = 0;
        if (locutorId && supplierId) {
            const selectedSupplier = await prisma.supplier.findUnique({
                where: { id: supplierId },
                include: {
                    packages: {
                        where: { price: { gt: 0 } },
                        orderBy: { purchaseDate: 'desc' },
                        take: 1
                    }
                }
            });
            if (selectedSupplier && selectedSupplier.packages.length > 0) {
                unitCacheValor = parseFloat(selectedSupplier.packages[0].costPerCredit);
            }
        }

        // Process creations in a transaction for consistency
        const createdOrders = await prisma.$transaction(async (tx) => {
            const results = [];

            for (const item of items) {
                const orderData = {
                    clientId,
                    packageId,
                    title: item.title,
                    fileName: item.fileName,
                    locutor,
                    locutorId,
                    supplierId,
                    tipo: 'OFF', // Default for batch upload usually
                    date: competenceDate,
                    creditsConsumed: parseInt(creditsConsumed),
                    creditsConsumedSupplier: creditsConsumedSupplier !== null ? parseInt(creditsConsumedSupplier) : parseInt(creditsConsumed),
                    cacheValor: unitCacheValor * (creditsConsumedSupplier !== null ? parseInt(creditsConsumedSupplier) : parseInt(creditsConsumed)),
                    vendaValor: 0,
                    status: 'VENDA',
                    serviceType: 'PACOTE DE AUDIOS'
                };

                const newOrder = await tx.order.create({
                    data: orderData
                });
                results.push(newOrder);
            }

            return results;
        });

        // Sync package credits and billing
        await PackageService.syncPackage(packageId);

        res.status(201).json({ success: true, count: createdOrders.length, orders: createdOrders });
    } catch (error) {
        console.error('Error in batch-create:', error);
        res.status(500).json({ error: 'Failed to create orders in batch', message: error.message });
    }
});

// POST /api/orders/bulk-update - update multiple orders
router.post('/bulk-update', async (req, res) => {
    try {
        const { ids, data } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs array is required' });
        }

        await prisma.order.updateMany({
            where: { id: { in: ids } },
            data: updateData
        });

        // Sync all affected packages (simplified: sync each package found in the updated orders)
        const affectedOrders = await prisma.order.findMany({
            where: { id: { in: ids } },
            select: { packageId: true }
        });
        const packageIds = [...new Set(affectedOrders.map(o => o.packageId).filter(Boolean))];
        for (const pid of packageIds) {
            await PackageService.syncPackage(pid);
        }

        res.json({ success: true, message: `${ids.length} orders updated` });
    } catch (error) {
        console.error('Error bulk updating orders:', error);
        res.status(500).json({ error: 'Failed to update orders' });
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
        await prisma.order.deleteMany({
            where: { id: { in: ids } }
        });

        // Sync affected packages
        const packageIdsToSync = [...new Set(ordersToDelete.map(o => o.packageId).filter(Boolean))];
        for (const pid of packageIdsToSync) {
            await PackageService.syncPackage(pid);
        }

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

        await prisma.order.delete({ where: { id } });

        // Sync package credits and billing
        if (order.packageId) {
            await PackageService.syncPackage(order.packageId);
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order', message: error.message });
    }
});

// POST /api/orders/:id/upload-os - Upload OS/PP file to Google Drive
router.post('/:id/upload-os', upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        // Upload to Google Drive instead of local storage
        const driveFile = await storageService.uploadFile(req.file.path, req.file.filename);
        const arquivoOS = driveFile.webViewLink;

        // Clean up local temporary file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                arquivoOS,
                pendenciaFinanceiro: false // Clear pendency when file is uploaded
            }
        });

        res.json({ message: 'Arquivo enviado com sucesso para o Google Drive', arquivoOS, order });
    } catch (error) {
        console.error('Error uploading OS file to Drive:', error);
        res.status(500).json({ error: 'Falha ao enviar arquivo para o Google Drive', message: error.message });
    }
});

// DELETE /api/orders/:id/remove-os - Remove OS/PP file association
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

        // We don't necessarily need to delete from Drive to keep history, 
        // but if we wanted to, we would need the fileId stored in the DB.
        // For now, we just remove the association from the order.

        await prisma.order.update({
            where: { id },
            data: {
                arquivoOS: null,
                numeroOS: ''
            }
        });

        res.json({ message: 'Associação de arquivo removida com sucesso' });
    } catch (error) {
        console.error('Error removing OS association:', error);
        res.status(500).json({ error: 'Falha ao remover associação de arquivo' });
    }
});

module.exports = router;
