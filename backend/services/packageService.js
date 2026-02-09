const prisma = require('../db');

/**
 * Service to centralize package credit and billing synchronization logic.
 * Follows strict typing (as much as JS allows with JSDoc) and SRP.
 */
class PackageService {
    /**
     * Recalculates used credits and synchronizes the billing order for a specific package.
     * @param {string} packageId - The UUID of the package to sync.
     * @throws {Error} if package or billing order processing fails.
     */
    static async syncPackage(packageId) {
        if (!packageId) return;

        try {
            // 1. Fetch package with its billing info
            const pkg = await prisma.clientPackage.findUnique({
                where: { id: packageId },
                include: { billingOrder: true }
            });

            if (!pkg) {
                console.error(`[PackageService] Package not found: ${packageId}`);
                return;
            }

            // 2. Recalculate real usage using aggregation (more efficient)
            const usage = await prisma.order.findMany({
                where: {
                    packageId: packageId,
                    status: { not: 'CANCELADO' },
                    isBonus: false,
                    vendaValor: 0
                },
                select: { creditsConsumed: true }
            });

            const totalUsage = usage.reduce((sum, order) => sum + (order.creditsConsumed || 1), 0);

            // 3. Update package usedAudios if different
            if (pkg.usedAudios !== totalUsage) {
                await prisma.clientPackage.update({
                    where: { id: packageId },
                    data: { usedAudios: totalUsage }
                });
                console.log(`[PackageService] Updated consumption for ${pkg.name}: ${totalUsage}/${pkg.audioLimit}`);
            }

            // 4. Synchronize Billing (Extra Fees)
            if (pkg.billingOrderId) {
                const realUsageForBilling = totalUsage;
                const fixedFee = Number(pkg.fixedFee) || 0;
                const extraFee = Number(pkg.extraAudioFee) || 0;
                const limit = Number(pkg.audioLimit) || 0;

                let extraValue = 0;
                let totalExtras = 0;

                if (pkg.type === 'FIXO_SOB_DEMANDA' || (pkg.type === 'FIXO_COM_LIMITE' && totalUsage > limit)) {
                    totalExtras = Math.max(0, totalUsage - limit);
                    extraValue = totalExtras * extraFee;
                }

                const newTotalVenda = fixedFee + extraValue;

                // Only update if value changed or comments need update
                const currentVenda = Number(pkg.billingOrder.vendaValor);
                if (currentVenda !== newTotalVenda) {
                    await prisma.order.update({
                        where: { id: pkg.billingOrderId },
                        data: {
                            vendaValor: newTotalVenda,
                            comentarios: `Faturamento consolidado: ${pkg.name}.${extraValue > 0 ? ` Áudios extras: ${totalExtras}.` : ''}`
                        }
                    });
                    console.log(`[PackageService] Updated billing for ${pkg.name}: R$ ${newTotalVenda}`);
                }
            }
        } catch (error) {
            console.error(`[PackageService] Error syncing package ${packageId}:`, error);
            throw new Error(`Erro ao sincronizar pacote: ${error.message}`);
        }
    }
}

module.exports = PackageService;
