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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    getMyOngData: () => api.get('/auth/my-ong'),
    updateMyOngData: (data) => api.put('/auth/my-ong', data),
};

// Admin endpoints
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getPendingOngs: () => api.get('/admin/ongs/pending'),
    getAllOngs: (status) => api.get('/admin/ongs', { params: { status } }),
    getOngById: (id) => api.get(`/admin/ongs/${id}`),
    approveOng: (id) => api.put(`/admin/ongs/${id}/approve`),
    rejectOng: (id, reason) => api.put(`/admin/ongs/${id}/reject`, { reason }),
    downloadDocument: (ongId, filename) => {
        return api.get(`/admin/ongs/${ongId}/documents/${filename}`, {
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

    // Marcar como entregada (solo creador)
    markAsDelivered: (id) => api.post(`/donations/${id}/delivered`),
};

export default api;
