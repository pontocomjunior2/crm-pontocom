import React, { useState, useEffect } from 'react';
import { Plus, Package, Calendar, DollarSign, History, Building2, Settings, Edit2, Trash2, X } from 'lucide-react';
import { supplierAPI } from '../services/api';
import { formatCurrency, getLocalISODate } from '../utils/formatters';
import { showToast } from '../utils/toast';

const SupplierList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
    const [showNewPackageModal, setShowNewPackageModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null); // New state for editing
    const [newSupplierName, setNewSupplierName] = useState('');

    // New Package Form State
    const [packageForm, setPackageForm] = useState({
        name: '',
        price: '',
        credits: '',
        purchaseDate: getLocalISODate()
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const data = await supplierAPI.list();
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            showToast.error('Erro ao carregar fornecedores.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSupplier = async (e) => {
        e.preventDefault();
        try {
            await supplierAPI.create({ name: newSupplierName });
            setNewSupplierName('');
            setShowNewSupplierModal(false);
            fetchSuppliers();
            showToast.success('Fornecedor criado!');
        } catch (error) {
            console.error('Error creating supplier:', error);
            showToast.error(error);
        }
    };

    const handleSavePackage = async (e) => {
        e.preventDefault();
        try {
            if (selectedPackage) {
                // Update mode
                await supplierAPI.updatePackage(selectedSupplier.id, selectedPackage.id, packageForm);
                showToast.success('Pacote atualizado!');
            } else {
                // Create mode
                await supplierAPI.addPackage(selectedSupplier.id, packageForm);
                showToast.success('Pacote de créditos adicionado!');
            }

            setShowNewPackageModal(false);
            setSelectedPackage(null);
            setPackageForm({
                name: '',
                price: '',
                credits: '',
                purchaseDate: getLocalISODate()
            });
            fetchSuppliers();
        } catch (error) {
            console.error('Error saving package:', error);
            showToast.error(error);
        }
    };

    const handleDeletePackage = async (supplierId, packageId) => {
        if (!confirm('Tem certeza que deseja excluir este pacote? Esta ação não pode ser desfeita.')) return;

        try {
            await supplierAPI.deletePackage(supplierId, packageId);
            fetchSuppliers();
            showToast.success('Pacote excluído!');
        } catch (error) {
            console.error('Error deleting package:', error);
            showToast.error(error);
        }
    };

    const openEditPackageModal = (supplier, pkg) => {
        setSelectedSupplier(supplier);
        setSelectedPackage(pkg);
        setPackageForm({
            name: pkg.name,
            price: pkg.price.toString(),
            credits: pkg.credits.toString(),
            purchaseDate: pkg.purchaseDate.split('T')[0] // format YYYY-MM-DD
        });
        setShowNewPackageModal(true);
    };


    const openPackageModal = (supplier) => {
        setSelectedSupplier(supplier);
        setSelectedPackage(null); // Reset edit mode
        setPackageForm({
            name: `Pacote ${new Date().toLocaleString('default', { month: 'long' })}/${new Date().getFullYear()}`,
            price: '',
            credits: '',
            purchaseDate: getLocalISODate()
        });
        setShowNewPackageModal(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Gestão de Fornecedores</h2>
                    <p className="text-muted-foreground mt-1">Gerencie estúdios parceiros e seus pacotes de créditos</p>
                </div>
                <button
                    onClick={() => setShowNewSupplierModal(true)}
                    className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg hover:shadow-primary/20 transition-all font-bold"
                >
                    <Plus size={20} />
                    Novo Fornecedor
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : suppliers.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                    <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Nenhum fornecedor cadastrado</h3>
                    <p className="text-muted-foreground">Comece cadastrando um estúdio parceiro.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {suppliers.map(supplier => {
                        const latestPackage = supplier.packages[0];
                        const historyPackages = supplier.packages.slice(0, 5);

                        return (
                            <div key={supplier.id} className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                            <Building2 size={20} className="text-primary" />
                                            {supplier.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {supplier.locutores.length} locutores vinculados
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedSupplier(supplier);
                                                setPackageForm({
                                                    name: '',
                                                    price: '0', // Mode trigger
                                                    credits: '',
                                                    purchaseDate: getLocalISODate()
                                                });
                                                setShowNewPackageModal(true);
                                            }}
                                            className="px-3 py-2 text-xs font-bold flex items-center gap-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                        >
                                            <Settings size={14} />
                                            Ajuste
                                        </button>
                                        <button
                                            onClick={() => openPackageModal(supplier)}
                                            className="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-2 rounded-lg"
                                        >
                                            <Plus size={14} />
                                            Novo Pacote
                                        </button>
                                    </div>
                                </div>

                                {/* Balance Logic */}
                                <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-input-background to-card border border-border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Saldo de Créditos</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-2xl font-black ${(supplier.stats?.balance || 0) < 0 ? 'text-red-500' :
                                                    (supplier.stats?.balance || 0) < 5 ? 'text-orange-500' : 'text-emerald-400'
                                                    }`}>
                                                    {supplier.stats?.balance !== undefined ? supplier.stats.balance : '-'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">restantes</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Consumo Total</span>
                                            <span className="text-sm font-bold text-foreground">{supplier.stats?.totalConsumed || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Logic / Latest Package */}
                                <div className="mb-6 p-4 rounded-xl bg-input-background border border-border">
                                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Package size={14} />
                                        Pacote Ref. (Custo)
                                    </h4>
                                    {supplier.referencePackage ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Custo por Crédito</span>
                                                <span className="text-xl font-bold text-green-400">
                                                    {formatCurrency(supplier.referencePackage.costPerCredit)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Ult. Compra</span>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground">{supplier.referencePackage.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {supplier.referencePackage.credits} x {formatCurrency(supplier.referencePackage.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (

                                        <div className="text-sm text-orange-400 font-medium py-2 flex items-center gap-2">
                                            <Calendar size={16} />
                                            Nenhum pacote cadastrado. Custos não serão calculados.
                                        </div>
                                    )}
                                </div>

                                {/* History */}
                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <History size={14} />
                                        Histórico Recente
                                    </h4>
                                    <div className="space-y-2">
                                        {historyPackages.map(pkg => (
                                            <div key={pkg.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-input-background group transition-colors">
                                                <span className="text-foreground">{pkg.name}</span>
                                                <div className="flex items-center gap-4 text-muted-foreground">
                                                    <span>{new Date(pkg.purchaseDate).toLocaleDateString()}</span>
                                                    <span className="font-medium text-foreground w-20 text-right">{formatCurrency(pkg.price)}</span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEditPackageModal(supplier, pkg)}
                                                            className="p-1 hover:text-primary transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePackage(supplier.id, pkg.id)}
                                                            className="p-1 hover:text-red-500 transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {historyPackages.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic">Sem histórico.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New Supplier Modal */}
            {showNewSupplierModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-border p-6 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <h3 className="text-xl font-bold text-foreground mb-4">Novo Fornecedor</h3>
                        <form onSubmit={handleCreateSupplier}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Nome do Estúdio / Fornecedor</label>
                                <input
                                    type="text"
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="Ex: Estúdio AudioMaster"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowNewSupplierModal(false)}
                                    className="btn-secondary px-4 py-2"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newSupplierName.trim()}
                                    className="btn-primary px-6 py-2"
                                >
                                    Criar Fornecedor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Package Modal */}
            {showNewPackageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-border p-6 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <h3 className="text-xl font-bold text-foreground mb-1">
                            {selectedPackage ? 'Editar Pacote' : (packageForm.price === '0' ? 'Ajuste Manual de Saldo' : 'Novo Pacote de Créditos')}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            {selectedPackage
                                ? `Alterando dados do pacote para ${selectedSupplier?.name}`
                                : (packageForm.price === '0'
                                    ? `Corrigir saldo de ${selectedSupplier?.name}`
                                    : `Adicionar pacote para ${selectedSupplier?.name}`)}
                        </p>

                        <form onSubmit={handleSavePackage} className="flex flex-col flex-1 overflow-hidden">
                            <div className="space-y-4 mb-6 flex-1 overflow-y-auto custom-scrollbar px-1">
                                {packageForm.price !== '0' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Nome do Pacote</label>
                                            <input
                                                type="text"
                                                value={packageForm.name}
                                                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                                                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                placeholder="Ex: Pacote Janeiro"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-muted-foreground mb-1">Valor Total (R$)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={packageForm.price}
                                                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-muted-foreground mb-1">Total de Créditos</label>
                                                <input
                                                    type="number"
                                                    value={packageForm.credits}
                                                    onChange={(e) => setPackageForm({ ...packageForm, credits: e.target.value })}
                                                    className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                    placeholder="Ex: 50"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {packageForm.price === '0' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Quantidade de Créditos (+ ou -)</label>
                                            <input
                                                type="number"
                                                value={packageForm.credits}
                                                onChange={(e) => setPackageForm({ ...packageForm, credits: e.target.value })}
                                                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-all font-bold text-lg"
                                                placeholder="Ex: 10 ou -5"
                                                required
                                                autoFocus
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                Use valores positivos para adicionar e negativos para remover. Se remover, o saldo será reduzido, mas o histórico de consumo original será mantido.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Motivo do Ajuste</label>
                                            <input
                                                type="text"
                                                value={packageForm.name}
                                                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                                                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                placeholder="Ex: Cota inicial, Correção de erro..."
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Data</label>
                                    <input
                                        type="date"
                                        value={packageForm.purchaseDate}
                                        onChange={(e) => setPackageForm({ ...packageForm, purchaseDate: e.target.value })}
                                        className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                        required
                                    />
                                </div>

                                {Number(packageForm.price) > 0 && packageForm.credits && (
                                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center animate-in fade-in">
                                        <span className="text-sm text-primary font-medium">Custo Unitário Calculado:</span>
                                        <span className="text-lg font-bold text-primary">
                                            {formatCurrency(packageForm.credits > 0 ? (parseFloat(packageForm.price) / parseInt(packageForm.credits)) : 0)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 flex-none pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewPackageModal(false)}
                                    className="btn-secondary px-4 py-2"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary px-6 py-2"
                                >
                                    {selectedPackage ? 'Salvar Alterações' : (packageForm.price === '0' ? 'Salvar Ajuste' : 'Adicionar Pacote')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
};

export default SupplierList;
