import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMyApplications } from './applicationsApi';

function jsonResponse(ok: boolean, body: unknown = {}): Response {
  return { ok, json: async () => body } as Response;
}

describe('applicationsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('성공 응답이면 내 응모 내역을 그대로 반환한다', async () => {
    const applications = [
      {
        eventId: 1,
        eventTitle: '여름 특가',
        eventStatus: '진행중' as const,
        totalCount: 2,
        totalPointsUsed: 2000,
        lastAppliedAt: '2026-08-10T14:22:00Z',
      },
      {
        eventId: 2,
        eventTitle: '봄맞이 이벤트',
        eventStatus: '종료' as const,
        totalCount: 1,
        totalPointsUsed: 1000,
        lastAppliedAt: '2026-05-02T09:10:00Z',
      },
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, applications));

    await expect(getMyApplications()).resolves.toEqual(applications);
  });

  it('실패 응답이면 Error를 throw한다', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(false));

    await expect(getMyApplications()).rejects.toThrow();
  });
});
