import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, CheckCircle2, AlertCircle, Building2, Mail, Phone, MapPin, Music, Plus, Calendar, Flame, Clock, Pencil, Trash2 } from 'lucide-react';
import { formatCNPJ, formatPhone, formatCEP, removeMask, validateCNPJ, validateEmail, formatCurrency, parseCurrency, getLocalISODate } from '../utils/formatters';
import { lookupCNPJ, lookupCEP, clientAPI, clientPackageAPI } from '../services/api';
import { showToast } from '../utils/toast';

const ClientForm = ({ client = null, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        cnpj_cpf: client?.cnpj_cpf || '',
        name: client?.name || '',
        razaoSocial: client?.razaoSocial || '',
        inscricaoEstadual: client?.inscricaoEstadual || '',
        emailPrincipal: client?.emailPrincipal || '',
        telefonePrincipal: client?.telefonePrincipal || '',
        cep: client?.cep || '',
        endereco: client?.endereco || '',
        numero: client?.numero || '',
        complemento: client?.complemento || '',
        bairro: client?.bairro || '',
        cidade: client?.cidade || '',
        estado: client?.estado || '',
        nomeContato: client?.nomeContato || '',
        emailContato: client?.emailContato || '',
        dataAniversario: client?.dataAniversario || '',
        observacoes: client?.observacoes || '',
        status: client?.status || 'ativado'
    });

    const [isInternational, setIsInternational] = useState(false);

    useEffect(() => {
        if (client?.cnpj_cpf) {
            // Heuristic: if it has letters, it is definitely international
            if (/[a-zA-Z]/.test(client.cnpj_cpf)) {
                setIsInternational(true);
            }
        }
    }, [client]);

    const [loading, setLoading] = useState(false);
    const [lookingUpCNPJ, setLookingUpCNPJ] = useState(false);
    const [lookingUpCEP, setLookingUpCEP] = useState(false);
    const [errors, setErrors] = useState({});

    // Package states
    const [activeTab, setActiveTab] = useState('dados'); // 'dados' or 'pacotes'
    const [packages, setPackages] = useState([]);
    const [fetchingPackages, setFetchingPackages] = useState(false);
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [packageFormData, setPackageFormData] = useState({
        name: '',
        type: 'FIXO_COM_LIMITE',
        fixedFee: 0,
        audioLimit: 0,
        extraAudioFee: 0,
        startDate: getLocalISODate(),
        endDate: getLocalISODate(new Date(new Date().setMonth(new Date().getMonth() + 1))),
        active: true
    });

    useEffect(() => {
        if (activeTab === 'pacotes' && client?.id) {
            fetchPackages();
        }
    }, [activeTab, client?.id]);

    const fetchPackages = async () => {
        setFetchingPackages(true);
        try {
            const data = await clientPackageAPI.list(client.id);
            setPackages(data);
        } catch (error) {
            showToast.error('Erro ao buscar pacotes');
        } finally {
            setFetchingPackages(false);
        }
    };

    const renderPackages = () => {
        if (fetchingPackages) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 size={40} className="animate-spin mb-4 text-primary/50" />
                    <p>Carregando pacotes...</p>
                </div>
            );
        }

        if (packages.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Music size={40} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Sem pacotes ativos</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                        Este cliente ainda não possui pacotes de áudio mensais configurados.
                    </p>
                    <button
                        onClick={() => setShowPackageForm(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Configurar Primeiro Pacote
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-foreground">Histórico de Pacotes</h3>
                    <button
                        onClick={() => setShowPackageForm(true)}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Novo Pacote
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {packages.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`p-5 rounded-2xl border transition-all ${pkg.active ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border opacity-70'}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-foreground">{pkg.name}</h4>
                                        {pkg.active && (
                                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                                Ativo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Calendar size={12} />
                                        {new Date(pkg.startDate).toLocaleDateString()} - {new Date(pkg.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-2">
                                        <p className="text-lg font-bold text-primary">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pkg.fixedFee)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Mensalidade</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditPackage(pkg); }}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-primary transition-all"
                                            title="Editar pacote"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeletePackage(pkg.id); }}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-red-500 transition-all"
                                            title="Excluir pacote"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-card/50 p-3 rounded-xl border border-border/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Consumo</p>
                                    <div className="flex items-end gap-1">
                                        <span className="text-xl font-bold text-foreground">{pkg.usedAudios}</span>
                                        <span className="text-xs text-muted-foreground pb-1">/ {pkg.audioLimit || '∞'}</span>
                                    </div>
                                </div>
                                <div className="bg-card/50 p-3 rounded-xl border border-border/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Tipo</p>
                                    <p className="text-sm font-bold text-foreground truncate">
                                        {pkg.type.replace(/_/g, ' ')}
                                    </p>
                                </div>
                                <div className="bg-card/50 p-3 rounded-xl border border-border/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Extra</p>
                                    <p className="text-sm font-bold text-foreground">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pkg.extraAudioFee)}/un
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const handlePackageFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPackageFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handlePackageCurrencyChange = (e) => {
        const { name, value } = e.target;
        const numericValue = value.replace(/\D/g, '');
        const floatValue = parseFloat(numericValue) / 100;
        setPackageFormData(prev => ({ ...prev, [name]: floatValue }));
    };

    const handleEditPackage = (pkg) => {
        setEditingPackage(pkg);
        setPackageFormData({
            name: pkg.name,
            type: pkg.type,
            fixedFee: pkg.fixedFee,
            audioLimit: pkg.audioLimit,
            extraAudioFee: pkg.extraAudioFee,
            startDate: getLocalISODate(new Date(pkg.startDate)),
            endDate: getLocalISODate(new Date(pkg.endDate)),
            active: pkg.active
        });
        setShowPackageForm(true);
    };

    const handleDeletePackage = async (id, forceDelete = false) => {
        if (!forceDelete && !window.confirm('Tem certeza que deseja excluir este pacote?')) return;
        setLoading(true);
        try {
            await clientPackageAPI.delete(id, forceDelete);
            setMessage({ type: 'success', text: 'Pacote excluído com sucesso!' });
            fetchPackages();
        } catch (error) {
            // Verificar se é um erro de venda faturada
            if (error.message.includes('BILLING_ALREADY_INVOICED') || error.message.includes('já foi faturada')) {
                const confirmDelete = window.confirm(
                    'A venda deste pacote já foi faturada. Se você continuar, a venda também será excluída do faturamento. Deseja continuar?'
                );
                if (confirmDelete) {
                    // Tentar novamente com forceDelete
                    return handleDeletePackage(id, true);
                }
            } else {
                setMessage({ type: 'error', text: 'Erro ao excluir pacote' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSavePackage = async (forceUpdate = false) => {
        setLoading(true);
        try {
            const data = {
                ...packageFormData,
                clientId: client.id,
                forceUpdate
            };

            if (editingPackage) {
                await clientPackageAPI.update(editingPackage.id, data);
                showToast.success('Pacote atualizado com sucesso!');
            } else {
                await clientPackageAPI.create({ ...packageFormData, clientId: client.id });
                showToast.success('Pacote criado com sucesso!');
            }

            setShowPackageForm(false);
            setEditingPackage(null);
            fetchPackages();
        } catch (error) {
            // Verificar se é um erro de venda faturada
            if (error.message.includes('BILLING_ALREADY_INVOICED') || error.message.includes('já foi faturada')) {
                const confirmUpdate = window.confirm(
                    'A venda deste pacote já foi faturada. Se você continuar com a alteração, a venda voltará ao status "pendente" (não faturado). Deseja continuar?'
                );
                if (confirmUpdate) {
                    // Tentar novamente com forceUpdate
                    return handleSavePackage(true);
                }
            } else {
                showToast.error(error);
            }
        } finally {
            setLoading(false);
        }
    };

    const renderPackageForm = () => {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        {editingPackage ? <Pencil size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                        {editingPackage ? 'Editar Pacote Mensal' : 'Novo Pacote Mensal'}
                    </h3>
                    <button
                        onClick={() => {
                            setShowPackageForm(false);
                            setEditingPackage(null);
                        }}
                        className="text-muted-foreground hover:text-foreground text-sm"
                    >
                        Voltar para lista
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Nome do Pacote</label>
                        <input
                            type="text"
                            name="name"
                            value={packageFormData.name}
                            onChange={handlePackageFormChange}
                            placeholder="Ex: Plano Bronze, Mensalidade Outubro..."
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Tipo de Pacote</label>
                        <select
                            name="type"
                            value={packageFormData.type}
                            onChange={handlePackageFormChange}
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground"
                        >
                            <option value="FIXO_ILIMITADO">Fixo Ilimitado</option>
                            <option value="FIXO_COM_LIMITE">Fixo com Limite</option>
                            <option value="FIXO_COM_LIMITE_VENCIMENTO">Fixo com Limite e Vencimento</option>
                            <option value="FIXO_SOB_DEMANDA">Fixo + Sob Demanda</option>
                            <option value="SOB_DEMANDA_AVULSO">Sob Demanda (Avulso)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Valor Fixo Mensal</label>
                        <input
                            type="text"
                            name="fixedFee"
                            value={formatCurrency(packageFormData.fixedFee)}
                            onChange={handlePackageCurrencyChange}
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground font-mono"
                            placeholder="R$ 0,00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Limite de Áudios (0 = ilimitado)</label>
                        <input
                            type="number"
                            name="audioLimit"
                            value={packageFormData.audioLimit}
                            onChange={handlePackageFormChange}
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Valor Áudio Extra</label>
                        <input
                            type="text"
                            name="extraAudioFee"
                            value={formatCurrency(packageFormData.extraAudioFee)}
                            onChange={handlePackageCurrencyChange}
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground font-mono"
                            placeholder="R$ 0,00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Data de Início</label>
                        <input
                            type="date"
                            name="startDate"
                            value={packageFormData.startDate}
                            onChange={handlePackageFormChange}
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Data de Vencimento</label>
                        <input
                            type="date"
                            name="endDate"
                            value={packageFormData.endDate}
                            onChange={handlePackageFormChange}
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground"
                        />
                    </div>

                    <div className="flex items-center gap-3 py-4 md:col-span-2">
                        <input
                            type="checkbox"
                            id="pkg-active"
                            name="active"
                            checked={packageFormData.active}
                            onChange={handlePackageFormChange}
                            className="w-5 h-5 rounded border-border bg-input-background text-primary focus:ring-primary/20"
                        />
                        <label htmlFor="pkg-active" className="text-sm font-medium text-foreground cursor-pointer">
                            Ativar pacote imediatamente (isto desativará outros pacotes deste cliente)
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => setShowPackageForm(false)}
                        className="btn-secondary px-6"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSavePackage()}
                        disabled={loading}
                        className="btn-primary px-8 flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Salvar Pacote
                    </button>
                </div>
            </div>
        );
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        // Apply formatting ONLY if not international
        if (!isInternational) {
            if (name === 'cnpj_cpf') formattedValue = formatCNPJ(value);
            if (name === 'telefonePrincipal') formattedValue = formatPhone(value);
            if (name === 'cep') formattedValue = formatCEP(value);
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCNPJLookup = async () => {
        const cleanCNPJ = removeMask(formData.cnpj_cpf);
        const digitsOnly = cleanCNPJ.replace(/\D/g, '');

        if (isInternational) return; // Skip lookup for international

        if (digitsOnly.length !== 14 && digitsOnly.length !== 11) {
            showToast.error('Digite um CNPJ/CPF válido');
            return;
        }

        if (digitsOnly.length === 14 && !validateCNPJ(digitsOnly)) {
            showToast.error('CNPJ inválido');
            return;
        }

        setLookingUpCNPJ(true);

        try {
            const data = await lookupCNPJ(formData.cnpj_cpf);
            setFormData(prev => ({
                ...prev,
                razaoSocial: data.razaoSocial || prev.razaoSocial,
                name: data.razaoSocial || prev.name,
                inscricaoEstadual: data.inscricaoEstadual || prev.inscricaoEstadual,
                emailPrincipal: data.emailPrincipal || prev.emailPrincipal,
                telefonePrincipal: formatPhone(data.telefonePrincipal) || prev.telefonePrincipal,
                cep: formatCEP(data.cep) || prev.cep,
                endereco: data.endereco || prev.endereco,
                numero: data.numero || prev.numero,
                complemento: data.complemento || prev.complemento,
                bairro: data.bairro || prev.bairro,
                cidade: data.cidade || prev.cidade,
                estado: data.estado || prev.estado,
            }));
            showToast.success('Dados preenchidos automaticamente!');
        } catch (error) {
            showToast.error(error.message);
        } finally {
            setLookingUpCNPJ(false);
        }
    };

    const handleCEPLookup = async () => {
        if (isInternational) return; // Skip lookup for international

        const cleanCEP = removeMask(formData.cep);
        const digitsOnly = cleanCEP.replace(/\D/g, '');

        if (digitsOnly.length !== 8) {
            showToast.error('Digite um CEP válido');
            return;
        }

        setLookingUpCEP(true);

        try {
            const data = await lookupCEP(formData.cep);
            setFormData(prev => ({
                ...prev,
                endereco: data.endereco || prev.endereco,
                bairro: data.bairro || prev.bairro,
                cidade: data.cidade || prev.cidade,
                estado: data.estado || prev.estado,
                complemento: data.complemento || prev.complemento,
            }));
            showToast.success('Endereço preenchido!');
        } catch (error) {
            showToast.error(error);
        } finally {
            setLookingUpCEP(false);
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.cnpj_cpf) {
            newErrors.cnpj_cpf = 'CNPJ/CPF/ID é obrigatório';
        } else {
            if (!isInternational) {
                const clean = removeMask(formData.cnpj_cpf);
                if (clean.length === 14 && !validateCNPJ(formData.cnpj_cpf)) {
                    newErrors.cnpj_cpf = 'CNPJ inválido';
                }
            }
        }

        if (!formData.name && !formData.razaoSocial) {
            newErrors.name = 'Nome ou Razão Social é obrigatório';
        }

        if (formData.emailPrincipal && !validateEmail(formData.emailPrincipal)) {
            newErrors.emailPrincipal = 'Email inválido';
        }

        if (formData.emailContato && !validateEmail(formData.emailContato)) {
            newErrors.emailContato = 'Email inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            showToast.error('Por favor, corrija os erros no formulário');
            return;
        }

        setLoading(true);

        try {
            const dataToSend = {
                ...formData,
                cnpj_cpf: isInternational ? formData.cnpj_cpf : removeMask(formData.cnpj_cpf),
                cep: isInternational ? formData.cep : removeMask(formData.cep),
                telefonePrincipal: isInternational ? formData.telefonePrincipal : removeMask(formData.telefonePrincipal),
                isInternational
            };

            if (client?.id) {
                await clientAPI.update(client.id, dataToSend);
                showToast.success('Cliente atualizado com sucesso!');
            } else {
                await clientAPI.create(dataToSend);
                showToast.success('Cliente cadastrado com sucesso!');
            }

            setTimeout(() => {
                if (onSuccess) onSuccess();
                if (onClose) onClose();
            }, 1500);
        } catch (error) {
            showToast.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-border">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                            <Building2 size={28} className="text-primary" />
                            {client ? 'Editar Cliente' : 'Novo Cliente'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Preencha os dados do cliente abaixo</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                {client && (
                    <div className="flex gap-4 px-6 border-b border-border bg-card/50">
                        <button
                            onClick={() => setActiveTab('dados')}
                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'dados' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            Dados Gerais
                        </button>
                        <button
                            onClick={() => setActiveTab('pacotes')}
                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pacotes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            Pacotes Mensais
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'dados' && (
                        <form onSubmit={handleSubmit} className="p-6">

                            {/* Dados da Empresa */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Building2 size={20} className="text-primary" />
                                    Dados da Empresa
                                </h3>

                                <div className="mb-4 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isInternational"
                                        checked={isInternational}
                                        onChange={(e) => setIsInternational(e.target.checked)}
                                        className="w-4 h-4 rounded border-border bg-input-background text-primary focus:ring-primary/20"
                                    />
                                    <label htmlFor="isInternational" className="text-sm text-foreground font-medium cursor-pointer">
                                        Cliente Internacional (Fora do Brasil)
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* CNPJ/CPF with Lookup */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            {isInternational ? 'ID / Tax ID' : 'CNPJ/CPF'} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="cnpj_cpf"
                                                value={formData.cnpj_cpf}
                                                onChange={handleChange}
                                                className={`flex-1 bg-input-background border ${errors.cnpj_cpf ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all`}
                                                placeholder="00.000.000/0000-00"
                                                maxLength={18}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCNPJLookup}
                                                disabled={isInternational || lookingUpCNPJ}
                                                className={`btn-primary px-4 flex items-center gap-2 ${isInternational ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {lookingUpCNPJ ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                                Buscar
                                            </button>
                                        </div>
                                        {errors.cnpj_cpf && <p className="text-red-400 text-xs mt-1">{errors.cnpj_cpf}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Razão Social
                                        </label>
                                        <input
                                            type="text"
                                            name="razaoSocial"
                                            value={formData.razaoSocial}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Nome da empresa"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Nome Fantasia <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full bg-input-background border ${errors.name ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all`}
                                            placeholder="Como é conhecida"
                                        />
                                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Inscrição Estadual
                                        </label>
                                        <input
                                            type="text"
                                            name="inscricaoEstadual"
                                            value={formData.inscricaoEstadual}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="000.000.000.000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contato */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Mail size={20} className="text-primary" />
                                    Contato
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Email Principal
                                        </label>
                                        <input
                                            type="email"
                                            name="emailPrincipal"
                                            value={formData.emailPrincipal}
                                            onChange={handleChange}
                                            className={`w-full bg-input-background border ${errors.emailPrincipal ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all`}
                                            placeholder="contato@empresa.com.br"
                                        />
                                        {errors.emailPrincipal && <p className="text-red-400 text-xs mt-1">{errors.emailPrincipal}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Telefone Principal
                                        </label>
                                        <input
                                            type="text"
                                            name="telefonePrincipal"
                                            value={formData.telefonePrincipal}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="(11) 98765-4321"
                                            maxLength={15}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Endereço */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                    <MapPin size={20} className="text-primary" />
                                    Endereço
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            CEP
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="cep"
                                                value={formData.cep}
                                                onChange={handleChange}
                                                className="flex-1 bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="00000-000"
                                                maxLength={9}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCEPLookup}
                                                disabled={isInternational || lookingUpCEP}
                                                className={`btn-secondary px-3 ${isInternational ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {lookingUpCEP ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Endereço
                                        </label>
                                        <input
                                            type="text"
                                            name="endereco"
                                            value={formData.endereco}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Rua, Avenida..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Número
                                        </label>
                                        <input
                                            type="text"
                                            name="numero"
                                            value={formData.numero}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="123"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Complemento
                                        </label>
                                        <input
                                            type="text"
                                            name="complemento"
                                            value={formData.complemento}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Apto, Sala..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Bairro
                                        </label>
                                        <input
                                            type="text"
                                            name="bairro"
                                            value={formData.bairro}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Centro"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Cidade
                                        </label>
                                        <input
                                            type="text"
                                            name="cidade"
                                            value={formData.cidade}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="São Paulo"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Estado
                                        </label>
                                        <input
                                            type="text"
                                            name="estado"
                                            value={formData.estado}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="SP"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Informações Adicionais */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-foreground mb-4">Informações Adicionais</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Nome do Contato
                                        </label>
                                        <input
                                            type="text"
                                            name="nomeContato"
                                            value={formData.nomeContato}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Nome do responsável"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Email do Contato
                                        </label>
                                        <input
                                            type="email"
                                            name="emailContato"
                                            value={formData.emailContato}
                                            onChange={handleChange}
                                            className={`w-full bg-input-background border ${errors.emailContato ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all`}
                                            placeholder="contato@email.com"
                                        />
                                        {errors.emailContato && <p className="text-red-400 text-xs mt-1">{errors.emailContato}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Data de Aniversário
                                        </label>
                                        <input
                                            type="date"
                                            name="dataAniversario"
                                            value={formData.dataAniversario}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <textarea
                                    name="observacoes"
                                    value={formData.observacoes}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    placeholder="Informações adicionais sobre o cliente..."
                                />
                            </div>
                        </form>
                    )}

                    {activeTab === 'pacotes' && (
                        <div className="p-6">
                            {showPackageForm ? renderPackageForm() : renderPackages()}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!showPackageForm && (
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-card">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary px-6"
                            disabled={loading}
                        >
                            {activeTab === 'dados' ? 'Cancelar' : 'Fechar'}
                        </button>
                        {activeTab === 'dados' && (
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-primary px-8 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        {client ? 'Atualizar' : 'Cadastrar'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientForm;
