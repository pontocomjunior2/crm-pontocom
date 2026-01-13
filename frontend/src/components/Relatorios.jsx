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
    ChevronDown,
    ChevronUp,
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
import { formatCurrency } from '../utils/formatters';

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
    const [selectedLocutorCache, setSelectedLocutorCache] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

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
        } finally {
            setLoadingCaches(false);
        }
    };

    const handleMarkCacheAsPaid = async (orderId) => {
        try {
            await orderAPI.update(orderId, { cachePago: true });
            // Refresh local state or re-fetch
            fetchCacheData();
        } catch (error) {
            console.error('Error marking cache as paid:', error);
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
        <div className="space-y-8 animate-in fade-in duration-700">
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
                                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
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
                /* Cache Management View */
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="card-dark p-6 lg:col-span-1">
                            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                <DollarSign size={20} className="text-primary" />
                                Resumo de Cachês
                            </h3>
                            <p className="text-xs text-muted-foreground mb-6">Valores residuais de locutores avulsos no período</p>

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total a Lançar</p>
                                    <h4 className="text-2xl font-black text-primary">
                                        {formatCurrency(cacheData.reduce((acc, curr) => acc + curr.pendingValue, 0))}
                                    </h4>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Locutores com Pendência</p>
                                    <h4 className="text-xl font-black text-white">{cacheData.length}</h4>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                                <p className="text-xs text-orange-200 leading-relaxed font-medium">
                                    <AlertCircle size={14} className="inline mr-2" />
                                    Locutores de pacote (Fornecedores) são pré-pagos e não são listados nesta reconciliação financeira.
                                </p>
                            </div>
                        </div>

                        <div className="lg:col-span-2 card-dark overflow-hidden">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <h3 className="text-lg font-bold text-foreground">Aguardando Lançamento Financeiro</h3>
                                {loadingCaches && <Loader2 size={18} className="animate-spin text-primary" />}
                            </div>
                            <div className="overflow-x-auto min-h-[300px]">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                            <th className="px-8 py-4">Locutor</th>
                                            <th className="px-4 py-4">Dados de Pagamento</th>
                                            <th className="px-4 py-4 text-center">Produções</th>
                                            <th className="px-8 py-4 text-right">Valor Pendente</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {cacheData.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-20 text-center text-muted-foreground text-sm italic">
                                                    Nenhum cachê pendente para o período selecionado.
                                                </td>
                                            </tr>
                                        ) : (
                                            cacheData.map((item) => (
                                                <tr key={item.locutorId} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-8 py-4">
                                                        <button
                                                            onClick={() => setSelectedLocutorCache(item)}
                                                            className="flex flex-col text-left group/name"
                                                        >
                                                            <span className="text-sm font-bold text-foreground group-hover/name:text-primary transition-colors underline-offset-4 decoration-primary/30 group-hover/name:underline decoration-2">{item.name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{item.orderCount} produções pendentes</span>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white font-mono uppercase">{item.pixType || 'PIX'}</span>
                                                                <span className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">{item.pixKey || 'Não cadastrado'}</span>
                                                            </div>
                                                            {item.bank && <span className="text-[10px] text-muted-foreground italic">{item.bank}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex -space-x-2">
                                                                {item.orders.slice(0, 3).map((order, idx) => (
                                                                    <div key={idx} className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[8px] font-bold text-primary" title={order.title}>
                                                                        {idx + 1}
                                                                    </div>
                                                                ))}
                                                                {item.orderCount > 3 && (
                                                                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                                                                        +{item.orderCount - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 text-right">
                                                        <span className="text-sm font-black text-white">{formatCurrency(item.pendingValue)}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {selectedLocutorCache && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-border animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{selectedLocutorCache.name}</h2>
                                <p className="text-xs text-muted-foreground mt-1">Detalhamento de produções pendentes</p>
                            </div>
                            <button
                                onClick={() => setSelectedLocutorCache(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Summary Info */}
                        <div className="p-4 bg-white/5 border-b border-border flex items-center justify-around text-center">
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Total Produções</p>
                                <p className="text-lg font-black text-primary">{selectedLocutorCache.orderCount}</p>
                            </div>
                            <div className="w-px h-8 bg-border" />
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Valor Total</p>
                                <p className="text-lg font-black text-white">{formatCurrency(selectedLocutorCache.pendingValue)}</p>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="space-y-3">
                                {selectedLocutorCache.orders.map((order) => (
                                    <div key={order.id} className="p-4 rounded-xl bg-white/5 border border-border hover:border-primary/30 transition-all group/item">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar size={12} className="text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground">{new Date(order.date).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-foreground truncate">
                                                    {order.numeroVenda ? `${order.numeroVenda} - ` : ''}{order.title.toUpperCase()} ({formatCurrency(order.value)})
                                                </h4>
                                            </div>
                                            <button
                                                onClick={() => handleCopyTitle(order.title, order.id)}
                                                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${copiedId === order.id ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary'}`}
                                                title="Copiar Título"
                                            >
                                                {copiedId === order.id ? (
                                                    <Check size={16} />
                                                ) : (
                                                    <Copy size={16} />
                                                )}
                                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                                    {copiedId === order.id ? 'Copiado!' : 'Copiar'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white/5 border-t border-border flex justify-end">
                            <button
                                onClick={() => setSelectedLocutorCache(null)}
                                className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all border border-border"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Relatorios;
