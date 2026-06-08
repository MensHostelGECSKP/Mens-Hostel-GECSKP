const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { validateCreateNotification } = require('../validators/notificationValidator');
const {
  createNotification,
  getAllNotifications,
  deleteNotification,
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  markRead,
  markAllRead,
  trackClick,
} = require('../controllers/notificationController');

const router = express.Router();

// Get VAPID public key
router.get('/vapid-public-key', auth, getVapidPublicKey);

// Subscribe to push notifications
router.post('/subscribe', auth, subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', auth, unsubscribe);

// Add a new notification (admin only)
router.post('/', auth, adminOnly, validateCreateNotification, createNotification);

// Get notifications (authenticated)
router.get('/', auth, getAllNotifications);

// Mark a notification as read (authenticated)
router.put('/:id/read', auth, markRead);

// Mark all notifications as read (authenticated)
router.post('/read-all', auth, markAllRead);

// Track notification click (public - accessed by service worker)
router.post('/metrics/:metricId/click', trackClick);

// Delete / Dismiss a notification (admin deletes globally, student dismisses locally)
router.delete('/:id', auth, deleteNotification);

module.exports = router;