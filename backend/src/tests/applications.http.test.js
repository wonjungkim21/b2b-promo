'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');

const app = require('../app');
const pool = require('../db/pool');

// seed.sql 고정 데이터 (docs/10-schema.sql / backend/seed.sql 기준)
const USER_LOW_ID = '2'; // user-low@freshmeal.test, 원래 point_balance=800
const USER_MID_ID = '3'; // user-mid@freshmeal.test, 원래 point_balance=2000
const USER_HIGH_ID = '4'; // user-high@freshmeal.test, 원래 point_balance=5500

const ORIGINAL_BALANCE = {
  [USER_LOW_ID]: 800,
  [USER_MID_ID]: 2000,
  [USER_HIGH_ID]: 5500,
};

const EVENT_ONGOING_1 = 1; // 여름 특가 이벤트, 진행중
const EVENT_ONGOING_2 = 2; // 재구매 포인트 2배, 진행중
const EVENT_SCHEDULED = 3; // 가을 신메뉴 이벤트, 예정
const EVENT_ENDED = 4; // 봄맞이 이벤트, 종료

let server;
let baseUrl;
let tokenLow;
let tokenMid;
let tokenHigh;

const touchedUserEventPairs = new Set();

function uuid() {
  return crypto.randomUUID();
}

async function login(loginId) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password: 'password123' }),
  });
  assert.equal(res.status, 200, `로그인 실패: ${loginId}`);
  const { accessToken } = await res.json();
  return accessToken;
}

async function setBalance(userId, amount) {
  await pool.query('UPDATE users SET point_balance = $1 WHERE id = $2', [amount, userId]);
}

async function getBalance(userId) {
  const { rows } = await pool.query('SELECT point_balance FROM users WHERE id = $1', [userId]);
  return Number(rows[0].point_balance);
}

async function resetApplication(userId, eventId) {
  touchedUserEventPairs.add(`${userId}:${eventId}`);
  await pool.query(
    'DELETE FROM point_transactions WHERE user_id = $1 AND event_id = $2',
    [userId, eventId]
  );
  await pool.query(
    'DELETE FROM event_applications WHERE user_id = $1 AND event_id = $2',
    [userId, eventId]
  );
}

async function apply(token, eventId, count, idempotencyKey) {
  return fetch(`${baseUrl}/api/events/${eventId}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ count, idempotencyKey }),
  });
}

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;

  tokenLow = await login('user-low@freshmeal.test');
  tokenMid = await login('user-mid@freshmeal.test');
  tokenHigh = await login('user-high@freshmeal.test');
});

test.after(async () => {
  for (const pair of touchedUserEventPairs) {
    const [userId, eventId] = pair.split(':');
    await pool.query(
      'DELETE FROM point_transactions WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );
    await pool.query(
      'DELETE FROM event_applications WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );
  }
  await setBalance(USER_LOW_ID, ORIGINAL_BALANCE[USER_LOW_ID]);
  await setBalance(USER_MID_ID, ORIGINAL_BALANCE[USER_MID_ID]);
  await setBalance(USER_HIGH_ID, ORIGINAL_BALANCE[USER_HIGH_ID]);

  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('정상 응모(5.7): 잔액이 충분하면 200과 함께 pointBalance/totalCount/totalPointsUsed가 갱신된다', async () => {
  await setBalance(USER_MID_ID, 5000);
  await resetApplication(USER_MID_ID, EVENT_ONGOING_1);

  const res = await apply(tokenMid, EVENT_ONGOING_1, 2, uuid());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.eventId, EVENT_ONGOING_1);
  assert.equal(body.pointBalance, 3000);
  assert.equal(body.totalCount, 2);
  assert.equal(body.totalPointsUsed, 2000);
  assert.ok(body.lastAppliedAt);

  assert.equal(await getBalance(USER_MID_ID), 3000);
  const { rows: appRows } = await pool.query(
    'SELECT total_count, total_points_used FROM event_applications WHERE user_id = $1 AND event_id = $2',
    [USER_MID_ID, EVENT_ONGOING_1]
  );
  assert.equal(appRows.length, 1);
  assert.equal(Number(appRows[0].total_count), 2);
  assert.equal(Number(appRows[0].total_points_used), 2000);
  const { rows: txRows } = await pool.query(
    'SELECT amount FROM point_transactions WHERE user_id = $1 AND event_id = $2',
    [USER_MID_ID, EVENT_ONGOING_1]
  );
  assert.equal(txRows.length, 1);
  assert.equal(Number(txRows[0].amount), 2000);
});

test('재응모 누적(5.4): 같은 유저/이벤트에 다시 응모하면 기존 row가 누적 갱신된다', async () => {
  // 이전 테스트에서 이어짐: USER_MID_ID, EVENT_ONGOING_1 pointBalance=3000, totalCount=2
  const res = await apply(tokenMid, EVENT_ONGOING_1, 1, uuid());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.pointBalance, 2000);
  assert.equal(body.totalCount, 3);
  assert.equal(body.totalPointsUsed, 3000);

  assert.equal(await getBalance(USER_MID_ID), 2000);
  const { rows: appRows } = await pool.query(
    'SELECT total_count, total_points_used FROM event_applications WHERE user_id = $1 AND event_id = $2',
    [USER_MID_ID, EVENT_ONGOING_1]
  );
  assert.equal(appRows.length, 1, '새 row가 생기지 않고 기존 row 1개만 존재해야 한다');
  assert.equal(Number(appRows[0].total_count), 3);
  assert.equal(Number(appRows[0].total_points_used), 3000);
});

test('포인트 부족(5.2): 잔액이 필요 포인트보다 적으면 400을 반환하고 잔액이 변하지 않는다', async () => {
  await setBalance(USER_LOW_ID, 500);
  await resetApplication(USER_LOW_ID, EVENT_ONGOING_2);

  const res = await apply(tokenLow, EVENT_ONGOING_2, 1, uuid());
  assert.equal(res.status, 400);

  assert.equal(await getBalance(USER_LOW_ID), 500);
});

test('비진행중 이벤트 거부(5.1): 예정 상태 이벤트에 응모하면 409를 반환하고 잔액이 변하지 않는다', async () => {
  await setBalance(USER_HIGH_ID, 5000);
  await resetApplication(USER_HIGH_ID, EVENT_SCHEDULED);

  const res = await apply(tokenHigh, EVENT_SCHEDULED, 1, uuid());
  assert.equal(res.status, 409);
  assert.equal(await getBalance(USER_HIGH_ID), 5000);
});

test('비진행중 이벤트 거부(5.1): 종료 상태 이벤트에 응모하면 409를 반환하고 잔액이 변하지 않는다', async () => {
  await setBalance(USER_HIGH_ID, 5000);
  await resetApplication(USER_HIGH_ID, EVENT_ENDED);

  const res = await apply(tokenHigh, EVENT_ENDED, 1, uuid());
  assert.equal(res.status, 409);
  assert.equal(await getBalance(USER_HIGH_ID), 5000);
});

test('잘못된 count(5.3): 1 이상의 정수가 아니면 400을 반환한다', async () => {
  await setBalance(USER_HIGH_ID, 5000);
  await resetApplication(USER_HIGH_ID, EVENT_ONGOING_1);

  for (const invalidCount of [0, -1, 1.5, 'two']) {
    const res = await apply(tokenHigh, EVENT_ONGOING_1, invalidCount, uuid());
    assert.equal(res.status, 400, `count=${JSON.stringify(invalidCount)}는 400이어야 한다`);
  }
  assert.equal(await getBalance(USER_HIGH_ID), 5000, '유효성 검증 실패 시 잔액이 차감되면 안 된다');
});

test('멱등성(5.8): 동일 idempotencyKey로 재요청하면 재차감 없이 동일한 결과를 반환한다', async () => {
  await setBalance(USER_HIGH_ID, 5000);
  await resetApplication(USER_HIGH_ID, EVENT_ONGOING_2);

  const idempotencyKey = uuid();
  const res1 = await apply(tokenHigh, EVENT_ONGOING_2, 2, idempotencyKey);
  assert.equal(res1.status, 200);
  const body1 = await res1.json();

  const res2 = await apply(tokenHigh, EVENT_ONGOING_2, 2, idempotencyKey);
  assert.equal(res2.status, 200);
  const body2 = await res2.json();

  assert.equal(body2.pointBalance, body1.pointBalance);
  assert.equal(body2.totalCount, body1.totalCount);
  assert.equal(body2.totalPointsUsed, body1.totalPointsUsed);
  assert.equal(body1.pointBalance, 3000);

  assert.equal(await getBalance(USER_HIGH_ID), 3000);
  const { rows: txRows } = await pool.query(
    'SELECT id FROM point_transactions WHERE idempotency_key = $1',
    [idempotencyKey]
  );
  assert.equal(txRows.length, 1, '동일 idempotencyKey row는 1건만 존재해야 한다');
});

test('필수값 누락: count가 없으면 400을 반환한다', async () => {
  const res = await fetch(`${baseUrl}/api/events/${EVENT_ONGOING_1}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenMid}` },
    body: JSON.stringify({ idempotencyKey: uuid() }),
  });
  assert.equal(res.status, 400);
});

test('필수값 누락: idempotencyKey가 없으면 400을 반환한다', async () => {
  const res = await fetch(`${baseUrl}/api/events/${EVENT_ONGOING_1}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenMid}` },
    body: JSON.stringify({ count: 1 }),
  });
  assert.equal(res.status, 400);
});

test('존재하지 않는 이벤트: 404를 반환한다', async () => {
  const res = await apply(tokenMid, 999999999, 1, uuid());
  assert.equal(res.status, 404);
});
