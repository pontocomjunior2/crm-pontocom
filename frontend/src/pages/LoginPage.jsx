import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const LoginPage = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || 'E-mail ou senha incorretos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0c] relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Logo / Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-2xl shadow-primary/20 mb-6 group transition-transform hover:scale-110 duration-500">
                        <LogIn className="text-white shrink-0" size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">PONTOCOM</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Acesso ao Sistema CRM</p>
                </div>

                {/* Login Card */}
                <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-in shake duration-500">
                                <AlertCircle size={20} className="shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">E-mail</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-white/20 font-medium"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-white/20 font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group h-14"
                        >
                            {loading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    <span>CONECTAR</span>
                                    <CheckCircle2 size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-8">
                    <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-widest">
                        © 2026 Pontocom Audio CRM. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
