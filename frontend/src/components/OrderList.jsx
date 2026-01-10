import React, { useState, useEffect, useCallback } from 'react';
import {
    ShoppingCart,
    Search,
    Trash2,
    Edit,
    Filter,
    Plus,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Mic2,
    Calendar,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,
    ArrowUpRight,
    RotateCcw,
    ArrowUpDown,
    Copy
} from 'lucide-react';
import { orderAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const OrderList = ({ onEditOrder, onAddNewOrder, onNavigate }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        type: '',
        status: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [sortConfig, setSortConfig] = useState({
        key: 'date',
        order: 'desc'
    });

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await orderAPI.list({
                page: pagination.page,
                limit: pagination.limit,
                search,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.order,
                ...filters
            });
            setOrders(response.orders || []);
            setPagination(prev => ({
                ...prev,
                total: response.pagination.total,
                totalPages: response.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, filters, sortConfig]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchOrders();
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await orderAPI.delete(id);
            setDeleteConfirm(null);
            fetchOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
        } finally {
            setDeleting(false);
        }
    };



    const getStatusLabel = (order) => {
        if (order.status === 'VENDA') return 'VENDA';
        if (order.entregue) return 'ENTREGUE';
        return 'PEDIDO';
    };

    const handleConvert = async (id) => {
        if (!window.confirm('Deseja converter este Pedido em Venda? Esta ação marcará o trabalho como concluído.')) return;
        try {
            await orderAPI.convert(id);
            fetchOrders();
            if (onNavigate) {
                onNavigate('faturamento');
            }
        } catch (error) {
            console.error('Error converting order:', error);
            alert('Erro ao converter pedido: ' + error.message);
        }
    };

    const handleRevert = async (id) => {
        if (!window.confirm('Deseja reverter esta Venda para Pedido?')) return;
        try {
            await orderAPI.revert(id);
            fetchOrders();
        } catch (error) {
            console.error('Error reverting order:', error);
            alert('Erro ao reverter pedido: ' + error.message);
        }
    };

    const handleClone = async (id) => {
        try {
            await orderAPI.clone(id);
            fetchOrders();
        } catch (error) {
            console.error('Error cloning order:', error);
            alert('Erro ao clonar pedido: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ShoppingCart className="text-primary" size={24} />
                        Controle de Pedidos
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Total de {pagination.total} pedidos registrados</p>
                </div>

                <button
                    onClick={onAddNewOrder}
                    className="btn-primary flex items-center gap-2 px-6"
                >
                    <Plus size={18} />
                    <span>Novo Pedido</span>
                </button>
            </div>

            {/* Stats Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                {[
                    { label: 'Total', value: pagination.total, icon: <ShoppingCart size={14} />, color: 'text-blue-400' },
                    { label: 'Ativos', value: orders.filter(o => o.status === 'PEDIDO').length, icon: <Clock size={14} />, color: 'text-amber-400' },
                    { label: 'Vendas', value: orders.filter(o => o.status === 'VENDA').length, icon: <TrendingUp size={14} />, color: 'text-emerald-400' },
                    { label: 'Faturados', value: orders.filter(o => o.faturado).length, icon: <DollarSign size={14} />, color: 'text-slate-400' },
                ].map((stat, i) => (
                    <div key={i} className="card-glass-dark p-3 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-[#666666] uppercase tracking-wider">{stat.label}</p>
                            <p className="text-lg font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="card-glass-dark p-3 rounded-2xl mb-4 border border-white/5 bg-card">
                <div className="flex flex-col lg:flex-row gap-3">
                    <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar pedidos..."
                            className="w-full bg-input-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground text-xs"
                        />
                    </form>

                    <div className="flex gap-2">
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                            className="bg-input-background border border-border rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary/50"
                        >
                            <option value="">Todos os Tipos</option>
                            <option value="OFF">OFF</option>
                            <option value="PRODUZIDO">PRODUZIDO</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="bg-input-background border border-border rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary/50"
                        >
                            <option value="">Todos os Status</option>
                            <option value="PEDIDO">Pedidos</option>
                            <option value="VENDA">Vendas</option>
                            <option value="entregue">Entregues</option>
                            <option value="faturado">Faturados</option>
                        </select>

                        <button
                            onClick={fetchOrders}
                            className="btn-secondary px-4 py-2 text-xs"
                        >
                            Filtrar
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-card border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
                                <th
                                    className="pl-6 py-2.5 w-[80px] cursor-pointer hover:text-foreground transition-colors group/head"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        Status
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'status' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2.5 w-[120px] cursor-pointer hover:text-foreground transition-colors group/head"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center gap-2">
                                        Data
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'date' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2.5 w-[200px] cursor-pointer hover:text-foreground transition-colors group/head"
                                    onClick={() => handleSort('client')}
                                >
                                    <div className="flex items-center gap-2">
                                        Cliente
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'client' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2.5 cursor-pointer hover:text-foreground transition-colors group/head"
                                    onClick={() => handleSort('title')}
                                >
                                    <div className="flex items-center gap-2">
                                        Título / Locutor
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'title' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2.5 text-right w-[140px] cursor-pointer hover:text-foreground transition-colors group/head"
                                    onClick={() => handleSort('vendaValor')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Valores
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'vendaValor' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th className="px-4 py-2.5 text-right w-[140px] hidden lg:table-cell cursor-pointer hover:text-foreground transition-colors group/head">
                                    <div className="flex items-center justify-end gap-2">
                                        Margem
                                    </div>
                                </th>
                                <th className="px-6 py-2.5 w-[120px] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divider-dark">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-8">
                                            <div className="h-4 bg-white/5 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <ShoppingCart size={48} className="opacity-20" />
                                            <p className="text-lg">Nenhum pedido encontrado</p>
                                            <button onClick={onAddNewOrder} className="text-primary hover:underline text-sm font-medium">
                                                Clique aqui para criar o primeiro pedido
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group relative">
                                        {/* Urgency Indicator Strip */}
                                        {order.urgency === 'URGENTE' && (
                                            <td className="absolute left-0 top-0 bottom-0 w-[4px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></td>
                                        )}
                                        {order.urgency === 'ALTA' && (
                                            <td className="absolute left-0 top-0 bottom-0 w-[4px] bg-orange-500"></td>
                                        )}

                                        <td className="pl-6 py-2 w-[50px] align-top">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border mt-1 ${order.status === 'VENDA' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                order.entregue ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-white/5 text-white/20 border-white/10'
                                                }`} title={getStatusLabel(order)}>
                                                <CheckCircle2 size={18} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <div className="flex flex-col mt-1.5">
                                                <span className="text-[11px] text-[#999999] font-mono leading-none">
                                                    {new Date(order.date).toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="text-[9px] text-[#666666] mt-1">
                                                    {order.id.substring(0, 6).toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <span className="text-[13px] font-bold text-foreground line-clamp-1 max-w-[180px] mt-1" title={order.client?.name}>
                                                {order.client?.name || 'Cliente Desconhecido'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <div className="flex flex-col mt-1">
                                                <button
                                                    onClick={() => onEditOrder(order)}
                                                    className="text-foreground font-semibold text-[13px] text-left hover:text-primary transition-all line-clamp-1 mb-1 focus:outline-none leading-tight"
                                                >
                                                    {order.title}
                                                </button>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    {order.urgency === 'URGENTE' && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500 text-white uppercase tracking-wider animate-pulse">
                                                            URGENTE
                                                        </span>
                                                    )}
                                                    {order.urgency === 'ALTA' && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 uppercase tracking-wider">
                                                            ALTA
                                                        </span>
                                                    )}
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${order.tipo === 'PRODUZIDO' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {order.tipo}
                                                    </span>
                                                    <span className="text-[10px] text-[#999999] flex items-center gap-1">
                                                        <Mic2 size={10} />
                                                        {order.locutor}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right align-top">
                                            <div className="flex flex-col mt-1">
                                                <span className="text-foreground font-bold text-sm leading-none">
                                                    {formatCurrency(Number(order.vendaValor))}
                                                </span>
                                                <div className="flex items-center justify-end gap-2 mt-1">
                                                    {order.pago && (
                                                        <span className="text-[9px] font-black px-1 py-0.5 rounded bg-green-500 text-white uppercase tracking-wider">
                                                            PAGO
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Cachê: {formatCurrency(Number(order.cacheValor))}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right hidden lg:table-cell align-top">
                                            <div className="flex flex-col items-end mt-1">
                                                <div className="flex items-center gap-1 text-green-400 font-bold text-xs">
                                                    <TrendingUp size={12} />
                                                    {formatCurrency(Number(order.vendaValor) - Number(order.cacheValor) - (Number(order.vendaValor) * 0.1) - ((Number(order.vendaValor) - Number(order.cacheValor)) * 0.04))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2 text-right align-top">
                                            <div className="flex items-center justify-end gap-2 mt-0.5">
                                                {order.status === 'PEDIDO' && !order.entregue && (
                                                    <button
                                                        onClick={() => handleConvert(order.id)}
                                                        className="p-2 hover:bg-green-500/20 rounded-lg text-green-500 hover:text-green-400 transition-all shadow-sm"
                                                        title="Converter para Venda"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}
                                                {order.status === 'VENDA' && (
                                                    <button
                                                        onClick={() => handleRevert(order.id)}
                                                        className="p-2 hover:bg-amber-500/20 rounded-lg text-amber-500 hover:text-amber-400 transition-all shadow-sm"
                                                        title="Reverter para Pedido"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleClone(order.id)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-[#999999] hover:text-white transition-all shadow-sm"
                                                    title="Clonar Pedido"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onEditOrder(order)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-[#999999] hover:text-white transition-all shadow-sm"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(order)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg text-[#999999] hover:text-red-400 transition-all shadow-sm"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Section */}
                <div className="mt-auto px-6 py-2.5 border-t divider-dark flex items-center justify-between">
                    <div className="text-[11px] text-[#666666]">
                        Mostrando {orders.length} de {pagination.total} pedidos
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={pagination.page === 1 || loading}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="p-1.5 hover:bg-white/5 rounded-md disabled:opacity-30 text-[#999999] transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                        className={`min-w-[32px] h-8 rounded-md text-[11px] font-bold transition-all ${pagination.page === pageNum
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            disabled={pagination.page === pagination.totalPages || loading}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="p-1.5 hover:bg-white/5 rounded-md disabled:opacity-30 text-[#999999] transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground text-center mb-2">Excluir Pedido?</h3>
                        <p className="text-sm text-muted-foreground text-center mb-8">
                            O pedido <span className="text-foreground font-bold">{deleteConfirm.title}</span> será excluído permanentemente do sistema.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleDelete(deleteConfirm.id)}
                                disabled={deleting}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Exclusão'}
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderList;
