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
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
};

// Dashboard API calls
export const dashboardAPI = {
    get: async () => {
        return fetchAPI('/dashboard');
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
