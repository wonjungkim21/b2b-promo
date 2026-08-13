class DomainError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

class EventNotOngoingError extends DomainError {
  constructor(eventId) {
    super(`이벤트(${eventId})가 진행중 상태가 아닙니다.`, 409);
  }
}

class InsufficientPointsError extends DomainError {
  constructor(required, balance) {
    super(`포인트가 부족합니다. 필요 포인트: ${required}, 보유 포인트: ${balance}`, 400);
  }
}

class InvalidApplyCountError extends DomainError {
  constructor(count) {
    super(`응모 수량이 올바르지 않습니다: ${count}`, 400);
  }
}

class InvalidStatusTransitionError extends DomainError {
  constructor(fromStatus, toStatus) {
    super(`상태를 ${fromStatus}에서 ${toStatus}(으)로 변경할 수 없습니다.`, 400);
  }
}

class NotFoundError extends DomainError {
  constructor(resourceName, id) {
    super(`${resourceName}(${id})을(를) 찾을 수 없습니다.`, 404);
  }
}

class UnauthorizedError extends DomainError {
  constructor(message) {
    super(message || '인증되지 않았습니다.', 401);
  }
}

class DuplicateLoginIdError extends DomainError {
  constructor(loginId) {
    super(`이미 사용중인 로그인 아이디입니다: ${loginId}`, 409);
  }
}

module.exports = {
  DomainError,
  EventNotOngoingError,
  InsufficientPointsError,
  InvalidApplyCountError,
  InvalidStatusTransitionError,
  NotFoundError,
  UnauthorizedError,
  DuplicateLoginIdError,
};
