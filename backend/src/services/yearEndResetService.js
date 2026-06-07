const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const MessBill = require('../models/MessBill');
const MessBillPayment = require('../models/MessBillPayment');
const Notification = require('../models/Notification');
const messBillService = require('./messBillService');
const { getAcademicYearLabel } = require('../utils/academicYear');

async function getYearEndResetStats() {
  const [residentCount, attendanceCount, notificationCount, messBillCount, messBillPaymentCount] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      Attendance.countDocuments(),
      Notification.countDocuments(),
      MessBill.countDocuments(),
      MessBillPayment.countDocuments(),
    ]);

  return {
    academicYear: getAcademicYearLabel(),
    residentCount,
    attendanceCount,
    notificationCount,
    messBillCount,
    messBillPaymentCount,
  };
}

function isTransactionUnsupportedError(err) {
  const msg = err?.message || '';
  return (
    msg.includes('replica set') ||
    msg.includes('Transaction numbers') ||
    msg.includes('transactions are not supported')
  );
}

async function deleteStoredFilesForBills(deleteDriveFiles) {
  try {
    await messBillService.removeAllStoredFiles({ deleteDriveFiles });
  } catch (err) {
    console.error('[year-end-reset] Failed to clear mess bill storage:', err.message);
  }
}

async function deleteOperationalData(deleteDriveFiles, session) {
  const opts = session ? { session } : {};
  await deleteStoredFilesForBills(deleteDriveFiles);
  const attendanceResult = await Attendance.deleteMany({}, opts);
  const paymentResult = await MessBillPayment.deleteMany({}, opts);
  const messBillResult = await MessBill.deleteMany({}, opts);
  const notificationResult = await Notification.deleteMany({}, opts);
  const studentResult = await User.deleteMany({ role: 'student' }, opts);
  return {
    residents: studentResult.deletedCount,
    attendance: attendanceResult.deletedCount,
    messBills: messBillResult.deletedCount,
    messBillPayments: paymentResult.deletedCount,
    notifications: notificationResult.deletedCount,
  };
}

async function performYearEndResetWithTransaction(deleteDriveFiles) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const deleted = await deleteOperationalData(deleteDriveFiles, session);
    await session.commitTransaction();
    return { deleted };
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    session.endSession();
  }
}

async function performYearEndReset(deleteDriveFiles) {
  try {
    return await performYearEndResetWithTransaction(deleteDriveFiles);
  } catch (err) {
    if (!isTransactionUnsupportedError(err)) {
      throw err;
    }
    console.warn(
      '[year-end-reset] MongoDB transactions unavailable; falling back to sequential deletes'
    );
    const deleted = await deleteOperationalData(deleteDriveFiles);
    return { deleted };
  }
}

module.exports = {
  getYearEndResetStats,
  performYearEndReset,
};
