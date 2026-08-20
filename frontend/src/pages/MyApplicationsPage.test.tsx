import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MyApplicationsPage from './MyApplicationsPage';

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
        <MyApplicationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MyApplicationsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchByPath({ '/me/applications': jsonResponse(false) }));
  });

  it('응모 내역을 받아오면 진행중/종료 이벤트가 모두 보인다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/me/applications': jsonResponse(true, [
          {
            eventId: 1,
            eventTitle: '여름 특가',
            eventStatus: '진행중',
            totalCount: 2,
            totalPointsUsed: 2000,
            lastAppliedAt: '2026-08-10T14:22:00Z',
          },
          {
            eventId: 2,
            eventTitle: '봄맞이 이벤트',
            eventStatus: '종료',
            totalCount: 1,
            totalPointsUsed: 1000,
            lastAppliedAt: '2026-05-02T09:10:00Z',
          },
        ]),
      }),
    );

    renderPage();

    expect(await screen.findByText('여름 특가')).toBeInTheDocument();
    expect(await screen.findByText('봄맞이 이벤트')).toBeInTheDocument();
  });

  it('각 카드에 누적 응모 횟수와 누적 사용 포인트가 보인다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/me/applications': jsonResponse(true, [
          {
            eventId: 1,
            eventTitle: '여름 특가',
            eventStatus: '진행중',
            totalCount: 2,
            totalPointsUsed: 2000,
            lastAppliedAt: '2026-08-10T14:22:00Z',
          },
        ]),
      }),
    );

    renderPage();

    expect(await screen.findByText(/누적 응모: 2회/)).toBeInTheDocument();
    expect(screen.getByText(/누적 사용 포인트: 2,000 P/)).toBeInTheDocument();
  });

  it('빈 배열이면 응모 내역이 없다는 텍스트가 보인다', async () => {
    vi.stubGlobal('fetch', mockFetchByPath({ '/me/applications': jsonResponse(true, []) }));

    renderPage();

    expect(await screen.findByText('응모 내역이 없습니다.')).toBeInTheDocument();
  });

  it('조회 실패 시 에러 텍스트가 보인다', async () => {
    vi.stubGlobal('fetch', mockFetchByPath({ '/me/applications': jsonResponse(false) }));

    renderPage();

    expect(await screen.findByText('응모 내역을 불러오지 못했습니다.')).toBeInTheDocument();
  });
});
