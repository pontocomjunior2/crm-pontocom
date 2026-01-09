import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Loader2
} from 'lucide-react';
import ClientForm from './components/ClientForm';
import OrderForm from './components/OrderForm';
import ClientList from './components/ClientList';
import OrderList from './components/OrderList';
import FaturamentoList from './components/FaturamentoList';
import LocutorList from './components/LocutorList';
import LocutorForm from './components/LocutorForm';
import { dashboardAPI } from './services/api';
import { formatCurrency } from './utils/formatters';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showClientForm, setShowClientForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showLocutorForm, setShowLocutorForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedLocutor, setSelectedLocutor] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoadingDashboard(true);
      try {
        const data = await dashboardAPI.get();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, [refreshTrigger]);

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowClientForm(true);
  };

  const handleAddNewClient = () => {
    setSelectedClient(null);
    setShowClientForm(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderForm(true);
  };

  const handleAddNewOrder = () => {
    setSelectedOrder(null);
    setShowOrderForm(true);
  };

  const handleEditLocutor = (locutor) => {
    setSelectedLocutor(locutor);
    setShowLocutorForm(true);
  };

  const handleAddNewLocutor = () => {
    setSelectedLocutor(null);
    setShowLocutorForm(true);
  };

  // Dashboard Metrics - Derived from real data
  const stats = dashboardData ? [
    {
      title: 'Receita Total',
      value: formatCurrency(dashboardData.metrics.totalRevenue),
      trend: '+0%', // Placeholder
      sub: 'acumulado total',
      icon: <DollarSign size={20} />,
      color: 'from-amber-400 to-amber-600',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-500'
    },
    {
      title: 'Pedidos Ativos',
      value: dashboardData.metrics.activeOrders.toString(),
      trend: 'ESTÁVEL',
      sub: 'em produção',
      icon: <Package size={20} />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    {
      title: 'Custos com Cachê',
      value: formatCurrency(dashboardData.metrics.totalCache),
      trend: `${Math.round((dashboardData.metrics.totalCache / dashboardData.metrics.totalRevenue) * 100 || 0)}%`,
      sub: 'em relação à receita',
      icon: <Headphones size={20} />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500'
    },
    {
      title: 'Clientes Ativos',
      value: dashboardData.metrics.activeClients.toString(),
      trend: '+1',
      sub: 'clientes totais',
      icon: <Users size={20} />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500'
    },
  ] : [];

  const recentOrders = dashboardData?.recentOrders || [];
  const pendingInvoices = dashboardData?.pendingInvoices || [];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-body text-foreground">

      {/* Wrapper - Reduced padding/gap to match reference */}
      <div className="flex w-full h-full">

        {/* SIDEBAR */}
        <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0">

          {/* Logo Section */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-foreground font-bold">Pontocom</h2>
                <p className="text-xs text-muted-foreground">Admin CRM</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
              { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={20} />, count: 28 },
              { id: 'clientes', label: 'Clientes', icon: <Users size={20} />, count: 142 },
              { id: 'locutores', label: 'Locutores', icon: <Headphones size={20} /> },
              { id: 'faturamento', label: 'Faturamento', icon: <DollarSign size={20} />, badge: 'NOVO' },
              { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 size={20} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                  }`}
              >
                {/* Clone element to force color inheritance if needed, standardizing size */}
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-left font-medium">
                  {item.label}
                </span>
                {item.count && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === item.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                    {item.count}
                  </span>
                )}
                {item.badge === 'NOVO' && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
                    NOVO
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom Menu */}
          <div className="p-4 border-t border-sidebar-border space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all">
              <Settings className="w-5 h-5" />
              <span>Configurações</span>
            </button>
            <div className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-t border-primary/20 mt-4 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Suporte Técnico</p>
                <button className="text-sm text-primary hover:underline font-bold">Abrir Chamado</button>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">

          {/* Header */}
          <header className="h-20 bg-card border-b border-border px-8 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground">
                {activeTab === 'dashboard' && 'Visão Geral'}
                {activeTab === 'clientes' && 'Clientes'}
                {activeTab === 'pedidos' && 'Pedidos'}
                {activeTab === 'locutores' && 'Locutores'}
                {activeTab === 'faturamento' && 'Faturamento'}
                {activeTab === 'relatorios' && 'Relatórios'}
              </h1>
              <span className="text-xs text-muted-foreground">Bem-vindo de volta, Júnior 👋</span>
            </div>

            {/* Search and Icons */}
            <div className="flex items-center gap-4">
              <div className="relative w-80 hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar pedidos, clientes..."
                  className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="text-right hidden xl:block">
                  <p className="text-sm text-foreground font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">PONTOCOM</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-sm text-white font-bold">AD</span>
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-background">
            {activeTab === 'dashboard' && (
              <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
                {loadingDashboard ? (
                  <div className="flex flex-col items-center justify-center h-[60vh]">
                    <Loader2 size={48} className="text-[#2DD4BF] animate-spin mb-4" />
                    <p className="text-[#94A3B8] font-medium">Carregando painel...</p>
                  </div>
                ) : !dashboardData ? (
                  <div className="flex flex-col items-center justify-center h-[60vh]">
                    <AlertCircle size={48} className="text-red-500 mb-4 opacity-50" />
                    <p className="text-[#666666] font-medium">Erro ao carregar dados do painel.</p>
                    <button onClick={() => setRefreshTrigger(prev => prev + 1)} className="mt-4 text-[#2DD4BF] hover:underline text-sm">
                      Tentar novamente
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in">
                      {stats.map((stat, i) => (
                        <div key={i} className="card-dark p-6 group cursor-pointer">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider block mb-2">
                                {stat.title}
                              </span>
                              <h3 className="text-3xl font-bold text-foreground mb-1">
                                {stat.value}
                              </h3>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${stat.trend.includes('+')
                                  ? 'bg-emerald-500/20 text-emerald-500'
                                  : 'text-foreground'
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
                            <h3 className="text-lg font-bold text-foreground mb-1">Pedidos Recentes</h3>
                            <p className="text-xs text-muted-foreground">Últimas atividades de produção</p>
                          </div>
                          <button className="text-xs font-bold gradient-text hover:opacity-80 transition-opacity uppercase tracking-wide flex items-center gap-1">
                            Ver todos
                            <ChevronRight size={14} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {recentOrders.map((order, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-white/0 hover:border-white/10">
                              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md glow-teal">
                                <Mic2 size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-bold text-white group-hover:text-[#2DD4BF] transition-colors truncate">
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
                                <span className="block text-sm font-bold text-foreground mb-1">{order.value}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">{order.time}</span>
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
                              <div className={`absolute left-0 top-2 w-3 h-3 rounded-full border-2 border-[#20293A] ${invoice.priority === 'high' ? 'bg-[#EF4444]' : 'bg-[#2DD4BF]'
                                } shadow-lg`}></div>

                              <div className="pl-6">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider flex items-center gap-2">
                                    {invoice.priority === 'high' && <AlertCircle size={12} className="text-[#EF4444]" />}
                                    {invoice.dueDate}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-white mb-2">{invoice.client}</h4>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-[#999999]">{invoice.orders} pedidos</span>
                                  <span className="text-sm font-bold text-[#2DD4BF]">{invoice.total}</span>
                                </div>
                                <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide">
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
                          <TrendingUp size={48} className="text-primary mx-auto mb-4 opacity-50" />
                          <p className="text-sm text-muted-foreground">Gráfico de performance será implementado</p>
                          <p className="text-xs text-muted-foreground mt-1">Chart.js ou Recharts</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'clientes' && (
              <div className="p-8 max-w-[1400px] mx-auto h-full flex flex-col">
                <ClientList
                  key={refreshTrigger}
                  onEditClient={handleEditClient}
                  onAddNewClient={handleAddNewClient}
                />
              </div>
            )}

            {activeTab === 'pedidos' && (
              <div className="p-8 max-w-[1400px] mx-auto h-full flex flex-col">
                <OrderList
                  key={refreshTrigger}
                  onEditOrder={handleEditOrder}
                  onAddNewOrder={handleAddNewOrder}
                  onNavigate={setActiveTab}
                />
              </div>
            )}

            {activeTab === 'locutores' && (
              <div className="p-8 max-w-[1400px] mx-auto h-full flex flex-col">
                <LocutorList
                  key={refreshTrigger}
                  onEditLocutor={handleEditLocutor}
                  onAddNewLocutor={handleAddNewLocutor}
                />
              </div>
            )}

            {activeTab === 'faturamento' && (
              <div className="p-8 max-w-[1400px] mx-auto h-full flex flex-col">
                <FaturamentoList
                  key={refreshTrigger}
                  onEditOrder={handleEditOrder}
                />
              </div>
            )}

            {activeTab !== 'dashboard' && activeTab !== 'clientes' && activeTab !== 'pedidos' && activeTab !== 'locutores' && activeTab !== 'faturamento' && (
              <div className="p-20 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Package size={40} className="text-[#444444]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Módulo em Desenvolvimento</h3>
                <p className="text-[#666666] max-w-xs mx-auto">
                  Esta página está sendo preparada para receber as funcionalidades do CRM Pontocom Audio.
                </p>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Form Modals */}
      {showClientForm && (
        <ClientForm
          client={selectedClient}
          onClose={() => {
            setShowClientForm(false);
            setSelectedClient(null);
          }}
          onSuccess={() => {
            setShowClientForm(false);
            setSelectedClient(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {showOrderForm && (
        <OrderForm
          order={selectedOrder}
          onClose={() => {
            setShowOrderForm(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setShowOrderForm(false);
            setSelectedOrder(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {showLocutorForm && (
        <LocutorForm
          locutor={selectedLocutor}
          onClose={() => {
            setShowLocutorForm(false);
            setSelectedLocutor(null);
          }}
          onSave={() => {
            setShowLocutorForm(false);
            setSelectedLocutor(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
};

export default App;
