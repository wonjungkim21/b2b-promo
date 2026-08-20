const { DomainError } = require('../domain/errors');

module.exports = function errorMiddleware(err, req, res, next) {
  if (err instanceof DomainError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ message: '요청 본문이 올바른 JSON 형식이 아닙니다.' });
    return;
  }
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
};
