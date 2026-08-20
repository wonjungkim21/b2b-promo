'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const pool = require('../db/pool');
const authService = require('../auth/auth.service');
const { UnauthorizedError, DuplicateLoginIdError } = require('../domain/errors');

function uniqueLoginId() {
  return `test-be2-${crypto.randomBytes(6).toString('hex')}@example.com`;
}

const createdLoginIds = [];

test.after(async () => {
  if (createdLoginIds.length > 0) {
    await pool.query(
      `DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE login_id = ANY($1))`,
      [createdLoginIds]
    );
    await pool.query(`DELETE FROM users WHERE login_id = ANY($1)`, [createdLoginIds]);
  }
  await pool.end();
});

test('signup: 성공 시 role=user로 생성되고 비밀번호는 bcrypt 해시로 저장된다', async () => {
  const loginId = uniqueLoginId();
  createdLoginIds.push(loginId);
  const password = 'password123';

  const result = await authService.signup({ name: '테스트유저', loginId, password });

  assert.equal(result.role, 'user');
  assert.equal(result.loginId, loginId);
  assert.equal(result.name, '테스트유저');
  assert.ok(result.id);

  const { rows } = await pool.query('SELECT password_hash FROM users WHERE login_id = $1', [loginId]);
  assert.equal(rows.length, 1);
  assert.notEqual(rows[0].password_hash, password);
  assert.ok(rows[0].password_hash.startsWith('$2'));
});

test('signup: 동일 loginId 재가입은 DuplicateLoginIdError를 던지고 row가 늘어나지 않는다', async () => {
  const loginId = uniqueLoginId();
  createdLoginIds.push(loginId);
  const password = 'password123';

  await authService.signup({ name: '유저1', loginId, password });

  await assert.rejects(
    authService.signup({ name: '유저2', loginId, password }),
    DuplicateLoginIdError
  );

  const { rows } = await pool.query('SELECT id FROM users WHERE login_id = $1', [loginId]);
  assert.equal(rows.length, 1);
});

test('login: 올바른 자격증명이면 accessToken/refreshToken/user.role을 반환한다', async () => {
  const loginId = uniqueLoginId();
  createdLoginIds.push(loginId);
  const password = 'password123';
  await authService.signup({ name: '로그인유저', loginId, password });

  const result = await authService.login({ loginId, password });

  assert.equal(typeof result.accessToken, 'string');
  assert.equal(typeof result.refreshToken, 'string');
  assert.equal(result.user.role, 'user');
});

test('login: 비밀번호가 틀리면 UnauthorizedError를 던진다', async () => {
  const loginId = uniqueLoginId();
  createdLoginIds.push(loginId);
  await authService.signup({ name: '틀린비번유저', loginId, password: 'password123' });

  await assert.rejects(
    authService.login({ loginId, password: 'wrong-password' }),
    UnauthorizedError
  );
});

test('login: 존재하지 않는 loginId면 UnauthorizedError를 던진다', async () => {
  await assert.rejects(
    authService.login({ loginId: uniqueLoginId(), password: 'password123' }),
    UnauthorizedError
  );
});

test('refresh: 유효한 refreshToken이면 새 accessToken(string)을 반환한다', async () => {
  const loginId = uniqueLoginId();
  createdLoginIds.push(loginId);
  const password = 'password123';
  await authService.signup({ name: '리프레시유저', loginId, password });
  const { refreshToken } = await authService.login({ loginId, password });

  const result = await authService.refresh({ refreshToken });

  assert.equal(typeof result.accessToken, 'string');
});

test('logout 이후 동일 refreshToken으로 refresh 재시도하면 UnauthorizedError를 던진다', async () => {
  const loginId = uniqueLoginId();
  createdLoginIds.push(loginId);
  const password = 'password123';
  await authService.signup({ name: '로그아웃유저', loginId, password });
  const { refreshToken } = await authService.login({ loginId, password });

  await authService.logout({ refreshToken });

  await assert.rejects(authService.refresh({ refreshToken }), UnauthorizedError);
});

test('이미 logout된 refreshToken으로 다시 logout하면 UnauthorizedError를 던진다', async () => {
  const loginId = uniqueLoginId();
  createdLoginIds.push(loginId);
  const password = 'password123';
  await authService.signup({ name: '중복로그아웃유저', loginId, password });
  const { refreshToken } = await authService.login({ loginId, password });

  await authService.logout({ refreshToken });

  await assert.rejects(authService.logout({ refreshToken }), UnauthorizedError);
});
