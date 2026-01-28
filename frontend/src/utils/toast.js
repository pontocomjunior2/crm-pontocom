import toast from 'react-hot-toast';

/**
 * Utilitário centralizado para notificações (Toasts) Premium
 */
const toastStyles = {
    style: {
        background: 'rgba(23, 23, 23, 0.8)',
        color: '#fff',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    },
    success: {
        iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
        },
    },
    error: {
        iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
        },
        duration: 5000,
    },
};

export const showToast = {
    success: (message) => toast.success(message, toastStyles),

    error: (error) => {
        let message = 'Ocorreu um erro inesperado. Tente novamente.';

        // Se for uma string simples
        if (typeof error === 'string') {
            message = error;
        }
        // Se for erro do Axios/API
        else if (error?.response?.data?.message) {
            message = error.response.data.message;
        } else if (error?.response?.data?.error) {
            message = error.response.data.error;
        } else if (error?.message) {
            message = error.message;
        }

        // Mapeamento de erros comuns para Português amigável
        const errorMap = {
            'Network Error': 'Erro de conexão. Verifique sua internet.',
            'Request failed with status code 500': 'Erro interno do servidor. Nossa equipe foi notificada.',
            'Request failed with status code 401': 'Sessão expirada. Por favor, faça login novamente.',
            'Assignment to constant variable': 'Falha crítica no processamento de dados (Const Error).',
            'Manual number already exists': 'Este número de pedido já está em uso.',
            'Client not found': 'Cliente não encontrado.',
            'Order not found': 'Pedido não encontrado.'
        };

        const translatedMessage = errorMap[message] || message;

        toast.error(translatedMessage, toastStyles);
    },

    loading: (message) => toast.loading(message, toastStyles),

    info: (message) => toast(message, {
        icon: 'ℹ️',
        ...toastStyles
    }),

    dismiss: (id) => toast.dismiss(id),
};
