import React, { useState, useEffect } from 'react';
import { X, Loader2, Download, ExternalLink, Calendar, Search } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const DashboardDetailModal = ({ metric, metricLabel, dateRange, onClose }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredData = data.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const isCurrency = !['activeClients', 'activeOrders'].includes(metric);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-accent/30">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Detalhamento</span>
                            <h2 className="text-xl font-bold text-foreground">{metricLabel}</h2>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-primary" />
                                {dateRange.label} ({formatDate(dateRange.start)} - {formatDate(dateRange.end)})
                            </span>
                            <span className="bg-white/5 px-2 py-0.5 rounded font-medium">
                                {filteredData.length} registros encontrados
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-border bg-card/50 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Pesquisar por título ou cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-white rounded-lg text-sm font-medium transition-colors">
                        <Download size={16} />
                        Exportar CSV
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Loader2 className="animate-spin text-primary mb-4" size={40} />
                            <p className="font-medium">Buscando dados detalhados...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <p className="text-lg font-bold mb-2">Nenhum dado encontrado</p>
                            <p className="text-sm">Não há registros para esta métrica no período selecionado.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-card z-10 shadow-sm">
                                <tr className="border-b border-border">
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Data</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Título / Registro</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cliente / Categoria</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-wider text-right">Valor / Info</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-wider text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-accent/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-foreground">{formatDate(item.date)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-[300px]">
                                                <p className="text-sm font-bold text-white truncate">{item.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{item.type || 'N/A'}</p>
                                                    {item.isPackageMonthly && (
                                                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[9px] font-bold border border-purple-500/20 uppercase tracking-wider">
                                                            Mensalidade
                                                        </span>
                                                    )}
                                                    {item.isPackageExtra && (
                                                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[9px] font-bold border border-orange-500/20 uppercase tracking-wider">
                                                            Extra Pacote
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-[200px]">
                                                <p className="text-sm text-foreground truncate">{item.client}</p>
                                                <span className={`text-[10px] font-black uppercase ${item.status === 'ENTREGUE' || item.status === 'FATURADO' ? 'text-emerald-500' : 'text-primary'}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black ${isCurrency ? 'text-white' : 'text-muted-foreground'}`}>
                                                {isCurrency ? formatCurrency(item.value) : item.value}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 rounded-lg">
                                                <ExternalLink size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-accent/30 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        CRM Pontocom Audio • Dashboard Analytics
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardDetailModal;
