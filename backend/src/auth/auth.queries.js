const pool = require('../db/pool');

async function findUserByLoginId(loginId) {
  const result = await pool.query(
    'SELECT id, name, login_id, password_hash, role FROM users WHERE login_id = $1',
    [loginId],
  );
  return result.rows[0] || null;
}

async function insertUser({ name, loginId, passwordHash, role }) {
  const result = await pool.query(
    'INSERT INTO users(name, login_id, password_hash, role) VALUES($1, $2, $3, $4) RETURNING id, name, login_id, role',
    [name, loginId, passwordHash, role],
  );
  return result.rows[0];
}

async function insertRefreshToken({ userId, tokenHash, expiresAt }) {
  await pool.query(
    'INSERT INTO refresh_tokens(user_id, token_hash, expires_at) VALUES($1, $2, $3)',
    [userId, tokenHash, expiresAt],
  );
}

async function findRefreshTokenWithUser(tokenHash) {
  const result = await pool.query(
    `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1`,
    [tokenHash],
  );
  return result.rows[0] || null;
}

async function revokeRefreshTokenByHash(tokenHash) {
  const result = await pool.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL RETURNING id',
    [tokenHash],
  );
  return result;
}

module.exports = {
  findUserByLoginId,
  insertUser,
  insertRefreshToken,
  findRefreshTokenWithUser,
  revokeRefreshTokenByHash,
};
