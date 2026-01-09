import { Search, Plus, Mic, Star, MoreVertical, Eye, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

export function LocutoresView() {
  const locutores = [
    {
      name: 'Ana Silva',
      specialty: 'Voz Feminina',
      rating: 4.9,
      jobs: 145,
      revenue: 'R$ 28.400,00',
      status: 'Disponível',
      avatar: 'AS',
      color: 'bg-purple-500',
      tags: ['Comercial', 'Institucional'],
    },
    {
      name: 'Carlos Mendes',
      specialty: 'Voz Masculina',
      rating: 4.8,
      jobs: 178,
      revenue: 'R$ 35.600,00',
      status: 'Disponível',
      avatar: 'CM',
      color: 'bg-blue-500',
      tags: ['Narração', 'Off'],
    },
    {
      name: 'Beatriz Costa',
      specialty: 'Voz Jovem',
      rating: 5.0,
      jobs: 92,
      revenue: 'R$ 19.800,00',
      status: 'Ocupado',
      avatar: 'BC',
      color: 'bg-pink-500',
      tags: ['Comercial', 'Digital'],
    },
    {
      name: 'Roberto Lima',
      specialty: 'Voz Grave',
      rating: 4.7,
      jobs: 203,
      revenue: 'R$ 42.100,00',
      status: 'Disponível',
      avatar: 'RL',
      color: 'bg-orange-500',
      tags: ['Institucional', 'Documentário'],
    },
    {
      name: 'Mariana Souza',
      specialty: 'Voz Suave',
      rating: 4.9,
      jobs: 167,
      revenue: 'R$ 31.200,00',
      status: 'Disponível',
      avatar: 'MS',
      color: 'bg-emerald-500',
      tags: ['Comercial', 'Podcast'],
    },
    {
      name: 'Fernando Alves',
      specialty: 'Voz Versátil',
      rating: 4.8,
      jobs: 189,
      revenue: 'R$ 38.900,00',
      status: 'Disponível',
      avatar: 'FA',
      color: 'bg-primary',
      tags: ['Off', 'Narração', 'Comercial'],
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-1">Locutores</h2>
          <p className="text-sm text-muted-foreground">Gerencie seu time de locutores</p>
        </div>
        <Button className="gap-2 bg-primary text-black hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Novo Locutor
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-1 md:col-span-2 p-4 bg-card border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar locutores por nome, especialidade..."
              className="pl-10 bg-input-background border-border"
            />
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Locutores</p>
          <p className="text-2xl text-foreground">28</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground mb-1">Disponíveis</p>
          <p className="text-2xl text-primary">22</p>
        </Card>
      </div>

      {/* Locutores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locutores.map((locutor, index) => (
          <Card
            key={index}
            className="p-6 bg-card border-border hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${locutor.color} rounded-full flex items-center justify-center text-white`}>
                  <span>{locutor.avatar}</span>
                </div>
                <div>
                  <h3 className="text-foreground">{locutor.name}</h3>
                  <p className="text-xs text-muted-foreground">{locutor.specialty}</p>
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

            <div className="flex items-center gap-3 mb-4">
              <Badge
                className={
                  locutor.status === 'Disponível'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-orange-500/20 text-orange-400'
                }
              >
                <div className="w-2 h-2 rounded-full bg-current mr-1"></div>
                {locutor.status}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-foreground">{locutor.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {locutor.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-primary/10 text-primary rounded text-xs border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mic className="w-3 h-3" />
                  Gravações
                </p>
                <p className="text-foreground">{locutor.jobs}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3 h-3" />
                  Receita
                </p>
                <p className="text-primary">{locutor.revenue}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
