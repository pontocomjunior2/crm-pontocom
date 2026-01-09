import { TrendingUp, TrendingDown, DollarSign, Package, Users, Headphones } from 'lucide-react';
import { Card } from './ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const metrics = [
    {
      title: 'Receita Total',
      value: 'R$ 100,00',
      change: '+41%',
      changeType: 'positive',
      subtitle: 'Vs. mês passado',
      icon: DollarSign,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Pedidos',
      value: '0',
      change: 'EM PRODUÇÃO',
      changeType: 'neutral',
      subtitle: 'em produção',
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Vendas',
      value: 'R$ 50,00',
      change: '50%',
      changeType: 'positive',
      subtitle: 'Vs. mês / receita',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Clientes Ativos',
      value: '1522',
      change: '+1 clientes totais',
      changeType: 'positive',
      subtitle: 'clientes totais',
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  const recentOrders = [
    {
      id: 'Pedido Teste',
      customer: 'MUKECA FILMES',
      status: 'EM ABERTO',
      statusColor: 'bg-blue-500/20 text-blue-400',
      product: 'Pacote P 0025',
      time: 'há 1 dia atrás',
    },
  ];

  const performanceData = [
    { month: 'Jan', receita: 45000, custos: 32000 },
    { month: 'Fev', receita: 52000, custos: 35000 },
    { month: 'Mar', receita: 48000, custos: 33000 },
    { month: 'Abr', receita: 61000, custos: 38000 },
    { month: 'Mai', receita: 55000, custos: 36000 },
    { month: 'Jun', receita: 67000, custos: 40000 },
  ];

  const statusData = [
    { name: 'Entregue', value: 45, color: '#10b981' },
    { name: 'Preparação', value: 25, color: '#f59e0b' },
    { name: 'Pendente', value: 20, color: '#3dd9d0' },
    { name: 'Cancelado', value: 10, color: '#ef4444' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="p-6 bg-card border-border hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {metric.changeType === 'positive' && (
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  )}
                  {metric.changeType === 'negative' && (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span
                    className={
                      metric.changeType === 'positive'
                        ? 'text-emerald-500'
                        : metric.changeType === 'negative'
                        ? 'text-red-500'
                        : 'text-primary'
                    }
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                <p className="text-2xl text-foreground mb-1">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="col-span-2 p-6 bg-card border-border">
          <div className="mb-6">
            <h3 className="text-foreground mb-1">Performance Mensal</h3>
            <p className="text-sm text-muted-foreground">Comparativo de receita e custos</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCustos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffa500" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ffa500" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" />
              <XAxis dataKey="month" stroke="#8b92a8" />
              <YAxis stroke="#8b92a8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="#ff6b35"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReceita)"
              />
              <Area
                type="monotone"
                dataKey="custos"
                stroke="#ffa500"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCustos)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6 bg-card border-border">
          <div className="mb-6">
            <h3 className="text-foreground mb-1">Status de Pedidos</h3>
            <p className="text-sm text-muted-foreground">Distribuição atual</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(61, 217, 208, 0.3)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Orders and Pending Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="col-span-2 p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-foreground mb-1">Pedidos Recentes</h3>
              <p className="text-sm text-muted-foreground">Últimas movimentações</p>
            </div>
            <button className="text-sm text-primary hover:underline">VER TODOS</button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg border border-border hover:border-primary/30 transition-all"
              >
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-foreground">{order.id}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${order.statusColor}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.customer} • {order.product}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{order.time}</p>
                </div>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all">
              + VER TODOS OS PEDIDOS
            </button>
          </div>
        </Card>

        {/* Pending Invoices */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="mb-6">
            <h3 className="text-foreground mb-1">Pendentes de Faturamento</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-card/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">MUKECA FILMES</p>
              <p className="text-foreground mb-1">1 pedidos</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">FATURAS AGORA:</p>
                  <p className="text-sm text-foreground">Total Pendente</p>
                </div>
                <p className="text-primary">R$ 100,00</p>
              </div>
            </div>
            <div className="p-4 bg-card/50 rounded-lg border border-border">
              <p className="text-2xl text-foreground mb-2">R$ 8.350,00</p>
              <p className="text-xs text-muted-foreground">Total em aberto</p>
            </div>
            <button className="w-full py-3 bg-primary text-black rounded-lg hover:bg-primary/90 transition-all">
              + PROCESSAR TODOS
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}