import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    FileText,
    CheckCircle2,
    AlertCircle,
    Calendar,
    DollarSign,
    ArrowUpRight,
    Loader2,
    Download,
    Copy,
    CheckSquare,
    Square,
    ArrowUpDown,
    TrendingUp
} from 'lucide-react';
import { orderAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const FaturamentoList = ({ onEditOrder }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, faturado, pendente
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [sortConfig, setSortConfig] = useState({
        key: 'date',
        order: 'desc'
    });

    const handleSelectOrder = (id) => {
        setSelectedOrders(prev => {
            if (prev.includes(id)) {
                return prev.filter(orderId => orderId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    const handleGenerateList = () => {
        const selected = orders.filter(o => selectedOrders.includes(o.id));
        if (selected.length === 0) return;

        const textList = selected.map(o => {
            const date = new Date(o.date).toLocaleDateString('pt-BR');
            const id = o.numeroVenda || 'N/A';
            return `${id} - ${o.title.toUpperCase()} - ${date} (${formatCurrency(o.vendaValor)})`;
        }).join('\n');

        navigator.clipboard.writeText(textList)
            .then(() => alert('Lista copiada para a área de transferência!'))
            .catch(err => console.error('Erro ao copiar:', err));
    };

    const handleBulkMarkAsFaturado = async () => {
        if (!window.confirm(`Deseja marcar ${selectedOrders.length} pedidos como FATURADOS?`)) return;

        setLoading(true);
        try {
            await Promise.all(selectedOrders.map(id =>
                orderAPI.update(id, { faturado: true })
            ));
            setSelectedOrders([]);
            fetchOrders();
            alert('Pedidos faturados com sucesso!');
        } catch (error) {
            console.error('Error in bulk billing:', error);
            alert('Erro ao realizar faturamento em lote: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await orderAPI.list({
                status: 'VENDA',
                limit: 100,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.order
            });
            setOrders(response.orders || []);
        } catch (error) {
            console.error('Error fetching billing orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [sortConfig]);

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.numeroVenda?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ? true :
                statusFilter === 'faturado' ? order.faturado :
                    !order.faturado;

        return matchesSearch && matchesStatus;
    });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleToggleFaturado = async (order) => {
        try {
            await orderAPI.update(order.id, { faturado: !order.faturado });
            fetchOrders();
        } catch (error) {
            console.error('Error updating faturado status:', error);
            alert('Erro ao atualizar status: ' + error.message);
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
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4 flex-shrink-0">
                <div className="bg-input-background border border-border rounded-xl flex items-center px-3 py-2 flex-1 max-w-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm">
                    <Search size={16} className="text-muted-foreground mr-3" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, título ou nota..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground w-full"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="flex bg-input-background rounded-xl p-1 border border-border shadow-sm">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setStatusFilter('pendente')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'pendente' ? 'bg-orange-500/20 text-orange-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        >
                            Pendentes
                        </button>
                        <button
                            onClick={() => setStatusFilter('faturado')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'faturado' ? 'bg-green-500/20 text-green-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        >
                            Faturados
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-card border-b border-border text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-2.5 w-[50px]">
                                    <div className="flex items-center justify-center cursor-pointer" onClick={handleSelectAll}>
                                        {filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length ? (
                                            <CheckSquare size={16} className="text-primary" />
                                        ) : (
                                            <Square size={16} className="text-muted-foreground" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2.5 cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('numeroVenda')}
                                >
                                    <div className="flex items-center gap-2">
                                        ID / Status
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'numeroVenda' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2.5 cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center gap-2">
                                        Data Venda
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'date' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2.5 cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('client')}
                                >
                                    <div className="flex items-center gap-2">
                                        Cliente
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'client' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2.5 cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('title')}
                                >
                                    <div className="flex items-center gap-2">
                                        Título / Detalhes
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'title' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2.5 text-right cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('vendaValor')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Valor Venda
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'vendaValor' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th className="px-4 py-2.5 text-center">Faturamento</th>
                                <th className="px-6 py-2.5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 size={32} className="text-primary animate-spin mb-3" />
                                            <span className="text-muted-foreground text-sm animate-pulse">Carregando vendas...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-20 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <FileText size={48} className="mb-4" />
                                            <p>Nenhuma venda encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="pl-6 py-2">
                                            <div className="flex items-center justify-center cursor-pointer" onClick={() => handleSelectOrder(order.id)}>
                                                {selectedOrders.includes(order.id) ? (
                                                    <CheckSquare size={18} className="text-primary" />
                                                ) : (
                                                    <Square size={18} className="text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${order.faturado
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                    }`} title={order.faturado ? 'Faturado' : 'Pendente de Faturamento'}>
                                                    <DollarSign size={16} />
                                                </div>
                                                {order.numeroVenda && (
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        #{order.numeroVenda}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground font-medium">
                                                    {new Date(order.updatedAt || order.date).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    {new Date(order.updatedAt || order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer" title="Ver cliente">
                                                    {order.client?.name || 'Cliente Removido'}
                                                </span>
                                                {order.client?.razaoSocial && (
                                                    <span className="text-[10px] text-muted-foreground line-clamp-1">{order.client.razaoSocial}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 min-w-[200px]">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] text-foreground font-semibold line-clamp-1 cursor-pointer hover:underline" onClick={() => onEditOrder(order)}>
                                                    {order.title}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground uppercase">
                                                        {order.tipo || 'OFF'}
                                                    </span>
                                                    {order.numeroVenda && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <FileText size={10} />
                                                            Nv: {order.numeroVenda}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-foreground block">
                                                    {formatCurrency(Number(order.vendaValor))}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {order.pago && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-green-500 text-white uppercase tracking-wider">
                                                            PAGO
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-medium ${order.locutorObj?.valorFixoMensal > 0 ? 'text-primary' : 'text-muted-foreground/60'}`}>
                                                        {formatCurrency(Number(order.dynamicCacheValor || order.cacheValor))}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleFaturado(order)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${order.faturado
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                                                    }`}
                                            >
                                                {order.faturado ? 'FATURADO' : 'PENDENTE'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleClone(order.id)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-all shadow-sm"
                                                    title="Clonar Venda"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onEditOrder(order)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-all shadow-sm"
                                                    title="Editar Detalhes"
                                                >
                                                    <ArrowUpRight size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="mt-auto flex items-center justify-between px-6 py-2.5 bg-card border-t border-border flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                        Exibindo {filteredOrders.length} registros
                    </span>
                    <div className="flex items-center gap-4">
                        {selectedOrders.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleBulkMarkAsFaturado}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                                >
                                    <CheckCircle2 size={14} />
                                    Marcar Faturado ({selectedOrders.length})
                                </button>
                                <button
                                    onClick={handleGenerateList}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                >
                                    <Copy size={14} />
                                    Gerar Lista
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Total Pendente</span>
                            <span className="text-sm font-bold text-orange-400">
                                {formatCurrency(filteredOrders.filter(o => !o.faturado).reduce((acc, curr) => acc + (Number(curr.vendaValor) || 0), 0))}
                            </span>
                        </div>
                        <div className="h-8 w-px bg-border"></div>
                        <div className="text-right">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Total Faturado</span>
                            <span className="text-sm font-bold text-green-400">
                                {formatCurrency(filteredOrders.filter(o => o.faturado).reduce((acc, curr) => acc + (Number(curr.vendaValor) || 0), 0))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default FaturamentoList;
