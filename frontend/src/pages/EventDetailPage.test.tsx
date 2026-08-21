import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetailPage from './EventDetailPage';

function jsonResponse(ok: boolean, body: unknown = {}): Response {
  return { ok, json: async () => body } as Response;
}

// routes 값으로 Response[]를 주면 호출될 때마다 순서대로 꺼내 쓰고, 마지막 항목은 이후 호출에도 재사용된다.
// 경로가 서로 접두 관계라면(예: '/events/1/applications'와 '/events/1') 더 구체적인 경로를 앞에 둘 것.
function mockFetchByPath(routes: Record<string, Response | Response[]>) {
  return vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    for (const [path, response] of Object.entries(routes)) {
      if (url.includes(path)) {
        if (Array.isArray(response)) {
          const next = response.length > 1 ? response.shift()! : response[0];
          return Promise.resolve(next);
        }
        return Promise.resolve(response);
      }
    }
    return Promise.resolve(jsonResponse(false));
  });
}

function applicationsCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter((call) => {
    const input = call[0] as RequestInfo | URL;
    return (typeof input === 'string' ? input : input.toString()).includes('/applications');
  });
}

function applyResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    eventId: 1,
    pointBalance: 4500,
    totalCount: 1,
    totalPointsUsed: 1000,
    lastAppliedAt: '2026-08-20T00:00:00Z',
    ...overrides,
  };
}

function baseEvent(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    title: '여름 특가',
    imageUrl: null,
    startAt: '2026-07-01T00:00:00Z',
    endAt: '2026-08-31T00:00:00Z',
    prizeDescription: null,
    status: '진행중',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventDetailPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchByPath({ '/events/1': jsonResponse(false), '/me': jsonResponse(false) }));
  });

  it('이미지/경품설명이 없으면 렌더링되지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5000 }),
      }),
    );

    renderPage();

    expect(await screen.findByText('여름 특가')).toBeInTheDocument();
    expect(screen.queryByAltText('여름 특가')).not.toBeInTheDocument();
    expect(screen.queryByText(/경품\/혜택/)).not.toBeInTheDocument();
  });

  it('포인트 잔액에 따라 최대 응모 가능 횟수가 계산된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    expect(await screen.findByText('최대 응모 가능 횟수: 5회')).toBeInTheDocument();
  });

  it('+ 버튼을 누르면 미리보기 포인트가 갱신된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    const incrementButton = await screen.findByRole('button', { name: '+' });
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);

    expect(await screen.findByText('사용 예정 포인트: 3,000 P')).toBeInTheDocument();
    expect(screen.getByText('응모 후 잔여 포인트: 2,500 P')).toBeInTheDocument();
  });

  it('- 버튼을 누르면 미리보기 포인트가 갱신되고 1 미만으로 내려가지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    const incrementButton = await screen.findByRole('button', { name: '+' });
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);
    const decrementButton = screen.getByRole('button', { name: '-' });
    fireEvent.click(decrementButton);

    expect(await screen.findByText('사용 예정 포인트: 2,000 P')).toBeInTheDocument();

    fireEvent.click(decrementButton);
    fireEvent.click(decrementButton);

    expect(await screen.findByText('사용 예정 포인트: 1,000 P')).toBeInTheDocument();
  });

  it.each(['0', '-1', '1.5', 'abc'])(
    '잘못된 횟수(%s) 입력 시 안내 문구와 "-" 미리보기가 표시된다',
    async (invalidValue) => {
      vi.stubGlobal(
        'fetch',
        mockFetchByPath({
          '/events/1': jsonResponse(true, baseEvent()),
          '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
        }),
      );

      renderPage();

      const input = await screen.findByDisplayValue('1');
      fireEvent.change(input, { target: { value: invalidValue } });

      expect(await screen.findByText('응모 횟수는 1 이상의 정수여야 합니다.')).toBeInTheDocument();
      expect(screen.getByText('사용 예정 포인트: -')).toBeInTheDocument();
      expect(screen.getByText('응모 후 잔여 포인트: -')).toBeInTheDocument();
    },
  );

  it('포인트가 1000 미만이면 응모 불가 안내와 비활성화 상태가 표시된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 800 }),
      }),
    );

    renderPage();

    expect(await screen.findByText('최대 응모 가능 횟수: 0회')).toBeInTheDocument();
    expect(screen.getByText('⚠ 포인트가 부족하여 응모할 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '-' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '+' })).toBeDisabled();
    expect(screen.getByDisplayValue('1')).toBeDisabled();
    expect(screen.getByRole('button', { name: '응모 확정' })).toBeDisabled();
  });

  it('응모 횟수가 최대 응모 가능 횟수를 초과하면 안내와 함께 응모 확정이 비활성화된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    const input = await screen.findByDisplayValue('1');
    fireEvent.change(input, { target: { value: '6' } });

    expect(await screen.findByText('최대 응모 가능 횟수를 초과했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '응모 확정' })).toBeDisabled();
  });

  it('이벤트가 진행중이 아니면 응모 불가 안내와 비활성화 상태가 표시된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1': jsonResponse(true, baseEvent({ status: '예정' })),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    expect(await screen.findByText('진행중인 이벤트만 응모할 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '-' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '+' })).toBeDisabled();
    expect(screen.getByDisplayValue('1')).toBeDisabled();
    expect(screen.getByRole('button', { name: '응모 확정' })).toBeDisabled();
  });

  it('응모 성공 시 누적 응모 정보가 화면에 표시된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1/applications': jsonResponse(true, applyResult()),
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    const applyButton = await screen.findByRole('button', { name: '응모 확정' });
    fireEvent.click(applyButton);

    expect(await screen.findByText(/누적 응모 횟수: 1회/)).toBeInTheDocument();
    expect(screen.getByText(/누적 사용 포인트: 1,000 P/)).toBeInTheDocument();
  });

  it('응모 확정 클릭 시 취소 불가 안내 확인창을 띄운다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1/applications': jsonResponse(true, applyResult()),
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '응모 확정' }));

    expect(window.confirm).toHaveBeenCalledWith('응모 후에는 취소할 수 없습니다. 응모하시겠습니까?');
  });

  it('확인창에서 취소를 선택하면 응모 요청이 전송되지 않는다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fetchMock = mockFetchByPath({
      '/events/1/applications': jsonResponse(true, applyResult()),
      '/events/1': jsonResponse(true, baseEvent()),
      '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '응모 확정' }));

    expect(applicationsCalls(fetchMock)).toHaveLength(0);
  });

  it('멱등키는 실패 시 유지되고 성공 후에만 새 키로 교체된다', async () => {
    // ponytail: useRef(crypto.randomUUID()) 인자는 매 렌더마다 평가되므로(useRef는 첫 값만 채택)
    // mockReturnValueOnce로 정확한 호출 횟수를 가정하기 어렵다. 실제 UUID를 그대로 쓰고
    // "실패 전후 키 동일 / 성공 후 키 변경"이라는 동작만 검증한다.
    const applyResponses = [
      jsonResponse(false, { message: '포인트가 부족합니다.' }),
      jsonResponse(true, applyResult({ totalCount: 1, totalPointsUsed: 1000 })),
      jsonResponse(true, applyResult({ totalCount: 2, totalPointsUsed: 2000 })),
    ];
    const fetchMock = mockFetchByPath({
      '/events/1/applications': applyResponses,
      '/events/1': jsonResponse(true, baseEvent()),
      '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    const applyButton = await screen.findByRole('button', { name: '응모 확정' });

    fireEvent.click(applyButton);
    await screen.findByText(/포인트가 부족합니다/);
    let calls = applicationsCalls(fetchMock);
    expect(calls).toHaveLength(1);
    const firstKey = JSON.parse(calls[0][1].body as string).idempotencyKey;

    fireEvent.click(applyButton);
    await screen.findByText(/누적 응모 횟수: 1회/);
    calls = applicationsCalls(fetchMock);
    expect(calls).toHaveLength(2);
    expect(JSON.parse(calls[1][1].body as string).idempotencyKey).toBe(firstKey);

    fireEvent.click(applyButton);
    await waitFor(() => {
      expect(applicationsCalls(fetchMock)).toHaveLength(3);
    });
    calls = applicationsCalls(fetchMock);
    expect(JSON.parse(calls[2][1].body as string).idempotencyKey).not.toBe(firstKey);
  });

  it('응모 요청 중에는 버튼이 비활성화되어 중복 클릭을 막는다', async () => {
    let resolveApply!: (response: Response) => void;
    const pendingApply = new Promise<Response>((resolve) => {
      resolveApply = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/applications')) return pendingApply;
        if (url.includes('/events/1')) return Promise.resolve(jsonResponse(true, baseEvent()));
        if (url.includes('/me')) {
          return Promise.resolve(jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }));
        }
        return Promise.resolve(jsonResponse(false));
      }),
    );

    renderPage();

    const applyButton = await screen.findByRole('button', { name: '응모 확정' });
    fireEvent.click(applyButton);

    await waitFor(() => expect(applyButton).toBeDisabled());

    resolveApply(jsonResponse(true, applyResult()));
    await screen.findByText(/누적 응모 횟수: 1회/);
  });

  it('포인트 부족 에러 응답 메시지가 그대로 표시된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1/applications': jsonResponse(false, {
          message: '포인트가 부족합니다. 필요 포인트: 2000, 보유 포인트: 800',
        }),
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    const applyButton = await screen.findByRole('button', { name: '응모 확정' });
    fireEvent.click(applyButton);

    expect(await screen.findByText('포인트가 부족합니다. 필요 포인트: 2000, 보유 포인트: 800')).toBeInTheDocument();
  });

  it('이벤트 종료 에러 응답 메시지가 그대로 표시된다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1/applications': jsonResponse(false, {
          message: '이벤트가 진행중 상태가 아닙니다.',
        }),
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    const applyButton = await screen.findByRole('button', { name: '응모 확정' });
    fireEvent.click(applyButton);

    expect(await screen.findByText('이벤트가 진행중 상태가 아닙니다.')).toBeInTheDocument();
  });

  it('응모 실패 시 보유 포인트가 차감되지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByPath({
        '/events/1/applications': jsonResponse(false, { message: '포인트가 부족합니다.' }),
        '/events/1': jsonResponse(true, baseEvent()),
        '/me': jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }),
      }),
    );

    renderPage();

    const pointTextBefore = (await screen.findByText(/보유 포인트/)).textContent;

    const applyButton = await screen.findByRole('button', { name: '응모 확정' });
    fireEvent.click(applyButton);
    await screen.findByText(/포인트가 부족합니다/);

    const pointTextAfter = screen.getByText(/보유 포인트/).textContent;
    expect(pointTextAfter).toBe(pointTextBefore);
  });
});
