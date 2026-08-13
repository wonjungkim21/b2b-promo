'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');
const SRC_ROOT = path.join(BACKEND_ROOT, 'src');

const VALID_ENV = {
  DB_CONN_STRING: 'postgresql://user:pass@localhost:5432/db',
  JWT_ACCESS_SECRET: 'access-secret-xyz',
  JWT_REFRESH_SECRET: 'refresh-secret-abc',
  PORT: '3000',
  CORS_ORIGIN: 'http://localhost:5173',
};

function runConfig(envOverride) {
  return spawnSync(
    process.execPath,
    ['-e', "require('./src/config/config'); process.exit(0);"],
    {
      cwd: BACKEND_ROOT,
      env: { ...process.env, ...VALID_ENV, ...envOverride },
    }
  );
}

// 1. config 필수 환경변수 검증 (잘못된/누락된 값 -> 비정상 종료)
test('config: 필수 환경변수가 누락/잘못되면 프로세스가 비정상 종료된다', async (t) => {
  const invalidCases = [
    ['DB_CONN_STRING 누락', { DB_CONN_STRING: '' }],
    ['JWT_ACCESS_SECRET 누락', { JWT_ACCESS_SECRET: '' }],
    ['JWT_REFRESH_SECRET 누락', { JWT_REFRESH_SECRET: '' }],
    ['PORT 누락', { PORT: '' }],
    ['CORS_ORIGIN 누락', { CORS_ORIGIN: '' }],
    ['PORT가 정수가 아님', { PORT: 'abc' }],
    ["CORS_ORIGIN이 '*'", { CORS_ORIGIN: '*' }],
  ];

  for (const [name, override] of invalidCases) {
    await t.test(name, () => {
      const result = runConfig(override);
      assert.notEqual(result.status, 0, `${name} 케이스는 비정상 종료(exit!=0)여야 한다`);
    });
  }
});

// 2. config 정상 로드
test('config: 모든 필수값이 올바르면 정상 종료(exit 0)한다', () => {
  const result = runConfig({});
  assert.equal(result.status, 0);
});

// 3. JWT 시크릿 동일 값 거부
test('config: JWT_ACCESS_SECRET과 JWT_REFRESH_SECRET이 같은 값이면 비정상 종료한다', () => {
  const result = runConfig({
    JWT_ACCESS_SECRET: 'same-secret',
    JWT_REFRESH_SECRET: 'same-secret',
  });
  assert.notEqual(result.status, 0);
});

// 4. 에러 미들웨어 단위 테스트
test('error.middleware: 도메인 에러/일반 에러를 올바른 status/message로 응답한다', () => {
  const errorMiddleware = require(path.join(SRC_ROOT, 'middlewares', 'error.middleware.js'));
  const {
    EventNotOngoingError,
    InsufficientPointsError,
    NotFoundError,
    UnauthorizedError,
  } = require(path.join(SRC_ROOT, 'domain', 'errors.js'));

  function mockRes() {
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        res.statusCode = code;
        return res;
      },
      json(payload) {
        res.body = payload;
        return res;
      },
    };
    return res;
  }

  const cases = [
    [new EventNotOngoingError('evt-1'), 409],
    [new InsufficientPointsError(1000, 500), 400],
    [new NotFoundError('User', 'u-1'), 404],
    [new UnauthorizedError(), 401],
  ];

  for (const [err, expectedStatus] of cases) {
    const res = mockRes();
    errorMiddleware(err, {}, res, () => {});
    assert.equal(res.statusCode, expectedStatus);
    assert.equal(res.body.message, err.message);
  }

  // 일반 Error -> 500
  const originalConsoleError = console.error;
  console.error = () => {}; // 스택 로그 억제
  try {
    const res = mockRes();
    errorMiddleware(new Error('알수없는 오류'), {}, res, () => {});
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, '서버 오류가 발생했습니다.');
  } finally {
    console.error = originalConsoleError;
  }
});

// 5. CORS 허용/거부
test('cors.middleware: 허용된 origin만 Access-Control-Allow-Origin을 응답한다', async (t) => {
  const express = require('express');
  const corsMiddleware = require(path.join(SRC_ROOT, 'middlewares', 'cors.middleware.js'));

  const testApp = express();
  testApp.use(corsMiddleware);
  testApp.get('/ping', (req, res) => res.json({ ok: true }));
  // eslint-disable-next-line no-unused-vars
  testApp.use((err, req, res, next) => {
    res.status(500).json({ message: 'cors rejected' });
  });

  const server = http.createServer(testApp);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  t.after(() => new Promise((resolve) => server.close(resolve)));

  const allowedRes = await fetch(`http://localhost:${port}/ping`, {
    headers: { Origin: 'http://localhost:5173' },
  });
  assert.equal(allowedRes.headers.get('access-control-allow-origin'), 'http://localhost:5173');

  const blockedRes = await fetch(`http://localhost:${port}/ping`, {
    headers: { Origin: 'http://evil.example.com' },
  });
  assert.equal(blockedRes.headers.get('access-control-allow-origin'), null);
});

// 6. 헬스체크 통합 테스트
test('app: GET /health가 200과 {status:"ok"}를 반환한다', async (t) => {
  const app = require(path.join(SRC_ROOT, 'app.js'));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  t.after(() => new Promise((resolve) => server.close(resolve)));

  const res = await fetch(`http://localhost:${port}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { status: 'ok' });
});

// 7. domain/constants 값 검증
test('constants: POINTS_PER_APPLY/EVENT_STATUS/EVENT_STATUS_TRANSITIONS가 명세대로다', () => {
  const { POINTS_PER_APPLY, EVENT_STATUS, EVENT_STATUS_TRANSITIONS } = require(
    path.join(SRC_ROOT, 'domain', 'constants.js')
  );

  assert.equal(POINTS_PER_APPLY, 1000);
  assert.equal(EVENT_STATUS.SCHEDULED, '예정');
  assert.equal(EVENT_STATUS.ONGOING, '진행중');
  assert.equal(EVENT_STATUS.ENDED, '종료');

  assert.deepEqual(EVENT_STATUS_TRANSITIONS[EVENT_STATUS.SCHEDULED], [EVENT_STATUS.ONGOING]);
  assert.deepEqual(EVENT_STATUS_TRANSITIONS[EVENT_STATUS.ONGOING], [EVENT_STATUS.ENDED]);
  assert.deepEqual(EVENT_STATUS_TRANSITIONS[EVENT_STATUS.ENDED], []);
});

// 8. 하드코딩 스캔 테스트
test('하드코딩 스캔: constants.js 외 어떤 .js 파일에도 숫자 1000이 등장하지 않는다', () => {
  const excludedFiles = [
    path.join(SRC_ROOT, 'domain', 'constants.js'),
  ];
  const excludedDirs = [path.join(SRC_ROOT, 'tests')];

  function collectJsFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (excludedDirs.some((excluded) => fullPath.startsWith(excluded))) continue;
      if (entry.isDirectory()) {
        files = files.concat(collectJsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const jsFiles = collectJsFiles(SRC_ROOT).filter((f) => !excludedFiles.includes(f));
  assert.ok(jsFiles.length > 0, '검사 대상 파일이 없습니다');

  const offenders = [];
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (/\b1000\b/.test(content)) {
      offenders.push(file);
    }
  }

  assert.deepEqual(offenders, [], `1000 하드코딩이 발견된 파일: ${offenders.join(', ')}`);
});
