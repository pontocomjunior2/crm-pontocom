import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, Mail, Loader2, X, Check, Search } from 'lucide-react';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await userAPI.list();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
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
            setFormData({ name: '', email: '', password: '', role: 'USER' });
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
            role: user.role
        });
        setModalOpen(true);
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
                        USUÁRIOS
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Gerencie os acessos e permissões do sistema</p>
                </div>

                <div className="flex items-center gap-3">
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
                            setFormData({ name: '', email: '', password: '', role: 'USER' });
                            setModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        NOVO USUÁRIO
                    </button>
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Usuário</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Criado em</th>
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
                                <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                                    {new Date(user.createdAt).toLocaleDateString()}
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
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Nível de Acesso</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'USER' })}
                                        className={`py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${formData.role === 'USER' ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                                    >
                                        <UserIcon size={14} />
                                        USER
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
        </div>
    );
};

export default UserList;
