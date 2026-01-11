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
    Filter,
    ArrowUpDown,
    CheckCircle2,
    Clock,
    User,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { analyticsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const Relatorios = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [topClients, setTopClients] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const query = (dateRange.startDate || dateRange.endDate)
                ? `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
                : '';

            const [sumData, trendData, clientData, perfData] = await Promise.all([
                analyticsAPI.getFinancialSummary(query),
                analyticsAPI.getSalesTrends(),
                analyticsAPI.getTopClients(),
                analyticsAPI.getPerformanceMetrics()
            ]);

            setSummary(sumData);
            setTrends(trendData);
            setTopClients(clientData);
            setMetrics(perfData);
        } catch (error) {
            console.error('Error fetching reports data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    if (loading && !summary) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <Loader2 size={48} className="text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Gerando relatórios inteligentes...</p>
            </div>
        );
    }

    const COLORS = ['#FB923C', '#22D3EE', '#818CF8', '#A78BFA', '#F472B6'];

    return (
        <div className="flex-1 h-full flex flex-col p-6 overflow-y-auto custom-scrollbar bg-background">
            <div className="max-w-[1400px] mx-auto w-full space-y-8 pb-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
                            <TrendingUp className="text-primary" size={32} />
                            Relatórios & Inteligência
                        </h2>
                        <p className="text-muted-foreground text-sm">Acompanhe a saúde financeira e performance do seu negócio em tempo real</p>
                    </div>

                    <div className="flex items-center gap-3 bg-card border border-border p-2 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 px-3 border-r border-border">
                            <Calendar size={16} className="text-primary" />
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="bg-transparent border-none outline-none text-xs text-foreground"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="bg-transparent border-none outline-none text-xs text-foreground"
                            />
                        </div>
                        <button
                            onClick={fetchData}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-xl transition-all"
                        >
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card-dark p-6 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">+12.5%</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Faturamento Total</p>
                        <h3 className="text-2xl font-black text-foreground">{formatCurrency(summary?.totalRevenue || 0)}</h3>
                        <p className="text-[10px] text-muted-foreground mt-2">{summary?.orderCount} pedidos finalizados</p>
                    </div>

                    <div className="card-dark p-6 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                <ArrowUpRight size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">MARGEM: {Math.round((summary?.netProfit / summary?.totalRevenue) * 100) || 0}%</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Lucro Estimado (Líquido)</p>
                        <h3 className="text-2xl font-black text-foreground">{formatCurrency(summary?.netProfit || 0)}</h3>
                        <p className="text-[10px] text-muted-foreground mt-2">Descontando R$ {Math.round(summary?.totalCosts)} de cachês</p>
                    </div>

                    <div className="card-dark p-6 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <Clock size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">PENDENTE</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Contas a Receber</p>
                        <h3 className="text-2xl font-black text-foreground">{formatCurrency(summary?.pendingReceivables || 0)}</h3>
                        <p className="text-[10px] text-muted-foreground mt-2">Aguardando faturamento/pagamento</p>
                    </div>

                    <div className="card-dark p-6 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                <Package size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">MÉDIA</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Ticket Médio</p>
                        <h3 className="text-2xl font-black text-foreground">{formatCurrency(summary?.averageTicket || 0)}</h3>
                        <p className="text-[10px] text-muted-foreground mt-2">Valor médio por trabalho</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Sales Trend Chart */}
                    <div className="lg:col-span-2 card-dark p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Tendência de Venda</h3>
                                <p className="text-xs text-muted-foreground">Evolução do faturamento mensal</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-primary shadow-glow-primary"></span>
                                <span className="text-[10px] font-bold text-muted-foreground">RECEITA</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#FB923C" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#666"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `R$ ${value / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#FB923C"
                                        strokeWidth={4}
                                        dot={{ fill: '#FB923C', strokeWidth: 2, r: 4, stroke: '#1A1A1A' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Performance Metrics (Pie) */}
                    <div className="card-dark p-8">
                        <h3 className="text-lg font-bold text-foreground mb-1">Distribuição de Tipo</h3>
                        <p className="text-xs text-muted-foreground mb-8">Preferência de formato pelos clientes</p>

                        <div className="h-[250px] w-full flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metrics?.byType?.map(t => ({ name: t.tipo, value: t._count })) || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {metrics?.byType?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-foreground">{metrics?.byType?.reduce((acc, curr) => acc + curr._count, 0)}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Produções</span>
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
                            <ArrowUpRight size={80} className="absolute -bottom-4 -right-4 text-primary opacity-5" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Relatorios;
