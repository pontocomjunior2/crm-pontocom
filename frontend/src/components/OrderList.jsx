import React, { useState, useEffect } from 'react';
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
    RotateCcw
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

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [pagination.page, pagination.limit, filters]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await orderAPI.list({
                page: pagination.page,
                limit: pagination.limit,
                search,
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
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchOrders();
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

    const getStatusBadgeClass = (order) => {
        if (order.status === 'VENDA') return 'status-faturado'; // Green/Success for finalized sale
        if (order.entregue) return 'status-delivered'; // Blue for delivered pedido
        return 'status-inactive'; // White/Faded for pedido (waiting)
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

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShoppingCart className="text-[#FF9500]" size={24} />
                        Controle de Pedidos
                    </h2>
                    <p className="text-sm text-[#999999] mt-1">Total de {pagination.total} pedidos registrados</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Registros', value: pagination.total, icon: <ShoppingCart size={16} />, color: 'text-blue-400' },
                    { label: 'Pedidos Ativos', value: orders.filter(o => o.status === 'PEDIDO').length, icon: <Clock size={16} />, color: 'text-orange-400' },
                    { label: 'Vendas (Histórico)', value: orders.filter(o => o.status === 'VENDA').length, icon: <TrendingUp size={16} />, color: 'text-green-400' },
                    { label: 'Faturados', value: orders.filter(o => o.faturado).length, icon: <DollarSign size={16} />, color: 'text-gray-400' },
                ].map((stat, i) => (
                    <div key={i} className="card-glass-dark p-4 rounded-xl border border-white/5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{stat.label}</p>
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="card-glass-dark p-4 rounded-2xl mb-6 border border-white/5">
                <div className="flex flex-col lg:flex-row gap-4">
                    <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar por título, cliente ou locutor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 placeholder:text-[#444444] text-sm"
                        />
                    </form>

                    <div className="flex gap-2">
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                            className="bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF9500]/50"
                        >
                            <option value="">Todos os Tipos</option>
                            <option value="OFF">OFF</option>
                            <option value="PRODUZIDO">PRODUZIDO</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF9500]/50"
                        >
                            <option value="">Todos os Status</option>
                            <option value="PEDIDO">Apenas Pedidos</option>
                            <option value="VENDA">Apenas Vendas (Histórico)</option>
                            <option value="entregue">Entregues</option>
                            <option value="faturado">Faturados</option>
                        </select>

                        <button
                            onClick={fetchOrders}
                            className="btn-secondary px-6 text-sm"
                        >
                            Filtrar
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[#999999] text-[11px] uppercase tracking-wider font-bold">
                                <th className="pl-6 py-4">Status</th>
                                <th className="px-4 py-4">Data</th>
                                <th className="px-4 py-4">Cliente</th>
                                <th className="px-4 py-4">Título / Locutor</th>
                                <th className="px-4 py-4 text-right">Valores</th>
                                <th className="px-4 py-4 text-right hidden lg:table-cell">Margem</th>
                                <th className="px-6 py-4 text-right">Ações</th>
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
                                        <div className="flex flex-col items-center gap-3 text-[#666666]">
                                            <ShoppingCart size={48} className="opacity-20" />
                                            <p className="text-lg">Nenhum pedido encontrado</p>
                                            <button onClick={onAddNewOrder} className="text-[#FF9500] hover:underline text-sm font-medium">
                                                Clique aqui para criar o primeiro pedido
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="pl-6 py-4 w-[50px]">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${order.status === 'VENDA' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                order.entregue ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-white/5 text-white/20 border-white/10'
                                                }`} title={getStatusLabel(order)}>
                                                <CheckCircle2 size={18} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] text-[#999999] font-mono">
                                                    {new Date(order.date).toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="text-[9px] text-[#666666]">
                                                    {order.id.substring(0, 6).toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-bold text-white line-clamp-1 max-w-[150px]" title={order.client?.name}>
                                                {order.client?.name || 'Cliente Desconhecido'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={() => onEditOrder(order)}
                                                    className="text-white font-medium text-sm text-left hover:text-[#FF9500] transition-colors line-clamp-1 mb-1 focus:outline-none"
                                                >
                                                    {order.title}
                                                </button>
                                                <div className="flex items-center gap-2">
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
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-sm">
                                                    {formatCurrency(Number(order.vendaValor))}
                                                </span>
                                                <span className="text-[10px] text-[#666666]">
                                                    Cachê: {formatCurrency(Number(order.cacheValor))}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right hidden lg:table-cell">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1 text-green-400 font-bold text-xs">
                                                    <TrendingUp size={12} />
                                                    {formatCurrency(Number(order.vendaValor) - Number(order.cacheValor) - (Number(order.vendaValor) * 0.1) - ((Number(order.vendaValor) - Number(order.cacheValor)) * 0.04))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
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
                                                        className="p-2 hover:bg-orange-500/20 rounded-lg text-orange-500 hover:text-orange-400 transition-all shadow-sm"
                                                        title="Reverter para Pedido"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                )}
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
                <div className="mt-auto px-6 py-4 border-t divider-dark flex items-center justify-between">
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
                                            ? 'bg-gradient-primary text-white shadow-lg shadow-orange-500/20'
                                            : 'text-[#666666] hover:text-white hover:bg-white/5'
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
                    <div className="bg-[#161616] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white text-center mb-2">Excluir Pedido?</h3>
                        <p className="text-sm text-[#999999] text-center mb-8">
                            O pedido <span className="text-white font-bold">{deleteConfirm.title}</span> será excluído permanentemente do sistema.
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
