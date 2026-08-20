'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../app');

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('Authorization 헤더 없이 GET /api/me 요청 시 401을 반환한다', async () => {
  const res = await fetch(`${baseUrl}/api/me`);
  assert.equal(res.status, 401);
});

test('로그인한 유저의 accessToken으로 GET /api/me 요청 시 200과 내 정보/포인트를 반환한다', async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'user-low@freshmeal.test', password: 'password123' }),
  });
  assert.equal(loginRes.status, 200);
  const { accessToken } = await loginRes.json();
  assert.equal(typeof accessToken, 'string');

  const meRes = await fetch(`${baseUrl}/api/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(meRes.status, 200);
  const body = await meRes.json();
  assert.equal(body.role, 'user');
  assert.equal(body.pointBalance, 800);
});
