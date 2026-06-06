const yearEndResetService = require('../services/yearEndResetService');
const { ERROR_CODES } = require('../constants/errors');
const { logAuditEvent } = require('../utils/auditLogger');
const AuditLog = require('../models/AuditLog');

async function getYearEndResetStats(req, res, next) {
  try {
    const stats = await yearEndResetService.getYearEndResetStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
}

async function yearEndReset(req, res, next) {
  try {
    const result = await yearEndResetService.performYearEndReset();
    await logAuditEvent(req, 'YEAR_END_RESET', { deleted: result.deleted });
    res.json({
      message: 'Academic year reset complete',
      ...result,
    });
  } catch (err) {
    await logAuditEvent(req, 'YEAR_END_RESET_FAILED', { error: err.message });
    return res.status(500).json({
      error:
        'Unable to complete reset. Please try again or contact the administrator.',
      code: ERROR_CODES.RESET_FAILED,
    });
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getYearEndResetStats,
  yearEndReset,
  getAuditLogs,
};
