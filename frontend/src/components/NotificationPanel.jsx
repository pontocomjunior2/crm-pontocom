import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, X, AlertCircle } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';

// Helper to format date relative (e.g. "há 2 horas")
const formatDateRelative = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    return `Há ${diffDays} dias`;
};

const NotificationPanel = ({ onNavigate }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    const getTargetRoles = () => {
        const roles = [];
        if (user?.role === 'ADMIN') return ['ADMIN', 'ATENDIMENTO', 'FINANCEIRO'];

        // If not ADMIN, user only sees notifications for THEIR exact role
        if (user?.role) roles.push(user.role);

        return roles;
    };

    const fetchNotifications = async () => {
        if (!user) return;

        try {
            // Makes only ONE call. The backend will decide what to return based on user.role/tier
            const data = await notificationAPI.list();

            // Dedup and sort
            const uniqueNotes = Array.from(new Map(data.map(item => [item.id, item])).values())
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setNotifications(uniqueNotes);
            setUnreadCount(uniqueNotes.length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [user]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
            showToast.success('Notificação marcada como lida');
        } catch (error) {
            showToast.error('Erro ao atualizar notificação');
        }
    };

    const handleNotificationClick = (notification) => {
        if (notification.link) {
            // expected: /pacotes?clientId=123
            const [path, search] = notification.link.split('?');
            const params = new URLSearchParams(search);

            // Extract route ID (remove leading slash)
            const routeId = path.startsWith('/') ? path.substring(1) : path;

            const navParams = {};
            for (const [key, value] of params.entries()) {
                navParams[key] = value;
            }

            if (onNavigate) {
                onNavigate(routeId, navParams);
            }
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-accent transition-colors focus:outline-none"
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-primary' : 'text-foreground'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-80 md:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
                        <h3 className="font-semibold text-sm">Notificações</h3>
                        <span className="text-xs text-muted-foreground">{unreadCount} não lidas</span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                <Bell size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">Nenhuma notificação nova</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {notifications.map(note => (
                                    <div
                                        key={note.id}
                                        className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group relative"
                                        onClick={() => handleNotificationClick(note)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${note.type === 'RENEWAL' ? 'bg-amber-500 shadow-amber-500/50' :
                                                note.type === 'BILLING' || note.type === 'DAILY_BILLING_SUMMARY' ? 'bg-green-500 shadow-green-500/50' :
                                                    note.type === 'OVERDUE_BILLING' || note.type === 'STAGNANT_ORDER' ? 'bg-red-500 shadow-red-500/50' :
                                                        'bg-blue-500'
                                                }`} />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-foreground mb-1 pr-6">{note.title}</h4>
                                                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{note.message}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-muted-foreground font-medium opacity-70">
                                                        {formatDateRelative(note.createdAt)}
                                                    </span>
                                                    <span className="text-[9px] uppercase tracking-wider font-bold opacity-50 border border-border px-1 rounded">
                                                        {note.targetRole}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => markAsRead(note.id, e)}
                                            className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                            title="Concluir tarefa / Marcar como lida"
                                        >
                                            <Check size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
