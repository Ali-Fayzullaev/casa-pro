
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const getApiUrl = (path: string) => {
    // If path is absolute (http...), return as is
    if (path.startsWith('http')) return path;

    // Clean path to ensure no double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // If API_BASE_URL is absolute, join normally
    // If API_BASE_URL is relative (/api), just join
    return `${API_BASE_URL}/${cleanPath}`;
};

export const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};
