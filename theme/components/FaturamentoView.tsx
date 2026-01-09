import { DollarSign, FileText, Calendar, TrendingUp, Plus, Download } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

export function FaturamentoView() {
  const summary = [
    {
      title: 'Faturamento Mensal',
      value: 'R$ 156.780,00',
      change: '+18%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Pendente',
      value: 'R$ 8.350,00',
      change: '5 clientes',
      changeType: 'warning',
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'A Vencer',
      value: 'R$ 23.450,00',
      change: '12 faturas',
      changeType: 'neutral',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Receita Prevista',
      value: 'R$ 189.500,00',
      change: '+24%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  const invoices = [
    {
      id: '#FAT-1045',
      client: 'MUKECA FILMES',
      amount: 'R$ 8.350,00',
      status: 'Pendente',
      statusColor: 'bg-orange-500/20 text-orange-400',
      date: '15/01/2026',
      dueDate: '20/01/2026',
      orders: 3,
    },
    {
      id: '#FAT-1044',
      client: 'Media Corp',
      amount: 'R$ 15.670,00',
      status: 'Pago',
      statusColor: 'bg-emerald-500/20 text-emerald-400',
      date: '12/01/2026',
      dueDate: '17/01/2026',
      orders: 5,
    },
    {
      id: '#FAT-1043',
      client: 'Produtora XYZ',
      amount: 'R$ 9.890,00',
      status: 'Pago',
      statusColor: 'bg-emerald-500/20 text-emerald-400',
      date: '10/01/2026',
      dueDate: '15/01/2026',
      orders: 4,
    },
    {
      id: '#FAT-1042',
      client: 'Studio Alpha',
      amount: 'R$ 5.230,00',
      status: 'A Vencer',
      statusColor: 'bg-blue-500/20 text-blue-400',
      date: '08/01/2026',
      dueDate: '25/01/2026',
      orders: 2,
    },
    {
      id: '#FAT-1041',
      client: 'Creative Studio',
      amount: 'R$ 12.450,00',
      status: 'Pago',
      statusColor: 'bg-emerald-500/20 text-emerald-400',
      date: '05/01/2026',
      dueDate: '10/01/2026',
      orders: 6,
    },
  ];

  const pendingClients = [
    { name: 'MUKECA FILMES', orders: 1, amount: 'R$ 100,00' },
    { name: 'Studio Beta', orders: 2, amount: 'R$ 3.200,00' },
    { name: 'Digital House', orders: 3, amount: 'R$ 5.050,00' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-1">Faturamento</h2>
          <p className="text-sm text-muted-foreground">Gerencie faturas e pagamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button className="gap-2 bg-primary text-black hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summary.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className="p-6 bg-card border-border hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className={`text-xs ${item.changeType === 'positive' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {item.change}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{item.title}</p>
                <p className="text-2xl text-foreground">{item.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Invoices and Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices Table */}
        <Card className="col-span-2 p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-foreground mb-1">Faturas Recentes</h3>
              <p className="text-sm text-muted-foreground">Últimas movimentações</p>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">FATURA</TableHead>
                  <TableHead className="text-muted-foreground">CLIENTE</TableHead>
                  <TableHead className="text-muted-foreground">VALOR</TableHead>
                  <TableHead className="text-muted-foreground">VENCIMENTO</TableHead>
                  <TableHead className="text-muted-foreground">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="border-border hover:bg-secondary/50 transition-all"
                  >
                    <TableCell>
                      <div>
                        <p className="text-foreground">{invoice.id}</p>
                        <p className="text-xs text-muted-foreground">{invoice.orders} pedidos</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{invoice.client}</TableCell>
                    <TableCell className="text-foreground">{invoice.amount}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
                    <TableCell>
                      <Badge className={invoice.statusColor}>{invoice.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pending Clients */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="mb-6">
            <h3 className="text-foreground mb-1">Pendentes de Faturamento</h3>
            <p className="text-sm text-muted-foreground">Clientes aguardando fatura</p>
          </div>
          <div className="space-y-3">
            {pendingClients.map((client, index) => (
              <div
                key={index}
                className="p-4 bg-card/50 rounded-lg border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-foreground">{client.name}</p>
                  <p className="text-primary">{client.amount}</p>
                </div>
                <p className="text-xs text-muted-foreground">{client.orders} pedidos</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-card/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Total Pendente</p>
            <p className="text-2xl text-foreground mb-3">R$ 8.350,00</p>
            <Button className="w-full bg-primary text-black hover:bg-primary/90">
              + PROCESSAR TODOS
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
