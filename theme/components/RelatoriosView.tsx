import { BarChart3, TrendingUp, Download } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function RelatoriosView() {
  const monthlyData = [
    { month: 'Jan', vendas: 45000, pedidos: 23, clientes: 12 },
    { month: 'Fev', vendas: 52000, pedidos: 28, clientes: 15 },
    { month: 'Mar', vendas: 48000, pedidos: 25, clientes: 13 },
    { month: 'Abr', vendas: 61000, pedidos: 32, clientes: 18 },
    { month: 'Mai', vendas: 55000, pedidos: 29, clientes: 16 },
    { month: 'Jun', vendas: 67000, pedidos: 35, clientes: 21 },
    { month: 'Jul', vendas: 72000, pedidos: 38, clientes: 23 },
    { month: 'Ago', vendas: 69000, pedidos: 36, clientes: 22 },
  ];

  const productData = [
    { category: 'GF', value: 45 },
    { category: 'CF', value: 30 },
    { category: 'CAFÉ', value: 15 },
    { category: 'OFF', value: 10 },
  ];

  const performanceData = [
    { name: 'MUKECA FILMES', receita: 45320, pedidos: 15 },
    { name: 'Media Corp', receita: 95780, pedidos: 31 },
    { name: 'Produtora XYZ', receita: 68900, pedidos: 23 },
    { name: 'Digital House', receita: 57600, pedidos: 19 },
    { name: 'Creative Studio', receita: 38200, pedidos: 12 },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-1">Relatórios</h2>
          <p className="text-sm text-muted-foreground">Análises e insights do negócio</p>
        </div>
        <Button className="gap-2 bg-primary text-black hover:bg-primary/90">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-xs text-emerald-500">+24%</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Crescimento Mensal</p>
          <p className="text-2xl text-foreground">24%</p>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-xs text-emerald-500">+18%</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
          <p className="text-2xl text-foreground">R$ 1.890</p>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-muted-foreground">+12%</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Taxa de Conversão</p>
          <p className="text-2xl text-foreground">67%</p>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-xs text-emerald-500">+8%</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Margem Média</p>
          <p className="text-2xl text-foreground">25%</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="p-6 bg-card border-border">
          <div className="mb-6">
            <h3 className="text-foreground mb-1">Evolução de Vendas</h3>
            <p className="text-sm text-muted-foreground">Receita mensal em R$</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
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
                dataKey="vendas"
                stroke="#ff6b35"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVendas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Orders and Clients */}
        <Card className="p-6 bg-card border-border">
          <div className="mb-6">
            <h3 className="text-foreground mb-1">Pedidos & Clientes</h3>
            <p className="text-sm text-muted-foreground">Quantidade mensal</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" />
              <XAxis dataKey="month" stroke="#8b92a8" />
              <YAxis stroke="#8b92a8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(61, 217, 208, 0.3)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="pedidos"
                stroke="#3dd9d0"
                strokeWidth={2}
                name="Pedidos"
              />
              <Line
                type="monotone"
                dataKey="clientes"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Clientes"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Clients */}
        <Card className="p-6 bg-card border-border">
          <div className="mb-6">
            <h3 className="text-foreground mb-1">Top Clientes</h3>
            <p className="text-sm text-muted-foreground">Por receita gerada</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" />
              <XAxis type="number" stroke="#8b92a8" />
              <YAxis dataKey="name" type="category" stroke="#8b92a8" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(61, 217, 208, 0.3)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="receita" fill="#ff6b35" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Product Distribution */}
        <Card className="p-6 bg-card border-border">
          <div className="mb-6">
            <h3 className="text-foreground mb-1">Distribuição de Produtos</h3>
            <p className="text-sm text-muted-foreground">Por categoria</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" />
              <XAxis dataKey="category" stroke="#8b92a8" />
              <YAxis stroke="#8b92a8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(61, 217, 208, 0.3)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#3dd9d0" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}