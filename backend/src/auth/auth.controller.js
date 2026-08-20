const { ValidationError } = require('../domain/errors');
const authService = require('./auth.service');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

async function signup(req, res, next) {
  try {
    const { name, loginId, password } = req.body;
    if (!isNonEmptyString(name) || !isNonEmptyString(loginId) || !isNonEmptyString(password)) {
      throw new ValidationError('name, loginId, password는 필수 문자열입니다.');
    }
    const result = await authService.signup({ name, loginId, password });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { loginId, password } = req.body;
    if (!isNonEmptyString(loginId) || !isNonEmptyString(password)) {
      throw new ValidationError('loginId, password는 필수 문자열입니다.');
    }
    const result = await authService.login({ loginId, password });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!isNonEmptyString(refreshToken)) {
      throw new ValidationError('refreshToken은 필수 문자열입니다.');
    }
    const result = await authService.refresh({ refreshToken });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!isNonEmptyString(refreshToken)) {
      throw new ValidationError('refreshToken은 필수 문자열입니다.');
    }
    await authService.logout({ refreshToken });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh, logout };
