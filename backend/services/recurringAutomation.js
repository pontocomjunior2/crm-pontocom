const prisma = require('../db');
const cron = require('node-cron');
const RecurrenceService = require('../utils/recurrence');

/**
 * Serviço responsável por automatizar o lançamento de serviços recorrentes
 */
class RecurringServiceAutomation {
    constructor() {
        this.automationJob = null;
    }

    /**
     * Inicializa o agendador de automação
     * Roda todos os dias à meia-noite
     */
    async initialize() {
        console.log('🔄 Inicializando Automação de Serviços Recorrentes...');

        // Agendamento para rodar diariamente às 00:05 para processar os lançamentos do dia
        this.automationJob = cron.schedule('5 0 * * *', async () => {
            console.log('🔄 Executando processamento diário de Serviços Recorrentes...');
            await this.processRecursiveServices();
        }, {
            timezone: "America/Sao_Paulo"
        });

        // Executa uma vez na inicialização para garantir que nada ficou para trás se o servidor reiniciou
        await this.processRecursiveServices();
    }

    /**
     * Processa todos os serviços que precisam ser executados até o momento atual
     */
    async processRecursiveServices() {
        try {
            const now = new Date();

            // Busca serviços ativos, automáticos e que estão com a data de execução vencida ou atual
            const pendingServices = await prisma.recurringService.findMany({
                where: {
                    active: true,
                    isAutomatic: true,
                    nextExecution: {
                        lte: now
                    }
                },
                include: {
                    client: true
                }
            });

            console.log(`🔄 Encontrados ${pendingServices.length} serviços pendentes para processamento.`);

            for (const service of pendingServices) {
                await this.executeService(service);
            }
        } catch (error) {
            console.error('❌ Erro ao processar serviços recorrentes:', error);
        }
    }

    /**
     * Executa um serviço individualmente: gera o pedido e atualiza a próxima data
     */
    async executeService(service) {
        try {
            console.log(`🔄 Processando serviço: ${service.name} para Cliente: ${service.client.name}`);

            // 1. Determinar número de venda (seguindo lógica de Order.js)
            const lastSale = await prisma.order.findFirst({
                where: { numeroVenda: { not: null } },
                orderBy: { numeroVenda: 'desc' }
            });

            const lastId = lastSale?.numeroVenda || 42531;
            const nextNumeroVenda = lastId + 1;

            // 2. Criar a Ordem (Pedido/Venda)
            const order = await prisma.order.create({
                data: {
                    clientId: service.clientId,
                    title: service.name,
                    locutor: 'SISTEMA',
                    tipo: 'PRODUZIDO',
                    serviceType: 'SERVIÇO RECORRENTE',
                    vendaValor: service.value,
                    cacheValor: 0, // Por padrão, outros serviços não contam comissão (cache=0)
                    status: 'VENDA',
                    faturado: service.autoBilling, // Fatura automática se configurado
                    date: new Date(),
                    numeroVenda: nextNumeroVenda,
                    comentarios: `Lançamento automático de serviço recorrente: ${service.name} (${service.recurrence})`
                }
            });

            // 3. Registrar Log de Sucesso
            await prisma.recurringServiceLog.create({
                data: {
                    serviceId: service.id,
                    status: 'SUCCESS',
                    message: `Pedido gerado com sucesso: ${nextNumeroVenda}`,
                    generatedOrderId: order.id
                }
            });

            // 4. Calcular próxima execução
            // Se a data agendada (service.nextExecution) for no passado ou hoje, calculamos a próxima a partir de agora
            // Isso evita que, se o serviço estiver atrasado, ele gere vários pedidos seguidos ou pule muito para o futuro
            const baseDate = service.nextExecution < new Date() ? new Date() : service.nextExecution;
            const nextDate = RecurrenceService.calculateNextExecution(baseDate, service.recurrence);

            // 5. Atualizar o Serviço
            await prisma.recurringService.update({
                where: { id: service.id },
                data: {
                    lastExecution: new Date(),
                    nextExecution: nextDate
                }
            });

            console.log(`✅ Serviço ${service.name} executado com sucesso. Próxima execução: ${nextDate.toISOString()}`);
        } catch (error) {
            console.error(`❌ Falha ao executar serviço ${service.id}:`, error);

            // Registrar Log de Erro
            await prisma.recurringServiceLog.create({
                data: {
                    serviceId: service.id,
                    status: 'FAILED',
                    message: `Erro ao processar: ${error.message}`
                }
            });
        }
    }
}

module.exports = new RecurringServiceAutomation();
