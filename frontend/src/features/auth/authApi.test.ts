import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../stores/authStore';
import { login, signup } from './authApi';

function jsonResponse(status: number, body: unknown = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

describe('authApi', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('signup 성공 시 응답 데이터를 그대로 반환한다', async () => {
    const result = { id: 1, name: '홍길동', loginId: 'hong1', role: 'user' as const };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(201, result));

    await expect(signup({ name: '홍길동', loginId: 'hong1', password: 'pw1234' })).resolves.toEqual(result);
  });

  it('signup 실패 시 서버 message를 담은 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(409, { message: 'loginId 중복' }));

    await expect(signup({ name: '홍길동', loginId: 'hong1', password: 'pw1234' })).rejects.toThrow('loginId 중복');
  });

  it('login 성공 시 응답 데이터를 그대로 반환한다', async () => {
    const result = {
      accessToken: 'at1',
      refreshToken: 'rt1',
      user: { id: 1, name: '홍길동', role: 'user' as const },
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(200, result));

    await expect(login({ loginId: 'hong1', password: 'pw1234' })).resolves.toEqual(result);
  });

  it('login 실패 시 서버 message를 담은 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(401, { message: '인증 실패' }));

    await expect(login({ loginId: 'hong1', password: 'wrong' })).rejects.toThrow('인증 실패');
  });
});
