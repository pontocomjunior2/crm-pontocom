import React, { useState, useEffect } from 'react';
import {
    X,
    Upload,
    Music,
    Trash2,
    Users,
    Building2,
    Calendar,
    Save,
    Loader2,
    AlertCircle,
    FileAudio
} from 'lucide-react';
import { locutorAPI, orderAPI } from '../services/api';
import { showToast } from '../utils/toast';

const PackageBatchUploadModal = ({ pkg, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [locutores, setLocutores] = useState([]);
    const [loadingLocutores, setLoadingLocutores] = useState(false);

    const [formData, setFormData] = useState({
        locutorId: '',
        locutor: '',
        supplierId: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const loadLocutores = async () => {
            setLoadingLocutores(true);
            try {
                const data = await locutorAPI.list();
                setLocutores(data || []);
            } catch (error) {
                console.error('Error loading locutores:', error);
                showToast.error('Erro ao carregar locutores');
            } finally {
                setLoadingLocutores(false);
            }
        };
        loadLocutores();
    }, []);

    const processFiles = (selectedFiles) => {
        const newFiles = selectedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            title: file.name.replace(/\.[^/.]+$/, ""), // Remover extensão para o título
            fileName: file.name
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const handleLocutorChange = (e) => {
        const id = e.target.value;
        const selected = locutores.find(l => String(l.id) === String(id));
        if (selected) {
            let supId = '';
            if (selected.suppliers?.length === 1) supId = selected.suppliers[0].id;

            setFormData(prev => ({
                ...prev,
                locutorId: id,
                locutor: selected.name,
                supplierId: supId
            }));
        } else {
            setFormData(prev => ({ ...prev, locutorId: '', locutor: '', supplierId: '' }));
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        processFiles(selectedFiles);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            processFiles(droppedFiles);
        }
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) {
            showToast.error('Selecione pelo menos um arquivo de áudio');
            return;
        }
        if (!formData.locutorId) {
            showToast.error('Selecione o locutor');
            return;
        }

        setLoading(true);
        try {
            const batchData = {
                packageId: pkg.id,
                clientId: pkg.clientId,
                locutor: formData.locutor,
                locutorId: formData.locutorId,
                supplierId: formData.supplierId,
                date: formData.date,
                items: files.map(f => ({
                    title: f.title,
                    fileName: f.fileName
                }))
            };

            await orderAPI.batchCreate(batchData);
            showToast.success(`${files.length} pedidos lançados com sucesso!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Batch upload error:', error);
            showToast.error(error.message || 'Erro ao lançar pedidos em lote');
        } finally {
            setLoading(false);
        }
    };

    const selectedLocutor = locutores.find(l => String(l.id) === String(formData.locutorId));

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in fade-in duration-300">
            <div className="card-glass-dark w-full max-w-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">Lançamento em Lote</h2>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">{pkg.client?.name} - {pkg.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <form id="batchUploadForm" onSubmit={handleSubmit} className="space-y-8">
                        {/* Common Config Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="md:col-span-3">
                                <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Informações Comuns</h3>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Users size={14} className="text-primary" />
                                    Locutor / Voz
                                </label>
                                <select
                                    required
                                    value={formData.locutorId}
                                    onChange={handleLocutorChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                                >
                                    <option value="" className="bg-[#1a1a1a]">Selecione...</option>
                                    {locutores.map(l => (
                                        <option key={l.id} value={l.id} className="bg-[#1a1a1a]">{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Building2 size={14} className="text-primary" />
                                    Fornecedor
                                </label>
                                <select
                                    value={formData.supplierId}
                                    disabled={!formData.locutorId || (selectedLocutor?.suppliers?.length || 0) <= 1}
                                    onChange={(e) => setFormData(p => ({ ...p, supplierId: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm disabled:opacity-50"
                                >
                                    <option value="" className="bg-[#1a1a1a]">Padrão/Nenhum</option>
                                    {selectedLocutor?.suppliers?.map(s => (
                                        <option key={s.id} value={s.id} className="bg-[#1a1a1a]">{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Calendar size={14} className="text-primary" />
                                    Competência
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* File Upload Section */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Music size={14} className="text-primary" />
                                Arquivos de Áudio
                            </label>

                            <div
                                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center border-spacing-4 transition-all cursor-pointer group relative ${isDragging ? 'border-primary bg-primary/10 scale-[1.02] shadow-2xl shadow-primary/20' : 'border-white/10 bg-white/5 hover:border-primary/30 hover:bg-primary/5'}`}
                                onClick={() => document.getElementById('batch-file-input').click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    id="batch-file-input"
                                    type="file"
                                    multiple
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-primary/10">
                                    <FileAudio size={32} />
                                </div>
                                <p className="text-sm font-bold text-white">Arraste os áudios ou clique para selecionar</p>
                                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Suporta múltiplos arquivos .mp3, .wav, .off</p>
                            </div>

                            {/* Files List */}
                            {files.length > 0 && (
                                <div className="space-y-2 mt-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    <div className="flex items-center justify-between px-2 mb-2">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{files.length} arquivos detectados</span>
                                        <button
                                            type="button"
                                            onClick={() => setFiles([])}
                                            className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest"
                                        >
                                            Limpar Tudo
                                        </button>
                                    </div>
                                    {files.map((f, idx) => (
                                        <div key={f.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all slide-in-from-left-2 animate-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                                <Music size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{f.fileName}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Título: {f.title}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(f.id)}
                                                className="p-2 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Summary / Tip */}
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4 items-start">
                            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Atenção</p>
                                <p className="text-[11px] text-amber-500/70 leading-relaxed font-medium">
                                    Será lançado **1 crédito por arquivo** para o pacote selecionado.
                                    O nome de cada arquivo será usado como o título do pedido.
                                    Você poderá ajustar detalhes individuais posteriormente em "Editar Pedido".
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex gap-4 bg-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all"
                    >
                        CANCELAR
                    </button>
                    <button
                        form="batchUploadForm"
                        type="submit"
                        disabled={loading || files.length === 0}
                        className="flex-[2] btn-primary px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/30 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                <span className="font-black tracking-tight uppercase">LANÇAR {files.length} PEDIDOS</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackageBatchUploadModal;
