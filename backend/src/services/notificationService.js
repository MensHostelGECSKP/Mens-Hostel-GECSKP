const Notification = require('../models/Notification');

/**
 * Create a new notification (admin manual)
 */
async function createNotification(notificationData) {
  const { title, message, pdfUrl, type } = notificationData;
  const notification = new Notification({
    title,
    message,
    pdfUrl: pdfUrl || undefined,
    type: type || 'other',
    userId: null,
  });
  await notification.save();
  return notification;
}

/**
 * Broadcast notification (all users)
 */
async function createBroadcast({ title, message, type, messBillId, pdfUrl }) {
  const notification = new Notification({
    title,
    message,
    type,
    messBillId: messBillId || null,
    pdfUrl: pdfUrl || undefined,
    userId: null,
  });
  await notification.save();
  return notification;
}

/**
 * Targeted notification for one user
 */
async function createForUser({ userId, title, message, type, messBillId }) {
  const notification = new Notification({
    title,
    message,
    type,
    userId,
    messBillId: messBillId || null,
  });
  await notification.save();
  return notification;
}

/**
 * Get notifications for a user (broadcasts + their own). Admins see all.
 */
async function getNotificationsForUser(user) {
  if (user.role === 'admin') {
    return Notification.find().sort({ createdAt: -1 });
  }
  const userId = user.userId || user._id;
  return Notification.find({
    $or: [{ userId: null }, { userId }],
  }).sort({ createdAt: -1 });
}

/**
 * Delete a notification by ID
 */
async function deleteNotification(id) {
  const notification = await Notification.findByIdAndDelete(id);
  if (!notification) {
    throw new Error('NOT_FOUND');
  }
  return notification;
}

module.exports = {
  createNotification,
  createBroadcast,
  createForUser,
  getNotificationsForUser,
  deleteNotification,
};
