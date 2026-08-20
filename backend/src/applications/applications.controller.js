const { ValidationError } = require('../domain/errors');
const applicationsService = require('./applications.service');

function assertNumericId(id) {
  if (!/^\d+$/.test(id)) {
    throw new ValidationError('이벤트 id는 숫자여야 합니다.');
  }
}

async function apply(req, res, next) {
  try {
    const { id } = req.params;
    assertNumericId(id);

    const { count, idempotencyKey } = req.body;
    if (count === undefined || count === null) {
      throw new ValidationError('count는 필수입니다.');
    }
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
      throw new ValidationError('idempotencyKey는 필수 문자열입니다.');
    }

    const result = await applicationsService.applyToEvent({
      userId: req.user.id,
      eventId: Number(id),
      count,
      idempotencyKey,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const result = await applicationsService.listMyApplications(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const { id } = req.params;
    assertNumericId(id);
    const result = await applicationsService.getApplicationSummary(Number(id));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { apply, listMine, getSummary };
