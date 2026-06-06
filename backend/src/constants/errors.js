// Error message constants
const ERROR_MESSAGES = {
  // Authentication
  NO_TOKEN: 'No token provided, or invalid format.',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  INVALID_CREDENTIALS: 'Invalid credentials',
  NO_REFRESH_TOKEN: 'No refresh token provided',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  
  // Authorization
  ADMIN_REQUIRED: 'Admin access required',
  
  // Validation
  VALIDATION_ERROR: 'Validation error',
  INVALID_DATE: 'Invalid date',
  DEADLINE_PASSED: 'Deadline has passed',
  OUTSIDE_WINDOW: 'Date is outside the allowed window',
  
  // Data
  DUPLICATE_ENTRY: 'Duplicate entry',
  NOT_FOUND: 'Resource not found',
  USER_NOT_FOUND: 'User not found',
  ACCOUNT_INACTIVE: 'Account is inactive',
  
  // CSRF
  CSRF_ERROR: 'CSRF token validation failed',
  
  // CORS
  CORS_ERROR: 'CORS error: Not allowed by CORS',
  
  // Server
  INTERNAL_ERROR: 'Internal server error',
  EMAIL_SEND_FAILED: 'Password reset email could not be sent',
  RESET_FAILED: 'Year-end reset could not be completed',
};

// Error codes
const ERROR_CODES = {
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NO_REFRESH_TOKEN: 'NO_REFRESH_TOKEN',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_DATE: 'INVALID_DATE',
  DEADLINE_PASSED: 'DEADLINE_PASSED',
  OUTSIDE_WINDOW: 'OUTSIDE_WINDOW',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  CSRF_ERROR: 'CSRF_ERROR',
  CORS_ERROR: 'CORS_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  RESET_FAILED: 'RESET_FAILED',
};

module.exports = {
  ERROR_MESSAGES,
  ERROR_CODES,
};




