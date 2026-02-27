import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

// Create a configured Axios instance
const api = axios.create({
    // Use VITE_API_URL from .env
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request Interceptor: Attach JWT Token ───────────────────
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

// ── Response Interceptor: Auto-refresh on 401 ──────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401, and not if the failing request was itself
        // a refresh or login attempt (to avoid infinite loops)
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/verify-otp')
        ) {
            const { refreshToken, logout, updateTokens } = useAuthStore.getState();

            // No refresh token → can't refresh, just logout
            if (!refreshToken) {
                console.warn('No refresh token available — logging out');
                logout();
                return Promise.reject(error);
            }

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call the refresh endpoint
                const { data } = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    { refreshToken }
                );

                const newAccessToken = data.data.accessToken;

                // Update the store
                updateTokens({ accessToken: newAccessToken });

                // Process any queued requests
                processQueue(null, newAccessToken);

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                console.warn('Token refresh failed — logging out');
                logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
