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
        console.error('❌ API Error:', error.response?.data || error.message);
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
    getAktifHariIni: () => api.get('/jadwal/hari-ini/aktif'),
    mulaiRekaman: (id) => api.post(`/jadwal/${id}/mulai-rekam`),
    hentikanRekaman: (id) => api.post(`/jadwal/${id}/hentikan-rekam`),
    mulaiRekamanOtomatis: (id) => api.post(`/jadwal/${id}/auto-record`),
    getRecordingSchedule: (id) => api.get(`/jadwal/${id}/recording-schedule`),
    updateStatus: (id, status) => api.patch(`/jadwal/${id}/status`, { status }),
    getByHari: (hari) => api.get(`/jadwal/hari/${hari}`),
};

// Evaluasi API
export const evaluasiAPI = {
    getAll: () => api.get('/evaluasi'),
    getById: (id) => api.get(`/evaluasi/${id}`),
    getByJadwal: (jadwalId) => api.get(`/evaluasi/jadwal/${jadwalId}`),
    create: (data) => api.post('/evaluasi', data),
    update: (id, data) => api.put(`/evaluasi/${id}`, data),
    delete: (id) => api.delete(`/evaluasi/${id}`),
    uploadAudio: (id, audioFile) => {
        const formData = new FormData();
        formData.append('audio_file', audioFile);
        return api.post(`/evaluasi/${id}/upload-audio`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    simpanAnalisis: (data) => api.post('/evaluasi/analisis', data),
    getStatistik: () => api.get('/evaluasi/statistik'),
    getRecent: (limit = 5) => api.get(`/evaluasi/recent?limit=${limit}`),
};

// Recording API (untuk service rekaman otomatis)
export const recordingAPI = {
    startScheduledRecording: (jadwalId) => api.post(`/recording/scheduled/start/${jadwalId}`),
    stopScheduledRecording: (jadwalId) => api.post(`/recording/scheduled/stop/${jadwalId}`),
    getActiveRecordings: () => api.get('/recording/active'),
    getRecordingStatus: (jadwalId) => api.get(`/recording/status/${jadwalId}`),
    processAudioAnalysis: (audioFile, jadwalId) => {
        const formData = new FormData();
        formData.append('audio_file', audioFile);
        formData.append('jadwal_id', jadwalId);
        return api.post('/recording/process-analysis', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000 // 5 minutes timeout untuk processing AI
        });
    },
};

// Dashboard API
export const dashboardAPI = {
    getOverview: () => api.get('/dashboard/overview'),
    getRecentActivities: () => api.get('/dashboard/activities'),
    getStats: (period = 'week') => api.get(`/dashboard/stats?period=${period}`),
    getUpcomingJadwal: () => api.get('/dashboard/upcoming-jadwal'),
};

// Audio File API
export const audioAPI = {
    serveDosenAudio: (dosenFolder, filename) => 
        api.get(`/audio/${dosenFolder}/${filename}`, { 
            responseType: 'blob' 
        }),
    serveEvaluasiAudio: (folderName, filename) => 
        api.get(`/audio-evaluasi/${folderName}/${filename}`, { 
            responseType: 'blob' 
        }),
    uploadAudio: (file, folderType = 'evaluasi') => {
        const formData = new FormData();
        formData.append('audio_file', file);
        formData.append('folder_type', folderType);
        return api.post('/audio/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};

// System API
export const systemAPI = {
    getHealth: () => api.get('/system/health'),
    getConfig: () => api.get('/system/config'),
    checkPythonBackend: () => api.get('/system/check-python-backend'),
    getStorageInfo: () => api.get('/system/storage-info'),
};

// Utility functions untuk recording
export const recordingUtils = {
    // Calculate recording times based on start time
    calculateRecordingTimes: (startTime) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        
        // Rekaman pertama: 10 menit setelah mulai
        const firstRecording = new Date();
        firstRecording.setHours(hours, minutes + 10, 0, 0);
        
        // Rekaman kedua: 13 menit 30 detik setelah rekaman pertama
        const secondRecording = new Date(firstRecording);
        secondRecording.setMinutes(secondRecording.getMinutes() + 3, 30);
        
        return [
            firstRecording.toTimeString().slice(0, 5),
            secondRecording.toTimeString().slice(0, 5)
        ];
    },

    // Check if current time matches recording time
    isRecordingTime: (jadwalItem) => {
        const now = new Date();
        const currentDay = recordingUtils.getCurrentDayIndonesian();
        const currentTime = now.toTimeString().slice(0, 5);

        if (jadwalItem.hari !== currentDay || jadwalItem.status !== 'aktif') {
            return false;
        }

        const recordingTimes = recordingUtils.calculateRecordingTimes(jadwalItem.waktu_mulai);
        return recordingTimes.includes(currentTime);
    },

    // Get current day in Indonesian format
    getCurrentDayIndonesian: () => {
        const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
        return days[new Date().getDay()];
    },

    // Check if jadwal is active now
    isJadwalActive: (jadwalItem) => {
        const now = new Date();
        const currentDay = recordingUtils.getCurrentDayIndonesian();
        const currentTime = now.toTimeString().slice(0, 5);
        
        return jadwalItem.hari === currentDay && 
               currentTime >= jadwalItem.waktu_mulai && 
               currentTime <= jadwalItem.waktu_selesai;
    },

    // Get minutes until next recording
    getMinutesUntilNextRecording: (jadwalItem) => {
        const now = new Date();
        const currentDay = recordingUtils.getCurrentDayIndonesian();
        const currentTime = now.toTimeString().slice(0, 5);

        if (jadwalItem.status !== 'aktif' || jadwalItem.hari !== currentDay) {
            return null;
        }

        const recordingTimes = recordingUtils.calculateRecordingTimes(jadwalItem.waktu_mulai);
        const nextRecording = recordingTimes.find(time => time > currentTime);
        
        if (nextRecording) {
            const [nextHours, nextMinutes] = nextRecording.split(':').map(Number);
            const nextTime = new Date();
            nextTime.setHours(nextHours, nextMinutes, 0, 0);
            
            const diffMs = nextTime - now;
            return Math.floor(diffMs / 60000); // Convert to minutes
        }
        
        return null;
    }
};

// Real-time monitoring untuk auto recording
export const createAutoRecordingMonitor = (onRecordingTrigger, checkInterval = 60000) => {
    let monitoringInterval = null;
    
    const startMonitoring = (jadwalList) => {
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
        }
        
        monitoringInterval = setInterval(() => {
            const now = new Date();
            const currentDay = recordingUtils.getCurrentDayIndonesian();
            const currentTime = now.toTimeString().slice(0, 5);
            
            jadwalList.forEach(jadwal => {
                if (jadwal.status === 'aktif' && jadwal.hari === currentDay) {
                    const recordingTimes = recordingUtils.calculateRecordingTimes(jadwal.waktu_mulai);
                    
                    if (recordingTimes.includes(currentTime)) {
                        onRecordingTrigger(jadwal.id);
                    }
                }
            });
        }, checkInterval);
    };
    
    const stopMonitoring = () => {
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
            monitoringInterval = null;
        }
    };
    
    return {
        start: startMonitoring,
        stop: stopMonitoring
    };
};

// Export constants untuk digunakan di komponen
export const APP_CONFIG = {
    API_BASE_URL: API_BASE_URL,
    UPLOAD_MAX_SIZE: UPLOAD_MAX_SIZE,
    APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Sistem CLAIRE',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    AUTO_RECORDING_ENABLED: import.meta.env.VITE_AUTO_RECORDING_ENABLED !== 'false',
    RECORDING_DURATION: 60, // 1 menit dalam detik
    RECORDING_DELAY: 600, // 10 menit dalam detik 
    RECORDING_SESSIONS: 5, // 5 session
};

export default api;