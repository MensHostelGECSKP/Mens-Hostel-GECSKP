const MessBill = require('../models/MessBill');
const MessBillPayment = require('../models/MessBillPayment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getMessBillStorage, getStorageProviderByName } = require('../storage');
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
async function publishMessBill({ month, year, dueDate, file, uploadedBy, replace }) {
  if (!file || !file.buffer) {
    throw new Error('INVALID_FILE');
  }

  const existing = await findExistingBill(month, year);
  if (existing) {
    if (!replace) {
      throw new Error('DUPLICATE_BILL_MONTH');
    }

    // Delete existing file using the provider it was saved with
    const oldProviderName = existing.storageProvider || 'local';
    const oldStorageKey = existing.storageKey;
    try {
      const oldProvider = getStorageProviderByName(oldProviderName);
      await oldProvider.removeFile(oldStorageKey);
    } catch (cleanupErr) {
      console.error('[mess-bill] Failed to delete old storage file:', cleanupErr.message);
    }

    const storageKey = buildMessBillStorageKey({
      month,
      year,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    let uploadResult;
    try {
      uploadResult = await messBillStorage.saveFile({
        buffer: file.buffer,
        storageKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        month,
        year,
      });
    } catch (err) {
      console.error('[mess-bill] Storage upload failed:', err.message);
      throw new Error('STORAGE_UPLOAD_FAILED');
    }

    const newStorageKey = typeof uploadResult === 'string' ? uploadResult : uploadResult.storageKey;

    existing.fileName = file.originalname;
    existing.storageKey = newStorageKey;
    existing.mimeType = file.mimetype;
    existing.fileSize = file.buffer.length;
    existing.storageProvider = messBillStorage.name;
    existing.uploadedBy = uploadedBy;
    existing.uploadedAt = new Date();
    existing.dueDate = dueDate;

    if (messBillStorage.name === 'google-drive') {
      existing.fileId = uploadResult.fileId;
      existing.viewUrl = uploadResult.viewUrl;
      existing.downloadUrl = uploadResult.downloadUrl;
    } else {
      existing.fileId = undefined;
      existing.viewUrl = undefined;
      existing.downloadUrl = undefined;
    }

    await existing.save();

    const label = formatBillMonthLabel(month, year);
    const dueStr = formatDueDate(dueDate);
    const warnings = [];

    try {
      await notificationService.createBroadcast({
        title: '📢 Mess Bill Updated',
        message: `${label} mess bill has been updated/re-published.\n\nDue Date:\n${dueStr}\n\nView and download the new bill in the Mess section.`,
        type: 'mess_bill',
        messBillId: existing._id,
      });
    } catch (err) {
      console.error('[mess-bill] Broadcast notification failed:', err.message);
      warnings.push('notification_failed');
    }

    const billDoc = attachFileUrls(existing.toObject());
    return { bill: billDoc, notified: warnings.length === 0, warnings };
  }

  const storageKey = buildMessBillStorageKey({
    month,
    year,
    originalName: file.originalname,
    mimeType: file.mimetype,
  });

  let uploadResult;
  try {
    uploadResult = await messBillStorage.saveFile({
      buffer: file.buffer,
      storageKey,
      fileName: file.originalname,
      mimeType: file.mimetype,
      month,
      year,
    });
  } catch (err) {
    console.error('[mess-bill] Storage upload failed:', err.message);
    throw new Error('STORAGE_UPLOAD_FAILED');
  }

  const newStorageKey = typeof uploadResult === 'string' ? uploadResult : uploadResult.storageKey;

  const bill = new MessBill({
    month,
    year,
    dueDate,
    fileName: file.originalname,
    storageKey: newStorageKey,
    mimeType: file.mimetype,
    fileSize: file.buffer.length,
    storageProvider: messBillStorage.name,
    uploadedBy,
    isPublished: true,
  });

  if (messBillStorage.name === 'google-drive') {
    bill.fileId = uploadResult.fileId;
    bill.viewUrl = uploadResult.viewUrl;
    bill.downloadUrl = uploadResult.downloadUrl;
  }

  try {
    await bill.save();
  } catch (err) {
    try {
      await messBillStorage.removeFile(newStorageKey);
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

  // Google Drive files are served by returning their view/download URL.
  // There is no need to download the buffer from Google Drive to the backend.
  if (bill.storageProvider === 'google-drive') {
    return { bill };
  }

  const storageKey = getBillStorageKey(bill);
  try {
    const provider = getStorageProviderByName(bill.storageProvider || 'local');
    const buffer = await provider.readFile(storageKey);
    return { bill, buffer };
  } catch (err) {
    if (err.code === 'ENOENT' || err.message === 'INVALID_FILE') {
      throw new Error('FILE_NOT_FOUND');
    }
    console.error('[mess-bill] Storage file read failed:', err.message);
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
    const provider = getStorageProviderByName(bill.storageProvider || 'local');
    await provider.removeFile(storageKey);
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
