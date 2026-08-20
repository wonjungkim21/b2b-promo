import { apiFetch } from '../../lib/apiClient';

export interface MeResult {
  id: number;
  name: string;
  role: 'user' | 'admin';
  pointBalance: number;
}

export async function getMe(): Promise<MeResult> {
  const res = await apiFetch('/me');
  if (!res.ok) throw new Error('내 정보를 불러오지 못했습니다.');
  return res.json();
}
