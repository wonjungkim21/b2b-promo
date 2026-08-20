const { NotFoundError } = require('../domain/errors');
const usersQueries = require('./users.queries');

async function getMe(userId) {
  const user = await usersQueries.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User', userId);
  }
  return { id: user.id, name: user.name, role: user.role, pointBalance: Number(user.point_balance) };
}

module.exports = { getMe };
