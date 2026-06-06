const { addDays, startOfDay, endOfDay, isSameDay } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');
const MessBill = require('../models/MessBill');
const MessBillPayment = require('../models/MessBillPayment');
const notificationService = require('./notificationService');
const { formatBillMonthLabel, formatDueDate } = require('../utils/messBillFormat');
const config = require('../config');

function todayInTimezone() {
  const now = new Date();
  return startOfDay(toZonedTime(now, config.messBillReminderTimezone));
}

/**
 * Process reminders for bills due in exactly `daysBefore` days.
 */
async function processRemindersForOffset(daysBefore, reminderField, type, titlePrefix) {
  const today = todayInTimezone();
  const targetDue = addDays(today, daysBefore);
  const targetDueStart = startOfDay(targetDue);
  const targetDueEnd = endOfDay(targetDue);

  const bills = await MessBill.find({
    isPublished: true,
    dueDate: { $gte: targetDueStart, $lte: targetDueEnd },
  });
  let sent = 0;

  for (const bill of bills) {

    const label = formatBillMonthLabel(bill.month, bill.year);
    const dueStr = formatDueDate(bill.dueDate);

    const payments = await MessBillPayment.find({
      messBillId: bill._id,
      isPaid: false,
      [reminderField]: { $exists: false },
    });

    for (const payment of payments) {
      const daysText = daysBefore === 3 ? '3 days' : 'tomorrow';
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
}

module.exports = {
  runDailyReminders,
  processRemindersForOffset,
};
