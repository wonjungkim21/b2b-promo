import { apiFetch } from '../../lib/apiClient';

interface SignupPayload {
  name: string;
  loginId: string;
  password: string;
}

interface SignupResult {
  id: number;
  name: string;
  loginId: string;
  role: 'user' | 'admin';
}

interface LoginPayload {
  loginId: string;
  password: string;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: number; name: string; role: 'user' | 'admin' };
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message ?? '요청 처리 중 오류가 발생했습니다.';
  } catch {
    return '요청 처리 중 오류가 발생했습니다.';
  }
}

export async function signup(payload: SignupPayload): Promise<SignupResult> {
  const res = await apiFetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}
