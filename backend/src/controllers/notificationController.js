const notificationService = require('../services/notificationService');
const pushService = require('../services/pushService');
const { ERROR_CODES } = require('../constants/errors');

/**
 * Create a new notification (admin only)
 */
async function createNotification(req, res, next) {
  try {
    const notificationData = req.validated;
    const notification = await notificationService.createNotification(notificationData);
    res.status(201).json({ message: 'Notification added', notification });
  } catch (err) {
    next(err);
  }
}

/**
 * Get notifications for user (with read/unread states)
 */
async function getAllNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getNotificationsForUser(req.user);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete or dismiss a notification
 */
async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user._id;

    if (req.user.role === 'admin') {
      // Global deletion for admin
      await notificationService.deleteNotification(id);
      res.json({ message: 'Notification deleted globally' });
    } else {
      // Local dismissal for students
      await notificationService.deleteNotificationLocally(userId, id);
      res.json({ message: 'Notification dismissed' });
    }
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({
        error: 'Notification not found',
        code: ERROR_CODES.NOT_FOUND,
      });
    }
    next(err);
  }
}

/**
 * Get the VAPID public key
 */
function getVapidPublicKey(req, res, next) {
  try {
    const publicKey = pushService.getVapidPublicKey();
    res.json({ publicKey });
  } catch (err) {
    next(err);
  }
}

/**
 * Register web push subscription
 */
async function subscribe(req, res, next) {
  try {
    const userId = req.user.userId || req.user._id;
    await pushService.subscribeUser(userId, req.body);
    res.json({ message: 'Subscribed to push notifications successfully' });
  } catch (err) {
    if (err.message === 'INVALID_SUBSCRIPTION_DATA') {
      return res.status(400).json({ error: 'Invalid subscription data format' });
    }
    next(err);
  }
}

/**
 * Unsubscribe web push subscription
 */
async function unsubscribe(req, res, next) {
  try {
    const userId = req.user.userId || req.user._id;
    const { endpoint } = req.body;
    await pushService.unsubscribeUser(userId, endpoint);
    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark a notification as read
 */
async function markRead(req, res, next) {
  try {
    const userId = req.user.userId || req.user._id;
    const { id } = req.params;
    await notificationService.markAsRead(userId, id);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark all notifications as read
 */
async function markAllRead(req, res, next) {
  try {
    const userId = req.user.userId || req.user._id;
    await notificationService.markAllAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

/**
 * Track notification click event
 */
async function trackClick(req, res, next) {
  try {
    const { metricId } = req.params;
    const success = await pushService.logClick(metricId);
    if (success) {
      res.json({ message: 'Click tracked successfully' });
    } else {
      res.status(404).json({ error: 'Metric record not found' });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createNotification,
  getAllNotifications,
  deleteNotification,
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  markRead,
  markAllRead,
  trackClick,
};
