const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'pontocom-secret-key-2026';

// Middleware de Autenticação
const authMiddleware = (req, res, next) => {
    // Bypass auth for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    // console.log(`[Auth] ${req.method} ${req.originalUrl} - Header Value: '${authHeader}'`); // Debug Content
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log(`[Auth] ${req.method} ${req.originalUrl} - No token provided`); // Debug
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log(`[Auth Error] ${req.method} ${req.originalUrl} - Reason: ${err.message}`); // Debug
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ error: 'Sessão expirada. Por favor, faça login novamente.' });
            }
            return res.status(403).json({ error: 'Token inválido ou acesso negado' });
        }
        // console.log(`[Auth Success] User ${user.email} authenticated`); // Debug
        req.user = user;
        next();
    });
};

// Middleware de Admin
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    }
    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware
};
