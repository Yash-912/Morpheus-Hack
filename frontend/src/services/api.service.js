import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

// Create a configured Axios instance
const api = axios.create({
    // Use VITE_API_URL from .env or default to localhost
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized (Future phase: refresh tokens)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Logic to trigger refresh token or logout
            console.warn('Unauthorized - token may be expired');
        }
        return Promise.reject(error);
    }
);

export default api;
