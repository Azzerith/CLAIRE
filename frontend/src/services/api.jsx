import axios from 'axios';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const UPLOAD_MAX_SIZE =
    import.meta.env.VITE_UPLOAD_MAX_SIZE || 10485760; // 10MB default

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor untuk logging
api.interceptors.request.use(
    (config) => {
        console.log(`🚀 Making API request to: ${config.url}`);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor untuk error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('❌ API Error:', error.response ?.data || error.message);
        return Promise.reject(error);
    }
);

// Dosen API
export const dosenAPI = {
    getAll: () => api.get('/dosen'),
    getById: (id) => api.get(`/dosen/${id}`),
    create: (formData) => api.post('/dosen', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, formData) => api.put(`/dosen/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/dosen/${id}`),
    rekamSuara: (id, audioFile) => {
        const formData = new FormData();
        formData.append('audio_data', audioFile);
        return api.post(`/dosen/${id}/rekam-suara`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// Jadwal API
export const jadwalAPI = {
    getAll: () => api.get('/jadwal'),
    getById: (id) => api.get(`/jadwal/${id}`),
    create: (data) => api.post('/jadwal', data),
    update: (id, data) => api.put(`/jadwal/${id}`, data),
    delete: (id) => api.delete(`/jadwal/${id}`),
    getSedangRekam: () => api.get('/jadwal/sedang-rekam'),
    mulaiRekaman: (id) => api.get(`/rekaman/mulai/${id}`),
    hentikanRekaman: (id) => api.get(`/rekaman/hentikan/${id}`),
};

// Evaluasi API
export const evaluasiAPI = {
    getAll: () => api.get('/evaluasi'),
    getById: (id) => api.get(`/evaluasi/${id}`),
    getByJadwal: (jadwalId) => api.get(`/evaluasi/jadwal/${jadwalId}`),
    create: (data) => api.post('/evaluasi', data),
};

// Export constants untuk digunakan di komponen
export const APP_CONFIG = {
    API_BASE_URL: API_BASE_URL,
    UPLOAD_MAX_SIZE: UPLOAD_MAX_SIZE,
    APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Sistem CLAIRE',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
};

export default api;