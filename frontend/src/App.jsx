import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Filter,
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
  AlertCircle,
  Loader2,
  Shield,
  LogOut,
  User as UserIcon,
  Building2
} from 'lucide-react';
import SupplierList from './components/SupplierList';
import ClientForm from './components/ClientForm';
import OrderForm from './components/OrderForm';
import ClientList from './components/ClientList';
import OrderList from './components/OrderList';
import FaturamentoList from './components/FaturamentoList';
import LocutorList from './components/LocutorList';
import LocutorForm from './components/LocutorForm';
import LocutorHistory from './components/LocutorHistory';
import UserList from './components/UserList';
import Relatorios from './components/Relatorios';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { dashboardAPI, STORAGE_URL } from './services/api';
import { formatCurrency } from './utils/formatters';

const CRM = () => {
  const { user, logout, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showClientForm, setShowClientForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showLocutorForm, setShowLocutorForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedLocutor, setSelectedLocutor] = useState(null);
  const [viewingLocutorHistory, setViewingLocutorHistory] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [initialOrderStatus, setInitialOrderStatus] = useState('PEDIDO');

  // Date Filter State
  const [dateRange, setDateRange] = useState({
    label: 'Últimos 30 dias',
    value: '30days',
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoadingDashboard(true);
      try {
        const query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
        const data = await dashboardAPI.get(query);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, [refreshTrigger, user, dateRange]);

  const handleDateFilterChange = (value) => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];
    let label = '';

    switch (value) {
      case '7days':
        start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        label = 'Últimos 7 dias';
        break;
      case '15days':
        start = new Date(today.setDate(today.getDate() - 15)).toISOString().split('T')[0];
        label = 'Últimos 15 dias';
        break;
      case '30days':
        start = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
        label = 'Últimos 30 dias';
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        label = 'Este Mês';
        break;
      case '12months':
        start = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
        label = 'Últimos 12 meses';
        break;
      case 'custom':
        setIsCustomDate(true);
        label = 'Período Personalizado';
        // Keep previous dates or reset? Let's keep current range if custom is clicked
        start = dateRange.start;
        end = dateRange.end;
        break;
      default:
        break;
    }

    if (value !== 'custom') {
      setIsCustomDate(false);
    }

    setDateRange({ label, value, start, end });
    if (value !== 'custom') setShowDateFilter(false);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="text-primary animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Dashboard Metrics
  const stats = dashboardData ? [
    {
      title: 'Receita Total',
      value: formatCurrency(dashboardData.metrics.totalRevenue),
      trend: '+0%',
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={20} /> },
    { id: 'clientes', label: 'Clientes', icon: <Users size={20} /> },
    { id: 'locutores', label: 'Locutores', icon: <Headphones size={20} /> },
    { id: 'fornecedores', label: 'Fornecedores', icon: <Building2 size={20} /> },
    { id: 'faturamento', label: 'Faturamento', icon: <DollarSign size={20} /> },
    { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 size={20} /> },
    { id: 'perfil', label: 'Meu Perfil', icon: <UserIcon size={20} /> },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'usuarios', label: 'Usuários', icon: <Shield size={20} /> });
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-body text-foreground">
      <div className="flex w-full h-full">
        <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0">
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-center">
              <img src="/logo_flat.png" alt="Pontocom Audio" className="w-40 md:w-48 object-contain" />
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                  }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-left font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all font-bold"
            >
              <LogOut size={20} />
              <span>SAIR</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <header className="h-14 bg-card border-b border-border px-6 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground leading-none">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h1>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Bem-vindo, {user.name} 👋</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-80 hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="text-right hidden xl:block">
                  <p className="text-sm text-foreground font-black tracking-tight">{user.name}</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{user.role}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-sm text-white font-black">{user.name.substring(0, 2).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 flex flex-col p-4 bg-background overflow-hidden relative">
            {activeTab === 'dashboard' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">

                  {/* Date Filter Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
                      <p className="text-muted-foreground text-sm">Acompanhe métricas de vendas e produção</p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors shadow-sm"
                      >
                        <Calendar size={16} className="text-primary" />
                        <span className="text-sm font-medium text-foreground">{dateRange.label}</span>
                        <Filter size={14} className="text-muted-foreground ml-2" />
                      </button>

                      {showDateFilter && (
                        <div className="absolute right-0 top-12 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 p-2 animate-in slide-in-from-top-2">
                          <div className="space-y-1 mb-2">
                            {[
                              { label: 'Últimos 7 dias', val: '7days' },
                              { label: 'Últimos 15 dias', val: '15days' },
                              { label: 'Últimos 30 dias', val: '30days' },
                              { label: 'Este Mês', val: 'thisMonth' },
                              { label: 'Últimos 12 meses', val: '12months' },
                              { label: 'Período Personalizado', val: 'custom' },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => handleDateFilterChange(opt.val)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${dateRange.value === opt.val ? 'bg-primary/20 text-primary font-bold' : 'text-foreground hover:bg-accent'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {isCustomDate && (
                            <div className="pt-2 border-t border-border space-y-2">
                              <div>
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Início</label>
                                <input
                                  type="date"
                                  value={dateRange.start}
                                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                  className="w-full bg-input-background border border-border rounded px-2 py-1 text-xs text-foreground"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Fim</label>
                                <input
                                  type="date"
                                  value={dateRange.end}
                                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                  className="w-full bg-input-background border border-border rounded px-2 py-1 text-xs text-foreground"
                                />
                              </div>
                              <button
                                onClick={() => setShowDateFilter(false)} // Just close, state is already updated onChange
                                className="w-full btn-primary py-1.5 text-xs rounded mt-2"
                              >
                                Aplicar Filtro
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {loadingDashboard ? (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                      <Loader2 size={48} className="text-primary animate-spin mb-4" />
                      <p className="text-muted-foreground font-medium">Carregando painel...</p>
                    </div>
                  ) : !dashboardData ? (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                      <AlertCircle size={48} className="text-red-500 mb-4 opacity-50" />
                      <p className="text-muted-foreground font-medium">Erro ao carregar dados do painel.</p>
                      <button onClick={() => setRefreshTrigger(prev => prev + 1)} className="mt-4 text-primary hover:underline text-sm">Tentar novamente</button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in">
                        {stats.map((stat, i) => (
                          <div key={i} className="card-dark p-6 group cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">{stat.title}</span>
                                <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${stat.trend.includes('+') ? 'bg-emerald-500/20 text-emerald-500' : 'text-foreground'}`}>{stat.trend}</span>
                                  <span className="text-[11px] text-muted-foreground font-medium">{stat.sub}</span>
                                </div>
                              </div>
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor} ${stat.textColor} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                            </div>
                            <div className={`h-1 rounded-full bg-gradient-to-r ${stat.color} opacity-50`}></div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 card-dark p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h3 className="text-lg font-bold text-foreground mb-1">Pedidos Recentes</h3>
                              <p className="text-xs text-muted-foreground">Últimas atividades de produção</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {recentOrders.map((order, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-white/0 hover:border-white/10">
                                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md glow-teal"><Mic2 size={18} /></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{order.title}</h4>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 text-muted-foreground uppercase">{order.type}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1">{order.client} • {order.locutor}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`block ${order.statusColor} mb-2 text-[10px] font-black uppercase`}>{order.status}</span>
                                  <span className="block text-sm font-bold text-foreground mb-1">{order.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="card-dark p-6">
                          <div className="mb-6">
                            <h3 className="text-lg font-bold text-white mb-1">Pendentes</h3>
                            <p className="text-xs text-muted-foreground">Faturamento pendente</p>
                          </div>
                          <div className="space-y-4 mb-6">
                            {pendingInvoices.map((invoice, i) => (
                              <div key={i} className="relative pl-6 border-l border-white/5">
                                <div className={`absolute -left-[6.5px] top-1.5 w-3 h-3 rounded-full border-2 border-background ${invoice.priority === 'high' ? 'bg-red-500' : 'bg-primary'}`}></div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{invoice.dueDate}</span>
                                <h4 className="text-sm font-bold text-white mb-1 truncate">{invoice.client}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">{invoice.orders} pedidos</span>
                                  <span className="text-sm font-bold text-primary">{invoice.total}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-white/5 pt-4">
                            <button onClick={() => setActiveTab('faturamento')} className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold">
                              <DollarSign size={16} />
                              IR PARA FATURAMENTO
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'clientes' && (
              <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
                <ClientList key={refreshTrigger} onEditClient={(c) => { setSelectedClient(c); setShowClientForm(true); }} onAddNewClient={() => { setSelectedClient(null); setShowClientForm(true); }} />
              </div>
            )}

            {activeTab === 'pedidos' && (
              <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
                <OrderList key={refreshTrigger} onEditOrder={(o) => { setSelectedOrder(o); setShowOrderForm(true); }} onAddNewOrder={(s) => { setSelectedOrder(null); setInitialOrderStatus(typeof s === 'string' ? s : 'PEDIDO'); setShowOrderForm(true); }} onNavigate={setActiveTab} />
              </div>
            )}

            {activeTab === 'locutores' && (
              <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
                {viewingLocutorHistory ? <LocutorHistory locutor={viewingLocutorHistory} onBack={() => setViewingLocutorHistory(null)} /> : <LocutorList key={refreshTrigger} onEditLocutor={(l) => { setSelectedLocutor(l); setShowLocutorForm(true); }} onAddNewLocutor={() => { setSelectedLocutor(null); setShowLocutorForm(true); }} onViewHistory={setViewingLocutorHistory} />}
              </div>
            )}

            {activeTab === 'fornecedores' && (
              <div className="flex-1 overflow-y-auto h-full w-full custom-scrollbar">
                <SupplierList />
              </div>
            )}

            {activeTab === 'faturamento' && (
              <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
                <FaturamentoList key={refreshTrigger} onEditOrder={(o) => { setSelectedOrder(o); setShowOrderForm(true); }} onAddNewOrder={(s) => { setSelectedOrder(null); setInitialOrderStatus(typeof s === 'string' ? s : 'VENDA'); setShowOrderForm(true); }} />
              </div>
            )}

            {activeTab === 'usuarios' && isAdmin && (
              <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
                <UserList />
              </div>
            )}

            {activeTab === 'perfil' && (
              <div className="flex-1 overflow-y-auto h-full w-full custom-scrollbar">
                <ProfilePage />
              </div>
            )}

            {activeTab === 'relatorios' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 h-full max-w-[1400px] mx-auto w-full">
                <Relatorios />
              </div>
            )}


            {!['dashboard', 'clientes', 'pedidos', 'locutores', 'faturamento', 'usuarios', 'perfil', 'fornecedores', 'relatorios'].includes(activeTab) && (
              <div className="p-20 text-center">
                <Package size={48} className="text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-white mb-2">Módulo em Desenvolvimento</h3>
              </div>
            )}
          </div>
        </main>
      </div>

      {showClientForm && <ClientForm client={selectedClient} onClose={() => { setShowClientForm(false); setSelectedClient(null); }} onSuccess={() => { setShowClientForm(false); setSelectedClient(null); setRefreshTrigger(prev => prev + 1); }} />}
      {showOrderForm && <OrderForm order={selectedOrder} initialStatus={initialOrderStatus} onClose={() => { setShowOrderForm(false); setSelectedOrder(null); }} onSuccess={() => { setShowOrderForm(false); setSelectedOrder(null); setRefreshTrigger(prev => prev + 1); }} />}
      {showLocutorForm && <LocutorForm locutor={selectedLocutor} onClose={() => { setShowLocutorForm(false); setSelectedLocutor(null); }} onSave={() => { setShowLocutorForm(false); setSelectedLocutor(null); setRefreshTrigger(prev => prev + 1); }} />}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CRM />
    </AuthProvider>
  );
};

export default App;
