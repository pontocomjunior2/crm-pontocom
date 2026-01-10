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
    Plus,
    ArrowUpRight,
    Loader2,
    Download,
    Copy,
    CheckSquare,
    Square,
    ArrowUpDown,
    TrendingUp,
    MessageSquare,
    Clock,
    X,
    Trash2,
    Ban
} from 'lucide-react';
import { orderAPI, STORAGE_URL } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const FaturamentoList = ({ onEditOrder, onAddNewOrder }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, faturado, pendente
    const [clientFilter, setClientFilter] = useState('');
    const [titleFilter, setTitleFilter] = useState('');
    const [idFilter, setIdFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [observationModal, setObservationModal] = useState(null);
    const [pendencyModal, setPendencyModal] = useState(null);
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
            const id = o.numeroVenda || 'N/A';
            return `${id} - ${o.title.toUpperCase()} (${formatCurrency(o.vendaValor)})`;
        }).join('\n');

        navigator.clipboard.writeText(textList)
            .then(() => alert('Lista copiada para a área de transferência!'))
            .catch(err => console.error('Erro ao copiar:', err));
    };

    const handleBulkDelete = async () => {
        if (!selectedOrders.length) return;
        if (!window.confirm(`Tem certeza que deseja excluir PERMANENTEMENTE os ${selectedOrders.length} registros selecionados? Esta ação não pode ser desfeita.`)) return;

        setLoading(true);
        try {
            await orderAPI.bulkDelete(selectedOrders);
            setSelectedOrders([]);
            fetchOrders();
            alert('Registros excluídos com sucesso!');
        } catch (error) {
            console.error('Error in bulk delete:', error);
            alert('Erro ao excluir registros: ' + error.message);
        } finally {
            setLoading(false);
        }
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
                sortOrder: sortConfig.order,
                search: searchTerm,
                clientName: clientFilter,
                title: titleFilter,
                numeroVenda: idFilter,
                dateFrom,
                dateTo,
                faturado: statusFilter === 'all' ? '' : (statusFilter === 'faturado' ? 'true' : 'false')
            });
            setOrders(response.orders || []);
        } catch (error) {
            console.error('Error fetching billing orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, clientFilter, titleFilter, idFilter, dateFrom, dateTo, sortConfig]);

    const filteredOrders = orders;

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <DollarSign className="text-primary" size={24} />
                        Gestão de Faturamento
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Controle financeiro e conciliação de vendas</p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedOrders.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                            <span className="text-[10px] font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded-lg border border-border mr-2">
                                {selectedOrders.length} selecionados
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2"
                                title="Excluir selecionados"
                            >
                                <Trash2 size={18} />
                                <span className="text-xs font-bold hidden sm:inline">Excluir</span>
                            </button>
                            <button
                                onClick={handleBulkMarkAsFaturado}
                                className="p-2.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all flex items-center gap-2"
                                title="Marcar como faturado"
                            >
                                <CheckCircle2 size={18} />
                                <span className="text-xs font-bold hidden sm:inline">Faturar</span>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => onAddNewOrder('VENDA')}
                        className="btn-primary flex items-center gap-2 px-6"
                    >
                        <Plus size={18} />
                        <span>Novo Lançamento</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-2xl">
                    <div className="bg-input-background border border-border rounded-xl flex items-center px-3 py-2 flex-1 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm group">
                        <Search size={16} className="text-muted-foreground mr-3 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Pesquisa rápida..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground w-full"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${showFilters ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-input-background border-border text-muted-foreground hover:border-border-hover hover:text-foreground'}`}
                        title="Filtros Avançados"
                    >
                        <Filter size={16} />
                        <span className="text-xs font-bold hidden sm:inline">Filtros</span>
                    </button>

                    {(clientFilter || idFilter || titleFilter || dateFrom || dateTo) && (
                        <button
                            onClick={() => {
                                setClientFilter('');
                                setIdFilter('');
                                setTitleFilter('');
                                setDateFrom('');
                                setDateTo('');
                                setSearchTerm('');
                            }}
                            className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                            title="Limpar todos os filtros"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

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

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-5 rounded-2xl bg-card border border-border animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl overflow-hidden relative flex-shrink-0">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50"></div>
                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Cliente</label>
                        <input
                            type="text"
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                            placeholder="Filtrar por nome"
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">ID da Venda</label>
                        <input
                            type="text"
                            value={idFilter}
                            onChange={(e) => setIdFilter(e.target.value)}
                            placeholder="Número da venda"
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Título do Pedido</label>
                        <input
                            type="text"
                            value={titleFilter}
                            onChange={(e) => setTitleFilter(e.target.value)}
                            placeholder="Palavras-chave"
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Data Início</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Data Fim</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-input-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                </div>
            )}

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
                                    className="px-4 py-2.5 cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('dataFaturar')}
                                >
                                    <div className="flex items-center gap-2">
                                        Faturamento / Venc.
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'dataFaturar' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
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
                                                    {order.comentarios && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setObservationModal({ title: order.title, text: order.comentarios });
                                                            }}
                                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-wider flex items-center gap-1 hover:bg-cyan-500/30 transition-all cursor-pointer"
                                                            title="Clique para ver observação completa"
                                                        >
                                                            <MessageSquare size={10} />
                                                            OBS
                                                        </button>
                                                    )}
                                                    {order.pendenciaFinanceiro && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPendencyModal({
                                                                    title: order.title,
                                                                    text: order.pendenciaMotivo || 'Nenhuma descrição detalhada fornecida.',
                                                                    osFile: order.arquivoOS,
                                                                    osNumber: order.numeroOS
                                                                });
                                                            }}
                                                            className="text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-500 text-white uppercase tracking-wider flex items-center gap-1 hover:bg-orange-600 transition-all cursor-pointer shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                                                            title="Clique para ver detalhes da pendência"
                                                        >
                                                            <AlertCircle size={10} />
                                                            PENDÊNCIA FIN.
                                                        </button>
                                                    )}
                                                    {order.dispensaNF && (
                                                        <span
                                                            className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase tracking-tighter flex items-center gap-1 shadow-sm"
                                                            title="Este pedido NÃO exige emissão de Nota Fiscal"
                                                        >
                                                            <Ban size={10} />
                                                            DISPENSA NF
                                                        </span>
                                                    )}
                                                    {order.arquivoOS && (
                                                        <a
                                                            href={`${STORAGE_URL}${order.arquivoOS}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase tracking-wider flex items-center gap-1 hover:bg-blue-500/30 transition-all font-bold"
                                                            title={`OS N° ${order.numeroOS || 'Ver PDF'}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <FileText size={10} />
                                                            {order.numeroOS ? `OS: ${order.numeroOS}` : 'VER OS'}
                                                        </a>
                                                    )}
                                                    {order.serviceType ? (
                                                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-primary text-primary-foreground uppercase tracking-wider">
                                                            {order.serviceType}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground uppercase">
                                                            {order.tipo || 'OFF'}
                                                        </span>
                                                    )}
                                                    {order.numeroVenda && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <FileText size={10} />
                                                            Nv: {order.numeroVenda}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 min-w-[140px]">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                                                    <Calendar size={12} className="text-primary" />
                                                    {order.dataFaturar ? new Date(order.dataFaturar).toLocaleDateString() : '---'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                                    <Clock size={12} />
                                                    Vence: {order.vencimento ? new Date(order.vencimento).toLocaleDateString() : '---'}
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
                                                        {order.locutorObj?.valorFixoMensal > 0 && (
                                                            <span className="ml-1 opacity-60">
                                                                {Number(order.cacheValor) > 0 ? '(Extra)' : '(Fixo)'}
                                                            </span>
                                                        )}
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

            {/* Observation Modal */}
            {
                observationModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-card border border-border rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center">
                                    <MessageSquare size={24} className="text-cyan-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-foreground">Observações do Pedido</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">{observationModal.title}</p>
                                </div>
                                <button
                                    onClick={() => setObservationModal(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-input-background border border-border rounded-xl p-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed select-all">
                                    {observationModal.text}
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Copy size={12} />
                                    Selecione o texto e pressione Ctrl+C para copiar
                                </p>
                                <button
                                    onClick={() => setObservationModal(null)}
                                    className="btn-secondary px-6"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Pendency Modal */}
            {
                pendencyModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-card border border-border rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                                    <AlertCircle size={24} className="text-orange-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-foreground">Detalhes da Pendência</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">{pendencyModal.title}</p>
                                </div>
                                <button
                                    onClick={() => setPendencyModal(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed select-all">
                                    {pendencyModal.text}
                                </p>
                            </div>

                            {pendencyModal.osFile && (
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                            <FileText className="text-blue-400" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Documento OS/PP Anexado</p>
                                            <p className="text-xs text-muted-foreground">Número: {pendencyModal.osNumber || 'Não informado'}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`${STORAGE_URL}${pendencyModal.osFile}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all text-xs font-bold"
                                    >
                                        <ArrowUpRight size={14} />
                                        VISUALIZAR PDF
                                    </a>
                                </div>
                            )}

                            <div className="flex items-center justify-end">
                                <button
                                    onClick={() => setPendencyModal(null)}
                                    className="btn-secondary px-6"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default FaturamentoList;
