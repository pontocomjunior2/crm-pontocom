const express = require('express');
const prisma = require('../db');
const RecurrenceService = require('../utils/recurrence');
const router = express.Router();

/**
 * Controller para gerenciar Serviços Recorrentes
 */
class RecurringServicesController {
    /**
     * Lista todos os serviços recorrentes com filtros
     */
    static async list(req, res) {
        try {
            const { clientId, active } = req.query;
            const where = {};

            if (clientId) where.clientId = clientId;
            if (active !== undefined) where.active = active === 'true';

            const services = await prisma.recurringService.findMany({
                where,
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            razaoSocial: true
                        }
                    }
                },
                orderBy: { nextExecution: 'asc' }
            });
            res.json(services);
        } catch (error) {
            console.error('Erro ao buscar serviços recorrentes:', error);
            res.status(500).json({
                error: 'Erro no Backend: Falha ao listar serviços recorrentes',
                message: error.message
            });
        }
    }

    /**
     * Busca um serviço recorrente pelo ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const service = await prisma.recurringService.findUnique({
                where: { id },
                include: {
                    client: true,
                    logs: {
                        take: 10,
                        orderBy: { executionDate: 'desc' }
                    }
                }
            });

            if (!service) {
                return res.status(404).json({ error: 'Serviço não encontrado' });
            }

            res.json(service);
        } catch (error) {
            console.error('Erro ao buscar serviço recorrente:', error);
            res.status(500).json({
                error: 'Erro no Backend: Falha ao buscar serviço',
                message: error.message
            });
        }
    }

    /**
     * Cria um novo serviço recorrente
     */
    static async create(req, res) {
        try {
            const {
                name,
                clientId,
                value,
                recurrence,
                isAutomatic,
                hasCommission,
                autoBilling,
                startDate
            } = req.body;

            // Validação Fail Fast
            if (!name || !clientId || !value || !recurrence) {
                return res.status(400).json({
                    error: 'Erro no Frontend: Campos obrigatórios ausentes (name, clientId, value, recurrence)'
                });
            }

            const startDateObj = startDate ? new Date(startDate + 'T12:00:00') : new Date();
            // Se o usuário já enviou uma próxima execução na criação (opcional)
            const nextExecutionDate = req.body.nextExecution
                ? new Date(req.body.nextExecution + 'T12:00:00')
                : RecurrenceService.calculateNextExecution(startDateObj, recurrence);

            const service = await prisma.recurringService.create({
                data: {
                    name,
                    clientId,
                    value: parseFloat(value),
                    recurrence,
                    isAutomatic: isAutomatic !== undefined ? isAutomatic : true,
                    hasCommission: hasCommission !== undefined ? hasCommission : false,
                    autoBilling: autoBilling !== undefined ? autoBilling : false,
                    startDate: startDateObj,
                    nextExecution: nextExecutionDate,
                    active: true
                }
            });

            res.status(201).json(service);
        } catch (error) {
            console.error('Erro ao criar serviço recorrente:', error);
            res.status(500).json({
                error: 'Erro no Backend: Falha ao criar serviço recorrente',
                message: error.message
            });
        }
    }

    /**
     * Atualiza um serviço recorrente existente
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;

            const existing = await prisma.recurringService.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ error: 'Serviço não encontrado' });
            }

            const updateData = { ...data };

            if (updateData.value) updateData.value = parseFloat(updateData.value);
            if (updateData.startDate) updateData.startDate = new Date(updateData.startDate + 'T12:00:00');
            if (updateData.nextExecution) updateData.nextExecution = new Date(updateData.nextExecution + 'T12:00:00');
            if (updateData.lastExecution) updateData.lastExecution = new Date(updateData.lastExecution);

            // Se a recorrência mudou e não foi enviada uma nova data de execução, recalcula
            if (updateData.recurrence && updateData.recurrence !== existing.recurrence && !updateData.nextExecution) {
                updateData.nextExecution = RecurrenceService.calculateNextExecution(
                    existing.lastExecution || existing.startDate,
                    updateData.recurrence
                );
            }

            const updated = await prisma.recurringService.update({
                where: { id },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });

            res.json(updated);
        } catch (error) {
            console.error('Erro ao atualizar serviço recorrente:', error);
            res.status(500).json({
                error: 'Erro no Backend: Falha ao atualizar serviço recorrente',
                message: error.message
            });
        }
    }

    /**
     * Lista logs de execução de um serviço
     */
    static async getLogs(req, res) {
        try {
            const { id } = req.params;
            const logs = await prisma.recurringServiceLog.findMany({
                where: { serviceId: id },
                orderBy: { executionDate: 'desc' },
                include: {
                    service: {
                        select: { name: true }
                    }
                }
            });
            res.json(logs);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            res.status(500).json({
                error: 'Erro no Backend: Falha ao buscar histórico de lançamentos',
                message: error.message
            });
        }
    }

    /**
     * Executa manualmente um serviço agora
     */
    static async execute(req, res) {
        try {
            const { id } = req.params;
            const service = await prisma.recurringService.findUnique({
                where: { id },
                include: { client: true }
            });

            if (!service) {
                return res.status(404).json({ error: 'Serviço não encontrado' });
            }

            // Usamos a lógica centralizada de automação
            const automation = require('../services/recurringAutomation');
            await automation.executeService(service);

            res.json({ message: 'Serviço executado com sucesso e log registrado' });
        } catch (error) {
            console.error('Erro ao executar serviço manualmente:', error);
            res.status(500).json({
                error: 'Erro no Backend: Falha ao processar execução manual',
                message: error.message
            });
        }
    }

    /**
     * Remove um log de execução
     */
    static async deleteLog(req, res) {
        try {
            const { logId } = req.params;
            const { deleteOrder } = req.query;

            const log = await prisma.recurringServiceLog.findUnique({
                where: { id: logId }
            });

            if (!log) {
                return res.status(404).json({ error: 'Log não encontrado' });
            }

            // Se solicitado, tenta deletar o pedido associado
            if (deleteOrder === 'true' && log.generatedOrderId) {
                try {
                    await prisma.order.delete({
                        where: { id: log.generatedOrderId }
                    });
                } catch (orderErr) {
                    console.warn(`[Warn] Pedido ${log.generatedOrderId} não pôde ser deletado (talvez já removido):`, orderErr.message);
                }
            }

            await prisma.recurringServiceLog.delete({
                where: { id: logId }
            });

            res.json({ message: 'Lançamento de histórico removido com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar log:', error);
            res.status(500).json({
                error: 'Erro no Backend: Falha ao remover lançamento do histórico',
                message: error.message
            });
        }
    }

    /**
     * Alterna o status ativo/inativo de um serviço
     */
    static async toggleActive(req, res) {
        try {
            const { id } = req.params;
            const { active } = req.body;

            await prisma.recurringService.update({
                where: { id },
                data: { active: !!active }
            });

            res.json({ message: `Serviço ${active ? 'ativado' : 'desativado'} com sucesso` });
        } catch (error) {
            console.error('Erro ao alternar status do serviço:', error);
            res.status(500).json({
                error: 'Erro no Backend: Falha ao alterar status do serviço',
                message: error.message
            });
        }
    }

    /**
     * Remove definitivamente um serviço e seus logs
     */
    static async hardDelete(req, res) {
        try {
            const { id } = req.params;

            // Deletar logs primeiro devido à FK
            await prisma.recurringServiceLog.deleteMany({
                where: { serviceId: id }
            });

            await prisma.recurringService.delete({
                where: { id }
            });

            res.json({ message: 'Serviço excluído permanentemente com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir serviço recorrente:', error);
            res.status(500).json({
                error: 'Erro no Backend: Falha ao excluir serviço definitivamente',
                message: error.message
            });
        }
    }
}

// Rotas
router.get('/', RecurringServicesController.list);
router.get('/:id', RecurringServicesController.getById);
router.get('/:id/logs', RecurringServicesController.getLogs);
router.post('/', RecurringServicesController.create);
router.post('/:id/execute', RecurringServicesController.execute);
router.put('/:id', RecurringServicesController.update);
router.delete('/logs/:logId', RecurringServicesController.deleteLog);
router.patch('/:id/toggle', RecurringServicesController.toggleActive);
router.delete('/:id', RecurringServicesController.hardDelete);

module.exports = router;
