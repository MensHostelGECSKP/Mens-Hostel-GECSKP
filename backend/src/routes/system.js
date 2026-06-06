const express = require('express');
const rateLimit = require('express-rate-limit');
const { auth, adminOnly } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { uploadExcelSingle } = require('../middleware/uploadExcel');
const { validateYearEndReset } = require('../validators/systemValidator');
const {
  getYearEndResetStats,
  yearEndReset,
  getAuditLogs,
} = require('../controllers/systemController');
const {
  downloadTemplate,
  previewImport,
  executeImport,
} = require('../controllers/importController');

const router = express.Router();

const yearEndResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many reset attempts. Please try again later.',
});

router.get(
  '/year-end-reset/stats',
  auth,
  adminOnly,
  getYearEndResetStats
);

router.post(
  '/year-end-reset',
  yearEndResetLimiter,
  auth,
  adminOnly,
  csrfProtection,
  validateYearEndReset,
  yearEndReset
);

router.get(
  '/audit-logs',
  auth,
  adminOnly,
  getAuditLogs
);

// Bulk User Import routes
router.get(
  '/import/template',
  auth,
  adminOnly,
  downloadTemplate
);

router.post(
  '/import/preview',
  auth,
  adminOnly,
  uploadExcelSingle,
  previewImport
);

router.post(
  '/import/execute',
  auth,
  adminOnly,
  csrfProtection,
  executeImport
);

module.exports = router;
