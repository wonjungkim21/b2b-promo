const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { UnauthorizedError, DuplicateLoginIdError } = require('../domain/errors');
const queries = require('./auth.queries');

const BCRYPT_SALT_ROUNDS = 10;
const PG_UNIQUE_VIOLATION = '23505';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function signup({ name, loginId, password }) {
  const existing = await queries.findUserByLoginId(loginId);
  if (existing) {
    throw new DuplicateLoginIdError(loginId);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  let user;
  try {
    user = await queries.insertUser({ name, loginId, passwordHash, role: 'user' });
  } catch (err) {
    if (err.code === PG_UNIQUE_VIOLATION) {
      throw new DuplicateLoginIdError(loginId);
    }
    throw err;
  }

  return { id: user.id, name: user.name, loginId: user.login_id, role: user.role };
}

async function login({ loginId, password }) {
  const user = await queries.findUserByLoginId(loginId);
  const invalidCredentialsMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
  if (!user) {
    throw new UnauthorizedError(invalidCredentialsMessage);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new UnauthorizedError(invalidCredentialsMessage);
  }

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn,
  });
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + config.jwtRefreshExpiresInMs);

  await queries.insertRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, role: user.role },
  };
}

async function refresh({ refreshToken }) {
  const row = await queries.findRefreshTokenWithUser(hashToken(refreshToken));
  const invalidTokenMessage = '유효하지 않은 refresh token입니다.';
  if (!row || row.revoked_at || row.expires_at < new Date()) {
    throw new UnauthorizedError(invalidTokenMessage);
  }

  const accessToken = jwt.sign({ sub: row.user_id, role: row.role }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn,
  });

  return { accessToken };
}

async function logout({ refreshToken }) {
  const result = await queries.revokeRefreshTokenByHash(hashToken(refreshToken));
  if (result.rowCount === 0) {
    throw new UnauthorizedError('유효하지 않은 refresh token입니다.');
  }
}

module.exports = { signup, login, refresh, logout };
