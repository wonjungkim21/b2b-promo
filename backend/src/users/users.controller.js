const usersService = require('./users.service');

async function getMe(req, res, next) {
  try {
    const result = await usersService.getMe(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe };
