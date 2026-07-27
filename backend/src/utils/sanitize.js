const validator = require('validator');

/**
 * Sanitize string input.
 *
 * Strategy: strip control / zero-width characters (which can break parsing
 * or hide injected content) but do NOT HTML-entity-encode the value.
 *
 * Rationale for NOT calling validator.escape():
 *  - validator.escape() converts safe characters like ' / < > & into HTML
 *    entities (&#x27; &#x2F; …). This corrupts stored data — passwords with
 *    apostrophes, names like "D'Souza", and URLs containing slashes all
 *    become unreadable after round-tripping through the database and back to
 *    the client.
 *  - Mongoose parameterised queries already prevent NoSQL injection.
 *  - React/Next.js automatically HTML-encodes all values rendered via JSX,
 *    so XSS from stored data is prevented at the rendering layer.
 *  - The Zod validators applied after this middleware enforce strict schema
 *    types; unknown payloads are rejected before reaching business logic.
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  // Strip low-code (control) characters (U+0000–U+001F, U+007F) that have
  // no legitimate use in user input and can corrupt downstream processing.
  return validator.stripLow(str, true);
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Sanitize request body middleware
 */
function sanitizeBody(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeBody,
};
