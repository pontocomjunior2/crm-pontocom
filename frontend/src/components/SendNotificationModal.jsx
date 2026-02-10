import React, { useState } from 'react';
import { Send, X, AlertCircle } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { showToast } from '../utils/toast';

const SendNotificationModal = ({ isOpen, onClose, initialData = {} }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        targetRole: initialData.targetRole || 'ATENDIMENTO',
        title: initialData.title || '',
        message: initialData.message || '',
        link: initialData.link || '',
        type: 'MANUAL'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.message) {
            showToast.error('Título e mensagem são obrigatórios');
            return;
        }

        setLoading(true);
        try {
            await notificationAPI.create(formData);
            showToast.success('Notificação enviada com sucesso');
            onClose();
        } catch (error) {
            console.error('Failed to send notification:', error);
            showToast.error('Erro ao enviar notificação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Send size={18} className="text-primary" />
                        <h3 className="font-semibold">Enviar Alerta Interno</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-accent rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 opacity-70">Departamento Alvo</label>
                        <select
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.targetRole}
                            onChange={(e) => setFormData({ ...formData, targetRole: e.targetRole })}
                        // Note: targetRole is simplified here. In a real scenario, could be multiple.
                        >
                            <option value="ATENDIMENTO">Atendimento</option>
                            <option value="FINANCEIRO">Financeiro</option>
                            <option value="ADMIN">Administração</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 opacity-70">Assunto / Título</label>
                        <input
                            type="text"
                            placeholder="Ex: Prioridade no Faturamento"
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 opacity-70">Mensagem</label>
                        <textarea
                            rows={4}
                            placeholder="Escreva sua mensagem aqui..."
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        />
                    </div>

                    {formData.link && (
                        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 border border-border/50">
                            <AlertCircle size={14} className="mt-0.5 text-primary" />
                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-0.5">Link Contextual</p>
                                <p className="text-[11px] truncate">{formData.link}</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Enviar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendNotificationModal;
