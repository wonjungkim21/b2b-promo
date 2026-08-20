import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminEventFormPage from './AdminEventFormPage';

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

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/admin/events/new" element={<AdminEventFormPage />} />
          <Route path="/admin/events/:id/edit" element={<AdminEventFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminEventFormPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchByPath({}));
  });

  it('등록 모드에서 이벤트명이 비어있으면 검증 오류를 보여주고 POST를 호출하지 않는다', async () => {
    renderPage('/admin/events/new');

    fireEvent.change(screen.getByLabelText(/시작일시/), { target: { value: '2026-09-01T00:00' } });
    fireEvent.change(screen.getByLabelText(/종료일시/), { target: { value: '2026-09-30T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('이벤트명/기간은 필수입니다.')).toBeInTheDocument();
    const postCalled = (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
      ([input, init]) =>
        (typeof input === 'string' ? input : (input as URL).toString()).includes('/events') &&
        (init as RequestInit)?.method === 'POST',
    );
    expect(postCalled).toBe(false);
  });

  it('등록 모드에서 종료일시가 시작일시보다 빠르면 검증 오류를 보여주고 POST를 호출하지 않는다', async () => {
    renderPage('/admin/events/new');

    fireEvent.change(screen.getByLabelText(/이벤트명/), { target: { value: '가을 신메뉴' } });
    fireEvent.change(screen.getByLabelText(/시작일시/), { target: { value: '2026-09-30T00:00' } });
    fireEvent.change(screen.getByLabelText(/종료일시/), { target: { value: '2026-09-01T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('종료일시는 시작일시보다 이후여야 합니다.')).toBeInTheDocument();
    const postCalled = (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
      ([input, init]) =>
        (typeof input === 'string' ? input : (input as URL).toString()).includes('/events') &&
        (init as RequestInit)?.method === 'POST',
    );
    expect(postCalled).toBe(false);
  });

  it('등록 모드에서 유효한 값을 입력하고 저장하면 POST /events 요청이 발생한다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events': jsonResponse(true, { id: 10, title: '가을 신메뉴' }),
      }),
    );
    renderPage('/admin/events/new');

    fireEvent.change(screen.getByLabelText(/이벤트명/), { target: { value: '가을 신메뉴' } });
    fireEvent.change(screen.getByLabelText(/시작일시/), { target: { value: '2026-09-01T00:00' } });
    fireEvent.change(screen.getByLabelText(/종료일시/), { target: { value: '2026-09-30T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      const postCalled = (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
        ([input, init]) =>
          (typeof input === 'string' ? input : (input as URL).toString()).includes('/events') &&
          (init as RequestInit)?.method === 'POST',
      );
      expect(postCalled).toBe(true);
    });
  });

  it('수정 모드에서 기존 값이 폼에 프리필되고 상태 선택 라디오는 보이지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, {
          id: 1,
          title: '여름 특가',
          imageUrl: null,
          startAt: '2026-07-01T00:00:00Z',
          endAt: '2026-08-31T00:00:00Z',
          prizeDescription: null,
          status: '진행중',
        }),
      }),
    );

    renderPage('/admin/events/1/edit');

    expect(await screen.findByDisplayValue('여름 특가')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('수정 모드에서 값을 바꾸고 저장하면 PUT /events/1 요청이 발생한다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, {
          id: 1,
          title: '여름 특가',
          imageUrl: null,
          startAt: '2026-07-01T00:00:00Z',
          endAt: '2026-08-31T00:00:00Z',
          prizeDescription: null,
          status: '진행중',
        }),
      }),
    );

    renderPage('/admin/events/1/edit');

    const titleInput = await screen.findByDisplayValue('여름 특가');
    fireEvent.change(titleInput, { target: { value: '여름 특가(수정)' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      const putCalled = (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
        ([input, init]) =>
          (typeof input === 'string' ? input : (input as URL).toString()).includes('/events/1') &&
          (init as RequestInit)?.method === 'PUT',
      );
      expect(putCalled).toBe(true);
    });
  });

  it('등록 시 서버가 오류를 반환하면 오류 메시지가 화면에 표시된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events': jsonResponse(false, { message: '제목은 필수입니다.' }),
      }),
    );
    renderPage('/admin/events/new');

    fireEvent.change(screen.getByLabelText(/이벤트명/), { target: { value: '가을 신메뉴' } });
    fireEvent.change(screen.getByLabelText(/시작일시/), { target: { value: '2026-09-01T00:00' } });
    fireEvent.change(screen.getByLabelText(/종료일시/), { target: { value: '2026-09-30T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('제목은 필수입니다.')).toBeInTheDocument();
  });
});
