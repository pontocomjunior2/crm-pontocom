import React, { useState, useEffect } from 'react';
import { backupAPI } from '../services/api';
import { Database, Cloud, Save, Play, Clock, Check, AlertCircle, Loader2, HardDrive, FileJson, Folder, ShieldCheck, PenTool } from 'lucide-react';

const BackupSettings = () => {
    const [config, setConfig] = useState({
        folderId: '',
        serviceAccountKey: '',
        cronSchedule: '0 3 * * *',
        keepDays: 7,
        enabled: false
    });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isEditingKey, setIsEditingKey] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [configData, logsData] = await Promise.all([
                backupAPI.getConfig(),
                backupAPI.getLogs()
            ]);

            const hasKey = configData.serviceAccountKey && configData.serviceAccountKey.includes('********');
            setIsEditingKey(!hasKey);

            setConfig({
                ...configData,
                serviceAccountKey: configData.serviceAccountKey || ''
            });
            setLogs(logsData);
        } catch (error) {
            setMessage({ type: 'error', text: 'Falha ao carregar dados de backup' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const payload = { ...config };
            // If we are NOT editing the key (masked view), don't send the mask string to the server
            if (!isEditingKey) {
                delete payload.serviceAccountKey;
            }

            await backupAPI.updateConfig(payload);
            setMessage({ type: 'success', text: 'Configuração salva com sucesso!' });

            // Critical: Re-fetch data to ensure we have the masked version and updated persistence
            const updated = await backupAPI.getConfig();
            const hasKey = updated.serviceAccountKey && updated.serviceAccountKey.includes('********');
            setIsEditingKey(!hasKey);
            setConfig(updated);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar configuração' });
        } finally {
            setSaving(false);
        }
    };

    const handleTrigger = async () => {
        if (!window.confirm('Deseja iniciar um backup manual para o Google Drive agora?')) return;

        setRunning(true);
        setMessage({ type: '', text: '' });
        try {
            await backupAPI.trigger();
            setMessage({ type: 'success', text: 'Backup no Google Drive concluído com sucesso!' });
            const logsData = await backupAPI.getLogs();
            setLogs(logsData);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao realizar backup: ' + error.message });
        } finally {
            setRunning(false);
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-primary" size={32} />
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {/* Form Section */}
            <div className="space-y-6">
                <div className="bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl">
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3 mb-6">
                        <Cloud className="text-primary" />
                        GOOGLE DRIVE BACKUP
                    </h2>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                                <Folder size={14} className="text-primary" />
                                Google Drive Folder ID
                            </label>
                            <input
                                type="text"
                                value={config.folderId || ''}
                                onChange={e => setConfig({ ...config, folderId: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                                placeholder="ID da pasta no GDrive"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                                <FileJson size={14} className="text-primary" />
                                Service Account JSON Key
                            </label>

                            {!isEditingKey ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                                            <ShieldCheck className="text-emerald-400" size={24} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-white block">Credencial Protegida</span>
                                            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-tight">Status: Persistido no Banco</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingKey(true)}
                                        className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-2"
                                    >
                                        <PenTool size={14} />
                                        ALTERAR
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <textarea
                                        value={config.serviceAccountKey || ''}
                                        onChange={e => setConfig({ ...config, serviceAccountKey: e.target.value })}
                                        rows={8}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm font-mono"
                                        placeholder="Cole aqui o conteúdo do seu arquivo .json da Service Account"
                                    />
                                    {config.serviceAccountKey && config.serviceAccountKey.includes('********') && (
                                        <p className="text-[10px] text-amber-400 font-bold ml-1">PARE! Não tente editar o valor protegido diretamente. Clique em Alterar para colar uma nova chave.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                                    <Clock size={14} />
                                    Agenda (Cron)
                                </label>
                                <input
                                    type="text"
                                    value={config.cronSchedule}
                                    onChange={e => setConfig({ ...config, cronSchedule: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                                    placeholder="0 3 * * *"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Retenção (Dias)</label>
                                <input
                                    type="number"
                                    value={config.keepDays}
                                    onChange={e => setConfig({ ...config, keepDays: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div
                                onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                                className={`w-12 h-6 px-1 flex items-center rounded-full cursor-pointer transition-all ${config.enabled ? 'bg-primary' : 'bg-white/10'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-md ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                            <div>
                                <span className="text-sm font-bold text-white block">Ativar Backup Automático</span>
                                <span className="text-[10px] text-muted-foreground">O sistema enviará os backups conforme a agenda.</span>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                <div className="flex items-center gap-3">
                                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                                    <span className="text-sm font-medium">{message.text}</span>
                                </div>
                                {message.type === 'success' && (
                                    <button
                                        type="button"
                                        onClick={() => setMessage({ type: '', text: '' })}
                                        className="text-[10px] font-black uppercase opacity-50 hover:opacity-100"
                                    >
                                        Fechar
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="pt-2 flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                SALVAR CONFIGURAÇÕES
                            </button>

                            <button
                                type="button"
                                onClick={handleTrigger}
                                disabled={running || !config.enabled}
                                className="px-6 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {running ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                                {running ? 'PROCESSANDO...' : 'TESTAR'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Logs Section */}
            <div className="space-y-6 flex flex-col h-full">
                <div className="bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl flex-1 flex flex-col">
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3 mb-6">
                        <Clock className="text-primary" />
                        HISTÓRICO NO DRIVE
                    </h2>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                                <Database size={48} className="opacity-10 mb-4" />
                                <p>Nenhum log de backup encontrado</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logs.map(log => (
                                    <div key={log.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/15 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {log.status === 'SUCCESS' ? <HardDrive size={20} /> : <AlertCircle size={20} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{log.filename}</div>
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-2 font-mono">
                                                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                                                    <span>•</span>
                                                    <span>{formatSize(log.size)}</span>
                                                </div>
                                                {log.error && <div className="text-[10px] text-red-400 mt-1 font-medium bg-red-400/5 px-2 py-1 rounded inline-block">{log.error}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 p-5 bg-white/5 rounded-2xl border border-white/10 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all rotate-12">
                            <ShieldCheck size={80} />
                        </div>
                        <h4 className="text-xs font-black text-white uppercase mb-2 flex items-center gap-2">
                            DICA DE SEGURANÇA
                        </h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed relative z-10">
                            Após salvar pela primeira vez, sua chave JSON é mascarada por segurança. Se precisar atualizar a pasta do Drive, pode clicar em <strong>Salvar</strong> sem precisar colar a chave novamente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackupSettings;
