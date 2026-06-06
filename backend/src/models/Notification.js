const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String },
  pdfUrl: { type: String },
  type: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  messBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'MessBill', default: null },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
