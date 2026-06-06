const mongoose = require('mongoose');

const messBillPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'MessBill', required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  reminder3SentAt: { type: Date },
  reminder1SentAt: { type: Date },
});

messBillPaymentSchema.index({ userId: 1, messBillId: 1 }, { unique: true });
messBillPaymentSchema.index({ messBillId: 1, isPaid: 1 });

module.exports = mongoose.model('MessBillPayment', messBillPaymentSchema);
