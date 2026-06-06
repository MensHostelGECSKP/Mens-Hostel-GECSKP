const { z } = require('zod');

const monthSchema = z.coerce.number().int().min(1).max(12);
const yearSchema = z.coerce.number().int().min(2000).max(2100);

const publishMessBillFieldsSchema = z.object({
  month: monthSchema,
  year: yearSchema,
  dueDate: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), {
    message: 'Invalid due date',
  }),
});

function validatePublishMessBill(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error: 'Bill file is required',
      code: 'INVALID_FILE',
    });
  }

  const result = publishMessBillFieldsSchema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details,
    });
  }

  req.validated = result.data;
  next();
}

const paymentStatusSchema = z.object({
  isPaid: z.boolean(),
});

const { validate } = require('../utils/zodValidate');

module.exports = {
  validatePublishMessBill,
  validatePaymentStatus: validate(paymentStatusSchema),
};
