import { apiFetch } from '../../lib/apiClient';

export interface MyApplicationItem {
  eventId: number;
  eventTitle: string;
  eventStatus: '예정' | '진행중' | '종료';
  totalCount: number;
  totalPointsUsed: number;
  lastAppliedAt: string;
}

export async function getMyApplications(): Promise<MyApplicationItem[]> {
  const res = await apiFetch('/me/applications');
  if (!res.ok) throw new Error('응모 내역을 불러오지 못했습니다.');
  return res.json();
}
