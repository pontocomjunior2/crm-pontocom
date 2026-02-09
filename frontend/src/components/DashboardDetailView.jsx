import React, { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Download,
    ExternalLink,
    Calendar,
    Search,
    ArrowLeft,
    FileText,
    User,
    DollarSign,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { formatCurrency, formatDisplayDate } from '../utils/formatters';

const DashboardDetailView = ({ metric, metricLabel, dateRange, onBack, onEditOrder, onEditClient }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = {};
                if (dateRange.start) params.startDate = dateRange.start;
                if (dateRange.end) params.endDate = dateRange.end;

                const result = await dashboardAPI.getDetails(metric, params);
                setData(result);
            } catch (error) {
                console.error('Error fetching dashboard details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [metric, dateRange]);

    const handleSearch = () => {
        setAppliedSearch(searchTerm);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const filteredData = data.filter(item => {
        if (!appliedSearch) return true;
        const search = appliedSearch.toLowerCase();
        return (
            (item.title || '').toLowerCase().includes(search) ||
            (item.client || '').toLowerCase().includes(search) ||
            (item.id || '').toLowerCase().includes(search)
        );
    });

    const handleAction = async (item) => {
        if (metric === 'activeClients' || item.tipo === 'CLIENTE') {
            // For clients, we might need to fetch the full object if item only has basic info
            // But usually the ID is enough to trigger the edit modal
            onEditClient({ id: item.id });
        } else if (item.id && !item.id.toString().startsWith('FIXED-')) {
            // It's an order
            onEditOrder({ id: item.id });
        }
    };

    const isCurrency = !['activeClients', 'activeOrders'].includes(metric);

    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-background animate-in fade-in slide-in-from-right-4 duration-500 p-6">
            <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-soft">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-border group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Analytics</span>
                                <h1 className="text-2xl font-black text-foreground tracking-tight">{metricLabel}</h1>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-primary" />
                                    {dateRange.label} ({formatDisplayDate(dateRange.start)} - {formatDisplayDate(dateRange.end)})
                                </span>
                                <span className="bg-white/5 px-2 py-0.5 rounded flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    {filteredData.length} registros encontrados
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-64 bg-input-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-bold border border-primary/20 transition-all"
                        >
                            Filtrar
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-border transition-all">
                            <Download size={18} />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="flex-1 bg-card rounded-2xl border border-border shadow-soft overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                                <p className="font-bold tracking-tight">Consolidando dados detalhados...</p>
                                <p className="text-xs mt-1">Isso pode levar alguns segundos para grandes volumes.</p>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                                <div className="p-4 bg-white/5 rounded-full mb-4">
                                    <FileText size={48} className="opacity-20" />
                                </div>
                                <p className="text-lg font-bold">Nenhum registro encontrado</p>
                                <p className="text-sm">Tente ajustar seus filtros ou o termo de busca.</p>
                                {appliedSearch && (
                                    <button
                                        onClick={() => { setSearchTerm(''); setAppliedSearch(''); }}
                                        className="mt-4 text-primary hover:underline font-bold text-xs"
                                    >
                                        Limpar busca
                                    </button>
                                )}
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-accent/50 backdrop-blur-md z-10">
                                    <tr className="border-b border-border">
                                        <th className="px-8 py-5 text-[10px] uppercase font-black text-muted-foreground tracking-widest italic">Data</th>
                                        <th className="px-8 py-5 text-[10px] uppercase font-black text-muted-foreground tracking-widest italic">Título / Registro</th>
                                        <th className="px-8 py-5 text-[10px] uppercase font-black text-muted-foreground tracking-widest italic">Cliente / Categoria</th>
                                        <th className="px-8 py-5 text-[10px] uppercase font-black text-muted-foreground tracking-widest italic text-right">Valor / Info</th>
                                        <th className="px-8 py-5 text-[10px] uppercase font-black text-muted-foreground tracking-widest italic text-center">Status</th>
                                        <th className="px-8 py-5 text-[10px] uppercase font-black text-muted-foreground tracking-widest italic text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-primary opacity-50" />
                                                    <span className="text-sm font-mono text-muted-foreground">{formatDisplayDate(item.date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="max-w-[400px]">
                                                    <p className="text-sm font-black text-white group-hover:text-primary transition-colors uppercase tracking-tight">{item.title}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase bg-white/5 px-2 py-0.5 rounded tracking-widest">{item.type || 'N/A'}</p>
                                                        {item.isPackageMonthly && (
                                                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[8px] font-black border border-purple-500/20 uppercase tracking-widest shadow-glow-purple/20">
                                                                MENSALIDADE
                                                            </span>
                                                        )}
                                                        {item.isPackageExtra && (
                                                            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[8px] font-black border border-orange-500/20 uppercase tracking-widest shadow-glow-orange/20">
                                                                EXTRA PACOTE
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <User size={14} className="text-muted-foreground" />
                                                    <span className="text-sm text-foreground font-medium">{item.client}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-base font-black ${isCurrency ? 'text-white' : 'text-muted-foreground'}`}>
                                                        {isCurrency ? formatCurrency(item.value) : item.value}
                                                    </span>
                                                    {isCurrency && <span className="text-[9px] text-muted-foreground uppercase font-medium">BRL / Real</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${['FATURADO', 'ENTREGUE'].includes(item.status)
                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                        : 'bg-primary/10 text-primary'
                                                        }`}>
                                                        {item.status === 'FATURADO' && <CheckCircle2 size={10} />}
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                {!item.id.toString().startsWith('FIXED-') && (
                                                    <button
                                                        onClick={() => handleAction(item)}
                                                        className="p-2.5 text-muted-foreground hover:text-primary transition-all hover:bg-primary/10 rounded-xl border border-transparent hover:border-primary/30"
                                                        title="Ver Detalhes / Editar"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Table Footer */}
                    <div className="p-4 bg-accent/30 border-t border-border flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            CRM Pontocom Audio • Detalhamento Gerencial v2.0
                        </p>
                        {isCurrency && (
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Total Consolidado:</span>
                                <span className="text-sm font-black text-primary">
                                    {formatCurrency(filteredData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardDetailView;
