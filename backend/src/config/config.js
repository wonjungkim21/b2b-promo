require('dotenv').config();

const errors = [];

const dbConnString = process.env.DB_CONN_STRING;
if (!dbConnString || dbConnString.trim() === '') {
  errors.push('DB_CONN_STRING이 비어있습니다.');
}

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
if (!jwtAccessSecret || jwtAccessSecret.trim() === '') {
  errors.push('JWT_ACCESS_SECRET이 비어있습니다.');
}
if (!jwtRefreshSecret || jwtRefreshSecret.trim() === '') {
  errors.push('JWT_REFRESH_SECRET이 비어있습니다.');
}
if (
  jwtAccessSecret &&
  jwtRefreshSecret &&
  jwtAccessSecret.trim() !== '' &&
  jwtRefreshSecret.trim() !== '' &&
  jwtAccessSecret === jwtRefreshSecret
) {
  errors.push('JWT_ACCESS_SECRET과 JWT_REFRESH_SECRET은 서로 달라야 합니다.');
}

const DEFAULT_JWT_ACCESS_EXPIRES_IN = '30m';
const DEFAULT_JWT_REFRESH_EXPIRES_IN_DAYS = 14;

const jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || DEFAULT_JWT_ACCESS_EXPIRES_IN;

const jwtRefreshExpiresInDaysRaw = process.env.JWT_REFRESH_EXPIRES_IN_DAYS;
const jwtRefreshExpiresInDays = jwtRefreshExpiresInDaysRaw
  ? Number(jwtRefreshExpiresInDaysRaw)
  : DEFAULT_JWT_REFRESH_EXPIRES_IN_DAYS;
if (!Number.isInteger(jwtRefreshExpiresInDays) || jwtRefreshExpiresInDays <= 0) {
  errors.push('JWT_REFRESH_EXPIRES_IN_DAYS는 0보다 큰 정수여야 합니다.');
}

const portRaw = process.env.PORT;
const port = Number(portRaw);
if (!Number.isInteger(port) || port <= 0) {
  errors.push('PORT는 0보다 큰 정수여야 합니다.');
}

const corsOriginRaw = process.env.CORS_ORIGIN;
const corsOrigins = (corsOriginRaw || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin !== '');
if (corsOrigins.length < 1) {
  errors.push('CORS_ORIGIN에 최소 하나 이상의 origin이 필요합니다.');
}
if (corsOrigins.includes('*')) {
  errors.push('CORS_ORIGIN에 "*"는 허용되지 않습니다.');
}

if (errors.length > 0) {
  console.error('환경변수 검증 실패:');
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

module.exports = {
  port,
  dbConnString,
  jwtAccessSecret,
  jwtRefreshSecret,
  jwtAccessExpiresIn,
  jwtRefreshExpiresInMs: jwtRefreshExpiresInDays * 24 * 60 * 60 * 1_000,
  corsOrigins,
};
