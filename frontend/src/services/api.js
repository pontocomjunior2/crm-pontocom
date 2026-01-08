// API service layer for frontend

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for fetch requests
const fetchAPI = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
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

    convert: async (id) => {
        return fetchAPI(`/orders/${id}/convert`, {
            method: 'PATCH',
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
};

// CNPJ Lookup - Using BrasilAPI (primary) with ReceitaWS fallback
export const lookupCNPJ = async (cnpj) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
    }

    // Try BrasilAPI first (more reliable and CORS-friendly)
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);

        if (!response.ok) {
            throw new Error('CNPJ não encontrado na BrasilAPI');
        }

        const data = await response.json();

        return {
            razaoSocial: data.razao_social || data.nome_fantasia || '',
            nomeFantasia: data.nome_fantasia || data.razao_social || '',
            cnpj: data.cnpj || '',
            inscricaoEstadual: data.inscricao_estadual || '',
            emailPrincipal: data.email || '',
            telefonePrincipal: data.ddd_telefone_1 || data.telefone || '',
            cep: data.cep?.replace(/\D/g, '') || '',
            endereco: data.logradouro || data.descricao_tipo_de_logradouro + ' ' + data.logradouro || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            cidade: data.municipio || '',
            estado: data.uf || '',
            dataCriacao: data.data_inicio_atividade || '',
        };
    } catch (brasilApiError) {
        console.warn('BrasilAPI failed, trying ReceitaWS...', brasilApiError.message);

        // Fallback to ReceitaWS
        try {
            const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);

            if (!response.ok) {
                throw new Error('CNPJ não encontrado');
            }

            const data = await response.json();

            if (data.status === 'ERROR') {
                throw new Error(data.message || 'Erro ao buscar CNPJ');
            }

            return {
                razaoSocial: data.nome || '',
                nomeFantasia: data.fantasia || '',
                cnpj: data.cnpj || '',
                inscricaoEstadual: data.inscricao_estadual || '',
                emailPrincipal: data.email || '',
                telefonePrincipal: data.telefone || '',
                cep: data.cep?.replace(/\D/g, '') || '',
                endereco: data.logradouro || '',
                numero: data.numero || '',
                complemento: data.complemento || '',
                bairro: data.bairro || '',
                cidade: data.municipio || '',
                estado: data.uf || '',
                dataCriacao: data.abertura || '',
            };
        } catch (receitaError) {
            console.error('Both APIs failed:', receitaError.message);
            throw new Error('Não foi possível consultar o CNPJ. Verifique sua conexão com a internet ou preencha manualmente.');
        }
    }
};

// CEP Lookup using ViaCEP (free API)
export const lookupCEP = async (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');

    if (cleanCEP.length !== 8) {
        throw new Error('CEP inválido');
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

        if (!response.ok) {
            throw new Error('CEP não encontrado');
        }

        const data = await response.json();

        if (data.erro) {
            throw new Error('CEP não encontrado');
        }

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
