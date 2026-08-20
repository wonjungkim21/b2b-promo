const pool = require('../db/pool');

async function findUserById(id) {
  const result = await pool.query(
    'SELECT id, name, role, point_balance FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
}

module.exports = { findUserById };
