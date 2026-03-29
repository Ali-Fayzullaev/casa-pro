import axios from 'axios';
import { clearAuthAndRedirect } from './auth-utils';

// Единственный источник правды для базового URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;
export const API_BASE_URL = API_URL;

// Хелперы для legacy fetch-кода
export const getApiUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

export const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

// Axios instance — cookie + token fallback
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor — attach token as fallback for dev mode
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — 401 = сессия истекла
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error?.response?.status;
    if (status === 401) {
      const url = error?.config?.url || '';
      const isAuth = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/check');
      if (!isAuth) {
        clearAuthAndRedirect();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
