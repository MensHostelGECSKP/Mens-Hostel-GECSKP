const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  performedByName: { type: String, required: false },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: false },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, required: false },
}, { timestamps: true });

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
