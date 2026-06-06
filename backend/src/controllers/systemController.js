const yearEndResetService = require('../services/yearEndResetService');
const { ERROR_CODES } = require('../constants/errors');

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
    console.info('[year-end-reset] Completed by admin', {
      adminId: req.user?.userId,
      deleted: result.deleted,
    });
    res.json({
      message: 'Academic year reset complete',
      ...result,
    });
  } catch (err) {
    console.error('[year-end-reset] Failed:', {
      adminId: req.user?.userId,
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      error:
        'Unable to complete reset. Please try again or contact the administrator.',
      code: ERROR_CODES.RESET_FAILED,
    });
  }
}

module.exports = {
  getYearEndResetStats,
  yearEndReset,
};
