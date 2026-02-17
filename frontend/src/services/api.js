import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Guardar mensaje de error si es específico sobre usuario no encontrado
            const errorMessage = error.response?.data?.error || 'Tu sesión ha expirado';

            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Almacenar mensaje para mostrarlo en la página de login
            localStorage.setItem('authError', errorMessage);

            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const authAPI = {
    registerDonor: (data) => api.post('/auth/register/donor', data),
    registerOng: (data) => {
        // Si data es FormData, cambiar el Content-Type
        const config = data instanceof FormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        } : {};
        return api.post('/auth/register/ong', data, config);
    },
    login: (data) => api.post('/auth/login', data),
    loginWithGoogle: (data) => api.post('/auth/login/google', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    getMyOngData: () => api.get('/auth/my-ong'),
    updateMyOngData: (data) => api.put('/auth/my-ong', data),
    getPublicOngs: () => api.get('/auth/ongs'),
};

// Admin endpoints
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getPendingOngs: () => api.get('/admin/ongs/pending'),
    getAllOngs: (status) => api.get('/admin/ongs', { params: { status } }),
    getOngById: (id) => api.get(`/admin/ongs/${id}`),
    approveOng: (id) => api.put(`/admin/ongs/${id}/approve`),
    rejectOng: (id, reason) => api.put(`/admin/ongs/${id}/reject`, { reason }),
    downloadDocument: (documentId) => {
        return api.get(`/admin/documents/${documentId}`, {
            responseType: 'blob',
        });
    },
};

// Donation endpoints
export const donationAPI = {
    // Crear donación (cualquier usuario)
    createDonation: (data) => api.post('/donations', data),

    // Obtener donaciones disponibles (cualquier usuario)
    getAvailableDonations: (params) => api.get('/donations/available', { params }),

    // Obtener mis donaciones creadas (cualquier usuario)
    getMyDonations: () => api.get('/donations/my-donations'),

    // Obtener donaciones asignadas a mi ONG (solo ONGs)
    getMyAssignedDonations: () => api.get('/donations/assigned'),

    // Obtener una donación por ID
    getDonationById: (id) => api.get(`/donations/${id}`),

    // Actualizar donación (solo creador)
    updateDonation: (id, data) => api.put(`/donations/${id}`, data),

    // Eliminar donación (solo creador)
    deleteDonation: (id) => api.delete(`/donations/${id}`),

    // Solicitar donación (solo ONGs)
    requestDonation: (id) => api.post(`/donations/${id}/request`),

    // Rechazar donación asignada (solo creador)
    rejectDonation: (id) => api.post(`/donations/${id}/reject`),

    // Marcar como entregada (solo creador)
    markAsDelivered: (id) => api.post(`/donations/${id}/delivered`),
};

// Conversation endpoints
export const conversationAPI = {
    // Listar conversaciones (status: OPEN | CLOSED)
    listConversations: (status) => api.get('/conversations', { params: { status } }),

    // Obtener conversación por ID
    getConversationById: (id) => api.get(`/conversations/${id}`),

    // Obtener conversación activa por donación
    getConversationByDonation: (donationId) => api.get(`/conversations/donation/${donationId}`),

    // Obtener conversación activa por necesidad (donante)
    getConversationByNeed: (needId) => api.get(`/conversations/need/${needId}`),

    // Abrir conversación por necesidad (donante)
    openNeedConversation: (needId) => api.post(`/conversations/need/${needId}`),

    // Enviar mensaje
    sendMessage: (conversationId, content) => api.post(`/conversations/${conversationId}/messages`, { content }),

    // Calcular coste estimado de envio para chats de donacion
    calculateShippingCost: (conversationId, params) => api.get(`/conversations/${conversationId}/shipping-cost`, { params }),
};

// Need endpoints
export const needAPI = {
    createNeed: (data) => api.post('/needs', data),
    getNeeds: (params) => api.get('/needs', { params }),
    getNeedById: (id) => api.get(`/needs/${id}`),
    getMyNeeds: (params) => api.get('/needs/my', { params }),
    closeNeed: (id) => api.post(`/needs/${id}/close`),
};

export default api;
