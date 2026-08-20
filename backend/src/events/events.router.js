const express = require('express');
const { authMiddleware, requireAdmin } = require('../middlewares/auth.middleware');
const controller = require('./events.controller');
const applicationsController = require('../applications/applications.controller');

const router = express.Router();
router.get('/', authMiddleware, controller.list);
router.post('/', authMiddleware, requireAdmin, controller.create);
router.get('/:id', authMiddleware, controller.getDetail);
router.put('/:id', authMiddleware, requireAdmin, controller.update);
router.patch('/:id/status', authMiddleware, requireAdmin, controller.updateStatus);
router.post('/:id/applications', authMiddleware, applicationsController.apply);
router.get('/:id/applications', authMiddleware, requireAdmin, applicationsController.getSummary);

module.exports = router;
