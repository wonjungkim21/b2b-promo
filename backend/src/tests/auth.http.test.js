'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');

const app = require('../app');
const pool = require('../db/pool');

function uniqueLoginId() {
  return `test-be2-http-${crypto.randomBytes(6).toString('hex')}@example.com`;
}

let server;
let baseUrl;
const createdLoginIds = [];

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (createdLoginIds.length > 0) {
    await pool.query(
      `DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE login_id = ANY($1))`,
      [createdLoginIds]
    );
    await pool.query(`DELETE FROM users WHERE login_id = ANY($1)`, [createdLoginIds]);
  }
  await pool.end();
});

test('인증 API 전체 흐름: signup -> login -> refresh -> logout -> refresh 재시도(401)', async () => {
  const loginId = uniqueLoginId();
  createdLoginIds.push(loginId);
  const password = 'password123';

  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'HTTP테스트유저', loginId, password }),
  });
  assert.equal(signupRes.status, 201);

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  });
  assert.equal(loginRes.status, 200);
  const loginBody = await loginRes.json();
  assert.equal(typeof loginBody.accessToken, 'string');
  assert.equal(typeof loginBody.refreshToken, 'string');
  const { refreshToken } = loginBody;

  const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert.equal(refreshRes.status, 200);
  const refreshBody = await refreshRes.json();
  assert.equal(typeof refreshBody.accessToken, 'string');

  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert.equal(logoutRes.status, 204);
  const logoutBodyText = await logoutRes.text();
  assert.equal(logoutBodyText, '');

  const retryRefreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert.equal(retryRefreshRes.status, 401);
});

test('signup: 신규 가입자는 pointBalance 초기값 5000을 지급받는다', async () => {
  const loginId = uniqueLoginId();
  createdLoginIds.push(loginId);
  const password = 'password123';

  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '포인트초기값테스트', loginId, password }),
  });
  assert.equal(signupRes.status, 201);

  const { rows } = await pool.query('SELECT point_balance FROM users WHERE login_id = $1', [loginId]);
  assert.equal(Number(rows[0].point_balance), 5000);
});

test('signup: 필수값(password) 누락 시 400을 반환한다', async () => {
  const loginId = uniqueLoginId();

  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '누락테스트', loginId }),
  });
  assert.equal(res.status, 400);

  const { rows } = await pool.query('SELECT id FROM users WHERE login_id = $1', [loginId]);
  assert.equal(rows.length, 0);
});
