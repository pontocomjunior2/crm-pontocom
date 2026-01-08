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
import { locutorAPI } from '../services/api';

const LocutorForm = ({ locutor, onClose, onSave }) => {
    const isEditing = !!locutor;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        status: 'DISPONIVEL',
        reelsUrl: '',
        priceOff: 0,
        priceProduzido: 0,
        description: ''
    });

    useEffect(() => {
        if (locutor) {
            setFormData({
                name: locutor.name || '',
                phone: locutor.phone || '',
                email: locutor.email || '',
                status: locutor.status || 'DISPONIVEL',
                reelsUrl: locutor.reelsUrl || '',
                priceOff: locutor.priceOff || 0,
                priceProduzido: locutor.priceProduzido || 0,
                description: locutor.description || ''
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
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving locutor:', error);
            alert('Erro ao salvar locutor: ' + error.message);
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-end z-[100] animate-in fade-in duration-300">
            <div className="h-full w-full max-w-xl bg-[#0A0A0A] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[#FF9500]/10 text-[#FF9500]">
                            <Mic2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                {isEditing ? 'Editar Locutor' : 'Novo Locutor'}
                            </h2>
                            <p className="text-sm text-[#666666]">Cadastro de portfólio e tabelas de preço</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-[#666666] hover:text-white transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="space-y-8">
                        {/* Basic Info SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-[#FF9500] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-3 bg-[#FF9500] rounded-full"></span>
                                Informações Básicas
                            </h3>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#999999] ml-1">Nome do Locutor / Talent</label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ex: João da Silva"
                                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 placeholder:text-[#333] transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#999999] ml-1">WhatsApp / Telefone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="(00) 00000-0000"
                                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 placeholder:text-[#333] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#999999] ml-1">Status de Disponibilidade</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 transition-all font-medium"
                                    >
                                        <option value="DISPONIVEL" className="bg-[#121212]">Disponível Agora</option>
                                        <option value="FERIAS" className="bg-[#121212]">Em Férias</option>
                                        <option value="INDISPONIVEL" className="bg-[#121212]">Indisponível</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#999999] ml-1">Email de Contato</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@locutor.com"
                                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 placeholder:text-[#333] transition-all"
                                />
                            </div>
                        </div>

                        {/* Portfolio & Pricing SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-[#FF9500] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-3 bg-[#FF9500] rounded-full"></span>
                                Portfólio & Valores
                            </h3>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#999999] ml-1 flex items-center gap-2">
                                    Link do Reel / Portfólio (Soundcloud, Drive, Site)
                                    <Music size={12} />
                                </label>
                                <input
                                    type="url"
                                    name="reelsUrl"
                                    value={formData.reelsUrl}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 placeholder:text-[#333] transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#999999] ml-1 flex items-center gap-1">
                                        Cache OFF
                                        <Info size={12} className="opacity-40" title="Valor base para locução sem trilha/efeitos" />
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444] text-xs font-bold">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="priceOff"
                                            value={formData.priceOff}
                                            onChange={handleChange}
                                            className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#999999] ml-1 flex items-center gap-1">
                                        Cache PRODUZIDO
                                        <Info size={12} className="opacity-40" title="Valor base para locução com trilha e produção final" />
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444] text-xs font-bold">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="priceProduzido"
                                            value={formData.priceProduzido}
                                            onChange={handleChange}
                                            className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Observations SECTION */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#999999] ml-1">Observações Internas (Especialidades, horários, etc)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Locutor especializado em varejo, grava rápido das 09h às 12h..."
                                className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 placeholder:text-[#333] transition-all resize-none text-sm"
                            ></textarea>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 bg-gradient-to-t from-white/[0.02] to-transparent flex items-center gap-4">
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
                        className="flex-[2] bg-gradient-to-r from-[#FF9500] to-[#FFB700] hover:scale-[1.02] active:scale-95 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,149,0,0.3)] disabled:opacity-50 disabled:grayscale"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span>{isEditing ? 'Salvar Alterações' : 'Confirmar Cadastro'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocutorForm;
