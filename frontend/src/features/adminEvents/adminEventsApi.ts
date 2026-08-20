import { apiFetch } from '../../lib/apiClient';
import type { EventItem } from '../events/eventsApi';

export interface EventFormPayload {
  title: string;
  imageUrl: string | null;
  startAt: string;
  endAt: string;
  prizeDescription: string | null;
}

export interface EventCreatePayload extends EventFormPayload {
  status: '예정' | '진행중' | '종료';
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message ?? '요청 처리 중 오류가 발생했습니다.';
  } catch {
    return '요청 처리 중 오류가 발생했습니다.';
  }
}

export async function getAdminEvents(): Promise<EventItem[]> {
  const res = await apiFetch('/admin/events');
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function createEvent(payload: EventCreatePayload): Promise<EventItem> {
  const res = await apiFetch('/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateEvent(id: number, payload: EventFormPayload): Promise<EventItem> {
  const res = await apiFetch(`/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface ApplicationSummary {
  eventId: number;
  totalApplyCount: number;
  participantCount: number;
}

export async function getEventApplicationSummary(id: number): Promise<ApplicationSummary> {
  const res = await apiFetch(`/events/${id}/applications`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateEventStatus(
  id: number,
  status: '예정' | '진행중' | '종료',
): Promise<EventItem> {
  const res = await apiFetch(`/events/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}
