import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, ShoppingCart, DollarSign, Calculator, Paperclip, Image as ImageIcon, Search, TrendingUp, TrendingDown, FileText, ArrowUpRight, Trash2 } from 'lucide-react';
import { calculateOrderMargins, formatCalculationDisplay } from '../utils/calculations';
import { parseCurrency, formatCurrency } from '../utils/formatters';
import { clientAPI, orderAPI, locutorAPI, serviceTypeAPI, STORAGE_URL } from '../services/api';

const OrderForm = ({ order = null, initialStatus = 'PEDIDO', onClose, onSuccess }) => {
    const [clients, setClients] = useState([]);
    const [locutores, setLocutores] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingLocutores, setLoadingLocutores] = useState(true);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [loadingServiceTypes, setLoadingServiceTypes] = useState(true);
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);
    const [serviceSearch, setServiceSearch] = useState('');

    const [formData, setFormData] = useState({
        clientId: order?.clientId || '',
        title: order?.title || '',
        fileName: order?.fileName || '',
        locutor: order?.locutor || '',
        locutorId: order?.locutorId || '',
        tipo: order?.tipo || 'OFF',
        cacheValor: order?.cacheValor ? Number(order.cacheValor) : 0,
        vendaValor: order?.vendaValor ? Number(order.vendaValor) : 0,
        comentarios: order?.comentarios || '',
        status: order?.status || (order ? 'PEDIDO' : initialStatus),
        urgency: order?.urgency || 'NORMAL',
        faturado: order?.faturado || false,
        entregue: order?.entregue || (order ? false : (initialStatus === 'VENDA')),
        precisaNF: undefined, // Removed
        dispensaNF: order?.dispensaNF || false,
        emiteBoleto: order?.emiteBoleto || false,
        dataFaturar: order?.dataFaturar ? new Date(order.dataFaturar).toISOString().split('T')[0] : '',
        vencimento: order?.vencimento ? new Date(order.vencimento).toISOString().split('T')[0] : '',
        pago: order?.pago || false,
        pendenciaFinanceiro: order?.pendenciaFinanceiro || false,
        pendenciaMotivo: order?.pendenciaMotivo || '',
        numeroOS: order?.numeroOS || '',
        arquivoOS: order?.arquivoOS || '',
        serviceType: order?.serviceType || '',
    });

    const [osFile, setOsFile] = useState(null);
    const [fileConflict, setFileConflict] = useState(null); // { exists: true, name: '', newName: '' }
    const [customFilename, setCustomFilename] = useState('');

    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    // Filter clients based on search
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (client.razaoSocial && client.razaoSocial.toLowerCase().includes(clientSearch.toLowerCase()))
    );

    // Initial search value population
    useEffect(() => {
        if (formData.clientId && clients.length > 0) {
            const selected = clients.find(c => c.id === formData.clientId);
            if (selected) {
                setClientSearch(selected.name);
            }
        }
    }, [formData.clientId, clients.length]);

    const handleSelectClient = (client) => {
        setFormData(prev => ({ ...prev, clientId: client.id }));
        setClientSearch(client.name);
        setShowClientDropdown(false);
    };

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
        loadServiceTypes();
    }, []);

    // Sync serviceSearch with serviceType
    useEffect(() => {
        if (formData.serviceType) {
            setServiceSearch(formData.serviceType);
        }
    }, [formData.serviceType]);

    // Recalculate margins when values change
    useEffect(() => {
        const calc = calculateOrderMargins(formData.vendaValor, formData.cacheValor);
        setCalculations(calc);
    }, [formData.vendaValor, formData.cacheValor]);

    const loadClients = async () => {
        try {
            const data = await clientAPI.getSelection();
            setClients(data || []);
        } catch (error) {
            console.error('Error loading clients:', error);
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

    const loadServiceTypes = async () => {
        try {
            const data = await serviceTypeAPI.list();
            setServiceTypes(data || []);
        } catch (error) {
            console.error('Error loading service types:', error);
        } finally {
            setLoadingServiceTypes(false);
        }
    };

    const handleAddServiceType = async () => {
        if (!serviceSearch.trim()) return;

        const normalized = serviceSearch.trim().toUpperCase();
        const existing = serviceTypes.find(t => t.name === normalized);

        if (existing) {
            setFormData(prev => ({ ...prev, serviceType: normalized }));
            setShowServiceDropdown(false);
            setMessage({ type: 'info', text: 'Esse serviço já existe na lista.' });
            return;
        }

        try {
            setLoading(true);
            const newType = await serviceTypeAPI.create(normalized);
            setServiceTypes(prev => [...prev, newType].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData(prev => ({ ...prev, serviceType: normalized }));
            setShowServiceDropdown(false);
            setMessage({ type: 'success', text: 'Novo serviço adicionado com sucesso!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'locutorId') {
            const selectedLocutor = locutores.find(l => l.id === value);
            if (selectedLocutor) {
                const cache = selectedLocutor.valorFixoMensal > 0 ? 0 : (formData.tipo === 'OFF' ? selectedLocutor.priceOff : selectedLocutor.priceProduzido);
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
            const isMonthly = currentLocutor?.valorFixoMensal > 0;
            const newCache = isMonthly ? 0 : (currentLocutor
                ? (value === 'OFF' ? currentLocutor.priceOff : currentLocutor.priceProduzido)
                : formData.cacheValor);

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

        if (formData.status === 'PEDIDO' && !formData.tipo) {
            newErrors.tipo = 'Selecione o tipo';
        }

        if (formData.vendaValor <= 0) {
            newErrors.vendaValor = 'Valor da venda deve ser maior que zero';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRemoveOS = async () => {
        if (!order?.id) return;

        if (confirm('Tem certeza que deseja remover este anexo?')) {
            try {
                await orderAPI.removeOS(order.id);
                setFormData(prev => ({ ...prev, arquivoOS: null, numeroOS: '' }));
                setOsFile(null);
                setCustomFilename('');
                setMessage({ type: 'success', text: 'Documento removido com sucesso!' });
            } catch (error) {
                console.error('Error removing OS:', error);
                setMessage({ type: 'error', text: 'Falha ao remover documento.' });
            }
        }
    };

    const handleDelete = async () => {
        if (!order?.id) return;

        if (window.confirm('Tem certeza que deseja excluir permanentemente este lançamento? Esta ação não pode ser desfeita.')) {
            setLoading(true);
            try {
                await orderAPI.delete(order.id);
                setMessage({ type: 'success', text: 'Lançamento excluído com sucesso!' });
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    if (onClose) onClose();
                }, 1000);
            } catch (error) {
                console.error('Error deleting order:', error);
                setMessage({ type: 'error', text: 'Falha ao excluir lançamento: ' + error.message });
                setLoading(false);
            }
        }
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
            let savedOrder = null;
            if (order) {
                savedOrder = await orderAPI.update(order.id, dataToSend);
                setMessage({ type: 'success', text: 'Pedido atualizado com sucesso!' });
            } else {
                savedOrder = await orderAPI.create(dataToSend);
                setMessage({ type: 'success', text: 'Pedido cadastrado com sucesso!' });
            }

            // Handle OS/PP file upload if selected
            if (osFile && savedOrder && (savedOrder.id || order?.id)) {
                try {
                    await orderAPI.uploadOS(savedOrder.id || order.id, osFile, customFilename || null);
                    setOsFile(null);
                    setCustomFilename('');
                } catch (uploadError) {
                    console.error('Failed to upload OS file:', uploadError);
                }
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
            {/* Backdrop for closing dropdown */}
            {showClientDropdown && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowClientDropdown(false)}
                />
            )}
            {showServiceDropdown && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowServiceDropdown(false)}
                />
            )}
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-border">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                            {initialStatus === 'VENDA' ? (
                                <DollarSign size={28} className="text-primary" />
                            ) : (
                                <ShoppingCart size={28} className="text-primary" />
                            )}
                            {order ? 'Editar Registro' : (initialStatus === 'VENDA' ? 'Novo Lançamento Financeiro' : 'Novo Pedido')}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {initialStatus === 'VENDA' ? 'Gestão direta de faturamento e serviços' : 'Controle Avulso - Produção de Áudio'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
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

                    {/* Client Selection (Searchable) */}
                    <div className="mb-6 relative">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Cliente <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                value={clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setShowClientDropdown(true);
                                    if (formData.clientId) {
                                        // Clear selection if user starts typing a new search
                                        setFormData(prev => ({ ...prev, clientId: '' }));
                                    }
                                }}
                                onFocus={() => setShowClientDropdown(true)}
                                placeholder={loadingClients ? "Carregando clientes..." : "Pesquise o cliente..."}
                                className={`w-full bg-input-background border ${errors.clientId ? 'border-red-500' : 'border-border'} rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all`}
                                disabled={loadingClients}
                            />
                            {formData.clientId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, clientId: '' }));
                                        setClientSearch('');
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Results */}
                        {showClientDropdown && (
                            <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
                                {filteredClients.length > 0 ? (
                                    filteredClients.map(client => (
                                        <button
                                            key={client.id}
                                            type="button"
                                            onClick={() => handleSelectClient(client)}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex flex-col border-b border-white/5 last:border-0"
                                        >
                                            <span className="font-bold text-foreground text-sm">{client.name}</span>
                                            {client.razaoSocial && (
                                                <span className="text-[10px] text-muted-foreground">{client.razaoSocial}</span>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                        Nenhum cliente encontrado.
                                    </div>
                                )}
                            </div>
                        )}
                        {errors.clientId && <p className="text-red-400 text-xs mt-1">{errors.clientId}</p>}
                    </div>

                    {/* Order Number (numeroVenda) - Only for Sales/Finance */}
                    {formData.status === 'VENDA' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Número do Pedido / Venda
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Calculator size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="numeroVenda"
                                    value={formData.numeroVenda || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setFormData(prev => ({ ...prev, numeroVenda: val }));
                                    }}
                                    className="w-full bg-input-background border border-border rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-mono"
                                    placeholder="Deixe em branco para gerar automático..."
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1.5 ml-1 italic">
                                * Se deixado em branco, o sistema gerará o próximo número da sequência automaticamente.
                            </p>
                        </div>
                    )}

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className={initialStatus === 'VENDA' ? "md:col-span-2" : "md:col-span-2"}>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                {initialStatus === 'VENDA' ? 'Título' : 'Título do Áudio'} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full bg-input-background border ${errors.title ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all`}
                                placeholder={initialStatus === 'VENDA' ? "Ex: Mensalidade Janeiro" : "Ex: Spot Black Friday 30s"}
                            />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                        </div>

                        {initialStatus === 'VENDA' ? (
                            <div className="md:col-span-2 relative">
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Tipo de Serviço / Categoria
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            <Search size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={serviceSearch}
                                            onChange={(e) => {
                                                setServiceSearch(e.target.value);
                                                setShowServiceDropdown(true);
                                            }}
                                            onFocus={() => setShowServiceDropdown(true)}
                                            className="w-full bg-input-background border border-border rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all text-sm"
                                            placeholder="Busque ou digite novo serviço..."
                                        />

                                        {showServiceDropdown && (
                                            <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                                {serviceTypes
                                                    .filter(t => t.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                                                    .map(type => (
                                                        <button
                                                            key={type.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, serviceType: type.name }));
                                                                setServiceSearch(type.name);
                                                                setShowServiceDropdown(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors border-b border-border last:border-0"
                                                        >
                                                            {type.name}
                                                        </button>
                                                    ))}
                                                {serviceSearch.trim() && !serviceTypes.find(t => t.name.toUpperCase() === serviceSearch.trim().toUpperCase()) && (
                                                    <button
                                                        type="button"
                                                        onClick={handleAddServiceType}
                                                        className="w-full text-left px-4 py-3 text-sm text-primary font-bold hover:bg-primary/5 transition-colors"
                                                    >
                                                        + Adicionar "{serviceSearch.toUpperCase()}"
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {serviceSearch.trim() && !serviceTypes.find(t => t.name.toUpperCase() === serviceSearch.trim().toUpperCase()) && (
                                        <button
                                            type="button"
                                            onClick={handleAddServiceType}
                                            className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all font-bold text-xs"
                                        >
                                            CADASTRAR
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Nome do Arquivo
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Paperclip size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="fileName"
                                        value={formData.fileName}
                                        onChange={handleChange}
                                        className="w-full bg-input-background border border-border rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                                        placeholder="Ex: spot_natal_v1.mp3"
                                    />
                                </div>
                            </div>
                        )}

                        {initialStatus !== 'VENDA' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Locutor / Voz
                                    </label>
                                    <select
                                        name="locutorId"
                                        value={formData.locutorId}
                                        onChange={handleChange}
                                        disabled={loadingLocutores}
                                        className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
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
                                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground mt-2 focus:outline-none focus:border-primary/50 transition-all"
                                            placeholder="Digite o nome do locutor..."
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                                                className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                                            />
                                            <span className="text-foreground text-sm">OFF (Locução)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tipo"
                                                value="PRODUZIDO"
                                                checked={formData.tipo === 'PRODUZIDO'}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                                            />
                                            <span className="text-foreground text-sm">PRODUZIDO (Com trilha)</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Urgency Selection */}
                    {initialStatus !== 'VENDA' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Nível de Urgência
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.urgency === 'NORMAL' ? 'bg-white/10 border-white/30 text-foreground' : 'bg-input-background border-border text-muted-foreground'}`}>
                                    <input
                                        type="radio"
                                        name="urgency"
                                        value="NORMAL"
                                        checked={formData.urgency === 'NORMAL'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <span className="text-sm font-bold">Normal</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.urgency === 'ALTA' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-input-background border-border text-muted-foreground'}`}>
                                    <input
                                        type="radio"
                                        name="urgency"
                                        value="ALTA"
                                        checked={formData.urgency === 'ALTA'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <AlertCircle size={16} />
                                    <span className="text-sm font-bold">Alta</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.urgency === 'URGENTE' ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-input-background border-border text-muted-foreground'}`}>
                                    <input
                                        type="radio"
                                        name="urgency"
                                        value="URGENTE"
                                        checked={formData.urgency === 'URGENTE'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <AlertCircle size={16} />
                                    <span className="text-sm font-bold">URGENTE!</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Financial Values */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-primary" />
                            Valores Financeiros
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-muted-foreground">
                                        Valor do Cachê (R$)
                                    </label>
                                    {locutores.find(l => l.id === formData.locutorId)?.valorFixoMensal > 0 && (
                                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-primary text-primary-foreground uppercase tracking-widest animate-pulse">
                                            Fixo Mensal
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="cacheValor"
                                        value={formatCurrency(formData.cacheValor)}
                                        onChange={handleCurrencyChange}
                                        className={`w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-mono ${locutores.find(l => l.id === formData.locutorId)?.valorFixoMensal > 0 && formData.cacheValor === 0 ? 'text-primary/70' : ''}`}
                                        placeholder="R$ 0,00"
                                    />
                                    {locutores.find(l => l.id === formData.locutorId)?.valorFixoMensal > 0 && formData.cacheValor === 0 && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Incluso no Mensal</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Valor da Venda (R$) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="vendaValor"
                                    value={formatCurrency(formData.vendaValor)}
                                    onChange={handleCurrencyChange}
                                    className={`w-full bg-input-background border ${errors.vendaValor ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-mono`}
                                    placeholder="R$ 0,00"
                                />
                                {errors.vendaValor && <p className="text-red-400 text-xs mt-1">{errors.vendaValor}</p>}
                            </div>
                        </div>

                        {/* Automatic Calculations */}
                        <div className="mt-6 p-6 bg-input-background border border-primary/20 rounded-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Calculator size={20} className="text-primary" />
                                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Cálculos Automáticos</h4>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Imposto (10%)</p>
                                    <p className="text-lg font-bold text-foreground">{displayCalc.imposto}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Comissão (4%)</p>
                                    <p className="text-lg font-bold text-foreground">{displayCalc.comissao}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Margem de Lucro</p>
                                    <div className={`flex items-center gap-1 text-lg font-bold ${Number(calculations.margem) < 0 ? 'text-red-500' : 'text-[#03CC0B]'}`}>
                                        {Number(calculations.margem) < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                                        {displayCalc.margem}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Margem %</p>
                                    <p className={`text-lg font-bold ${Number(calculations.margemPercentual) < 0 ? 'text-red-500' : 'text-primary'}`}>
                                        {displayCalc.margemPercentual}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments and Attachments */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Comentários / Detalhes do Dataset (Ctrl+V para colar imagem)
                        </label>
                        <textarea
                            name="comentarios"
                            value={formData.comentarios}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
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
                                        <div key={index} className="flex items-center justify-between p-3 bg-input-background border border-border rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <ImageIcon size={18} className="text-primary" />
                                                <span className="text-sm text-foreground">{file.name}</span>
                                                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
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
                        <h3 className="text-lg font-bold text-foreground mb-4">Status do Pedido</h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="entregue"
                                    checked={formData.entregue}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 rounded"
                                />
                                <span className="text-foreground text-sm">Entregue</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="faturado"
                                    checked={formData.faturado}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 rounded"
                                />
                                <span className="text-foreground text-sm">Faturado</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="dispensaNF"
                                    checked={formData.dispensaNF}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 rounded"
                                />
                                <span className="text-foreground text-sm">Dispensa NF</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="emiteBoleto"
                                    checked={formData.emiteBoleto}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 rounded"
                                />
                                <span className="text-foreground text-sm">Emite Boleto</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                <input
                                    type="checkbox"
                                    name="pago"
                                    checked={formData.pago}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-green-500 focus:ring-green-500 focus:ring-2 rounded"
                                />
                                <span className="text-green-400 font-bold text-sm">Já está PAGO</span>
                            </label>

                            {order && formData.status === 'PEDIDO' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm('Deseja transformar este Pedido em Venda agora?')) {
                                            setFormData(prev => ({ ...prev, status: 'VENDA', entregue: true }));
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all font-bold text-[10px] uppercase tracking-widest"
                                >
                                    <CheckCircle2 size={14} />
                                    Transformar em Venda
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Billing Pendency */}
                    <div className="mb-6 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="pendenciaFinanceiro"
                                checked={formData.pendenciaFinanceiro}
                                onChange={handleChange}
                                className="w-5 h-5 text-orange-500 focus:ring-orange-500 focus:ring-2 rounded-lg bg-input-background border-border"
                            />
                            <div className="flex flex-col">
                                <span className="text-orange-400 font-bold text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    Pendência para Financeiro
                                </span>
                                <span className="text-[11px] text-muted-foreground">Marque se faltam informações (OS, aprovação, etc.) para faturar</span>
                            </div>
                        </label>

                        {formData.pendenciaFinanceiro && (
                            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                                <textarea
                                    name="pendenciaMotivo"
                                    value={formData.pendenciaMotivo}
                                    onChange={handleChange}
                                    placeholder="Descreva o que falta para o faturamento (ex: Aguardando número de OS, Aprovação pendente...)"
                                    className="w-full bg-input-background border border-border rounded-xl p-4 text-foreground text-sm focus:border-orange-500 outline-none transition-all min-h-[100px]"
                                />
                            </div>
                        )}
                    </div>

                    {/* OS/PP Registration */}
                    <div className="mb-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={18} className="text-blue-400" />
                            <h3 className="text-sm font-bold text-foreground">Registro de OS / PP</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
                                    Número da OS / PP
                                </label>
                                <input
                                    type="text"
                                    name="numeroOS"
                                    value={formData.numeroOS}
                                    onChange={handleChange}
                                    placeholder="Ex: 12345/2026"
                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
                                    Documento PDF (OS / PP)
                                </label>
                                <div className="flex items-center gap-2">
                                    <label className="flex-1">
                                        <div className={`cursor-pointer w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed transition-all ${osFile ? 'bg-blue-500/10 border-blue-500/50' : 'bg-input-background border-border hover:border-blue-500/30'}`}>
                                            <Paperclip size={16} className={osFile ? 'text-blue-400' : 'text-muted-foreground'} />
                                            <span className={`text-xs truncate ${osFile ? 'text-blue-400 font-medium' : 'text-muted-foreground'}`}>
                                                {osFile ? osFile.name : formData.arquivoOS ? 'Documento anexado' : 'Selecionar PDF'}
                                            </span>
                                        </div>
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setOsFile(file);
                                                    setCustomFilename('');
                                                    setFileConflict(null);
                                                    try {
                                                        const check = await orderAPI.checkFileExists(file.name);
                                                        if (check.exists) {
                                                            setFileConflict({ exists: true, name: file.name });
                                                            setCustomFilename(file.name);
                                                        }
                                                    } catch (err) {
                                                        console.error('Error checking file existence:', err);
                                                    }
                                                }
                                                // Reset input so same file can be selected again
                                                e.target.value = '';
                                            }}
                                            className="hidden"
                                        />
                                    </label>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {osFile && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOsFile(null);
                                                    setCustomFilename('');
                                                    setFileConflict(null);
                                                }}
                                                className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all shrink-0"
                                                title="Cancelar seleção"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}

                                        {(formData.arquivoOS || osFile) && (
                                            <>
                                                {formData.arquivoOS && (
                                                    <a
                                                        href={`${STORAGE_URL}${formData.arquivoOS}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all shrink-0"
                                                        title="Visualizar PDF atual"
                                                    >
                                                        <ArrowUpRight size={18} />
                                                    </a>
                                                )}

                                                {order?.id && formData.arquivoOS && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveOS}
                                                        className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all shrink-0"
                                                        title="Remover anexo"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {fileConflict && (
                            <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 animate-in fade-in slide-in-from-top-2">
                                <p className="text-sm font-bold text-orange-400 flex items-center gap-2 mb-3">
                                    <AlertCircle size={16} />
                                    Atenção: Já existe um arquivo com este nome!
                                </p>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs text-muted-foreground ml-1">Para renomear, altere o campo abaixo:</label>
                                        <input
                                            type="text"
                                            value={customFilename}
                                            onChange={(e) => setCustomFilename(e.target.value)}
                                            className="w-full bg-input-background border border-orange-500/30 rounded-lg px-3 py-2 text-sm text-foreground focus:border-orange-500 outline-none transition-all"
                                            placeholder="Novo nome do arquivo"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFileConflict(null);
                                                // Keep customFilename as is (user choice)
                                            }}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-all"
                                        >
                                            USAR ESTE NOME
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFileConflict(null);
                                                setCustomFilename(''); // Will use original name and overwrite
                                            }}
                                            className="px-4 py-2 border border-orange-500/30 text-orange-400 rounded-lg text-xs font-bold hover:bg-orange-500/10 transition-all"
                                        >
                                            SOBRESCREVER ORIGINAL
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Financial Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Data para Faturar
                            </label>
                            <input
                                type="date"
                                name="dataFaturar"
                                value={formData.dataFaturar}
                                onChange={handleChange}
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Vencimento
                            </label>
                            <input
                                type="date"
                                name="vencimento"
                                value={formData.vencimento}
                                onChange={handleChange}
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-6 border-t border-border bg-card">
                    <div>
                        {order && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-bold flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                <span className="hidden sm:inline">Excluir Lançamento</span>
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
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
                                    Processando...
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
        </div>
    );
};

export default OrderForm;
