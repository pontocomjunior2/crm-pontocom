import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    RefreshCcw,
    Edit2,
    Trash2,
    Clock,
    Calendar,
    CheckCircle2,
    XCircle,
    DollarSign,
    AlertCircle,
    Loader2,
    Play,
    History,
    Power
} from 'lucide-react';
import { recurringServiceAPI } from '../services/api';
import RecurringServiceForm from './RecurringServiceForm';
import RecurringServiceHistory from './RecurringServiceHistory';
import { formatCurrency, formatDate } from '../utils/formatters';
import { toast } from 'react-hot-toast';

const RecurringServiceList = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        fetchServices();
    }, [refreshTrigger]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await recurringServiceAPI.list();
            setServices(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        const action = currentStatus ? 'desativar' : 'ativar';
        if (!window.confirm(`Tem certeza que deseja ${action} este serviço recorrente?`)) return;

        try {
            await recurringServiceAPI.toggleActive(id, !currentStatus);
            toast.success(`Serviço ${currentStatus ? 'desativado' : 'ativado'} com sucesso`);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleHardDelete = async (id) => {
        if (!window.confirm('ATENÇÃO: Isso excluirá permanentemente o serviço e todo o seu histórico. Esta ação não pode ser desfeita. Prosseguir?')) return;

        try {
            await recurringServiceAPI.hardDelete(id);
            toast.success('Serviço excluído permanentemente');
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleManualExecute = async (id) => {
        if (!window.confirm('Deseja executar este lançamento agora manualmente? Isso gerará um novo pedido imediatamente.')) return;

        try {
            toast.loading('Processando execução...', { id: 'manual-exec' });
            await recurringServiceAPI.execute(id);
            toast.success('Serviço executado com sucesso!', { id: 'manual-exec' });
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            toast.error(error.message, { id: 'manual-exec' });
        }
    };

    const getRecurrenceLabel = (recurrence) => {
        const labels = {
            'WEEKLY': 'Semanal',
            'BIWEEKLY': 'Quinzenal',
            'MONTHLY': 'Mensal',
            'BIMONTHLY': 'Bimestral',
            'QUARTERLY': 'Trimestral',
            'SEMIANNUAL': 'Semestral',
            'ANNUAL': 'Anual'
        };
        return labels[recurrence] || recurrence;
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && services.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 h-full">
                <Loader2 className="text-primary animate-spin mb-4" size={48} />
                <p className="text-muted-foreground font-medium">Carregando serviços recorrentes...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Serviços Extras</h2>
                    <p className="text-muted-foreground text-sm">Gerencie contratos e serviços de lançamento automático</p>
                </div>
                <button
                    onClick={() => { setSelectedService(null); setShowForm(true); }}
                    className="btn-primary px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                    NOVO SERVIÇO
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>
                <button
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 text-foreground hover:bg-accent transition-all"
                >
                    <RefreshCcw size={18} className={loading ? 'animate-spin text-primary' : ''} />
                    Sincronizar
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {filteredServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-dashed border-border">
                        <Calendar size={48} className="text-muted-foreground mb-4 opacity-20" />
                        <p className="text-muted-foreground font-medium">Nenhum serviço recorrente encontrado</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {filteredServices.map((service) => (
                            <div key={service.id} className={`card-dark p-5 group relative border-l-4 ${service.active ? 'border-primary' : 'border-muted opacity-60'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="min-w-0 pr-8">
                                        <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">{service.name}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar size={14} />
                                            {service.client?.name}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-xl font-black text-primary">{formatCurrency(service.value)}</div>
                                        <span className="text-[10px] uppercase font-black bg-primary/10 text-primary px-2 py-0.5 rounded">
                                            {getRecurrenceLabel(service.recurrence)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Próxima Execução</span>
                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                            <Clock size={14} className="text-primary" />
                                            {formatDate(service.nextExecution)}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Última Execução</span>
                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                            <CheckCircle2 size={14} className="text-emerald-500" />
                                            {service.lastExecution ? formatDate(service.lastExecution) : 'Nunca'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${service.isAutomatic ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {service.isAutomatic ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                            AUTO
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${service.hasCommission ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                            <DollarSign size={12} />
                                            COMISSÃO: {service.hasCommission ? 'SIM' : 'NÃO'}
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${service.autoBilling ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                            <DollarSign size={12} />
                                            FATURA: {service.autoBilling ? 'SIM' : 'NÃO'}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <button
                                            onClick={() => handleManualExecute(service.id)}
                                            className="p-2 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
                                            title="Executar Agora"
                                        >
                                            <Play size={16} fill="currentColor" />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedService(service); setShowHistory(true); }}
                                            className="p-2 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                                            title="Ver Histórico"
                                        >
                                            <History size={16} />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedService(service); setShowForm(true); }}
                                            className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(service.id, service.active)}
                                            className={`p-2 rounded-lg transition-colors ${service.active ? 'hover:bg-amber-500/20 text-amber-500' : 'hover:bg-emerald-500/20 text-emerald-500'}`}
                                            title={service.active ? 'Desativar' : 'Ativar'}
                                        >
                                            <Power size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleHardDelete(service.id)}
                                            className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                            title="Excluir Permanentemente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <RecurringServiceForm
                    service={selectedService}
                    onClose={() => { setShowForm(false); setSelectedService(null); }}
                    onSuccess={() => { setShowForm(false); setSelectedService(null); setRefreshTrigger(prev => prev + 1); }}
                />
            )}

            {showHistory && (
                <RecurringServiceHistory
                    service={selectedService}
                    onClose={() => { setShowHistory(false); setSelectedService(null); }}
                />
            )}
        </div>
    );
};

export default RecurringServiceList;
