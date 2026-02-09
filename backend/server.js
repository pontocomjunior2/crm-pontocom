const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = require('./db');
const JWT_SECRET = process.env.JWT_SECRET || 'pontocom-secret-key-2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/os', express.static(path.join(__dirname, 'uploads', 'os')));

const PORT = process.env.PORT || 3000;

// Import routes
const clientRoutes = require('./routes/clients');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const locutoresRoutes = require('./routes/locutores');
const importRoutes = require('./routes/import');
const serviceTypesRoutes = require('./routes/serviceTypes');
const userRoutes = require('./routes/users');
const supplierRoutes = require('./routes/suppliers');
const analyticsRoutes = require('./routes/analytics');
const tierRoutes = require('./routes/tiers');
const backupRoutes = require('./routes/backups');
const clientPackageRoutes = require('./routes/clientPackages');
const recurringServicesRoutes = require('./routes/recurringServices');
const adminConfigRoutes = require('./routes/adminConfig');
const backupService = require('./services/backupService');
const recurringAutomationService = require('./services/recurringAutomation');
const cron = require('node-cron');
const { authMiddleware, adminMiddleware } = require('./middleware/auth');
// const uploadRoutes = require('./routes/upload');

// Middleware de Autenticação (IMPORTADO)
const authenticateToken = authMiddleware;
const isAdmin = adminMiddleware;



// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tier: true }
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier
      }
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tier: true
      }
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// --- REGISTER ROUTES ---
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/locutores', authMiddleware, locutoresRoutes);
app.use('/api/import', authMiddleware, importRoutes);
app.use('/api/service-types', authMiddleware, serviceTypesRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/suppliers', authMiddleware, supplierRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/tiers', authMiddleware, tierRoutes);
app.use('/api/backups', authMiddleware, backupRoutes);
app.use('/api/client-packages', authMiddleware, clientPackageRoutes);
app.use('/api/recurring-services', authMiddleware, recurringServicesRoutes);
app.use('/api/notifications', authMiddleware, require('./routes/notifications'));
app.use('/api/admin', authMiddleware, adminConfigRoutes);
// app.use('/api/upload', authenticateToken, uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Pontocom CRM API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Servidor Pontocom CRM rodando na porta ${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}/api`);

  // Initialize Backup Scheduler
  await backupService.initializeScheduler();

  // Initialize Recurring Services Automation
  await recurringAutomationService.initialize();

  // Initialize System Alerts (Notifications)
  const systemAlertService = require('./services/systemAlertService');
  await systemAlertService.initialize();
});
