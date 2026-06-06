const notificationService = require('../services/notificationService');
const { ERROR_CODES } = require('../constants/errors');

/**
 * Create a new notification
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
 * Get all notifications
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
 * Delete a notification
 */
async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    await notificationService.deleteNotification(id);
    res.json({ message: 'Notification deleted' });
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

module.exports = {
  createNotification,
  getAllNotifications,
  deleteNotification,
};




