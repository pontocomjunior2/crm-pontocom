import React, { useState, useEffect } from 'react';
import {
    X,
    Trash2,
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { recurringServiceAPI } from '../services/api';
import { formatDate } from '../utils/formatters';
import { toast } from 'react-hot-toast';

const RecurringServiceHistory = ({ service, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (service) {
            fetchLogs();
        }
    }, [service]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await recurringServiceAPI.getLogs(service.id);
            setLogs(data);
        } catch (error) {
            toast.error('Erro ao carregar histórico: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLog = async (logId, hasOrder) => {
        let deleteOrder = false;
        if (hasOrder) {
            deleteOrder = window.confirm('Este lançamento gerou um pedido. Deseja excluir também o pedido associado?');
        } else {
            if (!window.confirm('Tem certeza que deseja excluir este registro do histórico?')) return;
        }

        try {
            await recurringServiceAPI.deleteLog(logId, deleteOrder);
            toast.success('Registro removido do histórico');
            fetchLogs();
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Histórico de Lançamentos</h3>
                            <p className="text-xs text-muted-foreground">{service?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-muted-foreground transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 size={40} className="text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Carregando histórico...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-dashed border-border">
                            <Calendar size={48} className="text-muted-foreground mb-4 opacity-20" />
                            <p className="text-muted-foreground font-medium">Nenhum lançamento registrado ainda</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div key={log.id} className="group p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-all flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`p-2 rounded-lg ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                                            {log.status === 'SUCCESS' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">{formatDate(log.executionDate)}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-400'}`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-foreground truncate">{log.message}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {log.generatedOrderId && (
                                            <button
                                                onClick={() => {
                                                    // Aqui poderíamos abrir o formulário do pedido, mas por enquanto vamos apenas avisar
                                                    toast.success('ID do Pedido: ' + log.generatedOrderId);
                                                }}
                                                className="p-2 hover:bg-white/10 text-primary rounded-lg transition-colors"
                                                title="Ver Pedido"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteLog(log.id, !!log.generatedOrderId)}
                                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                            title="Remover do histórico"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end bg-white/5">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-all font-bold text-sm"
                    >
                        FECHAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecurringServiceHistory;
