const pool = require('../db/pool');

async function findOngoingOrScheduled(ongoingStatus, scheduledStatus) {
  const result = await pool.query(
    `SELECT id, title, image_url, start_at, end_at, prize_description, status
     FROM events WHERE status IN ($1, $2) ORDER BY start_at ASC`,
    [ongoingStatus, scheduledStatus],
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query(
    `SELECT id, title, image_url, start_at, end_at, prize_description, status
     FROM events WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

async function findAll() {
  const result = await pool.query(
    `SELECT id, title, image_url, start_at, end_at, prize_description, status
     FROM events ORDER BY start_at ASC`,
  );
  return result.rows;
}

async function insert({ title, imageUrl, startAt, endAt, prizeDescription, status }) {
  const result = await pool.query(
    `INSERT INTO events(title, image_url, start_at, end_at, prize_description, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, image_url, start_at, end_at, prize_description, status`,
    [title, imageUrl ?? null, startAt, endAt, prizeDescription ?? null, status],
  );
  return result.rows[0];
}

async function update(id, { title, imageUrl, startAt, endAt, prizeDescription }) {
  const result = await pool.query(
    `UPDATE events SET title = $1, image_url = $2, start_at = $3, end_at = $4, prize_description = $5
     WHERE id = $6
     RETURNING id, title, image_url, start_at, end_at, prize_description, status`,
    [title, imageUrl ?? null, startAt, endAt, prizeDescription ?? null, id],
  );
  return result.rows[0] || null;
}

async function updateStatus(id, status) {
  const result = await pool.query(
    `UPDATE events SET status = $1 WHERE id = $2
     RETURNING id, title, image_url, start_at, end_at, prize_description, status`,
    [status, id],
  );
  return result.rows[0] || null;
}

module.exports = { findOngoingOrScheduled, findById, findAll, insert, update, updateStatus };
