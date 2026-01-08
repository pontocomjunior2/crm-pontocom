import React, { useState } from 'react';
import { X, Search, Loader2, CheckCircle2, AlertCircle, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { formatCNPJ, formatPhone, formatCEP, validateCNPJ, validateEmail, removeMask } from '../utils/formatters';
import { lookupCNPJ, lookupCEP, clientAPI } from '../services/api';

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

    const [loading, setLoading] = useState(false);
    const [lookingUpCNPJ, setLookingUpCNPJ] = useState(false);
    const [lookingUpCEP, setLookingUpCEP] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        // Apply formatting
        if (name === 'cnpj_cpf') formattedValue = formatCNPJ(value);
        if (name === 'telefonePrincipal') formattedValue = formatPhone(value);
        if (name === 'cep') formattedValue = formatCEP(value);

        setFormData(prev => ({ ...prev, [name]: formattedValue }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCNPJLookup = async () => {
        const cleanCNPJ = removeMask(formData.cnpj_cpf);

        if (!cleanCNPJ || cleanCNPJ.length < 11) {
            setMessage({ type: 'error', text: 'Digite um CNPJ/CPF válido' });
            return;
        }

        if (cleanCNPJ.length === 14 && !validateCNPJ(formData.cnpj_cpf)) {
            setMessage({ type: 'error', text: 'CNPJ inválido' });
            return;
        }

        setLookingUpCNPJ(true);
        setMessage({ type: '', text: '' });

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
            setMessage({ type: 'success', text: 'Dados preenchidos automaticamente!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLookingUpCNPJ(false);
        }
    };

    const handleCEPLookup = async () => {
        const cleanCEP = removeMask(formData.cep);

        if (!cleanCEP || cleanCEP.length !== 8) {
            setMessage({ type: 'error', text: 'Digite um CEP válido' });
            return;
        }

        setLookingUpCEP(true);
        setMessage({ type: '', text: '' });

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
            setMessage({ type: 'success', text: 'Endereço preenchido!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLookingUpCEP(false);
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.cnpj_cpf) {
            newErrors.cnpj_cpf = 'CNPJ/CPF é obrigatório';
        } else {
            const clean = removeMask(formData.cnpj_cpf);
            if (clean.length === 14 && !validateCNPJ(formData.cnpj_cpf)) {
                newErrors.cnpj_cpf = 'CNPJ inválido';
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
            setMessage({ type: 'error', text: 'Por favor, corrija os erros no formulário' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const dataToSend = {
                ...formData,
                cnpj_cpf: removeMask(formData.cnpj_cpf),
                cep: removeMask(formData.cep),
                telefonePrincipal: removeMask(formData.telefonePrincipal),
            };

            if (client) {
                await clientAPI.update(client.id, dataToSend);
                setMessage({ type: 'success', text: 'Cliente atualizado com sucesso!' });
            } else {
                await clientAPI.create(dataToSend);
                setMessage({ type: 'success', text: 'Cliente cadastrado com sucesso!' });
            }

            setTimeout(() => {
                if (onSuccess) onSuccess();
                if (onClose) onClose();
            }, 1500);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#161616] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/10">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Building2 size={28} className="text-[#FF9500]" />
                            {client ? 'Editar Cliente' : 'Novo Cliente'}
                        </h2>
                        <p className="text-sm text-[#999999] mt-1">Preencha os dados do cliente abaixo</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#999999] hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`mx-6 mt-4 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                            : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">

                    {/* Dados da Empresa */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-[#FF9500]" />
                            Dados da Empresa
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* CNPJ/CPF with Lookup */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    CNPJ/CPF <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="cnpj_cpf"
                                        value={formData.cnpj_cpf}
                                        onChange={handleChange}
                                        className={`flex-1 bg-[#0F0F0F] border ${errors.cnpj_cpf ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all`}
                                        placeholder="00.000.000/0000-00"
                                        maxLength={18}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCNPJLookup}
                                        disabled={lookingUpCNPJ}
                                        className="btn-primary px-4 flex items-center gap-2"
                                    >
                                        {lookingUpCNPJ ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                        Buscar
                                    </button>
                                </div>
                                {errors.cnpj_cpf && <p className="text-red-400 text-xs mt-1">{errors.cnpj_cpf}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Razão Social
                                </label>
                                <input
                                    type="text"
                                    name="razaoSocial"
                                    value={formData.razaoSocial}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="Nome da empresa"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Nome Fantasia <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full bg-[#0F0F0F] border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all`}
                                    placeholder="Como é conhecida"
                                />
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Inscrição Estadual
                                </label>
                                <input
                                    type="text"
                                    name="inscricaoEstadual"
                                    value={formData.inscricaoEstadual}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="000.000.000.000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contato */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Mail size={20} className="text-[#FF9500]" />
                            Contato
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Email Principal
                                </label>
                                <input
                                    type="email"
                                    name="emailPrincipal"
                                    value={formData.emailPrincipal}
                                    onChange={handleChange}
                                    className={`w-full bg-[#0F0F0F] border ${errors.emailPrincipal ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all`}
                                    placeholder="contato@empresa.com.br"
                                />
                                {errors.emailPrincipal && <p className="text-red-400 text-xs mt-1">{errors.emailPrincipal}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Telefone Principal
                                </label>
                                <input
                                    type="text"
                                    name="telefonePrincipal"
                                    value={formData.telefonePrincipal}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="(11) 98765-4321"
                                    maxLength={15}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-[#FF9500]" />
                            Endereço
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    CEP
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleChange}
                                        className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                        placeholder="00000-000"
                                        maxLength={9}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCEPLookup}
                                        disabled={lookingUpCEP}
                                        className="btn-secondary px-3"
                                    >
                                        {lookingUpCEP ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Endereço
                                </label>
                                <input
                                    type="text"
                                    name="endereco"
                                    value={formData.endereco}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="Rua, Avenida..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Número
                                </label>
                                <input
                                    type="text"
                                    name="numero"
                                    value={formData.numero}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="123"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Complemento
                                </label>
                                <input
                                    type="text"
                                    name="complemento"
                                    value={formData.complemento}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="Apto, Sala..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Bairro
                                </label>
                                <input
                                    type="text"
                                    name="bairro"
                                    value={formData.bairro}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="Centro"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="São Paulo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Estado
                                </label>
                                <input
                                    type="text"
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="SP"
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-4">Informações Adicionais</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Nome do Contato
                                </label>
                                <input
                                    type="text"
                                    name="nomeContato"
                                    value={formData.nomeContato}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                    placeholder="Nome do responsável"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Email do Contato
                                </label>
                                <input
                                    type="email"
                                    name="emailContato"
                                    value={formData.emailContato}
                                    onChange={handleChange}
                                    className={`w-full bg-[#0F0F0F] border ${errors.emailContato ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all`}
                                    placeholder="contato@email.com"
                                />
                                {errors.emailContato && <p className="text-red-400 text-xs mt-1">{errors.emailContato}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Data de Aniversário
                                </label>
                                <input
                                    type="date"
                                    name="dataAniversario"
                                    value={formData.dataAniversario}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                Observações
                            </label>
                            <textarea
                                name="observacoes"
                                value={formData.observacoes}
                                onChange={handleChange}
                                rows={4}
                                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all resize-none"
                                placeholder="Informações adicionais sobre o cliente..."
                            />
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-[#0F0F0F]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary px-6"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
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
                </div>
            </div>
        </div>
    );
};

export default ClientForm;
