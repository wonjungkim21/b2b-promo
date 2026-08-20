import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from './apiClient';

function jsonResponse(status: number, body: unknown = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

function getHeader(init: RequestInit | undefined, name: string): string | null {
  const headers = init?.headers as Headers | undefined;
  return headers ? headers.get(name) : null;
}

describe('apiFetch', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: '' };
  });

  it('accessToken이 있으면 Authorization 헤더가 붙는다', async () => {
    useAuthStore.getState().setAuth({ accessToken: 'token-1', refreshToken: 'refresh-1', role: 'user' });
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await apiFetch('/me');

    expect(getHeader(mockFetch.mock.calls[0][1], 'Authorization')).toBe('Bearer token-1');
  });

  it('accessToken이 없으면 Authorization 헤더가 없다', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await apiFetch('/me');

    expect(getHeader(mockFetch.mock.calls[0][1], 'Authorization')).toBeNull();
  });

  it('401 응답 시 refresh 후 새 토큰으로 재시도하고 최종 응답을 반환한다', async () => {
    useAuthStore.getState().setAuth({ accessToken: 'old-token', refreshToken: 'refresh-1', role: 'user' });

    mockFetch
      .mockResolvedValueOnce(jsonResponse(401))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'new-token' }))
      .mockResolvedValueOnce(jsonResponse(200, { data: 'ok' }));

    const res = await apiFetch('/me');
    const body = await res.json();

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[1][0]).toContain('/auth/refresh');
    expect(getHeader(mockFetch.mock.calls[2][1], 'Authorization')).toBe('Bearer new-token');
    expect(body).toEqual({ data: 'ok' });
    expect(useAuthStore.getState().accessToken).toBe('new-token');
  });

  it('refresh 실패 시 clearAuth되고 /login으로 리다이렉트된다', async () => {
    useAuthStore.getState().setAuth({ accessToken: 'old-token', refreshToken: 'refresh-1', role: 'user' });

    mockFetch
      .mockResolvedValueOnce(jsonResponse(401))
      .mockResolvedValueOnce(jsonResponse(401));

    await apiFetch('/me');

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('동시에 여러 요청이 401을 맞아도 refresh 호출은 1번만 발생한다', async () => {
    useAuthStore.getState().setAuth({ accessToken: 'old-token', refreshToken: 'refresh-1', role: 'user' });

    // first calls for /a and /b must return 401 once each before retry succeeds
    let aCalls = 0;
    let bCalls = 0;
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/refresh')) {
        return Promise.resolve(jsonResponse(200, { accessToken: 'new-token' }));
      }
      if (url.endsWith('/a')) {
        aCalls += 1;
        return Promise.resolve(aCalls === 1 ? jsonResponse(401) : jsonResponse(200, { data: 'a' }));
      }
      if (url.endsWith('/b')) {
        bCalls += 1;
        return Promise.resolve(bCalls === 1 ? jsonResponse(401) : jsonResponse(200, { data: 'b' }));
      }
      return Promise.resolve(jsonResponse(200, {}));
    });

    await Promise.all([apiFetch('/a'), apiFetch('/b')]);

    const refreshCalls = mockFetch.mock.calls.filter((call) => String(call[0]).includes('/auth/refresh'));
    expect(refreshCalls.length).toBe(1);
  });
});
