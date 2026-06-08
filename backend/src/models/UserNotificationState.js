const mongoose = require('mongoose');

const userNotificationStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure unique combination of user and notification
userNotificationStateSchema.index({ userId: 1, notificationId: 1 }, { unique: true });
userNotificationStateSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model('UserNotificationState', userNotificationStateSchema);
