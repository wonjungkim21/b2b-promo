import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, findByText, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PointBalanceBadge from './PointBalanceBadge';

function renderWithClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PointBalanceBadge />
    </QueryClientProvider>,
  );
}

function jsonResponse(ok: boolean, body: unknown = {}): Response {
  return { ok, json: async () => body } as Response;
}

describe('PointBalanceBadge', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  it('로딩 중에는 ...이 보인다', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { container } = renderWithClient();

    expect(container).toHaveTextContent('...');
  });

  it('성공 시 보유 포인트 텍스트가 보인다', async () => {
    mockFetch.mockResolvedValue(jsonResponse(true, { id: 1, name: '홍길동', role: 'user', pointBalance: 5500 }));

    const { container } = renderWithClient();

    await findByText(container, /보유 포인트 5,?500 P/);
  });

  it('실패 시 아무 텍스트도 렌더링되지 않는다', async () => {
    mockFetch.mockResolvedValue(jsonResponse(false));

    renderWithClient();

    await waitFor(() => {
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/보유 포인트/)).not.toBeInTheDocument();
  });
});
