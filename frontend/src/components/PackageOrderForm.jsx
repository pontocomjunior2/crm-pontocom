import React, { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    ShoppingCart,
    Calculator,
    User,
    Package,
    Hash,
    Type,
    Save,
    Calendar,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { orderAPI, locutorAPI, clientPackageAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { showToast } from '../utils/toast';

const PackageOrderForm = ({ pkg, onClose, onSuccess, orderToEdit = null }) => {
    const [loading, setLoading] = useState(false);
    const [loadingLocutores, setLoadingLocutores] = useState(true);
    const [locutores, setLocutores] = useState([]);

    const [formData, setFormData] = useState({
        clientId: pkg.clientId,
        packageId: pkg.id,
        title: orderToEdit?.title || '',
        fileName: orderToEdit?.fileName || '',
        locutorId: orderToEdit?.locutorId || '',
        locutor: orderToEdit?.locutor || '',
        tipo: orderToEdit?.tipo || 'OFF',
        creditsToDebit: orderToEdit?.creditsConsumed || 1,
        clientCode: pkg.clientCode || '',
        cacheValor: orderToEdit ? parseFloat(orderToEdit.cacheValor) : 0,
        supplierId: orderToEdit?.supplierId || '',
        status: orderToEdit?.status || 'VENDA'
    });

    useEffect(() => {
        loadLocutores();
    }, []);

    // Auto-update filename
    // Only auto-update if NOT editing OR if user changes relevant fields explicitly
    // For simplicity, we maintain auto-update logic but maybe we should respect existing filename if specific fields didn't change?
    // Let's keep autosync reactive to formData changes. If editing, formData starts with existing values.
    // However, if we just load the form, this useEffect will run and might regenerate the fileName.
    // To prevent overwriting custom filenames on load, we check if changes actually happened relative to initial load?
    // Simplified approach: regenerate based on current formData fields.
    useEffect(() => {
        // If editing and no changes yet, keep original filename (handled by inputs producing changes)
        // But here inputs ARE the dependencies.

        const startNumber = pkg.usedAudios + (orderToEdit ? 0 : 1); // If editing, don't increment next slot, assume current slot (simplified)
        // Actually for editing, calculating "startNumber" is hard because we don't know the "position" of this order just from order data.
        // It's safer to ONLY auto-generate if NOT editing, OR if user wants to recalculate.
        // But the user might want to edit the title and have the filename update.

        // Let's restrict auto-generation:
        if (orderToEdit && formData.fileName === orderToEdit.fileName) {
            // If filename hasn't changed from DB manually, allows update IF title/locutor changed?
            // Complex. Let's stick to standard logic but be careful about startNumber.
        }

        const totalCredits = parseInt(formData.creditsToDebit) || 1;
        // Use existing numbering logic, but for editing it might be weird to assume "next number".
        // If editing, we probably shouldn't auto-update the number part, only the Title/Locutor part.

        const codePart = formData.clientCode ? `${formData.clientCode} ` : '';

        // Only update logic if NOT editing, or accept that editing might reset numbering to "end of queue".
        // Better strategy for EDIT: Do NOT auto-update fileName completely, or allow manual edit.
        // But the requirement says "Nome do Arquivo (Auto-gerado)".

        // For now, let's allow auto-update only for new orders. For edit, we trust what's there unless title changes?
        if (orderToEdit) return; // Disable auto-gen for edits to avoid breaking history numbers

        let numbering = '';
        if (totalCredits === 1) {
            numbering = String(startNumber).padStart(2, '0');
        } else {
            const sequence = [];
            for (let i = 0; i < totalCredits; i++) {
                sequence.push(String(startNumber + i).padStart(2, '0'));
            }
            numbering = sequence.join(', ');
        }

        const limitPart = pkg.audioLimit ? ` de ${pkg.audioLimit}` : '';
        const creditPart = `${numbering}${limitPart} `;

        const locutor = locutores.find(l => l.id === formData.locutorId);
        const detailPart = `(${formData.title || 'S_TITULO'}_${locutor ? locutor.name : 'S_LOC'})`;

        setFormData(prev => ({
            ...prev,
            fileName: `${codePart}${creditPart}${detailPart}`.trim()
        }));
    }, [formData.title, formData.locutorId, formData.creditsToDebit, formData.clientCode, locutores, pkg.usedAudios, pkg.audioLimit, orderToEdit]);

    const loadLocutores = async () => {
        try {
            const data = await locutorAPI.list({ status: 'DISPONIVEL' });
            setLocutores(data || []);
        } catch (error) {
            console.error('Error loading locutores:', error);
        } finally {
            setLoadingLocutores(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'locutorId') {
            const selectedLocutor = locutores.find(l => l.id === value);
            if (selectedLocutor) {
                // Keep existing cache if editing and not changing type logic? 
                // If editing, logic should still apply if I change locutor.
                const cache = selectedLocutor.valorFixoMensal > 0 ? 0 : (formData.tipo === 'OFF' ? selectedLocutor.priceOff : selectedLocutor.priceProduzido);
                let newSupplierId = '';
                if (selectedLocutor.suppliers?.length === 1) {
                    newSupplierId = selectedLocutor.suppliers[0].id;
                }

                setFormData(prev => ({
                    ...prev,
                    locutorId: value,
                    locutor: selectedLocutor.name,
                    cacheValor: cache,
                    supplierId: newSupplierId
                }));
            } else {
                setFormData(prev => ({ ...prev, locutorId: '', locutor: '', supplierId: '', cacheValor: 0 }));
            }
        } else if (name === 'tipo') {
            const locutor = locutores.find(l => l.id === formData.locutorId);
            const newCache = locutor ? (value === 'OFF' ? locutor.priceOff : locutor.priceProduzido) : 0;
            setFormData(prev => ({ ...prev, tipo: value, cacheValor: newCache }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Calculate Cache based on Supplier Credits (if supplier has credits)
    useEffect(() => {
        // If editing, maybe we don't want to re-calc cache unless fields change?
        // But existing useEffect dependency array handles that.

        if (formData.locutorId && formData.supplierId && locutores.length > 0) {
            const locutor = locutores.find(l => l.id === formData.locutorId);
            const supplier = locutor?.suppliers?.find(s => s.id === formData.supplierId);

            if (supplier?.packages?.length > 0) {
                const latestPackage = supplier.packages[0];
                const cost = parseFloat(latestPackage.costPerCredit);
                const credits = parseInt(formData.creditsToDebit) || 1;
                const newCache = cost * credits;

                setFormData(prev => {
                    if (parseFloat(prev.cacheValor) !== newCache) {
                        // Only update if significantly different to assume reactive change
                        // Or just Always update if supplier package exists logic prevails
                        return { ...prev, cacheValor: newCache };
                    }
                    return prev;
                });
            }
        }
    }, [formData.locutorId, formData.supplierId, formData.creditsToDebit, locutores]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.locutorId) {
            showToast.error('Preencha o título e selecione um locutor');
            return;
        }

        setLoading(true);
        try {
            // First, update clientCode if it changed
            if (formData.clientCode !== pkg.clientCode) {
                await clientPackageAPI.update(pkg.id, { clientCode: formData.clientCode });
            }

            // Create or Update
            const orderData = {
                ...formData,
                vendaValor: 0, // Package orders have 0 sale value
                creditsConsumed: parseInt(formData.creditsToDebit),
                serviceType: 'PACOTE DE AUDIOS'
            };

            if (orderToEdit) {
                await orderAPI.update(orderToEdit.id, orderData);
                showToast.success('Pedido atualizado com sucesso!');
            } else {
                await orderAPI.create(orderData);
                showToast.success('Pedido de pacote realizado com sucesso!');
            }

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (error) {
            showToast.error(error);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
            <div className="card-glass-dark w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{orderToEdit ? 'Editar Pedido' : 'Lançar Pedido de Pacote'}</h2>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">{pkg.client?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">

                    <form id="packageOrderForm" onSubmit={handleSubmit} className="space-y-6">
                        {/* Package & Billing Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-black block mb-1">Pacote Relacionado</span>
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    <Package size={14} className="text-primary" />
                                    {pkg.name}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-muted-foreground uppercase font-black block mb-1">Saldo Após Lançamento</span>
                                <div className="text-lg font-black text-emerald-400">
                                    {pkg.usedAudios + parseInt(formData.creditsToDebit || 0)} / {pkg.audioLimit || '∞'}
                                </div>
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Type size={14} className="text-primary" />
                                    Título do Áudio
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                                    placeholder="Ex: Ofertas da Semana - Supermercado X"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Hash size={14} className="text-primary" />
                                    Código do Cliente
                                </label>
                                <input
                                    type="text"
                                    name="clientCode"
                                    value={formData.clientCode}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all font-mono"
                                    placeholder="Ex: CLI01"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <ShoppingCart size={14} className="text-primary" />
                                    Créditos a Debitar
                                </label>
                                <input
                                    type="number"
                                    name="creditsToDebit"
                                    min="1"
                                    value={formData.creditsToDebit}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <User size={14} className="text-primary" />
                                    Locutor / Voz
                                </label>
                                <select
                                    name="locutorId"
                                    required
                                    value={formData.locutorId}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                                >
                                    <option value="" className="bg-[#1a1a1a]">Selecione um locutor...</option>
                                    {locutores.map(l => (
                                        <option key={l.id} value={l.id} className="bg-[#1a1a1a]">{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Hash size={14} className="text-primary" />
                                    Nome do Arquivo (Auto-gerado)
                                </label>
                                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-[11px] break-all min-h-[46px] flex items-center">
                                    {formData.fileName}
                                </div>
                            </div>

                            <div className="md:col-span-2 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Calculator size={20} className="text-primary" />
                                    <div>
                                        <span className="text-[10px] text-primary/70 uppercase font-black block">Custo p/ Empresa (Cache)</span>
                                        <span className="text-lg font-black text-white">{formatCurrency(formData.cacheValor)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-muted-foreground uppercase font-black block">Venda</span>
                                    <span className="text-lg font-black text-muted-foreground italic">Incluído no Pacote</span>
                                </div>
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
                        form="packageOrderForm"
                        type="submit"
                        disabled={loading}
                        className="flex-[2] btn-primary px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/30"
                    >
                        {loading ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                <span className="font-black tracking-tight">{orderToEdit ? 'ATUALIZAR' : 'LANÇAR PEDIDO'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackageOrderForm;
