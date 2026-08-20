const { ValidationError } = require('../domain/errors');
const eventsService = require('./events.service');

function assertNumericId(id) {
  if (!/^\d+$/.test(id)) {
    throw new ValidationError('이벤트 id는 숫자여야 합니다.');
  }
}

async function list(req, res, next) {
  try {
    const result = await eventsService.listUserEvents();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getDetail(req, res, next) {
  try {
    const { id } = req.params;
    assertNumericId(id);
    const result = await eventsService.getEventDetail(Number(id));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function listAdmin(req, res, next) {
  try {
    const result = await eventsService.listAdminEvents();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const result = await eventsService.createEvent(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    assertNumericId(id);
    const result = await eventsService.updateEvent(Number(id), req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    assertNumericId(id);
    const result = await eventsService.changeEventStatus(Number(id), req.body.status);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getDetail, listAdmin, create, update, updateStatus };
