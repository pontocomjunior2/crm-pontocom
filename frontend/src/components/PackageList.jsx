import React, { useState, useEffect } from 'react';
import {
    Package,
    Search,
    Plus,
    Loader2,
    BarChart3,
    Calendar,
    CheckCircle2,
    Users,
    ShoppingCart,
    Clock,
    AlertCircle,
    LayoutGrid,
    List,
    Hash,
    Edit2,
    Save,
    X
} from 'lucide-react';
import { clientPackageAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const PackageList = ({ onAddNewOrder }) => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [editingCode, setEditingCode] = useState(null); // id of package being edited
    const [tempCode, setTempCode] = useState('');

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const data = await clientPackageAPI.listAll();
            setPackages(data || []);
        } catch (error) {
            console.error('Error fetching all packages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleSaveCode = async (pkgId) => {
        try {
            await clientPackageAPI.update(pkgId, { clientCode: tempCode });
            setPackages(packages.map(p => p.id === pkgId ? { ...p, clientCode: tempCode } : p));
            setEditingCode(null);
        } catch (error) {
            console.error('Error saving client code:', error);
        }
    };

    const filteredPackages = packages.filter(pkg =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.clientCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getUsageColor = (pkg) => {
        if (pkg.audioLimit === 0) return 'text-primary';
        const percent = (pkg.usedAudios / pkg.audioLimit) * 100;
        if (percent >= 90) return 'text-red-500';
        if (percent >= 70) return 'text-orange-500';
        return 'text-emerald-500';
    };

    const getUsagePercent = (pkg) => {
        if (pkg.audioLimit === 0) return 0;
        return Math.min(100, (pkg.usedAudios / pkg.audioLimit) * 100);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Package className="text-primary" size={24} />
                        Gestão Global de Pacotes
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Visualize e gerencie todos os pacotes ativos dos clientes</p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                        title="Visualização em Grade"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                        title="Visualização em Lista"
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                {[
                    { label: 'Total de Pacotes', value: packages.length, icon: <Package size={14} />, color: 'text-blue-400' },
                    { label: 'Clientes Atendidos', value: new Set(packages.map(p => p.clientId)).size, icon: <Users size={14} />, color: 'text-purple-400' },
                    { label: 'Áudios Consumidos', value: packages.reduce((acc, p) => acc + p.usedAudios, 0), icon: <ShoppingCart size={14} />, color: 'text-emerald-400' },
                    { label: 'Capacidade Total', value: packages.reduce((acc, p) => acc + (p.audioLimit || 0), 0), icon: <BarChart3 size={14} />, color: 'text-amber-400' },
                ].map((stat, i) => (
                    <div key={i} className="card-glass-dark p-3 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-[#666666] uppercase tracking-wider">{stat.label}</p>
                            <p className="text-lg font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card-glass-dark p-3 rounded-2xl mb-4 border border-white/5 bg-card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por cliente, nome do pacote ou código..."
                        className="w-full bg-input-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground text-xs"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto custom-scrollbar p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 size={32} className="text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground text-sm">Carregando pacotes ativos...</p>
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50">
                            <Package size={48} className="mb-4" />
                            <p className="text-lg font-medium text-white">Nenhum pacote encontrado</p>
                            <p className="text-sm text-muted-foreground">Tente ajustar sua busca ou cadastrar novos pacotes em Clientes</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPackages.map((pkg) => (
                                <div key={pkg.id} className="card-dark p-5 group flex flex-col border border-white/5 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-widest">{pkg.type}</span>
                                                {pkg.usedAudios >= pkg.audioLimit && pkg.audioLimit > 0 && (
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500 text-white uppercase tracking-widest animate-pulse">LIMITE ATINGIDO</span>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{pkg.name}</h3>
                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                                                <Users size={12} className="opacity-50" />
                                                {pkg.client?.name}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                                            <Package size={20} />
                                        </div>
                                    </div>

                                    {/* Client Code UI */}
                                    <div className="mb-4 px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group/code">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Hash size={12} className="text-primary/50 shrink-0" />
                                            {editingCode === pkg.id ? (
                                                <input
                                                    autoFocus
                                                    value={tempCode}
                                                    onChange={(e) => setTempCode(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveCode(pkg.id);
                                                        if (e.key === 'Escape') setEditingCode(null);
                                                    }}
                                                    className="bg-transparent border-none outline-none text-[11px] text-white w-full placeholder:text-white/20"
                                                    placeholder="Cód. Cliente"
                                                />
                                            ) : (
                                                <span className={`text-[11px] font-mono truncate ${pkg.clientCode ? 'text-white' : 'text-white/30 italic'}`}>
                                                    {pkg.clientCode || 'Sem código'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {editingCode === pkg.id ? (
                                                <>
                                                    <button onClick={() => handleSaveCode(pkg.id)} className="p-1 hover:text-emerald-400 text-emerald-400/50"><Save size={14} /></button>
                                                    <button onClick={() => setEditingCode(null)} className="p-1 hover:text-red-400 text-red-400/50"><X size={14} /></button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingCode(pkg.id);
                                                        setTempCode(pkg.clientCode || '');
                                                    }}
                                                    className="p-1 opacity-0 group-hover/code:opacity-100 hover:text-primary text-muted-foreground transition-all"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6 flex-1">
                                        <div>
                                            <div className="flex justify-between items-end mb-1.5">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Consumo de Áudios</span>
                                                <span className={`text-xs font-black ${getUsageColor(pkg)}`}>
                                                    {pkg.usedAudios} {pkg.audioLimit > 0 ? `/ ${pkg.audioLimit}` : '(Ilimitado)'}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getUsagePercent(pkg) >= 90 ? 'from-red-500 to-orange-500' : 'from-primary to-emerald-500'}`}
                                                    style={{ width: `${pkg.audioLimit > 0 ? getUsagePercent(pkg) : 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <span className="text-[10px] text-muted-foreground uppercase block mb-0.5">Taxa Fixa</span>
                                                <span className="text-sm font-bold text-white">{formatCurrency(Number(pkg.fixedFee))}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground uppercase block mb-0.5">Áudio Extra</span>
                                                <span className="text-sm font-bold text-white">{formatCurrency(Number(pkg.extraAudioFee))}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-[10px]">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar size={12} className="text-primary" />
                                                {new Date(pkg.startDate).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock size={12} className="text-primary" />
                                                Até {new Date(pkg.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex gap-2">
                                        <button
                                            onClick={() => onAddNewOrder(pkg)}
                                            className="flex-1 btn-primary py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                        >
                                            <Plus size={14} />
                                            NOVO PEDIDO
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* List View */
                        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4">Cliente / Pacote</th>
                                        <th className="px-6 py-4">Cód. Cliente</th>
                                        <th className="px-6 py-4 text-center">Consumo</th>
                                        <th className="px-6 py-4">Status / Validade</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredPackages.map(pkg => (
                                        <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{pkg.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                                        <Users size={10} /> {pkg.client?.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 group/code-list">
                                                    {editingCode === pkg.id ? (
                                                        <input
                                                            autoFocus
                                                            value={tempCode}
                                                            onChange={(e) => setTempCode(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveCode(pkg.id);
                                                                if (e.key === 'Escape') setEditingCode(null);
                                                            }}
                                                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white w-24 outline-none focus:border-primary/50"
                                                            placeholder="Código"
                                                        />
                                                    ) : (
                                                        <span className={`text-[11px] font-mono ${pkg.clientCode ? 'text-white' : 'text-white/30 italic'}`}>
                                                            {pkg.clientCode || 'Sem código'}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (editingCode === pkg.id) handleSaveCode(pkg.id);
                                                            else {
                                                                setEditingCode(pkg.id);
                                                                setTempCode(pkg.clientCode || '');
                                                            }
                                                        }}
                                                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-primary transition-all rounded hover:bg-white/5"
                                                    >
                                                        {editingCode === pkg.id ? <Save size={12} /> : <Edit2 size={12} />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                                                    <div className="flex justify-between w-full text-[9px] font-black uppercase tracking-tighter">
                                                        <span className={getUsageColor(pkg)}>
                                                            {pkg.usedAudios} {pkg.audioLimit > 0 ? `/ ${pkg.audioLimit}` : '(Unlimited)'}
                                                        </span>
                                                        <span className="text-muted-foreground">{Math.round(getUsagePercent(pkg))}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getUsagePercent(pkg) >= 90 ? 'from-red-500 to-orange-500' : 'from-primary to-emerald-500'}`}
                                                            style={{ width: `${pkg.audioLimit > 0 ? getUsagePercent(pkg) : 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                        <Calendar size={10} className="text-primary" />
                                                        Expira em {new Date(pkg.endDate).toLocaleDateString()}
                                                    </div>
                                                    <span className={`text-[9px] font-black mt-1 uppercase ${pkg.active ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {pkg.active ? 'PACOTE ATIVO' : 'PACOTE INATIVO'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => onAddNewOrder(pkg)}
                                                    className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    title="Novo Pedido de Pacote"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackageList;
