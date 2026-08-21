const BASE = 'https://honghak-123-be.vercel.app';

async function login(loginId, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  });
  return (await res.json()).accessToken;
}

async function apply(token, eventId, count, idempotencyKey) {
  const res = await fetch(`${BASE}/api/events/${eventId}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ count, idempotencyKey }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function main() {
  const token = await login('user-mid@freshmeal.test', 'password123');
  const [a, b] = await Promise.all([
    apply(token, 2, 1, 'prod-e2e-concurrent-A'),
    apply(token, 2, 1, 'prod-e2e-concurrent-B'),
  ]);
  console.log(JSON.stringify({ a, b }, null, 2));
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
