import { useState } from 'react';
import { Search, Filter, Download, List, Grid, ChevronDown, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

export function PedidosView() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterType, setFilterType] = useState('Todos os Tipos');
  const [filterStatus, setFilterStatus] = useState('Todos os Status');

  const tabs = [
    { id: 'all', label: 'Todos Pedidos', count: 80 },
    { id: 'prepared', label: 'Preparado', count: 10 },
    { id: 'delivered', label: 'Entregue', count: 30 },
    { id: 'completed', label: 'Completo', count: 50 },
  ];

  const orders = [
    {
      id: '#10685',
      customer: 'Bossie Cooper',
      customerAvatar: '👤',
      payment: 'PAGO',
      paymentStatus: 'success',
      product: 'Cannabis',
      productSubtitle: 'New York Chair',
      date: '08/08/2021',
      status: 'Entregue',
      statusColor: 'blue',
      value: 'R$ 150,00',
      margin: 'R$ 38,00',
      type: 'GF',
      location: 'SP',
    },
    {
      id: '#19043',
      customer: 'Jenny Wilson',
      customerAvatar: '👤',
      payment: 'NÃO PAGO',
      paymentStatus: 'warning',
      product: 'Koertel',
      productSubtitle: 'Euralia Chair',
      date: '10/08/2021',
      status: 'Preparação',
      statusColor: 'orange',
      value: 'R$ 280,00',
      margin: 'R$ 70,00',
      type: 'CF',
      location: 'RJ',
    },
    {
      id: '#19683',
      customer: 'Dianne Russell',
      customerAvatar: '👤',
      payment: 'PAGO',
      paymentStatus: 'success',
      product: 'Bluebell',
      productSubtitle: 'Leather Brown Sofa',
      date: '06/08/2021',
      status: 'Entregue',
      statusColor: 'blue',
      value: 'R$ 420,00',
      margin: 'R$ 105,00',
      type: 'CAFÉ',
      location: 'MG',
    },
    {
      id: '#10211',
      customer: 'Robert Fox',
      customerAvatar: '👤',
      payment: 'PAGO',
      paymentStatus: 'success',
      product: 'Cannabis',
      productSubtitle: 'New York Chair',
      date: '05/08/2021',
      status: 'Completo',
      statusColor: 'green',
      value: 'R$ 150,00',
      margin: 'R$ 38,00',
      type: 'GF',
      location: 'SP',
    },
    {
      id: '#19657',
      customer: 'Ronald Richards',
      customerAvatar: '👤',
      payment: 'PAGO',
      paymentStatus: 'success',
      product: 'Calliope',
      productSubtitle: 'Tilla Moss Chair',
      date: '04/08/2021',
      status: 'Completo',
      statusColor: 'green',
      value: 'R$ 310,00',
      margin: 'R$ 78,00',
      type: 'OFF',
      location: 'BA',
    },
    {
      id: '#11427',
      customer: 'Jerome Bell',
      customerAvatar: '👤',
      payment: 'PAGO',
      paymentStatus: 'success',
      product: 'Koertel',
      productSubtitle: 'Smooth Chair',
      date: '07/08/2021',
      status: 'Entregue',
      statusColor: 'blue',
      value: 'R$ 240,00',
      margin: 'R$ 60,00',
      type: 'CF',
      location: 'RS',
    },
    {
      id: '#15887',
      customer: 'Devon Lane',
      customerAvatar: '👤',
      payment: 'PAGO',
      paymentStatus: 'success',
      product: 'Cannabis',
      productSubtitle: 'New York Chair',
      date: '07/08/2021',
      status: 'Entregue',
      statusColor: 'blue',
      value: 'R$ 150,00',
      margin: 'R$ 38,00',
      type: 'GF',
      location: 'PR',
    },
    {
      id: '#19583',
      customer: 'Albert Flores',
      customerAvatar: '👤',
      payment: 'PAGO',
      paymentStatus: 'success',
      product: 'Bluebell',
      productSubtitle: 'Leather Brown Sofa',
      date: '04/08/2021',
      status: 'Completo',
      statusColor: 'green',
      value: 'R$ 420,00',
      margin: 'R$ 105,00',
      type: 'CAFÉ',
      location: 'SC',
    },
  ];

  const getStatusBadgeClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'orange':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'green':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const getPaymentBadgeClass = (status: string) => {
    return status === 'success'
      ? 'bg-emerald-500/20 text-emerald-400'
      : 'bg-red-500/20 text-red-400';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="pb-4 px-2 border-b-2 border-transparent hover:border-primary transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-foreground">{tab.label}</span>
              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                {tab.count}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar por título, cliente ou locutor..."
              className="pl-10 bg-input-background border-border"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {filterType}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border">
              <DropdownMenuItem>Todos os Tipos</DropdownMenuItem>
              <DropdownMenuItem>GF - Gravação Feminina</DropdownMenuItem>
              <DropdownMenuItem>CF - Criação Feminina</DropdownMenuItem>
              <DropdownMenuItem>CAFÉ - Café com Legendas</DropdownMenuItem>
              <DropdownMenuItem>OFF - Oferta</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {filterStatus}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border">
              <DropdownMenuItem>Todos os Status</DropdownMenuItem>
              <DropdownMenuItem>Entregue</DropdownMenuItem>
              <DropdownMenuItem>Preparação</DropdownMenuItem>
              <DropdownMenuItem>Completo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            FILTRAR
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list' ? 'bg-primary text-black' : 'text-muted-foreground'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' ? 'bg-primary text-black' : 'text-muted-foreground'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <Button className="gap-2 bg-primary text-black hover:bg-primary/90">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Mostrando 0 - 10 de 84 results
      </div>

      {/* Table View */}
      {viewMode === 'list' && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">ID PEDIDO</TableHead>
                <TableHead className="text-muted-foreground">CLIENTE</TableHead>
                <TableHead className="text-muted-foreground">PAGAMENTO</TableHead>
                <TableHead className="text-muted-foreground">PRODUTO</TableHead>
                <TableHead className="text-muted-foreground">DATA PEDIDO</TableHead>
                <TableHead className="text-muted-foreground">STATUS</TableHead>
                <TableHead className="text-muted-foreground">VALORES</TableHead>
                <TableHead className="text-muted-foreground">MARGEM</TableHead>
                <TableHead className="text-muted-foreground text-center">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-border hover:bg-secondary/50 transition-all"
                >
                  <TableCell className="text-foreground">{order.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs">
                        {order.customerAvatar}
                      </div>
                      <span className="text-foreground">{order.customer}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentBadgeClass(order.paymentStatus)}>
                      {order.payment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground">{order.product}</p>
                      <p className="text-xs text-muted-foreground">{order.productSubtitle}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{order.date}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(order.statusColor) + ' border'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{order.value}</TableCell>
                  <TableCell className="text-emerald-400">{order.margin}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    {order.customerAvatar}
                  </div>
                  <div>
                    <p className="text-foreground text-sm">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.id}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Produto</p>
                  <p className="text-sm text-foreground">{order.product}</p>
                  <p className="text-xs text-muted-foreground">{order.productSubtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge className={getStatusBadgeClass(order.statusColor) + ' border'}>
                  {order.status}
                </Badge>
                <Badge className={getPaymentBadgeClass(order.paymentStatus)}>
                  {order.payment}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-foreground">{order.value}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm text-muted-foreground">{order.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
