const { z } = require('zod');

// URL validation
const urlSchema = z.string().url('Invalid URL format').min(1, 'URL is required');

// Create notification validation schema
const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  message: z.string().max(1000, 'Message is too long').optional(),
  pdfUrl: z.union([urlSchema, z.literal('')]).optional().transform((v) => (v ? v : undefined)),
  type: z.enum(['announcement', 'notice', 'other'], {
    errorMap: () => ({ message: 'Type must be "announcement", "notice", or "other"' }),
  }).optional(),
});

const { validate } = require('../utils/zodValidate');

module.exports = {
  validateCreateNotification: validate(createNotificationSchema),
};




