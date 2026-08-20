const express = require('express');
const { authMiddleware, requireAdmin } = require('../middlewares/auth.middleware');
const controller = require('./events.controller');

const router = express.Router();
router.get('/', authMiddleware, requireAdmin, controller.listAdmin);

module.exports = router;
