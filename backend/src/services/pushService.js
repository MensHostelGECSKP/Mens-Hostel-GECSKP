const webpush = require('web-push');
const config = require('../config');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');
const NotificationMetric = require('../models/NotificationMetric');

// Developer friendly: Auto-generate in-memory VAPID keys if they are not set in .env
let vapidPublicKey = config.vapidPublicKey;
let vapidPrivateKey = config.vapidPrivateKey;
const vapidSubject = config.vapidSubject;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.log('\n[push-service] --------------------------------------------------');
  console.log('[push-service] WARNING: VAPID keys are missing in backend/.env.');
  console.log('[push-service] Generating temporary in-memory keys for development...');
  try {
    const keys = webpush.generateVAPIDKeys();
    vapidPublicKey = keys.publicKey;
    vapidPrivateKey = keys.privateKey;
    console.log('[push-service] VAPID_PUBLIC_KEY=' + keys.publicKey);
    console.log('[push-service] VAPID_PRIVATE_KEY=' + keys.privateKey);
    console.log('[push-service] COPY THESE KEYS TO YOUR backend/.env TO PERSIST SUBSCRIPTIONS!');
  } catch (err) {
    console.error('[push-service] Failed to generate VAPID keys:', err.message);
  }
  console.log('[push-service] --------------------------------------------------\n');
}

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Subscribe a user device to push notifications
 */
async function subscribeUser(userId, subscriptionData) {
  const { endpoint, keys } = subscriptionData;
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    throw new Error('INVALID_SUBSCRIPTION_DATA');
  }

  // Update existing or create new
  let sub = await PushSubscription.findOne({ endpoint });
  if (sub) {
    sub.userId = userId;
    sub.keys = keys;
    await sub.save();
  } else {
    sub = new PushSubscription({
      userId,
      endpoint,
      keys,
    });
    await sub.save();
  }
  return sub;
}

/**
 * Unsubscribe a user device from push notifications
 */
async function unsubscribeUser(userId, endpoint) {
  await PushSubscription.deleteOne({ userId, endpoint });
}

/**
 * Send a push notification to a specific user
 */
async function sendPushNotification(userId, category, title, body, data = {}) {
  try {
    // 1. Fetch user to verify active status and check preferences
    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return; // Skip inactive or non-existent users
    }

    // 2. Map category and verify preference is enabled
    // Category mapping: 'mess_bill'/'bills' -> 'bills', 'announcement'/'announcements' -> 'announcements', etc.
    const prefs = user.notificationPreferences || { bills: true, announcements: true, system: true };
    const normCategory = String(category).toLowerCase();
    
    let prefEnabled = true;
    if (normCategory.includes('bill')) {
      prefEnabled = prefs.bills !== false;
    } else if (normCategory.includes('announcement') || normCategory.includes('notice')) {
      prefEnabled = prefs.announcements !== false;
    } else if (normCategory.includes('system')) {
      prefEnabled = prefs.system !== false;
    }

    if (!prefEnabled) {
      console.log(`[push-service] Skipped push for user ${userId} (preference disabled for ${category})`);
      return;
    }

    // 3. Retrieve push subscriptions for this user
    const subscriptions = await PushSubscription.find({ userId });
    if (subscriptions.length === 0) {
      return; // User has no registered push subscriptions
    }

    // 4. Send push to each subscription endpoint
    for (const sub of subscriptions) {
      // Create initial metric record (Sent)
      const metric = new NotificationMetric({
        notificationId: data.notificationId || null,
        userId: userId,
        endpoint: sub.endpoint,
        status: 'sent',
      });
      await metric.save();

      const payload = JSON.stringify({
        notification: {
          title,
          body,
          icon: '/logo.png',
          badge: '/icon-72.png',
          data: {
            ...data,
            category,
            metricId: metric._id.toString(),
          },
        },
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payload,
          {
            TTL: 86400, // Deliver within 24 hours if offline
          }
        );

        // Update metric on success (Delivered)
        metric.status = 'delivered';
        metric.deliveredAt = new Date();
        await metric.save();
      } catch (err) {
        console.error(`[push-service] Send failed for user ${userId} endpoint: ${sub.endpoint}`, err.message);
        
        // Update metric on failure
        metric.status = 'failed';
        metric.failureReason = err.message;
        await metric.save();

        // 410 (Gone) or 404 (Not Found) means subscription has expired or been revoked
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[push-service] Revoking stale/expired subscription: ${sub.endpoint}`);
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }
  } catch (err) {
    console.error(`[push-service] Error in sendPushNotification:`, err);
  }
}

/**
 * Log notification click metrics
 */
async function logClick(metricId) {
  try {
    const metric = await NotificationMetric.findById(metricId);
    if (metric) {
      metric.status = 'clicked';
      metric.clickedAt = new Date();
      await metric.save();
      return true;
    }
  } catch (err) {
    console.error('[push-service] Failed to log click metric:', err.message);
  }
  return false;
}

module.exports = {
  subscribeUser,
  unsubscribeUser,
  sendPushNotification,
  logClick,
  getVapidPublicKey: () => vapidPublicKey,
};
