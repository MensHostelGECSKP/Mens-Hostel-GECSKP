const cron = require('node-cron');
const config = require('../config');
const { runDailyReminders } = require('../services/messBillReminderService');

function startMessBillReminderJob() {
  const schedule = config.messBillReminderCron;
  if (!cron.validate(schedule)) {
    console.warn('[mess-bill-reminder] Invalid cron schedule:', schedule);
    return;
  }

  cron.schedule(
    schedule,
    async () => {
      try {
        await runDailyReminders();
      } catch (err) {
        console.error('[mess-bill-reminder] Job failed:', err.message);
      }
    },
    { timezone: config.messBillReminderTimezone }
  );

  console.log(
    `[mess-bill-reminder] Scheduled (${schedule}, ${config.messBillReminderTimezone})`
  );
}

module.exports = { startMessBillReminderJob };
