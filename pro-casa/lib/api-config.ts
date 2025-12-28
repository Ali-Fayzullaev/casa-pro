
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_BASE_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export const getApiUrl = (path: string) => {
    // If path is absolute (http...), return as is
    if (path.startsWith('http')) return path;

    // Clean path to ensure no double slashes and no leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    return `${API_BASE_URL}/${cleanPath}`;
};

export const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};
