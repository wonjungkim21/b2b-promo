import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import TopNav from './TopNav';
import { useAuthStore } from '../stores/authStore';

describe('TopNav', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth({ accessToken: 'token-1', refreshToken: 'refresh-1', role: 'user' });
  });

  it('backTo가 주어지면 클릭 시 해당 경로로 이동한다', () => {
    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/1" element={<TopNav backTo="/" />} />
          <Route path="/" element={<div>홈 화면</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '← 뒤로' }));

    expect(screen.getByText('홈 화면')).toBeInTheDocument();
  });

  it('backTo가 없으면 뒤로가기 버튼이 보이지 않는다', () => {
    render(
      <MemoryRouter initialEntries={['/current']}>
        <Routes>
          <Route path="/current" element={<TopNav />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: '← 뒤로' })).not.toBeInTheDocument();
  });

  it('로그아웃 버튼을 클릭하면 인증정보가 지워지고 로그인 화면으로 이동한다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<TopNav />} />
          <Route path="/login" element={<div>로그인 화면</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(screen.getByText('로그인 화면')).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
