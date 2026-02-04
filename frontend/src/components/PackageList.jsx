import React, { useState, useEffect } from 'react';
import {
    Package,
    Search,
    Plus,
    Loader2,
    BarChart3,
    Calendar,
    CheckCircle2,
    Users,
    ShoppingCart,
    Clock,
    AlertCircle,
    LayoutGrid,
    List,
    Hash,
    Edit2,
    Save,
    X,
    Eye,
    Filter,
    FileText,
    Truck,
    Settings,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    Copy,
    Trash2
} from 'lucide-react';
import { clientPackageAPI, orderAPI } from '../services/api';
import { formatCurrency, formatDisplayDate } from '../utils/formatters';
import { showToast } from '../utils/toast';
import PackageOrderForm from './PackageOrderForm';

const PackageList = ({ onAddNewOrder }) => {
    // Tab system
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'packages'

    // Universal orders list
    const [allOrders, setAllOrders] = useState([]);
    const [loadingAllOrders, setLoadingAllOrders] = useState(true);
    const [ordersSearchTerm, setOrdersSearchTerm] = useState('');
    const [ordersDeliveryFilter, setOrdersDeliveryFilter] = useState('all'); // 'all', 'delivered', 'pending'
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' }); // 'asc' or 'desc'
    const [editingUniversalOrder, setEditingUniversalOrder] = useState(null);
    const [editingUniversalOrderPackage, setEditingUniversalOrderPackage] = useState(null);

    // Batch Selection State
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [showBulkLocutorModal, setShowBulkLocutorModal] = useState(false);

    // Packages management
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [editingCode, setEditingCode] = useState(null); // id of package being edited
    const [tempCode, setTempCode] = useState('');
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packageOrders, setPackageOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'delivered', 'pending'
    const [packageStatusFilter, setPackageStatusFilter] = useState('all'); // 'all', 'active', 'expired', 'limit'
    const [packageSortConfig, setPackageSortConfig] = useState({ key: 'clientCode', direction: 'asc' });

    // Locutores for bulk modal
    const [locutores, setLocutores] = useState([]);
    const [loadingLocutores, setLoadingLocutores] = useState(false);
    const [bulkFormData, setBulkFormData] = useState({ locutorId: '', supplierId: '' });

    const fetchAllOrders = async () => {
        setLoadingAllOrders(true);
        try {
            const response = await clientPackageAPI.getAllOrders();
            setAllOrders(response.orders || []);
        } catch (error) {
            console.error('Error fetching all package orders:', error);
            showToast.error('Falha ao carregar pedidos de pacotes.');
        } finally {
            setLoadingAllOrders(false);
        }
    };

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const data = await clientPackageAPI.listAll();
            setPackages(data || []);
        } catch (error) {
            console.error('Error fetching all packages:', error);
            showToast.error('Falha ao carregar pacotes.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocutores = async () => {
        setLoadingLocutores(true);
        try {
            const data = await locutorAPI.list();
            setLocutores(data || []);
        } catch (error) {
            console.error('Error fetching locutores:', error);
        } finally {
            setLoadingLocutores(false);
        }
    };

    useEffect(() => {
        fetchAllOrders();
        fetchPackages();
        fetchLocutores();
    }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-2 text-muted-foreground/30" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="ml-2 text-primary" />
            : <ArrowDown size={14} className="ml-2 text-primary" />;
    };

    const handleSaveCode = async (pkgId) => {
        try {
            await clientPackageAPI.update(pkgId, { clientCode: tempCode });
            setPackages(packages.map(p => p.id === pkgId ? { ...p, clientCode: tempCode } : p));
            setEditingCode(null);
            showToast.success('Código do cliente atualizado!');
        } catch (error) {
            console.error('Error saving client code:', error);
            showToast.error(error);
        }
    };

    const handleViewOrders = async (pkg) => {
        setSelectedPackage(pkg);
        setLoadingOrders(true);
        try {
            const response = await clientPackageAPI.getOrders(pkg.id);
            setPackageOrders(response.orders || []);
        } catch (error) {
            showToast.error('Erro ao carregar pedidos do pacote.');
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedPackage(null);
        setPackageOrders([]);
        setOrderFilter('all');
    };

    const isExpired = (pkg) => {
        if (!pkg.endDate) return false;
        const end = new Date(pkg.endDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Consider only date part
        return now > end;
    };

    const isLimitReached = (pkg) => {
        return pkg.audioLimit > 0 && pkg.usedAudios >= pkg.audioLimit;
    };

    const getUsageColor = (pkg) => {
        if (pkg.audioLimit === 0) return 'text-primary';
        const percent = (pkg.usedAudios / pkg.audioLimit) * 100;
        if (percent >= 90) return 'text-red-500';
        if (percent >= 70) return 'text-orange-500';
        return 'text-emerald-500';
    };

    const getUsagePercent = (pkg) => {
        if (pkg.audioLimit === 0) return 0;
        return Math.min(100, (pkg.usedAudios / pkg.audioLimit) * 100);
    };

    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.clientCode?.toLowerCase().includes(searchTerm.toLowerCase());

        const expired = isExpired(pkg);
        const limit = isLimitReached(pkg);

        if (packageStatusFilter === 'active') return matchesSearch && !expired && !limit && pkg.active;
        if (packageStatusFilter === 'expired') return matchesSearch && expired;
        if (packageStatusFilter === 'limit') return matchesSearch && limit;

        return matchesSearch;
    }).sort((a, b) => {
        if (!packageSortConfig.key) return 0;

        let valA, valB;
        switch (packageSortConfig.key) {
            case 'clientCode':
                valA = a.clientCode || '';
                valB = b.clientCode || '';
                break;
            case 'name':
                valA = a.name || '';
                valB = b.name || '';
                break;
            case 'client':
                valA = a.client?.name || '';
                valB = b.client?.name || '';
                break;
            case 'consumption':
                valA = getUsagePercent(a);
                valB = getUsagePercent(b);
                break;
            case 'expiry':
                valA = new Date(a.endDate).getTime();
                valB = new Date(b.endDate).getTime();
                break;
            default:
                return 0;
        }

        if (valA < valB) return packageSortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return packageSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handlePackageSort = (key) => {
        let direction = 'asc';
        if (packageSortConfig.key === key && packageSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setPackageSortConfig({ key, direction });
    };

    const getPackageSortIcon = (columnKey) => {
        if (packageSortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-20" />;
        return packageSortConfig.direction === 'asc'
            ? <ArrowUp size={12} className="ml-1 text-primary" />
            : <ArrowDown size={12} className="ml-1 text-primary" />;
    };


    // Universal Actions for Order Management
    const handleToggleDelivery = async (e, order) => {
        e.stopPropagation();
        try {
            const newStatus = !order.entrega;
            // The backend expects 'entregue' field (database column name)
            const updatePayload = { entregue: newStatus };
            if (newStatus && order.status !== 'ENTREGUE') updatePayload.status = 'ENTREGUE';
            if (!newStatus && order.status === 'ENTREGUE') updatePayload.status = 'VENDA';

            await orderAPI.update(order.id, updatePayload);
            showToast.success(`Pedido marcado como ${newStatus ? 'Entregue' : 'Pendente'}`);

            // Refresh both lists
            fetchAllOrders(); // Refresh universal table

            // If viewing a specific package's orders, refresh that too
            if (selectedPackage) {
                handleViewOrders(selectedPackage);
            }
        } catch (error) {
            console.error(error);
            showToast.error('Erro ao atualizar entrega');
        }
    };

    const handleDeleteUniversal = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este pedido de pacote?')) return;
        try {
            await orderAPI.delete(id);
            showToast.success('Pedido excluído');
            fetchAllOrders();
            fetchPackages();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showToast.error('Erro ao excluir pedido');
        }
    };

    const handleDuplicateUniversal = async (order) => {
        if (!window.confirm(`Confirma a duplicação deste pedido de pacote?\n\nO novo arquivo será gerado automaticamente seguindo a sequência.`)) return;

        try {
            // Find up-to-date package info from local state to ensure correct audio count
            const pkg = packages.find(p => p.id === (order.packageId || order.package?.id)) || order.package;

            if (!pkg) {
                showToast.error('Erro: Pacote não encontrado para recálculo.');
                return;
            }

            const startNumber = (pkg.usedAudios || 0) + 1;
            const credits = order.creditsConsumed || 1;
            const limit = pkg.audioLimit || 0;

            // Generate Numbering
            let numbering = '';
            if (credits === 1) {
                numbering = String(startNumber).padStart(2, '0');
            } else {
                const sequence = [];
                for (let i = 0; i < credits; i++) {
                    sequence.push(String(startNumber + i).padStart(2, '0'));
                }
                numbering = sequence.join(', ');
            }

            const codePart = pkg.clientCode ? `${pkg.clientCode} ` : '';
            const limitPart = limit > 0 ? ` de ${limit}` : '';
            const creditPart = `${numbering}${limitPart} `;

            // Extract detail part from original or reconstruct
            // Reconstructing is safer to ensure standard format
            const detailPart = `(${order.title || 'S_TITULO'}_${order.locutor || 'S_LOC'})`;

            const newFileName = `${codePart}${creditPart}${detailPart}`.trim();

            const newOrderData = {
                packageId: pkg.id,
                clientId: pkg.clientId,
                title: order.title,
                fileName: newFileName,
                locutorId: order.locutorId,
                locutor: order.locutor,
                tipo: order.tipo || 'OFF',
                creditsConsumed: credits,
                clientCode: pkg.clientCode || '',
                cacheValor: parseFloat(order.cacheValor || 0),
                supplierId: order.supplierId,
                status: 'VENDA',
                date: new Date().toISOString().split('T')[0],
                serviceType: 'PACOTE DE AUDIOS',
                vendaValor: 0,
                comentarios: order.comentarios // Preserve comments
            };

            await orderAPI.create(newOrderData);
            showToast.success(`Pedido duplicado: ${newFileName}`);

            // Refresh
            fetchAllOrders();
            fetchPackages();
            if (selectedPackage) {
                // If inside modal, refresh that too
                // We need to fetch updated package data to refresh the modal header usage counts?
                // handleViewOrders fetches orders, but maybe we should re-fetch package to update 'usedAudios' in UI
                // We can't easily re-fetch just one package into selectedPackage state without a new API call or finding it in refreshed packages
                // Simplified: Refresh orders list
                const res = await clientPackageAPI.getOrders(pkg.id);
                setPackageOrders(res.orders || []);
            }

        } catch (error) {
            console.error('Erro na duplicação:', error);
            showToast.error('Falha ao duplicar pedido.');
        }
    };

    const handleEditUniversal = async (order) => {
        // We need the Full Package Object for the Form
        // We rely on backend returning package info in /all/orders
        if (!order.package) {
            showToast.error('Erro: Informações do pacote não disponíveis');
            return;
        }

        try {
            // Fetch fresh full order details to ensure we have locutorId and all fields
            const fullOrder = await orderAPI.get(order.id);
            setEditingUniversalOrderPackage(order.package);

            // Merge package info into fullOrder if missing (API usually returns flat or nested?)
            // orderAPI.get returns the order object. It might have package nested.
            // But we already have package from the list item.
            setEditingUniversalOrder(fullOrder);
        } catch (error) {
            console.error('Error fetching order details:', error);
            showToast.error('Erro ao carregar detalhes do pedido');
        }
    };

    const handleCloseUniversalEdit = () => {
        setEditingUniversalOrder(null);
        setEditingUniversalOrderPackage(null);
        // setIsDuplicateMode(false);
    };

    const handleSuccessUniversalEdit = () => {
        fetchAllOrders();
    };

    // Batch Actions logic
    const handleSelectOrder = (id) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (filteredOrders) => {
        if (selectedOrderIds.length > 0) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(filteredOrders.map(o => o.id));
        }
    };

    const handleBulkDelivery = async () => {
        if (!window.confirm(`Deseja marcar ${selectedOrderIds.length} pedidos como ENTREGUES?`)) return;
        setBulkActionLoading(true);
        try {
            await orderAPI.bulkUpdate(selectedOrderIds, { entregue: true, status: 'ENTREGUE' });
            showToast.success('Pedidos atualizados em lote!');
            setSelectedOrderIds([]);
            fetchAllOrders();
        } catch (error) {
            showToast.error('Erro ao atualizar pedidos em lote');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Tem certeza que deseja EXCLUIR ${selectedOrderIds.length} pedidos? Esta ação não pode ser desfeita.`)) return;
        setBulkActionLoading(true);
        try {
            await orderAPI.bulkDelete(selectedOrderIds);
            showToast.success('Pedidos excluídos em lote!');
            setSelectedOrderIds([]);
            fetchAllOrders();
            fetchPackages();
        } catch (error) {
            showToast.error('Erro ao excluir pedidos em lote');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const handleBulkUpdateLocutor = async (e) => {
        e.preventDefault();
        if (!bulkFormData.locutorId) {
            showToast.error('Selecione um locutor');
            return;
        }

        const selectedLocutor = locutores.find(l => String(l.id) === String(bulkFormData.locutorId));
        if (!selectedLocutor) return;

        setBulkActionLoading(true);
        try {
            await orderAPI.bulkUpdate(selectedOrderIds, {
                locutorId: bulkFormData.locutorId,
                locutor: selectedLocutor.name,
                supplierId: bulkFormData.supplierId || null
            });
            showToast.success('Locutor/Fornecedor atualizado em lote!');
            setShowBulkLocutorModal(false);
            setBulkFormData({ locutorId: '', supplierId: '' });
            setSelectedOrderIds([]);
            fetchAllOrders();
        } catch (error) {
            showToast.error('Erro ao atualizar em lote');
        } finally {
            setBulkActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Batch Actions Toolbar */}
            {selectedOrderIds.length > 0 && activeTab === 'orders' && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-[#1a1a1a]/95 border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-6 backdrop-blur-xl ring-1 ring-white/5">
                        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[12px] font-bold text-white shadow-lg shadow-primary/20">
                                {selectedOrderIds.length}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Selecionados</span>
                                <span className="text-xs font-bold text-white leading-tight">Pedidos de Pacote</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowBulkLocutorModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all border border-white/5 hover:border-white/10 active:scale-95"
                            >
                                <Users size={14} className="text-primary" />
                                Alterar Voz
                            </button>

                            <button
                                onClick={handleBulkDelivery}
                                disabled={bulkActionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 transition-all border border-emerald-500/20 hover:border-emerald-500/40 active:scale-95 disabled:opacity-50"
                            >
                                <CheckCircle2 size={14} />
                                Entregar Selecionados
                            </button>

                            <button
                                onClick={handleBulkDelete}
                                disabled={bulkActionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-all border border-red-500/20 hover:border-red-500/40 active:scale-95 disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                                Excluir
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedOrderIds([])}
                            className="ml-4 p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-all"
                            title="Limpar seleção"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Package className="text-primary" size={24} />
                        Gestão de Pacotes
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {activeTab === 'orders' ? 'Lista universal de pedidos de pacotes' : 'Visualize e gerencie pacotes ativos'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-input-background rounded-xl p-1 border border-border mb-6 w-fit">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'orders'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <ShoppingCart size={18} />
                    Pedidos
                </button>
                <button
                    onClick={() => setActiveTab('packages')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'packages'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <Settings size={18} />
                    Gestão de Pacotes
                </button>
            </div>

            {/* Orders Tab Content */}
            {activeTab === 'orders' && (
                <>
                    {/* Filters for Orders */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-2xl">
                            <div className="bg-input-background border border-border rounded-xl flex items-center px-3 py-2 flex-1 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                                <Search size={16} className="text-muted-foreground mr-3" />
                                <input
                                    type="text"
                                    placeholder="Buscar por título, cliente, pacote, locutor..."
                                    value={ordersSearchTerm}
                                    onChange={(e) => setOrdersSearchTerm(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground w-full"
                                />
                            </div>
                        </div>

                        <div className="flex bg-input-background rounded-xl p-1 border border-border">
                            <button
                                onClick={() => setOrdersDeliveryFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ordersDeliveryFilter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setOrdersDeliveryFilter('delivered')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ordersDeliveryFilter === 'delivered' ? 'bg-green-500/20 text-green-400' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Entregues
                            </button>
                            <button
                                onClick={() => setOrdersDeliveryFilter('pending')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ordersDeliveryFilter === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Pendentes
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Packages Tab - Stats Summary (REMOVED) & Unified Toolbar */}
            {activeTab === 'packages' && (
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    {/* Search */}
                    <div className="card-glass-dark p-3 rounded-2xl border border-white/5 bg-card flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por cliente, nome do pacote ou código..."
                                className="w-full bg-input-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground text-xs"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 h-fit shrink-0">
                        <select
                            value={packageStatusFilter}
                            onChange={(e) => setPackageStatusFilter(e.target.value)}
                            className="bg-transparent text-xs font-bold text-white px-3 py-2 outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-card">Todos Status</option>
                            <option value="active" className="bg-card">Apenas Ativos</option>
                            <option value="expired" className="bg-card">Apenas Vencidos</option>
                            <option value="limit" className="bg-card">Apenas Esgotados</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 h-fit shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                            title="Visualização em Grade"
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                            title="Visualização em Lista"
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Orders Tab - Universal List */}
            {activeTab === 'orders' && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-auto custom-scrollbar pb-4">
                        {loadingAllOrders ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 size={32} className="text-primary animate-spin mb-4" />
                                <p className="text-muted-foreground text-sm">Carregando pedidos...</p>
                            </div>
                        ) : allOrders.filter(order => {
                            const matchesSearch = !ordersSearchTerm ||
                                order.title?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                order.client?.name?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                order.package?.name?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                order.locutor?.toLowerCase().includes(ordersSearchTerm.toLowerCase());

                            const matchesDelivery = ordersDeliveryFilter === 'all' ||
                                (ordersDeliveryFilter === 'delivered' && order.entrega) ||
                                (ordersDeliveryFilter === 'pending' && !order.entrega);

                            return matchesSearch && matchesDelivery;
                        }).length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-50">
                                <FileText size={48} className="mb-4 text-muted-foreground" />
                                <p className="text-lg font-medium text-foreground">Nenhum pedido encontrado</p>
                                <p className="text-sm text-muted-foreground">
                                    {ordersSearchTerm ? 'Tente ajustar sua busca' : 'Ainda não há pedidos de pacotes lançados'}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-white/10 bg-white/5 accent-primary cursor-pointer"
                                                    checked={allOrders.length > 0 && selectedOrderIds.length === allOrders.filter(o => {
                                                        const matchesSearch = !ordersSearchTerm ||
                                                            o.title?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                            o.client?.name?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                            o.package?.name?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                            o.locutor?.toLowerCase().includes(ordersSearchTerm.toLowerCase());
                                                        const matchesDelivery = ordersDeliveryFilter === 'all' ||
                                                            (ordersDeliveryFilter === 'delivered' && o.entrega) ||
                                                            (ordersDeliveryFilter === 'pending' && !o.entrega);
                                                        return matchesSearch && matchesDelivery;
                                                    }).length}
                                                    onChange={() => {
                                                        const filtered = allOrders.filter(o => {
                                                            const matchesSearch = !ordersSearchTerm ||
                                                                o.title?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                                o.client?.name?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                                o.package?.name?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                                o.locutor?.toLowerCase().includes(ordersSearchTerm.toLowerCase());
                                                            const matchesDelivery = ordersDeliveryFilter === 'all' ||
                                                                (ordersDeliveryFilter === 'delivered' && o.entrega) ||
                                                                (ordersDeliveryFilter === 'pending' && !o.entrega);
                                                            return matchesSearch && matchesDelivery;
                                                        });
                                                        handleSelectAll(filtered);
                                                    }}
                                                />
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('id')}>
                                                <div className="flex items-center">ID {getSortIcon('id')}</div>
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('date')}>
                                                <div className="flex items-center">Data {getSortIcon('date')}</div>
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('client')}>
                                                <div className="flex items-center">Cliente {getSortIcon('client')}</div>
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('fileName')}>
                                                <div className="flex items-center">Nome do Arquivo {getSortIcon('fileName')}</div>
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('locutor')}>
                                                <div className="flex items-center">Locutor {getSortIcon('locutor')}</div>
                                            </th>
                                            <th className="px-4 py-3 text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('credits')}>
                                                <div className="flex items-center justify-center">Créditos {getSortIcon('credits')}</div>
                                            </th>
                                            <th className="px-4 py-3 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {allOrders
                                            .filter(order => {
                                                const matchesSearch = !ordersSearchTerm ||
                                                    order.title?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                    order.client?.name?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                    order.package?.name?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                    order.consumptionId?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
                                                    order.locutor?.toLowerCase().includes(ordersSearchTerm.toLowerCase());

                                                const matchesDelivery = ordersDeliveryFilter === 'all' ||
                                                    (ordersDeliveryFilter === 'delivered' && order.entrega) ||
                                                    (ordersDeliveryFilter === 'pending' && !order.entrega);

                                                return matchesSearch && matchesDelivery;
                                            })
                                            .sort((a, b) => {
                                                if (!sortConfig.key) return 0;

                                                let valA, valB;

                                                switch (sortConfig.key) {
                                                    case 'id':
                                                        valA = a.consumptionId || a.numeroVenda || a.sequentialId;
                                                        valB = b.consumptionId || b.numeroVenda || b.sequentialId;
                                                        break;
                                                    case 'date':
                                                        valA = new Date(a.date).getTime();
                                                        valB = new Date(b.date).getTime();
                                                        break;
                                                    case 'client':
                                                        valA = a.client?.name || '';
                                                        valB = b.client?.name || '';
                                                        break;
                                                    case 'package':
                                                        valA = a.package?.name || '';
                                                        valB = b.package?.name || '';
                                                        break;
                                                    case 'fileName':
                                                        valA = a.fileName || a.title || '';
                                                        valB = b.fileName || b.title || '';
                                                        break;
                                                    case 'title':
                                                        valA = a.title || '';
                                                        valB = b.title || '';
                                                        break;
                                                    case 'locutor':
                                                        valA = a.locutor || '';
                                                        valB = b.locutor || '';
                                                        break;
                                                    case 'credits':
                                                        valA = a.creditsConsumed || 0;
                                                        valB = b.creditsConsumed || 0;
                                                        break;
                                                    case 'status':
                                                        valA = a.status || '';
                                                        valB = b.status || '';
                                                        break;
                                                    case 'delivery':
                                                        valA = a.entrega ? 1 : 0;
                                                        valB = b.entrega ? 1 : 0;
                                                        break;
                                                    default:
                                                        return 0;
                                                }

                                                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                                                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                                                return 0;
                                            })
                                            .map((order) => (
                                                <tr key={order.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-primary/5' : ''}`}>
                                                    <td className="px-4 py-3 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOrderIds.includes(order.id)}
                                                            onChange={() => handleSelectOrder(order.id)}
                                                            className="w-4 h-4 rounded border-white/10 bg-white/5 accent-primary cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs text-primary">
                                                            {order.consumptionId ? order.consumptionId : `#${order.numeroVenda || order.sequentialId}`}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        {formatDisplayDate(order.date)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-foreground">
                                                        {order.client?.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="max-w-xs" title={order.package ? `Pacote: ${order.package.name}${order.package.clientCode ? ` (#${order.package.clientCode})` : ''}` : 'Sem pacote'}>
                                                            <p className="text-foreground font-medium truncate text-xs font-mono">{order.fileName || order.title}</p>
                                                            {order.title && order.fileName && order.title !== order.fileName && (
                                                                <p className="text-[10px] text-muted-foreground truncate">{order.title}</p>
                                                            )}
                                                            {order.comentarios && (
                                                                <p className="text-[10px] text-muted-foreground truncate">{order.comentarios}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-foreground">{order.locutor || '-'}</span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Cachê: {formatCurrency(Number(order.cacheValor))}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                                                            {order.creditsConsumed || 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={(e) => handleToggleDelivery(e, order)}
                                                                className={`p-2 rounded-lg transition-all ${order.entrega ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                                                                title={order.entrega ? 'Reverter para Pedido' : 'Confirmar Entrega'}
                                                            >
                                                                {order.entrega ? <RotateCcw size={16} /> : <CheckCircle2 size={16} />}
                                                            </button>
                                                            {order.entrega && (
                                                                <div className="flex items-center gap-1 text-green-400" title="Já entregue">
                                                                    <Truck size={14} />
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => handleDuplicateUniversal(order)}
                                                                className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all"
                                                                title="Duplicar Pedido"
                                                            >
                                                                <Copy size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditUniversal(order)}
                                                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                                                                title="Editar Pedido"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUniversal(order.id)}
                                                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                                                                title="Excluir Pedido"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Packages Tab - Content */}
            {activeTab === 'packages' && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-auto custom-scrollbar pb-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 size={32} className="text-primary animate-spin mb-4" />
                                <p className="text-muted-foreground text-sm">Carregando pacotes ativos...</p>
                            </div>
                        ) : filteredPackages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-50">
                                <Package size={48} className="mb-4" />
                                <p className="text-lg font-medium text-white">Nenhum pacote encontrado</p>
                                <p className="text-sm text-muted-foreground">Tente ajustar sua busca ou cadastrar novos pacotes em Clientes</p>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPackages.map((pkg) => (
                                    <div key={pkg.id} className={`card-dark p-5 group flex flex-col border ${isExpired(pkg) ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/5'} hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-widest">{pkg.type}</span>
                                                    {isExpired(pkg) && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white uppercase tracking-widest animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">VENCIDO</span>
                                                    )}
                                                    {isLimitReached(pkg) && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-orange-600 text-white uppercase tracking-widest">LIMITADO</span>
                                                    )}
                                                    {pkg.usedAudios > pkg.audioLimit && pkg.audioLimit > 0 && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-black uppercase tracking-widest animate-pulse">EM COTA EXTRA</span>
                                                    )}
                                                </div>
                                                <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{pkg.name}</h3>
                                                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Users size={12} className="opacity-50" />
                                                    {pkg.client?.name}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                                                <Package size={20} />
                                            </div>
                                        </div>

                                        {/* Client Code UI */}
                                        <div className="mb-4 px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group/code">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Hash size={12} className="text-primary/50 shrink-0" />
                                                {editingCode === pkg.id ? (
                                                    <input
                                                        autoFocus
                                                        value={tempCode}
                                                        onChange={(e) => setTempCode(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveCode(pkg.id);
                                                            if (e.key === 'Escape') setEditingCode(null);
                                                        }}
                                                        className="bg-transparent border-none outline-none text-[11px] text-white w-full placeholder:text-white/20"
                                                        placeholder="Cód. Cliente"
                                                    />
                                                ) : (
                                                    <span className={`text-[11px] font-mono truncate ${pkg.clientCode ? 'text-white' : 'text-white/30 italic'}`}>
                                                        {pkg.clientCode || 'Sem código'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {editingCode === pkg.id ? (
                                                    <>
                                                        <button onClick={() => handleSaveCode(pkg.id)} className="p-1 hover:text-emerald-400 text-emerald-400/50"><Save size={14} /></button>
                                                        <button onClick={() => setEditingCode(null)} className="p-1 hover:text-red-400 text-red-400/50"><X size={14} /></button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingCode(pkg.id);
                                                            setTempCode(pkg.clientCode || '');
                                                        }}
                                                        className="p-1 opacity-0 group-hover/code:opacity-100 hover:text-primary text-muted-foreground transition-all"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6 flex-1">
                                            <div>
                                                <div className="flex justify-between items-end mb-1.5">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Consumo de Áudios</span>
                                                    <span className={`text-xs font-black ${getUsageColor(pkg)}`}>
                                                        {pkg.usedAudios} {pkg.audioLimit > 0 ? `/ ${pkg.audioLimit}` : '(Ilimitado)'}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getUsagePercent(pkg) >= 90 || isExpired(pkg) ? 'from-red-500 to-orange-500' : 'from-primary to-emerald-500'}`}
                                                        style={{ width: `${pkg.audioLimit > 0 ? getUsagePercent(pkg) : 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground uppercase block mb-0.5">Taxa Fixa</span>
                                                    <span className="text-sm font-bold text-white">{formatCurrency(Number(pkg.fixedFee))}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground uppercase block mb-0.5">Áudio Extra</span>
                                                    <span className="text-sm font-bold text-white">{formatCurrency(Number(pkg.extraAudioFee))}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-[10px]">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Calendar size={12} className="text-primary" />
                                                    {formatDisplayDate(pkg.startDate)}
                                                </div>
                                                <div className={`flex items-center gap-1.5 ${isExpired(pkg) ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                                    <Clock size={12} className={isExpired(pkg) ? 'text-red-500' : 'text-primary'} />
                                                    {isExpired(pkg) ? 'Expirou em' : 'Até'} {formatDisplayDate(pkg.endDate)}
                                                    {isExpired(pkg) && <AlertCircle size={12} className="animate-bounce" />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex gap-2">
                                            <button
                                                onClick={() => handleViewOrders(pkg)}
                                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Eye size={14} />
                                                VER PEDIDOS
                                            </button>
                                            <button
                                                onClick={() => onAddNewOrder(pkg)}
                                                className="flex-1 btn-primary py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                            >
                                                <Plus size={14} />
                                                NOVO PEDIDO
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* List View */
                            <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handlePackageSort('clientCode')}>
                                                <div className="flex items-center">Cód. Cliente {getPackageSortIcon('clientCode')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handlePackageSort('client')}>
                                                <div className="flex items-center">Cliente / Pacote {getPackageSortIcon('client')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => handlePackageSort('consumption')}>
                                                <div className="flex items-center justify-center">Consumo {getPackageSortIcon('consumption')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handlePackageSort('expiry')}>
                                                <div className="flex items-center">Status / Validade {getPackageSortIcon('expiry')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredPackages.map(pkg => (
                                            <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 group/code-list">
                                                        {editingCode === pkg.id ? (
                                                            <input
                                                                autoFocus
                                                                value={tempCode}
                                                                onChange={(e) => setTempCode(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveCode(pkg.id);
                                                                    if (e.key === 'Escape') setEditingCode(null);
                                                                }}
                                                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white w-24 outline-none focus:border-primary/50"
                                                                placeholder="Código"
                                                            />
                                                        ) : (
                                                            <span className={`text-[11px] font-mono ${pkg.clientCode ? 'text-white' : 'text-white/30 italic'}`}>
                                                                {pkg.clientCode || 'Sem código'}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                if (editingCode === pkg.id) handleSaveCode(pkg.id);
                                                                else {
                                                                    setEditingCode(pkg.id);
                                                                    setTempCode(pkg.clientCode || '');
                                                                }
                                                            }}
                                                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-primary transition-all rounded hover:bg-white/5"
                                                        >
                                                            {editingCode === pkg.id ? <Save size={12} /> : <Edit2 size={12} />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{pkg.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                                            <Users size={10} /> {pkg.client?.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                                                        <div className="flex justify-between w-full text-[9px] font-black uppercase tracking-tighter">
                                                            <span className={getUsageColor(pkg)}>
                                                                {pkg.usedAudios} {pkg.audioLimit > 0 ? `/ ${pkg.audioLimit}` : '(Unlimited)'}
                                                            </span>
                                                            <span className="text-muted-foreground">{Math.round(getUsagePercent(pkg))}%</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getUsagePercent(pkg) >= 90 ? 'from-red-500 to-orange-500' : 'from-primary to-emerald-500'}`}
                                                                style={{ width: `${pkg.audioLimit > 0 ? getUsagePercent(pkg) : 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className={`flex items-center gap-1.5 text-[10px] ${isExpired(pkg) ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                                            {isExpired(pkg) ? <AlertCircle size={10} className="text-red-500" /> : <Calendar size={10} className="text-primary" />}
                                                            {isExpired(pkg) ? 'Expirado em' : 'Expira em'} {formatDisplayDate(pkg.endDate)}
                                                        </div>
                                                        <span className={`text-[9px] font-black mt-1 uppercase ${!pkg.active || isExpired(pkg) ? 'text-red-400' : 'text-emerald-400'}`}>
                                                            {!pkg.active ? 'PACOTE INATIVO' : isExpired(pkg) ? 'VALIDADE VENCIDA' : (pkg.usedAudios > pkg.audioLimit && pkg.audioLimit > 0) ? 'EM COTA EXTRA' : 'PACOTE ATIVO'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleViewOrders(pkg)}
                                                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white rounded-xl transition-all"
                                                            title="Ver Pedidos do Pacote"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => onAddNewOrder(pkg)}
                                                            className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                            title="Novo Pedido de Pacote"
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Universal Edit Modal */}
            {editingUniversalOrder && editingUniversalOrderPackage && (
                <PackageOrderForm
                    pkg={editingUniversalOrderPackage}
                    orderToEdit={editingUniversalOrder}
                    // isDuplicate={isDuplicateMode} // Removed
                    onClose={handleCloseUniversalEdit}
                    onSuccess={handleSuccessUniversalEdit}
                />
            )}

            {/* Modal de Pedidos (View Orders for a Package) */}
            {selectedPackage && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <ShoppingCart className="text-primary" size={24} />
                                    Pedidos do Pacote
                                </h2>
                                <div className="mt-2 flex items-center gap-4 text-sm">
                                    <span className="text-muted-foreground">
                                        <strong className="text-foreground">{selectedPackage.name}</strong> - {selectedPackage.client?.name}
                                    </span>
                                    <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-bold">
                                        {selectedPackage.usedAudios} / {selectedPackage.audioLimit > 0 ? selectedPackage.audioLimit : '∞'} créditos
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all text-muted-foreground hover:text-foreground"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="p-4 border-b border-border bg-white/5">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-muted-foreground" />
                                <div className="flex bg-input-background rounded-xl p-1 border border-border">
                                    <button
                                        onClick={() => setOrderFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orderFilter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Todos ({packageOrders.length})
                                    </button>
                                    <button
                                        onClick={() => setOrderFilter('delivered')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orderFilter === 'delivered' ? 'bg-green-500/20 text-green-400' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Entregues ({packageOrders.filter(o => o.entrega).length})
                                    </button>
                                    <button
                                        onClick={() => setOrderFilter('pending')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orderFilter === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Pendentes ({packageOrders.filter(o => !o.entrega).length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto custom-scrollbar p-6">
                            {loadingOrders ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <Loader2 size={32} className="text-primary animate-spin mb-4" />
                                    <p className="text-muted-foreground text-sm">Carregando pedidos...</p>
                                </div>
                            ) : packageOrders.filter(order =>
                                orderFilter === 'all' ||
                                (orderFilter === 'delivered' && order.entrega) ||
                                (orderFilter === 'pending' && !order.entrega)
                            ).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-50">
                                    <FileText size={48} className="mb-4 text-muted-foreground" />
                                    <p className="text-lg font-medium text-foreground">Nenhum pedido encontrado</p>
                                    <p className="text-sm text-muted-foreground">
                                        {orderFilter === 'all' ? 'Este pacote ainda não possui pedidos vinculados' : `Nenhum pedido ${orderFilter === 'delivered' ? 'entregue' : 'pendente'}`}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5">
                                            <tr>
                                                <th className="px-4 py-3">ID</th>
                                                <th className="px-4 py-3">Data</th>
                                                <th className="px-4 py-3">Áudio / Arquivo</th>
                                                <th className="px-4 py-3">Locutor</th>
                                                <th className="px-4 py-3 text-center">Créditos</th>
                                                <th className="px-4 py-3 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {packageOrders
                                                .filter(order =>
                                                    orderFilter === 'all' ||
                                                    (orderFilter === 'delivered' && order.entrega) ||
                                                    (orderFilter === 'pending' && !order.entrega)
                                                )
                                                .map((order) => (
                                                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-xs text-primary">
                                                                {order.consumptionId ? order.consumptionId : `#${order.numeroVenda || order.sequentialId}`}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                                            {formatDisplayDate(order.date)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="max-w-xs" title={order.packageName ? `Pacote: ${order.packageName}` : 'Sem pacote'}>
                                                                <p className="text-foreground font-medium truncate text-xs font-mono">{order.fileName || order.title}</p>
                                                                {order.title && order.fileName && order.title !== order.fileName && (
                                                                    <p className="text-[10px] text-muted-foreground truncate">{order.title}</p>
                                                                )}
                                                                {order.comentarios && (
                                                                    <p className="text-[10px] text-muted-foreground truncate">{order.comentarios}</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-foreground">{order.locutor || '-'}</span>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    Cachê: {formatCurrency(Number(order.cacheValor))}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                                                                {order.creditsConsumed || 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={(e) => handleToggleDelivery(e, order)}
                                                                    className={`p-2 rounded-lg transition-all ${order.entrega ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                                                                    title={order.entrega ? 'Reverter para Pedido' : 'Confirmar Entrega'}
                                                                >
                                                                    {order.entrega ? <RotateCcw size={16} /> : <CheckCircle2 size={16} />}
                                                                </button>
                                                                {order.entrega && (
                                                                    <div className="flex items-center gap-1 text-green-400" title="Já entregue">
                                                                        <Truck size={14} />
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDuplicateUniversal(order)}
                                                                    className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all"
                                                                    title="Duplicar Pedido"
                                                                >
                                                                    <Copy size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditUniversal(order)}
                                                                    className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                                                                    title="Editar Pedido"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUniversal(order.id)}
                                                                    className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                                                                    title="Excluir Pedido"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border bg-white/5 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Total de pedidos: <strong className="text-foreground">{packageOrders.length}</strong>
                            </p>
                            <button
                                onClick={handleCloseModal}
                                className="btn-secondary px-6 py-2"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Bulk Locutor Modal */}
            {showBulkLocutorModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in fade-in duration-300">
                    <div className="card-glass-dark w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Alterar Voz em Lote</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{selectedOrderIds.length} pedidos selecionados</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBulkLocutorModal(false)} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleBulkUpdateLocutor} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-2">Selecione o Novo Locutor</label>
                                <select
                                    required
                                    value={bulkFormData.locutorId}
                                    onChange={(e) => {
                                        const locId = e.target.value;
                                        const loc = locutores.find(l => String(l.id) === String(locId));
                                        let supId = '';
                                        if (loc?.suppliers?.length === 1) supId = loc.suppliers[0].id;
                                        setBulkFormData({ locutorId: locId, supplierId: supId });
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                                >
                                    <option value="" className="bg-[#1a1a1a]">Selecione...</option>
                                    {locutores.map(l => (
                                        <option key={l.id} value={l.id} className="bg-[#1a1a1a]">{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            {bulkFormData.locutorId && locutores.find(l => String(l.id) === String(bulkFormData.locutorId))?.suppliers?.length > 1 && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-2">Selecione o Fornecedor</label>
                                    <select
                                        required
                                        value={bulkFormData.supplierId}
                                        onChange={(e) => setBulkFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
                                    >
                                        <option value="" className="bg-[#1a1a1a]">Selecione...</option>
                                        {locutores.find(l => String(l.id) === String(bulkFormData.locutorId)).suppliers.map(s => (
                                            <option key={s.id} value={s.id} className="bg-[#1a1a1a]">{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkLocutorModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all border border-white/5"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkActionLoading || !bulkFormData.locutorId}
                                    className="flex-[2] btn-primary px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {bulkActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    <span className="font-black tracking-tighter">ATUALIZAR TUDO</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackageList;
