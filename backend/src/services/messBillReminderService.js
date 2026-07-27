const { toZonedTime, fromZonedTime } = require('date-fns-tz');
const MessBill = require('../models/MessBill');
const MessBillPayment = require('../models/MessBillPayment');
const notificationService = require('./notificationService');
const { formatBillMonthLabel, formatDueDate } = require('../utils/messBillFormat');
const config = require('../config');

const User = require('../models/User');

/**
 * Get the target day's UTC boundaries (startOfDay and endOfDay) relative to a timezone.
 * This function is completely host-server-timezone independent.
 */
function getZonedStartAndEnd(offsetDays, timeZone) {
  const now = new Date();
  const zonedNow = toZonedTime(now, timeZone);

  const targetZonedDate = new Date(zonedNow);
  targetZonedDate.setDate(targetZonedDate.getDate() + offsetDays);

  const targetZonedStart = new Date(targetZonedDate);
  targetZonedStart.setHours(0, 0, 0, 0);

  const targetZonedEnd = new Date(targetZonedDate);
  targetZonedEnd.setHours(23, 59, 59, 999);

  const startUTC = fromZonedTime(targetZonedStart, timeZone);
  const endUTC = fromZonedTime(targetZonedEnd, timeZone);

  return { startUTC, endUTC };
}

/**
 * Process reminders for bills due in exactly `daysBefore` days.
 */
async function processRemindersForOffset(daysBefore, reminderField, type, titlePrefix) {
  const timeZone = config.messBillReminderTimezone || 'Asia/Kolkata';
  const { startUTC, endUTC } = getZonedStartAndEnd(daysBefore, timeZone);

  const bills = await MessBill.find({
    isPublished: true,
    dueDate: { $gte: startUTC, $lte: endUTC },
  });
  let sent = 0;

  // Sync payments for active students first
  const activeStudents = await User.find({ role: 'student', status: 'active' }).select('_id');

  for (const bill of bills) {
    if (activeStudents.length > 0) {
      const existingPayments = await MessBillPayment.find({ messBillId: bill._id }).select('userId');
      const existingUserIds = new Set(existingPayments.map((p) => p.userId.toString()));
      const missing = activeStudents
        .filter((s) => !existingUserIds.has(s._id.toString()))
        .map((s) => ({ userId: s._id, messBillId: bill._id, isPaid: false }));
      if (missing.length > 0) {
        await MessBillPayment.insertMany(missing);
      }
    }

    const label = formatBillMonthLabel(bill.month, bill.year);
    const dueStr = formatDueDate(bill.dueDate);

    const payments = await MessBillPayment.find({
      messBillId: bill._id,
      isPaid: false,
      [reminderField]: { $exists: false },
    });

    for (const payment of payments) {
      const title =
        daysBefore === 3
          ? 'Mess Bill Reminder'
          : 'Final Reminder';
      const emoji = daysBefore === 3 ? '⏰' : '🚨';
      const bodyLine =
        daysBefore === 3
          ? `Your ${label} mess bill payment is due in 3 days.`
          : `Your ${label} mess bill payment is due tomorrow.`;

      try {
        await notificationService.createForUser({
          userId: payment.userId,
          title: `${emoji} ${title}`,
          message: `${bodyLine}\n\nDue Date:\n${dueStr}`,
          type,
          messBillId: bill._id,
        });

        await MessBillPayment.updateOne(
          { _id: payment._id, [reminderField]: { $exists: false } },
          { $set: { [reminderField]: new Date() } }
        );
        sent += 1;
      } catch (err) {
        console.error(`[mess-bill-reminder] Failed for payment ${payment._id}:`, err.message);
      }
    }
  }

  return sent;
}

async function runDailyReminders() {
  const r3 = await processRemindersForOffset(
    3,
    'reminder3SentAt',
    'mess_bill_reminder_3d',
    'Mess Bill Reminder'
  );
  const r1 = await processRemindersForOffset(
    1,
    'reminder1SentAt',
    'mess_bill_reminder_1d',
    'Final Reminder'
  );
  if (r3 > 0 || r1 > 0) {
    console.log(`[mess-bill-reminder] Sent ${r3} three-day and ${r1} one-day reminders`);
  }
  return { r3, r1, total: r3 + r1 };
}

module.exports = {
  runDailyReminders,
  processRemindersForOffset,
};
