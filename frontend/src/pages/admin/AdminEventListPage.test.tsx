import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminEventListPage from './AdminEventListPage';

function jsonResponse(ok: boolean, body: unknown = {}): Response {
  return { ok, json: async () => body } as Response;
}

const events = [
  {
    id: 1,
    title: '가을 신메뉴',
    imageUrl: null,
    startAt: '2026-09-01T00:00:00Z',
    endAt: '2026-09-30T00:00:00Z',
    prizeDescription: null,
    status: '예정' as const,
  },
  {
    id: 2,
    title: '여름 특가',
    imageUrl: null,
    startAt: '2026-07-01T00:00:00Z',
    endAt: '2026-08-31T00:00:00Z',
    prizeDescription: null,
    status: '진행중' as const,
  },
  {
    id: 3,
    title: '봄맞이 이벤트',
    imageUrl: null,
    startAt: '2026-03-01T00:00:00Z',
    endAt: '2026-03-31T00:00:00Z',
    prizeDescription: null,
    status: '종료' as const,
  },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminEventListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminEventListPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/admin/events')) return Promise.resolve(jsonResponse(true, events));
        return Promise.resolve(jsonResponse(true));
      }),
    );
  });

  it('예정/진행중/종료 이벤트 3건이 모두 목록에 보인다', async () => {
    renderPage();

    expect(await screen.findByText('가을 신메뉴')).toBeInTheDocument();
    expect(screen.getByText('여름 특가')).toBeInTheDocument();
    expect(screen.getByText('봄맞이 이벤트')).toBeInTheDocument();
  });

  it('진행중 행에는 "종료로 변경" 버튼만 있고 "예정으로 변경" 버튼은 없다', async () => {
    renderPage();

    const row = (await screen.findByText('여름 특가')).closest('tr')!;
    expect(within(row).getByRole('button', { name: '종료로 변경' })).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /예정.*변경/ })).not.toBeInTheDocument();
  });

  it('종료 행에는 상태변경 버튼이 하나도 없다', async () => {
    renderPage();

    const row = (await screen.findByText('봄맞이 이벤트')).closest('tr')!;
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  });

  it('예정 행의 "진행중으로 변경" 버튼을 클릭하면 status PATCH 요청이 발생한다', async () => {
    renderPage();

    const row = (await screen.findByText('가을 신메뉴')).closest('tr')!;
    fireEvent.click(within(row).getByRole('button', { name: '진행중로 변경' }));

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const patchCall = calls.find(([input, init]) => {
        const url = typeof input === 'string' ? input : (input as URL).toString();
        return url.includes('/events/1/status') && (init as RequestInit)?.method === 'PATCH';
      });
      expect(patchCall).toBeDefined();
      expect(JSON.parse((patchCall![1] as RequestInit).body as string)).toEqual({ status: '진행중' });
    });
  });

  it('"+ 이벤트 등록" 링크가 /admin/events/new를 가리킨다', async () => {
    renderPage();

    const link = await screen.findByRole('link', { name: '+ 이벤트 등록' });
    expect(link).toHaveAttribute('href', '/admin/events/new');
  });
});
