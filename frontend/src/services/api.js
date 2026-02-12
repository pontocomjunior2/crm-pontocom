// API service layer for frontend

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || '';

// Helper function for fetch requests
const fetchAPI = async (endpoint, options = {}) => {
    const token = localStorage.getItem('pontocom_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        const status = response.status;

        let customMessage = error.message;

        if (status === 409) {
            customMessage = 'Este registro (CNPJ/CPF ou E-mail) já está cadastrado no sistema.';
        } else if (status === 403) {
            customMessage = 'Acesso negado ou Sessão expirada. Por favor, faça login novamente.';
        } else if (status === 401) {
            customMessage = 'Não autorizado. Verifique suas credenciais.';
        } else if (status === 404) {
            customMessage = 'Recurso não encontrado no servidor.';
        } else if (status === 500) {
            customMessage = 'Erro interno no servidor. Tente novamente mais tarde.';
        }

        throw new Error(customMessage || `Erro HTTP! Status: ${status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

// Dashboard API calls
export const dashboardAPI = {
    get: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/dashboard${queryString ? `?${queryString}` : ''}`);
    },
    getDetails: async (metric, params = {}) => {
        const queryString = new URLSearchParams({ ...params, metric }).toString();
        return fetchAPI(`/dashboard/details?${queryString}`);
    }
};

// Client API calls
export const clientAPI = {
    list: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/clients${queryString ? `?${queryString}` : ''}`);
    },

    get: async (id) => {
        return fetchAPI(`/clients/${id}`);
    },

    create: async (data) => {
        return fetchAPI('/clients', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getSelection: async () => {
        return fetchAPI('/clients/selection');
    },

    update: async (id, data) => {
        return fetchAPI(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return fetchAPI(`/clients/${id}`, {
            method: 'DELETE',
        });
    },
};

// Client Package API calls
export const clientPackageAPI = {
    list: async (clientId) => {
        return fetchAPI(`/client-packages/${clientId}`);
    },

    listAll: async () => {
        return fetchAPI('/client-packages');
    },

    getActive: async (clientId) => {
        return fetchAPI(`/client-packages/active/${clientId}`);
    },

    create: async (data) => {
        return fetchAPI('/client-packages', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id, data) => {
        return fetchAPI(`/client-packages/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id, forceDelete = false) => {
        const url = `/client-packages/${id}${forceDelete ? '?forceDelete=true' : ''}`;
        return fetchAPI(url, {
            method: 'DELETE',
        });
    },

    getOrders: async (packageId) => {
        return fetchAPI(`/client-packages/${packageId}/orders`);
    },

    getAllOrders: async () => {
        return fetchAPI('/client-packages/all/orders');
    },
};

// Order API calls
export const orderAPI = {
    list: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/orders${queryString ? `?${queryString}` : ''}`);
    },

    get: async (id) => {
        return fetchAPI(`/orders/${id}`);
    },

    create: async (data) => {
        return fetchAPI('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id, data) => {
        return fetchAPI(`/orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return fetchAPI(`/orders/${id}`, {
            method: 'DELETE',
        });
    },

    bulkDelete: async (ids) => {
        return fetchAPI('/orders/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({ ids }),
        });
    },

    bulkUpdate: async (ids, data) => {
        return fetchAPI('/orders/bulk-update', {
            method: 'POST',
            body: JSON.stringify({ ids, data }),
        });
    },

    batchCreate: async (data) => {
        return fetchAPI('/orders/batch-create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    convert: async (id) => {
        const response = await fetchAPI(`/orders/${id}/convert`, {
            method: 'PATCH',
        });
        return response;
    },

    revert: async (id) => {
        const response = await fetchAPI(`/orders/${id}/revert`, {
            method: 'PATCH',
        });
        return response;
    },

    clone: async (id) => {
        return fetchAPI(`/orders/${id}/clone`, {
            method: 'POST',
        });
    },

    uploadOS: async (id, file, customName = null) => {
        const formData = new FormData();
        if (customName) formData.append('customName', customName);
        formData.append('file', file);

        const token = localStorage.getItem('pontocom_token');
        const response = await fetch(`${API_BASE_URL}/orders/${id}/upload-os`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    checkFileExists: async (filename) => {
        return fetchAPI(`/orders/check-file/${encodeURIComponent(filename)}`);
    },

    removeOS: async (id) => {
        return fetchAPI(`/orders/${id}/remove-os`, {
            method: 'DELETE',
        });
    },
};

// Locutor API calls
export const locutorAPI = {
    list: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/locutores${queryString ? `?${queryString}` : ''}`);
    },

    get: async (id) => {
        return fetchAPI(`/locutores/${id}`);
    },

    create: async (data) => {
        return fetchAPI('/locutores', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id, data) => {
        return fetchAPI(`/locutores/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return fetchAPI(`/locutores/${id}`, {
            method: 'DELETE',
        });
    },

    getHistory: async (id, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/locutores/${id}/history${queryString ? `?${queryString}` : ''}`);
    },
};

// CNPJ Lookup
export const lookupCNPJ = async (cnpj) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) throw new Error('CNPJ deve ter 14 dígitos');

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
        if (!response.ok) throw new Error('CNPJ não encontrado');
        const data = await response.json();
        return {
            razaoSocial: data.razao_social || data.nome_fantasia || '',
            nomeFantasia: data.nome_fantasia || data.razao_social || '',
            cnpj: data.cnpj || '',
            inscricaoEstadual: data.inscricao_estadual || '',
            emailPrincipal: data.email || '',
            telefonePrincipal: data.ddd_telefone_1 || data.telefone || '',
            cep: data.cep?.replace(/\D/g, '') || '',
            endereco: data.logradouro || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            cidade: data.municipio || '',
            estado: data.uf || '',
            dataCriacao: data.data_inicio_atividade || '',
        };
    } catch (error) {
        throw new Error('Não foi possível consultar o CNPJ.');
    }
};

// CEP Lookup
export const lookupCEP = async (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) throw new Error('CEP inválido');

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        if (!response.ok) throw new Error('CEP não encontrado');
        const data = await response.json();
        if (data.erro) throw new Error('CEP não encontrado');
        return {
            cep: data.cep?.replace(/\D/g, '') || '',
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || '',
            complemento: data.complemento || '',
        };
    } catch (error) {
        throw new Error(error.message || 'Erro ao consultar CEP');
    }
};

// Service Type API calls
export const serviceTypeAPI = {
    list: async () => {
        return fetchAPI('/service-types');
    },
    create: async (name) => {
        return fetchAPI('/service-types', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    },
    init: async () => {
        return fetchAPI('/service-types/init', {
            method: 'POST',
        });
    },
};

export const importAPI = {
    clients: (xmlData) => fetchAPI('/import/clients', {
        method: 'POST',
        body: JSON.stringify({ xmlData }),
    }),
};

// Auth API
export const authAPI = {
    login: async (email, password) => {
        return fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },
    me: async () => {
        return fetchAPI('/auth/me');
    }
};

// User Management API
export const userAPI = {
    list: async () => {
        return fetchAPI('/users');
    },
    create: async (data) => {
        return fetchAPI('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    update: async (id, data) => {
        return fetchAPI(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    delete: async (id) => {
        return fetchAPI(`/users/${id}`, {
            method: 'DELETE',
        });
    }
};

// Supplier API calls
export const supplierAPI = {
    list: async () => {
        return fetchAPI('/suppliers');
    },

    create: async (data) => {
        return fetchAPI('/suppliers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    addPackage: async (id, data) => {
        return fetchAPI(`/suppliers/${id}/packages`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};

const buildQueryString = (params) => {
    if (typeof params === 'string') return params;
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value);
        }
    });
    const query = searchParams.toString();
    return query ? `?${query}` : '';
};

export const analyticsAPI = {
    getFinancialSummary: async (params = {}) => fetchAPI(`/analytics/financial-summary${buildQueryString(params)}`),
    getSalesTrends: async (params = {}) => fetchAPI(`/analytics/sales-trends${buildQueryString(params)}`),
    getTopClients: async (params = {}) => fetchAPI(`/analytics/top-clients${buildQueryString(params)}`),
    getPerformanceMetrics: async (params = {}) => fetchAPI(`/analytics/performance-metrics${buildQueryString(params)}`),
    getCacheReport: async (params = {}) => fetchAPI(`/analytics/cache-report${buildQueryString(params)}`)
};

export const tierAPI = {
    list: async () => fetchAPI('/tiers'),
    create: async (data) => fetchAPI('/tiers', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: async (id, data) => fetchAPI(`/tiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: async (id) => fetchAPI(`/tiers/${id}`, {
        method: 'DELETE',
    }),
};

export const backupAPI = {
    getConfig: async () => fetchAPI('/backups/config'),
    updateConfig: async (data) => fetchAPI('/backups/config', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    getLogs: async () => fetchAPI('/backups/logs'),
    trigger: async () => fetchAPI('/backups/trigger', {
        method: 'POST',
    }),
};

export const scheduleAPI = {
    list: async () => fetchAPI('/backups/schedules'),
    create: async (data) => fetchAPI('/backups/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: async (id, data) => fetchAPI(`/backups/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: async (id) => fetchAPI(`/backups/schedules/${id}`, {
        method: 'DELETE',
    }),
};

export const notificationAPI = {
    list: async (targetRole) => {
        const url = targetRole ? `/notifications?targetRole=${targetRole}` : '/notifications';
        return fetchAPI(url);
    },
    markAsRead: async (id) => fetchAPI(`/notifications/${id}/read`, { method: 'PUT' }),
    getSummary: async (targetRole) => {
        const url = targetRole ? `/notifications/summary?targetRole=${targetRole}` : '/notifications/summary';
        return fetchAPI(url);
    },
    create: async (data) => fetchAPI('/notifications', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
};

// Recurring Service API calls
export const recurringServiceAPI = {
    list: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/recurring-services${queryString ? `?${queryString}` : ''}`);
    },

    get: async (id) => {
        return fetchAPI(`/recurring-services/${id}`);
    },

    create: async (data) => {
        return fetchAPI('/recurring-services', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id, data) => {
        return fetchAPI(`/recurring-services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    hardDelete: async (id) => {
        return fetchAPI(`/recurring-services/${id}`, {
            method: 'DELETE',
        });
    },

    toggleActive: async (id, active) => {
        return fetchAPI(`/recurring-services/${id}/toggle`, {
            method: 'PATCH',
            body: JSON.stringify({ active }),
        });
    },

    getLogs: async (id) => {
        return fetchAPI(`/recurring-services/${id}/logs`);
    },

    execute: async (id) => {
        return fetchAPI(`/recurring-services/${id}/execute`, {
            method: 'POST',
        });
    },

    deleteLog: async (logId, deleteOrder = false) => {
        return fetchAPI(`/recurring-services/logs/${logId}?deleteOrder=${deleteOrder}`, {
            method: 'DELETE',
        });
    },
};

export const adminAPI = {
    getConfig: async () => fetchAPI('/admin/config'),

    updateConfig: async (data) => fetchAPI('/admin/config', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    getCommissionUsers: async () => fetchAPI('/admin/commission-users'),

    updateUserEligibility: async (userId, isCommissionEligible) => fetchAPI(`/admin/commission-users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isCommissionEligible }),
    }),

    recalculateAll: async () => fetchAPI('/admin/recalculate-all', {
        method: 'POST',
    }),
};

export const searchAPI = {
    global: async (query) => fetchAPI(`/search/global?q=${encodeURIComponent(query)}`),
};
