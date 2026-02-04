/**
 * Utilitário para cálculo de datas de recorrência
 */
class RecurrenceService {
    /**
     * Calcula a próxima data de execução baseada na recorrência
     * @param {Date} startDate Data de início ou última execução
     * @param {string} recurrence Tipo de recorrência
     * @returns {Date} Próxima data
     */
    static calculateNextExecution(startDate, recurrence) {
        const next = new Date(startDate);

        switch (recurrence) {
            case 'WEEKLY':
                next.setDate(next.getDate() + 7);
                break;
            case 'BIWEEKLY':
                next.setDate(next.getDate() + 14);
                break;
            case 'MONTHLY':
                next.setMonth(next.getMonth() + 1);
                break;
            case 'BIMONTHLY':
                next.setMonth(next.getMonth() + 2);
                break;
            case 'QUARTERLY':
                next.setMonth(next.getMonth() + 3);
                break;
            case 'SEMIANNUAL':
                next.setMonth(next.getMonth() + 6);
                break;
            case 'ANNUAL':
                next.setFullYear(next.getFullYear() + 1);
                break;
            default:
                next.setMonth(next.getMonth() + 1);
        }

        return next;
    }
}

module.exports = RecurrenceService;
