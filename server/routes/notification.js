const express = require('express');
const { getNotifications, markAsRead, getNotificationCount, markOneAsRead } = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, getNotifications);
router.post('/mark-read', auth, markAsRead);
router.get('/count', auth, getNotificationCount);
router.post('/:id/mark-read', auth, markOneAsRead);

module.exports = router;