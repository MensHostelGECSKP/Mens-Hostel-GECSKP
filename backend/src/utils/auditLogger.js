const AuditLog = require('../models/AuditLog');

/**
 * Helper to log system or admin events to MongoDB & console.
 * @param {Object|null} reqOrUser - Express Request object (to extract user and IP), or a raw User object, or null.
 * @param {string} action - Event type description (e.g. USER_UPDATE, MESS_BILL_PUBLISH)
 * @param {Object} details - Additional structured data
 * @param {string|null} targetId - MongoDB ObjectId of the target entity
 */
async function logAuditEvent(reqOrUser, action, details = {}, targetId = null) {
  let performedBy = null;
  let performedByName = 'System';
  let ipAddress = null;

  if (reqOrUser) {
    if (reqOrUser.user) {
      // It's a request object containing user details
      performedBy = reqOrUser.user.userId || reqOrUser.user._id || null;
      performedByName = reqOrUser.user.name || 'Unknown User';
      ipAddress = reqOrUser.ip || reqOrUser.headers?.['x-forwarded-for'] || null;
      if (Array.isArray(ipAddress)) {
        ipAddress = ipAddress[0];
      }
      if (ipAddress && ipAddress.includes(',')) {
        ipAddress = ipAddress.split(',')[0].trim();
      }
    } else if (reqOrUser.userId || reqOrUser._id) {
      // It's a raw User object or payload
      performedBy = reqOrUser.userId || reqOrUser._id;
      performedByName = reqOrUser.name || 'Unknown User';
    }
  }

  try {
    const log = new AuditLog({
      action,
      performedBy,
      performedByName,
      targetId,
      details,
      ipAddress,
    });
    await log.save();
    console.info(`[AUDIT] [${action}] by ${performedByName}:`, JSON.stringify(details));
    return log;
  } catch (err) {
    console.error(`[AUDIT-ERROR] Failed to save audit log [${action}]:`, err.message);
  }
}

module.exports = { logAuditEvent };
