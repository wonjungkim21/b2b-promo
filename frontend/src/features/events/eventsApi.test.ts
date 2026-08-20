import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyToEvent, getEventDetail, getEvents } from './eventsApi';

function jsonResponse(ok: boolean, body: unknown = {}): Response {
  return { ok, json: async () => body } as Response;
}

describe('eventsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('성공 응답이면 이벤트 목록을 그대로 반환한다', async () => {
    const events = [
      {
        id: 1,
        title: '여름 특가',
        imageUrl: null,
        startAt: '2026-07-01T00:00:00Z',
        endAt: '2026-08-31T00:00:00Z',
        prizeDescription: null,
        status: '진행중' as const,
      },
      {
        id: 2,
        title: '가을 신메뉴',
        imageUrl: null,
        startAt: '2026-09-01T00:00:00Z',
        endAt: '2026-09-30T00:00:00Z',
        prizeDescription: null,
        status: '예정' as const,
      },
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, events));

    await expect(getEvents()).resolves.toEqual(events);
  });

  it('실패 응답이면 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(false));

    await expect(getEvents()).rejects.toThrow();
  });

  it('성공 응답이면 이벤트 상세를 그대로 반환한다', async () => {
    const event = {
      id: 1,
      title: '여름 특가',
      imageUrl: null,
      startAt: '2026-07-01T00:00:00Z',
      endAt: '2026-08-31T00:00:00Z',
      prizeDescription: null,
      status: '진행중' as const,
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, event));

    await expect(getEventDetail(1)).resolves.toEqual(event);
  });

  it('상세 조회 실패 응답이면 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(false, {}));

    await expect(getEventDetail(1)).rejects.toThrow();
  });

  it('응모 성공 응답이면 결과를 그대로 반환한다', async () => {
    const result = {
      eventId: 1,
      pointBalance: 3000,
      totalCount: 2,
      totalPointsUsed: 2000,
      lastAppliedAt: '2026-08-20T00:00:00Z',
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, result));

    await expect(applyToEvent(1, { count: 2, idempotencyKey: 'key-a' })).resolves.toEqual(result);
  });

  it('포인트 부족(400) 응답이면 메시지를 담은 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(false, { message: '포인트가 부족합니다. 필요 포인트: 2000, 보유 포인트: 800' }),
    );

    await expect(applyToEvent(1, { count: 2, idempotencyKey: 'key-a' })).rejects.toThrow(
      '포인트가 부족합니다. 필요 포인트: 2000, 보유 포인트: 800',
    );
  });

  it('이벤트 상태 불일치(409) 응답이면 메시지를 담은 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(false, { message: '이벤트(3)가 진행중 상태가 아닙니다.' }),
    );

    await expect(applyToEvent(3, { count: 1, idempotencyKey: 'key-a' })).rejects.toThrow(
      '이벤트(3)가 진행중 상태가 아닙니다.',
    );
  });
});
