import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignupPage from './SignupPage';

function jsonResponse(status: number, body: unknown = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

function renderSignupPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<div>로그인 화면 도착</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function fillForm(name: string, loginId: string, password: string, passwordConfirm: string) {
  fireEvent.change(screen.getByPlaceholderText('이름'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('로그인 ID'), { target: { value: loginId } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호'), { target: { value: password } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호 확인'), { target: { value: passwordConfirm } });
}

describe('SignupPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('비밀번호와 비밀번호확인이 다르면 API 호출 없이 오류 메시지를 표시한다', async () => {
    renderSignupPage();
    fillForm('홍길동', 'hong1', 'pw1234', 'pw9999');

    fireEvent.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('비밀번호가 일치하면 signup API를 호출하고 성공 시 로그인 화면으로 이동한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(201, { id: 1, name: '홍길동', loginId: 'hong1', role: 'user' }),
    );
    renderSignupPage();
    fillForm('홍길동', 'hong1', 'pw1234', 'pw1234');

    fireEvent.click(screen.getByRole('button', { name: '가입하기' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('/auth/signup');
    expect(await screen.findByText('로그인 화면 도착')).toBeInTheDocument();
  });

  it('서버가 409를 반환하면 오류 메시지를 표시하고 화면 전환은 일어나지 않는다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(409, { message: '이미 사용중인 아이디입니다.' }),
    );
    renderSignupPage();
    fillForm('홍길동', 'hong1', 'pw1234', 'pw1234');

    fireEvent.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByText('이미 사용중인 아이디입니다.')).toBeInTheDocument();
    expect(screen.queryByText('로그인 화면 도착')).not.toBeInTheDocument();
  });
});
