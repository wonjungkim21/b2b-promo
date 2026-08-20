import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useAuthStore } from './stores/authStore';

function jsonResponse(ok: boolean, body: unknown = {}): Response {
  return { ok, json: async () => body } as Response;
}

function mockFetchByPath(routes: Record<string, Response>) {
  return vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    for (const [path, response] of Object.entries(routes)) {
      if (url.includes(path)) return Promise.resolve(response);
    }
    return Promise.resolve(jsonResponse(false));
  });
}

function renderApp(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
    vi.stubGlobal('fetch', mockFetchByPath({ '/events': jsonResponse(true, []), '/me': jsonResponse(false) }));
  });

  it('/login 경로에서 로그인 폼이 렌더링된다', () => {
    renderApp('/login');

    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('로그인 ID')).toBeInTheDocument();
  });

  it('/signup 경로에서 회원가입 폼이 렌더링된다', () => {
    renderApp('/signup');

    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호 확인')).toBeInTheDocument();
  });

  it('accessToken이 없는 상태로 / 경로에 진입하면 로그인 화면으로 리다이렉트된다', () => {
    renderApp('/');

    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('accessToken이 있으면 / 경로에서 이벤트 목록 화면이 보인다', async () => {
    useAuthStore.getState().setAuth({ accessToken: 'token-1', refreshToken: 'refresh-1', role: 'user' });

    renderApp('/');

    expect(await screen.findByText('표시할 이벤트가 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '내 응모 내역' })).toBeInTheDocument();
  });

  it('accessToken이 있으면 /events/:id 경로에서 이벤트 상세 화면이 보인다', async () => {
    useAuthStore.getState().setAuth({ accessToken: 'token-1', refreshToken: 'refresh-1', role: 'user' });
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, {
          id: 1,
          title: '여름 특가 이벤트',
          imageUrl: null,
          startAt: '2026-07-01T00:00:00Z',
          endAt: '2026-08-31T00:00:00Z',
          prizeDescription: null,
          status: '진행중',
        }),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderApp('/events/1');

    expect(await screen.findByText('여름 특가 이벤트')).toBeInTheDocument();
  });

  it('accessToken이 있으면 /my-applications 경로에서 내 응모 내역 화면이 보인다', async () => {
    useAuthStore.getState().setAuth({ accessToken: 'token-1', refreshToken: 'refresh-1', role: 'user' });
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({ '/me/applications': jsonResponse(true, []), '/me': jsonResponse(false) }),
    );

    renderApp('/my-applications');

    expect(await screen.findByText('응모 내역이 없습니다.')).toBeInTheDocument();
  });

  it('accessToken이 없는 상태로 /admin 경로에 진입하면 로그인 화면으로 리다이렉트된다', () => {
    renderApp('/admin');

    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('accessToken이 있고 role이 user이면 /admin 진입 시 이벤트 목록 화면(/)으로 리다이렉트된다', async () => {
    useAuthStore.getState().setAuth({ accessToken: 'token-1', refreshToken: 'refresh-1', role: 'user' });

    renderApp('/admin');

    expect(await screen.findByText('표시할 이벤트가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByText(/관리자 홈 화면/)).not.toBeInTheDocument();
  });

  it('accessToken이 있고 role이 admin이면 /admin 경로에서 관리자 이벤트 목록 화면이 보인다', async () => {
    useAuthStore.getState().setAuth({ accessToken: 'token-1', refreshToken: 'refresh-1', role: 'admin' });
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({ '/admin/events': jsonResponse(true, []), '/me': jsonResponse(false) }),
    );

    renderApp('/admin');

    expect(await screen.findByRole('link', { name: '+ 이벤트 등록' })).toBeInTheDocument();
  });
});
