import { Home, ShoppingCart, Users, MapPin, CreditCard, BarChart3, Settings, LogOut, Package } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart, badge: 28 },
    { id: 'clientes', label: 'Clientes', icon: Users, badge: 142 },
    { id: 'locutores', label: 'Locutores', icon: Package },
    { id: 'faturamento', label: 'Faturamento', icon: CreditCard, badge: 'NOVO' },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="w-64 h-screen bg-[#0f1419] border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary via-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-foreground">Pontocom</h2>
            <p className="text-xs text-muted-foreground">Admin CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    typeof item.badge === 'number'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all">
          <Settings className="w-5 h-5" />
          <span>Configurações</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Support Section */}
      <div className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-t border-primary/20">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Suporte Técnico</p>
          <button className="text-sm text-primary hover:underline">Abrir Chamado</button>
        </div>
      </div>
    </div>
  );
}