const { z } = require('zod');
const { validate } = require('../utils/zodValidate');

const YEAR_END_RESET_PHRASE = 'RESET_DATABASE';

const yearEndResetSchema = z.object({
  confirmPhrase: z.literal(YEAR_END_RESET_PHRASE),
});

const validateYearEndReset = validate(yearEndResetSchema, 'body');

module.exports = {
  validateYearEndReset,
  YEAR_END_RESET_PHRASE,
};
