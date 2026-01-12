import React, { useState, useEffect } from 'react';
import * as API from '../services/api';
const { userAPI, tierAPI } = API;
import { Plus, Trash2, Edit2, Shield, User as UserIcon, Mail, Loader2, X, Check, Search, Database } from 'lucide-react';
import BackupSettings from './BackupSettings';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' or 'tiers'

    // User Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        tierId: ''
    });

    // Tier Modal State
    const [tierModalOpen, setTierModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState(null);
    const [tierFormData, setTierFormData] = useState({
        name: '',
        accessDashboard: false,
        accessPedidos: false,
        accessClientes: false,
        accessLocutores: false,
        accessFornecedores: false,
        accessFaturamento: false,
        accessRelatorios: false,
        accessUsuarios: false
    });

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([loadUsers(), loadTiers()]);
        setLoading(false);
    };

    const loadUsers = async () => {
        try {
            const data = await userAPI.list();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadTiers = async () => {
        try {
            const data = await tierAPI.list();
            setTiers(data);
        } catch (error) {
            console.error('Error loading tiers:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await userAPI.update(editingUser.id, formData);
            } else {
                await userAPI.create(formData);
            }
            setModalOpen(false);
            loadUsers();
            setFormData({ name: '', email: '', password: '', role: 'USER', tierId: '' });
            setEditingUser(null);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                await userAPI.delete(id);
                loadUsers();
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            email: user.email,
            password: '',
            role: user.role,
            tierId: user.tierId || ''
        });
        setModalOpen(true);
    };

    const handleSubmitTier = async (e) => {
        e.preventDefault();
        try {
            if (editingTier) {
                await tierAPI.update(editingTier.id, tierFormData);
            } else {
                await tierAPI.create(tierFormData);
            }
            setTierModalOpen(false);
            loadTiers();
            setEditingTier(null);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeleteTier = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este Tier?')) {
            try {
                await tierAPI.delete(id);
                loadTiers();
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const openEditTier = (tier) => {
        setEditingTier(tier);
        setTierFormData({
            name: tier.name,
            accessDashboard: tier.accessDashboard,
            accessPedidos: tier.accessPedidos,
            accessClientes: tier.accessClientes,
            accessLocutores: tier.accessLocutores,
            accessFornecedores: tier.accessFornecedores,
            accessFaturamento: tier.accessFaturamento,
            accessRelatorios: tier.accessRelatorios,
            accessUsuarios: tier.accessUsuarios,
        });
        setTierModalOpen(true);
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="text-primary animate-spin" size={40} />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <Shield className="text-primary" />
                        USUÁRIOS E PERMISSÕES
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Gerencie os acessos, cargos e permissões do sistema</p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setActiveSubTab('users')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'users' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
                    >
                        USUÁRIOS
                    </button>
                    <button
                        onClick={() => setActiveSubTab('tiers')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'tiers' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
                    >
                        TIERS (CARGOS)
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {activeSubTab === 'users' && (
                        <>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar usuários..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all w-64"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setEditingUser(null);
                                    setFormData({ name: '', email: '', password: '', role: 'USER', tierId: '' });
                                    setModalOpen(true);
                                }}
                                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                NOVO USUÁRIO
                            </button>
                        </>
                    )}
                    {activeSubTab === 'tiers' && (
                        <button
                            onClick={() => {
                                setEditingTier(null);
                                setTierFormData({
                                    name: '',
                                    accessDashboard: false,
                                    accessPedidos: false,
                                    accessClientes: false,
                                    accessLocutores: false,
                                    accessFornecedores: false,
                                    accessFaturamento: false,
                                    accessRelatorios: false,
                                    accessUsuarios: false
                                });
                                setTierModalOpen(true);
                            }}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            NOVO TIER
                        </button>
                    )}
                </div>
            </div>

            {activeSubTab === 'users' ? (
                <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Acesso</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Tier (Cargo)</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold border border-primary/20">
                                                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={20} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{user.name || 'Sem nome'}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail size={12} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${user.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === 'ADMIN' ? (
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Ilimitado</span>
                                        ) : (
                                            <span className="text-sm text-foreground font-medium">
                                                {user.tier?.name || <em className="text-muted-foreground text-xs font-normal">Nenhum tier atribuído</em>}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(user)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-400 transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center">
                            <Shield className="mx-auto text-muted-foreground mb-4 opacity-20" size={48} />
                            <p className="text-muted-foreground font-medium">Nenhum usuário encontrado</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Nome do Tier</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Permissões Modulares</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Membros</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tiers.map(tier => (
                                <tr key={tier.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-white">{tier.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {tier.accessDashboard && <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded border border-white/10">DASHBOARD</span>}
                                            {tier.accessPedidos && <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded border border-white/10">PEDIDOS</span>}
                                            {tier.accessClientes && <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded border border-white/10">CLIENTES</span>}
                                            {tier.accessLocutores && <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded border border-white/10">LOCUTORES</span>}
                                            {tier.accessFornecedores && <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded border border-white/10">FORNECEDORES</span>}
                                            {tier.accessFaturamento && <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded border border-white/10">FATURAMENTO</span>}
                                            {tier.accessRelatorios && <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded border border-white/10">RELATÓRIOS</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                                        {tier._count?.users || 0} usuários
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditTier(tier)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTier(tier.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-400 transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tiers.length === 0 && (
                        <div className="p-12 text-center">
                            <Shield className="mx-auto text-muted-foreground mb-4 opacity-20" size={48} />
                            <p className="text-muted-foreground font-medium">Nenhum Tier criado ainda</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
                    <div className="relative bg-card border border-white/10 w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                {editingUser ? <Edit2 size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                                {editingUser ? 'EDITAR USUÁRIO' : 'NOVO USUÁRIO'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">E-mail de Acesso</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                                    placeholder="email@empresa.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Senha {editingUser && '(Deixe em branco para não alterar)'}</label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Nível de Acesso (Papel)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'USER' })}
                                        className={`py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${formData.role === 'USER' ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                                    >
                                        <UserIcon size={14} />
                                        COLABORADOR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                                        className={`py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${formData.role === 'ADMIN' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                                    >
                                        <Shield size={14} />
                                        ADMIN
                                    </button>
                                </div>
                            </div>

                            {formData.role === 'USER' && (
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Tier (Permissões Modulares)</label>
                                    <select
                                        value={formData.tierId}
                                        onChange={e => setFormData({ ...formData, tierId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-card">Sem Tier (Acesso Restrito)</option>
                                        {tiers.map(tier => (
                                            <option key={tier.id} value={tier.id} className="bg-card">{tier.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">O Tier define quais páginas este colaborador poderá acessar.</p>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-all"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-2 grow px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                                >
                                    <Check size={18} />
                                    {editingUser ? 'SALVAR ALTERAÇÕES' : 'CRIAR USUÁRIO'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tier Modal */}
            {tierModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setTierModalOpen(false)}></div>
                    <div className="relative bg-card border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <Plus size={20} className="text-primary" />
                                {editingTier ? 'EDITAR TIER' : 'NOVO TIER (CARGO)'}
                            </h2>
                            <button onClick={() => setTierModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitTier} className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Nome do Tier</label>
                                <input
                                    type="text"
                                    required
                                    value={tierFormData.name}
                                    onChange={e => setTierFormData({ ...tierFormData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                                    placeholder="Ex: Financeiro, Produção, Vendedor..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">Permissões de Acesso</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'accessDashboard', label: 'Dashboard' },
                                        { key: 'accessPedidos', label: 'Pedidos' },
                                        { key: 'accessClientes', label: 'Clientes' },
                                        { key: 'accessLocutores', label: 'Locutores' },
                                        { key: 'accessFornecedores', label: 'Fornecedores' },
                                        { key: 'accessFaturamento', label: 'Faturamento' },
                                        { key: 'accessRelatorios', label: 'Relatórios' },
                                        { key: 'accessUsuarios', label: 'Usuários' },
                                    ].map((perm) => (
                                        <div key={perm.key} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                            <div
                                                onClick={() => setTierFormData({ ...tierFormData, [perm.key]: !tierFormData[perm.key] })}
                                                className={`w-10 h-6 px-1 flex items-center rounded-full cursor-pointer transition-all ${tierFormData[perm.key] ? 'bg-primary' : 'bg-white/10'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-md ${tierFormData[perm.key] ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                            </div>
                                            <span className="text-xs font-bold text-white uppercase tracking-tight">{perm.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setTierModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-all"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-2 grow px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                                >
                                    <Check size={18} />
                                    {editingTier ? 'SALVAR TIER' : 'CRIAR TIER'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserList;
