const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { UnauthorizedError, ForbiddenError } = require('../domain/errors');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    next(new UnauthorizedError('인증 토큰이 필요합니다.'));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret, { algorithms: ['HS256'] });
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    next(new UnauthorizedError('유효하지 않은 토큰입니다.'));
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    next(new ForbiddenError());
    return;
  }
  next();
}

module.exports = { authMiddleware, requireAdmin };
