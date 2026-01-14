import React, { useState, useEffect, useRef } from 'react';
import {
    Users,
    Search,
    Trash2,
    Edit,
    MoreVertical,
    ExternalLink,
    Filter,
    Plus,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Mail,
    Phone,
    MapPin,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Calendar,
    ArrowUpDown,
    FileUp
} from 'lucide-react';
import { clientAPI, importAPI } from '../services/api';
import { formatCNPJ, formatPhone, formatCurrency } from '../utils/formatters';

const ClientList = ({ onEditClient, onAddNewClient }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ativado');
    const [nameFilter, setNameFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [cnpjFilter, setCnpjFilter] = useState('');
    const [packageFilter, setPackageFilter] = useState(''); // '', 'active', 'inactive'
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [sortConfig, setSortConfig] = useState({
        key: 'name',
        order: 'asc'
    });

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchClients();
    }, [pagination.page, pagination.limit, statusFilter, sortConfig, packageFilter]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await clientAPI.list({
                page: pagination.page,
                limit: pagination.limit,
                search,
                name: nameFilter,
                cidade: cityFilter,
                cnpj_cpf: cnpjFilter,
                status: statusFilter,
                packageStatus: packageFilter,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.order
            });
            setClients(response.clients || []);
            setPagination(prev => ({
                ...prev,
                total: response.pagination.total,
                totalPages: response.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchClients();
    };

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await clientAPI.delete(id);
            setDeleteConfirm(null);
            fetchClients();
        } catch (error) {
            console.error('Error deleting client:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleClearFilters = () => {
        setSearch('');
        setNameFilter('');
        setCityFilter('');
        setCnpjFilter('');
        setStatusFilter('ativado');
        setPackageFilter('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportMessage(null);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const xmlData = event.target.result;
                    const response = await importAPI.clients(xmlData);
                    setImportMessage({ type: 'success', text: response.message });
                    fetchClients();

                    // Clear message after 5s
                    setTimeout(() => setImportMessage(null), 5000);
                } catch (error) {
                    console.error('Import process error:', error);
                    setImportMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao processar arquivo' });
                } finally {
                    setImporting(false);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('File read error:', error);
            setImportMessage({ type: 'error', text: 'Erro ao ler arquivo' });
            setImporting(false);
        }

        // Reset input
        e.target.value = '';
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Users className="text-primary" size={24} />
                        Gerenciamento de Clientes
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Total de {pagination.total} clientes cadastrados</p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xml"
                        className="hidden"
                    />
                    <button
                        onClick={handleImportClick}
                        disabled={importing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-foreground rounded-xl border border-white/10 transition-all font-medium disabled:opacity-50"
                    >
                        {importing ? (
                            <Loader2 size={20} className="animate-spin text-primary" />
                        ) : (
                            <FileUp size={20} className="text-primary" />
                        )}
                        <span>Importar XML</span>
                    </button>
                    <button
                        onClick={onAddNewClient}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 font-bold"
                    >
                        <Plus size={20} />
                        <span>Novo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Import Feedback */}
            {importMessage && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${importMessage.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                    {importMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-medium">{importMessage.text}</span>
                    <button onClick={() => setImportMessage(null)} className="ml-auto text-xs opacity-50 hover:opacity-100">Fechar</button>
                </div>
            )}

            {/* Filters & Search */}
            <div className="card-glass-dark p-4 rounded-2xl mb-6 border border-white/5 bg-card">
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Nome do Cliente"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full bg-input-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground text-sm"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cidade"
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground text-sm"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="CNPJ / CPF"
                                value={cnpjFilter}
                                onChange={(e) => setCnpjFilter(e.target.value)}
                                className="w-full bg-input-background border border-border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground text-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-input-background border border-border rounded-xl px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary/50"
                        >
                            <option value="ativado">Status: Ativados</option>
                            <option value="inativo">Status: Inativos</option>
                            <option value="">Status: Todos</option>
                        </select>
                        <select
                            value={packageFilter}
                            onChange={(e) => setPackageFilter(e.target.value)}
                            className="bg-input-background border border-border rounded-xl px-4 py-2 text-foreground text-sm focus:outline-none focus:border-primary/50"
                        >
                            <option value="">Pacotes: Todos</option>
                            <option value="active">Com Pacote Ativo</option>
                            <option value="inactive">Sem Pacote Ativo</option>
                        </select>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                placeholder="Busca global (email, razão social...)"
                                value={search}
                                onChange={handleSearchChange}
                                className="w-full bg-input-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground text-xs"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 text-xs text-muted-foreground hover:text-white transition-colors"
                            >
                                Limpar Filtros
                            </button>
                            <button
                                onClick={() => {
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                    fetchClients();
                                }}
                                className="btn-primary-small px-6 text-xs"
                            >
                                Pesquisar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-card border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider font-bold">
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Cliente
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'name' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('emailPrincipal')}
                                >
                                    <div className="flex items-center gap-2">
                                        Contato
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'emailPrincipal' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('cidade')}
                                >
                                    <div className="flex items-center gap-2">
                                        Localização
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'cidade' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors group/head"
                                    onClick={() => handleSort('totalVendas')}
                                >
                                    <div className="flex items-center gap-1">
                                        <TrendingUp size={14} className="text-primary" />
                                        <span>Vendas</span>
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'totalVendas' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors group/head"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        Status
                                        <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === 'status' ? 'opacity-100 text-primary' : 'opacity-0 group-hover/head:opacity-50'}`} />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divider-dark">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-8">
                                            <div className="h-4 bg-white/5 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <Users size={48} className="opacity-20" />
                                            <p className="text-lg">Nenhum cliente encontrado</p>
                                            <p className="text-sm opacity-60">Tente ajustar seus filtros de pesquisa para encontrar o que procura.</p>
                                            {(search || nameFilter || cityFilter || cnpjFilter) && (
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="mt-2 text-primary hover:underline text-sm font-medium"
                                                >
                                                    Limpar todos os filtros
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-foreground font-semibold text-[13px] group-hover:text-primary transition-colors">
                                                        {client.name}
                                                    </span>
                                                    {client.packages?.length > 0 && (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20 flex items-center gap-1">
                                                            <CheckCircle2 size={10} />
                                                            Plano Ativo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[#999999] text-xs">
                                                    <Mail size={12} className="text-[#666666]" />
                                                    <span className="truncate max-w-[150px]">{client.emailPrincipal || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[#999999] text-xs">
                                                    <Phone size={12} className="text-[#666666]" />
                                                    <span>{formatPhone(client.telefonePrincipal) || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2">
                                            <div className="flex items-center gap-2 text-[#999999] text-xs">
                                                <MapPin size={12} className="text-[#666666]" />
                                                <span>{client.cidade ? `${client.cidade}/${client.estado}` : 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg w-fit">
                                                    <span className="text-primary font-bold text-xs">
                                                        {formatCurrency(client.totalVendas || 0)}
                                                    </span>
                                                </div>
                                                {client.dataUltimaVenda && (
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5 ml-0.5">
                                                        <Calendar size={10} />
                                                        <span>Última: {client.dataUltimaVenda}</span>
                                                    </div>
                                                )}
                                                {client.salesCount > 0 && (
                                                    <span className="text-[10px] text-muted-foreground mt-0.5 ml-0.5">
                                                        {client.salesCount} vendas no total
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-2">
                                            <span className={`status-badge ${client.status === 'ativado' ? 'status-delivered' : 'status-faturado'}`}>
                                                {client.status === 'ativado' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onEditClient(client)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-[#999999] hover:text-white transition-all shadow-sm"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(client)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg text-[#999999] hover:text-red-400 transition-all shadow-sm"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Section */}
                <div className="mt-auto px-6 py-2.5 border-t divider-dark flex items-center justify-between">
                    <div className="text-[11px] text-[#666666]">
                        Mostrando {clients.length} de {pagination.total} clientes
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={pagination.page === 1 || loading}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="p-1.5 hover:bg-white/5 rounded-md disabled:opacity-30 text-[#999999] transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                        className={`min-w-[32px] h-8 rounded-md text-[11px] font-bold transition-all ${pagination.page === pageNum
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            disabled={pagination.page === pagination.totalPages || loading}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="p-1.5 hover:bg-white/5 rounded-md disabled:opacity-30 text-[#999999] transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div >

            {/* Delete Confirmation Modal */}
            {
                deleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground text-center mb-2">Desativar Cliente?</h3>
                            <p className="text-sm text-muted-foreground text-center mb-8">
                                O cliente <span className="text-foreground font-bold">{deleteConfirm.name}</span> será marcado como inativo e não aparecerá nas buscas padrão.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleDelete(deleteConfirm.id)}
                                    disabled={deleting}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {deleting ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Desativação'}
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={deleting}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ClientList;
