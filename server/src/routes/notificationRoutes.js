const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getNotifications,
  markAllRead,
  markSingleRead,
} = require('../controllers/notificationController');

router.use(requireAuth);

router.get('/', getNotifications);
router.post('/read-all', markAllRead);
router.post('/:id/read', markSingleRead);

module.exports = router;
