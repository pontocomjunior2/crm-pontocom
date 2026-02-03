import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Calendar,
    ArrowUpDown,
    ArrowLeft,
    Copy,
    Check,
    FileText,
    Mic2,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { locutorAPI } from '../services/api';
import { formatCurrency, formatDisplayDate } from '../utils/formatters';

const LocutorHistory = ({ locutor, onBack }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // all, PEDIDO, VENDA
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 15,
        total: 0,
        pages: 1
    });
    const [copiedId, setCopiedId] = useState(null);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await locutorAPI.getHistory(locutor.id, {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                status: statusFilter,
                dateFrom,
                dateTo
            });
            setOrders(response.orders || []);
            setPagination(prev => ({
                ...prev,
                total: response.pagination.total,
                pages: response.pagination.pages
            }));
        } catch (error) {
            console.error('Error fetching locutor history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHistory();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination.page, searchTerm, statusFilter, dateFrom, dateTo]);

    const handleCopy = (text, id) => {
        if (!text) return;
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            })
            .catch(err => console.error('Erro ao copiar:', err));
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2.5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-all border border-transparent hover:border-white/10"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Mic2 size={16} className="text-primary" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Histórico de Gravações</h2>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            Locutor: <span className="text-primary font-bold">{locutor.name}</span>
                            {locutor.realName && <span className="text-xs opacity-50">({locutor.realName})</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
                        <span className="block text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">Total Geral</span>
                        <span className="text-lg font-black text-white leading-none">{pagination.total}</span>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-2xl">
                    <div className="bg-input-background border border-border rounded-xl flex items-center px-4 py-2.5 flex-1 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm group">
                        <Search size={18} className="text-muted-foreground mr-3 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por arquivo ou título..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${showFilters ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-input-background border-border text-muted-foreground hover:border-border-hover hover:text-foreground'}`}
                    >
                        <Filter size={18} />
                        <span className="text-sm font-bold hidden sm:inline">Filtros</span>
                    </button>

                    {(statusFilter || dateFrom || dateTo || searchTerm) && (
                        <button
                            onClick={() => {
                                setStatusFilter('');
                                setDateFrom('');
                                setDateTo('');
                                setSearchTerm('');
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                            title="Limpar todos os filtros"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="flex bg-input-background rounded-xl p-1 border border-border shadow-sm">
                    <button
                        onClick={() => {
                            setStatusFilter('');
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === '' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => {
                            setStatusFilter('PEDIDO');
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'PEDIDO' ? 'bg-blue-500/20 text-blue-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                    >
                        Pedidos
                    </button>
                    <button
                        onClick={() => {
                            setStatusFilter('VENDA');
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'VENDA' ? 'bg-green-500/20 text-green-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                    >
                        Vendas
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6 p-5 rounded-2xl bg-card border border-border animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl overflow-hidden relative flex-shrink-0">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50"></div>
                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Data Início</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full bg-input-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Data Fim</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full bg-input-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Table Content */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-card border-b border-border text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">OS</th>
                                <th className="px-6 py-4">Nome do Arquivo</th>
                                <th className="px-6 py-4">Título do Pedido</th>
                                <th className="px-6 py-4 text-center">Tipo</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 size={32} className="text-primary animate-spin mb-3" />
                                            <span className="text-muted-foreground text-sm animate-pulse">Carregando histórico...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <FileText size={48} className="mb-4" />
                                            <p>Nenhum registro encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-foreground font-medium">
                                                    {formatDisplayDate(order.date)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-black">
                                                    {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-white/5 rounded text-[11px] font-mono text-muted-foreground border border-white/5">
                                                #{order.numeroOS || '---'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 group/file">
                                                <span className={`text-[13px] font-bold transition-colors ${order.fileName ? 'text-white' : 'text-muted-foreground italic'}`}>
                                                    {order.fileName || 'Não definido'}
                                                </span>
                                                {order.fileName && (
                                                    <button
                                                        onClick={() => handleCopy(order.fileName, order.id)}
                                                        className={`p-1.5 rounded-lg transition-all ${copiedId === order.id ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white opacity-0 group-hover/file:opacity-100'}`}
                                                        title="Copiar nome do arquivo"
                                                    >
                                                        {copiedId === order.id ? <Check size={12} /> : <Copy size={12} />}
                                                    </button>
                                                )}
                                                {order.arquivoOS && (
                                                    <span className="p-1 px-1.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-black uppercase tracking-tighter" title="OS Anexada">
                                                        OS
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] text-muted-foreground line-clamp-1">
                                                {order.title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${order.tipo === 'PRODUZIDO' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {order.tipo || 'OFF'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${order.status === 'VENDA' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-card border-t border-border flex-shrink-0">
                    <div className="text-xs text-muted-foreground">
                        Mostrando <span className="text-white font-bold">{orders.length}</span> de <span className="text-white font-bold">{pagination.total}</span> registros
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1 || loading}
                            className="p-2 bg-white/5 border border-white/5 rounded-lg text-muted-foreground hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${pagination.page === p
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                            disabled={pagination.page === pagination.pages || loading}
                            className="p-2 bg-white/5 border border-white/5 rounded-lg text-muted-foreground hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocutorHistory;
