const prisma = require('../db');
const cron = require('node-cron');
const { format } = require('date-fns');

/**
 * Serviço responsável por monitorar o sistema e gerar alertas/notificações
 * para os diferentes Tiers (Atendimento, Financeiro, etc)
 */
class SystemAlertService {
    constructor() {
        this.alertJob = null;
    }

    /**
     * Inicializa o agendador de alertas
     * Roda a cada hora para garantir agilidade nas notificações
     */
    async initialize() {
        console.log('🔔 Inicializando Serviço de Alertas do Sistema...');

        // Executa a cada hora no minuto 15
        this.alertJob = cron.schedule('15 * * * *', async () => {
            console.log('🔔 Executando verificação de alertas do sistema...');
            await this.runAllChecks();
        }, {
            timezone: "America/Sao_Paulo"
        });

        // Executa uma verificação inicial ao subir o servidor
        this.runAllChecks();
    }

    async runAllChecks() {
        try {
            await this.checkPackageRenewals(); // Atendimento
            await this.checkStagnantOrders(); // Atendimento
            await this.checkDailyBillings();   // Financeiro
            await this.checkOverdueBillings(); // Financeiro
        } catch (error) {
            console.error('❌ Erro geral ao processar alertas do sistema:', error);
        }
    }

    // --- REGRAS DE ATENDIMENTO ---

    /**
     * Verifica pacotes que precisam de renovação (Vencidos ou Esgotados)
     * Target: ATENDIMENTO
     */
    async checkPackageRenewals() {
        try {
            const now = new Date();

            // Buscar pacotes ativos com renovação automática
            const packages = await prisma.clientPackage.findMany({
                where: {
                    active: true,
                    autoRenewal: true
                },
                include: { client: true }
            });

            for (const pkg of packages) {
                let alertReason = null;

                // 1. Falta pouco para vencer ou já venceu (ex: hoje ou passado)
                if (new Date(pkg.endDate) <= now) {
                    alertReason = 'VENCIDO';
                }

                // 2. Esgotou os créditos (apenas para pacotes limitados)
                // Ignora tipos ilimitados
                const isLimited = !['FIXO_ILIMITADO', 'FIXO_SOB_DEMANDA', 'SOB_DEMANDA_AVULSO'].includes(pkg.type);
                if (isLimited && pkg.usedAudios >= pkg.audioLimit) {
                    alertReason = 'ESGOTADO';
                }

                if (alertReason) {
                    // Verificar se já existe notificação pendente para este pacote hoje
                    const existingNote = await prisma.notification.findFirst({
                        where: {
                            targetRole: 'ATENDIMENTO',
                            type: 'RENEWAL',
                            link: `/pacotes?packageId=${pkg.id}`, // Link para o pacote específico
                            read: false
                        }
                    });

                    if (!existingNote) {
                        await prisma.notification.create({
                            data: {
                                type: 'RENEWAL',
                                targetRole: 'ATENDIMENTO',
                                title: `Renovação Necessária: ${pkg.client.name}`,
                                message: alertReason === 'VENCIDO'
                                    ? `O pacote "${pkg.name}" venceu em ${format(new Date(pkg.endDate), 'dd/MM/yyyy')}.`
                                    : `O pacote "${pkg.name}" atingiu o limite de ${pkg.audioLimit} áudios.`,
                                link: `/pacotes?packageId=${pkg.id}`
                            }
                        });
                        console.log(`🔔 Alerta gerado: Renovação ${pkg.client.name} (${alertReason})`);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao verificar renovação de pacotes:', error);
        }
    }

    /**
     * Verifica pedidos parados com status 'PEDIDO' há mais de 3 dias
     * Target: ATENDIMENTO
     */
    async checkStagnantOrders() {
        try {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const stagnantOrders = await prisma.order.findMany({
                where: {
                    status: 'PEDIDO',
                    createdAt: {
                        lte: threeDaysAgo
                    }
                },
                include: { client: true }
            });

            if (stagnantOrders.length > 0) {
                // Agrupar para não spammar notificações (1 alerta único resumido)
                // Ou 1 alerta por pedido? Melhor 1 alerta resumido se forem muitos.
                // Vamos fazer 1 alerta por pedido, mas verificando duplicidade.

                for (const order of stagnantOrders) {
                    const existingNote = await prisma.notification.findFirst({
                        where: {
                            targetRole: 'ATENDIMENTO',
                            type: 'STAGNANT_ORDER',
                            link: `/pedidos?id=${order.id}`,
                            read: false
                        }
                    });

                    if (!existingNote) {
                        await prisma.notification.create({
                            data: {
                                type: 'STAGNANT_ORDER',
                                targetRole: 'ATENDIMENTO',
                                title: `Pedido Estagnado: ${order.title}`,
                                message: `O pedido ${order.sequentialId} de ${order.client.name} está como "PEDIDO" há mais de 3 dias.`,
                                link: `/pedidos?id=${order.id}`
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao verificar pedidos estagnados:', error);
        }
    }

    // --- REGRAS DE FINANCEIRO ---

    /**
     * Verifica faturamentos agendados para HOJE
     * Target: FINANCEIRO
     */
    async checkDailyBillings() {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            const billingsToday = await prisma.order.count({
                where: {
                    dataFaturar: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    faturado: false
                }
            });

            if (billingsToday > 0) {
                // Notificação diária única
                const existingNote = await prisma.notification.findFirst({
                    where: {
                        targetRole: 'FINANCEIRO',
                        type: 'DAILY_BILLING_SUMMARY',
                        createdAt: { gte: startOfDay }, // Criado hoje
                        read: false
                    }
                });

                if (!existingNote) {
                    await prisma.notification.create({
                        data: {
                            type: 'DAILY_BILLING_SUMMARY',
                            targetRole: 'FINANCEIRO',
                            title: 'Agenda de Faturamento',
                            message: `HOJE TEM ${billingsToday} FATURAMENTOS A SEREM FEITOS.`,
                            link: `/faturamento?date=${format(new Date(), 'yyyy-MM-dd')}` // Link para filtro de data
                        }
                    });
                    console.log(`🔔 Alerta gerado: ${billingsToday} faturamentos para hoje.`);
                }
            }

        } catch (error) {
            console.error('Erro ao verificar faturamentos do dia:', error);
        }
    }

    /**
     * Verifica atrasos no faturamento (mais de 5 dias passados da dataFaturar)
     * Target: FINANCEIRO
     */
    async checkOverdueBillings() {
        try {
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            const overdueOrders = await prisma.order.findMany({
                where: {
                    faturado: false,
                    OR: [
                        { status: 'VENDA' },
                        { status: 'ENTREGUE' }
                    ],
                    dataFaturar: {
                        lt: fiveDaysAgo
                    }
                },
                include: { client: true }
            });

            for (const order of overdueOrders) {
                const existingNote = await prisma.notification.findFirst({
                    where: {
                        targetRole: 'FINANCEIRO',
                        type: 'OVERDUE_BILLING',
                        link: `/faturamento?id=${order.id}`,
                        read: false
                    }
                });

                if (!existingNote) {
                    await prisma.notification.create({
                        data: {
                            type: 'OVERDUE_BILLING',
                            targetRole: 'FINANCEIRO',
                            title: `Faturamento Atrasado: ${order.client.name}`,
                            message: `O pedido ${order.sequentialId} ("${order.title}") deveria ter sido faturado em ${format(new Date(order.dataFaturar), 'dd/MM/yyyy')}.`,
                            link: `/faturamento?id=${order.id}`
                        }
                    });
                    console.log(`🔔 Alerta gerado: Faturamento atrasado para ${order.sequentialId}`);
                }
            }

        } catch (error) {
            console.error('Erro ao verificar faturamentos atrasados:', error);
        }
    }
}

module.exports = new SystemAlertService();
