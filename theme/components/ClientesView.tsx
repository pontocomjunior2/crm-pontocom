import { Search, Plus, Mail, Phone, MapPin, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function ClientesView() {
  const clients = [
    {
      name: 'MUKECA FILMES',
      email: 'contato@mukekafilmes.com',
      phone: '+55 11 98765-4321',
      location: 'São Paulo, SP',
      orders: 15,
      revenue: 'R$ 45.320,00',
      status: 'Ativo',
      avatar: 'MF',
      color: 'bg-primary',
    },
    {
      name: 'Produtora XYZ',
      email: 'contato@produtoraxyz.com',
      phone: '+55 21 99876-5432',
      location: 'Rio de Janeiro, RJ',
      orders: 23,
      revenue: 'R$ 68.900,00',
      status: 'Ativo',
      avatar: 'PX',
      color: 'bg-purple-500',
    },
    {
      name: 'Studio Alpha',
      email: 'studio@alpha.com',
      phone: '+55 11 91234-5678',
      location: 'São Paulo, SP',
      orders: 8,
      revenue: 'R$ 22.450,00',
      status: 'Ativo',
      avatar: 'SA',
      color: 'bg-blue-500',
    },
    {
      name: 'Media Corp',
      email: 'contato@mediacorp.com',
      phone: '+55 31 98765-1234',
      location: 'Belo Horizonte, MG',
      orders: 31,
      revenue: 'R$ 95.780,00',
      status: 'VIP',
      avatar: 'MC',
      color: 'bg-orange-500',
    },
    {
      name: 'Creative Studio',
      email: 'hello@creativestudio.com',
      phone: '+55 41 99999-8888',
      location: 'Curitiba, PR',
      orders: 12,
      revenue: 'R$ 38.200,00',
      status: 'Ativo',
      avatar: 'CS',
      color: 'bg-emerald-500',
    },
    {
      name: 'Digital House',
      email: 'contato@digitalhouse.com',
      phone: '+55 48 97777-6666',
      location: 'Florianópolis, SC',
      orders: 19,
      revenue: 'R$ 57.600,00',
      status: 'Ativo',
      avatar: 'DH',
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-1">Clientes</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus clientes e relacionamentos</p>
        </div>
        <Button className="gap-2 bg-primary text-black hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-1 md:col-span-2 p-4 bg-card border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar clientes por nome, email..."
              className="pl-10 bg-input-background border-border"
            />
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground mb-1">Total de Clientes</p>
          <p className="text-2xl text-foreground">142</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground mb-1">Clientes Ativos</p>
          <p className="text-2xl text-primary">128</p>
        </Card>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client, index) => (
          <Card
            key={index}
            className="p-6 bg-card border-border hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${client.color} rounded-lg flex items-center justify-center text-white`}>
                  {client.avatar}
                </div>
                <div>
                  <h3 className="text-foreground">{client.name}</h3>
                  <p className="text-xs text-muted-foreground">{client.status}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  <DropdownMenuItem className="gap-2">
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-red-400">
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{client.location}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pedidos</p>
                <p className="text-foreground">{client.orders}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Receita</p>
                <p className="text-primary">{client.revenue}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
