import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import EventListPage from './EventListPage';

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

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EventListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventListPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({ '/me': jsonResponse(false) }),
    );
  });

  it('이벤트 목록을 받아오면 각 이벤트 제목이 보인다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events': jsonResponse(true, [
          {
            id: 1,
            title: '여름 특가',
            startAt: '2026-07-01T00:00:00Z',
            endAt: '2026-08-31T00:00:00Z',
            status: '진행중',
            imageUrl: null,
            prizeDescription: null,
          },
          {
            id: 2,
            title: '가을 신메뉴',
            startAt: '2026-09-01T00:00:00Z',
            endAt: '2026-09-30T00:00:00Z',
            status: '예정',
            imageUrl: null,
            prizeDescription: null,
          },
        ]),
        '/me': jsonResponse(false),
      }),
    );

    renderPage();

    expect(await screen.findByText('여름 특가')).toBeInTheDocument();
    expect(await screen.findByText('가을 신메뉴')).toBeInTheDocument();
  });

  it('각 이벤트 카드는 이벤트 상세 링크로 감싸진다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events': jsonResponse(true, [
          {
            id: 1,
            title: '여름 특가',
            startAt: '2026-07-01T00:00:00Z',
            endAt: '2026-08-31T00:00:00Z',
            status: '진행중',
            imageUrl: null,
            prizeDescription: null,
          },
        ]),
        '/me': jsonResponse(false),
      }),
    );

    renderPage();

    const link = await screen.findByRole('link', { name: /여름 특가/ });
    expect(link).toHaveAttribute('href', '/events/1');
  });

  it('빈 배열이면 표시할 이벤트가 없다는 텍스트가 보인다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({ '/events': jsonResponse(true, []), '/me': jsonResponse(false) }),
    );

    renderPage();

    expect(await screen.findByText('표시할 이벤트가 없습니다.')).toBeInTheDocument();
  });

  it('이벤트 목록 조회 실패 시 에러 텍스트가 보인다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({ '/events': jsonResponse(false), '/me': jsonResponse(false) }),
    );

    renderPage();

    expect(await screen.findByText('이벤트 목록을 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('내 응모 내역 링크가 /my-applications를 가리킨다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({ '/events': jsonResponse(true, []), '/me': jsonResponse(false) }),
    );

    renderPage();

    const link = await screen.findByRole('link', { name: '내 응모 내역' });
    expect(link).toHaveAttribute('href', '/my-applications');
  });
});
