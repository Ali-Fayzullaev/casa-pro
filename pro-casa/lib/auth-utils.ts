/**
 * Утилиты аутентификации.
 * Токен хранится в httpOnly cookie — JavaScript не имеет к нему доступа.
 * localStorage хранит только данные пользователя (не токен).
 */

/** Проверяет, авторизован ли пользователь (по наличию user в localStorage). */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('user');
}

/** Получает данные пользователя из localStorage. */
export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('user');
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
}

/** @deprecated Токен теперь в httpOnly cookie. Возвращает null. */
export function getToken(): string | null {
  return null;
}

/** @deprecated Токен в httpOnly cookie, проверка expiry не нужна на клиенте. */
export function isTokenExpired(_token: string | null): boolean {
  return false;
}

/** Очищает данные авторизации и перенаправляет на логин. */
export function clearAuthAndRedirect(): void {
  if (typeof window === 'undefined') return;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  localStorage.removeItem('user');
  window.location.href = '/login';
}
