import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, ShoppingCart, DollarSign, Calculator, Paperclip, Image as ImageIcon } from 'lucide-react';
import { calculateOrderMargins, formatCalculationDisplay } from '../utils/calculations';
import { parseCurrency, formatCurrency } from '../utils/formatters';
import { clientAPI, orderAPI, locutorAPI } from '../services/api';

const OrderForm = ({ order = null, onClose, onSuccess }) => {
    const [clients, setClients] = useState([]);
    const [locutores, setLocutores] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingLocutores, setLoadingLocutores] = useState(true);
    const [formData, setFormData] = useState({
        clientId: order?.clientId || '',
        title: order?.title || '',
        locutor: order?.locutor || '',
        locutorId: order?.locutorId || '',
        tipo: order?.tipo || 'OFF',
        cacheValor: order?.cacheValor || 0,
        vendaValor: order?.vendaValor || 0,
        comentarios: order?.comentarios || '',
        status: order?.status || 'PEDIDO',
        faturado: order?.faturado || false,
        entregue: order?.entregue || false,
        precisaNF: order?.precisaNF || false,
        emiteBoleto: order?.emiteBoleto || false,
        dataFaturar: order?.dataFaturar ? new Date(order.dataFaturar).toISOString().split('T')[0] : '',
        vencimento: order?.vencimento ? new Date(order.vencimento).toISOString().split('T')[0] : '',
    });

    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });
    const [calculations, setCalculations] = useState({
        imposto: '0.00',
        comissao: '0.00',
        margem: '0.00',
        margemPercentual: '0.00'
    });

    // Load data on mount
    useEffect(() => {
        loadClients();
        loadLocutores();
    }, []);

    // Recalculate margins when values change
    useEffect(() => {
        const calc = calculateOrderMargins(formData.vendaValor, formData.cacheValor);
        setCalculations(calc);
    }, [formData.vendaValor, formData.cacheValor]);

    const loadClients = async () => {
        try {
            const response = await clientAPI.list({ limit: 1000, status: 'ativado' });
            setClients(response.clients || []);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao carregar clientes' });
        } finally {
            setLoadingClients(false);
        }
    };

    const loadLocutores = async () => {
        try {
            const data = await locutorAPI.list({ status: 'DISPONIVEL' });
            setLocutores(data || []);
        } catch (error) {
            console.error('Error loading locutores:', error);
        } finally {
            setLoadingLocutores(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'locutorId') {
            const selectedLocutor = locutores.find(l => l.id === value);
            if (selectedLocutor) {
                const cache = formData.tipo === 'OFF' ? selectedLocutor.priceOff : selectedLocutor.priceProduzido;
                setFormData(prev => ({
                    ...prev,
                    locutorId: value,
                    locutor: selectedLocutor.name,
                    cacheValor: cache
                }));
            } else {
                setFormData(prev => ({ ...prev, locutorId: '', locutor: '' }));
            }
        } else if (name === 'tipo') {
            const currentLocutor = locutores.find(l => l.id === formData.locutorId);
            const newCache = currentLocutor
                ? (value === 'OFF' ? currentLocutor.priceOff : currentLocutor.priceProduzido)
                : formData.cacheValor;

            setFormData(prev => ({
                ...prev,
                tipo: value,
                cacheValor: newCache
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCurrencyChange = (e) => {
        const { name, value } = e.target;
        // Remove all non-digits
        const numericValue = value.replace(/\D/g, '');
        // Convert to float (cents to currency)
        const floatValue = parseFloat(numericValue) / 100;

        setFormData(prev => ({ ...prev, [name]: floatValue }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments(prev => [...prev, ...files]);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    setAttachments(prev => [...prev, file]);
                    setMessage({ type: 'success', text: 'Imagem colada com sucesso!' });
                }
            }
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.clientId) {
            newErrors.clientId = 'Selecione um cliente';
        }

        if (!formData.title) {
            newErrors.title = 'Título é obrigatório';
        }

        if (!formData.tipo) {
            newErrors.tipo = 'Selecione o tipo';
        }

        if (formData.vendaValor <= 0) {
            newErrors.vendaValor = 'Valor da venda deve ser maior que zero';
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
                cacheValor: parseFloat(formData.cacheValor) || 0,
                vendaValor: parseFloat(formData.vendaValor) || 0,
                dataFaturar: formData.dataFaturar || null,
                vencimento: formData.vencimento || null,
            };

            // Note: File upload would need to be handled separately with FormData
            // For now, we'll just save the order data
            if (order) {
                await orderAPI.update(order.id, dataToSend);
                setMessage({ type: 'success', text: 'Pedido atualizado com sucesso!' });
            } else {
                await orderAPI.create(dataToSend);
                setMessage({ type: 'success', text: 'Pedido cadastrado com sucesso!' });
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

    const displayCalc = formatCalculationDisplay(calculations);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#161616] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/10">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <ShoppingCart size={28} className="text-[#FF9500]" />
                            {order ? 'Editar Pedido' : 'Novo Pedido'}
                        </h2>
                        <p className="text-sm text-[#999999] mt-1">Controle Avulso - Produção de Áudio</p>
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
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar" onPaste={handlePaste}>

                    {/* Client Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                            Cliente <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="clientId"
                            value={formData.clientId}
                            onChange={handleChange}
                            disabled={loadingClients}
                            className={`w-full bg-[#0F0F0F] border ${errors.clientId ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all`}
                        >
                            <option value="">Selecione um cliente...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.name} {client.cnpj_cpf ? `- ${client.cnpj_cpf}` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.clientId && <p className="text-red-400 text-xs mt-1">{errors.clientId}</p>}
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                Título do Áudio <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full bg-[#0F0F0F] border ${errors.title ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all`}
                                placeholder="Ex: Spot Black Friday 30s"
                            />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                Locutor / Voz
                            </label>
                            <select
                                name="locutorId"
                                value={formData.locutorId}
                                onChange={handleChange}
                                disabled={loadingLocutores}
                                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all font-medium"
                            >
                                <option value="">Selecione um locutor...</option>
                                {locutores.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                                <option value="OUTRO">-- Outro (Livre) --</option>
                            </select>

                            {formData.locutorId === 'OUTRO' && (
                                <input
                                    type="text"
                                    name="locutor"
                                    value={formData.locutor}
                                    onChange={handleChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white mt-2 focus:outline-none focus:border-[#FF9500]/50 transition-all"
                                    placeholder="Digite o nome do locutor..."
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                Tipo <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        value="OFF"
                                        checked={formData.tipo === 'OFF'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-[#FF9500] focus:ring-[#FF9500] focus:ring-2"
                                    />
                                    <span className="text-white text-sm">OFF (Locução)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        value="PRODUZIDO"
                                        checked={formData.tipo === 'PRODUZIDO'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-[#FF9500] focus:ring-[#FF9500] focus:ring-2"
                                    />
                                    <span className="text-white text-sm">PRODUZIDO (Com trilha)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Financial Values */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-[#FF9500]" />
                            Valores Financeiros
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Valor do Cachê (R$)
                                </label>
                                <input
                                    type="text"
                                    name="cacheValor"
                                    value={formatCurrency(formData.cacheValor)}
                                    onChange={handleCurrencyChange}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all font-mono"
                                    placeholder="R$ 0,00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                    Valor da Venda (R$) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="vendaValor"
                                    value={formatCurrency(formData.vendaValor)}
                                    onChange={handleCurrencyChange}
                                    className={`w-full bg-[#0F0F0F] border ${errors.vendaValor ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all font-mono`}
                                    placeholder="R$ 0,00"
                                />
                                {errors.vendaValor && <p className="text-red-400 text-xs mt-1">{errors.vendaValor}</p>}
                            </div>
                        </div>

                        {/* Automatic Calculations */}
                        <div className="mt-6 p-6 bg-[#0F0F0F] border border-[#FF9500]/20 rounded-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Calculator size={20} className="text-[#FF9500]" />
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Cálculos Automáticos</h4>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-[#666666] mb-1">Imposto (10%)</p>
                                    <p className="text-lg font-bold text-white">{displayCalc.imposto}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#666666] mb-1">Comissão (4%)</p>
                                    <p className="text-lg font-bold text-white">{displayCalc.comissao}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#666666] mb-1">Margem de Lucro</p>
                                    <p className="text-lg font-bold text-[#03CC0B]">{displayCalc.margem}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#666666] mb-1">Margem %</p>
                                    <p className="text-lg font-bold text-[#FF9500]">{displayCalc.margemPercentual}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments and Attachments */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                            Comentários / Detalhes do Dataset (Ctrl+V para colar imagem)
                        </label>
                        <textarea
                            name="comentarios"
                            value={formData.comentarios}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all resize-none"
                            placeholder="Observações sobre o pedido, detalhes de voz de IA, instruções especiais..."
                        />

                        {/* File Attachments */}
                        <div className="mt-4">
                            <label className="flex items-center gap-2 cursor-pointer w-fit">
                                <div className="btn-secondary px-4 py-2 flex items-center gap-2">
                                    <Paperclip size={18} />
                                    <span className="text-xs">Anexar Arquivo</span>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>

                            {attachments.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-[#0F0F0F] border border-white/10 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <ImageIcon size={18} className="text-[#FF9500]" />
                                                <span className="text-sm text-white">{file.name}</span>
                                                <span className="text-xs text-[#666666]">({(file.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Checkboxes */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-4">Status do Pedido</h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="entregue"
                                    checked={formData.entregue}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#FF9500] focus:ring-[#FF9500] focus:ring-2 rounded"
                                />
                                <span className="text-white text-sm">Entregue</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="faturado"
                                    checked={formData.faturado}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#FF9500] focus:ring-[#FF9500] focus:ring-2 rounded"
                                />
                                <span className="text-white text-sm">Faturado</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="precisaNF"
                                    checked={formData.precisaNF}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#FF9500] focus:ring-[#FF9500] focus:ring-2 rounded"
                                />
                                <span className="text-white text-sm">Precisa NF</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="emiteBoleto"
                                    checked={formData.emiteBoleto}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#FF9500] focus:ring-[#FF9500] focus:ring-2 rounded"
                                />
                                <span className="text-white text-sm">Emite Boleto</span>
                            </label>
                        </div>
                    </div>

                    {/* Financial Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                Data para Faturar
                            </label>
                            <input
                                type="date"
                                name="dataFaturar"
                                value={formData.dataFaturar}
                                onChange={handleChange}
                                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#DDDDDD] mb-2">
                                Vencimento
                            </label>
                            <input
                                type="date"
                                name="vencimento"
                                value={formData.vencimento}
                                onChange={handleChange}
                                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 focus:ring-2 focus:ring-[#FF9500]/20 transition-all"
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
                                {order ? 'Atualizar' : 'Criar Pedido'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderForm;
