import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Loader2,
    Mic2,
    Phone,
    Mail,
    Music,
    DollarSign,
    Info,
    CheckCircle2
} from 'lucide-react';
import { locutorAPI, supplierAPI } from '../services/api';
import { formatCurrency, formatPhone } from '../utils/formatters';
import { showToast } from '../utils/toast';

const LocutorForm = ({ locutor, onClose, onSave }) => {
    const isEditing = !!locutor;
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const data = await supplierAPI.list();
                setSuppliers(data);
            } catch (error) {
                console.error('Error loading suppliers:', error);
                showToast.error('Erro ao carregar lista de estúdios');
            }
        };
        loadSuppliers();
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        realName: '',
        phone: '',
        email: '',
        status: 'DISPONIVEL',
        reelsUrl: '',
        priceOff: 0,
        priceProduzido: 0,
        valorFixoMensal: 0,
        banco: '',
        description: '',
        supplierIds: []
    });

    useEffect(() => {
        if (locutor) {
            setFormData({
                name: locutor.name || '',
                realName: locutor.realName || '',
                phone: locutor.phone || '',
                email: locutor.email || '',
                status: locutor.status || 'DISPONIVEL',
                reelsUrl: locutor.reelsUrl || '',
                priceOff: locutor.priceOff ? Number(locutor.priceOff) : 0,
                priceProduzido: locutor.priceProduzido ? Number(locutor.priceProduzido) : 0,
                valorFixoMensal: locutor.valorFixoMensal ? Number(locutor.valorFixoMensal) : 0,
                banco: locutor.banco || '',
                description: locutor.description || '',
                supplierIds: locutor.suppliers ? locutor.suppliers.map(s => s.id) : []
            });
        }
    }, [locutor]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                await locutorAPI.update(locutor.id, formData);
            } else {
                await locutorAPI.create(formData);
            }
            showToast.success(isEditing ? 'Locutor atualizado com sucesso!' : 'Locutor cadastrado com sucesso!');
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving locutor:', error);
            showToast.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCurrencyChange = (e) => {
        const { name, value } = e.target;
        // Remove all non-digits
        const numericValue = value.replace(/\D/g, '');
        // Convert to float (cents to currency)
        const floatValue = parseFloat(numericValue) / 100;

        setFormData(prev => ({ ...prev, [name]: floatValue }));
    };

    const handlePhoneChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-end z-[100] animate-in fade-in duration-300">
            <div className="h-full w-full max-w-xl bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Mic2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground leading-tight">
                                {isEditing ? 'Editar Locutor' : 'Novo Locutor'}
                            </h2>
                            <p className="text-sm text-muted-foreground">Cadastro de portfólio e tabelas de preço</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-foreground transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="space-y-8">
                        {/* Basic Info SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-3 bg-primary rounded-full"></span>
                                Informações Básicas
                            </h3>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground ml-1">Nome Interno / Artístico</label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ex: João da Silva (Nome na vitrine)"
                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground ml-1">Nome Real / Civil (Interno)</label>
                                <input
                                    type="text"
                                    name="realName"
                                    value={formData.realName}
                                    onChange={handleChange}
                                    placeholder="Nome completo para contrato/pagamento"
                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1">WhatsApp / Telefone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formatPhone(formData.phone)}
                                        onChange={handlePhoneChange}
                                        placeholder="(00) 00000-0000"
                                        className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1">Status de Disponibilidade</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    >
                                        <option value="DISPONIVEL" className="bg-popover text-popover-foreground">Disponível Agora</option>
                                        <option value="FERIAS" className="bg-popover text-popover-foreground">Em Férias</option>
                                        <option value="INDISPONIVEL" className="bg-popover text-popover-foreground">Indisponível</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground ml-1">Email de Contato</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@locutor.com"
                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-all"
                                />
                            </div>
                        </div>

                        {/* Supplier Link SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-3 bg-primary rounded-full"></span>
                                Vínculo com Fornecedores (Créditos)
                            </h3>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground ml-1">Fornecedores (Estúdios Parceiros)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-input-background border border-border rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                                    {suppliers.map(sup => (
                                        <label key={sup.id} className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded-lg transition-all">
                                            <input
                                                type="checkbox"
                                                checked={formData.supplierIds?.includes(sup.id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        supplierIds: checked
                                                            ? [...(prev.supplierIds || []), sup.id]
                                                            : (prev.supplierIds || []).filter(id => id !== sup.id)
                                                    }));
                                                }}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 bg-transparent transition-all"
                                            />
                                            <span className="text-sm text-foreground group-hover:text-primary transition-colors">{sup.name}</span>
                                        </label>
                                    ))}
                                    {suppliers.length === 0 && (
                                        <p className="col-span-2 text-xs text-muted-foreground text-center py-2 italic opacity-50">
                                            Nenhum fornecedor cadastrado.
                                        </p>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground ml-1 italic">
                                    * Se vinculado, o custo será calculado com base nos créditos do fornecedor selecionado no ato do pedido.
                                </p>
                            </div>
                        </div>

                        {/* Portfolio & Pricing SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-3 bg-primary rounded-full"></span>
                                Portfólio & Valores
                            </h3>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-2">
                                    Link do Reel / Portfólio (Soundcloud, Drive, Site)
                                    <Music size={12} />
                                </label>
                                <input
                                    type="url"
                                    name="reelsUrl"
                                    value={formData.reelsUrl}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-1">
                                        Cache OFF
                                        <Info size={12} className="opacity-40" title="Valor base para locução sem trilha/efeitos" />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="priceOff"
                                            value={formatCurrency(formData.priceOff)}
                                            onChange={handleCurrencyChange}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-1">
                                        Cache PRODUZIDO
                                        <Info size={12} className="opacity-40" title="Valor base para locução com trilha e produção final" />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="priceProduzido"
                                            value={formatCurrency(formData.priceProduzido)}
                                            onChange={handleCurrencyChange}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-1">
                                        Valor Fixo Mensal
                                        <Info size={12} className="opacity-40" title="Se preenchido, o cachê por áudio será calculado automaticamente diluindo este valor" />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="valorFixoMensal"
                                            value={formatCurrency(formData.valorFixoMensal)}
                                            onChange={handleCurrencyChange}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-mono text-primary font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment/PIX SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-3 bg-primary rounded-full"></span>
                                Dados de Pagamento (PIX)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1">Tipo de Chave</label>
                                    <select
                                        name="tipoChavePix"
                                        value={formData.tipoChavePix}
                                        onChange={handleChange}
                                        className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all text-sm"
                                    >
                                        <option value="CPF" className="bg-popover text-popover-foreground">CPF</option>
                                        <option value="CNPJ" className="bg-popover text-popover-foreground">CNPJ</option>
                                        <option value="EMAIL" className="bg-popover text-popover-foreground">Email</option>
                                        <option value="TELEFONE" className="bg-popover text-popover-foreground">Telefone</option>
                                        <option value="ALEATORIA" className="bg-popover text-popover-foreground">Chave Aleatória</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1">Chave PIX</label>
                                    <input
                                        type="text"
                                        name="chavePix"
                                        value={formData.chavePix}
                                        onChange={handleChange}
                                        placeholder="Chave Pix..."
                                        className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground ml-1">Banco / Instituição (Opcional)</label>
                                <input
                                    type="text"
                                    name="banco"
                                    value={formData.banco}
                                    onChange={handleChange}
                                    placeholder="Ex: Nubank, Inter, Banco do Brasil..."
                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-all"
                                />
                            </div>
                        </div>

                        {/* Observations SECTION */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground ml-1">Observações Internas (Especialidades, horários, etc)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Locutor especializado em varejo, grava rápido das 09h às 12h..."
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-all resize-none text-sm"
                            ></textarea>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-8 border-t border-border bg-card flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/5"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] btn-primary hover:scale-[1.02] active:scale-95 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:grayscale"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span>{isEditing ? 'Salvar Alterações' : 'Confirmar Cadastro'}</span>
                    </button>
                </div>
            </div >
        </div >
    );
};

export default LocutorForm;
