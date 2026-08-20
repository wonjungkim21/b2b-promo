import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEvent,
  getAdminEvents,
  getEventApplicationSummary,
  updateEvent,
  updateEventStatus,
} from './adminEventsApi';

function jsonResponse(ok: boolean, body: unknown = {}): Response {
  return { ok, json: async () => body } as Response;
}

const sampleEvent = {
  id: 1,
  title: '여름 특가',
  imageUrl: null,
  startAt: '2026-07-01T00:00:00Z',
  endAt: '2026-08-31T00:00:00Z',
  prizeDescription: null,
  status: '진행중' as const,
};

describe('adminEventsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getAdminEvents 성공이면 예정/진행중/종료가 섞인 목록을 그대로 반환한다', async () => {
    const events = [
      { ...sampleEvent, id: 1, status: '예정' as const },
      { ...sampleEvent, id: 2, status: '진행중' as const },
      { ...sampleEvent, id: 3, status: '종료' as const },
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, events));

    await expect(getAdminEvents()).resolves.toEqual(events);
  });

  it('getAdminEvents 실패면 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(false));

    await expect(getAdminEvents()).rejects.toThrow();
  });

  it('createEvent 성공(201)이면 생성된 이벤트를 그대로 반환한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, sampleEvent));

    await expect(
      createEvent({
        title: '여름 특가',
        imageUrl: null,
        startAt: '2026-07-01T00:00:00Z',
        endAt: '2026-08-31T00:00:00Z',
        prizeDescription: null,
        status: '예정',
      }),
    ).resolves.toEqual(sampleEvent);
  });

  it('createEvent 실패(400)면 메시지를 담은 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(false, { message: '제목은 필수입니다.' }),
    );

    await expect(
      createEvent({
        title: '',
        imageUrl: null,
        startAt: '2026-07-01T00:00:00Z',
        endAt: '2026-08-31T00:00:00Z',
        prizeDescription: null,
        status: '예정',
      }),
    ).rejects.toThrow('제목은 필수입니다.');
  });

  it('updateEvent 성공(200)이면 수정된 이벤트를 그대로 반환한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, sampleEvent));

    await expect(
      updateEvent(1, {
        title: '여름 특가',
        imageUrl: null,
        startAt: '2026-07-01T00:00:00Z',
        endAt: '2026-08-31T00:00:00Z',
        prizeDescription: null,
      }),
    ).resolves.toEqual(sampleEvent);
  });

  it('updateEvent 실패(404)면 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(false, {}));

    await expect(
      updateEvent(999, {
        title: '여름 특가',
        imageUrl: null,
        startAt: '2026-07-01T00:00:00Z',
        endAt: '2026-08-31T00:00:00Z',
        prizeDescription: null,
      }),
    ).rejects.toThrow();
  });

  it('updateEventStatus 성공(200)이면 변경된 이벤트를 그대로 반환한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, sampleEvent));

    await expect(updateEventStatus(1, '진행중')).resolves.toEqual(sampleEvent);
  });

  it('updateEventStatus 실패(400)면 메시지를 담은 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(false, { message: '허용되지 않는 상태 전이입니다.' }),
    );

    await expect(updateEventStatus(1, '예정')).rejects.toThrow('허용되지 않는 상태 전이입니다.');
  });

  it('getEventApplicationSummary 성공(200)이면 응모 현황을 그대로 반환한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(true, { eventId: 1, totalApplyCount: 128, participantCount: 64 }),
    );

    await expect(getEventApplicationSummary(1)).resolves.toEqual({
      eventId: 1,
      totalApplyCount: 128,
      participantCount: 64,
    });
  });

  it('getEventApplicationSummary 실패(404)면 메시지를 담은 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(false, { message: '이벤트를 찾을 수 없습니다.' }),
    );

    await expect(getEventApplicationSummary(1)).rejects.toThrow('이벤트를 찾을 수 없습니다.');
  });
});
