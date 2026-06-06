const { z } = require('zod');
const { validate } = require('../utils/zodValidate');

// Date validation (YYYY-MM-DD format)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// Month validation (YYYY-MM format)
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format');

// Meals validation schema
const mealsSchema = z.object({
  morning: z.boolean(),
  noon: z.boolean(),
  night: z.boolean(),
});

// Mark attendance validation schema
const markAttendanceSchema = z.object({
  date: dateSchema,
  meals: mealsSchema,
});

// Get month attendance validation schema
const getMonthAttendanceSchema = z.object({
  month: monthSchema,
});

// Admin summary validation schema
const adminSummarySchema = z.object({
  date: dateSchema,
});

// Monthly report validation schema
const monthlyReportQuerySchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
});

const monthlyReportBodySchema = z.object({
  dates: z.array(dateSchema).min(1, 'At least one date is required'),
});

module.exports = {
  validateMarkAttendance: validate(markAttendanceSchema, 'body'),
  validateGetMonthAttendance: validate(getMonthAttendanceSchema, 'query'),
  validateAdminSummary: validate(adminSummarySchema, 'query'),
  validateMonthlyReportQuery: validate(monthlyReportQuerySchema, 'query'),
  validateMonthlyReportBody: validate(monthlyReportBodySchema, 'body'),
};
