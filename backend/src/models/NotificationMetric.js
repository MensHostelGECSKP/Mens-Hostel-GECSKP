const mongoose = require('mongoose');

const notificationMetricSchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'clicked', 'failed'],
    default: 'sent',
  },
  failureReason: { type: String },
  sentAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  clickedAt: { type: Date },
}, { timestamps: true });

notificationMetricSchema.index({ status: 1 });
notificationMetricSchema.index({ userId: 1 });
notificationMetricSchema.index({ notificationId: 1 });

module.exports = mongoose.model('NotificationMetric', notificationMetricSchema);
