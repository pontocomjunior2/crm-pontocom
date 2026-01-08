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
    Download
} from 'lucide-react';
import { orderAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const FaturamentoList = ({ onEditOrder }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, faturado, pendente

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Fetch only VENDA status
            const response = await orderAPI.list({ status: 'VENDA', limit: 100 });
            setOrders(response.orders || []);
        } catch (error) {
            console.error('Error fetching billing orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

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

    const handleToggleFaturado = async (order) => {
        try {
            await orderAPI.update(order.id, { faturado: !order.faturado });
            fetchOrders(); // Refresh to show updated status
        } catch (error) {
            console.error('Error updating faturado status:', error);
            alert('Erro ao atualizar status: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 flex-shrink-0">
                <div className="search-dark flex-1 max-w-md">
                    <Search size={18} className="text-[#666666]" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, título ou nota..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-[#DDDDDD] placeholder:text-[#666666] w-full"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="flex bg-[#0F0F0F] rounded-xl p-1 border border-white/10">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-[#222] text-white' : 'text-[#666666] hover:text-[#DDDDDD]'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setStatusFilter('pendente')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'pendente' ? 'bg-orange-500/20 text-orange-400' : 'text-[#666666] hover:text-[#DDDDDD]'}`}
                        >
                            Pendentes
                        </button>
                        <button
                            onClick={() => setStatusFilter('faturado')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'faturado' ? 'bg-green-500/20 text-green-400' : 'text-[#666666] hover:text-[#DDDDDD]'}`}
                        >
                            Faturados
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto rounded-2xl border border-white/5 bg-[#121212]/50 backdrop-blur-sm custom-scrollbar relative">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#161616] text-xs uppercase text-[#666666] font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-4 py-4">Data Venda</th>
                            <th className="px-4 py-4">Cliente</th>
                            <th className="px-4 py-4">Título / Detalhes</th>
                            <th className="px-4 py-4 text-right">Valor Venda</th>
                            <th className="px-4 py-4 text-center">Faturamento</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divider-dark">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <Loader2 size={32} className="text-[#FF9500] animate-spin mb-3" />
                                        <span className="text-[#666666] text-sm animate-pulse">Carregando vendas...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-20 text-center text-[#666666]">
                                    <div className="flex flex-col items-center justify-center opacity-50">
                                        <FileText size={48} className="mb-4" />
                                        <p>Nenhuma venda encontrada.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="pl-6 py-4 w-[50px]">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${order.faturado
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                            }`} title={order.faturado ? 'Faturado' : 'Pendente de Faturamento'}>
                                            <DollarSign size={16} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-[#DDDDDD] font-medium">
                                                {new Date(order.updatedAt || order.date).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] text-[#666666]">
                                                {new Date(order.updatedAt || order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white group-hover:text-[#FF9500] transition-colors cursor-pointer" title="Ver cliente">
                                                {order.client?.name || 'Cliente Removido'}
                                            </span>
                                            {order.client?.razaoSocial && (
                                                <span className="text-[10px] text-[#666666] line-clamp-1">{order.client.razaoSocial}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 min-w-[200px]">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-[#DDDDDD] font-medium line-clamp-1 cursor-pointer hover:underline" onClick={() => onEditOrder(order)}>
                                                {order.title}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-[#999999] uppercase">
                                                    {order.tipo || 'OFF'}
                                                </span>
                                                {order.numeroVenda && (
                                                    <span className="text-[10px] text-[#666666] flex items-center gap-1">
                                                        <FileText size={10} />
                                                        Nv: {order.numeroVenda}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="text-sm font-bold text-white block">
                                            {formatCurrency(order.vendaValor)}
                                        </span>
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
                                        {order.dataFaturar && !order.faturado && (
                                            <span className="block text-[10px] text-[#666666] mt-1">
                                                Prev: {new Date(order.dataFaturar).toLocaleDateString()}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEditOrder(order)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-[#999999] hover:text-white transition-all shadow-sm"
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
            <div className="mt-4 flex items-center justify-between p-4 bg-[#161616] rounded-xl border border-white/5">
                <span className="text-xs text-[#666666]">
                    Exibindo {filteredOrders.length} registros
                </span>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="text-[10px] text-[#666666] uppercase tracking-wider block">Total Pendente</span>
                        <span className="text-sm font-bold text-orange-400">
                            {formatCurrency(filteredOrders.filter(o => !o.faturado).reduce((acc, curr) => acc + (curr.vendaValor || 0), 0))}
                        </span>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="text-right">
                        <span className="text-[10px] text-[#666666] uppercase tracking-wider block">Total Faturado</span>
                        <span className="text-sm font-bold text-green-400">
                            {formatCurrency(filteredOrders.filter(o => o.faturado).reduce((acc, curr) => acc + (curr.vendaValor || 0), 0))}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaturamentoList;
