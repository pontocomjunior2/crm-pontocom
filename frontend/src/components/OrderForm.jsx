import React, { useState, useEffect } from 'react';
import { X, Hash, Loader2, CheckCircle2, AlertCircle, ShoppingCart, DollarSign, Calculator, Paperclip, Image as ImageIcon, Search, TrendingUp, TrendingDown, FileText, ArrowUpRight, Trash2, Calendar, Users } from 'lucide-react';
import { calculateOrderMargins, formatCalculationDisplay } from '../utils/calculations';
import { parseCurrency, formatCurrency, getLocalISODate } from '../utils/formatters';
import { clientAPI, orderAPI, locutorAPI, serviceTypeAPI, STORAGE_URL, clientPackageAPI, adminAPI } from '../services/api';
import { showToast } from '../utils/toast';
import CommissionModal from './CommissionModal';
import { useAuth } from '../contexts/AuthContext';

const OrderForm = ({ order = null, initialStatus = 'PEDIDO', initialClient = null, onClose, onSuccess }) => {
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
        dataFaturar: order?.dataFaturar ? getLocalISODate(new Date(order.dataFaturar)) : '',
        vencimento: order?.vencimento ? getLocalISODate(new Date(order.vencimento)) : '',
        pago: order?.pago || false,
        pendenciaFinanceiro: order?.pendenciaFinanceiro || false,
        pendenciaMotivo: order?.pendenciaMotivo || '',
        numeroOS: order?.numeroOS || '',
        arquivoOS: order?.arquivoOS || '',
        serviceType: order?.serviceType || '',
        numeroVenda: order?.numeroVenda ? String(order.numeroVenda) : '',
        creditsConsumed: order?.creditsConsumed || 1,
        creditsConsumedSupplier: order?.creditsConsumedSupplier || order?.creditsConsumed || 1,
        costPerCreditSnapshot: order?.costPerCreditSnapshot || null,
        supplierId: order?.supplierId || '',
        cachePago: order?.cachePago || false,
        packageId: order?.packageId || null,
        isBonus: order?.isBonus || false,
        isBonus: order?.isBonus || false,
        date: order?.date ? getLocalISODate(new Date(order.date)) : getLocalISODate(),
        cachePaymentDate: order?.cachePaymentDate ? getLocalISODate(new Date(order.cachePaymentDate)) : '',
        cacheBank: order?.cacheBank || ''
    });

    const [activePackage, setActivePackage] = useState(null);
    const [fetchingPackage, setFetchingPackage] = useState(false);

    const [osFile, setOsFile] = useState(null);
    const [fileConflict, setFileConflict] = useState(null); // { exists: true, name: '', newName: '' }
    const [customFilename, setCustomFilename] = useState('');

    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    const { isAdmin } = useAuth();
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [pendingCommissions, setPendingCommissions] = useState([]); // Temporary store before save

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
        fetchClientPackage(client.id);
    };

    const fetchClientPackage = async (clientId) => {
        if (!clientId) return;
        setFetchingPackage(true);
        try {
            const pkg = await clientPackageAPI.getActive(clientId);
            setActivePackage(pkg);

            // SECURITY CHECK: Se for edição de um pedido que NÃO tinha pacote (Serviço Extra)
            // ou se o pedido atual tem valor de venda > 0, NÃO associa ao pacote ativo do cliente.
            setFormData(prev => {
                const isExtraService = Number(prev.vendaValor) > 0 || prev.isBonus;
                const wasNotPackaged = order && !order.packageId;

                if (isExtraService || wasNotPackaged) {
                    return { ...prev, packageId: null };
                }
                return { ...prev, packageId: pkg?.id || null };
            });
        } catch (error) {
            console.error('Error fetching client package:', error);
        } finally {
            setFetchingPackage(false);
        }
    };

    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
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

        // If a client is pre-selected (e.g. from PackageList)
        if (initialClient && !order) {
            setFormData(prev => ({ ...prev, clientId: initialClient.id }));
            setClientSearch(initialClient.name);
            fetchClientPackage(initialClient.id);
        }
    }, []);

    // Sync serviceSearch with serviceType
    useEffect(() => {
        if (formData.serviceType) {
            setServiceSearch(formData.serviceType);
        }
    }, [formData.serviceType]);

    // Fetch package if clientId exists initially
    useEffect(() => {
        if (formData.clientId && !activePackage) {
            fetchClientPackage(formData.clientId);
        }
    }, [formData.clientId]);

    // Auto-suggest price based on package
    useEffect(() => {
        if (activePackage && !order) {
            let suggestedVenda = 0;
            const credits = parseInt(formData.creditsConsumed) || 1;
            const usageBefore = Number(activePackage.usedAudios) || 0;
            const usageAfter = usageBefore + credits;
            const limit = Number(activePackage.audioLimit) || 0;

            if (activePackage.type === 'FIXO_ILIMITADO') {
                suggestedVenda = 0;
            } else if (activePackage.type === 'FIXO_SOB_DEMANDA') {
                if (usageAfter > limit) {
                    const extras = Math.max(0, usageAfter - Math.max(limit, usageBefore));
                    suggestedVenda = extras * Number(activePackage.extraAudioFee);
                } else {
                    suggestedVenda = 0;
                }
            } else {
                // Fixo com limite
                suggestedVenda = 0; // Bloqueio tratado na validação se usageAfter > limit
            }

            // Só atualiza se o usuário não tiver alterado manualmente para algo > 0 (vendedor pode querer cobrar diferente)
            // Se for novo pedido ou se estava em 0, sugerimos o valor
            setFormData(prev => {
                if (prev.vendaValor === 0 || !order) {
                    return { ...prev, vendaValor: suggestedVenda };
                }
                return prev;
            });
        }
    }, [activePackage, order, formData.creditsConsumed]);

    // Recalculate margins when values change
    useEffect(() => {
        const calc = calculateOrderMargins(formData.vendaValor, formData.cacheValor);
        setCalculations(calc);

    }, [formData.vendaValor, formData.cacheValor]);

    // Calculate Cache based on Supplier Credits
    useEffect(() => {
        if (formData.locutorId && formData.supplierId && locutores.length > 0) {
            const locutor = locutores.find(l => l.id === formData.locutorId);
            const supplier = locutor?.suppliers?.find(s => s.id === formData.supplierId);

            if (supplier?.packages?.length > 0) {
                const latestPackage = supplier.packages[0];
                const cost = parseFloat(latestPackage.costPerCredit);
                const credits = parseInt(formData.creditsConsumed) || 1;
                const newCache = cost * credits;

                setFormData(prev => {
                    if (prev.cacheValor !== newCache) {
                        return { ...prev, cacheValor: newCache, costPerCreditSnapshot: cost };
                    }
                    return prev;
                });
            }
        }
    }, [formData.locutorId, formData.supplierId, formData.creditsConsumed, locutores]);

    const loadClients = async () => {
        try {
            const data = await clientAPI.getSelection();
            setClients(data || []);
        } catch (error) {
            console.error('Error loading clients:', error);
            showToast.error('Erro ao carregar clientes');
        } finally {
            setLoadingClients(false);
        }
    };

    const loadLocutores = async () => {
        try {
            // Usamos selection: true para carregar apenas dados básicos e de forma ultra rápida
            const data = await locutorAPI.list({ status: 'DISPONIVEL', selection: 'true' });
            let finalLocutores = data || [];

            // Segurança: Se for uma edição e o locutor do pedido não estiver na lista (ex: está inativo ou em férias)
            // nós buscamos ele individualmente para garantir que o nome apareça no formulário
            if (order?.locutorId && !finalLocutores.find(l => l.id === order.locutorId)) {
                try {
                    const currentLocutor = await locutorAPI.get(order.locutorId);
                    if (currentLocutor) {
                        finalLocutores = [...finalLocutores, currentLocutor];
                    }
                } catch (err) {
                    console.error('Error fetching current order locutor:', err);
                }
            }

            setLocutores(finalLocutores);
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
            showToast.info('Esse serviço já existe na lista.');
            return;
        }

        try {
            setLoading(true);
            const newType = await serviceTypeAPI.create(normalized);
            setServiceTypes(prev => [...prev, newType].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData(prev => ({ ...prev, serviceType: normalized }));
            setShowServiceDropdown(false);
            showToast.success('Novo serviço adicionado com sucesso!');
        } catch (error) {
            showToast.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        // Atualização de estado centralizada
        setFormData(prev => {
            const newState = { ...prev, [name]: val };

            // 1. Regra de Sincronização de Créditos (Venda -> Fornecedor)
            if (name === 'creditsConsumed') {
                const oldCredits = parseInt(prev.creditsConsumed) || 0;
                const oldSupplierCredits = parseInt(prev.creditsConsumedSupplier) || 0;
                // Se estavam iguais, mantém a sincronia
                if (oldCredits === oldSupplierCredits) {
                    newState.creditsConsumedSupplier = val;
                }
            }

            // 2. Lógica de Bonificação
            if (name === 'isBonus' && checked) {
                newState.vendaValor = 0;
                newState.packageId = null;
            }

            // 3. Lógica de Locutor (Auto-cache e Auto-Fornecedor)
            if (name === 'locutorId') {
                const selectedLocutor = locutores.find(l => l.id === value);
                if (selectedLocutor) {
                    newState.locutor = selectedLocutor.name;
                    newState.cacheValor = selectedLocutor.valorFixoMensal > 0 ? 0 : (prev.tipo === 'OFF' ? selectedLocutor.priceOff : selectedLocutor.priceProduzido);

                    if (selectedLocutor.suppliers?.length === 1) {
                        newState.supplierId = selectedLocutor.suppliers[0].id;
                    }
                } else {
                    newState.locutorId = '';
                    newState.locutor = '';
                    newState.supplierId = '';
                }
            }

            // 4. Lógica de Tipo (OFF/Produzido)
            if (name === 'tipo') {
                const currentLocutor = locutores.find(l => l.id === prev.locutorId);
                const isMonthly = currentLocutor?.valorFixoMensal > 0;
                newState.cacheValor = isMonthly ? 0 : (currentLocutor
                    ? (value === 'OFF' ? currentLocutor.priceOff : currentLocutor.priceProduzido)
                    : prev.cacheValor);
            }

            return newState;
        });

        // Limpar erro do campo
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

        setFormData(prev => {
            const newData = { ...prev, [name]: floatValue };

            // Se estiver editando o valor de venda e houver um pacote ativo
            // Caso o valor seja > 0, limpamos o packageId para torná-lo AVULSO
            if (name === 'vendaValor' && floatValue > 0 && activePackage) {
                newData.packageId = null;
            } else if (name === 'vendaValor' && floatValue === 0 && activePackage) {
                // Se voltar para zero, re-vincula ao pacote
                newData.packageId = activePackage.id;
            }

            return newData;
        });
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
                    showToast.success('Imagem colada com sucesso!');
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

        const selectedLocutor = locutores.find(l => l.id === formData.locutorId);
        if (selectedLocutor?.suppliers?.length > 0 && !formData.supplierId) {
            newErrors.supplierId = 'Selecione o fornecedor para este locutor';
        }

        // Validação de Pacotes
        if (activePackage && formData.packageId && formData.vendaValor === 0 && !formData.isBonus) {
            const competenceDate = formData.date ? new Date(formData.date + 'T12:00:00') : new Date();
            const start = new Date(activePackage.startDate);
            const end = new Date(activePackage.endDate);

            // 1. Validação de Data
            if (competenceDate < start || competenceDate > end) {
                const dataFormatada = end.toLocaleDateString('pt-BR');
                const errorMsg = `Erro no Pacote: O plano do cliente expirou em ${dataFormatada}. Para prosseguir, defina um valor de venda(Pedido Avulso) ou atualize o pacote do cliente.`;
                showToast.error(errorMsg);
                newErrors.packageId = 'Pacote Expirado';
                return false;
            }

            // 2. Validação de Limite
            if (activePackage.type !== 'FIXO_ILIMITADO' && activePackage.type !== 'FIXO_SOB_DEMANDA') {
                const credits = parseInt(formData.creditsConsumed) || 1;
                if ((activePackage.usedAudios + credits) > activePackage.audioLimit) {
                    const errorMsg = `Erro no Pacote: O limite de créditos(${activePackage.audioLimit}) foi atingido.Para prosseguir, defina um valor de venda(Pedido Avulso) ou altere o plano para Sob Demanda.`;
                    showToast.error(errorMsg);
                    newErrors.packageId = 'Saldo Insuficiente';
                    return false;
                }
            }
        }

        // Se não tiver pacote ativo ou for bônus, valor pode ser 0. Se não, deve ser > 0
        if (!activePackage && formData.vendaValor <= 0 && !formData.isBonus) {
            newErrors.vendaValor = 'Valor deve ser maior que zero ou marque Cortesia';
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
                showToast.success('Documento removido com sucesso!');
            } catch (error) {
                console.error('Error removing OS:', error);
                showToast.error('Falha ao remover documento.');
            }
        }
    };

    const handleDelete = async () => {
        if (!order?.id) return;

        if (window.confirm('Tem certeza que deseja excluir permanentemente este lançamento? Esta ação não pode ser desfeita.')) {
            setLoading(true);
            try {
                await orderAPI.delete(order.id);
                showToast.success('Lançamento excluído com sucesso!');
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    if (onClose) onClose();
                }, 1000);
            } catch (error) {
                console.error('Error deleting order:', error);
                showToast.error('Falha ao excluir lançamento: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
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
                cacheValor: parseFloat(formData.cacheValor) || 0,
                vendaValor: parseFloat(formData.vendaValor) || 0,
                dataFaturar: formData.dataFaturar || null,
                vencimento: formData.vencimento || null,
                date: formData.date || null // Send null/empty if not set, backend handles defaulting if creating, or ignores if updating? 
                // Correction: Backend expects date object or undefined. If created, backend logic: req.body.date ? ... : {}.
                // So sending null/empty string might be interpreted as "use provided empty value" if not careful.
                // Let's send only if truthy.
            };

            if (formData.cachePago) {
                dataToSend.cachePaymentDate = formData.cachePaymentDate || null;
                dataToSend.cacheBank = formData.cacheBank || null;
            } else {
                dataToSend.cachePaymentDate = null;
                dataToSend.cacheBank = null;
            }

            if (formData.date) {
                // Form data date is YYYY-MM-DD
                dataToSend.date = formData.date;
            }

            // Include commissions
            if (pendingCommissions.length > 0) {
                // Modal provides { userId, percent: "50" }
                // Backend requires { userId, percent: "50" } (our backend logic handles division /100)
                dataToSend.commissions = pendingCommissions;
            } else if (order?.hasCommission && pendingCommissions.length === 0) {
                // If it had commission and now empty, send empty array to clear?
                // Backend check: if (commissions && Array.isArray(commissions))
                // Sending empty array [] is truthy and is array.
                // Our backend logic: deleteMany, then createMany (empty). So it clears. Correct.
                dataToSend.commissions = [];
            }

            // Note: File upload would need to be handled separately with FormData
            // For now, we'll just save the order data
            let savedOrder = null;
            if (order) {
                savedOrder = await orderAPI.update(order.id, dataToSend);
                showToast.success('Pedido atualizado com sucesso!');
            } else {
                savedOrder = await orderAPI.create(dataToSend);
                showToast.success('Pedido cadastrado com sucesso!');
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
            showToast.error(error.message);
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
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-border">

                {/* Header */}
                <div className="flex-none flex items-center justify-between p-6 border-b border-border">
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 custom-scrollbar min-h-0" onPaste={handlePaste}>

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

                        {/* Commission Button (Admin Only) */}
                        {isAdmin && (
                            <div className="flex justify-end mb-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCommissionModal(true)}
                                    className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-medium bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20"
                                >
                                    <Users size={14} />
                                    {pendingCommissions.length > 0
                                        ? `Comissões Definidas (${pendingCommissions.length})`
                                        : 'Definir Comissões Compartilhadas'}
                                </button>
                            </div>
                        )}

                        {/* Package Info Alert */}
                        {formData.clientId && (
                            <div className="mt-4">
                                {fetchingPackage ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                                        <Loader2 size={14} className="animate-spin" />
                                        Buscando informações do pacote...
                                    </div>
                                ) : activePackage ? (
                                    <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${new Date(activePackage.endDate) < new Date() ? 'bg-red-500/10 border-red-500/30' : 'bg-primary/5 border-primary/20'} `}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${new Date(activePackage.endDate) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'} `}>
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">{activePackage.name}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    Vence em: {new Date(activePackage.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center md:text-right">
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Consumo</p>
                                                <p className="text-sm font-bold text-foreground">
                                                    {activePackage.usedAudios} / {activePackage.audioLimit || '∞'}
                                                </p>
                                            </div>

                                            {new Date(activePackage.endDate) < new Date() ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                                                    <AlertCircle size={14} />
                                                    <span className="text-[10px] font-bold uppercase">Pacote Expirado</span>
                                                </div>
                                            ) : (activePackage.audioLimit > 0 && activePackage.usedAudios >= activePackage.audioLimit) ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                                    <AlertCircle size={14} />
                                                    <span className="text-[10px] font-bold uppercase">Limite Atingido</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30">
                                                    <CheckCircle2 size={14} />
                                                    <span className="text-[10px] font-bold uppercase">Pacote Ativo</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl border border-dashed border-border bg-muted/20 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Sem pacote ativo</p>
                                            <p className="text-xs text-muted-foreground">Este cliente será cobrado de forma avulsa.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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

                        {/* Date Field */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                <Calendar size={16} />
                                Data de Competência
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-medium"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                                * Deixe em branco para usar a data de hoje.
                            </p>
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

                                {/* Supplier Selection for Locutor */}
                                {locutores.find(l => l.id === formData.locutorId)?.suppliers?.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Fornecedor (Origem do áudio)
                                        </label>
                                        <select
                                            name="supplierId"
                                            value={formData.supplierId}
                                            onChange={handleChange}
                                            required
                                            className={`w-full bg-input-background border ${errors.supplierId ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-medium`}
                                        >
                                            <option value="">Selecione o fornecedor...</option>
                                            {locutores.find(l => l.id === formData.locutorId).suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        {errors.supplierId && <p className="text-red-400 text-xs mt-1">{errors.supplierId}</p>}
                                    </div>
                                )}

                                {formData.supplierId && (
                                    <div className="animate-in fade-in slide-in-from-top-2 bg-primary/5 p-5 rounded-2xl border border-primary/20 shadow-inner">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] mb-2.5 h-4 flex items-center">
                                                    <ShoppingCart size={12} className="mr-2" /> Créditos Venda (Cliente)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="creditsConsumed"
                                                    value={formData.creditsConsumed}
                                                    onChange={handleChange}
                                                    min="1"
                                                    className="w-full bg-input-background border border-green-500/20 rounded-xl px-4 py-3 text-green-400 focus:outline-none focus:border-green-500/50 transition-all font-bold text-sm"
                                                />
                                                <p className="text-[10px] text-muted-foreground mt-2 leading-tight">Quantidade debitada do pacote do cliente</p>
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2.5 h-4 flex items-center">
                                                    <Hash size={12} className="mr-2" /> Créditos Fornecedor (Custo)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="creditsConsumedSupplier"
                                                    value={formData.creditsConsumedSupplier}
                                                    onChange={handleChange}
                                                    min="0"
                                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                                />
                                                <div className="flex justify-between items-start mt-2 gap-2">
                                                    <p className="text-[10px] text-muted-foreground leading-tight">Base para custo e saldo do locutor</p>
                                                    <div className="text-[10px] font-black text-primary/70 whitespace-nowrap text-right uppercase tracking-tighter">
                                                        Custo: R$ {parseFloat(locutores.find(l => l.id === formData.locutorId)?.suppliers?.find(s => s.id === formData.supplierId)?.packages[0]?.costPerCredit || 0).toFixed(2)}/un
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.urgency === 'NORMAL' ? 'bg-white/10 border-white/30 text-foreground' : 'bg-input-background border-border text-muted-foreground'} `}>
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
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.urgency === 'ALTA' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-input-background border-border text-muted-foreground'} `}>
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
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.urgency === 'URGENTE' ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-input-background border-border text-muted-foreground'} `}>
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
                                        className={`w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-mono ${locutores.find(l => l.id === formData.locutorId)?.valorFixoMensal > 0 && formData.cacheValor === 0 ? 'text-primary/70' : ''} `}
                                        placeholder="R$ 0,00"
                                    />
                                    {locutores.find(l => l.id === formData.locutorId)?.valorFixoMensal > 0 && formData.cacheValor === 0 && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Incluso no Mensal</span>
                                        </div>

                                    )}
                                    {locutores.find(l => l.id === formData.locutorId)?.supplier && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                                <Calculator size={10} /> Calculado (Créditos)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Valor da Venda (R$) {!activePackage && <span className="text-red-500">*</span>}
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
                                {activePackage && formData.vendaValor > 0 && (
                                    <p className="text-orange-400 text-xs mt-1 flex items-center gap-1 font-bold animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={10} />
                                        Pedido AVULSO: Não consome créditos e aparecerá em "PEDIDOS"
                                    </p>
                                )}
                                {activePackage && formData.vendaValor <= 0 && !formData.isBonus && (
                                    <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                                        <CheckCircle2 size={10} />
                                        Valor zero: Será descontado do saldo do pacote
                                    </p>
                                )}
                                {formData.isBonus && (
                                    <p className="text-cyan-400 text-xs mt-1 flex items-center gap-1 font-bold">
                                        <CheckCircle2 size={10} />
                                        PEDIDO DE CORTESIA: Não consome créditos
                                    </p>
                                )}
                            </div>

                            <div className="flex items-end pb-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            name="isBonus"
                                            checked={formData.isBonus}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <div className={`w-10 h-5 rounded-full transition-all duration-300 ${formData.isBonus ? 'bg-cyan-500' : 'bg-white/10'} `}></div>
                                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${formData.isBonus ? 'translate-x-5' : 'translate-x-0'} `}></div>
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${formData.isBonus ? 'text-cyan-400' : 'text-muted-foreground group-hover:text-white'} `}>
                                        Bonificação / Cortesia
                                    </span>
                                </label>
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
                                    <div className={`flex items-center gap-1 text-lg font-bold ${Number(calculations.margem) < 0 ? 'text-red-500' : 'text-[#03CC0B]'} `}>
                                        {Number(calculations.margem) < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                                        {displayCalc.margem}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Margem %</p>
                                    <p className={`text-lg font-bold ${Number(calculations.margemPercentual) < 0 ? 'text-red-500' : 'text-primary'} `}>
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

                    {/* Status/Financial Flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 h-full">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        name="pendenciaFinanceiro"
                                        checked={formData.pendenciaFinanceiro}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded-lg bg-input-background border-border text-orange-500 focus:ring-orange-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
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
                                        placeholder="Descreva o que falta para o faturamento..."
                                        className="w-full bg-input-background border border-border rounded-xl p-4 text-foreground text-sm focus:border-orange-500 outline-none transition-all min-h-[100px]"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 h-full">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        name="cachePago"
                                        checked={formData.cachePago}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded-lg bg-input-background border-border text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-1">
                                        <DollarSign size={16} />
                                        Cachê já pago?
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">Sinalize se o locutor já recebeu este cachê (ex: pagamento antecipado)</span>
                                </div>
                            </label>

                            {formData.cachePago && (
                                <div className="mt-4 pt-4 border-t border-emerald-500/20 grid grid-cols-1 gap-4 animate-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-600 mb-1.5 uppercase tracking-wider">
                                            Data do Pagamento
                                        </label>
                                        <input
                                            type="date"
                                            name="cachePaymentDate"
                                            value={formData.cachePaymentDate || ''}
                                            onChange={handleChange}
                                            className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-600 mb-1.5 uppercase tracking-wider">
                                            Banco de Origem
                                        </label>
                                        <input
                                            type="text"
                                            name="cacheBank"
                                            value={formData.cacheBank || ''}
                                            onChange={handleChange}
                                            placeholder="Ex: Nubank, Inter..."
                                            className="w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
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
                                        <div className={`cursor - pointer w - full flex items - center gap - 2 px - 4 py - 2.5 rounded - xl border border - dashed transition - all ${osFile ? 'bg-blue-500/10 border-blue-500/50' : 'bg-input-background border-border hover:border-blue-500/30'} `}>
                                            <Paperclip size={16} className={osFile ? 'text-blue-400' : 'text-muted-foreground'} />
                                            <span className={`text - xs truncate ${osFile ? 'text-blue-400 font-medium' : 'text-muted-foreground'} `}>
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
                                                        href={`${STORAGE_URL}${formData.arquivoOS} `}
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
                </form >

                {/* Footer Actions */}
                <div className="flex-none flex items-center justify-between p-6 border-t border-border bg-card">
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
                                    Salvar Lançamento
                                </>
                            )}
                        </button>
                    </div>
                </div >
            </div >

            <CommissionModal
                open={showCommissionModal}
                onClose={() => setShowCommissionModal(false)}
                initialCommissions={pendingCommissions}
                onSave={(data) => setPendingCommissions(data)}
            />
        </div >
    );
};

export default OrderForm;

