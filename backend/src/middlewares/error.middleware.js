const { DomainError } = require('../domain/errors');

module.exports = function errorMiddleware(err, req, res, next) {
  if (err instanceof DomainError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
};
