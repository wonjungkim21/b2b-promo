import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('setAuth로 값을 설정하면 상태에 정확히 반영된다', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      role: 'user',
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-1');
    expect(state.refreshToken).toBe('refresh-1');
    expect(state.role).toBe('user');
  });

  it('clearAuth 호출 시 accessToken/refreshToken/role이 모두 null로 리셋된다', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      role: 'admin',
    });

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.role).toBeNull();
  });

  it('setAuth 후 localStorage에 accessToken 값이 포함된 문자열이 저장되어 있다', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'persisted-token',
      refreshToken: 'persisted-refresh',
      role: 'user',
    });

    const raw = Object.keys(localStorage)
      .map((key) => localStorage.getItem(key))
      .join('\n');

    expect(raw).toContain('persisted-token');
  });

  it('서버 데이터 필드는 스토어 상태에 존재하지 않는다', () => {
    const state = useAuthStore.getState();
    const keys = Object.keys(state);

    expect(keys).toEqual(
      expect.arrayContaining(['accessToken', 'refreshToken', 'role', 'setAuth', 'clearAuth']),
    );
    expect(keys).not.toContain('events');
    expect(keys).not.toContain('pointBalance');
    expect(keys).not.toContain('applications');
    expect(keys.length).toBe(5);
  });
});
