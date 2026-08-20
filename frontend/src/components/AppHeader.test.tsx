import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import AppHeader from './AppHeader';
import { useAuthStore } from '../stores/authStore';

describe('AppHeader', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('브랜드 로고와 워드마크가 보인다', () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    );

    expect(screen.getByAltText('FreshMeal')).toBeInTheDocument();
    expect(screen.getByText('FreshMeal')).toBeInTheDocument();
  });

  it('role이 user이면 내 응모 내역 아이콘이 /my-applications로 연결된다', () => {
    useAuthStore.getState().setAuth({ accessToken: 'token-1', refreshToken: 'refresh-1', role: 'user' });

    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: '내 응모 내역' });
    expect(link).toHaveAttribute('href', '/my-applications');
  });

  it('role이 admin이면 내 응모 내역 아이콘이 보이지 않는다', () => {
    useAuthStore.getState().setAuth({ accessToken: 'token-1', refreshToken: 'refresh-1', role: 'admin' });

    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: '내 응모 내역' })).not.toBeInTheDocument();
  });
});
