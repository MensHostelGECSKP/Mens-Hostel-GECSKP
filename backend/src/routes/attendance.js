const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const config = require('../config');
const {
  validateMarkAttendance,
  validateGetMonthAttendance,
  validateAdminSummary,
  validateMonthlyReportQuery,
  validateMonthlyReportBody,
} = require('../validators/attendanceValidator');
const rateLimit = require('express-rate-limit');
const {
  markAttendance,
  getMonthAttendance,
  getAdminSummary,
  generateMonthlyReport,
  generateMonthlyReportForDates,
} = require('../controllers/attendanceController');

const router = express.Router();

// Rate limiter for attendance marking
const attendanceLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.attendanceRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many attendance requests, please try again later',
});

// POST /api/attendance/mark
// Body: { date (YYYY-MM-DD), meals: { morning, noon, night } }
router.post('/mark', attendanceLimiter, auth, csrfProtection, validateMarkAttendance, markAttendance);

// GET /api/attendance/month?month=YYYY-MM
router.get('/month', auth, validateGetMonthAttendance, getMonthAttendance);

// GET /api/attendance/admin/summary?date=YYYY-MM-DD
router.get('/admin/summary', auth, adminOnly, validateAdminSummary, getAdminSummary);

// GET /api/attendance/admin/monthly-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/admin/monthly-report', auth, adminOnly, validateMonthlyReportQuery, generateMonthlyReport);

// POST /api/attendance/admin/monthly-report
router.post('/admin/monthly-report', auth, adminOnly, validateMonthlyReportBody, generateMonthlyReportForDates);

module.exports = router; 