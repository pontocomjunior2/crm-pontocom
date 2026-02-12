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
  Building2,
  Database,
  Menu,
  RotateCcw
} from 'lucide-react';
import BackupSettings from './components/BackupSettings';
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
import PackageList from './components/PackageList';
import PackageOrderForm from './components/PackageOrderForm';
import RecurringServiceList from './components/RecurringServiceList';
import NotificationPanel from './components/NotificationPanel';
import RevenueDistributionChart from './components/RevenueDistributionChart';

import AdminSettings from './components/AdminSettings';
import DashboardDetailModal from './components/DashboardDetailModal';
import DashboardDetailView from './components/DashboardDetailView';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { dashboardAPI, searchAPI, STORAGE_URL } from './services/api';
import { Toaster } from 'react-hot-toast';
import { formatCurrency, getLocalISODate } from './utils/formatters';

const CRM = () => {
  const { user, logout, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('crm_activeTab') || 'dashboard';
  });
  const [showClientForm, setShowClientForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showLocutorForm, setShowLocutorForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedLocutor, setSelectedLocutor] = useState(null);
  const [viewingLocutorHistory, setViewingLocutorHistory] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPackageOrderForm, setShowPackageOrderForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [initialOrderStatus, setInitialOrderStatus] = useState('PEDIDO');
  const [navParams, setNavParams] = useState(null);

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard Details State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  // Global Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  // Global Search Debounce
  useEffect(() => {
    if (globalSearch.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const results = await searchAPI.global(globalSearch);
        setSearchResults(results);
      } catch (error) {
        console.error('Error fetching global search results:', error);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearch]);

  useEffect(() => {
    // Close mobile menu when tab changes
    setMobileMenuOpen(false);
    // Persist active tab
    localStorage.setItem('crm_activeTab', activeTab);
  }, [activeTab]);

  // Date Filter State
  const [dateRange, setDateRange] = useState(() => {
    // Try to restore from session storage
    const saved = sessionStorage.getItem('dashboardDateFilter');
    if (saved) {
      return JSON.parse(saved);
    }

    // Default to 'This Month'
    const today = new Date();
    const start = getLocalISODate(new Date(today.getFullYear(), today.getMonth(), 1));
    const end = getLocalISODate(today);

    return {
      label: 'Este Mês',
      value: 'thisMonth',
      start,
      end
    };
  });
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, permission: 'accessDashboard' },
    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={20} />, permission: 'accessPedidos' },
    { id: 'pacotes', label: 'Pacotes', icon: <Package size={20} />, permission: 'accessPacotes' },
    { id: 'clientes', label: 'Clientes', icon: <Users size={20} />, permission: 'accessClientes' },
    { id: 'locutores', label: 'Locutores', icon: <Headphones size={20} />, permission: 'accessLocutores' },
    { id: 'fornecedores', label: 'Fornecedores', icon: <Building2 size={20} />, permission: 'accessFornecedores' },
    { id: 'faturamento', label: 'Faturamento', icon: <DollarSign size={20} />, permission: 'accessFaturamento' },
    { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 size={20} />, permission: 'accessRelatorios' },
    { id: 'usuarios', label: 'Usuários', icon: <Shield size={20} />, permission: 'accessUsuarios' },
    { id: 'servicos', label: 'Serviços Extras', icon: <Clock size={20} />, adminOnly: true },
    { id: 'config', label: 'Configurações', icon: <Settings size={20} />, adminOnly: true },
    { id: 'backup', label: 'Backup (GD)', icon: <Database size={20} />, adminOnly: true },
    { id: 'perfil', label: 'Meu Perfil', icon: <UserIcon size={20} />, alwaysShow: true },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (isAdmin) return true;
    if (item.alwaysShow) return true;
    if (item.adminOnly) return false; // Fixed: only if isAdmin is true, but we handle it above
    if (!user?.tier) return false;
    return user.tier[item.permission] || isAdmin;
  });

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoadingDashboard(true);
      try {
        const params = {};
        if (dateRange.start) params.startDate = dateRange.start;
        if (dateRange.end) params.endDate = dateRange.end;
        const data = await dashboardAPI.get(params);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, [refreshTrigger, user, dateRange]);

  // Tab Access Control
  useEffect(() => {
    if (!user || activeTab === 'perfil' || activeTab === 'dashboard-view') return;

    const isPermitted = filteredMenuItems.some(item => item.id === activeTab);
    if (!isPermitted) {
      // If the current tab is not allowed, try to find the first allowed one
      const firstAllowed = filteredMenuItems.find(i => i.id !== 'perfil')?.id || 'perfil';
      setActiveTab(firstAllowed);
    }
  }, [user, activeTab, filteredMenuItems]);

  const handleDateFilterChange = (value) => {
    const today = new Date();
    let start = '';
    let end = getLocalISODate(today);
    let label = '';

    switch (value) {
      case 'all':
        start = '';
        end = '';
        label = 'Todo o Período';
        break;
      case '7days':
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        start = getLocalISODate(d7);
        label = 'Últimos 7 dias';
        break;
      case '15days':
        const d15 = new Date();
        d15.setDate(d15.getDate() - 15);
        start = getLocalISODate(d15);
        label = 'Últimos 15 dias';
        break;
      case '30days':
        const d30 = new Date();
        d30.setDate(d30.getDate() - 30);
        start = getLocalISODate(d30);
        label = 'Últimos 30 dias';
        break;
      case 'thisMonth':
        start = getLocalISODate(new Date(today.getFullYear(), today.getMonth(), 1));
        label = 'Este Mês';
        break;
      case '12months':
        const d12m = new Date();
        d12m.setFullYear(d12m.getFullYear() - 1);
        start = getLocalISODate(d12m);
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

    const newRange = { label, value, start, end };
    setDateRange(newRange);
    sessionStorage.setItem('dashboardDateFilter', JSON.stringify(newRange));
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
    // Line 1: Revenues + Growth
    {
      id: 'totalRevenue',
      title: 'Receita Total',
      value: formatCurrency(dashboardData.metrics.totalRevenue),
      trend: '+0%', // To be implemented: real growth
      sub: 'acumulado total',
      icon: <DollarSign size={20} />,
      color: 'from-amber-400 to-amber-600',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-500'
    },
    {
      id: 'orderRevenue',
      title: 'Receita de Avulsos',
      value: formatCurrency(dashboardData.metrics.orderRevenue || 0),
      trend: `${Math.round((dashboardData.metrics.orderRevenue / dashboardData.metrics.totalRevenue) * 100 || 0)}%`,
      sub: 'avulsos',
      icon: <ShoppingCart size={20} />,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500'
    },
    {
      id: 'packageRevenue',
      title: 'Receita de Pacotes',
      value: formatCurrency(dashboardData.metrics.packageRevenue || 0),
      trend: `${Math.round((dashboardData.metrics.packageRevenue / dashboardData.metrics.totalRevenue) * 100 || 0)}%`,
      sub: 'extras pacotes',
      icon: <Package size={20} />,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-500'
    },
    {
      id: 'recurringRevenue',
      title: 'Serviços Extras',
      value: formatCurrency(dashboardData.metrics.recurringRevenue || 0),
      trend: `${Math.round((dashboardData.metrics.recurringRevenue / dashboardData.metrics.totalRevenue) * 100 || 0)}%`,
      sub: 'serviços extra-core',
      icon: <RotateCcw size={20} />,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-500'
    },
    {
      id: 'activeClients',
      title: 'Clientes Ativos',
      value: dashboardData.metrics.activeClients.toString(),
      trend: '+0',
      sub: 'clientes totais',
      icon: <Users size={20} />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500'
    },

    // Line 2: Costs + Operations
    {
      id: 'totalCache',
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
      id: 'packageCache',
      title: 'Custo Pacotes',
      value: formatCurrency(dashboardData.metrics.packageCache || 0),
      trend: `${Math.round((dashboardData.metrics.packageCache / dashboardData.metrics.packageRevenue) * 100 || 0)}%`,
      sub: 'da rec. pacotes',
      icon: <Package size={20} />,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-500/10',
      textColor: 'text-pink-500'
    },
    {
      id: 'orderCache',
      title: 'Custo Avulsos',
      value: formatCurrency(dashboardData.metrics.orderCache || 0),
      trend: `${Math.round((dashboardData.metrics.orderCache / dashboardData.metrics.orderRevenue) * 100 || 0)}%`,
      sub: 'da rec. avulsa',
      icon: <Mic2 size={20} />,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-500'
    },
    {
      id: 'recurringCache',
      title: 'Custo Extras/Recor.',
      value: formatCurrency(dashboardData.metrics.recurringCache || 0),
      trend: `${Math.round((dashboardData.metrics.recurringCache / dashboardData.metrics.recurringRevenue) * 100 || 0)}%`,
      sub: 'serviços e fixos',
      icon: <RotateCcw size={20} />,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-500'
    },
  ] : [];

  const recentOrders = dashboardData?.recentOrders || [];
  const pendingInvoices = dashboardData?.pendingInvoices || [];



  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-body text-foreground">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center justify-center">
            <img src="/logo_flat.png" alt="Pontocom Audio" className="w-40 md:w-48 object-contain" />
          </div>
        </div>

        {/* Scrollable Nav Area */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'dashboard') {
                  setRefreshTrigger(prev => prev + 1);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${activeTab === item.id
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-left font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border flex-shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all font-bold"
          >
            <LogOut size={20} />
            <span>SAIR</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-14 bg-card border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-foreground hover:bg-accent rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground leading-none">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h1>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Bem-vindo, {user.name} 👋</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-80 hidden lg:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Pesquisar clientes, pedidos..."
                className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
              />

              {/* Search Results Dropdown */}
              {(searchResults || isSearchingGlobal) && globalSearch.length >= 2 && (
                <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-xl shadow-2xl z-[100] overflow-hidden max-h-[400px] flex flex-col animate-in fade-in slide-in-from-top-2">
                  <div className="overflow-y-auto custom-scrollbar">
                    {isSearchingGlobal && (
                      <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="text-xs">Buscando...</span>
                      </div>
                    )}

                    {!isSearchingGlobal && searchResults && (
                      <>
                        {/* Clients Section */}
                        {searchResults.clients.length > 0 && (
                          <div className="p-2 border-b border-border">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 mb-1">Clientes</p>
                            {searchResults.clients.map(client => (
                              <button
                                key={client.id}
                                onClick={() => {
                                  setActiveTab('clientes');
                                  setNavParams({ id: client.id });
                                  setGlobalSearch('');
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between group"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{client.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{client.cnpj_cpf}</span>
                                </div>
                                <Users size={14} className="text-muted-foreground" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Orders Section */}
                        {searchResults.orders.length > 0 && (
                          <div className="p-2">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 mb-1">Pedidos e Vendas</p>
                            {searchResults.orders.map(order => (
                              <button
                                key={order.id}
                                onClick={() => {
                                  setActiveTab('pedidos');
                                  setNavParams({ id: order.id });
                                  setGlobalSearch('');
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between group"
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[180px]">{order.title}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">#{order.numeroVenda}</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{new Date(order.date).toLocaleDateString('pt-BR')} • {order.status}</span>
                                </div>
                                <ShoppingCart size={14} className="text-muted-foreground" />
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.clients.length === 0 && searchResults.orders.length === 0 && (
                          <div className="p-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                            <Search size={24} className="opacity-20" />
                            <p className="text-xs">Nenhum resultado encontrado</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <NotificationPanel onNavigate={(tab, params) => {
              // Reset nav params before setting new ones
              setNavParams(null);
              setActiveTab(tab);
              if (params) {
                // Delay setting params to ensure component is mounted and effect is fresh
                setTimeout(() => setNavParams(params), 50);
              }
            }} />
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
                            { label: 'Todo o Período', val: 'all' },
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
                        <div
                          key={i}
                          className="card-dark p-6 group cursor-pointer hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98]"
                          onClick={() => {
                            setSelectedMetric({ id: stat.id, label: stat.title });
                            setActiveTab('dashboard-view');
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</span>
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bgColor} ${stat.textColor} group-hover:scale-110 group-hover:shadow-lg transition-all`}>{stat.icon}</div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-4xl font-black text-foreground tracking-tight">{stat.value}</h3>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{stat.trend.includes('+') || stat.trend.includes('↑') ? '↑' : ''} {stat.trend}</span>
                              <span className="text-muted-foreground/60">•</span>
                              <span className="text-muted-foreground/80 text-xs">{stat.sub}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="card-dark p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">Faturamento Pendente</h3>
                          <p className="text-xs text-muted-foreground">Clientes com faturas em aberto</p>
                        </div>
                        <button onClick={() => setActiveTab('faturamento')} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                          <DollarSign size={16} />
                          IR PARA FATURAMENTO
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingInvoices.map((invoice, i) => (
                          <div key={i} className="relative p-4 rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer group">
                            <div className={`absolute top-4 left-4 w-2 h-2 rounded-full ${invoice.priority === 'high' ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}></div>
                            <div className="pl-4">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{invoice.dueDate}</span>
                              <h4 className="text-sm font-bold text-white mb-2 truncate group-hover:text-primary transition-colors">{invoice.client}</h4>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{invoice.orders} pedidos</span>
                                <span className="text-base font-bold text-primary">{invoice.total}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <RevenueDistributionChart data={dashboardData.metrics} />
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard-view' && selectedMetric && (
            <DashboardDetailView
              metric={selectedMetric.id}
              metricLabel={selectedMetric.label}
              dateRange={dateRange}
              onBack={() => setActiveTab('dashboard')}
              onEditOrder={(order) => {
                setSelectedOrder(order);
                setShowOrderForm(true);
              }}
              onEditClient={(client) => {
                setSelectedClient(client);
                setShowClientForm(true);
              }}
            />
          )}

          {activeTab === 'clientes' && (
            <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
              <ClientList
                refreshTrigger={refreshTrigger}
                initialFilters={activeTab === 'clientes' ? navParams : null}
                onEditClient={(c) => { setSelectedClient(c); setShowClientForm(true); }}
                onAddNewClient={() => { setSelectedClient(null); setShowClientForm(true); }}
                onClearFilters={() => setNavParams(null)}
              />
            </div>
          )}

          {activeTab === 'pedidos' && (
            <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
              <OrderList
                refreshTrigger={refreshTrigger}
                initialFilters={activeTab === 'pedidos' ? navParams : null}
                onEditOrder={(o) => { setSelectedOrder(o); setShowOrderForm(true); }}
                onAddNewOrder={(s) => { setSelectedOrder(null); setInitialOrderStatus(typeof s === 'string' ? s : 'PEDIDO'); setShowOrderForm(true); }}
                onNavigate={(tab, params) => { setActiveTab(tab); setNavParams(params); }}
                onClearFilters={() => setNavParams(null)}
              />
            </div>
          )}

          {activeTab === 'locutores' && (
            <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
              {viewingLocutorHistory ? <LocutorHistory locutor={viewingLocutorHistory} onBack={() => setViewingLocutorHistory(null)} /> : <LocutorList refreshTrigger={refreshTrigger} onEditLocutor={(l) => { setSelectedLocutor(l); setShowLocutorForm(true); }} onAddNewLocutor={() => { setSelectedLocutor(null); setShowLocutorForm(true); }} onViewHistory={setViewingLocutorHistory} />}
            </div>
          )}

          {activeTab === 'fornecedores' && (
            <div className="flex-1 overflow-y-auto h-full w-full custom-scrollbar">
              <SupplierList />
            </div>
          )}

          {activeTab === 'faturamento' && (
            <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
              <FaturamentoList refreshTrigger={refreshTrigger} initialFilters={navParams} onEditOrder={(o) => { setSelectedOrder(o); setShowOrderForm(true); }} onAddNewOrder={(s) => { setSelectedOrder(null); setInitialOrderStatus(typeof s === 'string' ? s : 'VENDA'); setShowOrderForm(true); }} />
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

          {activeTab === 'backup' && isAdmin && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 h-full max-w-[1400px] mx-auto w-full">
              <BackupSettings />
            </div>
          )}

          {activeTab === 'pacotes' && (
            <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
              <PackageList refreshTrigger={refreshTrigger} initialFilters={navParams} onAddNewOrder={(pkg) => {
                setSelectedPackage(pkg);
                setShowPackageOrderForm(true);
              }} />
            </div>
          )}

          {activeTab === 'servicos' && isAdmin && (
            <div className="flex-1 overflow-hidden h-full max-w-[1400px] mx-auto w-full">
              <RecurringServiceList />
            </div>
          )}


          {activeTab === 'config' && isAdmin && (
            <div className="flex-1 overflow-y-auto custom-scrollbar h-full max-w-[1400px] mx-auto w-full">
              <AdminSettings />
            </div>
          )}


          {!['dashboard', 'dashboard-view', 'clientes', 'pedidos', 'locutores', 'faturamento', 'usuarios', 'perfil', 'fornecedores', 'relatorios', 'backup', 'pacotes', 'servicos', 'config'].includes(activeTab) && (
            <div className="p-20 text-center">
              <Package size={48} className="text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-white mb-2">Módulo em Desenvolvimento</h3>
            </div>
          )}
        </div>
      </div>

      {showClientForm && <ClientForm client={selectedClient} onClose={() => { setShowClientForm(false); setSelectedClient(null); }} onSuccess={() => { setShowClientForm(false); setSelectedClient(null); setRefreshTrigger(prev => prev + 1); }} />}
      {showOrderForm && <OrderForm order={selectedOrder} initialStatus={initialOrderStatus} initialClient={selectedClient} onClose={() => { setShowOrderForm(false); setSelectedOrder(null); setSelectedClient(null); }} onSuccess={() => { setShowOrderForm(false); setSelectedOrder(null); setSelectedClient(null); setRefreshTrigger(prev => prev + 1); }} />}
      {showPackageOrderForm && <PackageOrderForm pkg={selectedPackage} onClose={() => { setShowPackageOrderForm(false); setSelectedPackage(null); }} onSuccess={() => { setShowPackageOrderForm(false); setSelectedPackage(null); setRefreshTrigger(prev => prev + 1); }} />}
      {showLocutorForm && <LocutorForm locutor={selectedLocutor} onClose={() => { setShowLocutorForm(false); setSelectedLocutor(null); }} onSave={() => { setShowLocutorForm(false); setSelectedLocutor(null); setRefreshTrigger(prev => prev + 1); }} />}
      {showDetailModal && selectedMetric && (
        <DashboardDetailModal
          metric={selectedMetric.id}
          metricLabel={selectedMetric.label}
          dateRange={dateRange}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMetric(null);
          }}
        />
      )}
      <Toaster position="top-right" />
    </div >
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
