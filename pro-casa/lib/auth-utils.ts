/**
 * Утилиты аутентификации.
 * В production: токен в httpOnly cookie (XSS-safe).
 * В dev: fallback на localStorage (разные порты 3000/3001).
 */

/** Безопасно достаёт токен из localStorage (dev fallback). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/** Получает данные пользователя из localStorage. */
export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('user');
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
}

/** Проверяет, авторизован ли пользователь. */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('user');
}

/** @deprecated Не нужна с cookie auth. Всегда возвращает false. */
export function isTokenExpired(_token: string | null): boolean {
  return false;
}

/** Очищает данные авторизации и перенаправляет на логин. */
export function clearAuthAndRedirect(): void {
  if (typeof window === 'undefined') return;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
