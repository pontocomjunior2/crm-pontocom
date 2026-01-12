import React, { useState, useEffect } from 'react';
import { scheduleAPI } from '../services/api';
import { Clock, Plus, Edit2, Trash2, Check, X, Loader2, Calendar } from 'lucide-react';

const DAYS_OF_WEEK = [
    { id: 0, name: 'Dom', full: 'Domingo' },
    { id: 1, name: 'Seg', full: 'Segunda' },
    { id: 2, name: 'Ter', full: 'Terça' },
    { id: 3, name: 'Qua', full: 'Quarta' },
    { id: 4, name: 'Qui', full: 'Quinta' },
    { id: 5, name: 'Sex', full: 'Sexta' },
    { id: 6, name: 'Sáb', full: 'Sábado' }
];

const ScheduleManager = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [formData, setFormData] = useState({
        hour: 3,
        minute: 0,
        days: [1, 2, 3, 4, 5], // Segunda a Sexta por padrão
        enabled: true
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const data = await scheduleAPI.list();
            setSchedules(data);
        } catch (error) {
            setMessage({ type: 'error', text: 'Falha ao carregar agendamentos' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (schedule = null) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setFormData({
                hour: schedule.hour,
                minute: schedule.minute,
                days: schedule.days,
                enabled: schedule.enabled
            });
        } else {
            setEditingSchedule(null);
            setFormData({
                hour: 3,
                minute: 0,
                days: [1, 2, 3, 4, 5],
                enabled: true
            });
        }
        setShowModal(true);
        setMessage({ type: '', text: '' });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSchedule(null);
    };

    const handleSave = async () => {
        if (formData.days.length === 0) {
            setMessage({ type: 'error', text: 'Selecione pelo menos um dia da semana' });
            return;
        }

        try {
            if (editingSchedule) {
                await scheduleAPI.update(editingSchedule.id, formData);
                setMessage({ type: 'success', text: 'Agendamento atualizado!' });
            } else {
                await scheduleAPI.create(formData);
                setMessage({ type: 'success', text: 'Agendamento criado!' });
            }
            await loadSchedules();
            handleCloseModal();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Erro ao salvar agendamento' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente remover este agendamento?')) return;

        try {
            await scheduleAPI.delete(id);
            setMessage({ type: 'success', text: 'Agendamento removido!' });
            await loadSchedules();
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao remover agendamento' });
        }
    };

    const toggleDay = (dayId) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(dayId)
                ? prev.days.filter(d => d !== dayId)
                : [...prev.days, dayId].sort((a, b) => a - b)
        }));
    };

    const formatTime = (hour, minute) => {
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };

    const getDaysDisplay = (days) => {
        if (days.length === 7) return 'Todos os dias';
        if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Seg-Sex';
        return days.map(d => DAYS_OF_WEEK[d].name).join(', ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Calendar className="text-primary" size={20} />
                        AGENDAMENTOS AUTOMÁTICOS
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Horário de Brasília (GMT-3)</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={16} />
                    ADICIONAR HORÁRIO
                </button>
            </div>

            {message.text && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                    {message.text}
                </div>
            )}

            {schedules.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center">
                    <Clock size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                    <p className="text-muted-foreground text-sm">Nenhum agendamento configurado</p>
                    <p className="text-muted-foreground text-xs mt-1">Clique em "Adicionar Horário" para criar o primeiro</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schedules.map(schedule => (
                        <div key={schedule.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-3 rounded-xl">
                                        <Clock className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">
                                            {formatTime(schedule.hour, schedule.minute)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">GMT-3</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenModal(schedule)}
                                        className="p-2 hover:bg-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 size={14} className="text-muted-foreground hover:text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(schedule.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {schedule.days.map(dayId => (
                                    <span key={dayId} className="bg-white/5 px-2 py-1 rounded text-xs font-bold text-white">
                                        {DAYS_OF_WEEK[dayId].name}
                                    </span>
                                ))}
                            </div>
                            {!schedule.enabled && (
                                <div className="mt-3 text-xs text-amber-400 font-bold">⚠️ Desativado</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-black text-white mb-6">
                            {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Hora</label>
                                    <select
                                        value={formData.hour}
                                        onChange={e => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Minuto</label>
                                    <select
                                        value={formData.minute}
                                        onChange={e => setFormData({ ...formData, minute: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                                    >
                                        {[0, 15, 30, 45].map(m => (
                                            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Dias da Semana</label>
                                <div className="grid grid-cols-7 gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => toggleDay(day.id)}
                                            className={`p-3 rounded-xl text-xs font-bold transition-all ${formData.days.includes(day.id)
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                                                }`}
                                        >
                                            {day.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl">
                                <div
                                    onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                                    className={`w-12 h-6 px-1 flex items-center rounded-full cursor-pointer transition-all ${formData.enabled ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                                <span className="text-sm font-bold text-white">Ativo</span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-sm font-bold transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                {editingSchedule ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleManager;
