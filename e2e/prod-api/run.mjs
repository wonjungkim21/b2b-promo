const BASE = 'https://honghak-123-be.vercel.app';
const results = [];

async function req(method, path, token, data) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function run(scenario, desc, method, path, token, data) {
  const { status, body } = await req(method, path, token, data);
  results.push({ scenario, desc, http: status, body });
  console.log(`[${scenario}] ${desc} -> HTTP ${status}`);
  return { status, body };
}

function find(scenario) {
  return results.find((r) => r.scenario === scenario);
}

async function main() {
  console.log('== UC-0 signup ==');
  await run('3.1-1', 'signup normal', 'POST', '/api/auth/signup', null, {
    name: 'E2E Prod User',
    loginId: 'prod-e2e-01@test.com',
    password: 'password123',
  });
  await run('3.1-2', 'signup duplicate loginId', 'POST', '/api/auth/signup', null, {
    name: 'E2E Prod User Dup',
    loginId: 'prod-e2e-01@test.com',
    password: 'password123',
  });

  console.log('== UC-1 login ==');
  await run('3.2-2', 'login wrong password', 'POST', '/api/auth/login', null, {
    loginId: 'user-mid@freshmeal.test',
    password: 'wrongpass',
  });
  const adminLogin = await run('3.2-1a', 'login admin', 'POST', '/api/auth/login', null, {
    loginId: 'admin@freshmeal.test',
    password: 'password123',
  });
  const lowLogin = await run('3.2-1b', 'login user-low', 'POST', '/api/auth/login', null, {
    loginId: 'user-low@freshmeal.test',
    password: 'password123',
  });
  const midLogin = await run('3.2-1c', 'login user-mid', 'POST', '/api/auth/login', null, {
    loginId: 'user-mid@freshmeal.test',
    password: 'password123',
  });
  const highLogin = await run('3.2-1d', 'login user-high', 'POST', '/api/auth/login', null, {
    loginId: 'user-high@freshmeal.test',
    password: 'password123',
  });

  const ADMIN = adminLogin.body.accessToken;
  const LOW = lowLogin.body.accessToken;
  const MID = midLogin.body.accessToken;
  const HIGH = highLogin.body.accessToken;

  console.log('== UC-2 event list ==');
  await run('3.3-1', 'event list only ongoing/scheduled', 'GET', '/api/events', MID, null);

  console.log('== UC-3 event detail ==');
  await run('3.4-1', 'event detail #1', 'GET', '/api/events/1', MID, null);

  console.log('== UC-4 point balance ==');
  await run('3.5-1a', 'me low', 'GET', '/api/me', LOW, null);
  await run('3.5-1b', 'me mid', 'GET', '/api/me', MID, null);
  await run('3.5-1c', 'me high', 'GET', '/api/me', HIGH, null);

  console.log('== UC-6-2 invalid apply count ==');
  await run('3.7-2a', 'apply count 0', 'POST', '/api/events/1/applications', HIGH, {
    count: 0,
    idempotencyKey: 'prod-e2e-count0',
  });
  await run('3.7-2b', 'apply count -1', 'POST', '/api/events/1/applications', HIGH, {
    count: -1,
    idempotencyKey: 'prod-e2e-countneg',
  });
  await run('3.7-2c', 'apply count 1.5', 'POST', '/api/events/1/applications', HIGH, {
    count: 1.5,
    idempotencyKey: 'prod-e2e-countdec',
  });

  console.log('== UC-7-1 apply success ==');
  await run('3.8-1', 'apply success count2', 'POST', '/api/events/1/applications', HIGH, {
    count: 2,
    idempotencyKey: 'prod-e2e-apply-1',
  });

  console.log('== UC-7-4 reapply accumulate ==');
  await run('3.8-4', 'apply accumulate count1', 'POST', '/api/events/1/applications', HIGH, {
    count: 1,
    idempotencyKey: 'prod-e2e-apply-2',
  });

  console.log('== UC-7-5 idempotent retry ==');
  await run('3.8-5', 'idempotent retry same key', 'POST', '/api/events/1/applications', HIGH, {
    count: 1,
    idempotencyKey: 'prod-e2e-apply-2',
  });

  console.log('== UC-7-2 insufficient points ==');
  await run('3.8-2', 'insufficient points (user-low)', 'POST', '/api/events/1/applications', LOW, {
    count: 1,
    idempotencyKey: 'prod-e2e-lowbal',
  });

  console.log('== UC-8-1 my applications ==');
  await run('3.9-1', 'my applications (user-high)', 'GET', '/api/me/applications', HIGH, null);

  console.log('== UC-9 admin create event ==');
  await run('4.1-2', 'create event invalid period', 'POST', '/api/events', ADMIN, {
    title: 'E2E Prod Event',
    startAt: '2027-09-10T00:00:00Z',
    endAt: '2027-09-01T00:00:00Z',
    status: '예정',
  });
  const created = await run('4.1-1', 'create event normal', 'POST', '/api/events', ADMIN, {
    title: 'E2E Prod Event',
    startAt: '2027-09-01T00:00:00Z',
    endAt: '2027-09-10T00:00:00Z',
    status: '예정',
  });
  const NEW_EVENT_ID = created.body.id;
  console.log('NEW_EVENT_ID', NEW_EVENT_ID);

  console.log('== UC-10 admin update event ==');
  await run('4.2-2', 'update event invalid period', 'PUT', `/api/events/${NEW_EVENT_ID}`, ADMIN, {
    title: 'E2E Prod Event Updated',
    startAt: '2027-09-10T00:00:00Z',
    endAt: '2027-09-01T00:00:00Z',
  });
  await run('4.2-1', 'update event normal', 'PUT', `/api/events/${NEW_EVENT_ID}`, ADMIN, {
    title: 'E2E Prod Event Updated',
    startAt: '2027-09-01T00:00:00Z',
    endAt: '2027-09-10T00:00:00Z',
  });

  console.log('== UC-11 status transitions ==');
  await run('4.3-1', 'scheduled to ongoing', 'PATCH', `/api/events/${NEW_EVENT_ID}/status`, ADMIN, {
    status: '진행중',
  });
  await run('4.3-3', 'backward ongoing to scheduled (reject)', 'PATCH', `/api/events/${NEW_EVENT_ID}/status`, ADMIN, {
    status: '예정',
  });
  await run('4.3-2', 'ongoing to ended', 'PATCH', `/api/events/${NEW_EVENT_ID}/status`, ADMIN, {
    status: '종료',
  });
  await run('4.3-4', 'skip scheduled to ended (reject, event3)', 'PATCH', '/api/events/3/status', ADMIN, {
    status: '종료',
  });

  console.log('== UC-7-3 apply to now-ended event ==');
  await run('3.8-3', 'apply to ended event', 'POST', `/api/events/${NEW_EVENT_ID}/applications`, HIGH, {
    count: 1,
    idempotencyKey: 'prod-e2e-ended',
  });

  console.log('== UC-12 admin stats ==');
  await run('4.4-1', 'event1 application stats', 'GET', '/api/events/1/applications', ADMIN, null);

  console.log('== admin list ==');
  await run('admin-list', 'admin event list', 'GET', '/api/admin/events', ADMIN, null);

  await import('node:fs').then((fs) =>
    fs.writeFileSync('./results.json', JSON.stringify(results, null, 2), 'utf8'),
  );
  console.log('Done. Results written to results.json');
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
