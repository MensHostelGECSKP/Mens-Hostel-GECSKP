const MessBill = require('../models/MessBill');
const MessBillPayment = require('../models/MessBillPayment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getMessBillStorage } = require('../storage');
const { buildMessBillStorageKey } = require('../storage/storageKey');
const notificationService = require('./notificationService');
const { formatBillMonthLabel, formatDueDate } = require('../utils/messBillFormat');

const messBillStorage = getMessBillStorage();

function getBillStorageKey(bill) {
  return bill.storageKey || bill.storedFileName;
}

function attachFileUrls(doc) {
  const id = doc._id.toString();
  doc.fileUrl = `/api/mess-bill/${id}/view`;
  doc.downloadUrl = `/api/mess-bill/${id}/download`;
  return doc;
}

function attachPaymentStatus(bill, payment) {
  const doc = bill.toObject ? bill.toObject() : { ...bill };
  doc.paymentStatus = payment
    ? { isPaid: payment.isPaid, paidAt: payment.paidAt || null }
    : { isPaid: false, paidAt: null };
  return attachFileUrls(doc);
}

async function findExistingBill(month, year) {
  return MessBill.findOne({ month, year });
}

/**
 * Publish a new mess bill: upload to storage, save metadata, payments, broadcast notification.
 */
async function publishMessBill({ month, year, dueDate, file, uploadedBy }) {
  if (!file || !file.buffer) {
    throw new Error('INVALID_FILE');
  }

  const existing = await findExistingBill(month, year);
  if (existing) {
    throw new Error('DUPLICATE_BILL_MONTH');
  }

  const storageKey = buildMessBillStorageKey({
    month,
    year,
    originalName: file.originalname,
    mimeType: file.mimetype,
  });

  try {
    await messBillStorage.saveFile({
      buffer: file.buffer,
      storageKey,
      mimeType: file.mimetype,
    });
  } catch (err) {
    console.error('[mess-bill] Storage upload failed:', err.message);
    throw new Error('STORAGE_UPLOAD_FAILED');
  }

  const bill = new MessBill({
    month,
    year,
    dueDate,
    fileName: file.originalname,
    storageKey,
    mimeType: file.mimetype,
    fileSize: file.buffer.length,
    storageProvider: 'local',
    uploadedBy,
    isPublished: true,
  });

  try {
    await bill.save();
  } catch (err) {
    try {
      await messBillStorage.removeFile(storageKey);
    } catch (cleanupErr) {
      console.error('[mess-bill] Failed to roll back uploaded file:', cleanupErr.message);
    }
    if (err.code === 11000) {
      throw new Error('DUPLICATE_BILL_MONTH');
    }
    throw err;
  }

  const students = await User.find({ role: 'student', status: 'active' }).select('_id');
  if (students.length > 0) {
    const payments = students.map((s) => ({
      userId: s._id,
      messBillId: bill._id,
      isPaid: false,
    }));
    await MessBillPayment.insertMany(payments);
  }

  const label = formatBillMonthLabel(month, year);
  const dueStr = formatDueDate(dueDate);
  const warnings = [];

  try {
    await notificationService.createBroadcast({
      title: '📢 New Mess Bill Published',
      message: `${label} mess bill has been published.\n\nDue Date:\n${dueStr}\n\nView and download the bill in the Mess section.`,
      type: 'mess_bill',
      messBillId: bill._id,
    });
  } catch (err) {
    console.error('[mess-bill] Broadcast notification failed:', err.message);
    warnings.push('notification_failed');
  }

  const billDoc = attachFileUrls(bill.toObject());
  return { bill: billDoc, notified: warnings.length === 0, warnings };
}

/**
 * List bills with payment status for the requesting user.
 */
async function getMessBillsForUser(user) {
  const bills = await MessBill.find({ isPublished: true }).sort({ year: -1, month: -1 });

  if (user.role === 'admin') {
    return bills.map((b) => {
      const doc = b.toObject();
      doc.paymentStatus = null;
      return attachFileUrls(doc);
    });
  }

  const userId = user.userId || user._id;
  const payments = await MessBillPayment.find({ userId });
  const paymentMap = new Map(payments.map((p) => [p.messBillId.toString(), p]));

  return bills.map((b) => attachPaymentStatus(b, paymentMap.get(b._id.toString())));
}

/**
 * Get single bill with payment status.
 */
async function getMessBillById(id, user) {
  const bill = await MessBill.findById(id);
  if (!bill) {
    throw new Error('NOT_FOUND');
  }

  if (user.role === 'admin') {
    const doc = bill.toObject();
    doc.paymentStatus = null;
    return attachFileUrls(doc);
  }

  const userId = user.userId || user._id;
  const payment = await MessBillPayment.findOne({ userId, messBillId: id });
  return attachPaymentStatus(bill, payment);
}

/**
 * Resolve authenticated file access from local storage.
 */
async function getBillFileAccess(id) {
  const bill = await MessBill.findById(id);
  if (!bill) {
    throw new Error('NOT_FOUND');
  }

  const storageKey = getBillStorageKey(bill);
  try {
    const buffer = await messBillStorage.readFile(storageKey);
    return { bill, buffer };
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error('FILE_NOT_FOUND');
    }
    console.error('[mess-bill] Local file read failed:', err.message);
    throw new Error('STORAGE_UNAVAILABLE');
  }
}

/**
 * Update payment status for current student.
 */
async function updatePaymentStatus(billId, userId, isPaid) {
  const bill = await MessBill.findById(billId);
  if (!bill) {
    throw new Error('NOT_FOUND');
  }

  const payment = await MessBillPayment.findOne({ userId, messBillId: billId });
  if (!payment) {
    throw new Error('NOT_FOUND');
  }

  payment.isPaid = Boolean(isPaid);
  payment.paidAt = isPaid ? new Date() : undefined;
  if (!isPaid) {
    payment.paidAt = undefined;
  }
  await payment.save();

  return {
    messBillId: billId,
    paymentStatus: { isPaid: payment.isPaid, paidAt: payment.paidAt || null },
  };
}

/**
 * Delete bill metadata first, then remove stored file (best-effort).
 */
async function deleteMessBill(id) {
  const bill = await MessBill.findById(id);
  if (!bill) {
    throw new Error('NOT_FOUND');
  }

  const storageKey = getBillStorageKey(bill);

  await MessBillPayment.deleteMany({ messBillId: id });
  await Notification.deleteMany({ messBillId: id });
  await MessBill.findByIdAndDelete(id);

  try {
    await messBillStorage.removeFile(storageKey);
  } catch (err) {
    console.error('[mess-bill] Storage file delete failed:', storageKey, err.message);
  }

  return bill;
}

/**
 * Remove all mess bill files from storage (year-end reset).
 */
async function removeAllStoredFiles() {
  await messBillStorage.removeAllFiles();
}

module.exports = {
  publishMessBill,
  getMessBillsForUser,
  getMessBillById,
  getBillFileAccess,
  updatePaymentStatus,
  deleteMessBill,
  removeAllStoredFiles,
};
