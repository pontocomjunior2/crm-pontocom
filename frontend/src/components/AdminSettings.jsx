import React, { useState, useEffect } from 'react';
import {
    Save,
    RotateCcw,
    Settings,
    Shield,
    Users,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    DollarSign,
    Percent
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { showToast } from '../utils/toast';

const AdminSettings = () => {
    const { user } = useAuth();
    // Armazena os valores como STRING para edição (formato "10.00" ou "13,75")
    // O backend espera decimais (0.10, 0.04)
    const [config, setConfig] = useState({ taxRate: '0', commissionRate: '0' });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recalculating, setRecalculating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [configData, usersData] = await Promise.all([
                adminAPI.getConfig(),
                adminAPI.getCommissionUsers()
            ]);

            // Converter decimal do backend (0.10) para porcentagem (10)
            // Se vier undefined, usa 0
            const tax = configData.taxRate ? (parseFloat(configData.taxRate) * 100).toFixed(2) : '0';
            const comm = configData.commissionRate ? (parseFloat(configData.commissionRate) * 100).toFixed(2) : '0';

            setConfig({
                taxRate: tax.replace('.', ','), // Mostrar com vírgula para BR
                commissionRate: comm.replace('.', ',')
            });
            setUsers(usersData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showToast.error('Erro ao carregar configurações.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        // Permite digitar números e vírgula/ponto
        if (/^[\d,.]*$/.test(value)) {
            setConfig(prev => ({ ...prev, [name]: value }));
        }
    };

    const parsePercentage = (value) => {
        if (!value) return 0;
        // Troca vírgula por ponto para parsear
        const numberVal = parseFloat(value.replace(',', '.'));
        if (isNaN(numberVal)) return 0;
        // Divide por 100 para voltar a decimal (13.75 -> 0.1375)
        return numberVal / 100;
    };

    const handleSaveConfig = async () => {
        try {
            setSaving(true);

            const dataToSend = {
                taxRate: parsePercentage(config.taxRate),
                commissionRate: parsePercentage(config.commissionRate)
            };

            await adminAPI.updateConfig(dataToSend);
            showToast.success('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showToast.error('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    const handleRecalculate = async () => {
        if (!window.confirm('ATENÇÃO: Isso recalculará os impostos e comissões de TODOS os pedidos existentes com base nas novas taxas configuradas. Deseja continuar?')) {
            return;
        }

        try {
            setRecalculating(true);
            const response = await adminAPI.recalculateAll();
            showToast.success(response.message || 'Recálculo concluído com sucesso!');
        } catch (error) {
            console.error('Erro ao recalcular:', error);
            showToast.error('Erro ao recalcular pedidos.');
        } finally {
            setRecalculating(false);
        }
    };

    const handleToggleEligibility = async (userId, currentStatus) => {
        try {
            const updatedUser = await adminAPI.updateUserEligibility(userId, !currentStatus);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isCommissionEligible: updatedUser.isCommissionEligible } : u));
            showToast.success(`Permissão de comissão ${!currentStatus ? 'ativada' : 'revogada'} para o usuário.`);
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            showToast.error('Erro ao atualizar elegibilidade do usuário.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 size={48} className="text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-y-auto custom-scrollbar p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                    <Settings size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Configurações Administrativas</h2>
                    <p className="text-muted-foreground">Gerencie taxas globais e permissões de acesso financeiro</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configurações Financeiras Globais */}
                <div className="card-dark p-6 space-y-6 h-fit">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <DollarSign className="text-emerald-500" size={20} />
                        <h3 className="text-lg font-bold text-foreground">Parâmetros Financeiros Globais</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Percent size={14} className="text-primary" />
                                Alíquota de Imposto
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    name="taxRate"
                                    value={config.taxRate}
                                    onChange={handleConfigChange}
                                    placeholder="0,00"
                                    className="w-full bg-input-background border border-border rounded-xl pl-4 pr-12 py-3 text-foreground font-mono text-lg focus:outline-none focus:border-primary/50 transition-all font-bold"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Valor usado para cálculo automático de impostos na venda. Ex: Digite <span className="text-primary font-bold">13,75</span> para 13.75%
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Users size={14} className="text-primary" />
                                Taxa de Comissão Padrão
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    name="commissionRate"
                                    value={config.commissionRate}
                                    onChange={handleConfigChange}
                                    placeholder="0,00"
                                    className="w-full bg-input-background border border-border rounded-xl pl-4 pr-12 py-3 text-foreground font-mono text-lg focus:outline-none focus:border-primary/50 transition-all font-bold"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Porcentagem padrão aplicada sobre o spread (Venda - Cache). Ex: Digite <span className="text-primary font-bold">4,00</span> para 4%
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleSaveConfig}
                            disabled={saving}
                            className="flex-1 btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            SALVAR ALTERAÇÕES
                        </button>

                        <button
                            onClick={handleRecalculate}
                            disabled={recalculating}
                            className="px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 disabled:opacity-50 transition-all"
                            title="Recalcular valores em todos os pedidos históricos"
                        >
                            {recalculating ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                        </button>
                    </div>
                    {recalculating && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                            <Loader2 className="text-blue-400 animate-spin mt-0.5" size={16} />
                            <div>
                                <p className="text-xs font-bold text-blue-400">Processando Recálculo...</p>
                                <p className="text-[10px] text-blue-300/80">Isso pode levar alguns instantes dependendo do volume de dados.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Gestão de Usuários Comissionados */}
                <div className="card-dark p-6 flex flex-col h-[500px]">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                        <Shield className="text-indigo-500" size={20} />
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Usuários Elegíveis</h3>
                            <p className="text-xs text-muted-foreground">Quem pode receber comissões no sistema</p>
                        </div>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1 -mr-2 pr-2 space-y-2">
                        {users.map((userItem) => (
                            <div
                                key={userItem.id}
                                className={`group p-3 rounded-xl border transition-all duration-300 flex items-center justify-between
                                    ${userItem.isCommissionEligible
                                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                                        : 'bg-white/5 border-white/5 hover:border-white/10 opacity-70 hover:opacity-100'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                        ${userItem.isCommissionEligible ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-muted-foreground'}
                                    `}>
                                        {userItem.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${userItem.isCommissionEligible ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {userItem.name || 'Sem nome'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{userItem.email}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleToggleEligibility(userItem.id, userItem.isCommissionEligible)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card
                                        ${userItem.isCommissionEligible ? 'bg-primary' : 'bg-white/10'}
                                    `}
                                >
                                    <span
                                        className={`${userItem.isCommissionEligible ? 'translate-x-6' : 'translate-x-1'
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
