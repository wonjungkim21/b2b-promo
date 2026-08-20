const pool = require('../db/pool');
const { EVENT_STATUS, POINTS_PER_APPLY } = require('../domain/constants');
const {
  EventNotOngoingError,
  InsufficientPointsError,
  InvalidApplyCountError,
  NotFoundError,
} = require('../domain/errors');
const queries = require('./applications.queries');
const eventsQueries = require('../events/events.queries');

const PG_UNIQUE_VIOLATION = '23505';

function buildApplyResponse(row) {
  return {
    eventId: row.event_id,
    pointBalance: Number(row.point_balance),
    totalCount: row.total_count,
    totalPointsUsed: Number(row.total_points_used),
    lastAppliedAt: row.last_applied_at,
  };
}

async function applyToEvent({ userId, eventId, count, idempotencyKey }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 5.8 멱등성: 동일 idempotencyKey로 이미 처리된 요청이면 재차감 없이 기존 결과 그대로 반환
    const existing = await queries.findPointTransactionByIdempotencyKey(client, idempotencyKey);
    if (existing) {
      await client.query('COMMIT');
      return buildApplyResponse(existing);
    }

    const event = await queries.findEventStatusById(client, eventId);
    if (!event) {
      throw new NotFoundError('Event', eventId);
    }
    // 5.1 이벤트 상태 재확인: 진행중이 아니면 차감 없이 거부
    if (event.status !== EVENT_STATUS.ONGOING) {
      throw new EventNotOngoingError(eventId);
    }

    // 5.9 동시 요청 처리: User row를 잠가 동일 유저의 요청을 직렬화한다
    const user = await queries.lockUserForUpdate(client, userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // 5.3 응모 횟수 유효성: 1 이상 정수가 아니면 거부
    if (!Number.isInteger(count) || count < 1) {
      throw new InvalidApplyCountError(count);
    }

    const amount = count * POINTS_PER_APPLY;

    // 5.2 포인트 부족: 불변식(pointBalance는 음수가 될 수 없음)을 차감 전 재확인으로 보장
    if (Number(user.point_balance) < amount) {
      throw new InsufficientPointsError(amount, Number(user.point_balance));
    }

    // 5.7 트랜잭션 원자성: 차감 + EventApplication 누적(5.4) + PointTransaction 생성(5.5)
    const updatedUser = await queries.deductUserPoints(client, userId, amount);
    const application = await queries.upsertEventApplication(client, { userId, eventId, count, amount });

    try {
      await queries.insertPointTransaction(client, {
        userId,
        eventId,
        eventApplicationId: application.id,
        amount,
        idempotencyKey,
      });
    } catch (err) {
      if (err.code === PG_UNIQUE_VIOLATION) {
        // 5.8/5.9 안전망: 동일 idempotencyKey로 동시 경합한 다른 요청이 먼저 커밋된 경우,
        // 이번 트랜잭션은 롤백하고 이미 커밋된 결과를 재조회해 그대로 반환한다(재차감 없음).
        await client.query('ROLLBACK');
        const replay = await queries.findPointTransactionByIdempotencyKey(client, idempotencyKey);
        return buildApplyResponse(replay);
      }
      throw err;
    }

    await client.query('COMMIT');

    return {
      eventId,
      pointBalance: Number(updatedUser.point_balance),
      totalCount: application.total_count,
      totalPointsUsed: Number(application.total_points_used),
      lastAppliedAt: application.last_applied_at,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function listMyApplications(userId) {
  const rows = await queries.findMyApplications(userId);
  return rows.map((row) => ({
    eventId: row.event_id,
    eventTitle: row.event_title,
    eventStatus: row.event_status,
    totalCount: row.total_count,
    totalPointsUsed: Number(row.total_points_used),
    lastAppliedAt: row.last_applied_at,
  }));
}

async function getApplicationSummary(eventId) {
  const event = await eventsQueries.findById(eventId);
  if (!event) {
    throw new NotFoundError('Event', eventId);
  }
  const summary = await queries.getApplicationSummary(eventId);
  return {
    eventId,
    totalApplyCount: Number(summary.total_apply_count),
    participantCount: Number(summary.participant_count),
  };
}

module.exports = { applyToEvent, listMyApplications, getApplicationSummary };
