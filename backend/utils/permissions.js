const prisma = require('../db');

/**
 * Middleware para verificar permissão do usuário baseada no Tier
 * @param {string} permissionNomeCampo - Nome do campo booleano na tabela Tier (ex: 'accessPacotes')
 */
const checkPermission = (permissionNomeCampo) => {
    return async (req, res, next) => {
        try {
            // Se não tiver usuário logado (authenticateToken falhou ou não rodou)
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Não autenticado.' });
            }

            // Admin tem acesso total
            if (req.user.role === 'ADMIN') {
                return next();
            }

            // Busca usuário com Tier para garantir dados atualizados
            const user = await prisma.user.findUnique({
                where: { id: req.user.userId },
                include: { tier: true }
            });

            if (!user) {
                return res.status(401).json({ error: 'Usuário não encontrado.' });
            }

            // Verifica se tem Tier e se a permissão é true
            // Importante: Campos novos podem ser null se não tiver default? O schema define @default(false), então virá false.
            if (user.tier && user.tier[permissionNomeCampo] === true) {
                return next();
            }

            return res.status(403).json({
                error: 'Acesso negado.',
                message: `Você não tem permissão para acessar este recurso. Necessário: ${permissionNomeCampo}`,
                requiredPermission: permissionNomeCampo
            });

        } catch (error) {
            console.error(`Erro no middleware de permissão (${permissionNomeCampo}):`, error);
            res.status(500).json({ error: 'Erro interno ao validar permissões.' });
        }
    };
};

module.exports = { checkPermission };
