'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../app');
const pool = require('../db/pool');

let server;
let baseUrl;
let accessToken;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'user-low@freshmeal.test', password: 'password123' }),
  });
  assert.equal(loginRes.status, 200);
  ({ accessToken } = await loginRes.json());
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('Authorization 헤더 없이 GET /api/events 요청 시 401을 반환한다', async () => {
  const res = await fetch(`${baseUrl}/api/events`);
  assert.equal(res.status, 401);
});

test('GET /api/events: 종료된 이벤트는 제외하고 진행중/예정 이벤트는 모두 포함한다', async () => {
  const { rows } = await pool.query('SELECT id, status FROM events');
  const expectedIds = rows.filter((r) => r.status !== '종료').map((r) => r.id);

  const res = await fetch(`${baseUrl}/api/events`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));

  assert.equal(body.some((e) => e.status === '종료'), false);

  const resIds = body.map((e) => e.id);
  for (const id of expectedIds) {
    assert.ok(resIds.includes(id), `expected event id ${id} to be included`);
  }

  for (const event of body) {
    assert.ok('id' in event);
    assert.ok('title' in event);
    assert.ok('imageUrl' in event);
    assert.ok('startAt' in event);
    assert.ok('endAt' in event);
    assert.ok('prizeDescription' in event);
    assert.ok('status' in event);
  }
});

test('GET /api/events/:id: 이미지/경품설명이 없는 이벤트도 null 필드로 정상 응답한다', async () => {
  const { rows } = await pool.query(
    "SELECT id FROM events WHERE status != '종료' AND (image_url IS NULL OR prize_description IS NULL) LIMIT 1"
  );

  let targetId;
  if (rows.length > 0) {
    targetId = rows[0].id;
  } else {
    const fallback = await pool.query("SELECT id FROM events WHERE status != '종료' LIMIT 1");
    targetId = fallback.rows[0].id;
  }

  const res = await fetch(`${baseUrl}/api/events/${targetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.id, targetId);
  assert.ok('imageUrl' in body);
  assert.ok('prizeDescription' in body);
});

test('GET /api/events/:id: 존재하지 않는 id로 요청 시 404를 반환한다', async () => {
  const res = await fetch(`${baseUrl}/api/events/999999999`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 404);
});
