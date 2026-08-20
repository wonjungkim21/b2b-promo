const pool = require('../db/pool');

async function findPointTransactionByIdempotencyKey(client, idempotencyKey) {
  const result = await client.query(
    `SELECT pt.event_id, pt.event_application_id, u.point_balance,
            ea.total_count, ea.total_points_used, ea.last_applied_at
     FROM point_transactions pt
     JOIN event_applications ea ON ea.id = pt.event_application_id
     JOIN users u ON u.id = pt.user_id
     WHERE pt.idempotency_key = $1`,
    [idempotencyKey],
  );
  return result.rows[0] || null;
}

async function findEventStatusById(client, eventId) {
  const result = await client.query('SELECT id, status FROM events WHERE id = $1', [eventId]);
  return result.rows[0] || null;
}

async function lockUserForUpdate(client, userId) {
  const result = await client.query(
    'SELECT id, point_balance FROM users WHERE id = $1 FOR UPDATE',
    [userId],
  );
  return result.rows[0] || null;
}

async function deductUserPoints(client, userId, amount) {
  const result = await client.query(
    'UPDATE users SET point_balance = point_balance - $2 WHERE id = $1 RETURNING point_balance',
    [userId, amount],
  );
  return result.rows[0];
}

async function upsertEventApplication(client, { userId, eventId, count, amount }) {
  const result = await client.query(
    `INSERT INTO event_applications(user_id, event_id, total_count, total_points_used, last_applied_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (user_id, event_id) DO UPDATE
       SET total_count = event_applications.total_count + $3,
           total_points_used = event_applications.total_points_used + $4,
           last_applied_at = now()
     RETURNING id, total_count, total_points_used, last_applied_at`,
    [userId, eventId, count, amount],
  );
  return result.rows[0];
}

async function insertPointTransaction(client, { userId, eventId, eventApplicationId, amount, idempotencyKey }) {
  const result = await client.query(
    `INSERT INTO point_transactions(user_id, event_id, event_application_id, amount, type, idempotency_key)
     VALUES ($1, $2, $3, $4, 'EVENT_APPLY', $5)
     RETURNING id`,
    [userId, eventId, eventApplicationId, amount, idempotencyKey],
  );
  return result.rows[0];
}

async function findMyApplications(userId) {
  const result = await pool.query(
    `SELECT ea.event_id, e.title AS event_title, e.status AS event_status,
            ea.total_count, ea.total_points_used, ea.last_applied_at
     FROM event_applications ea
     JOIN events e ON e.id = ea.event_id
     WHERE ea.user_id = $1
     ORDER BY ea.last_applied_at DESC`,
    [userId],
  );
  return result.rows;
}

async function getApplicationSummary(eventId) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(total_count), 0) AS total_apply_count, COUNT(*) AS participant_count
     FROM event_applications WHERE event_id = $1`,
    [eventId],
  );
  return result.rows[0];
}

module.exports = {
  findPointTransactionByIdempotencyKey,
  findEventStatusById,
  lockUserForUpdate,
  deductUserPoints,
  upsertEventApplication,
  insertPointTransaction,
  findMyApplications,
  getApplicationSummary,
};
