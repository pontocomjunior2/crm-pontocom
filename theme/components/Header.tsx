import { Search, Bell, User } from 'lucide-react';
import { Input } from './ui/input';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="h-20 bg-card border-b border-border px-8 flex items-center justify-between">
      {/* Title */}
      <div>
        <h1 className="text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {/* Search and User */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar pedidos, clientes, locutores..."
            className="pl-10 bg-input-background border-border"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm text-foreground">Admin User</p>
            <p className="text-xs text-muted-foreground">PONTOCOM</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-sm text-white">AD</span>
          </div>
        </div>
      </div>
    </div>
  );
}