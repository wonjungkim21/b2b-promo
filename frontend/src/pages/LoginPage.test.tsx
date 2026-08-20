import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import LoginPage from './LoginPage';

function jsonResponse(status: number, body: unknown = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

function renderLoginPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>홈 화면 도착</div>} />
          <Route path="/admin" element={<div>관리자 홈 화면 도착</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function fillForm(loginId: string, password: string) {
  fireEvent.change(screen.getByPlaceholderText('로그인 ID'), { target: { value: loginId } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호'), { target: { value: password } });
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('로그인 성공(user role) 시 토큰이 저장되고 홈 화면으로 이동한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'at1', refreshToken: 'rt1', user: { id: 1, name: '홍길동', role: 'user' } }),
    );
    renderLoginPage();
    fillForm('hong1', 'pw1234');

    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe('at1'));
    expect(await screen.findByText('홈 화면 도착')).toBeInTheDocument();
  });

  it('로그인 성공(admin role) 시 관리자 홈 화면으로 이동한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'at2', refreshToken: 'rt2', user: { id: 2, name: '관리자', role: 'admin' } }),
    );
    renderLoginPage();
    fillForm('admin1', 'pw1234');

    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('관리자 홈 화면 도착')).toBeInTheDocument();
    expect(useAuthStore.getState().role).toBe('admin');
  });

  it('로그인 실패 시 오류 메시지를 표시하고 토큰을 저장하지 않는다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(401, { message: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
    );
    renderLoginPage();
    fillForm('hong1', 'wrongpw');

    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('아이디 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(screen.queryByText('홈 화면 도착')).not.toBeInTheDocument();
  });
});
