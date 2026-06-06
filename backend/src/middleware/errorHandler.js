// Global error handler middleware
const config = require('../config');

/**
 * Standardized error response format
 */
function errorResponse(res, statusCode, error, code, details) {
  const response = {
    error: error || 'An error occurred',
  };
  
  if (code) {
    response.code = code;
  }
  
  if (details && config.nodeEnv === 'development') {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  // Handle custom error messages from services
  const errorCodeMap = {
    'INVALID_DATE': { status: 400, message: 'Invalid date' },
    'DEADLINE_PASSED': { status: 400, message: 'Deadline has passed' },
    'OUTSIDE_WINDOW': { status: 400, message: 'Date is outside the allowed window' },
    'DUPLICATE_ENTRY': { status: 409, message: 'Duplicate entry' },
    'DUPLICATE_BILL_MONTH': { status: 409, message: 'A bill for this month already exists' },
    'NOT_FOUND': { status: 404, message: 'Resource not found' },
    'INVALID_CREDENTIALS': { status: 400, message: 'Invalid credentials' },
    'INVALID_TOKEN': { status: 400, message: 'Token is invalid or has expired' },
    'EMAIL_NOT_CONFIGURED': { status: 503, message: 'Password reset email is not configured on the server' },
    'EMAIL_SEND_FAILED': { status: 503, message: 'Password reset email could not be sent' },
    'STORAGE_UPLOAD_FAILED': { status: 502, message: 'Failed to save mess bill file' },
    'STORAGE_UNAVAILABLE': { status: 503, message: 'File storage is temporarily unavailable' },
    'FILE_NOT_FOUND': { status: 404, message: 'Bill file not found in storage' },
    'INVALID_FILE': { status: 400, message: 'Invalid file type or missing file' },
  };

  if (errorCodeMap[err.message]) {
    const errorInfo = errorCodeMap[err.message];
    return errorResponse(res, errorInfo.status, errorInfo.message, err.message);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return errorResponse(res, 400, 'Validation error', 'VALIDATION_ERROR', err.details);
  }

  if (err.name === 'CastError' || err.name === 'MongoError') {
    return errorResponse(res, 400, 'Invalid data format', 'INVALID_DATA');
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid token', 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token expired', 'TOKEN_EXPIRED');
  }

  if (err.code === 11000) {
    // MongoDB duplicate key error
    return errorResponse(res, 409, 'Duplicate entry', 'DUPLICATE_ENTRY');
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return errorResponse(res, 403, 'CORS error: Not allowed by CORS', 'CORS_ERROR');
  }

  // CSRF errors
  if (err.code === 'CSRF_ERROR') {
    return errorResponse(res, 403, 'CSRF token validation failed', 'CSRF_ERROR');
  }

  // Default to 500 server error
  return errorResponse(
    res,
    500,
    'Internal server error',
    'INTERNAL_ERROR',
    config.nodeEnv === 'development' ? err.message : undefined
  );
}

module.exports = { errorHandler, errorResponse };

