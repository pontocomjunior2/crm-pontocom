import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Calendar,
    DollarSign,
    Building2,
    Settings,
    Loader2,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { recurringServiceAPI, clientAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const RecurringServiceForm = ({ service, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        clientId: '',
        value: '',
        recurrence: 'MONTHLY',
        isAutomatic: true,
        hasCommission: false,
        autoBilling: false,
        startDate: new Date().toISOString().split('T')[0],
        nextExecution: ''
    });

    useEffect(() => {
        fetchClients();
        if (service) {
            setFormData({
                name: service.name,
                clientId: service.clientId,
                value: service.value,
                recurrence: service.recurrence,
                isAutomatic: service.isAutomatic,
                hasCommission: service.hasCommission,
                autoBilling: service.autoBilling,
                startDate: service.startDate ? new Date(service.startDate).toISOString().split('T')[0] : '',
                nextExecution: service.nextExecution ? new Date(service.nextExecution).toISOString().split('T')[0] : ''
            });
        }
    }, [service]);

    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const data = await clientAPI.getSelection();
            setClients(data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (service) {
                await recurringServiceAPI.update(service.id, formData);
                toast.success('Serviço atualizado com sucesso!');
            } else {
                await recurringServiceAPI.create(formData);
                toast.success('Serviço recorrente cadastrado com sucesso!');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">
                                {service ? 'Editar Serviço Recorrente' : 'Novo Serviço Recorrente'}
                            </h3>
                            <p className="text-xs text-muted-foreground">Configure os parâmetros do contrato e automação</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-muted-foreground transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome do Serviço */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Settings size={14} className="text-primary" />
                                Nome do Serviço/Contrato
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Streaming Mensal, Gerenciamento de Rede..."
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-medium"
                            />
                        </div>

                        {/* Cliente */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={14} className="text-primary" />
                                Cliente
                            </label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                            >
                                <option value="">Selecione um cliente...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Valor */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={14} className="text-primary" />
                                Valor Mensal/Recorrência
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</div>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    className="w-full bg-input-background border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-bold"
                                />
                            </div>
                        </div>

                        {/* Recorrência */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-primary" />
                                Recorrência
                            </label>
                            <select
                                required
                                value={formData.recurrence}
                                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                            >
                                <option value="WEEKLY">Semanal</option>
                                <option value="BIWEEKLY">Quinzenal</option>
                                <option value="MONTHLY">Mensal</option>
                                <option value="BIMONTHLY">Bimestral</option>
                                <option value="QUARTERLY">Trimestral</option>
                                <option value="SEMIANNUAL">Semestral</option>
                                <option value="ANNUAL">Anual</option>
                            </select>
                        </div>

                        {/* Data de Início */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-primary" />
                                Data de Início
                            </label>
                            <input
                                required
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                            />
                        </div>

                        {/* Próxima Execução (Editável) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} className="text-primary" />
                                Próxima Execução (Programada)
                            </label>
                            <input
                                required
                                type="date"
                                value={formData.nextExecution}
                                onChange={(e) => setFormData({ ...formData, nextExecution: e.target.value })}
                                className="w-full bg-input-background border border-border border-primary/30 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-all font-bold"
                            />
                            <p className="text-[10px] text-muted-foreground">O sistema lançará automaticamente nesta data</p>
                        </div>

                        {/* Configurações Adicionais */}
                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-border">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Opções de Automação</label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={20} className={formData.isAutomatic ? 'text-emerald-500' : 'text-muted-foreground'} />
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Escrituração Automática</p>
                                            <p className="text-[10px] text-muted-foreground">Lançar pedido automaticamente na data</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.isAutomatic}
                                        onChange={(e) => setFormData({ ...formData, isAutomatic: e.target.checked })}
                                        className="w-5 h-5 accent-primary"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <DollarSign size={20} className={formData.hasCommission ? 'text-indigo-500' : 'text-muted-foreground'} />
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Contar Comissão</p>
                                            <p className="text-[10px] text-muted-foreground">Este serviço gera comissão de venda</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.hasCommission}
                                        onChange={(e) => setFormData({ ...formData, hasCommission: e.target.checked })}
                                        className="w-5 h-5 accent-primary"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer md:col-span-2">
                                    <div className="flex items-center gap-3">
                                        <DollarSign size={20} className={formData.autoBilling ? 'text-blue-500' : 'text-muted-foreground'} />
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Faturamento Automático</p>
                                            <p className="text-[10px] text-muted-foreground">Marcar como faturado imediatamente após o lançamento</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.autoBilling}
                                        onChange={(e) => setFormData({ ...formData, autoBilling: e.target.checked })}
                                        className="w-5 h-5 accent-primary"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-muted-foreground hover:bg-white/10 transition-all font-bold"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary px-10 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {service ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR SERVIÇO'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecurringServiceForm;
