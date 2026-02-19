const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    // Optional: add logging in development if needed
    // log: ['query', 'info', 'warn', 'error'],
});


module.exports = prisma;
