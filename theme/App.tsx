import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PedidosView } from './components/PedidosView';
import { ClientesView } from './components/ClientesView';
import { LocutoresView } from './components/LocutoresView';
import { FaturamentoView } from './components/FaturamentoView';
import { RelatoriosView } from './components/RelatoriosView';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const getViewTitle = (view: string) => {
    switch (view) {
      case 'dashboard':
        return { title: 'Visão Geral', subtitle: 'Bem-vindo de volta, Junior 👋' };
      case 'pedidos':
        return { title: 'Controle de Pedidos', subtitle: 'Gerencie todos os seus pedidos' };
      case 'clientes':
        return { title: 'Clientes', subtitle: 'Gerencie seus clientes' };
      case 'locutores':
        return { title: 'Locutores', subtitle: 'Gerencie seu time de locutores' };
      case 'faturamento':
        return { title: 'Faturamento', subtitle: 'Controle financeiro e faturas' };
      case 'relatorios':
        return { title: 'Relatórios', subtitle: 'Análises e insights' };
      default:
        return { title: 'Dashboard', subtitle: 'Bem-vindo' };
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'pedidos':
        return <PedidosView />;
      case 'clientes':
        return <ClientesView />;
      case 'locutores':
        return <LocutoresView />;
      case 'faturamento':
        return <FaturamentoView />;
      case 'relatorios':
        return <RelatoriosView />;
      default:
        return <Dashboard />;
    }
  };

  const viewInfo = getViewTitle(activeView);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={viewInfo.title} subtitle={viewInfo.subtitle} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="animate-in fade-in duration-300">
            {renderView()}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
