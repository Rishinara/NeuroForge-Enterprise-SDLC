import axios from 'axios';
import { tokenManager } from './token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      const status = err.response.status;
      if (status === 401) {
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
      const message =
        err.response.data?.message ||
        err.response.data?.error ||
        err.response.statusText ||
        'Unknown error';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(err);
  }
);

export default api;