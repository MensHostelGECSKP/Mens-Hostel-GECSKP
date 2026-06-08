const Notification = require('../models/Notification');
const UserNotificationState = require('../models/UserNotificationState');
const User = require('../models/User');
const pushService = require('./pushService');

/**
 * Helper to determine deep link URL based on notification type
 */
function getDeepLinkUrl(type) {
  const normType = String(type).toLowerCase();
  if (normType.includes('bill')) {
    return '/mess-bill';
  }
  return '/notifications';
}

/**
 * Create a new notification (admin manual)
 */
async function createNotification(notificationData) {
  const { title, message, pdfUrl, type, sendPush } = notificationData;
  const notification = new Notification({
    title,
    message,
    pdfUrl: pdfUrl || undefined,
    type: type || 'other',
    userId: null,
  });
  await notification.save();

  // Send push notification if toggle was enabled
  if (sendPush) {
    const students = await User.find({ role: 'student', status: 'active' }).select('_id');
    const url = getDeepLinkUrl(notification.type);
    
    for (const student of students) {
      await pushService.sendPushNotification(
        student._id,
        notification.type || 'announcement',
        title,
        message || 'New announcement published.',
        { notificationId: notification._id.toString(), url }
      );
    }
  }

  return notification;
}

/**
 * Broadcast notification (all users, triggered by system actions e.g. bill upload)
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

  // Trigger push dispatches to all active students
  const students = await User.find({ role: 'student', status: 'active' }).select('_id');
  const url = getDeepLinkUrl(type);

  for (const student of students) {
    await pushService.sendPushNotification(
      student._id,
      type,
      title,
      message,
      { notificationId: notification._id.toString(), url, messBillId: messBillId ? messBillId.toString() : undefined }
    );
  }

  return notification;
}

/**
 * Targeted notification for one user (e.g. unpaid reminders)
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

  // Trigger direct push dispatch
  const url = getDeepLinkUrl(type);
  await pushService.sendPushNotification(
    userId,
    type,
    title,
    message,
    { notificationId: notification._id.toString(), url, messBillId: messBillId ? messBillId.toString() : undefined }
  );

  return notification;
}

/**
 * Get notifications for a user (broadcasts + their own) with read/deleted status.
 */
async function getNotificationsForUser(user) {
  const userId = user.userId || user._id;

  // Retrieve base notifications visible to this user
  let query = { $or: [{ userId: null }, { userId }] };
  
  // If not admin, query matches student's own. If admin, they see all broadcasts + their targeted ones.
  // Actually, we can fetch all notifications matching target or null.
  const notifications = await Notification.find(query).sort({ createdAt: -1 });

  // Get user-specific states
  const states = await UserNotificationState.find({ userId });
  const stateMap = new Map(states.map(s => [s.notificationId.toString(), s]));

  // Merge flags and filter out locally deleted ones
  return notifications
    .map(n => {
      const state = stateMap.get(n._id.toString());
      return {
        ...n.toObject(),
        isRead: state ? state.isRead : false,
        isDeleted: state ? state.isDeleted : false,
      };
    })
    .filter(n => !n.isDeleted);
}

/**
 * Mark a notification as read for a user
 */
async function markAsRead(userId, notificationId) {
  await UserNotificationState.updateOne(
    { userId, notificationId },
    { $set: { isRead: true } },
    { upsert: true }
  );
}

/**
 * Mark all visible notifications as read for a user
 */
async function markAllAsRead(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const notifications = await Notification.find({
    $or: [{ userId: null }, { userId }],
  });

  if (notifications.length === 0) return;

  const bulkOps = notifications.map(n => ({
    updateOne: {
      filter: { userId, notificationId: n._id },
      update: { $set: { isRead: true } },
      upsert: true,
    }
  }));

  await UserNotificationState.bulkWrite(bulkOps);
}

/**
 * Dismiss (locally delete) a notification for a user
 */
async function deleteNotificationLocally(userId, notificationId) {
  await UserNotificationState.updateOne(
    { userId, notificationId },
    { $set: { isDeleted: true } },
    { upsert: true }
  );
}

/**
 * Delete a notification globally (admin only)
 */
async function deleteNotification(id) {
  const notification = await Notification.findByIdAndDelete(id);
  if (!notification) {
    throw new Error('NOT_FOUND');
  }
  
  // Clean up user states for this notification
  await UserNotificationState.deleteMany({ notificationId: id });
  return notification;
}

module.exports = {
  createNotification,
  createBroadcast,
  createForUser,
  getNotificationsForUser,
  markAsRead,
  markAllAsRead,
  deleteNotificationLocally,
  deleteNotification,
};
