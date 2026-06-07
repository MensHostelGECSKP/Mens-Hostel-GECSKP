const mongoose = require('mongoose');

const messBillSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  fileName: { type: String, required: true },
  storageKey: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  storageProvider: { type: String, enum: ['local', 'google-drive'], default: 'local' },
  fileId: { type: String },
  viewUrl: { type: String },
  downloadUrl: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: true },
});

messBillSchema.index({ year: -1, month: -1 });
messBillSchema.index({ year: 1, month: 1 }, { unique: true });
messBillSchema.index({ dueDate: 1 });
messBillSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('MessBill', messBillSchema);
