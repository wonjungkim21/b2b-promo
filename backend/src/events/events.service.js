const { NotFoundError, ValidationError, InvalidStatusTransitionError } = require('../domain/errors');
const { EVENT_STATUS, EVENT_STATUS_TRANSITIONS } = require('../domain/constants');
const eventsQueries = require('./events.queries');

function toEventDto(row) {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    startAt: row.start_at,
    endAt: row.end_at,
    prizeDescription: row.prize_description,
    status: row.status,
  };
}

async function listUserEvents() {
  const rows = await eventsQueries.findOngoingOrScheduled(EVENT_STATUS.ONGOING, EVENT_STATUS.SCHEDULED);
  return rows.map(toEventDto);
}

async function getEventDetail(id) {
  const row = await eventsQueries.findById(id);
  if (!row) {
    throw new NotFoundError('Event', id);
  }
  return toEventDto(row);
}

function assertValidTitleAndPeriod({ title, startAt, endAt }) {
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError('제목은 필수입니다.');
  }
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ValidationError('시작일시/종료일시는 유효한 날짜여야 합니다.');
  }
  if (end <= start) {
    throw new ValidationError('종료일시는 시작일시보다 이후여야 합니다.');
  }
}

async function listAdminEvents() {
  const rows = await eventsQueries.findAll();
  return rows.map(toEventDto);
}

async function createEvent({ title, imageUrl, startAt, endAt, prizeDescription, status }) {
  assertValidTitleAndPeriod({ title, startAt, endAt });
  if (!status || !Object.values(EVENT_STATUS).includes(status)) {
    throw new ValidationError('상태값이 올바르지 않습니다.');
  }
  const row = await eventsQueries.insert({ title, imageUrl, startAt, endAt, prizeDescription, status });
  return toEventDto(row);
}

async function updateEvent(id, { title, imageUrl, startAt, endAt, prizeDescription }) {
  const existing = await eventsQueries.findById(id);
  if (!existing) {
    throw new NotFoundError('Event', id);
  }
  assertValidTitleAndPeriod({ title, startAt, endAt });
  // 상태 변경은 PATCH /:id/status 전용 — PUT은 상태전이 규칙을 우회하지 않도록 status를 건드리지 않는다.
  const row = await eventsQueries.update(id, { title, imageUrl, startAt, endAt, prizeDescription });
  return toEventDto(row);
}

async function changeEventStatus(id, newStatus) {
  const existing = await eventsQueries.findById(id);
  if (!existing) {
    throw new NotFoundError('Event', id);
  }
  if (!newStatus || !Object.values(EVENT_STATUS).includes(newStatus)) {
    throw new ValidationError('상태값이 올바르지 않습니다.');
  }
  const allowedNext = EVENT_STATUS_TRANSITIONS[existing.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new InvalidStatusTransitionError(existing.status, newStatus);
  }
  const row = await eventsQueries.updateStatus(id, newStatus);
  return toEventDto(row);
}

module.exports = {
  listUserEvents,
  getEventDetail,
  listAdminEvents,
  createEvent,
  updateEvent,
  changeEventStatus,
};
