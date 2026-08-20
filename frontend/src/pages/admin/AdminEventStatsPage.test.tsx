import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminEventStatsPage from './AdminEventStatsPage';

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

const sampleEvent = {
  id: 1,
  title: '여름 특가 이벤트',
  imageUrl: null,
  startAt: '2026-07-01T00:00:00Z',
  endAt: '2026-08-31T00:00:00Z',
  prizeDescription: null,
  status: '진행중' as const,
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/events/1/stats']}>
        <Routes>
          <Route path="/admin/events/:id/stats" element={<AdminEventStatsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminEventStatsPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1/applications': jsonResponse(true, {
          eventId: 1,
          totalApplyCount: 128,
          participantCount: 64,
        }),
        '/events/1': jsonResponse(true, sampleEvent),
      }),
    );
  });

  it('응모 현황 지표가 표시된다', async () => {
    renderPage();

    expect(await screen.findByText('전체 응모 횟수: 128회')).toBeInTheDocument();
    expect(screen.getByText('참여 사용자 수: 64명')).toBeInTheDocument();
  });

  it('응모가 0건이면 0회/0명으로 표시된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1/applications': jsonResponse(true, {
          eventId: 1,
          totalApplyCount: 0,
          participantCount: 0,
        }),
        '/events/1': jsonResponse(true, sampleEvent),
      }),
    );

    renderPage();

    expect(await screen.findByText('전체 응모 횟수: 0회')).toBeInTheDocument();
    expect(screen.getByText('참여 사용자 수: 0명')).toBeInTheDocument();
  });

  it('이벤트 제목이 헤더에 표시된다', async () => {
    renderPage();

    expect(await screen.findByText('여름 특가 이벤트 - 응모 현황')).toBeInTheDocument();
  });

  it('목록으로 링크는 /admin으로 이동한다', async () => {
    renderPage();

    const link = await screen.findByRole('link', { name: '< 목록으로' });
    expect(link).toHaveAttribute('href', '/admin');
  });

  it('응모 현황 조회 실패 시 에러 메시지가 표시된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1/applications': jsonResponse(false, { message: '이벤트를 찾을 수 없습니다.' }),
        '/events/1': jsonResponse(true, sampleEvent),
      }),
    );

    renderPage();

    expect(await screen.findByText('응모 현황을 불러오지 못했습니다.')).toBeInTheDocument();
  });
});
