'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const express = require('express');

const { authMiddleware, requireAdmin } = require('../middlewares/auth.middleware');
const errorMiddleware = require('../middlewares/error.middleware');
const { jwtAccessSecret } = require('../config/config');

const testApp = express();
testApp.get('/protected', authMiddleware, (req, res) => res.status(200).json({ user: req.user }));
testApp.get('/admin-only', authMiddleware, requireAdmin, (req, res) => res.status(200).json({ ok: true }));
testApp.use(errorMiddleware);

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(testApp);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('Authorization 헤더가 없으면 401을 반환한다', async () => {
  const res = await fetch(`${baseUrl}/protected`);
  assert.equal(res.status, 401);
});

test('Bearer 스킴이지만 토큰이 없으면 401을 반환한다', async () => {
  const res = await fetch(`${baseUrl}/protected`, {
    headers: { Authorization: 'Bearer' },
  });
  assert.equal(res.status, 401);
});

test('Bearer가 아닌 스킴이면 401을 반환한다', async () => {
  const res = await fetch(`${baseUrl}/protected`, {
    headers: { Authorization: 'Basic xxx' },
  });
  assert.equal(res.status, 401);
});

test('만료된 토큰이면 401을 반환한다', async () => {
  const expiredToken = jwt.sign({ sub: 1, role: 'user' }, jwtAccessSecret, { expiresIn: '-1s' });
  const res = await fetch(`${baseUrl}/protected`, {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert.equal(res.status, 401);
});

test('다른 시크릿으로 서명된 위조 토큰이면 401을 반환한다', async () => {
  const forgedToken = jwt.sign({ sub: 1, role: 'user' }, 'wrong-secret', { expiresIn: '1h' });
  const res = await fetch(`${baseUrl}/protected`, {
    headers: { Authorization: `Bearer ${forgedToken}` },
  });
  assert.equal(res.status, 401);
});

test('유효한 토큰이면 200과 함께 req.user가 주입된다', async () => {
  const token = jwt.sign({ sub: 42, role: 'user' }, jwtAccessSecret, { expiresIn: '1h' });
  const res = await fetch(`${baseUrl}/protected`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.id, 42);
  assert.equal(body.user.role, 'user');
});

test('일반 사용자 토큰으로 admin-only 접근 시 403을 반환한다', async () => {
  const token = jwt.sign({ sub: 42, role: 'user' }, jwtAccessSecret, { expiresIn: '1h' });
  const res = await fetch(`${baseUrl}/admin-only`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 403);
});

test('admin 토큰으로 admin-only 접근 시 200을 반환한다', async () => {
  const token = jwt.sign({ sub: 1, role: 'admin' }, jwtAccessSecret, { expiresIn: '1h' });
  const res = await fetch(`${baseUrl}/admin-only`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});
