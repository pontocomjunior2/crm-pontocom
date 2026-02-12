import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    DollarSign,
    Package,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Calendar,
    PieChart,
    BarChart2,
    Filter,
    Download,
    TrendingDown,
    Search,
    FileText,
    Layout,
    ChevronRight,
    AlertCircle,
    ArrowUpDown,
    CheckCircle2,
    Clock,
    User,
    Copy,
    Check,
    X
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Pie,
    PieChart as RechartsPieChart,
    LineChart,
    Line,
    BarChart,
    Bar
} from 'recharts';
import { analyticsAPI, orderAPI } from '../services/api';
import { formatCurrency, formatDisplayDate, getLocalISODate } from '../utils/formatters';
import { showToast } from '../utils/toast';

const Relatorios = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [topClients, setTopClients] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [activeTab, setActiveTab] = useState('insights'); // 'insights' or 'caches'
    const [cacheData, setCacheData] = useState([]);
    const [loadingCaches, setLoadingCaches] = useState(false);
    const [cacheStatusFilter, setCacheStatusFilter] = useState('pending'); // 'pending', 'paid', 'all'
    const [searchTerm, setSearchTerm] = useState('');
    const [justToggledIds, setJustToggledIds] = useState(new Set());
    const [selectedLocutorCache, setSelectedLocutorCache] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // Clear toggled IDs when switching tabs or changing filters
    useEffect(() => {
        setJustToggledIds(new Set());
    }, [cacheStatusFilter, activeTab]);

    useEffect(() => {
        fetchData();
        if (activeTab === 'caches') {
            fetchCacheData();
        }
    }, [dateRange, activeTab]);

    const handleCopyTitle = (title, id) => {
        navigator.clipboard.writeText(title);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryData, trendsData, clientsData, metricsData] = await Promise.all([
                analyticsAPI.getFinancialSummary(dateRange),
                analyticsAPI.getSalesTrends({ ...dateRange, months: 6 }),
                analyticsAPI.getTopClients({ ...dateRange, limit: 10 }),
                analyticsAPI.getPerformanceMetrics(dateRange)
            ]);

            setSummary(summaryData);
            setTrends(trendsData);
            setTopClients(clientsData);
            setMetrics(metricsData);
        } catch (error) {
            console.error('Error fetching reports data:', error);
            showToast.error('Erro ao carregar dados dos relatórios.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCacheData = async () => {
        try {
            setLoadingCaches(true);
            const data = await analyticsAPI.getCacheReport(dateRange);
            setCacheData(data);
        } catch (error) {
            console.error('Error fetching cache report:', error);
            showToast.error('Erro ao buscar relatório de cachês.');
        } finally {
            setLoadingCaches(false);
        }
    };

    const handleMarkCacheAsPaid = async (orderId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await orderAPI.update(orderId, { cachePago: newStatus });

            // Track this ID so it doesn't disappear immediately from current filter
            setJustToggledIds(prev => new Set([...prev, orderId]));

            // Refresh local state or re-fetch
            fetchCacheData();
            showToast.success(newStatus ? 'Cachê marcado como lançado/pago!' : 'Cachê marcado como pendente!');
        } catch (error) {
            console.error('Error updating cache status:', error);
            showToast.error('Erro ao atualizar status do cachê.');
        }
    };

    if (loading && !summary) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-muted-foreground animate-pulse font-medium">Processando inteligência de dados...</p>
            </div>
        );
    }

    const COLORS = ['#FB923C', '#22D3EE', '#818CF8', '#A78BFA', '#F472B6'];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-h-screen overflow-y-auto custom-scrollbar pr-2">
            {/* Header with improved controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card-background/50 p-6 rounded-3xl border border-border shadow-soft">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-primary/20">
                        <BarChart2 size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Relatórios & Analytics</h1>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Monitoramento de performance em tempo real
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 mr-2">
                        <button
                            onClick={() => setActiveTab('insights')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'insights' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                        >
                            <TrendingUp size={14} />
                            Insights
                        </button>
                        <button
                            onClick={() => setActiveTab('caches')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'caches' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                        >
                            <DollarSign size={14} />
                            Gestão de Cachês
                        </button>
                    </div>

                    <div className="h-8 w-px bg-border mx-2 hidden lg:block"></div>

                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setDateRange({ startDate: '', endDate: '' })}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!dateRange.startDate ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                        >
                            Total
                        </button>
                        <button
                            onClick={() => {
                                const now = new Date();
                                const firstDay = getLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1));
                                setDateRange({ startDate: firstDay, endDate: '' });
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateRange.startDate && !dateRange.endDate ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                        >
                            Mês Atual
                        </button>
                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 cursor-pointer"
                            />
                            <span className="text-muted-foreground">/</span>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <button className="p-3 bg-white/5 text-white rounded-xl border border-white/5 hover:bg-white/10 transition-all shadow-sm group">
                        <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            {activeTab === 'insights' ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="card-dark p-6 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Receita</span>
                            </div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Faturamento Total</p>
                            <h3 className="text-2xl font-black text-foreground">{formatCurrency(summary?.totalRevenue || 0)}</h3>
                            <p className="text-[10px] text-emerald-500 mt-2 font-bold">Total em vendas confirmadas</p>
                        </div>

                        <div className="card-dark p-6 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                    <PieChart size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full uppercase">Lucro</span>
                            </div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Lucro Bruto (Margem)</p>
                            <h3 className="text-2xl font-black text-foreground">{formatCurrency(summary?.netProfit || 0)}</h3>
                            <p className="text-[10px] text-muted-foreground mt-2">Descontando custos de produção</p>
                        </div>

                        <div className="card-dark p-6 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Calendar size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Pendente</span>
                            </div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">A Receber</p>
                            <h3 className="text-2xl font-black text-foreground">{formatCurrency(summary?.pendingReceivables || 0)}</h3>
                            <p className="text-[10px] text-muted-foreground mt-2">Vendas não faturadas/pagas</p>
                        </div>

                        <div className="card-dark p-6 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-400/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Package size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full uppercase">Média</span>
                            </div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Ticket Médio</p>
                            <h3 className="text-2xl font-black text-foreground">{formatCurrency(summary?.averageTicket || 0)}</h3>
                            <p className="text-[10px] text-muted-foreground mt-2">Valor médio por trabalho</p>
                        </div>

                        <div className="card-dark p-6 border-2 border-primary/20 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">4% LUCRO</span>
                            </div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Comissão do Mês (Sugerida)</p>
                            <h3 className="text-2xl font-black text-primary">{formatCurrency(summary?.commission || 0)}</h3>
                            <p className="text-[10px] text-muted-foreground mt-2">Base: 4% de {formatCurrency(summary?.netProfit || 0)}</p>
                            <div className="absolute top-0 right-0 p-1">
                                <ArrowUpRight size={40} className="text-primary opacity-5" />
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sales Trends */}
                        <div className="lg:col-span-2 card-dark p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Tendência de Faturamento</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Comparativo mensal de receita e volume</p>
                                </div>
                                <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition-all">
                                    <option>Últimos 6 meses</option>
                                    <option>Este ano</option>
                                </select>
                            </div>
                            <div className="h-[400px] w-full min-h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickMargin={10} />
                                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Distribution by Type */}
                        <div className="card-dark p-8 flex flex-col items-center">
                            <div className="w-full mb-8 text-center lg:text-left">
                                <h3 className="text-lg font-bold text-foreground">Distribuição por Tipo</h3>
                                <p className="text-xs text-muted-foreground mt-1">Mix de produção (OFF vs PRODUZIDO)</p>
                            </div>
                            <div className="h-[300px] w-full relative flex items-center justify-center">
                                <div className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={metrics?.byType || []}
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={8}
                                                dataKey="_count"
                                                nameKey="tipo"
                                                animationBegin={0}
                                                animationDuration={1500}
                                                cx="50%"
                                                cy="50%"
                                            >
                                                {metrics?.byType?.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                                            />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                                    <span className="text-3xl font-black text-foreground leading-none">{metrics?.byType?.reduce((acc, curr) => acc + curr._count, 0) || 0}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Produções</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                {metrics?.byType?.map((type, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{type.tipo}</span>
                                        <span className="text-[10px] font-black text-white ml-auto">{type._count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Top Clients & Recent Orders Performance */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* Top Clients Table */}
                        <div className="card-dark overflow-hidden">
                            <div className="p-8 border-b border-border">
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Users size={20} className="text-primary" />
                                    Top 10 Clientes (Performance)
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Ranking por faturamento total acumulado</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                            <th className="px-8 py-4">Cliente</th>
                                            <th className="px-4 py-4 text-center">Pedidos</th>
                                            <th className="px-8 py-4 text-right">Total Investido</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {topClients.map((client, i) => (
                                            <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                                                            {i + 1}
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{client.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-xs font-mono text-muted-foreground">{client.orderCount}</span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <span className="text-sm font-black text-white">{formatCurrency(client.totalRevenue)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Status Breakdown & Growth */}
                        <div className="card-dark p-8 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-8">Saúde do Pipeline</h3>
                                <div className="space-y-6">
                                    {metrics?.byStatus?.map((status, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{status.status}</span>
                                                <span className="text-xs font-black text-white">{status._count}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary shadow-glow-primary transition-all duration-1000"
                                                    style={{ width: `${(status._count / metrics?.byStatus?.reduce((acc, curr) => acc + curr._count, 0)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="text-sm font-bold text-primary mb-1">Dica de Crescimento</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {summary?.averageTicket < 500
                                            ? "Seu ticket médio está abaixo de R$ 500,00. Considere criar pacotes de áudio para aumentar o valor por trabalho."
                                            : "Excelente ticket médio! Foco agora em aumentar a recorrência dos seus Top 10 clientes."}
                                    </p>
                                </div>
                                <div className="absolute -right-4 -bottom-4 opacity-10">
                                    <TrendingUp size={100} className="text-primary" />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="card-dark overflow-hidden">
                        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold text-foreground">Gestão de Cachês</h3>
                                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setCacheStatusFilter('pending')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${cacheStatusFilter === 'pending' ? 'bg-amber-500 text-black' : 'text-muted-foreground hover:text-white'}`}
                                    >
                                        Pendentes
                                    </button>
                                    <button
                                        onClick={() => setCacheStatusFilter('paid')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${cacheStatusFilter === 'paid' ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:text-white'}`}
                                    >
                                        Pagos (Lançados)
                                    </button>
                                    <button
                                        onClick={() => setCacheStatusFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${cacheStatusFilter === 'all' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
                                    >
                                        Todos
                                    </button>
                                </div>

                                <div className="relative ml-2">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all w-[240px]"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div >

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Pendente</p>
                                    <p className="text-xl font-black text-amber-500">
                                        {formatCurrency(cacheData.reduce((acc, curr) => acc + curr.pendingValue, 0))}
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-white/10"></div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Pago</p>
                                    <p className="text-xl font-black text-emerald-500">
                                        {formatCurrency(cacheData.reduce((acc, curr) => acc + curr.paidValue, 0))}
                                    </p>
                                </div>
                            </div>
                        </div >

                        {loadingCaches && <Loader2 size={18} className="animate-spin text-primary m-6" />}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b border-border">
                                        <th className="px-6 py-4 w-[100px]">Data</th>
                                        <th className="px-6 py-4 w-[80px]">Pedido</th>
                                        <th className="px-6 py-4">Locutor (Nome Real)</th>
                                        <th className="px-6 py-4">Título</th>
                                        <th className="px-6 py-4 text-right w-[120px]">Valor</th>
                                        <th className="px-6 py-4 text-center w-[100px]">Lançado?</th>
                                        <th className="px-6 py-4 text-center w-[120px]">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(() => {
                                        // Flatten and filter by search
                                        const flatList = cacheData.flatMap(locutor =>
                                            locutor.orders.map(order => ({
                                                ...order,
                                                locutorName: locutor.name,
                                                locutorRealName: locutor.realName,
                                                locutorId: locutor.locutorId
                                            }))
                                        ).filter(item => {
                                            if (!searchTerm) return true;
                                            const search = searchTerm.toLowerCase();
                                            return (
                                                item.title?.toLowerCase().includes(search) ||
                                                item.locutorName?.toLowerCase().includes(search) ||
                                                item.locutorRealName?.toLowerCase().includes(search) ||
                                                item.numeroVenda?.toString().includes(search) ||
                                                item.sequentialId?.toString().includes(search)
                                            );
                                        }).sort((a, b) => new Date(b.date) - new Date(a.date));

                                        const filteredList = flatList.filter(item => {
                                            // If just toggled, keep it visible regardless of filter tab
                                            if (justToggledIds.has(item.id)) return true;

                                            if (cacheStatusFilter === 'pending') return !item.paid;
                                            if (cacheStatusFilter === 'paid') return item.paid;
                                            return true;
                                        });

                                        if (filteredList.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-20 text-center text-muted-foreground text-sm italic">
                                                        Nenhum registro encontrado para este filtro.
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return filteredList.map((item) => (
                                            <tr key={item.id} className={`hover:bg-white/5 transition-colors group ${item.paid ? 'opacity-60 hover:opacity-100' : ''}`}>
                                                <td className="px-6 py-3">
                                                    <span className="text-xs font-mono text-muted-foreground">
                                                        {formatDisplayDate(item.date)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="text-xs font-black text-white bg-white/5 px-2 py-1 rounded">
                                                        {item.numeroVenda || item.sequentialId || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground">
                                                            {item.locutorRealName || item.locutorName}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            ({item.locutorName})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="text-xs text-foreground font-medium line-clamp-1" title={item.title}>
                                                        {item.title}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className={`text-sm font-bold ${item.paid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {formatCurrency(item.value)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <button
                                                            onClick={() => handleMarkCacheAsPaid(item.id, item.paid)}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.paid
                                                                ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'
                                                                : (item.isCachePrePaid
                                                                    ? 'bg-blue-500/10 text-blue-400 hover:bg-emerald-500/20 hover:text-emerald-500 border border-blue-500/30'
                                                                    : 'bg-white/5 text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-500')
                                                                }`}
                                                            title={item.paid
                                                                ? "Marcar como Pendente"
                                                                : (item.isCachePrePaid ? "Pré-Pago pelo Atendimento (Clique para Lançar/Confirmar)" : "Marcar como Lançado/Pago")}
                                                        >
                                                            {item.paid ? <CheckCircle2 size={18} /> : (item.isCachePrePaid ? <CheckCircle2 size={18} className="opacity-50" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground group-hover:border-emerald-500" />)}
                                                        </button>

                                                        {/* Info Display */}
                                                        {(item.paid || item.isCachePrePaid) && (item.paymentDate || item.bank) && (
                                                            <div className="flex flex-col items-center">
                                                                {item.paymentDate && (
                                                                    <span className={`text-[10px] font-medium ${item.paid ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                                        {new Date(item.paymentDate).toLocaleDateString('pt-BR')}
                                                                    </span>
                                                                )}
                                                                {item.bank && (
                                                                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                                                                        {item.bank}
                                                                    </span>
                                                                )}
                                                                {!item.paid && item.isCachePrePaid && (
                                                                    <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1 rounded uppercase tracking-widest mt-0.5">
                                                                        Pré-Pago
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <button
                                                        onClick={() => {
                                                            const textToCopy = `${item.numeroVenda || item.sequentialId || '?'} - ${item.title} (${formatCurrency(item.value)})`;
                                                            handleCopyTitle(textToCopy, item.id);
                                                        }}
                                                        className={`p-2 rounded-lg transition-all flex items-center justify-center gap-2 w-full ${copiedId === item.id ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary'}`}
                                                        title="Copiar para Área de Transferência"
                                                    >
                                                        {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                                            {copiedId === item.id ? 'COPIADO' : 'COPIAR'}
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div >
                </div >
            )}
        </div >
    );
};

export default Relatorios;
