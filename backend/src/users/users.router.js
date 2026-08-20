const express = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const controller = require('./users.controller');
const applicationsController = require('../applications/applications.controller');

const router = express.Router();
router.get('/', authMiddleware, controller.getMe);
router.get('/applications', authMiddleware, applicationsController.listMine);

module.exports = router;
