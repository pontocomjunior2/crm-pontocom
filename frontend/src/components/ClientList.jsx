import React, { useState, useEffect } from 'react';
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
    Calendar
} from 'lucide-react';
import { clientAPI } from '../services/api';
import { formatCNPJ, formatPhone, formatCurrency } from '../utils/formatters';

const ClientList = ({ onEditClient, onAddNewClient }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ativado');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchClients();
    }, [pagination.page, pagination.limit, statusFilter]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await clientAPI.list({
                page: pagination.page,
                limit: pagination.limit,
                search,
                status: statusFilter
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

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="text-[#FF9500]" size={24} />
                        Gerenciamento de Clientes
                    </h2>
                    <p className="text-sm text-[#999999] mt-1">Total de {pagination.total} clientes cadastrados</p>
                </div>

                <button
                    onClick={onAddNewClient}
                    className="btn-primary flex items-center gap-2 px-6"
                >
                    <Plus size={18} />
                    <span>Novo Cliente</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="card-glass-dark p-4 rounded-2xl mb-6 border border-white/5">
                <div className="flex flex-col lg:flex-row gap-4">
                    <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome, CNPJ ou email..."
                            value={search}
                            onChange={handleSearchChange}
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#FF9500]/50 placeholder:text-[#444444] text-sm"
                        />
                    </form>

                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF9500]/50"
                        >
                            <option value="ativado">Ativados</option>
                            <option value="inativo">Inativos</option>
                            <option value="">Todos os Status</option>
                        </select>

                        <button
                            onClick={fetchClients}
                            className="btn-secondary px-6 text-sm"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[#999999] text-[11px] uppercase tracking-wider font-bold">
                                <th className="px-6 py-4">Cliente / CNPJ</th>
                                <th className="px-6 py-4">Contato</th>
                                <th className="px-6 py-4">Localização</th>
                                <th className="px-6 py-4 flex items-center gap-1">
                                    <TrendingUp size={14} className="text-[#FF9500]" />
                                    <span>Vendas</span>
                                </th>
                                <th className="px-6 py-4">Status</th>
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
                                        <div className="flex flex-col items-center gap-3 text-[#666666]">
                                            <Users size={48} className="opacity-20" />
                                            <p className="text-lg">Nenhum cliente encontrado</p>
                                            <button onClick={onAddNewClient} className="text-[#FF9500] hover:underline text-sm font-medium">
                                                Clique aqui para cadastrar o primeiro
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium text-sm group-hover:text-[#FF9500] transition-colors">
                                                    {client.name}
                                                </span>
                                                <span className="text-[11px] text-[#666666] font-mono mt-0.5">
                                                    {formatCNPJ(client.cnpj_cpf)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-[#999999] text-xs">
                                                <MapPin size={12} className="text-[#666666]" />
                                                <span>{client.cidade ? `${client.cidade}/${client.estado}` : 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 bg-orange-500/10 px-2 py-1 rounded-lg w-fit">
                                                    <span className="text-[#FF9500] font-bold text-xs">
                                                        {formatCurrency(client.totalVendas || 0)}
                                                    </span>
                                                </div>
                                                {client.dataUltimaVenda && (
                                                    <div className="flex items-center gap-1 text-[10px] text-[#666666] mt-1.5 ml-0.5">
                                                        <Calendar size={10} />
                                                        <span>Última: {client.dataUltimaVenda}</span>
                                                    </div>
                                                )}
                                                {client.salesCount > 0 && (
                                                    <span className="text-[10px] text-[#444444] mt-0.5 ml-0.5">
                                                        {client.salesCount} vendas no total
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
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
                <div className="mt-auto px-6 py-4 border-t divider-dark flex items-center justify-between">
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
                                            ? 'bg-gradient-primary text-white shadow-lg shadow-orange-500/20'
                                            : 'text-[#666666] hover:text-white hover:bg-white/5'
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
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-[#161616] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white text-center mb-2">Desativar Cliente?</h3>
                        <p className="text-sm text-[#999999] text-center mb-8">
                            O cliente <span className="text-white font-bold">{deleteConfirm.name}</span> será marcado como inativo e não aparecerá nas buscas padrão.
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
            )}
        </div>
    );
};

export default ClientList;
