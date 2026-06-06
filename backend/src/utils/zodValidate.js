const { z } = require('zod');

/**
 * Format Zod v4 issues for API responses.
 */
function formatZodIssues(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Express middleware factory for Zod schemas.
 * @param {import('zod').ZodType} schema
 * @param {'body' | 'query'} source
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = source === 'query' ? req.query : req.body;
      req.validated = schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: formatZodIssues(error),
        });
      }
      next(error);
    }
  };
}

module.exports = { validate, formatZodIssues };
