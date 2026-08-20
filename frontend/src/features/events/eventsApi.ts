import { apiFetch } from '../../lib/apiClient';

export interface EventItem {
  id: number;
  title: string;
  imageUrl: string | null;
  startAt: string;
  endAt: string;
  prizeDescription: string | null;
  status: '예정' | '진행중' | '종료';
}

export async function getEvents(): Promise<EventItem[]> {
  const res = await apiFetch('/events');
  if (!res.ok) throw new Error('이벤트 목록을 불러오지 못했습니다.');
  return res.json();
}

export async function getEventDetail(id: number): Promise<EventItem> {
  const res = await apiFetch(`/events/${id}`);
  if (!res.ok) throw new Error('이벤트 정보를 불러오지 못했습니다.');
  return res.json();
}

export interface ApplyResult {
  eventId: number;
  pointBalance: number;
  totalCount: number;
  totalPointsUsed: number;
  lastAppliedAt: string;
}

export interface ApplyPayload {
  count: number;
  idempotencyKey: string;
}

export async function applyToEvent(eventId: number, payload: ApplyPayload): Promise<ApplyResult> {
  const res = await apiFetch(`/events/${eventId}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? '응모 처리 중 오류가 발생했습니다.');
  }
  return res.json();
}
