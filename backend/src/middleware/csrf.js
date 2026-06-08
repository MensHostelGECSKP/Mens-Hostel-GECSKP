// Custom CSRF protection using Double Submit Cookie pattern
const crypto = require('crypto');

// Generate a random CSRF token
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF token middleware
function csrfProtection(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get token from header
  const tokenFromHeader = req.headers['x-csrf-token'];
  // Get token from cookie
  const tokenFromCookie = req.cookies['csrf-token'];

  // Validate tokens match
  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ 
      error: 'CSRF token validation failed',
      code: 'CSRF_ERROR'
    });
  }

  next();
}

// Middleware to set CSRF token cookie
function setCsrfToken(req, res, next) {
  // Only set if not already present
  if (!req.cookies['csrf-token']) {
    const token = generateCsrfToken();
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('csrf-token', token, {
      httpOnly: false, // Must be readable by JavaScript for Double Submit Cookie pattern
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    req.csrfToken = token;
  } else {
    req.csrfToken = req.cookies['csrf-token'];
  }
  next();
}

// Get CSRF token (for token endpoint)
function getCsrfToken(req, res) {
  const token = req.cookies['csrf-token'] || generateCsrfToken();
  
  // Set cookie if not already set
  if (!req.cookies['csrf-token']) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
  }
  
  return token;
}

module.exports = {
  csrfProtection,
  setCsrfToken,
  getCsrfToken
};




