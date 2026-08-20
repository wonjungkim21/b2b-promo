'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../app');
const pool = require('../db/pool');

let server;
let baseUrl;
let adminToken;
let userToken;

const createdEventIds = [];

function futureRange(offsetHours = 1, durationHours = 24) {
  const startAt = new Date(Date.now() + offsetHours * 3600 * 1000).toISOString();
  const endAt = new Date(Date.now() + (offsetHours + durationHours) * 3600 * 1000).toISOString();
  return { startAt, endAt };
}

async function createEvent(token, overrides = {}) {
  const { startAt, endAt } = futureRange();
  const body = {
    title: '테스트 이벤트',
    startAt,
    endAt,
    status: '예정',
    ...overrides,
  };
  const res = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res;
}

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;

  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'admin@freshmeal.test', password: 'password123' }),
  });
  assert.equal(adminLogin.status, 200);
  ({ accessToken: adminToken } = await adminLogin.json());

  const userLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'user-low@freshmeal.test', password: 'password123' }),
  });
  assert.equal(userLogin.status, 200);
  ({ accessToken: userToken } = await userLogin.json());
});

test.after(async () => {
  if (createdEventIds.length > 0) {
    await pool.query('DELETE FROM events WHERE id = ANY($1)', [createdEventIds]);
  }
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('POST /api/events: 관리자가 필수값을 모두 채워 등록하면 201과 id를 반환한다', async () => {
  const res = await createEvent(adminToken, { title: '신규 이벤트 등록 테스트' });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.id);
  assert.equal(body.title, '신규 이벤트 등록 테스트');
  createdEventIds.push(body.id);
});

test('POST /api/events: imageUrl/prizeDescription 없이도 등록되며 null로 응답한다', async () => {
  const res = await createEvent(adminToken, { title: '선택필드 없는 이벤트' });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.id);
  assert.equal(body.imageUrl, null);
  assert.equal(body.prizeDescription, null);
  createdEventIds.push(body.id);
});

test('POST /api/events: title 누락 시 400을 반환한다', async () => {
  const { startAt, endAt } = futureRange();
  const res = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ startAt, endAt, status: '예정' }),
  });
  assert.equal(res.status, 400);
});

test('POST /api/events: endAt이 startAt보다 이전이거나 같으면 400을 반환한다', async () => {
  const { startAt } = futureRange();
  const res = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ title: '역전된 기간', startAt, endAt: startAt, status: '예정' }),
  });
  assert.equal(res.status, 400);
});

test('PUT /api/events/:id: 이벤트를 수정하면 200과 반영된 값을 반환하고, 없는 id는 404를 반환한다', async () => {
  const createRes = await createEvent(adminToken, { title: '수정 전 제목' });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  createdEventIds.push(created.id);

  const { startAt, endAt } = futureRange(2, 48);
  const updateRes = await fetch(`${baseUrl}/api/events/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ title: '수정 후 제목', startAt, endAt }),
  });
  assert.equal(updateRes.status, 200);
  const updated = await updateRes.json();
  assert.equal(updated.title, '수정 후 제목');

  const notFoundRes = await fetch(`${baseUrl}/api/events/999999999`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ title: '없는 이벤트', startAt, endAt }),
  });
  assert.equal(notFoundRes.status, 404);
});

test('PATCH /api/events/:id/status: 예정→진행중→종료 순서로 정상 전이된다', async () => {
  const createRes = await createEvent(adminToken, { title: '상태전이 정상 케이스', status: '예정' });
  const created = await createRes.json();
  createdEventIds.push(created.id);

  const toOngoing = await fetch(`${baseUrl}/api/events/${created.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: '진행중' }),
  });
  assert.equal(toOngoing.status, 200);
  assert.equal((await toOngoing.json()).status, '진행중');

  const toEnded = await fetch(`${baseUrl}/api/events/${created.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: '종료' }),
  });
  assert.equal(toEnded.status, 200);
  assert.equal((await toEnded.json()).status, '종료');
});

test('PATCH /api/events/:id/status: 예정에서 종료로 건너뛰면 400을 반환한다', async () => {
  const createRes = await createEvent(adminToken, { title: '건너뛰기 케이스', status: '예정' });
  const created = await createRes.json();
  createdEventIds.push(created.id);

  const res = await fetch(`${baseUrl}/api/events/${created.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: '종료' }),
  });
  assert.equal(res.status, 400);
});

test('PATCH /api/events/:id/status: 진행중에서 예정으로 역방향 전이 시 400을 반환한다', async () => {
  const createRes = await createEvent(adminToken, { title: '역방향 전이 케이스', status: '예정' });
  const created = await createRes.json();
  createdEventIds.push(created.id);

  const toOngoing = await fetch(`${baseUrl}/api/events/${created.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: '진행중' }),
  });
  assert.equal(toOngoing.status, 200);

  const back = await fetch(`${baseUrl}/api/events/${created.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: '예정' }),
  });
  assert.equal(back.status, 400);
});

test('일반 user 권한으로 관리자 이벤트 API 호출 시 403을 반환한다', async () => {
  const getAdminListRes = await fetch(`${baseUrl}/api/admin/events`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(getAdminListRes.status, 403);

  const postRes = await createEvent(userToken, { title: '권한없는 등록 시도' });
  assert.equal(postRes.status, 403);

  const putRes = await fetch(`${baseUrl}/api/events/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ title: 'x', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 3600000).toISOString() }),
  });
  assert.equal(putRes.status, 403);

  const patchRes = await fetch(`${baseUrl}/api/events/1/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ status: '진행중' }),
  });
  assert.equal(patchRes.status, 403);
});

test('GET /api/admin/events: 관리자는 종료 이벤트를 포함한 전체 목록을 조회한다', async () => {
  const res = await fetch(`${baseUrl}/api/admin/events`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
  assert.ok(body.some((e) => e.status === '종료'));
});
