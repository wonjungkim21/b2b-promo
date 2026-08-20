'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const pool = require('../db/pool');
const { applyToEvent } = require('../applications/applications.service');

// seed.sql 고정 이벤트 (읽기 전용으로만 사용, status 변경 없음)
const EVENT_ONGOING = 1; // 여름 특가 이벤트, 진행중
const EVENT_SCHEDULED = 3; // 가을 신메뉴 이벤트, 예정

let testUserId;

function uuid() {
  return crypto.randomUUID();
}

async function setBalance(amount) {
  await pool.query('UPDATE users SET point_balance = $1 WHERE id = $2', [amount, testUserId]);
}

async function getBalance() {
  const { rows } = await pool.query('SELECT point_balance FROM users WHERE id = $1', [testUserId]);
  return Number(rows[0].point_balance);
}

async function resetApplication(eventId) {
  await pool.query('DELETE FROM point_transactions WHERE user_id = $1 AND event_id = $2', [testUserId, eventId]);
  await pool.query('DELETE FROM event_applications WHERE user_id = $1 AND event_id = $2', [testUserId, eventId]);
}

test.before(async () => {
  const { rows } = await pool.query(
    `INSERT INTO users (name, login_id, password_hash, role, point_balance)
     VALUES ('BE-8 테스트 유저', $1, 'unused', 'user', 0)
     RETURNING id`,
    [`test-be8-${crypto.randomUUID()}@example.com`]
  );
  testUserId = rows[0].id;
});

test.after(async () => {
  await pool.query('DELETE FROM point_transactions WHERE user_id = $1', [testUserId]);
  await pool.query('DELETE FROM event_applications WHERE user_id = $1', [testUserId]);
  await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  await pool.end();
});

test('정상 응모 + 누적 갱신(5.4/5.7)', async () => {
  await setBalance(5000);
  await resetApplication(EVENT_ONGOING);

  const first = await applyToEvent({ userId: testUserId, eventId: EVENT_ONGOING, count: 2, idempotencyKey: uuid() });
  assert.equal(first.pointBalance, 3000);
  assert.equal(first.totalCount, 2);

  const second = await applyToEvent({ userId: testUserId, eventId: EVENT_ONGOING, count: 1, idempotencyKey: uuid() });
  assert.equal(second.pointBalance, 2000);
  assert.equal(second.totalCount, 3);
  assert.equal(second.totalPointsUsed, 3000);
});

test('포인트 부족 거부(5.2): 잔액 불변', async () => {
  await setBalance(500);
  await resetApplication(EVENT_ONGOING);

  await assert.rejects(
    applyToEvent({ userId: testUserId, eventId: EVENT_ONGOING, count: 1, idempotencyKey: uuid() }),
    (err) => err.status === 400
  );
  assert.equal(await getBalance(), 500);
});

test('진행중이 아닌 이벤트 거부(5.1)', async () => {
  await setBalance(5000);
  await resetApplication(EVENT_SCHEDULED);

  await assert.rejects(
    applyToEvent({ userId: testUserId, eventId: EVENT_SCHEDULED, count: 1, idempotencyKey: uuid() }),
    (err) => err.status === 409
  );
  assert.equal(await getBalance(), 5000);
});

test('잘못된 응모 횟수 거부(5.3): 0/음수/소수', async () => {
  await setBalance(5000);
  await resetApplication(EVENT_ONGOING);

  for (const invalidCount of [0, -1, 1.5]) {
    await assert.rejects(
      applyToEvent({ userId: testUserId, eventId: EVENT_ONGOING, count: invalidCount, idempotencyKey: uuid() }),
      (err) => err.status === 400
    );
  }
  assert.equal(await getBalance(), 5000);
});

test('멱등성(5.8): 동일 idempotencyKey 재요청 시 재차감 없음', async () => {
  await setBalance(5000);
  await resetApplication(EVENT_ONGOING);

  const idempotencyKey = uuid();
  const first = await applyToEvent({ userId: testUserId, eventId: EVENT_ONGOING, count: 2, idempotencyKey });
  const second = await applyToEvent({ userId: testUserId, eventId: EVENT_ONGOING, count: 2, idempotencyKey });

  assert.equal(second.pointBalance, first.pointBalance);
  assert.equal(second.totalCount, first.totalCount);
  assert.equal(first.pointBalance, 3000);

  const { rows: txRows } = await pool.query(
    'SELECT id FROM point_transactions WHERE idempotency_key = $1',
    [idempotencyKey]
  );
  assert.equal(txRows.length, 1);
});

test('동시 요청 직렬화(5.9): 동일 User-Event 병렬 응모는 잔액을 음수로 만들지 않는다', async () => {
  await setBalance(3000);
  await resetApplication(EVENT_ONGOING);

  const results = await Promise.allSettled([
    applyToEvent({ userId: testUserId, eventId: EVENT_ONGOING, count: 2, idempotencyKey: uuid() }),
    applyToEvent({ userId: testUserId, eventId: EVENT_ONGOING, count: 2, idempotencyKey: uuid() }),
  ]);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');
  assert.equal(fulfilled.length, 1, '정확히 하나만 성공해야 한다');
  assert.equal(rejected.length, 1, '정확히 하나는 포인트 부족으로 거부되어야 한다');
  assert.equal(rejected[0].reason.status, 400);

  const finalBalance = await getBalance();
  assert.equal(finalBalance, 1000, '성공한 요청(count=2, 2000포인트)만큼만 차감되어야 한다');
  assert.ok(finalBalance >= 0);
});
