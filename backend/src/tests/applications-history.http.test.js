'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');

const app = require('../app');
const pool = require('../db/pool');

let server;
let baseUrl;

// 이 파일 전용으로 생성한 row들 (다른 테스트 파일의 seed 유저/이벤트와 절대 겹치지 않음)
let testUserId; // signup으로 생성, event_applications/point_transactions는 직접 INSERT
let testUserLoginId;
let otherEventId; // 응모 0건, 진행중
let ongoingEventId; // 전용 진행중 이벤트, testUser가 응모
let endedEventId; // 전용 종료 이벤트, testUser가 응모
const createdEventIds = [];

function uuid() {
  return crypto.randomUUID();
}

async function login(loginId, password = 'password123') {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  });
  assert.equal(res.status, 200, `로그인 실패: ${loginId}`);
  return res.json();
}

async function insertEvent({ title, status, startAt, endAt }) {
  const { rows } = await pool.query(
    `INSERT INTO events (title, start_at, end_at, status)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [title, startAt, endAt, status]
  );
  const id = rows[0].id;
  createdEventIds.push(id);
  return id;
}

async function insertApplication(userId, eventId, totalCount, totalPointsUsed) {
  const { rows } = await pool.query(
    `INSERT INTO event_applications (user_id, event_id, total_count, total_points_used)
     VALUES ($1, $2, $3, $4) RETURNING id, last_applied_at`,
    [userId, eventId, totalCount, totalPointsUsed]
  );
  await pool.query(
    `INSERT INTO point_transactions (user_id, event_id, event_application_id, amount, type, idempotency_key)
     VALUES ($1, $2, $3, $4, 'EVENT_APPLY', $5)`,
    [userId, eventId, rows[0].id, totalPointsUsed, uuid()]
  );
  return rows[0];
}

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;

  const now = Date.now();
  ongoingEventId = await insertEvent({
    title: '[응모내역테스트] 진행중 전용 이벤트',
    status: '진행중',
    startAt: new Date(now - 3600 * 1000).toISOString(),
    endAt: new Date(now + 3600 * 1000).toISOString(),
  });
  endedEventId = await insertEvent({
    title: '[응모내역테스트] 종료 전용 이벤트',
    status: '종료',
    startAt: new Date(now - 2 * 3600 * 1000).toISOString(),
    endAt: new Date(now - 3600 * 1000).toISOString(),
  });
  otherEventId = await insertEvent({
    title: '[응모내역테스트] 응모 0건 이벤트',
    status: '진행중',
    startAt: new Date(now - 3600 * 1000).toISOString(),
    endAt: new Date(now + 3600 * 1000).toISOString(),
  });

  testUserLoginId = `history-test-${uuid()}@freshmeal.test`;
  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '응모내역테스트유저',
      loginId: testUserLoginId,
      password: 'password123',
    }),
  });
  assert.equal(signupRes.status, 201);
  const signupBody = await signupRes.json();
  testUserId = signupBody.id;

  await insertApplication(testUserId, ongoingEventId, 2, 2000);
  await insertApplication(testUserId, endedEventId, 1, 1000);
});

test.after(async () => {
  if (testUserId) {
    await pool.query('DELETE FROM point_transactions WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM event_applications WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  }
  if (createdEventIds.length > 0) {
    await pool.query('DELETE FROM events WHERE id = ANY($1)', [createdEventIds]);
  }
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('GET /api/me/applications: 본인의 응모 이벤트별 내역을 반환하며 종료 이벤트도 포함된다', async () => {
  const { accessToken } = await login(testUserLoginId);

  const res = await fetch(`${baseUrl}/api/me/applications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));

  const ongoing = body.find((e) => String(e.eventId) === String(ongoingEventId));
  const ended = body.find((e) => String(e.eventId) === String(endedEventId));
  assert.ok(ongoing, '진행중 이벤트 응모 내역이 포함되어야 한다');
  assert.ok(ended, '종료 이벤트 응모 내역도 포함되어야 한다');

  assert.equal(ongoing.eventStatus, '진행중');
  assert.equal(ongoing.totalCount, 2);
  assert.equal(ongoing.totalPointsUsed, 2000);
  assert.ok(ongoing.lastAppliedAt);

  assert.equal(ended.eventStatus, '종료');
  assert.equal(ended.totalCount, 1);
  assert.equal(ended.totalPointsUsed, 1000);
  assert.ok(ended.lastAppliedAt);
});

test('GET /api/me/applications: 다른 유저의 응모 내역은 섞이지 않는다', async () => {
  const { accessToken } = await login('user-low@freshmeal.test');

  const res = await fetch(`${baseUrl}/api/me/applications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));

  const leaked = body.find(
    (e) => String(e.eventId) === String(ongoingEventId) || String(e.eventId) === String(endedEventId)
  );
  assert.equal(leaked, undefined, '다른 유저의 응모 내역에 테스트 유저 이벤트가 섞이면 안 된다');
});

test('GET /api/events/:id/applications: 관리자가 조회하면 전체 응모 횟수와 참여자 수를 반환한다', async () => {
  const { accessToken } = await login('admin@freshmeal.test');

  const res = await fetch(`${baseUrl}/api/events/${ongoingEventId}/applications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(String(body.eventId), String(ongoingEventId));
  assert.equal(body.totalApplyCount, 2);
  assert.equal(body.participantCount, 1);
});

test('GET /api/events/:id/applications: 응모가 없는 이벤트는 0을 반환한다', async () => {
  const { accessToken } = await login('admin@freshmeal.test');

  const res = await fetch(`${baseUrl}/api/events/${otherEventId}/applications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.totalApplyCount, 0);
  assert.equal(body.participantCount, 0);
});

test('GET /api/events/:id/applications: 존재하지 않는 이벤트는 404를 반환한다', async () => {
  const { accessToken } = await login('admin@freshmeal.test');

  const res = await fetch(`${baseUrl}/api/events/999999999/applications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 404);
});

test('GET /api/events/:id/applications: 일반 user 권한으로 호출하면 403을 반환한다', async () => {
  const { accessToken } = await login('user-low@freshmeal.test');

  const res = await fetch(`${baseUrl}/api/events/${ongoingEventId}/applications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 403);
});
