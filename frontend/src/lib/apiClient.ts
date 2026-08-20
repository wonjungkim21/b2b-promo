import { useAuthStore } from '../stores/authStore';

const baseURL = import.meta.env.VITE_API_BASE_URL;

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: useAuthStore.getState().refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      useAuthStore.getState().setAuth({
        accessToken: data.accessToken,
        refreshToken: useAuthStore.getState().refreshToken!,
        role: useAuthStore.getState().role,
      });
      return data.accessToken as string;
    } catch {
      return null;
    }
  })();

  const token = await refreshPromise;
  refreshPromise = null;
  return token;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = useAuthStore.getState().accessToken;
  const headers = new Headers(options.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${baseURL}${path}`, { ...options, headers });

  const isAuthEndpoint = path === '/auth/refresh' || path === '/auth/login';
  if (res.status !== 401 || isAuthEndpoint) return res;

  const newAccessToken = await refreshAccessToken();
  if (!newAccessToken) {
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
    return res;
  }

  const retryHeaders = new Headers(options.headers);
  retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
  return fetch(`${baseURL}${path}`, { ...options, headers: retryHeaders });
}
