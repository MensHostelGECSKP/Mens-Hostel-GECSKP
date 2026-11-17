/**
 * Custom CSRF protection using HMAC-signed tokens with cookie fallback
 */
const crypto = require('crypto');
const config = require('../config');

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hmac(ts) {
  return crypto
    .createHmac('sha256', config.jwtSecret)
    .update(String(ts))
    .digest('hex');
}

// Generate an HMAC-signed CSRF token
function generateCsrfToken() {
  const ts = Date.now();
  return `${ts}.${hmac(ts)}`;
}

// Verify HMAC token validity and expiry
function verifyCsrfToken(token) {
  if (!token || typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;

  const ts = Number(token.slice(0, dot));
  if (!Number.isFinite(ts)) return false;

  const now = Date.now();
  // Reject if token is older than 24h or if from more than 1 min in future (clock skew guard)
  if (now - ts > TOKEN_TTL_MS || ts > now + 60000) return false;

  const expected = hmac(ts);
  const actual = token.slice(dot + 1);
  if (expected.length !== actual.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
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
  const tokenFromCookie = req.cookies && req.cookies['csrf-token'];

  // 1. Primary: Verify HMAC signature of header token
  // Works across Safari iOS, PWA, and browsers blocking cross-site/third-party cookies
  if (verifyCsrfToken(tokenFromHeader)) {
    return next();
  }

  // 2. Fallback: Classic double-submit cookie comparison if legacy random token
  if (tokenFromHeader && tokenFromCookie && tokenFromHeader === tokenFromCookie) {
    return next();
  }

  return res.status(403).json({ 
    error: 'CSRF token validation failed',
    code: 'CSRF_ERROR'
  });
}

// Middleware to set CSRF token cookie
function setCsrfToken(req, res, next) {
  const cookieToken = req.cookies && req.cookies['csrf-token'];
  // Reuse existing cookie if valid, otherwise generate fresh
  if (!cookieToken || !verifyCsrfToken(cookieToken)) {
    const token = generateCsrfToken();
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('csrf-token', token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: TOKEN_TTL_MS
    });
    req.csrfToken = token;
  } else {
    req.csrfToken = cookieToken;
  }
  next();
}

// Get CSRF token (for token endpoint)
function getCsrfToken(req, res) {
  const cookieToken = req.cookies && req.cookies['csrf-token'];
  if (cookieToken && verifyCsrfToken(cookieToken)) {
    return cookieToken;
  }
  
  const token = generateCsrfToken();
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: TOKEN_TTL_MS
  });
  
  return token;
}

module.exports = {
  csrfProtection,
  setCsrfToken,
  getCsrfToken,
  generateCsrfToken,
  verifyCsrfToken,
};
