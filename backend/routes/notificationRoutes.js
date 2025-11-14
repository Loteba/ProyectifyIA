// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { listMyNotifications, markRead, markAllRead, unreadCount } = require('../controllers/notificationController');

router.use(protect);

router.get('/', listMyNotifications);
router.post('/:id/read', markRead);
router.post('/read-all', markAllRead);
router.get('/unread-count', unreadCount);

module.exports = router;
