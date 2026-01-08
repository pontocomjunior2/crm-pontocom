import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Search,
  Mic2,
  DollarSign,
  Clock,
  Bell,
  ShoppingCart,
  TrendingUp,
  Package,
  FileSpreadsheet,
  BarChart3,
  Plus,
  ChevronRight,
  Headphones,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import ClientForm from './components/ClientForm';
import OrderForm from './components/OrderForm';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showClientForm, setShowClientForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Dashboard Metrics - Audio Production Specific
  const stats = [
    {
      title: 'Receita Total',
      value: 'R$ 84.750',
      trend: '+12.5%',
      sub: 'vs mês anterior',
      icon: <DollarSign size={20} />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-500'
    },
    {
      title: 'Pedidos Ativos',
      value: '28',
      trend: '+8.2%',
      sub: 'em produção',
      icon: <Package size={20} />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    {
      title: 'Custos com Cachê',
      value: 'R$ 18.200',
      trend: '+5.3%',
      sub: 'margem 78%',
      icon: <Headphones size={20} />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500'
    },
    {
      title: 'Clientes Ativos',
      value: '142',
      trend: '+15.1%',
      sub: '12 novos',
      icon: <Users size={20} />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500'
    },
  ];

  // Recent Orders
  const recentOrders = [
    {
      id: 'PED-1284',
      client: 'Rádio Bandeirantes',
      title: 'Spot Promoção Black Friday',
      type: 'PRODUZIDO',
      locutor: 'Vini Almeida',
      status: 'NOVO',
      time: '5min atrás',
      value: 'R$ 850,00',
      statusColor: 'badge-novo'
    },
    {
      id: 'PED-1283',
      client: 'Supermercados Pão de Açúcar',
      title: 'Locução OFF Institucional',
      type: 'OFF',
      locutor: 'Marcela Santos',
      status: 'EM PRODUÇÃO',
      time: '1h atrás',
      value: 'R$ 450,00',
      statusColor: 'badge-producao'
    },
    {
      id: 'PED-1282',
      client: 'Banco Itaú',
      title: 'Campanha Crédito Consignado',
      type: 'PRODUZIDO',
      locutor: 'Edu Martins',
      status: 'ENTREGUE',
      time: '3h atrás',
      value: 'R$ 1.200,00',
      statusColor: 'badge-entregue'
    },
    {
      id: 'PED-1281',
      client: 'Farmácias São Paulo',
      title: 'Espera Telefônica',
      type: 'PRODUZIDO',
      locutor: 'Alyssa Rodrigues',
      status: 'FATURADO',
      time: '5h atrás',
      value: 'R$ 680,00',
      statusColor: 'badge-faturado'
    },
  ];

  // Pending Invoices
  const pendingInvoices = [
    {
      client: 'Rádio Jovem Pan',
      orders: 3,
      total: 'R$ 2.450,00',
      dueDate: 'Hoje',
      priority: 'high'
    },
    {
      client: 'TV Globo',
      orders: 5,
      total: 'R$ 4.800,00',
      dueDate: 'Amanhã',
      priority: 'high'
    },
    {
      client: 'Magazine Luiza',
      orders: 2,
      total: 'R$ 1.100,00',
      dueDate: '15/01',
      priority: 'medium'
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0F0F0F] p-4 lg:p-6 gap-4 lg:gap-6 justify-center overflow-hidden font-body">

      {/* Wrapper de Largura Máxima */}
      <div className="flex w-full max-w-[1800px] gap-4 lg:gap-6 h-full">

        {/* SIDEBAR */}
        <aside className="w-72 glass-sidebar rounded-3xl flex flex-col p-6 shadow-2xl transition-all duration-300 hover:shadow-orange-500/5 flex-shrink-0">

          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-orange transition-transform hover:scale-105">
              <Mic2 size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold font-display tracking-tight text-white leading-tight">Pontocom</span>
              <span className="text-[10px] gradient-text font-black uppercase tracking-widest mt-0.5">Audio CRM</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={18} />, count: 28 },
              { id: 'clientes', label: 'Clientes', icon: <Users size={18} />, count: 142 },
              { id: 'locutores', label: 'Locutores', icon: <Headphones size={18} /> },
              { id: 'faturamento', label: 'Faturamento', icon: <FileText size={18} />, badge: 'new' },
              { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 size={18} /> },
              { id: 'configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'clientes') setShowClientForm(true);
                  if (item.id === 'pedidos') setShowOrderForm(true);
                }}
                className={`sidebar-item w-full group ${activeTab === item.id ? 'active' : ''}`}
              >
                <span className={`transition-colors ${activeTab === item.id ? 'text-[#FF9500]' : 'text-[#999999] group-hover:text-[#DDDDDD]'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left text-[13px] font-medium tracking-wide">
                  {item.label}
                </span>
                {item.count && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${activeTab === item.id
                    ? 'bg-[#FF9500]/20 text-[#FF9500]'
                    : 'bg-white/5 text-[#666666]'
                    }`}>
                    {item.count}
                  </span>
                )}
                {item.badge === 'new' && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-primary text-white uppercase tracking-wider">
                    Novo
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="mt-auto space-y-3">
            <button
              onClick={() => setShowOrderForm(true)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span className="text-xs">Novo Pedido</span>
            </button>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-2 glow-orange">
                <Bell size={14} className="text-white" />
              </div>
              <p className="text-[10px] text-[#999999] mb-2">Suporte Técnico</p>
              <button className="text-[10px] font-bold text-[#FF9500] hover:text-[#FFa520] transition-colors">
                Abrir Chamado
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 card-elevated rounded-3xl flex flex-col overflow-hidden">

          {/* Header */}
          <header className="h-20 px-8 border-b divider-dark flex items-center justify-between flex-shrink-0 bg-[#161616]/50">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white font-display tracking-tight text-shadow">Visão Geral</h1>
              <span className="text-xs text-[#999999] font-medium">Bem-vindo de volta, Júnior 👋</span>
            </div>

            {/* Search Bar */}
            <div className="hidden lg:flex search-dark">
              <Search size={16} className="text-[#666666]" />
              <input
                type="text"
                placeholder="Pesquisar pedidos, clientes, locutores..."
                className="bg-transparent border-none outline-none text-sm text-[#DDDDDD] placeholder:text-[#666666] w-full"
              />
              <span className="text-[10px] font-bold text-[#666666] border border-white/10 px-1.5 py-0.5 rounded">⌘K</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <button className="relative text-[#999999] hover:text-[#DDDDDD] transition-colors p-2 hover:bg-white/5 rounded-full">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF5E3A] rounded-full border border-[#161616] animate-pulse"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l divider-dark">
                <div className="text-right hidden xl:block">
                  <span className="block text-sm font-bold text-white leading-none">Admin User</span>
                  <span className="text-[10px] text-[#666666] font-medium uppercase tracking-wide">Pontocom</span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg glow-orange cursor-pointer hover:scale-105 transition-transform">
                  AD
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0F0F0F]">
            <div className="p-8 space-y-8 max-w-[1400px] mx-auto">

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in">
                {stats.map((stat, i) => (
                  <div key={i} className="card-dark p-6 group cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider block mb-2">
                          {stat.title}
                        </span>
                        <h3 className="text-3xl font-bold text-white mb-1 text-shadow">
                          {stat.value}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded ${stat.trend.includes('+')
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                            }`}>
                            {stat.trend}
                          </span>
                          <span className="text-[11px] text-[#666666] font-medium">{stat.sub}</span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor} ${stat.textColor} group-hover:scale-110 transition-transform`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className={`h-1 rounded-full bg-gradient-to-r ${stat.color} opacity-50`}></div>
                  </div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Recent Orders - 2 columns */}
                <div className="xl:col-span-2 card-dark p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Pedidos Recentes</h3>
                      <p className="text-xs text-[#666666]">Últimas atividades de produção</p>
                    </div>
                    <button className="text-xs font-bold gradient-text hover:opacity-80 transition-opacity uppercase tracking-wide flex items-center gap-1">
                      Ver todos
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {recentOrders.map((order, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-white/0 hover:border-white/10">
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md glow-orange">
                          <Mic2 size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-white group-hover:text-[#FF9500] transition-colors truncate">
                              {order.title}
                            </h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 text-[#666666] uppercase">
                              {order.type}
                            </span>
                          </div>
                          <p className="text-xs text-[#666666] mb-1">
                            {order.client} • {order.locutor}
                          </p>
                          <p className="text-[10px] text-[#999999]">{order.id}</p>
                        </div>
                        <div className="text-right">
                          <span className={`block ${order.statusColor} mb-2`}>
                            {order.status}
                          </span>
                          <span className="block text-sm font-bold text-white mb-1">{order.value}</span>
                          <span className="text-[10px] text-[#666666] font-medium">{order.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-6 py-3 btn-secondary flex items-center justify-center gap-2">
                    <FileSpreadsheet size={16} />
                    <span className="text-xs">Ver Todos os Pedidos</span>
                  </button>
                </div>

                {/* Pending Invoices - 1 column */}
                <div className="card-dark p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">Pendentes de Faturamento</h3>
                    <p className="text-xs text-[#666666]">Pedidos prontos para faturar</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    {pendingInvoices.map((invoice, i) => (
                      <div key={i} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute left-0 top-2 w-3 h-3 rounded-full border-2 border-[#161616] ${invoice.priority === 'high' ? 'bg-[#FF5E3A]' : 'bg-[#FF9500]'
                          } shadow-lg`}></div>

                        <div className="pl-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider flex items-center gap-2">
                              {invoice.priority === 'high' && <AlertCircle size={12} className="text-[#FF5E3A]" />}
                              {invoice.dueDate}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-2">{invoice.client}</h4>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#999999]">{invoice.orders} pedidos</span>
                            <span className="text-sm font-bold text-[#FF9500]">{invoice.total}</span>
                          </div>
                          <button className="text-[10px] font-bold gradient-text hover:opacity-80 transition-opacity uppercase tracking-wide">
                            Faturar agora →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t divider-dark pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#666666] font-medium">Total Pendente</span>
                      <span className="text-lg font-bold text-white">R$ 8.350,00</span>
                    </div>
                    <button className="w-full btn-primary mt-3 flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} />
                      <span className="text-xs">Processar Todos</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Performance Chart Placeholder */}
              <div className="card-dark p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Performance Mensal</h3>
                    <p className="text-xs text-[#666666]">Comparativo de receita e custos</p>
                  </div>
                  <div className="flex gap-2">
                    {['30D', '90D', '1A'].map((period) => (
                      <button key={period} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/5 text-[#666666] hover:bg-white/10 hover:text-[#DDDDDD] transition-all">
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="h-64 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp size={48} className="text-[#FF9500] mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-[#666666]">Gráfico de performance será implementado</p>
                    <p className="text-xs text-[#666666] mt-1">Chart.js ou Recharts</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </main>
      </div>

      {/* Form Modals */}
      {showClientForm && (
        <ClientForm
          onClose={() => setShowClientForm(false)}
          onSuccess={() => {
            setShowClientForm(false);
            // Refresh client list if needed
          }}
        />
      )}

      {showOrderForm && (
        <OrderForm
          onClose={() => setShowOrderForm(false)}
          onSuccess={() => {
            setShowOrderForm(false);
            // Refresh order list if needed
          }}
        />
      )}
    </div>
  );
};

export default App;
