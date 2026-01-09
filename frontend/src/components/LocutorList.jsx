import React, { useState, useEffect } from 'react';
import {
    Mic2,
    Search,
    Trash2,
    Edit,
    Plus,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Mail,
    Phone,
    Music,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ArrowUpDown
} from 'lucide-react';
import { locutorAPI } from '../services/api';
import { formatPhone, formatCurrency } from '../utils/formatters';

const LocutorList = ({ onEditLocutor, onAddNewLocutor }) => {
    const [locutores, setLocutores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchLocutores();
    }, [statusFilter]);

    const fetchLocutores = async () => {
        setLoading(true);
        try {
            const data = await locutorAPI.list({
                search,
                status: statusFilter
            });
            setLocutores(data);
        } catch (error) {
            console.error('Error fetching locutores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchLocutores();
    };

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await locutorAPI.delete(id);
            setDeleteConfirm(null);
            fetchLocutores();
        } catch (error) {
            console.error('Error deleting locutor:', error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 flex-shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Mic2 className="text-primary" size={24} />
                        Gerenciamento de Locutores
                    </h2>
                    <p className="text-[11px] text-[#999999] mt-0.5">Total de {locutores.length} locutores cadastrados</p>
                </div>

                <button
                    onClick={onAddNewLocutor}
                    className="btn-primary flex items-center gap-2 px-6"
                >
                    <Plus size={18} />
                    <span>Novo Locutor</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="card-glass-dark p-3 rounded-2xl mb-4 border border-white/5 flex-shrink-0">
                <div className="flex flex-col md:flex-row gap-3">
                    <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou especialidade..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-input-background border border-border rounded-xl pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground text-xs"
                        />
                    </form>

                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-input-background border border-border rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary/50"
                        >
                            <option value="">Todos os Status</option>
                            <option value="DISPONIVEL">Disponível</option>
                            <option value="INDISPONIVEL">Indisponível</option>
                            <option value="FERIAS">Em Férias</option>
                        </select>

                        <button
                            onClick={fetchLocutores}
                            className="btn-secondary px-4 py-2 text-xs"
                        >
                            Atualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-card border-b border-border text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-2.5">Locutor / Contato</th>
                                <th className="px-6 py-2.5">Status</th>
                                <th className="px-4 py-2.5 text-center">Preço (OFF)</th>
                                <th className="px-4 py-2.5 text-center">Preço (PROD)</th>
                                <th className="px-4 py-2.5 text-center">Trabalhos</th>
                                <th className="px-6 py-2.5 text-right">Ações</th>
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
                            ) : locutores.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3">
                                            <Mic2 size={48} className="opacity-20" />
                                            <p className="text-lg">Nenhum locutor encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                locutores.map((locutor) => (
                                    <tr key={locutor.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-2">
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-semibold text-[13px] group-hover:text-primary transition-colors">
                                                    {locutor.name}
                                                </span>
                                                {locutor.realName && (
                                                    <span className="text-[10px] text-[#666666] font-mono leading-none mt-0.5">
                                                        ({locutor.realName})
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Phone size={10} className="text-[#666666]" />
                                                    <span className="text-[10px] text-[#666666]">
                                                        {formatPhone(locutor.phone) || 'Sem telefone'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2">
                                            <span className={`status-badge ${locutor.status === 'DISPONIVEL' ? 'status-delivered' :
                                                locutor.status === 'FERIAS' ? 'status-faturado' : 'status-cancelled'
                                                }`}>
                                                {locutor.status === 'DISPONIVEL' ? 'Disponível' :
                                                    locutor.status === 'FERIAS' ? 'Em Férias' : 'Indisponível'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="text-white text-xs font-bold">
                                                {formatCurrency(Number(locutor.priceOff))}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="text-white text-xs font-bold">
                                                {formatCurrency(Number(locutor.priceProduzido))}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="px-2 py-0.5 rounded bg-white/5 text-white text-[10px] font-bold">
                                                {locutor._count?.orders || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {locutor.reelsUrl && (
                                                    <a
                                                        href={locutor.reelsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 hover:bg-white/10 rounded-lg text-primary hover:text-foreground transition-all shadow-sm"
                                                        title="Ouvir Reel/Portfólio"
                                                    >
                                                        <Music size={16} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => onEditLocutor(locutor)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-[#999999] hover:text-white transition-all shadow-sm"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(locutor)}
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
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground text-center mb-2">Excluir Locutor?</h3>
                        <p className="text-sm text-muted-foreground text-center mb-8">
                            O locutor <span className="text-foreground font-bold">{deleteConfirm.name}</span> será removido permanentemente do sistema.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleDelete(deleteConfirm.id)}
                                disabled={deleting}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Exclusão'}
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

export default LocutorList;
